import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRef, useEffect } from 'react';
import barcodeIcon from '../../assets/img/scan.png';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import './DisposalRegister.css';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';


const DisposalRegister = () => {
  const token = localStorage.getItem('accessToken');

  const [barcodeList, setBarcodeList] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;
  const pageGroupSize = 5;

  const totalPages = Math.max(1, Math.ceil(barcodeList.length / pageSize));
  const currentGroup = Math.ceil(currentPage / pageGroupSize);
  const groupStart = (currentGroup - 1) * pageGroupSize + 1;
  const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);

  const totalCount = barcodeList.length;
const successCount = barcodeList.filter(item => item.status === 'SUCCESS').length;
const failCount = barcodeList.filter(item => item.status === 'FAIL').length;


  const handleAddBarcode = () => {
    const trimmed = barcodeInput.trim();
    if (!trimmed) return;
    if (barcodeList.some(item => item.barcode === trimmed)) return;
    setBarcodeList([...barcodeList, { barcode: trimmed, checked: false }]);
    setBarcodeInput('');
  };

  const handleEnter = (e) => {
    if (e.key === 'Enter') handleAddBarcode();
  };

  const handleToggleItem = (index) => {
    const newList = [...barcodeList];
    newList[index].checked = !newList[index].checked;
    setBarcodeList(newList);
  };

  const handleToggleAll = (e) => {
    const newList = barcodeList.map(item => ({ ...item, checked: e.target.checked }));
    setBarcodeList(newList);
  };

  const handleRemove = (index) => {
    const newList = [...barcodeList];
    newList.splice(index, 1);
    setBarcodeList(newList);
    if ((currentPage - 1) * pageSize >= newList.length && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRemoveSelected = () => {
    const newList = barcodeList.filter(item => !item.checked);
    setBarcodeList(newList);
    if ((currentPage - 1) * pageSize >= newList.length && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubmitDisposal = async () => {
    const selected = barcodeList.filter(item => item.checked);
    if (selected.length === 0) return alert('폐기할 항목을 선택하세요.');
  
    const payload = {
      barcodes: selected.map(item => item.barcode),
    };
  
    console.log('📤 [전송 데이터]', `${API_BASE}/assets/dispose`, payload);
  
    try {
      const response = await authFetchWithRefresh(`${API_BASE}/assets/dispose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const rawText = await response.clone().text();
      console.log('📥 [응답 RAW TEXT]', rawText);
  
      const result = await response.json();
      console.log('📥 [응답 JSON]', result);
  
      if (!response.ok) {
        const serverMessage = result.message || '알 수 없는 오류';
        throw new Error(serverMessage);
      }
  
      const successList = result.data || [];
  
      // ✅ 상태 업데이트
      const updatedList = barcodeList.map(item => {
        if (item.checked) {
          return {
            ...item,
            status: successList.includes(item.barcode) ? 'SUCCESS' : 'FAIL'
          };
        }
        return item;
      });
  
      setBarcodeList(updatedList);
      alert('폐기 요청 결과를 확인하세요.');
  
    } catch (err) {
      console.error('🚨 폐기 요청 오류:', err);
      alert(`🚨 오류: ${err.message}`);
    }
  };
  
  
  

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };



  const start = (currentPage - 1) * pageSize;
  const currentItems = barcodeList.slice(start, start + pageSize);

   const [scannerVisible, setScannerVisible] = useState(false);
   const [scannerInstance, setScannerInstance] = useState(null);
   const scannerRef = useRef(null);
    const onScanSuccess = (decodedText) => {
       const barcode = decodedText.trim();
       if (!barcodeList.some(item => item.barcode === barcode)) {
         setBarcodeList(prev => [...prev, { barcode, checked: false }]);
       } else {
         alert('이미 등록된 바코드입니다.');
       }
        if (scannerInstance) {
           scannerInstance.clear()
             .then(() => {
               console.log('✅ 스캐너 종료됨');
               setScannerInstance(null);
               setScannerVisible(false);
               scannerRef.current = null;
             })
             .catch(err => console.error('❌ 스캐너 종료 오류', err));
         }
     };
    
     const onScanFailure = () => {
       // 실패 시 무동작 또는 로그 가능
     };
      useEffect(() => {
         if (scannerVisible && !scannerRef.current) {
           const scanner = new Html5QrcodeScanner(
             'disposal-reader',
             { fps: 10, qrbox: { width: 250, height: 250 } },
             false
           );
           scanner.render(onScanSuccess, onScanFailure);
           setScannerInstance(scanner);
           scannerRef.current = true;
         }
         return () => {
           if (scannerInstance) {
             scannerInstance.clear().catch(e => console.warn('scanner clear error', e));
             scannerRef.current = null;
             setScannerInstance(null);
           }
         };
       }, [scannerVisible]);

       const handleQRScanClick = () => {
           setScannerVisible(true);
         };

         const handleReset = () => {
          if (window.confirm('정말 초기화하시겠습니까?')) {
            setBarcodeList([]);
            setCurrentPage(1);
          }
        };
        



  return (
    <div className="disposal-container">
      <h2 className="disposal-title">자산 폐기 등록</h2>
      <div>
       <div className="disposal-input-row">
 {/* <img
   src={barcodeIcon}
   alt="QR 스캔"
   className="disposal-qr-img"
   onClick={handleQRScanClick}   // 실물 스캔 함수 연결
 /> */}
   <input
     type="text"
     value={barcodeInput}
     onChange={(e) => setBarcodeInput(e.target.value)}
     onKeyPress={handleEnter}
     placeholder="바코드 입력"
     className="disposal-input"
   />
   <button className="disposal-btn disposal-btn-add" onClick={handleAddBarcode}>추가</button>
 </div>
      </div>
      {scannerVisible && (
   <div id="disposal-reader" className="qr-reader" style={{ marginTop: '20px' }}></div>
 )}
<div className="status-summary">
  <p style={{ color: '#000' }}>
    ✅ <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>초록색</span>은 성공,
    ❌ <span style={{ color: '#f44336', fontWeight: 'bold' }}>빨간색</span>은 실패입니다.
  </p>

   <p style={{ color: '#000' }}>
   총 등록: {totalCount}개 | 
   <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>성공: {successCount}개</span> | 
   <span style={{ color: '#f44336', fontWeight: 'bold' }}>실패: {failCount}개</span>
 </p>
</div>

      <table className="disposal-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleToggleAll} checked={barcodeList.length > 0 && barcodeList.every(item => item.checked)} /></th>
            <th>바코드</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
  {currentItems.map((item, index) => (
    <tr
      key={index}
      className={
        item.status === 'SUCCESS' ? 'row-success' :
        item.status === 'FAIL' ? 'row-fail' : ''
      }
    >
      <td><input type="checkbox" checked={item.checked} onChange={() => handleToggleItem(start + index)} /></td>
      <td>{item.barcode}</td>
      <td><button className="disposal-btn disposal-btn-delete" onClick={() => handleRemove(start + index)}>X</button></td>
    </tr>
  ))}
</tbody>
      </table>


      <div className="disposal-pagination">
        <button className="disposal-page-btn" onClick={() => changePage(1)} disabled={currentPage === 1}>처음</button>
        <button className="disposal-page-btn" onClick={() => changePage(Math.max(1, groupStart - 1))} disabled={groupStart === 1}>이전</button>
        {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => (
          <button
            key={i}
            className={`disposal-page-btn ${currentPage === groupStart + i ? 'active' : ''}`}
            onClick={() => changePage(groupStart + i)}
          >
            {groupStart + i}
          </button>
        ))}
        <button className="disposal-page-btn" onClick={() => changePage(Math.min(totalPages, groupEnd + 1))} disabled={groupEnd === totalPages}>다음</button>
        <button className="disposal-page-btn" onClick={() => changePage(totalPages)} disabled={currentPage === totalPages}>끝</button>
      </div>

      <div className="disposal-button-group">
        <button className="disposal-btn disposal-btn-submit" onClick={handleSubmitDisposal}>선택 폐기</button>
        <button className="disposal-btn disposal-btn-remove" onClick={handleRemoveSelected}>선택 삭제</button>
        <button className="disposal-btn disposal-btn-reset" onClick={handleReset}>초기화</button>
      </div>
    </div>
    
  );
};

export default DisposalRegister;
