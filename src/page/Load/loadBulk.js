import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './loadBulk.css';
import useMediaQuery from '../../utils/hooks/useMediaQuery';
import { createRoot } from 'react-dom/client';
import LabelPrint from '../MyInfor/LabelPrint';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';

// ✅ API 주소 상수 정의
const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

const openLabelPrintWindow = (assets) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return alert('팝업 차단을 해제해주세요.');

  printWindow.document.write(`
    <html>
      <head>
        <title>라벨 인쇄</title>
        <style>
          @page {
            size: 40mm 15mm;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 40mm;
            height: 15mm;
          }
          .label-print-wrapper {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            width: 40mm;
            height: 15mm;
            margin: 0;
            padding: 0;
          }
          .label-box {
            width: 40mm;
            height: 15mm;
            display: flex;
            align-items: center;
            background: white;
            page-break-after: always;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          .qr-section {
            width: 13mm;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .qr-canvas {
            width: 11.5mm !important;
            height: 11.5mm !important;
          }
          .info-section {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding-left: 1.5mm;
          }
          .logo-wrapper {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            margin-bottom: 0.3mm;
          }
          .logo {
            display: block;
            max-width: 32mm;
            height: 5.5mm;
            object-fit: contain;
            margin: 0;
            padding: 0;
          }
          .text-line {
            font-size: 2.2mm;
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            white-space: nowrap;
            color: black;
          }
          .barcode-text {
            font-size: 2.6mm;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);
  printWindow.document.close();

  const interval = setInterval(() => {
    const container = printWindow.document.getElementById('print-root');
    if (container) {
      clearInterval(interval);
      const root = createRoot(container);
      root.render(
        <LabelPrint
          selectedAssets={assets}
          onAllImagesLoaded={() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }}
        />
      );
    }
  }, 100);
};

const TABLE_HEADERS = [
  '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
  '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자',
  'CPU', 'RAM', '그래픽카드', '총 저장공간(GB)' // ✅ 추가됨
];
//const EXCEL_HEADERS = TABLE_HEADERS.slice(0, -1); // 등록자 제외
const EXCEL_HEADERS = [
  '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
  '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자',
  'CPU', 'RAM', '그래픽카드', '총 저장공간(GB)'
];
const LOGIN_USER = '홍길동';



// 날짜 숫자 → yyyy-mm-dd 변환
const convertExcelDate = (value) => {
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    const yyyy = date.y;
    const mm = String(date.m).padStart(2, '0');
    const dd = String(date.d).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return value;
};


// 서버에서 받아쓴 데이터를 담을 state
const DUMMY_COMPANY_MAP = {  }
const DUMMY_ASSET_MAP   = {  }

const LoadBulk = () => {
  //db에서 가져오는 정보들을 맵핑하기 위한 정보
  const [companyMap,        setCompanyMap]        = useState(DUMMY_COMPANY_MAP);
  const [assetCategoryMap,  setAssetCategoryMap]  = useState(DUMMY_ASSET_MAP);

  useEffect(() => {
    (async () => {
      try {
        // ① 회사-부서-세부위치 계층
        const corpRes = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const corpJson = await corpRes.json();
        if (corpJson.code === 1) {
          const map = {};
          corpJson.data?.corporationList?.forEach(c => {
            map[c.name] = {};
            c.affiliationList?.forEach(a => {
                map[c.name][a.department] = a.locations.map(l => ({
                    name: l.location,
                    id: l.id
                  }));
            });
          });
          console.log('🗺️ [CORP] final map:', map);
          setCompanyMap(map);
        }
  
        // ② 자산분류 - 품목 계층
        const assetRes = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
        const assetJson = await assetRes.json();
        console.log("방금"+JSON.stringify(assetJson, null, 2));
        if (assetJson.code === 1) {
          const map = {};
          assetJson.data?.parentList?.forEach(p => {
            // map[p.name] = p.childList.map(c => c.name);
            map[p.name] = (p.childList || []).map(c => c.name);
            console.log([p.name])
          });
          console.log('🗺️ [ASSET] final map:', map);
          console.log("map"+map)
          setAssetCategoryMap(map);
        }
      } catch (e) {
        console.error('서버 계층 데이터 불러오기 실패:', e);
      }
    })();
  }, []);
  
  const [fileName, setFileName] = useState('');
  const [tableData, setTableData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
    // ✅ 전체 선택 여부
  const isAllSelected = tableData.length > 0 && selectedRows.length === tableData.length;

  // ✅ 전체 선택 토글
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows([]);
    } else {
      // 오류 행도 포함해서 “보이는 행 전부” 선택
      setSelectedRows(tableData.map((_, idx) => idx));
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const content = data.slice(1);

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const errors = [];

      const validated = content.map((row, i) => {
        const newRow = [...row];
        newRow.length = 16;
        if (i !== 0) newRow[11] = LOGIN_USER; // 인덱스 0 = 엑셀의 2번째 줄
      
        // 날짜 셀 처리
        newRow[9] = convertExcelDate(newRow[9]);
      
        const rowError = [];
      
        const [company, department, location] = [newRow[0], newRow[1], newRow[2]];
        const [category, item] = [newRow[4], newRow[5]];
      
        if (!newRow[5]) rowError.push('품목 누락');
      
        if (!(company in companyMap)) {
          rowError.push('회사구분 오류');
        } else if (!(department in companyMap[company])) {
          rowError.push('부서구분 오류');
        } else if (!companyMap[company][department].includes(location)) {
          rowError.push('세부위치 오류');
        }
      
        if (!(category in assetCategoryMap)) {
          rowError.push('자산분류 오류');
        } else if (!assetCategoryMap[category].includes(item)) {
          rowError.push('품목 오류');
        }
      
        if (!dateRegex.test(newRow[9]) || isNaN(Date.parse(newRow[9]))) {
          rowError.push('날짜 형식 오류');
        }
      
        if (!/^\d+$/.test(newRow[10])) {
          rowError.push('취득가 숫자 아님');
        }
      
        // === 여기 추가! (노트북/컴퓨터일 때 CPU/메모리/그래픽카드 필수) ===
        if (['노트북', '컴퓨터'].includes(item)) {
          if (!newRow[12] || String(newRow[12]).trim() === '') rowError.push('CPU 누락'); if (!newRow[13] || String(newRow[13]).trim() === '') rowError.push('메모리 누락');
        if (!newRow[14] || String(newRow[14]).trim() === '') rowError.push('그래픽카드 누락');
        if (!newRow[15] || String(newRow[15]).trim() === '') rowError.push('저장공간 누락');
        }
      
        if (rowError.length > 0) {
          errors[i] = rowError.join(', ');
        }
      
        return newRow;
      });
      

      setTableData(validated);
      setRowErrors(errors);
      setIsValid(errors.length === 0);
      setSelectedRows([]);
    };

    reader.readAsBinaryString(file);
  };
  //양식초기화
  const handleReset = () => {
    setFileName('');
    setTableData([]);
    setSelectedRows([]);
    setRowErrors([]);
    setIsValid(true);
  
    // 파일 input 요소도 초기화 (선택된 파일 제거)
    const input = document.getElementById('file-upload');
    if (input) input.value = '';
  };


  const handleSelectRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert('삭제할 행을 선택하세요.');
      return;
    }
    const newData = tableData.filter((_, idx) => !selectedRows.includes(idx));
    const newErrors = rowErrors.filter((_, idx) => !selectedRows.includes(idx));
    setTableData(newData);
    setRowErrors(newErrors);
    setIsValid(newErrors.length === 0);
    setSelectedRows([]);
  };

  const handleRegister = async () => {
    if (tableData.length === 0) {
      alert('양식 업로드 후 등록하기를 눌러주세요.');
      return;
    }
  
    const validRows = selectedRows.length > 0
      ? selectedRows.filter(idx => !rowErrors[idx]).map(i => tableData[i])
      : tableData.filter((_, idx) => !rowErrors[idx]);
  
    if (validRows.length === 0) {
      alert('등록 가능한 데이터가 없습니다.');
      return;
    }
  
    // 분기: 전자/일반
    const electronicRows = validRows.filter(row => ['노트북', '데스크탑'].includes(row[5]));
    const generalRows    = validRows.filter(row => !['노트북', '데스크탑'].includes(row[5]));
  
    const assetListFromRow = (row) => ({
      company: row[0],
      department: row[1],
      location: row[2],
      acquisitionType: row[3],
      assetCategory: row[4],
      itemName: row[5],
      assetStatus: row[6],
      manufacturer: row[7],
      model: row[8],
      acquisitionDate: row[9],
      acquisitionPrice: Number(row[10]).toLocaleString(),
      registrant: row[11],
      cpu: row[12] || '',
      ram: row[13] || '',
      gpu: row[14] || '',
      storage: row[15] || ''
    });
  
    try {
      const allRegisteredAssets = [];

      let lastResponseMessage = '';
  
      if (generalRows.length > 0) {
        const payload = generalRows.map(mapRowToBackend);

        // ✅ 여기서 전송 내용 확인
        // console.log('📦 [POST /assets/bulk] payload:', JSON.stringify(payload, null, 2));
        // // const res = await authFetchWithRefresh('http://192.168.0.220:8888/assets/bulk', {
        //   const res = await authFetchWithRefresh(`${API_BASE}/assets/bulk`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ list: generalRows.map(mapRowToBackend) }),
        // });
         console.log('📦 [POST /assets/bulk] payload:', JSON.stringify(payload, null, 2));
 const res = await authFetchWithRefresh(`${API_BASE}/assets/bulk`, {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ list: payload }),
 });
        console.log('📡 응답 상태코드:', res.status);   // ← 200, 403, 500 등 출력됨
        console.log('📡 응답 ok:', res.ok);     


        const result = await res.json();

        console.log('📦 응답 본문:', result);
        if (!res.ok) {
          console.error('❌ 응답 실패:', result);
          throw new Error(result.message || '서버 응답 실패');
        }
        lastResponseMessage = result.message || '';
        if (result.code === 1) {
          const barcodes = result.data;
          barcodes.forEach((barcode, i) => {
            allRegisteredAssets.push({ ...assetListFromRow(generalRows[i]), barcode });
          });
        }
      }
      
      if (electronicRows.length > 0) {
        const payload = {
          list: electronicRows.map(mapRowToBackend),
        };
          // 🔍 전송 데이터 로그 출력
  console.log('🚀 전자자산 전송 리스트:', JSON.stringify(payload, null, 2));
        // const res = await authFetchWithRefresh('http://192.168.0.220:8888/assets/electronic/bulk', {
          const res = await authFetchWithRefresh(`${API_BASE}/assets/electronic/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          //body: JSON.stringify({ list: electronicRows.map(mapRowToBackend) }),
        });
        const result = await res.json();
        lastResponseMessage = result.message || '';
        if (result.code === 1) {
          const barcodes = result.data;
          barcodes.forEach((barcode, i) => {
            allRegisteredAssets.push({ ...assetListFromRow(electronicRows[i]), barcode });
          });
        }
      }
      
      if (allRegisteredAssets.length > 0) {
        alert(`✅ ${allRegisteredAssets.length}건 등록 완료!`);
        openLabelPrintWindow(allRegisteredAssets);
        handleReset();
      } else {
        alert(`❌ 등록 실패: ${lastResponseMessage || '알 수 없는 오류'}`);
      }
  
    } catch (err) {
      let msg = '알 수 없는 오류';

      // 백엔드에서 내려주는 메시지 추출
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }

      // ✅ 콘솔 출력 (디버깅용)
      console.groupCollapsed('[❌ 등록 실패] 서버 응답');
      console.log('📦 전체 응답:', err?.response || err);
      console.log('📡 상태 코드:', err?.response?.status);
      console.log('📝 에러 메시지:', msg);
      console.groupEnd();

      // 사용자 알림
      alert(`🚨 서버 전송 실패: ${msg}`);
    }
  };

  const mapRowToBackend = (row) => {
    const acquisitionTypeMap = {
      '구매자산': 0,
      '대여자산': 1
    };
    const statusMap = {
      '사용': 0,
      '미사용': 1
    };
      // ✅ 세부위치 ID 매핑
  let locationId = null;
  try {
    const deptList = Object.entries(companyMap[row[0]] || {});
    for (const [deptName, locList] of deptList) {
      if (deptName === row[1]) {
        const matchedLocation = locList.find(loc => loc.name === row[2]);
        if (matchedLocation) {
          locationId = matchedLocation.id;
          break;
        }
      }
    }
  } catch (e) {
    console.warn('locationId 매핑 실패:', row[0], row[1], row[2]);
  }
  
    return {
      corporation: row[0],
      department: row[1],
      location: row[2],
      locationId,
      division: acquisitionTypeMap[row[3]],
      division: acquisitionTypeMap[row[3]] ?? 0,
      parentType: row[4],
      childType: row[5],
      status: statusMap[row[6]],
      manufacturer: row[7],
      model: row[8],
      acquisitionDate: row[9] + 'T00:00:00',
      acquisitionPrice: Number(row[10]),
      registrant: row[11] || '',
      cpu: row[12] || '',
      ram: row[13] || '',
      gpu: row[14] || '',
      storage: row[15] || ''
    };
  };
  
  
  

