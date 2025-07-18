import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { saveItem, deleteItem, initDB } from '../../utils/db';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { useContext } from 'react';
import { UserContext } from '../../utils/UserContext';
import './auditLoad.css';
import barcodeIcon from '../../assets/img/scan.png';
import Tooltip from '../../utils/Tooltip'; 

const AuditLoad = () => {
  
  const { user } = useContext(UserContext);
  const currentUserId   = user?.username || localStorage.getItem('username') || 'NO_ID';
  const currentUserName = user?.name     || localStorage.getItem('name')     || '실사 등록자 없음';

  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [notFoundList, setNotFoundList] = useState([]); // ❗ NOT_FOUND 전용 상태
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(''); // ✨ 항상 ''(초기값)
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const scannerRef = useRef(null);

  const department = user?.department || localStorage.getItem('department') || '';
  const company    = user?.company    || localStorage.getItem('corporation') || '';

  const errorMessages = {
    ASSET_STOCK_TAKING_01: '해당일에 이미 진행한 실사 위치입니다.',
    ASSET_STOCK_TAKING_02: '이미 실사 등록된 바코드가 포함되어 있습니다.',
  };

  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const db = await initDB();
        const all = await db.getAll('inspection');
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
  }, [currentUserId, currentUserName]);

  // 세부위치 동기화
  useEffect(() => {
    if (!selectedLocationId || locationOptions.length === 0) {
      setSelectedLocationName('');
      return;
    }
    const loc =
      locationOptions.find((l) => String(l.locationId) === String(selectedLocationId)) || {};
    setSelectedLocationName(loc.location || '');
  }, [selectedLocationId, locationOptions]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const result = await response.json();
        const corporationList = result?.data?.corporationList;
        if (!Array.isArray(corporationList)) throw new Error('corporationList가 배열이 아님');
        let matchedLocations = [];
        corporationList.forEach((corp) => {
          if (corp.name === company) {
            corp.affiliationList?.forEach((aff) => {
              if (aff.department === department) {
                matchedLocations = matchedLocations.concat(aff.locations || []);
              }
            });
          }
        });
        setLocationOptions(matchedLocations);
      } catch (err) {
        console.error('법인 목록 불러오기 실패:', err);
        alert('법인 데이터를 불러오는 데 실패했습니다.');
      }
    };
    fetchLocations();
  }, [department, company]);

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
    // eslint-disable-next-line
  }, [scannerVisible]);


  useEffect(() => {
    if (!selectedLocationId) return;
    const locObj = locationOptions.find(l => String(l.locationId) === String(selectedLocationId)) || {};
    setSelectedLocationName(locObj.location || '');
  
    // 모든 아이템의 location/locationId 동기화
    setItems(items =>
      items.map(item => ({
        ...item,
        locationId: selectedLocationId,
        location: locObj.location || '',
      }))
    );
  }, [selectedLocationId, locationOptions]);

  const handleBarcodeClick = () => {
    if (!selectedLocationId) {
      alert('먼저 세부위치를 선택해주세요.');
      return;
    }
    setScannerVisible(true);
  };

  const onScanSuccess = async (decodedText) => {
    let parsedData = null;
    try { parsedData = JSON.parse(decodedText); } catch { parsedData = null; }
    const barcode = parsedData?.barcode || decodedText.trim();
    const registrantId = currentUserId;
    const registrantName = currentUserName;
    const location = selectedLocationName;
    if (!selectedLocationId) {
      alert('세부위치를 먼저 선택하세요!');
      return;
    }
    const existsInState = items.some(
      (it) => it.barcode === barcode && it.registrantId === registrantId
    );
    if (existsInState) {
      alert(`📛 이미 등록된 바코드입니다: ${barcode}`);
      return;
    }
    let existsInDB = false;
    try {
      const dbItem = await (await initDB()).get('inspection', barcode);
      if (dbItem && dbItem.registrantId === registrantId) existsInDB = true;
    } catch (e) {}
    if (!existsInDB) {
      const newItem = {
        barcode,
        locationId: selectedLocationId,
        location: selectedLocationName,
        registrantId,
        registrantName,
        selected: false,
        new: true,
        errorMessage: '',
      };
      setItems((prev) => [...prev, newItem]);
      await saveItem(newItem);
    }
    await scannerInstance?.pause();
    setTimeout(() => scannerInstance?.resume(), 1200);
    setScannerVisible(false);
    if (scannerInstance) {
      await scannerInstance.clear();
      scannerRef.current = null;
      setScannerInstance(null);
    }
  };
  const onScanFailure = () => {};

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const toDelete = items.filter((item) => item.selected);
    if (toDelete.length === 0) return alert('삭제할 항목을 선택하세요.');
    for (const item of toDelete) await deleteItem(item.barcode);
    setItems(items.filter((item) => !item.selected));
  };

  const handleVerify = async () => {
    if (!selectedLocationId) return; // 반드시 선택 필요
    const selectedItems = items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      alert('검증할 항목을 선택하세요.');
      return;
    }
    const payload = {
      barcodes: selectedItems.map(item => item.barcode),
      auditingDate: new Date().toISOString().split('T')[0],
      realLocationId: Number(selectedLocationId),
    };
  
    console.log('[검증] 요청 payload:', payload);
  
    try {
      const response = await authFetchWithRefresh(`${API_BASE}/stock-takings/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      // 응답 raw text 콘솔
      const rawText = await response.clone().text();
      console.log('[검증] 응답(raw text):', rawText);
  
      // JSON 파싱
      const result = await response.json();
      console.log('[검증] 응답(JSON):', result);
  
      const { matchItem = [], unmatchItem = [], disableItem = [] } = result.data || {};
      const barcodeStatusMap = {};
       [...matchItem, ...unmatchItem].forEach(i => {
             barcodeStatusMap[i.barcode] = {
               status: i.status, // 서버 status 그대로 사용
               errorMessage: i.status === 'MISMATCH' ? '실사 위치가 자산 위치와 다릅니다.' : ''
             };
         });
      // DISABLE
      disableItem.forEach(i => {
        barcodeStatusMap[i.barcode] = {
          status: 'DISABLE',
          errorMessage: '이관처리를 해야됩니다.'
        };
      });

      // ✅ 찾을 수 없는 바코드 처리
const selectedBarcodes = selectedItems.map(item => item.barcode);
const returnedBarcodes = [...matchItem, ...unmatchItem, ...disableItem].map(i => i.barcode);
const notFoundBarcodes = selectedBarcodes.filter(b => !returnedBarcodes.includes(b));
  
      // 👇 상태에 맞게 비고/에러메시지 지정!
      if (result.code === 1) {
        const updates = items.map(item => {
          const mapped = barcodeStatusMap[item.barcode];
          if (mapped) {
               // 상태별로 에러메시지 덮어쓰기 정책 분리
   if (mapped.status === 'MISMATCH') {
     return {
       ...item,
       status: 'MISMATCH',
       errorMessage: '실사 위치가 자산 위치와 다릅니다.',
     };
   }
   if (mapped.status === 'DISABLE') {
     return {
       ...item,
       status: 'DISABLE',
       errorMessage: '이관처리를 해야됩니다.',
     };
   }
   // MATCH는 상태만 변경하고 비고는 유지 또는 초기화 가능
   return {
     ...item,
     status: 'MATCH',
     errorMessage: '', // 정상인 경우 비고를 비움
   };
          }
          if (selectedBarcodes.includes(item.barcode)) {
            // 검증 요청했지만 응답이 없는 바코드 → NOT_FOUND 처리
            return {
              ...item,
              status: 'NOT_FOUND',
              errorMessage: 'DB에서 바코드를 찾을 수 없습니다.',
            };
          }
          return item;
        });
        setItems(updates);
        alert('✅ 검증이 완료되었습니다.');
      }
    } catch (err) {
            // 🔍 서버 응답을 콘솔에 자세히 출력
            if (err instanceof Response) {
              const text = await err.text();
              console.error('🚨 [서버 응답 text]', text);
              try {
                const json = JSON.parse(text);
                console.log('🚨 [서버 응답 JSON]', json);
                console.log('🚨 [서버 응답 message]', json.message);
                console.log('🚨 [서버 응답 status]', json.status);
                console.log('🚨 [서버 응답 path]', json.path);
              } catch (e) {
                console.log('🚨 [서버 응답이 JSON 아님]', text);
              }
      
              if (text.includes('바코드로 자산을 찾을 수 없습니다')) {
                const updates = items.map(item => {
                  if (selectedItems.some(sel => sel.barcode === item.barcode)) {
                    return {
                      ...item,
                      status: 'NOT_FOUND',
                      errorMessage: '서버에 자산 정보가 없습니다.',
                    };
                  }
                  return item;
                });
                setItems(updates);
      
                // 🔍 찾을 수 없는 목록만 콘솔 출력
                const notFoundList = selectedItems
                  .map(sel => sel.barcode)
                  .filter(bc => !items.some(item => item.barcode === bc && item.status !== 'NOT_FOUND'));
                console.log('❗ [NOT_FOUND 바코드 목록]', notFoundList);
                return;
              }
            }

      alert('🚨 검증 중 오류가 발생했습니다.');
      console.error(err);

      if (err instanceof Response) {
        const text = await err.text();
        console.error('🚨 서버 응답 본문:', text);
      } else if (err.message) {
        console.error('🚨 오류 메시지:', err.message);
      } else {
        console.error('🚨 알 수 없는 오류:', err);
      }
      
    }
  };

  const handleRegister = async () => {
    if (!selectedLocationId) return; // 반드시 선택 필요
    const selectedItems = items.filter((item) => item.selected);
    const itemsToRegister = selectedItems.length === 0 ? items : selectedItems;
      // ✅ 검증 안한 상태면 등록 막기
  const hasUnverified = itemsToRegister.some(item => !item.status);
  if (hasUnverified) {
    alert('❗ 먼저 검증을 진행해주세요.');
    return;
  }
    if (selectedItems.length === 0) return alert('등록할 항목이 없습니다.');
    if (selectedItems.some(item => item.status === 'DISABLE' || item.status === 'NOT_FOUND')) {
      alert('등록이 불가능한 자산이 포함되어 있습니다. 비고란을 확인하세요.');
      return;
    }

     // 1) MISMATCH 품목이 있다면 안내문 띄우고 YES 시 해당 바코드의 위치를 일괄로 선택한 세부위치로 변경
     const mismatches = itemsToRegister.filter(item => item.status === 'MISMATCH');
     if (mismatches.length > 0) {
       const mismatchList = mismatches.map(i => `- ${i.barcode}`).join('\n');
       const msg =
       `아래 품목들은 자산 위치와 다릅니다.\n\n${mismatchList}\n\n` +
       `이 품목들은 모두\n` +
       `부서: "${department}"\n`+
       `세부위치: "${selectedLocationName}"` +
       `(으)로 위치가 변경되어 등록됩니다.\n` +
       `진행할까요?`;
       const go = window.confirm(msg);
       if (!go) return;
       // YES 누르면, itemsToRegister 중 MISMATCH 항목의 location/locationId를 일괄로 변경
       itemsToRegister.forEach(item => {
         if (item.status === 'MISMATCH') {
           item.locationId = selectedLocationId;
           item.location = selectedLocationName;
         }
       });
     }
    const currentUser = localStorage.getItem('username');
    const hasUnregisteredByOthers = itemsToRegister.some(
      (item) => item.registrantId !== currentUser
    );
    if (hasUnregisteredByOthers) {
      const confirm = window.confirm(
        '❗ 이 바코드는 다른 사용자가 로컬DB에 저장했지만 아직 실사 등록되지 않았습니다.\n해당 자산을 실사 등록하시겠습니까?'
      );
      if (!confirm) return;
    }
    const effectiveLocationId = selectedLocationId || itemsToRegister[0]?.locationId || '';
    if (!effectiveLocationId) {
      alert('세부위치를 선택하거나 포함된 항목에 세부위치 ID가 없습니다.');
      return;
    }
    const payload = {
      barcodes: itemsToRegister.map((item) => item.barcode),
      auditingDate: new Date().toISOString().split('T')[0],
      realLocationId: Number(effectiveLocationId),
    };
    console.log('[검증] 요청 payload:', payload);

    try {
      const response = await authFetchWithRefresh(`${API_BASE}/stock-takings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.code === 1) {
        for (const item of itemsToRegister) await deleteItem(item.barcode);
        setItems(items.filter((item) => !item.selected));
        alert('✅ 실사 등록이 완료되었습니다.');
      } else {
        alert(`❌ 등록 실패: ${result.message || '서버 응답 오류'}`);
      }
    } catch (err) {
      alert('🚨 등록 중 알 수 없는 오류가 발생했습니다.');
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
            const locObj = locationOptions.find(
              (l) => String(l.locationId) === id
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
          {/* <img
            src={barcodeIcon}
            alt="바코드 스캔"
            className="barcode-icon"
            onClick={handleBarcodeClick}
            style={{ cursor: selectedLocationId ? 'pointer' : 'not-allowed', opacity: selectedLocationId ? 1 : 0.5 }}
          /> */}
          <input
            type="text"
            placeholder="바코드 직접 입력 후 Enter"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && searchBarcode.trim()) {
                if (!selectedLocationId) return alert('먼저 세부위치를 선택해주세요.');
                const barcode = searchBarcode.trim();
                const registrantId = currentUserId;
                const registrantName = currentUserName;
                if (!items.some((it) => it.barcode === barcode)) {
                  const newItem = {
                    barcode,
                    locationId: selectedLocationId,
                    location: selectedLocationName,
                    registrantId,
                    registrantName,
                    selected: false,
                    new: true,
                    errorMessage: '',
                  };
                  setItems((prev) => [...prev, newItem]);
                  await saveItem(newItem);
                }
                setSearchBarcode('');
              }
            }}
          />
        </div>
        <div className="button-row-inline">
          <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
          <button
            className="verify-btn"
            onClick={handleVerify}
            disabled={!selectedLocationId}
            style={{
              backgroundColor: !selectedLocationId ? '#ccc' : undefined,
              color: !selectedLocationId ? '#666' : undefined,
              cursor: !selectedLocationId ? 'not-allowed' : 'pointer'
            }}
          >
            검증하기
          </button>
          <Tooltip message="실사는 세부위치 기준으로 시작일 포함 2주간만 등록 가능합니다.">
          <button
  className="register-btn"
  onClick={handleRegister}
  disabled={
    !selectedLocationId ||
    items.some(item => 
      item.selected && 
      (item.status === 'DISABLE' || item.status === 'NOT_FOUND')
    )
  }
  style={{
    backgroundColor: !selectedLocationId ? '#ccc' : undefined,
    color: !selectedLocationId ? '#666' : undefined,
    cursor: !selectedLocationId ? 'not-allowed' : 'pointer'
  }}
