

import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { saveItem, deleteItem, initDB } from '../../utils/db';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
// import axios from 'axios';
import './auditLoad.css';
import barcodeIcon from '../../assets/img/scan.png';

const AuditLoad = () => {
  const currentUserId = localStorage.getItem('username') || 'NO_ID';
  const currentUserName = localStorage.getItem('name') || '실사 등록자 없음';

  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
   const [selectedLocationId, setSelectedLocationId] =
   useState(localStorage.getItem('lastLocationId') || '');

  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const scannerRef = useRef(null);

  const [department, setDepartment] = useState('');

   // ───────── 에러 코드 매핑 ─────────
   const errorMessages = {
     ASSET_STOCK_TAKING_01: '해당일에 이미 진행한 실사 위치입니다.',
     ASSET_STOCK_TAKING_02: '이미 실사 등록된 바코드가 포함되어 있습니다.',
     // 필요하면 계속 추가…
   };
  

  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

  console.log(localStorage)

  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const db = await initDB();
        const all = await db.getAll('inspection');
  
        // 🔍 현재 사용자 항목만
        const filtered = all.filter(item =>
          item.registrantId === currentUserId && item.registrantName === currentUserName
        );
        
  
        const formatted = filtered.map(it => ({
          ...it,
          selected: false,
          new: false,
        }));
  
        setItems(formatted);
        
      } catch (err) {
        console.error('IndexedDB 로드 오류:', err);
      }
    };
  
    loadSavedItems();
  }, []);  
  
   // selectedLocationId 또는 locationOptions 가 바뀔 때마다 이름 동기화
   useEffect(() => {
     if (!selectedLocationId || locationOptions.length === 0) return;
     const loc =
       locationOptions.find(
         (l) => String(l.locationId) === String(selectedLocationId)
       ) || {};
     setSelectedLocationName(loc.location || '');
   }, [selectedLocationId, locationOptions]);
  


  useEffect(() => {
    const fetchLocations = async () => {
      const savedDepartment = localStorage.getItem('department');
      
      if (savedDepartment) setDepartment(savedDepartment);
      console.log("내 소속:"+ savedDepartment)
      try {
        //const token = localStorage.getItem('accessToken');
        // const response = await authFetchWithRefresh('http://192.168.0.220:8888/corporations');
        const response = await authFetchWithRefresh(`${API_BASE}/corporations`);

    
        const result = await response.json();
        console.log('📦 전체 법인 응답:', result);

        const corporationList = result?.data?.corporationList;

        if (!Array.isArray(corporationList)) {
          throw new Error('❌ corporationList가 존재하지 않거나 배열이 아닙니다.');
        }
  
        let matchedLocations = [];
  
        corporationList.forEach((corp) => {
          corp.affiliationList?.forEach((aff) => {
            if (aff.department === savedDepartment) {
              console.log(`✅ 매칭된 부서: ${aff.department}`);
              matchedLocations = matchedLocations.concat(aff.locations || []);
            }
          });
        });
  
        console.log('🎯 최종 세부위치 목록:', matchedLocations);
        setLocationOptions(matchedLocations); // 👈 이건 useState로 관리되는 상태
    
        // 이후 세부위치 Select 구성 로직 작성
      } catch (err) {
        console.error('❌ 법인 목록 불러오기 실패:', err);
        alert('법인 데이터를 불러오는 데 실패했습니다.');
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (scannerVisible && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(onScanSuccess, onScanFailure);
      setScannerInstance(scanner);
      scannerRef.current = true;
    }
    return () => {
      if (scannerInstance) {
        scannerInstance.clear().catch((e) => console.warn('scanner clear error', e));
        scannerRef.current = null;
        setScannerInstance(null);
      }
    };
  }, [scannerVisible]);

  const handleBarcodeClick = () => {
    if (!selectedLocationId) {
      alert('먼저 세부위치를 선택해주세요.');
      return;
    }
    setScannerVisible(true);
  };
  

  const onScanSuccess = async (decodedText) => {
    console.log('✅ 스캔 성공:', decodedText); 
    let parsedData = null;
    try {
      parsedData = JSON.parse(decodedText);
    } catch {
      parsedData = null;
    }
    const barcode = parsedData?.barcode || decodedText.trim();
    // const registrantId = currentUserId;
    // const registrantName = currentUserName;
    // const location = selectedLocation;
    // console.log("🧪 SCANNED:", barcode, location, registrantId, registrantName);

    // let existsInDB = false;
    // try {
    //   const db = await initDB();
    //   const existing = await db.get('inspection', barcode);
    //   if (existing) existsInDB = true;
    // } catch (err) {
    //   console.error('IndexedDB 접근 에러:', err);
    // }

    // if (!existsInDB) {
    //   const newItem = { barcode, location, registrantId, registrantName, selected: false, new: true };
    //   setItems((prev) => [...prev, newItem]);
    //   await saveItem({ barcode, location, registrantId, registrantName });
    // }

  const registrantId   = currentUserId;
  const registrantName = currentUserName;
  const location       = selectedLocationName; 

  if (!selectedLocationId) {
    alert('세부위치를 먼저 선택하세요!');
    return;
  }
  localStorage.setItem('lastLocationId', selectedLocationId);
  localStorage.setItem('lastLocationId', selectedLocationId);
  /* ① 이미 화면에 있는지(현재 사용자 기준) 검사  */
  const existsInState = items.some(
      (it) => it.barcode === barcode && it.registrantId === registrantId
  );
   if (existsInState) {
       alert(`📛 이미 등록된 바코드입니다: ${barcode}`);
      return;
     }
  /* ② IndexedDB 중복 검사도 사용자 기준으로만 */
  let existsInDB = false;
  try {
    const dbItem = await (await initDB()).get('inspection', barcode);
    if (dbItem && dbItem.registrantId === registrantId) existsInDB = true;

  } catch (e) {
    console.error('IndexedDB 접근 오류:', e);
  }

  /* ③ 새 항목 추가 */
  if (!existsInDB) {
    const newItem = {
      barcode,
      locationId: selectedLocationId,      // ✅ 저장
      location  : selectedLocationName,    // 화면표시용
      registrantId,
      registrantName,
      selected: false,
      new: true,
    };
    setItems((prev) => [...prev, newItem]);
    await saveItem(newItem);
  }

  /* ④ 같은 코드를 연속으로 읽지 않도록 1.2초 일시 정지 */
  await scannerInstance?.pause();
  setTimeout(() => scannerInstance?.resume(), 1200);

    setScannerVisible(false);
    if (scannerInstance) {
      await scannerInstance.clear();
      scannerRef.current = null;
      setScannerInstance(null);
    }
  };
//qr 에러 뜨게 하는거
  const onScanFailure = (error) => {
   // console.warn(`QR 스캔 실패: ${error}`);
  };
// 개발 모드에서만 뜨게 하는거
  // const onScanFailure = (error) => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.warn(`QR 스캔 실패: ${error}`);
  //   }
  // };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const toDelete = items.filter((item) => item.selected);
    if (toDelete.length === 0) return alert('삭제할 항목을 선택하세요.');
    for (const item of toDelete) await deleteItem(item.barcode);
    setItems(items.filter((item) => !item.selected));
  };

  const handleRegister = async () => {
    const selectedItems = items.filter((item) => item.selected);
    const itemsToRegister = selectedItems.length === 0 ? items : selectedItems;

    if (itemsToRegister.length === 0) return alert('등록할 항목이 없습니다.');

  /* ─────────────── 새로 추가: 다른 사용자가 저장만 해둔 항목 확인 ─────────────── */
  const currentUser = localStorage.getItem('username');
  const hasUnregisteredByOthers = itemsToRegister.some(
    (item) => item.registrantId !== currentUser
  );

  if (hasUnregisteredByOthers) {
    const confirm = window.confirm(
      '❗ 이 바코드는 다른 사용자가 로컬DB에 저장했지만 아직 실사 등록되지 않았습니다.\n해당 자산을 실사 등록하시겠습니까?'
    );
    if (!confirm) return;         /* 사용자가 “아니오” 선택 시 중단 */
  }

 /* ───────────────────────── 기존 payload 정의 ───────────────────────── */
  // (+) selectedLocationId가 비어 있으면 첫 행의 locationId 사용
  const effectiveLocationId =
    selectedLocationId || itemsToRegister[0]?.locationId || '';
 
  if (!effectiveLocationId) {
    alert('세부위치를 선택하거나 포함된 항목에 세부위치 ID가 없습니다.');
   return;
  }
 
  const payload = {
    barcodes: itemsToRegister.map((item) => item.barcode),
    auditingDate: new Date().toISOString().split('T')[0],
    realLocationId: Number(effectiveLocationId),
  };
     console.log('📦 stock-taking payload →', JSON.stringify(payload, null, 2));
    try {
      const token = localStorage.getItem('accessToken');
      // const response = await authFetchWithRefresh('http://192.168.0.220:8888/stock-takings', {
        const response = await authFetchWithRefresh(`${API_BASE}/stock-takings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('🛬 status:', response.status);
console.log('🛬 raw   :', await response.clone().text());
  
      const result = await response.json();
  
      if (result.code === 1) {
        for (const item of itemsToRegister) await deleteItem(item.barcode);
        setItems(items.filter((item) => !item.selected));
        alert('✅ 실사 등록이 완료되었습니다.');
      } else {
        console.error('❌ 실사 등록 실패:', result.message || '알 수 없는 오류');
        alert(`❌ 등록 실패: ${result.message || '서버 응답 오류'}`);
      }
       } catch (err) {
           if (err.body) {
             const { status, code, message, time } = err.body;
             console.error(
               '🛑 Stock-taking API Error',
               '\n· time   :', time,
               '\n· status :', status,
             '\n· code   :', code,
               '\n· message:', message
             );
        
             /* ➊ 매핑된 친화적 메시지 선택(없으면 서버 메시지) */
             const friendly = errorMessages[code] || message || '서버 오류';
        
             /* ➋ 알림 */
             alert(`❌ 등록 실패\n${friendly}`);
           } else {
             console.error(err);
             alert('🚨 등록 중 알 수 없는 오류가 발생했습니다.');
           }
         }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setItems(items.map((item) => ({ ...item, selected: checked })));
  };
  
  const handleSelectItem = (index) => {
    const updated = [...items];
    updated[index].selected = !updated[index].selected;
    setItems(updated);
  };

  return (
    <div className="audit-container">
      <h2>실사 등록</h2>

      <div className="location-wrapper">
        <label>📍 세부위치:</label>
        <select
  value={selectedLocationId}
  onChange={(e) => {
    const id = e.target.value;
    setSelectedLocationId(id);
    localStorage.setItem('lastLocationId', id);   // (+) 항상 최신값 저장
    const locObj = locationOptions.find(
      (l) => String(l.locationId) === id              // 🔑 비교 대상도 locationId
    ) || {};
    setSelectedLocationName(locObj.location || '');
  }}
>
  <option value="">-- 세부위치 선택 --</option>
  {locationOptions.map((loc) => (
    <option key={loc.locationId} value={loc.locationId}>
      {loc.location}
    </option>
  ))}
</select>
      </div>

      <div className="barcode-row-split">
        <div className="barcode-left">
          <img
            src={barcodeIcon}
            alt="바코드 스캔"
            className="barcode-icon"
            onClick={handleBarcodeClick}
             style={{ cursor: (selectedLocationId || items.length) ? 'pointer' : 'not-allowed',
                        opacity: (selectedLocationId || items.length) ? 1 : 0.5 }}
          />
          <input
            type="text"
            placeholder="바코드 직접 입력 후 Enter"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && searchBarcode.trim()) {
                if (!selectedLocationId)
                  return alert('먼저 세부위치를 선택해주세요.');
              
                const barcode        = searchBarcode.trim();
                const registrantId   = currentUserId;
                const registrantName = currentUserName;
                const location       = selectedLocationName;   // ⬅️
              
                if (!items.some((it) => it.barcode === barcode)) {
                  const newItem = {
                    barcode,
                    locationId: selectedLocationId,     // ✅ 추가
                    location: selectedLocationName,
                    registrantId,
                    registrantName,
                    selected: false,
                    new: true,
                  };
                  setItems((prev) => [...prev, newItem]);
                  await saveItem(newItem);
                }
                localStorage.setItem('lastLocationId', selectedLocationId);
                setSearchBarcode('');
              }
            }}
          />
        </div>
        <div className="button-row-inline">
  <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
  <button className="register-btn" onClick={handleRegister}>등록하기</button>
</div>
      </div>

      <div id="reader" className="qr-reader" style={{ display: scannerVisible ? 'block' : 'none' }}></div>

      <table className="audit-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAll} checked={items.every(it => it.selected) && items.length > 0} /></th>
            <th>바코드</th>
            <th>세부위치</th>
            <th>등록자</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="4" className="no-data">스캔된 데이터가 없습니다.</td></tr>
          ) : (
            items.map((item, index) => (
              <tr key={index} className={item.selected ? 'selected-row' : ''} style={{ backgroundColor: item.new ? '#fffacd' : 'transparent' }}>
                <td><input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} /></td>
                <td>{item.barcode}</td>
                <td>{item.location}</td>
                <td>{`${item.registrantName} (${item.registrantId})`}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="audit-card-list">
        {items.map((item, index) => (
          <div key={index} className={`audit-card ${item.selected ? 'selected-row' : ''}`} style={{ backgroundColor: item.new ? '#fffacd' : 'transparent' }}>
            <div className="audit-card-header">
              <span className="barcode">{item.barcode}</span>
              <input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} />
            </div>
            <div className="audit-card-row"><strong>위치:</strong> {item.location}</div>
            <div className="audit-card-row">
  <strong>등록자:</strong> {`${item.registrantName} (${item.registrantId})`}
</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditLoad;