// tableData를 JSON 형태로 변환하는 함수
const formatDataForJson = (data) => {
  const mappedList = data.map((row) => {
    const base = {
      company: row[0], // 회사구분
      department: row[1], // 부서구분
      location: row[2], // 세부위치
      acquisitionType: row[3], // 취득구분
      assetCategory: row[4], // 자산분류
      item: row[5], // 품목
      assetStatus: row[6], // 자산상태
      manufacturer: row[7], // 제조사
      model: row[8], // 모델
      acquisitionDate: row[9], // 취득일자
      acquisitionCost: row[10], // 취득가
      registrant: row[11], // 등록자
      cpu: row[12] || '',
      ram: row[13] || '',
      gpu: row[14] || '',
      storage: row[15] || ''
    };


        return base;

  });

  // ✅ 바깥에 list 키로 묶어서 반환
  return { list: mappedList };
};



  const handleDownloadTemplate = () => {
    const exampleRow = [
      '평택공장',        // 회사구분
      '전산운영',        // 부서구분
      '전산실',          // 세부위치
      '구매자산 또는 대여자산(2가지만 작성해야됨)',    // 취득구분
      '전자자산',             // 자산분류
      '노트북',          // 품목
      '사용 또는 미사용(2가지만 작성해야됨)',            // 자산상태
      '삼성',            // 제조사
      'NT500R5W',       // 모델
      '2024-01-15',     // 취득일자
      '1200000',        // 취득가
      '홍길동',          // 등록자
      'i5-1135G7',      // ✅ CPU
      '16GB',           // ✅ RAM
      'Intel Iris Xe',  // ✅ 그래픽카드
      '512'             // ✅ 저장공간(GB)
    ];

    const warningRow = ['⚠️ 이 줄은 예시입니다. 업로드 전에 반드시 삭제해주세요. 오타나지않게 작성해주세요'];
    
    
    const worksheet = XLSX.utils.aoa_to_sheet([
      EXCEL_HEADERS,   // 1행: 헤더
      exampleRow,      // 2행: 예시
      warningRow       // 3행: 안내 멘트 (한 셀만 채우고 나머지는 공백)
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'asset_template.xlsx');
  };

  const isRowSelected = (index) => selectedRows.includes(index);

// row를 항상 헤더 개수만큼 맞추고 빈 값은 ''로 채워주는 함수
const getFixedRow = (row) => {
  const arr = [...row];
  arr.length = TABLE_HEADERS.length;
  return arr.map(cell => cell === undefined ? '' : cell);
};



  return (
    <div className="bulk-container">
      <h2>자산 일괄 등록</h2>

      {rowErrors.filter(e => !!e).length > 0 && (
  <div className="error-summary">
    ⚠️ 총 {rowErrors.filter(e => !!e).length}건의 오류가 있습니다. 빨간 줄과 오른쪽 메시지를 확인하세요.
  </div>
)}


      <div className="bulk-top-controls">
        <button className="btn primary" onClick={handleDownloadTemplate}>양식 내려받기</button>
        <input type="text" placeholder="파일명" value={fileName} readOnly className="file-name-input" />
        <label htmlFor="file-upload" className="btn upload">양식 업로드</label>
        <input id="file-upload" type="file" hidden onChange={handleFileChange} />
        <button className="btn danger" onClick={handleDelete}>삭제하기</button>
        
        {/* // 등록버튼 활성/비활성 조건 */}
<button
  className={
    `btn success` +
    (
      selectedRows.length > 0 &&
      selectedRows.every(idx => !!rowErrors[idx])
        ? ' btn-error-disabled' : ''
    )
  }
  onClick={handleRegister}
  disabled={
    selectedRows.length > 0
      ? selectedRows.every(idx => !!rowErrors[idx])
      : !isValid
  }
>
  등록하기
</button>

<button className="btn" onClick={handleReset}>초기화</button>
        {/* 등록 버튼 위나 아래 아무 곳에! */}
{selectedRows.length > 0 && selectedRows.some(idx => !!rowErrors[idx]) && (
  <div className="register-error-alert">
    ⚠️ 에러가 있는 행은 등록할 수 없습니다. 에러가 없는 행만 선택해주세요.
  </div>
)}

      </div>

      {/* <table className="bulk-table">
        <thead>
          <tr>
            <th></th>
            {TABLE_HEADERS.map((header, idx) => <th key={idx}>{header}</th>)}
            <th>에러 원인</th>
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan="14">업로드된 데이터가 없습니다.</td>
            </tr>
          ) : (
            tableData.map((row, idx) => (
              <tr
                key={idx}
                className={`${isRowSelected(idx) ? 'selected' : ''} ${rowErrors[idx] ? 'row-error' : ''}`}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={isRowSelected(idx)}
                    onChange={() => handleSelectRow(idx)}
                  />
                </td>
                {row.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
                <td className="error-text">{rowErrors[idx] || ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table> */}
      {/* === 📋 테이블 (PC 전용) === */}
      {!isMobile && (
  <table className="bulk-table">

         <thead>
   <tr>
     <th>
       <input
         type="checkbox"
         onChange={handleSelectAll}
         checked={isAllSelected}
       />
     </th>
        {TABLE_HEADERS.map((header, idx) => <th key={idx}>{header}</th>)}
        <th>에러 원인</th>
      </tr>
    </thead>
    <tbody>
      {/* 실제 데이터만 출력 */}
      {tableData.length === 0 ? (
        <tr>
          <td colSpan={TABLE_HEADERS.length + 2}>업로드된 데이터가 없습니다.</td>
        </tr>
      ) : (
        tableData.map((row, idx) => (
          <tr
            key={idx}
            className={`${isRowSelected(idx) ? 'selected' : ''} ${rowErrors[idx] ? 'row-error' : ''}`}
          >
            <td>
              <input
                type="checkbox"
                checked={isRowSelected(idx)}
                onChange={() => handleSelectRow(idx)}
              />
            </td>
            {getFixedRow(row).map((cell, i) => (
              <td key={i}>{cell}</td>
            ))}
            <td
  className="error-text"
  title={rowErrors[idx] || ''}
>
  {(rowErrors[idx] && rowErrors[idx].length > 25)
    ? rowErrors[idx].slice(0, 25) + '...'
    : (rowErrors[idx] || '')}
</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
)}


{/* === 📱 카드형 목록 (모바일 전용) === */}
{isMobile && (
    <div className="bulk-card-list">
      {/* ✅ 모바일 전체 선택 */}
      <div className="mobile-select-all">
        <label>
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={isAllSelected}
          /> 전체 선택
        </label>
      </div>
    {tableData.length === 0 ? (
      <p>업로드된 데이터가 없습니다.</p>
    ) : (
      tableData.map((row, idx) => (
        <div key={idx} className={`bulk-card ${rowErrors[idx] ? 'row-error' : ''}`}>
          <div className="card-header">
            <input
              type="checkbox"
              checked={isRowSelected(idx)}
              onChange={() => handleSelectRow(idx)}
            />
            <strong>등록자:</strong> {row[11]}
          </div>
          {TABLE_HEADERS.slice(0, 12).map((header, i) => (
            <div key={i} className="card-row">
            <strong>{header}:</strong> {row[i]}
            </div>
          ))}
          {rowErrors[idx] && (
            <div className="error-text">⚠️ {rowErrors[idx]}</div>
          )}
        </div>
      ))
    )}
  </div>
)}




    </div>
  );
};

export default LoadBulk;