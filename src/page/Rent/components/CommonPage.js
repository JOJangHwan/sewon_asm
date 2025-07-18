import React, { useState } from 'react';
import AssetRentListPage from '../../Rent/AssetRent';
import AssetReturnListPage from '../../Rent/AssetReturn';
//import '../AssetForm.css';

export default function CommonPage() {
  const [mode, setMode] = useState('rent'); // 'rent' 또는 'return'

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',   // ✅ h2는 왼쪽, radio는 오른쪽
    marginBottom: '20px',
  };

  const h2Style = {
    margin: 0,
    fontSize: '20px',
    whiteSpace: 'nowrap',
  };

  const radioGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const labelStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div className="page-container">
      <div style={headerStyle}>
        <h2 style={h2Style}>부서 자산 {mode === 'rent' ? '대여' : '반납'} 관리</h2>

        <div style={radioGroupStyle}>
          <label style={labelStyle}>
            <input
              type="radio"
              name="mode"
              value="rent"
              checked={mode === 'rent'}
              onChange={() => setMode('rent')}
            />
            대여
          </label>

          <label style={labelStyle}>
            <input
              type="radio"
              name="mode"
              value="return"
              checked={mode === 'return'}
              onChange={() => setMode('return')}
            />
            반납
          </label>
        </div>
      </div>

      {mode === 'rent' ? <AssetRentListPage /> : <AssetReturnListPage />}
    </div>
  );
}
