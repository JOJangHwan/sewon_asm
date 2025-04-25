// ✅ ScanPage.js
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

const ScanPage = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }
  }, []);

  const onScanSuccess = (decodedText) => {
    try {
      const assetData = JSON.parse(decodedText);
      scannerRef.current.clear().then(() => {
        navigate('/asset', { state: assetData });
      });
    } catch (err) {
      alert("QR 코드 형식이 잘못되었습니다.");
    }
  };

  const onScanFailure = (error) => {
    // 실패 무시 (계속 시도)
  };

  return (
    <div>
      <h3>QR 코드 스캔</h3>
      <div id="reader" style={{ width: '300px' }}></div>
    </div>
  );
};

export default ScanPage;
