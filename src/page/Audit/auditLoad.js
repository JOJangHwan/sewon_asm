// import React, { useState, useRef, useEffect } from 'react';
// import { Html5QrcodeScanner } from 'html5-qrcode';
// import { saveItem, deleteItem, initDB } from '../../utils/db';
// import axios from 'axios';
// import './auditLoad.css';
// import barcodeIcon from '../../assets/img/scan.png';
// import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';


// const AuditLoad = () => {


  
//   const [searchBarcode, setSearchBarcode] = useState('');
//   // items: [{ barcode, location, registrant, selected, new }]
//   const [items, setItems] = useState([]);
//   const [scannerVisible, setScannerVisible] = useState(false);
//   const [scannerInstance, setScannerInstance] = useState(null);

//   // “세부위치” 선택 상태
//   const [locationOptions, setLocationOptions] = useState([]);
 
//   const [selectedLocation, setSelectedLocation] = useState('');

//   // LOCATION_DATA 정의 (예시)
//   // const LOCATION_DATA = {
//   //   '평택공장': {
//   //     '전산운영팀': ['전산실', '서버실'],
//   //     '회계팀': ['재무실']
//   //   },
//   //   '우신에너지': {
//   //     '자재관리': ['창고'],
//   //     '경영관리': ['본사 사무실']
//   //   }
//   // };
//   // flatten하여 모든 세부위치 목록 생성
//   const LOCATION_OPTIONS = Object.values(LOCATION_DATA)
//   .flatMap(deptObj => Object.values(deptObj))
//   .flat();

//   const scannerRef = useRef(null);

//   useEffect(() => {
//     const fetchLocations = async () => {
//       try {
//         const res = await authFetchWithRefresh('http://192.168.0.220:8888/corporations', {
//           method: 'POST'
//         });
//         const data = await res.json();
//         const corporationList = data.data.corporationList;

//         for (const corp of corporationList) {
//           if (corp.name === userCorporation) {
//             for (const aff of corp.affiliationList) {
//               if (aff.department === userDepartment) {
//                 const locations = aff.locations.map(loc => loc.location);
//                 setLocationOptions(locations);
//                 return;
//               }
//             }
//           }
//         }
//         setLocationOptions([]);
//       } catch (err) {
//         console.error('법인 데이터 불러오기 실패:', err);
//       }
//     };
//     fetchLocations();
//   }, []);

//   useEffect(() => {
//     if (scannerVisible && !scannerRef.current) {
//       const scanner = new Html5QrcodeScanner(
//         'reader',
//         { fps: 10, qrbox: { width: 250, height: 250 } },
//         false
//       );
//       scanner.render(onScanSuccess, onScanFailure);
//       setScannerInstance(scanner);
//       scannerRef.current = true;
//     }
//     return () => {
//       // cleanup: 스캐너 인스턴스가 있으면 clear
//       if (scannerInstance) {
//         scannerInstance.clear().catch((e) =>
//           console.warn('scanner clear error', e)
//         );
//         scannerRef.current = null;
//         setScannerInstance(null);
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [scannerVisible]);

//   // 바코드 아이콘 클릭 → 먼저 세부위치가 선택되어 있는지 체크
//   const handleBarcodeClick = () => {
//     if (!selectedLocation) {
//       alert('먼저 세부위치를 선택해주세요.');
//       return;
//     }
//     setScannerVisible(true);
//   };

//   const onScanSuccess = async (decodedText) => {
//     // decodedText가 JSON이면 파싱하여 barcode, registrant, location 꺼냄
//     let parsedData = null;
//     try {
//       parsedData = JSON.parse(decodedText);
//     } catch {
//       parsedData = null;
//     }

//     // barcode: QR 내부값 혹은 순수 텍스트
//     const barcode = parsedData?.barcode || decodedText.trim();
//     // registrant: QR 내부값 있으면 parsedData.registrant, 없으면 '홍길동'
//     const registrant = parsedData?.registrant || '홍길동';
//     // location: “QR 내부에 location이 있어도”, 무조건 사용자가 선택한 selectedLocation으로 덮어쓰기
//     const location = selectedLocation;

