import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../utils/UserContext';
import { useNavigate } from 'react-router-dom';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import './Home.css';


// 1. 부서 자산 현황 카드 (API연동)
function DepartmentAssetsCard() {
  const { user } = useContext(UserContext);
  const affiliationId = user?.affiliationId || localStorage.getItem('affiliationId');
  const [summary, setSummary] = useState(null);
  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';
  const navigate = useNavigate();


  useEffect(() => {
    if (!affiliationId) return;
    const fetchSummary = async () => {
      try {
        // [여기!] authFetchWithRefresh로 요청
        const res = await authFetchWithRefresh(`${API_BASE}/metrics/assets/${affiliationId}`);
        // 콘솔로 응답 확인
       // console.log('[부서 자산 현황] 응답 status:', res.status);
        const raw = await res.clone().text();
        //console.log('[부서 자산 현황] 응답 RAW:', raw);
        const result = await res.json();
        //console.log('[부서 자산 현황] 응답 JSON:', result);

        setSummary(result.data); // { totalAssets: 100, rentedAssets: 30, ... }
      } catch (e) {
        setSummary(null);
        //alert('부서 자산 현황 불러오기 실패');
        console.error('[부서 자산 현황] 오류:', e);
      }
    };
    fetchSummary();
  }, [affiliationId]);

  if (!summary) return (
    <div className="card clickable" tabIndex={0} role="button"
         onClick={() => navigate('/Search')}>
      <h3>부서 자산 현황</h3>
      <p>불러오는 중...</p>
    </div>
  );

  const { totalCount, rentedCount, rentableCount } = summary;

  const { totalAssets, rentedAssets, brokenAssets } = summary;
  const availableAssets = totalAssets - (rentedAssets ?? 0) - (brokenAssets ?? 0);

  return (
    <div
      className="card clickable"
      tabIndex={0}
      role="button"
      onClick={() => navigate('/Search')}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && navigate('/Search')}
    >
    <h3>부서 자산 현황</h3>
    <p>총 자산: <strong>{totalCount?.toLocaleString()}개</strong></p>
    <p>대여 중: <strong>{rentedCount?.toLocaleString()}개</strong></p>
    {/* <p>대여 가능: <strong>{rentableCount?.toLocaleString()}개</strong></p> */}
  </div>
  );
}


// 2. 실사 현황 카드 (API연동 예시)
function InspectionStatusCard({ setCompletionRate }) {
  const { user } = useContext(UserContext);
  const affiliationId = user?.affiliationId || localStorage.getItem('affiliationId');
  const [status, setStatus] = useState(null);
  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';
  const navigate = useNavigate();

  useEffect(() => {
    if (!affiliationId) return;
    const fetchStatus = async () => {
      try {
        const res = await authFetchWithRefresh(`${API_BASE}/metrics/stock-takings/${affiliationId}`);
        const result = await res.json();
        setStatus(result.data);

        // 완료율 계산 후 부모로 전달!
        const totalCount = result.data.totalCount ?? 0;
        const completeCount = result.data.completeCount ?? 0;
        const completionRate = totalCount > 0 ? (completeCount / totalCount) : 0;
        setCompletionRate(completionRate); // 0~1 실수로 내려줌
      } catch (e) {
        setStatus(null);
        setCompletionRate(0);
        //alert('실사 현황 불러오기 실패');
      }
    };
    fetchStatus();
  }, [affiliationId, setCompletionRate]);

  if (!status) return (
    <div className="card clickable" tabIndex={0} role="button"
         onClick={() => navigate('/audit/list')}>
      <h3>부서 실사 진행 현황</h3>
      <p>불러오는 중...</p>
    </div>
  );
   // 여기서 직접 계산!
   const totalCount = status.totalCount ?? 0;
   const completeCount = status.completeCount ?? 0;
   const incompleteCount = totalCount - completeCount;
   const completionRate = totalCount > 0 ? ((completeCount / totalCount) * 100).toFixed(1) : '0.0';
 

  // 예시: 실제 API 응답 필드명 맞게 변경


  return (
    <div
    className="card clickable"
    tabIndex={0}
    role="button"
    onClick={() => navigate('/audit/list')}
    onKeyDown={e => (e.key === "Enter" || e.key === " ") && navigate('/audit/list')}
  >
      <h3>부서 실사 진행 현황</h3>
      <p>실사 대상: <strong>{totalCount.toLocaleString()}개</strong></p>
      <p>완료된 실사: <strong>{completeCount.toLocaleString()}개</strong></p>
      <p>미완료 실사: <strong>{incompleteCount.toLocaleString()}개</strong></p>
      <div className="progress-bar">
        <div className="progress-filled" style={{ width: `${completionRate}%` }} />
      </div>
      <p>완료율: <strong>{completionRate}%</strong></p>
    </div>
  );
}
















// 2. 자산 카테고리별 분포 파이 차트
const CategoryPie = () => {
  const data = [
    { name: 'IT 장비', value: 800 },
    { name: '가구', value: 400 },
    { name: '사무용품', value: 300 },
    { name: '설비', value: 200 },
    { name: '기타', value: 100 },
  ];
  const COLORS = ['#FFD54F', '#FFB300', '#FFC107', '#FFE082', '#FFECB3'];

  return (
    <div className="chart-card">
      <h4 className="chart-title">자산 카테고리별 분포</h4>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={80}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
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
      <h4 className="chart-title">월별 대여·반납 추이</h4>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="top" height={32} />
          <Bar dataKey="borrow" name="대여 건수" fill="#FFB300" />
          <Bar dataKey="return" name="반납 건수" fill="#FFB300" opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. 실사 완료율 도넛 차트
// 4. 실사 완료율 도넛 차트 (실제 완료율로 표시)
const AuditGauge = ({ completionRate }) => {
  // undefined 방지, 0~1로 보장
  const gaugeRate = typeof completionRate === "number" ? completionRate : 0;
  const data = [
    { name: '완료', value: gaugeRate },
    { name: '미완료', value: 1 - gaugeRate },
  ];
  const COLORS = ['#FFB300', '#e0e0e0'];

  return (
    <div className="chart-card">
      <h4 className="chart-title">실사 완료율</h4>
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
            label={({ percent, name }) =>
              name === '완료' ? `${(percent * 100).toFixed(1)}%` : ''
            }
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', marginTop: '-30px', fontWeight: 'bold', fontSize: 22 }}>
        {(gaugeRate * 100).toFixed(1)}%
      </div>
    </div>
  );
};




// 5. Home 컴포넌트
const Home = () => {
  const navigate = useNavigate();

  // 실사 완료율 상태 추가
  const [completionRate, setCompletionRate] = useState(0);

  return (
    <div className="home-content">
      <header className="home-header">
        <h1>🏠  Home</h1>
      </header>
      <section className="dashboard-cards">
        <DepartmentAssetsCard />
        {/* completionRate setter를 InspectionStatusCard에 prop으로 넘김 */}
        <InspectionStatusCard setCompletionRate={setCompletionRate} />
      </section>
      <section className="charts-section">
        <div className="charts-container">
          {/* <CategoryPie />
          <BorrowReturnBar /> */}
          {/* completionRate를 prop으로 넘김 */}
          <AuditGauge completionRate={completionRate} />
        </div>
      </section>
    </div>
  );
};


export default Home;
