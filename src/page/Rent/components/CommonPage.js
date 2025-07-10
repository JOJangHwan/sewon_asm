// ✅ 공통화면: 대여/반납 리스트 통합 라우팅 페이지
import React, { useState } from 'react';
import AssetRentListPage from '../../Rent/AssetRent';
import AssetReturnListPage from '../../Rent/AssetReturn';
//import '../Rent/AssetForm.css';

export default function CommonPage() {
  const [mode, setMode] = useState('rent'); // 'rent' 또는 'return'

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>부서 자산 {mode === 'rent' ? '대여' : '반납'} 관리</h2>
        <div className="row" style={{ gap: '20px' }}>
          <label>
            <input
              type="radio"
              name="mode"
              value="rent"
              checked={mode === 'rent'}
              onChange={() => setMode('rent')}
            />{' '}
            대여
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="return"
              checked={mode === 'return'}
              onChange={() => setMode('return')}
            />{' '}
            반납
          </label>
        </div>
      </div>

      {/* 선택된 리스트 보여주기 */}
      {mode === 'rent' ? <AssetRentListPage /> : <AssetReturnListPage />}
    </div>
  );
}