//     // 1) 로컬 DB(IndexedDB) 연동: 동일 barcode 존재 여부 확인
//     let existsInDB = false;
//     try {
//       const db = await initDB();
//       const existing = await db.get('inspection', barcode);
//       if (existing) {
//         existsInDB = true;
//       }
//     } catch (err) {
//       console.error('IndexedDB 접근 에러:', err);
//     }

//     // 2) 중복이 아니면 items에 추가 & 로컬 DB에 save
//     if (!existsInDB) {
//       const newItem = {
//         barcode,
//         location,
//         registrant,
//         selected: false,
//         new: true // 신규 표시용 플래그
//       };
//       setItems((prev) => [...prev, newItem]);
//       await saveItem({ barcode, location, registrant });
//     }

//     // 3) 스캐너 종료
//     setScannerVisible(false);
//     if (scannerInstance) {
//       await scannerInstance.clear();
//       scannerRef.current = null;
//       setScannerInstance(null);
//     }
//   };

//   const onScanFailure = (error) => {
//     console.warn(`QR 스캔 실패: ${error}`);
//   };

//   // 삭제: 선택된 항목들만 로컬 DB에서 지우고 화면에서도 제거
//   const handleDelete = async () => {
//     const toDelete = items.filter((item) => item.selected);
//     if (toDelete.length === 0) {
//       alert('삭제할 항목을 선택하세요.');
//       return;
//     }
//     for (const item of toDelete) {
//       await deleteItem(item.barcode);
//     }
//     setItems(items.filter((item) => !item.selected));
//   };

//   // 등록하기: 선택된 항목만 백엔드로 전송, JSON에 barcode, location, registrant 만 포함
//   const handleRegister = async () => {
//     const selectedItems = items.filter((item) => item.selected);
//     const itemsToRegister = selectedItems.length === 0 ? items : selectedItems;
  
//     if (itemsToRegister.length === 0) {
//       alert('등록할 항목이 없습니다.');
//       return;
//     }
  
//     const payload = {
//       list: itemsToRegister.map((item) => ({
//         barcode: item.barcode,
//         location: item.location,
//         registrant: item.registrant,
//       }))
//     };
  
//     try {
//       const response = await axios.post('http://localhost:3000/audit/upload', payload);
  
//       if (response.data === 1) {
//         for (const item of itemsToRegister) {
//           await deleteItem(item.barcode);
//         }
//         setItems(items.filter((item) => !item.selected));
//         alert('✅ 등록이 완료되었습니다.');
//       } else if (response.data === 0) {
//         alert('❌ 등록 실패: 서버에서 실패 처리');
//       } else {
//         alert('⚠️ 등록 실패: 알 수 없는 응답');
//       }
//     } catch (err) {
//       console.error('등록 오류:', err);
//       alert('🚨 등록 중 오류가 발생했습니다. 담당자에게 문의하세요.');
//     }
//   };

//   const handleSelectAll = (e) => {
//     const checked = e.target.checked;
//     setItems(items.map((item) => ({ ...item, selected: checked })));
//   };

//   const handleSelectItem = (index) => {
//     const updated = [...items];
//     updated[index].selected = !updated[index].selected;
//     setItems(updated);
//   };

//   return (
//     <div className="audit-container">
//       <h2>실사 등록</h2>

//       {/* 1. 세부위치 선택 */}
//       <div className="location-wrapper">
//         <label>📍 세부위치:</label>
//         <select
//           value={selectedLocation}
//           onChange={(e) => setSelectedLocation(e.target.value)}
//         >
//           <option value="">-- 세부위치 선택 --</option>
//           {locationOptions.map((loc) => (
//   <option key={loc} value={loc}>
//     {loc}
//   </option>
// ))}
//         </select>
//       </div>