>
  등록하기
</button>
          </Tooltip>
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
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="5" className="no-data">스캔된 데이터가 없습니다.</td></tr>
          ) : (
            items.map((item, index) => (
              <tr key={index} className={item.selected ? 'selected-row' : ''} style={{ backgroundColor: item.new ? '#fffacd' : 'transparent' }}>
                <td><input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} /></td>
                <td>{item.barcode}</td>
                <td>{item.location}</td>
                <td>{`${item.registrantName} (${item.registrantId})`}</td>
                <td className={item.errorMessage ? 'error-message' : ''}>
  {item.errorMessage && (
    <div className="card-remark">
      {item.errorMessage}
    </div>
  )}
</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="audit-card-list">
      <div className="card-select-all">
    <label>
      <input 
        type="checkbox" 
        onChange={handleSelectAll} 
        checked={items.every(it => it.selected) && items.length > 0} 
      />
      전체 선택
    </label>
  </div>
        {items.map((item, index) => (
          <div
            key={index}
            className={`audit-card ${item.selected ? 'selected-row' : ''}`}
            style={{ backgroundColor: item.new ? '#fffacd' : 'transparent' }}
          >
            <div className="audit-card-header">
              <span className="barcode">{item.barcode}</span>
              <input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} />
            </div>
            <div className="audit-card-row"><strong>위치:</strong> {item.location}</div>
            <div className="audit-card-row">
              <strong>등록자:</strong> {`${item.registrantName} (${item.registrantId})`}
            </div>
            {item.errorMessage && (
              <div className="card-remark">
{item.status === 'MATCH' && <span style={{ color: '#388e3c' }}>정상</span>}
{item.status === 'MISMATCH' && <span style={{ color: '#fbc02d' }}>위치불일치</span>}
{item.status === 'DISABLE' && <span style={{ color: '#e53935' }}>등록불가</span>}
{item.status === 'NOT_FOUND' && <span style={{ color: '#e53935' }}>바코드 없음</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    
  );
};

export default AuditLoad;
