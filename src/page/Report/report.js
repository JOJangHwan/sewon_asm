import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './report.css';

const assetStatusData = [
  { name: '사용 중', value: 170 },
  { name: '미 사용', value: 20 },
  { name: '대여 중', value: 30 },
  { name: '반납 신청', value: 10 },
];

const assetMonthlyData = [
  { month: '1월', count: 23 },
  { month: '2월', count: 20 },
  { month: '3월', count: 17 },
  { month: '4월', count: 31 },
  { month: '5월', count: 25 },
  { month: '6월', count: 30 },
  { month: '7월', count: 20 },
  { month: '8월', count: 10 },
  { month: '9월', count: 15 },
  { month: '10월', count: 20 },
  { month: '11월', count: 27 },
  { month: '12월', count: 18 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function UserAssetReportPage() {
  return (
    <div className="report-container">
      <h2 className="report-title">📊 자산 요약 보고서</h2>

      {/* 요약 카드 영역 */}
      <div className="card-grid">
        <SummaryCard title="총 보유 자산" value="180개" />
        <SummaryCard title="대여 중 자산" value="10개" />
        <SummaryCard title="반납 신청" value="5개" />
        <SummaryCard title="최근 등록" value="10개" />
      </div>

      {/* 차트 영역 */}
      <div className="chart-grid">
        <div className="chart-box">
          <h3 className="chart-title">자산 상태 분포</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={assetStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {assetStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3 className="chart-title">월별 취득 자산 수</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assetMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}