//       {/* 2. 바코드 스캔 버튼 + 직접 입력 + 제어 버튼 */}
//       <div className="barcode-row-split">
//         <div className="barcode-left">
//           <img
//             src={barcodeIcon}
//             alt="바코드 스캔"
//             className="barcode-icon"
//             onClick={handleBarcodeClick}
//             style={{
//               cursor: selectedLocation ? 'pointer' : 'not-allowed',
//               opacity: selectedLocation ? 1 : 0.5
//             }}
//           />
//           <input
//             type="text"
//             placeholder="바코드 직접 입력 후 Enter"
//             value={searchBarcode}
//             onChange={(e) => setSearchBarcode(e.target.value)}
//             onKeyDown={async (e) => {
//               if (e.key === 'Enter' && searchBarcode.trim()) {
//                 if (!selectedLocation) {
//                   alert('먼저 세부위치를 선택해주세요.');
//                   return;
//                 }
//                 const barcode = searchBarcode.trim();
//                 const registrant = '홍길동';
//                 const location = selectedLocation;
//                 // 중복 저장 방지
//                 const exists = items.some((it) => it.barcode === barcode);
//                 if (!exists) {
//                   const newItem = {
//                     barcode,
//                     location,
//                     registrant,
//                     selected: false,
//                     new: true
//                   };
//                   setItems((prev) => [...prev, newItem]);
//                   await saveItem({ barcode, location, registrant });
//                 }
//                 setSearchBarcode('');
//               }
//             }}
//           />
//         </div>

//         <div className="barcode-buttons">
//           <button className="delete-btn" onClick={handleDelete}>
//             삭제하기
//           </button>
//           <button className="register-btn" onClick={handleRegister}>
//             등록하기
//           </button>
//         </div>
//       </div>

//       {/* 3. QR 스캐너 뷰포트 */}
//       <div
//         id="reader"
//         className="qr-reader"
//         style={{ display: scannerVisible ? 'block' : 'none' }}
//       ></div>

//       {/* 4. PC용 테이블 (바코드 / 세부위치 / 등록자) */}
//       <table className="audit-table">
//         <thead>
//           <tr>
//             <th>
//               <input
//                 type="checkbox"
//                 onChange={handleSelectAll}
//                 checked={items.every((it) => it.selected) && items.length > 0}
//               />
//             </th>
//             <th>바코드</th>
//             <th>세부위치</th>
//             <th>등록자</th>
//           </tr>
//         </thead>
//         <tbody>
//           {items.length === 0 ? (
//             <tr>
//               <td colSpan="4" className="no-data">
//                 스캔된 데이터가 없습니다.
//               </td>
//             </tr>
//           ) : (
//             items.map((item, index) => (
//               <tr
//                 key={index}
//                 className={item.selected ? 'selected-row' : ''}
//                 style={{ backgroundColor: item.new ? '#fffacd' : 'transparent' }}
//               >
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={item.selected || false}
//                     onChange={() => handleSelectItem(index)}
//                   />
//                 </td>
//                 <td>{item.barcode}</td>
//                 <td>{item.location}</td>
//                 <td>{item.registrant}</td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>

//       {/* 5. 모바일용 카드형 리스트 (바코드 / 세부위치 / 등록자) */}
//       <div className="audit-card-list">
//         {items.map((item, index) => (
//           <div
//             key={index}
//             className={`audit-card ${item.selected ? 'selected-row' : ''}`}
//             style={{ backgroundColor: item.new ? '#fffacd' : 'transparent' }}
//           >
//             <div className="audit-card-header">
//               <span className="barcode">{item.barcode}</span>
//               <input
//                 type="checkbox"
//                 checked={item.selected || false}
//                 onChange={() => handleSelectItem(index)}
//               />
//             </div>
//             <div className="audit-card-row">
//               <strong>위치:</strong> {item.location}
//             </div>
//             <div className="audit-card-row">
//               <strong>등록자:</strong> {item.registrant}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AuditLoad;

import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { saveItem, deleteItem, initDB } from '../../utils/db';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import axios from 'axios';
import './auditLoad.css';
import barcodeIcon from '../../assets/img/scan.png';

