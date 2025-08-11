import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import './Scan.css';

const API_BASE_URL = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

const ScanPage = () => {
  const navigate = useNavigate();
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleSearch = async () => {
    if (!barcodeInput.trim()) {
      alert('바코드를 입력해주세요.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcodeInput.trim())}`;
      const res = await authFetchWithRefresh(url, { method: 'GET' });
      const resJson = await res.json();

     // console.log('✅ 서버 응답 (resJson):', resJson);

      if (resJson.code !== 1 || !resJson.data) {
        alert('❌ 해당 바코드를 찾을 수 없습니다.');
        return;
      }

    //  console.log('✅ 조회된 자산 데이터:', resJson.data);

      // 단품 데이터 페이지로 이동
      navigate('/asset', { state: resJson.data });

    } catch (err) {
      console.error('바코드 조회 오류:', err);
      alert('🚨 서버와의 연결에 실패했습니다.');
    }
  };

  return (
    <div className="scan-container">
      <h3>바코드 조회</h3>
      <input
        type="text"
        className="scan-input"
        placeholder="바코드를 입력하세요"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch();
        }}
      />
      <button className="scan-button" onClick={handleSearch}>
        조회하기
      </button>
      
    </div>
  );
};

export default ScanPage;
