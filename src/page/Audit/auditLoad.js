<<<<<<< HEAD
// import React, { useState, useRef, useEffect } from 'react';
// import { Html5QrcodeScanner } from 'html5-qrcode';
// import './auditLoad.css';

// import barcodeIcon from '../../assets/img/scan.png'; // 바코드 아이콘

// const AuditLoad = () => {
//   const [searchBarcode, setSearchBarcode] = useState('');
//   const [items, setItems] = useState([]);
//   const [scannerVisible, setScannerVisible] = useState(false);
//   const [registeredItems, setRegisteredItems] = useState([]);
//   const scannerRef = useRef(null);

//   useEffect(() => {
//     if (scannerVisible && !scannerRef.current) {
//       scannerRef.current = new Html5QrcodeScanner(
//         'reader',
//         { fps: 10, qrbox: { width: 250, height: 250 } },
//         false
//       );
//       scannerRef.current.render(onScanSuccess, onScanFailure);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [scannerVisible]);

//   const handleBarcodeClick = () => {
//     setScannerVisible(true);
//   };

//   const onScanSuccess = (decodedText) => {
//     const newItem = {
//       barcode: decodedText,
//       company: '',
//       department: '',
//       location: '',
//       acquisitionType: '',
//       assetCategory: '',
//       itemName: '',
//       assetStatus: '',
//       manufacturer: '',
//       model: '',
//       acquisitionDate: '',
//       acquisitionPrice: '',
//       registrant: '',
//     };
//     setItems((prevItems) => [...prevItems, newItem]);
//     setScannerVisible(false);

//     if (scannerRef.current) {
//       scannerRef.current.clear();
//       scannerRef.current = null;
//     }
//   };

//   const onScanFailure = (error) => {
//     console.warn(`QR 스캔 실패: ${error}`);
//   };

//   const handleDelete = () => {
//     const selectedItems = items.filter(item => !item.selected);
//     setItems(selectedItems);
//   };

//   const handleRegister = () => {
//     setRegisteredItems((prev) => [...prev, ...items]);
//     setItems([]);
//     alert('등록 완료되었습니다.');
//   };

//   const handleSelectAll = (e) => {
//     const checked = e.target.checked;
//     const updatedItems = items.map(item => ({ ...item, selected: checked }));
//     setItems(updatedItems);
//   };

//   const handleSelectItem = (index) => {
//     const updatedItems = [...items];
//     updatedItems[index].selected = !updatedItems[index].selected;
//     setItems(updatedItems);
//   };

//   return (
//     <div className="audit-container">
//       <h2>실사 등록</h2>

//       <div className="top-section">
//         <img
//           src={barcodeIcon}
//           alt="바코드 스캔"
//           className="barcode-icon"
//           onClick={handleBarcodeClick}
//         />
//         <div className="search-bar">
//           <input
//             type="text"
//             placeholder="바코드 번호"
//             value={searchBarcode}
//             onChange={(e) => setSearchBarcode(e.target.value)}
//           />
//         </div>
//         <div className="button-group">
//           <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
//           <button className="register-btn" onClick={handleRegister}>등록하기</button>
//         </div>
//       </div>

//       {/* 항상 div를 만들어두고, visible만 조절 */}
//       <div
//         id="reader"
//         className="qr-reader"
//         style={{ display: scannerVisible ? 'block' : 'none' }}
//       ></div>

