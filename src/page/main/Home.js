import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../utils/UserContext';
import { useNavigate } from 'react-router-dom';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import './Home.css';

/** 모든 요청에 언어 헤더 자동 부착 */
const withLang = (opts = {}) => {
  const ui = getUILang();           // 'KR' | 'CN' | 'VN'
  const lng = uiToI18n(ui);         // 'ko' | 'zh' | 'vi'
  return {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'X-Client-Lang': lng,
      'X-Client-Lang-UI': ui,
    },
  };
};

// 1. 부서 자산 현황 카드 (API연동)
function DepartmentAssetsCard() {
  const { t } = useTranslation('home');
  const { user } = useContext(UserContext);
  const affiliationId = user?.affiliationId || localStorage.getItem('affiliationId');
  const [summary, setSummary] = useState(null);
  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';
  const navigate = useNavigate();

  useEffect(() => {
    if (!affiliationId) return;
    const fetchSummary = async () => {
      try {
        const res = await authFetchWithRefresh(`${API_BASE}/metrics/assets/${affiliationId}`, withLang());
        const result = await res.json();
        setSummary(result.data); // { totalCount, rentedCount, rentableCount }
      } catch (e) {
        setSummary(null);
        console.error('[부서 자산 현황] 오류:', e);
      }
    };
    fetchSummary();
  }, [affiliationId]);

  if (!summary) {
    return (
      <div className="card clickable" tabIndex={0} role="button" onClick={() => navigate('/Search')}>
        <h3>{t('Home_DepartmentAssetOverview')}</h3>
        <p>{t('Home_Loading')}</p>
      </div>
    );
  }

  const { totalCount, rentedCount /*, rentableCount*/ } = summary;

  return (
    <div
      className="card clickable"
      tabIndex={0}
      role="button"
      onClick={() => navigate('/Search')}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate('/Search')}
    >
      <h3>{t('Home_DepartmentAssetOverview')}</h3>
      <p>
        {t('Home_TotalAssets')}: <strong>{totalCount?.toLocaleString()}{t('Home_Unit_Count')}</strong>
      </p>
      <p>
        {t('Home_OnLoan')}: <strong>{rentedCount?.toLocaleString()}{t('Home_Unit_Count')}</strong>
      </p>
      {/* <p>{t('Home_Available')}: <strong>{rentableCount?.toLocaleString()}{t('Home_Unit_Count')}</strong></p> */}
    </div>
  );
}

// 2. 실사 현황 카드 (API연동)
function InspectionStatusCard({ setCompletionRate }) {
  const { t } = useTranslation('home');
  const { user } = useContext(UserContext);
  const affiliationId = user?.affiliationId || localStorage.getItem('affiliationId');
  const [status, setStatus] = useState(null);
  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';
  const navigate = useNavigate();

  useEffect(() => {
    if (!affiliationId) return;
    const fetchStatus = async () => {
      try {
        const res = await authFetchWithRefresh(`${API_BASE}/metrics/stock-takings/${affiliationId}`, withLang());
        const result = await res.json();
        setStatus(result.data);

        const totalCount = result.data.totalCount ?? 0;
        const completeCount = result.data.completeCount ?? 0;
        const completionRate = totalCount > 0 ? (completeCount / totalCount) : 0;
        setCompletionRate(completionRate);
      } catch (e) {
        setStatus(null);
        setCompletionRate(0);
      }
    };
    fetchStatus();
  }, [affiliationId, setCompletionRate]);

  if (!status) {
    return (
      <div className="card clickable" tabIndex={0} role="button" onClick={() => navigate('/audit/list')}>
        <h3>{t('Home_DepartmentAuditProgress')}</h3>
        <p>{t('Home_Loading')}</p>
      </div>
    );
  }

  const totalCount = status.totalCount ?? 0;
  const completeCount = status.completeCount ?? 0;
  const incompleteCount = totalCount - completeCount;
  const completionRate = totalCount > 0 ? ((completeCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div
      className="card clickable"
      tabIndex={0}
      role="button"
      onClick={() => navigate('/audit/list')}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate('/audit/list')}
    >
      <h3>{t('Home_DepartmentAuditProgress')}</h3>
      <p>{t('Home_AuditTargetLabel')} <strong>{totalCount.toLocaleString()}{t('Home_Unit_Count')}</strong></p>
      <p>{t('Home_AuditCompleted')}: <strong>{completeCount.toLocaleString()}{t('Home_Unit_Count')}</strong></p>
      <p>{t('Home_AuditIncomplete')}: <strong>{incompleteCount.toLocaleString()}{t('Home_Unit_Count')}</strong></p>
      <div className="progress-bar">
        <div className="progress-filled" style={{ width: `${completionRate}%` }} />
      </div>
      <p>{t('Home_CompletionRate')}: <strong>{completionRate}%</strong></p>
    </div>
  );
}