const AuditLoad = () => {
  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const scannerRef = useRef(null);

  const [department, setDepartment] = useState('');



  // 사용자 정보: 실제 로그인한 사용자 소속으로 바꾸세요
  // const userCorporation = '한국금증';
  // const userDepartment = '전산팀';

  useEffect(() => {
    const fetchLocations = async () => {
      const savedDepartment = localStorage.getItem('department');
      if (savedDepartment) setDepartment(savedDepartment);
      console.log("내 소속:"+ savedDepartment)
      try {
        //const token = localStorage.getItem('accessToken');
        const response = await authFetchWithRefresh('http://192.168.0.220:8888/corporations');
    
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
    if (!selectedLocation) {
      alert('먼저 세부위치를 선택해주세요.');
      return;
    }
    setScannerVisible(true);
  };

  const onScanSuccess = async (decodedText) => {
    let parsedData = null;
    try {
      parsedData = JSON.parse(decodedText);
    } catch {
      parsedData = null;
    }
    const barcode = parsedData?.barcode || decodedText.trim();
    const registrant = parsedData?.registrant || '홍길동';
    const location = selectedLocation;

    let existsInDB = false;
    try {
      const db = await initDB();
      const existing = await db.get('inspection', barcode);
      if (existing) existsInDB = true;
    } catch (err) {
      console.error('IndexedDB 접근 에러:', err);
    }

    if (!existsInDB) {
      const newItem = { barcode, location, registrant, selected: false, new: true };
      setItems((prev) => [...prev, newItem]);
      await saveItem({ barcode, location, registrant });
    }

    setScannerVisible(false);
    if (scannerInstance) {
      await scannerInstance.clear();
      scannerRef.current = null;
      setScannerInstance(null);
    }
  };

  const onScanFailure = (error) => {
    console.warn(`QR 스캔 실패: ${error}`);
  };

  const handleDelete = async () => {
    const toDelete = items.filter((item) => item.selected);
    if (toDelete.length === 0) return alert('삭제할 항목을 선택하세요.');
    for (const item of toDelete) await deleteItem(item.barcode);
    setItems(items.filter((item) => !item.selected));
  };

  const handleRegister = async () => {
    const selectedItems = items.filter((item) => item.selected);
    const itemsToRegister = selectedItems.length === 0 ? items : selectedItems;

    if (itemsToRegister.length === 0) return alert('등록할 항목이 없습니다.');

    const payload = {
      barcodes: itemsToRegister.map(item => item.barcode),
      auditingDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      realLocation: selectedLocation
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await authFetchWithRefresh('http://192.168.0.220:8888/stock-takings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      const result = await response.json();
  
      if (result.code === 1) {
        for (const item of itemsToRegister) await deleteItem(item.barcode);
        setItems(items.filter((item) => !item.selected));
        alert('✅ 실사 등록이 완료되었습니다.');
      } else {
        alert('❌ 등록 실패: 서버 응답 오류');
      }
    } catch (err) {
      console.error('등록 오류:', err);
      alert('🚨 등록 중 오류가 발생했습니다. 관리자에게 문의하세요.');
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
  value={selectedLocation}
  onChange={(e) => setSelectedLocation(e.target.value)}
>
  <option value="">-- 세부위치 선택 --</option>
  {locationOptions.map((loc) => (
    <option key={loc.id} value={loc.location}>
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
            style={{ cursor: selectedLocation ? 'pointer' : 'not-allowed', opacity: selectedLocation ? 1 : 0.5 }}
          />
          <input
            type="text"
            placeholder="바코드 직접 입력 후 Enter"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && searchBarcode.trim()) {
                if (!selectedLocation) return alert('먼저 세부위치를 선택해주세요.');
                const barcode = searchBarcode.trim();
                const registrant = '홍길동';
                const location = selectedLocation;
                const exists = items.some((it) => it.barcode === barcode);
                if (!exists) {
                  const newItem = { barcode, location, registrant, selected: false, new: true };
                  setItems((prev) => [...prev, newItem]);
                  await saveItem({ barcode, location, registrant });
                }
                setSearchBarcode('');
              }
            }}
          />
        </div>
        <div className="barcode-buttons">
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
                <td>{item.registrant}</td>
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
            <div className="audit-card-row"><strong>등록자:</strong> {item.registrant}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditLoad;