//       <table className="audit-table">
//         <thead>
//           <tr>
//             <th><input type="checkbox" onChange={handleSelectAll} /></th>
//             <th>바코드</th>
//             <th>회사구분</th>
//             <th>부서구분</th>
//             <th>세부위치</th>
//             <th>취득구분</th>
//             <th>자산분류</th>
//             <th>품목</th>
//             <th>자산상태</th>
//             <th>제조사</th>
//             <th>모델</th>
//             <th>취득일자</th>
//             <th>취득가</th>
//             <th>등록자</th>
//           </tr>
//         </thead>
//         <tbody>
//           {items.length === 0 ? (
//             <tr><td colSpan="14" className="no-data">스캔된 데이터가 없습니다.</td></tr>
//           ) : (
//             items.map((item, index) => (
//               <tr key={index}>
//                 <td><input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} /></td>
//                 <td>{item.barcode}</td>
//                 <td>{item.company}</td>
//                 <td>{item.department}</td>
//                 <td>{item.location}</td>
//                 <td>{item.acquisitionType}</td>
//                 <td>{item.assetCategory}</td>
//                 <td>{item.itemName}</td>
//                 <td>{item.assetStatus}</td>
//                 <td>{item.manufacturer}</td>
//                 <td>{item.model}</td>
//                 <td>{item.acquisitionDate}</td>
//                 <td>{item.acquisitionPrice}</td>
//                 <td>{item.registrant}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default AuditLoad;

import React, { useState, useRef, useEffect } from 'react';
=======
import React, { useMemo,useState, useRef, useEffect } from 'react';
>>>>>>> a48c2f1 (반응형 웹 수정)
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getAsset, saveItem, deleteItem, initDB } from '../../utils/db';
import axios from 'axios';
import './auditLoad.css';
import barcodeIcon from '../../assets/img/scan.png';

const AuditLoad = () => {
<<<<<<< HEAD
=======

    const search = new URLSearchParams(window.location.search);
  const queryMode = search.get('mode'); // 'web' | 'pda' | null

  const mode = useMemo(() => {
    if (queryMode === 'web' || queryMode === 'pda') return queryMode;
    // 자동감지: 화면 폭이나 UA로 PDA 추정
    const narrow = window.innerWidth <= 768;
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod/i.test(ua);
    return (narrow || isMobileUA) ? 'pda' : 'web';
  }, [queryMode]);
  
  const { user } = useContext(UserContext);
  const currentUserId   = user?.username || localStorage.getItem('username') || 'NO_ID';
  const currentUserName = user?.name     || localStorage.getItem('name')     || '실사 등록자 없음';

>>>>>>> a48c2f1 (반응형 웹 수정)
  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [registeredItems, setRegisteredItems] = useState([]);
  const scannerRef = useRef(null);
<<<<<<< HEAD
=======
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
        //console.error('IndexedDB 로드 오류:', err);
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
      //  console.error('법인 목록 불러오기 실패:', err);
        alert('법인 데이터를 불러오는 데 실패했습니다.');
      }
    };
    fetchLocations();
  }, [department, company]);
