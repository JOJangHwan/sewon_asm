
import { Html5QrcodeScanner } from 'html5-qrcode';
import barcodeIcon from '../../assets/img/scan.png';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { useTranslation } from 'react-i18next';
import './DisposalRegister.css';
import React, { useState, useRef, useEffect } from 'react';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';


const DisposalRegister = () => {
  const token = localStorage.getItem('accessToken');
  const { t } = useTranslation('disposalRegister');
  const nCount = (n) => `${n}${t('DisposalRegister_Count')}`;
  const effectiveMode = useResponsiveMode(); // 'web' | 'pda'

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
    if (selected.length === 0) return alert(t('DisposalRegister_PleaseSelectItemsToDispose'));
  
    const payload = {
      barcodes: selected.map(item => item.barcode),
    };
  
   // console.log('📤 [전송 데이터]', `${API_BASE}/assets/dispose`, payload);

       // ➕ 요청 로그: 어떤 데이터를, 어디로, 어떤 옵션으로 보내는지
    const url = `${API_BASE}/assets/dispose`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    console.groupCollapsed('%c[Disposal][REQUEST]', 'color:#0aa;font-weight:600;');
    console.log('URL:', url);
    console.log('Payload (object):', payload);
    console.log('Options:', { ...options, body: '(JSON string below)' });
    console.log('Body (JSON):', options.body);
    console.groupEnd();
  
    try {
const response = await authFetchWithRefresh(url, options);
  
      const rawText = await response.clone().text();
     // console.log('📥 [응답 RAW TEXT]', rawText);
      console.groupCollapsed('%c[Disposal][RESPONSE]', 'color:#0aa;font-weight:600;');
      console.log('HTTP status:', response.status, '| ok:', response.ok);
      console.log('RAW TEXT:', rawText);
  
      const result = await response.json();
     // console.log('📥 [응답 JSON]', result);
     console.log('JSON:', result);
     console.groupEnd();
  
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
      alert(t('DisposalRegister_CheckDisposeResult'));
  
    } catch (err) {
      console.error('🚨 [Disposal][ERROR]:', err);
      alert(`🚨 ${t('DisposalRegister_ErrorLabel')}${err.message}`);
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
         alert(t('DisposalRegister_AlreadyRegisteredBarcode'));
       }
        if (scannerInstance) {
           scannerInstance.clear()
             .then(() => {
              // console.log('✅ 스캐너 종료됨');
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
          if (window.confirm(t('DisposalRegister_ConfirmReset'))) {
            setBarcodeList([]);
            setCurrentPage(1);
          }
        };
        



  return (
    <div className={`disposal-container ${effectiveMode}-mode`}>
      <h2 className="disposal-title">{t('DisposalRegister_Title')}</h2>
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
     placeholder={t('DisposalRegister_BarcodeInput')}
     className="disposal-input"
   />
   <button className="disposal-btn disposal-btn-add" onClick={handleAddBarcode}>{t('DisposalRegister_Add')}</button>
 </div>
      </div>
      {scannerVisible && (
   <div id="disposal-reader" className="qr-reader" style={{ marginTop: '20px' }}></div>
 )}
<div className="status-summary">
{/* 보류 */}
  <p style={{ color: '#000' }}>
    ✅ <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{t('DisposalRegister_Legend_Green')}</span>{t('DisposalRegister_Legend_Text_Middle')}
    ❌ <span style={{ color: '#f44336', fontWeight: 'bold' }}>{t('DisposalRegister_Legend_Red')}</span>{t('DisposalRegister_Legend_Text_End')}
  </p>

    {/* <p style={{ color: '#000' }}>
   총 등록: {totalCount}개 | 
   <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>성공: {successCount}개</span> | 
   <span style={{ color: '#f44336', fontWeight: 'bold' }}>실패: {failCount}개</span>
 </p>  */}

    <p style={{ color: '#000' }}>
    {t('DisposalRegister_TotalRegisteredLabel')}{nCount(totalCount)} |
    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
      {t('DisposalRegister_SuccessLabel')}{nCount(successCount)}
    </span> |
    <span style={{ color: '#f44336', fontWeight: 'bold' }}>
      {t('DisposalRegister_FailLabel')}{nCount(failCount)}
    </span>
  </p> 
</div>

      <div className="disposal-table-wrap">
      <table className="disposal-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleToggleAll} checked={barcodeList.length > 0 && barcodeList.every(item => item.checked)} /></th>
            <th>{t('DisposalRegister_Barcode')}</th>
            <th>{t('DisposalRegister_Delete')}</th>
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
      </div>


      <div className="disposal-pagination">
        <button className="disposal-page-btn" onClick={() => changePage(1)} disabled={currentPage === 1}>{t('DisposalRegister_First')}</button>
        <button className="disposal-page-btn" onClick={() => changePage(Math.max(1, groupStart - 1))} disabled={groupStart === 1}>{t('DisposalRegister_Prev')}</button>
        {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => (
          <button
            key={i}
            className={`disposal-page-btn ${currentPage === groupStart + i ? 'active' : ''}`}
            onClick={() => changePage(groupStart + i)}
          >
            {groupStart + i}
          </button>
        ))}
        <button className="disposal-page-btn" onClick={() => changePage(Math.min(totalPages, groupEnd + 1))} disabled={groupEnd === totalPages}>{t('DisposalRegister_Next')}</button>
        <button className="disposal-page-btn" onClick={() => changePage(totalPages)} disabled={currentPage === totalPages}>{t('DisposalRegister_End')}</button>
      </div>

      <div className="disposal-button-group">
        <button className="disposal-btn disposal-btn-submit" onClick={handleSubmitDisposal}>{t('DisposalRegister_DisposeSelected')}</button>
        <button className="disposal-btn disposal-btn-remove" onClick={handleRemoveSelected}>{t('DisposalRegister_DeleteSelected')}</button>
        <button className="disposal-btn disposal-btn-reset" onClick={handleReset}>{t('DisposalRegister_Reset')}</button>
      </div>
    </div>
    
  );
};

export default DisposalRegister;

// -------- Web/PDA 자동 판별 훅 --------
function useResponsiveMode() {
  const [mode, setMode] = React.useState('web');
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const isPDA = w <= 920 || (coarse && w <= 1200);
      setMode(isPDA ? 'pda' : 'web');
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);
  return mode;
}