// import React from 'react';
// import styles from './Home.css';

// const MainPage = () => {
//   return (
//     <div>
//       <h2>🏠 Main Page</h2>
//       <p>여기에 자산 관리 관련 콘텐츠를 넣으세요.</p>
//     </div>
//   );
// };

// export default MainPage;

// File: src/components/page/main/Home.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import './Home.css'; // 기존에 작성된 home.css 그대로 사용

/* ===========================================
   1. Recharts 기반 차트 컴포넌트들 (이 파일 안에 정의)
   =========================================== */

/** 1-1. 자산 카테고리별 분포 파이 차트 */
const CategoryPie = () => {
  const data = [
    { name: 'IT 장비', value: 800 },
    { name: '가구',     value: 400 },
    { name: '사무용품', value: 300 },
    { name: '설비',     value: 200 },
    { name: '기타',     value: 100 },
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

/** 1-2. 월별 대여·반납 추이 막대 차트 */
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

/** 1-3. 실사 완료율 게이지(도넛) 차트 */
const AuditGauge = () => {
  const completionRate = 0.77; // 예시: 77%
  const data = [
    { name: '완료',   value: completionRate },
    { name: '미완료', value: 1 - completionRate },
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
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
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

/* ===========================================
   2. Home 컴포넌트 (로그 활동 및 차트 포함)
   =========================================== */
const Home = () => {

  const navigate = useNavigate(); 
  // ====== DashboardCards용 더미 데이터 ======
  const totalAssets = 1500;
  const rentedAssets = 320;
  const brokenAssets = 50;
  const availableAssets = totalAssets - rentedAssets - brokenAssets;

  const auditTotal = 800;
  const auditCompleted = 620;
  const auditIncomplete = auditTotal - auditCompleted;
  const auditCompletionRate = Math.floor((auditCompleted / auditTotal) * 100);

  // ====== ActivityLog용 더미 로그 ======
  const dummyLogs = [
    { time: '2025-06-04 14:23', user: '홍길동', action: '노트북-200RSFFL001 대여 승인' },
    { time: '2025-06-03 09:45', user: '김영희', action: '프린터-300PRN003 반납 신청' },
    { time: '2025-06-02 16:10', user: '박민수', action: '서버실 자산 실사 시작' },
    { time: '2025-06-01 11:05', user: '이수진', action: '모니터-500MON007 정보 수정' },
  ];

  return (
    <div className="home-content">
      {/* ====== 헤더 타이틀 ====== */}
      <header className="home-header">
        <h1>🏠  Home</h1>
        {/* <p className="home-subtext">여기에 자산 관리 관련 콘텐츠를 넣으세요.</p> */}
      </header>

      {/* ====== 요약 대시보드 카드 ====== */}
      <section className="dashboard-cards">
        {/* 카드 1: 전체 자산 현황 */}
        <div className="card" onClick={() => navigate('/profile')}>
          <h3>부서 자산 현황</h3>
          <p>총 자산: <strong>{totalAssets.toLocaleString()}개</strong></p>
          <p>대여 중: <strong>{rentedAssets.toLocaleString()}개</strong></p>
          <p>대여 가능: <strong>{availableAssets.toLocaleString()}개</strong></p>
          <p>고장/수리 중: <strong>{brokenAssets.toLocaleString()}개</strong></p>
        </div>

        {/* 카드 2: 실사 진행 현황 */}
        <div className="card" onClick={() => navigate('/audit/list')}>
          <h3>실사 진행 현황</h3>
          <p>실사 대상: <strong>{auditTotal.toLocaleString()}개</strong></p>
          <p>완료된 실사: <strong>{auditCompleted.toLocaleString()}개</strong></p>
          <p>미완료 실사: <strong>{auditIncomplete.toLocaleString()}개</strong></p>
          <div className="progress-bar">
            <div
              className="progress-filled"
              style={{ width: `${auditCompletionRate}%` }}
            />
          </div>
          <p>완료율: <strong>{auditCompletionRate}%</strong></p>
        </div>

        {/* 카드 3: 최근 대여·반납 통계 */}
        <div className="card" onClick={() => navigate('/rent')}>
          <h3>최근 대여·반납 통계</h3>
          <p>지난 7일 대여 건수: <strong>45건</strong></p>
          <p>지난 7일 반납 건수: <strong>38건</strong></p>
          <p>연체 발생: <strong>2건</strong></p>
        </div>

        {/* 카드 4: 공지사항 / 알림 */}
        <div className="card" onClick={() => alert('공지사항/알림 페이지로 이동')}>
          <h3>공지사항 / 알림</h3>
          <p>미확인 알림: <strong>3개</strong></p>
          <ul className="notice-list">
            <li>홍길동님 노트북 대여 요청</li>
            <li>김영희님 프린터 반납 승인</li>
            <li>시스템 점검 예정 (6/10)</li>
          </ul>
        </div>
      </section>

      {/* ====== 최근 활동 로그 ====== */}
      <section className="activity-log">
        <h3>최근 활동 로그</h3>
        <table className="log-table">
          <thead>
            <tr>
              <th>시간</th>
              <th>사용자</th>
              <th>이벤트</th>
            </tr>
          </thead>
          <tbody>
            {dummyLogs.map((log, idx) => (
              <tr key={idx}>
                <td>{log.time}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn-more"
          onClick={() => alert('더보기 클릭 시 상세 로그 페이지로 이동')}
        >
          더보기
        </button>
      </section>

      {/* ====== 시각화 차트 섹션 ====== */}
      <section className="charts-section">
        <div className="charts-container">
          <CategoryPie />
          <BorrowReturnBar />
          <AuditGauge />
        </div>
      </section>
    </div>
  );
};

export default Home;