// 2. 자산 카테고리별 분포 파이 차트
const CategoryPie = () => {
  const { t } = useTranslation('home');
  const data = [
    { name: t('Home_ITEquipment'), value: 800 },
    { name: t('Home_Furniture'), value: 400 },
    { name: t('Home_OfficeSupplies'), value: 300 },
    { name: t('Home_Facilities'), value: 200 },
    { name: t('Home_Others'), value: 100 },
  ];
  const COLORS = ['#FFD54F', '#FFB300', '#FFC107', '#FFE082', '#FFECB3'];

  return (
    <div className="chart-card">
      <h4 className="chart-title">{t('Home_AssetCategoryDistribution')}</h4>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={80}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. 월별 대여·반납 추이 차트
const BorrowReturnBar = () => {
  const { t } = useTranslation('home');
  const data = [
    { month: '2025-01', borrow: 50, return: 45 },
    { month: '2025-02', borrow: 65, return: 60 },
    { month: '2025-03', borrow: 70, return: 65 },
    { month: '2025-04', borrow: 60, return: 55 },
    { month: '2025-05', borrow: 80, return: 70 },
    { month: '2025-06', borrow: 75, return: 68 },
  ];
  return (
    <div className="chart-card">
      <h4 className="chart-title">{t('Home_MonthlyLoanReturnTrend')}</h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="top" height={32} />
          <Bar dataKey="borrow" name={t('Home_LoanCount')} fill="#FFB300" />
          <Bar dataKey="return" name={t('Home_ReturnCount')} fill="#FFB300" opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. 실사 완료율 도넛 차트 (실제 완료율로 표시)
const AuditGauge = ({ completionRate }) => {
  const { t } = useTranslation('home');
  const gaugeRate = typeof completionRate === 'number' ? completionRate : 0;
  const data = [
    { name: t('Home_Completed'), value: gaugeRate },
    { name: t('Home_Incomplete'), value: 1 - gaugeRate },
  ];
  const COLORS = ['#FFB300', '#e0e0e0'];

  return (
    <div className="chart-card audit-gauge">
      <h4 className="chart-title">{t('Home_AuditCompletionRate')}</h4>
      <div className="gauge-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
              labelLine={false}
            >
              {data.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="gauge-center-text">
          {(gaugeRate * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

// 5. Home 컴포넌트
const Home = () => {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const [completionRate, setCompletionRate] = useState(0);

  return (
    <div className="home-content">
      <header className="home-header">
        <h1>🏠 {t('Home_Title')}</h1>
      </header>
      <section className="dashboard-cards">
        <DepartmentAssetsCard />
        <InspectionStatusCard setCompletionRate={setCompletionRate} />
      </section>
      <section className="charts-section">
        <div className="charts-container">
          {/* 필요 시 다른 차트 활성화 */}
          {/* <CategoryPie />
          <BorrowReturnBar /> */}
          <AuditGauge completionRate={completionRate} />
        </div>
      </section>
    </div>
  );
};

export default Home;
