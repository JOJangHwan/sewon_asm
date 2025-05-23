import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getAsset, saveItem, deleteItem, initDB, saveLocation, getLocation } from '../../utils/db';
import axios from 'axios';
import './auditLoad.css';
import barcodeIcon from '../../assets/img/scan.png';

const AuditLoad = () => {
  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [registeredItems, setRegisteredItems] = useState([]);
  const scannerRef = useRef(null);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const LOCATION_DATA = {
    '평택공장': {
      '전산운영팀': ['전산실', '서버실'],
      '회계팀': ['재무실']
    },
    '우신에너지': {
      '자재관리': ['창고'],
      '경영관리': ['본사 사무실']
    }
  };


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

  const [currentLocation, setCurrentLocation] = useState('');

  useEffect(() => {
    const loadSavedLocation = async () => {
      const saved = await getLocation();
      setCurrentLocation(saved || '');
    };
    loadSavedLocation();
  }, []);

  const onScanSuccess = async (decodedText) => {
    let parsedData;
    try {
      parsedData = JSON.parse(decodedText); // ✅ QR이 JSON 형태면 전체 정보
    } catch {
      parsedData = null; // ✅ 아니면 바코드만 들어 있는 QR
    }
  
    let newItem;
    const barcode = parsedData?.barcode || decodedText.trim(); // 둘 다 지원
    //const location = currentLocation; // 현재 실사 위치 (예: 전산실)
    const location = parsedData?.location || currentLocation || '';// QR에 있으면 쓰고, 없으면 비워둠


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
    <div className="audit-container">
      <h2>실사 등록</h2>

      <div className="top-section">
  {/* 1줄: 실사 위치 (왼쪽 정렬) */}
  <div className="location-wrapper">
  <div className="location-select-3depth">
    <label>📍 실사 위치:</label>

    <select value={selectedCompany} onChange={(e) => {
      const company = e.target.value;
      setSelectedCompany(company);
      setSelectedDepartment('');
      setSelectedLocation('');
    }}>
      <option value="">-- 회사 선택 --</option>
      {Object.keys(LOCATION_DATA).map(company => (
        <option key={company} value={company}>{company}</option>
      ))}
    </select>

    <select value={selectedDepartment} onChange={(e) => {
      const dept = e.target.value;
      setSelectedDepartment(dept);
      setSelectedLocation('');
    }} disabled={!selectedCompany}>
      <option value="">-- 부서 선택 --</option>
      {selectedCompany && Object.keys(LOCATION_DATA[selectedCompany]).map(dept => (
        <option key={dept} value={dept}>{dept}</option>
      ))}
    </select>

    <select value={currentLocation} onChange={async (e) => {
      const location = e.target.value;
      setCurrentLocation(location);
      await saveLocation(location);
    }} disabled={!selectedDepartment}>
      <option value="">-- 세부위치 선택 --</option>
      {selectedCompany && selectedDepartment &&
        LOCATION_DATA[selectedCompany][selectedDepartment].map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
    </select>
  </div>
  </div>


  {/* 2줄: 바코드 아이콘 + 입력창 (왼쪽), 버튼 3개 (오른쪽) */}
  <div className="barcode-row-split">
    <div className="barcode-left">
      <img
        src={barcodeIcon}
        alt="바코드 스캔"
        className="barcode-icon"
        onClick={handleBarcodeClick}
      />
      <input
        type="text"
        placeholder="바코드 번호"
        value={searchBarcode}
        onChange={(e) => setSearchBarcode(e.target.value)}
      />
    </div>

    <div className="barcode-buttons">
      <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
      <button className="verify-btn" onClick={handleVerify}>검증하기</button>
      <button className="register-btn" onClick={handleRegister}>등록하기</button>
    </div>
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

      {/* ✅ 모바일 카드형 목록 (PC에서는 안 보임) */}
<div className="audit-card-list">
  {items.map((item, index) => (
    <div
      key={index}
      className="audit-card"
      style={{
        backgroundColor: item.new
          ? '#fffacd'
          : item.verified
          ? item.matched
            ? '#e0ffe0'
            : '#ffe0e0'
          : 'white'
      }}
    >
      <div className="audit-card-header">
        <span className="barcode">{item.barcode}</span>
        <input
          type="checkbox"
          checked={item.selected || false}
          onChange={() => handleSelectItem(index)}
        />
      </div>
      <div className="audit-card-row"><strong>회사:</strong> {item.company}</div>
      <div className="audit-card-row"><strong>부서:</strong> {item.department}</div>
      <div className="audit-card-row"><strong>위치:</strong> {item.location}</div>
      <div className="audit-card-row"><strong>취득구분:</strong> {item.acquisitionType}</div>
      <div className="audit-card-row"><strong>자산분류:</strong> {item.assetCategory}</div>
      <div className="audit-card-row"><strong>품목:</strong> {item.itemName}</div>
      <div className="audit-card-row"><strong>상태:</strong> {item.assetStatus}</div>
      <div className="audit-card-row"><strong>제조사:</strong> {item.manufacturer}</div>
      <div className="audit-card-row"><strong>모델:</strong> {item.model}</div>
      <div className="audit-card-row"><strong>취득일:</strong> {item.acquisitionDate}</div>
      <div className="audit-card-row"><strong>취득가:</strong> {item.acquisitionPrice}</div>
      <div className="audit-card-row"><strong>등록자:</strong> {item.registrant}</div>
    </div>
  ))}
</div>

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
//  - 팝업창이 나온다-> 현재위치로 변경하겠냐 변경하지 않겠냐
//  - 변경을 누르면 LocalDB 정보 변경경
//  - 변경하지 않으면 변경 X
//  - 실사가 잘 진행되면 초록색, 변경되어야하면 노란색, 이상하거나 변경X면 빨간색색
//  - 변경해야되는 부분은 바코드만 입력되고 검증할때 확인
// 7. 인터넷 되는 곳에서 검증
//  - 추가로 검증하기 버튼 추가해서 클릭하면 DB와 비교해서 검증하기
//  - 등록하기는 검증하기 해서 완료되면 등록 
// 8. 완료되면 db 업로드
