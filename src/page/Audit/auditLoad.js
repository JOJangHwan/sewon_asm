import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { saveItem, deleteItem, initDB } from '../../utils/db';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { useContext } from 'react';
import { UserContext } from '../../utils/UserContext';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref';
import './auditLoad.css';
import barcodeIcon from '../../assets/img/scan.png';
import Tooltip from '../../utils/Tooltip'; 

// 모든 요청에 언어 헤더 자동 부착
const withLang = (opts = {}) => {
  const ui = getUILang();           // 'KR' | 'CN' | 'VN'
  const lng = uiToI18n(ui);         // 'ko' | 'zh' | 'vi'
  return {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'X-Client-Lang': lng,
      'X-Client-Lang-UI': ui,
    },
  };
};

 const AuditLoad = () => {
   const { t } = useTranslation('auditLoad');

   const effectiveMode = useResponsiveMode();
  
  const { user } = useContext(UserContext);
  const currentUserId   = user?.username || localStorage.getItem('username') || t('AuditLoad_NoId');
  const currentUserName = user?.name     || localStorage.getItem('name')     || t('AuditLoad_Status_NoRegistrar');

  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [notFoundList, setNotFoundList] = useState([]); // ❗ NOT_FOUND 전용 상태
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(''); // ✨ 항상 ''(초기값)
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const scannerRef = useRef(null);
  const barcodeInputRef = useRef(null);// 바코드 포커싱


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
        const response = await authFetchWithRefresh(`${API_BASE}/corporations`, withLang());
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
        alert(t('AuditLoad_LoadCorporationFailed'));
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

  useEffect(() => {
    if (selectedLocationId && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [selectedLocationId]);

  const handleBarcodeClick = () => {
    if (!selectedLocationId) {
      alert(t('AuditLoad_SelectDetailLocationFirst'));
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
      alert(`📛 ${t('AuditLoad_AlreadyRegisteredBarcodeLabel')}${barcode}`);
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
    if (!window.confirm(t('AuditLoad_ConfirmDelete'))) return;
    const toDelete = items.filter((item) => item.selected);
    if (toDelete.length === 0) return alert(t('AuditLoad_SelectItemsToDelete'));
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
  
   // console.log('[검증] 요청 payload:', payload);
  
    try {
      const response = await authFetchWithRefresh(`${API_BASE}/stock-takings/verify`, withLang({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }));
  
      // 응답 raw text 콘솔
      const rawText = await response.clone().text();
     // console.log('[검증] 응답(raw text):', rawText);
  
      // JSON 파싱
      const result = await response.json();
   //   console.log('[검증] 응답(JSON):', result);
  
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
          errorMessage: t('AuditLoad_TransferRequired')
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
      errorMessage: t('AuditLoad_AuditLocationDifferent')
     };
   }
   if (mapped.status === 'DISABLE') {
     return {
       ...item,
       status: 'DISABLE',
       errorMessage: t('AuditLoad_TransferRequired'),
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
              errorMessage: t('AuditLoad_BarcodeNotFoundInDB')
            };
          }
          return item;
        });
        setItems(updates);
        alert(`✅ ${t('AuditLoad_ValidationComplete')}`);
      }
    } catch (err) {
            // 🔍 서버 응답을 콘솔에 자세히 출력
            if (err instanceof Response) {
              const text = await err.text();
              console.error('🚨 [서버 응답 text]', text);
              try {
                const json = JSON.parse(text);
               // console.log('🚨 [서버 응답 JSON]', json);
               // console.log('🚨 [서버 응답 message]', json.message);
               // console.log('🚨 [서버 응답 status]', json.status);
               // console.log('🚨 [서버 응답 path]', json.path);
              } catch (e) {
              //  console.log('🚨 [서버 응답이 JSON 아님]', text);
              }
      
              if (text.includes('바코드로 자산을 찾을 수 없습니다')) {
                const updates = items.map(item => {
                  if (selectedItems.some(sel => sel.barcode === item.barcode)) {
                    return {
                      ...item,
                      status: 'NOT_FOUND',
                      errorMessage: t('AuditLoad_NoAssetInfoOnServer')
                    };
                  }
                  return item;
                });
                setItems(updates);
      
                // 🔍 찾을 수 없는 목록만 콘솔 출력
                const notFoundList = selectedItems
                  .map(sel => sel.barcode)
                  .filter(bc => !items.some(item => item.barcode === bc && item.status !== 'NOT_FOUND'));
               // console.log('❗ [NOT_FOUND 바코드 목록]', notFoundList);
                return;
              }
            }
      alert(`🚨 ${t('AuditLoad_ValidationError')}`);
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
    alert(`❗ ${t('AuditLoad_ValidateFirst')}`);
    return;
  }
    if (selectedItems.length === 0) return alert(t('AuditLoad_NoItemsToRegister'));
    if (selectedItems.some(item => item.status === 'DISABLE' || item.status === 'NOT_FOUND')) {
      alert(t('AuditLoad_ContainsUnregistrableAssets_CheckRemark'));
      return;
    }

     // 1) MISMATCH 품목이 있다면 안내문 띄우고 YES 시 해당 바코드의 위치를 일괄로 선택한 세부위치로 변경
     const mismatches = itemsToRegister.filter(item => item.status === 'MISMATCH');
     if (mismatches.length > 0) {
       const mismatchList = mismatches.map(i => `- ${i.barcode}`).join('\n');
const msg = t('AuditLoad_ConfirmChangeLocationForItems', {
  list: mismatchList ? `${mismatchList}\n` : '', // 목록 끝에 줄바꿈 추가
  department,
  location: selectedLocationName,
});
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
const confirm = window.confirm(t('AuditLoad_Prompt_RegisterBarcodeStoredLocally'));
      if (!confirm) return;
    }
    const effectiveLocationId = selectedLocationId || itemsToRegister[0]?.locationId || '';
    if (!effectiveLocationId) {
      alert(t('AuditLoad_MissingDetailLocationId'));
      return;
    }
    const payload = {
      barcodes: itemsToRegister.map((item) => item.barcode),
      auditingDate: new Date().toISOString().split('T')[0],
      realLocationId: Number(effectiveLocationId),
    };
   // console.log('[검증] 요청 payload:', payload);

    try {
     const response = await authFetchWithRefresh(`${API_BASE}/stock-takings`, withLang({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }));
      const result = await response.json();
      if (result.code === 1) {
        for (const item of itemsToRegister) await deleteItem(item.barcode);
        setItems(items.filter((item) => !item.selected));
        alert(t('AuditLoad_RegisterSuccess'));
      } else {
        alert(`${t('AuditLoad_RegisterFailedLabel')}${result.message || 'Server Error'}`);
      }
    } catch (err) {
      alert(t('AuditLoad_RegisterUnknownError'));
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
    <div className={`audit-container ${effectiveMode}-mode`}>
           <h2>{t('AuditLoad_AuditRegister')}</h2>

      {/* -------- Web 레이아웃 -------- */}
      {effectiveMode === 'web' && (
        <>
          <div className="location-wrapper">
            <label>📍 {t('AuditLoad_DetailLocation')}:</label>
            <select
              value={selectedLocationId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedLocationId(id);
                const locObj =
                  locationOptions.find((l) => String(l.locationId) === id) || {};
                setSelectedLocationName(locObj.location || '');
              }}
            >
              <option value="">{t('AuditLoad_SelectDetailLocation')}</option>
              {locationOptions.map((loc) => (
               <option key={loc.locationId} value={loc.locationId}>
                 {loc.location}
                </option>
              ))}
            </select>
          </div>

          <div className="barcode-row-split">
            <div className="barcode-left">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={t('AuditLoad_BarcodeManualEnter')}
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && searchBarcode.trim()) {
                    if (!selectedLocationId)
                      return alert(t('AuditLoad_SelectDetailLocationFirst'));
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
              <button className="delete-btn" onClick={handleDelete}>{t('AuditLoad_Delete')}</button>

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
                {t('AuditLoad_Validate')}
              </button>

              <Tooltip message={t('AuditLoad_AuditPeriodRule')}>
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
                  {t('AuditLoad_Register')}
                </button>
              </Tooltip>
            </div>
          </div>
        </>
      )}

      {/* -------- PDA 레이아웃 (3줄) -------- */}
      {effectiveMode === 'pda' && (
        <div className="pda-form">
          {/* 1열: 세부위치 */}
          <div className="pda-field">
            <span className="pda-label">📍 세부위치</span>
            <select
              value={selectedLocationId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedLocationId(id);
                const locObj =
                  locationOptions.find((l) => String(l.locationId) === id) || {};
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

          {/* 2열: 바코드 입력 */}
          <input
            className="pda-input barcode"
            ref={barcodeInputRef}
            type="text"
            placeholder={t('AuditLoad_BarcodeManualEnter')}
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && searchBarcode.trim()) {
                if (!selectedLocationId) return alert(t('AuditLoad_SelectDetailLocationFirst'));
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

                  {/* 3열: 버튼 3개 (PDA는 안내문 상시 노출) */}
                   {/* 3열: 버튼 3개 + 안내문(전체폭) */}
          <div className="pda-actions-3">
            <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
            <button className="verify-btn" onClick={handleVerify} disabled={!selectedLocationId}>검증하기</button>
            <button
              className="register-btn"
              onClick={handleRegister}
              disabled={
                !selectedLocationId ||
                items.some(item =>
                  item.selected && (item.status === 'DISABLE' || item.status === 'NOT_FOUND')
                )
              }
            >
              등록하기
            </button>
            {/* 안내문을 grid의 4번째 아이템으로 추가 → 1 ~ 마지막 컬럼까지 가로 전체 차지 */}
            <div className="pda-inline-hint" role="note">
              {t('AuditLoad_AuditPeriodRule')}
            </div>
          </div>
        </div>
      )}
      <div id="reader" className="qr-reader" style={{ display: scannerVisible ? 'block' : 'none' }}></div>
      <table className="audit-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAll} checked={items.every(it => it.selected) && items.length > 0} /></th>
 <th>{t('AuditLoad_Barcode')}</th>
 <th>{t('AuditLoad_DetailLocation')}</th>
 <th>{t('AuditLoad_Registrar')}</th>
 <th>{t('AuditLoad_Remark')}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="5" className="no-data">{t('AuditLoad_NoScannedData')}</td></tr>
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
      {t('AuditLoad_SelectAll')}
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
            <div className="audit-card-row"><strong>{t('AuditLoad_LocationLabel')}</strong> {item.location}</div>
            <div className="audit-card-row">
              <strong>{t('AuditLoad_RegistrarLabel')}</strong> {`${item.registrantName} (${item.registrantId})`}
            </div>
            {item.errorMessage && (
              <div className="card-remark">
{item.status === 'MATCH' && <span style={{ color: '#388e3c' }}>{t('AuditLoad_Status_Normal')}</span>}
{item.status === 'MISMATCH' && <span style={{ color: '#fbc02d' }}>{t('AuditLoad_Status_LocationMismatch')}</span>}
{item.status === 'DISABLE' && <span style={{ color: '#e53935' }}>{t('AuditLoad_Status_NotRegistrable')}</span>}
{item.status === 'NOT_FOUND' && <span style={{ color: '#e53935' }}>{t('AuditLoad_Status_NoBarcode')}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    
  );
};

export default AuditLoad;

// -------------------------------
// Web/PDA 자동 판별 훅
function useResponsiveMode() {
  const [mode, setMode] = React.useState('web');
  React.useEffect(() => {
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