>>>>>>> a48c2f1 (반응형 웹 수정)

  useEffect(() => {
    if (scannerVisible && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerVisible]);

  const handleBarcodeClick = () => {
    setScannerVisible(true);
  };

  // const onScanSuccess = async (decodedText) => {
  //   try {
  //     const parsedData = JSON.parse(decodedText);

  //     const newItem = {
  //       barcode: parsedData.barcode || '',
  //       company: parsedData.company || '',
  //       department: parsedData.department || '',
  //       location: parsedData.location || '',
  //       acquisitionType: parsedData.acquisitionType || '구매자산',
  //       assetCategory: parsedData.assetCategory || '',
  //       itemName: parsedData.itemName || '',
  //       assetStatus: parsedData.assetStatus || '',
  //       manufacturer: parsedData.manufacturer || '',
  //       model: parsedData.model || '',
  //       acquisitionDate: parsedData.acquisitionDate || '',
  //       acquisitionPrice: parsedData.acquisitionPrice?.toLocaleString?.() || parsedData.acquisitionPrice || '',
  //       registrant: parsedData.registrant || '',
  //       selected: false
  //     };
  //     // ① 화면에 추가
  //     setItems(prev => [...prev, newItem]);

  //     // ② IndexedDB에도 저장
  //     await saveItem(newItem);

  //     setScannerVisible(false);
  //     if (scannerRef.current) {
  //       scannerRef.current.clear();
  //       scannerRef.current = null;
  //     }
  //   } catch (error) {
  //     alert("QR 코드 데이터가 유효한 JSON 형식이 아닙니다.");
  //     console.error("QR 파싱 에러:", error);
  //   }
  // };
  const [currentLocation, setCurrentLocation] = useState('전산실'); // 또는 로그인 시 저장된 위치 불러오기

  const onScanSuccess = async (decodedText) => {
<<<<<<< HEAD
    let parsedData;
=======
    let parsedData = null;
    try { parsedData = JSON.parse(decodedText); } catch { parsedData = null; }
    const barcode = parsedData?.barcode || decodedText.trim();
    const registrantId = currentUserId;
    const registrantName = currentUserName;
    const location = selectedLocationName;
    if (!selectedLocationId) {
      alert('세부위치를 먼저 선택하세요');
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
>>>>>>> a48c2f1 (반응형 웹 수정)
    try {
      parsedData = JSON.parse(decodedText); // ✅ QR이 JSON 형태면 전체 정보
    } catch {
      parsedData = null; // ✅ 아니면 바코드만 들어 있는 QR
    }
  
    let newItem;
    const barcode = parsedData?.barcode || decodedText.trim(); // 둘 다 지원
    const location = currentLocation; // 현재 실사 위치 (예: 전산실)
  
    if (parsedData) {
      // ✅ 자산 정보 전체 포함된 QR
      newItem = {
        barcode: parsedData.barcode || '',
        company: parsedData.company || '',
        department: parsedData.department || '',
        location: parsedData.location || '',
        acquisitionType: parsedData.acquisitionType || '구매자산',
        assetCategory: parsedData.assetCategory || '',
        itemName: parsedData.itemName || '',
        assetStatus: parsedData.assetStatus || '',
        manufacturer: parsedData.manufacturer || '',
        model: parsedData.model || '',
        acquisitionDate: parsedData.acquisitionDate || '',
        acquisitionPrice: parsedData.acquisitionPrice || '',
        registrant: parsedData.registrant || '',
        scannedAt: Date.now(),
        matched: parsedData.location === location,
        verified: true,
      };
    } else {
      // ✅ 바코드만 포함된 QR (운영용)
      try {
        const db = await initDB();
        const asset = await db.get('assets', barcode); // 기준 자산 조회
  
        if (asset) {
          newItem = {
            ...asset,
            scannedAt: Date.now(),
            matched: asset.location === location,
            verified: true,
          };
        } else {
          newItem = {
            barcode,
            location,
            new: true,
            scannedAt: Date.now(),
            matched: false,
            verified: true,
          };
        }
      } catch (err) {
        console.error('assets 조회 중 에러:', err);
        alert('로컬 DB 접근 중 오류가 발생했습니다.');
        return;
      }
    }
  
    setItems((prev) => [...prev, newItem]);      // 화면 리스트에 추가
    await saveItem(newItem);                     // inspection 스토어에 저장
  
    setScannerVisible(false);                    // 스캐너 종료
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
  };
  
  





  const onScanFailure = (error) => {
    console.warn(`QR 스캔 실패: ${error}`);
  };

  // const handleDelete = () => {
  //   setItems(items.filter(item => !item.selected));
  // };
  const handleDelete = async () => {
    const toDelete = items.filter(item => item.selected);
    const remaining = items.filter(item => !item.selected);
  
    for (const item of toDelete) {
      await deleteItem(item.barcode); // IndexedDB에서도 삭제
    }
  
    setItems(remaining); // 화면 상태 갱신
  };
  

  const handleRegister = async () => {
    const selectedItems = items.filter(item => item.selected);
  
    if (selectedItems.length === 0) {
      alert('등록할 항목을 선택하세요.');
      return;
    }
    const newItems = selectedItems.filter(item => item.new);
    const existingItems = selectedItems.filter(item => !item.new);
  
    try {
      if (existingItems.length > 0) {
        await axios.post('http://localhost:3000/audit/upload', existingItems);
      }
  
      if (newItems.length > 0) {
        await axios.post('http://localhost:3000/api/assets/register', newItems);
      }
  
      for (const item of selectedItems) {
        await deleteItem(item.barcode);
      }
  
      const remaining = items.filter(item => !item.selected);
      setItems(remaining);
      alert('등록이 완료되었습니다.');
    } catch (err) {
      console.error('등록 오류:', err);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setItems(items.map(item => ({ ...item, selected: checked })));
  };

  const handleSelectItem = (index) => {
    const updatedItems = [...items];
    updatedItems[index].selected = !updatedItems[index].selected;
    setItems(updatedItems);
  };

  const handleVerify = async () => {
    const verifiedItems = await Promise.all(items.map(async (item) => {
      try {
        const res = await axios.get(`/api/assets/${item.barcode}`);
  
        const isMatch = res.data.location === item.location;
  
        return {
          ...item,
          verified: true,
          matched: isMatch
        };
      } catch (err) {
        console.error(`검증 실패: ${item.barcode}`, err);
        return {
          ...item,
          verified: true,
          matched: false
        };
      }
    }));
  
    setItems(verifiedItems);
  };

  return (
    <div className={`audit-container ${mode === 'pda' ? 'audit-pda' : 'audit-web'}`}>
      <h2>실사 등록</h2>

      <div className="top-section">
        <img
          src={barcodeIcon}
          alt="바코드 스캔"
          className="barcode-icon"
          onClick={handleBarcodeClick}
        />
        <div className="search-bar">
          <input
            type="text"
            placeholder="바코드 번호"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
          <button className="verify-btn" onClick={handleVerify}>검증하기</button>
          <button className="register-btn" onClick={handleRegister}>등록하기</button>
        </div>
      </div>

      <div id="reader" className="qr-reader" style={{ display: scannerVisible ? 'block' : 'none' }}></div>

      <table className="audit-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAll} /></th>
            <th>바코드</th>
            <th>회사구분</th>
            <th>부서구분</th>
            <th>세부위치</th>
            <th>취득구분</th>
            <th>자산분류</th>
            <th>품목</th>
            <th>자산상태</th>
            <th>제조사</th>
            <th>모델</th>
            <th>취득일자</th>
            <th>취득가</th>
            <th>등록자</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="14" className="no-data">스캔된 데이터가 없습니다.</td></tr>
          ) : (
            items.map((item, index) => (
              <tr key={index}style={{backgroundColor: item.new
                  ? '#fffacd' // 신규: 노란색
                  : item.verified
                  ? item.matched
                  ? '#e0ffe0' // 일치: 초록
                  : '#ffe0e0' // 불일치: 빨강
                  : 'white'}}>
                <td><input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} /></td>
                <td>{item.barcode}</td>
                <td>{item.company}</td>
                <td>{item.department}</td>
                <td>{item.location}</td>
                <td>{item.acquisitionType}</td>
                <td>{item.assetCategory}</td>
                <td>{item.itemName}</td>
                <td>{item.assetStatus}</td>
                <td>{item.manufacturer}</td>
                <td>{item.model}</td>
                <td>{item.acquisitionDate}</td>
                <td>{item.acquisitionPrice}</td>
                <td>{item.registrant}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLoad;

// 실사
// 1. 로그인
// -캐시와 토큰이 저장
// 2. 자산등록 화면
// 3. 현재 실사할 위치 선택
//  - localDB로 해당 실사 위치에 대한 하는 데이터 저장
//  - 정보가 많을 수 있으니 로딩 표시추가

// 4. 인터넷 off
// 5. 자산 스캔 
//  - 스캔되자마자 바로 저장
//  - 삭제하기누르면 삭제
// 6. 자산이 현재 위치와 맞지 않으면 
//  - localDB에 있는 정보 변경
//  - 없으면 바코드만 저장하고 위치만 변경해서 동기화할때 저장
// 7. 인터넷 되는 곳에서 검증
//  - 추가로 검증하기 버튼 추가해서 클릭하면 DB와 비교해서 검증하기
//  - 등록하기는 검증하기 해서 완료되면 등록 
// 8. 완료되면 db 업로드
