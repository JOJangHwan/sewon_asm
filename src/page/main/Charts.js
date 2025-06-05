// File: src/components/page/main/Charts.jsx
import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

// ===== 1. 자산 카테고리별 분포 파이 차트 =====
const CategoryPie = () => {
  // 더미 데이터 (실제 API에서 받아올 데이터로 교체)
  const data = [
    { name: 'IT 장비', value: 800 },
    { name: '가구',    value: 400 },
    { name: '사무용품', value: 300 },
    { name: '설비',    value: 200 },
    { name: '기타',    value: 100 },
  ];

  // 파이차트 색상 (노랑 계열로 조정)
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
            fill="#8884d8"
            label={(entry) => `${entry.name}: ${(entry.value / 1800 * 100).toFixed(1)}%`}
            labelLine={false}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ===== 2. 월별 대여·반납 추이 막대 차트 =====
const BorrowReturnBar = () => {
  // 더미 데이터 (실제 API에서 받아올 데이터로 교체)
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
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
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

// ===== 3. 실사 완료율 게이지(도넛) 차트 =====
const AuditGauge = () => {
  // 더미 완료율 (실제 API에서 받아올 숫자/비율로 교체)
  const completionRate = 0.77; // 77% 완료
  const data = [
    { name: '완료', value: completionRate },
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
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export { CategoryPie, BorrowReturnBar, AuditGauge };
