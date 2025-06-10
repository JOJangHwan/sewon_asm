import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './loadBulk.css';
import useMediaQuery from '../../utils/hooks/useMediaQuery';

const TABLE_HEADERS = [
  '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
  '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자',
  'CPU', '메모리', '그래픽카드', '총 저장공간(GB)' // ✅ 추가됨
];
//const EXCEL_HEADERS = TABLE_HEADERS.slice(0, -1); // 등록자 제외
const EXCEL_HEADERS = [
  '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
  '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자',
  'CPU', '메모리', '그래픽카드', '총 저장공간(GB)'
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

// 예시 회사/부서/세부위치
const COMPANY_MAP = {
  '평택공장': {
    '전산운영P': ['전산실', '서버실'],
    '노무총무P': [],
    '품질보증P': [],
    '기술P': [],
    '개발P': [],
    '생산관리P': [],
    '영업P': [],
  },
  '서울사무소':{
    '감사인사P':[],
    '회계P':[],
    '원가P':[],
  },
  '우신에너지': {
    '경영관리P': ['본사 사무실'],
    '구매관리P': ['본사 사무실'],
    '자재관리P': ['창고'],
  },
  '경산공장장': {
    '경영관리P': ['본사 사무실'],
  },
  '우신비나': {
    '1공장': ['본사 사무실'],
    '2공장': ['본사 사무실'],
    '3공장': ['본사 사무실'],
  },
  '위해': {
    '경영관리P': ['본사 사무실'],
  },
  '덕주': {
    '경영관리P': ['본사 사무실'],
  },
};

// 예시 자산분류/품목
const ASSET_CATEGORY_MAP = {
  'IT': ['노트북', '데스크탑', '모니터'],
  '사무': ['의자', '책상'],
};

const LoadBulk = () => {
  const [fileName, setFileName] = useState('');
  const [tableData, setTableData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);

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
      
        if (!(company in COMPANY_MAP)) {
          rowError.push('회사구분 오류');
        } else if (!(department in COMPANY_MAP[company])) {
          rowError.push('부서구분 오류');
        } else if (!COMPANY_MAP[company][department].includes(location)) {
          rowError.push('세부위치 오류');
        }
      
        if (!(category in ASSET_CATEGORY_MAP)) {
          rowError.push('자산분류 오류');
        } else if (!ASSET_CATEGORY_MAP[category].includes(item)) {
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
          if (!newRow[12] || newRow[12].trim() === '') rowError.push('CPU 누락');
          if (!newRow[13] || newRow[13].trim() === '') rowError.push('메모리 누락');
          if (!newRow[14] || newRow[14].trim() === '') rowError.push('그래픽카드 누락');
          if (!newRow[15] || newRow[15].toString().trim() === '') rowError.push('저장공간 누락');
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
    const rowsToRegister = selectedRows.length > 0
      ? selectedRows.filter(idx => !rowErrors[idx]).map(i => tableData[i])
      : tableData.filter((_, idx) => !rowErrors[idx]);
  
    const finalJson = formatDataForJson(rowsToRegister);
  
    try {
      console.log('등록 버튼 눌림! 서버로 전송:', finalJson);
      const response = await fetch('http://localhost:8080/api/asset/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalJson),
      });
  
      const data = await response.json();
  
      if (data === 1) {
        alert('등록이 완료되었습니다!');
        handleReset();
      } else if (data === 0) {
        alert('❌ 등록 실패: 서버에서 처리 중 오류 발생');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('🚨 서버와의 연결에 실패했습니다.');
      console.error('서버 전송 에러:', error);
    }
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
      memory: row[13] || '',
      gpu: row[14] || '',
      totalStorage: row[15] || ''
    };


        return base;

  });

  // ✅ 바깥에 list 키로 묶어서 반환
  return { list: mappedList };
};



  const handleDownloadTemplate = () => {
    const exampleRow = [
      '예시: 평택공장',        // 회사구분
      '예시: 전산운영P',        // 부서구분
      '예시: 전산실',          // 세부위치
      '예시: 구매자산(자산)',    // 취득구분
      '예시: IT',             // 자산분류
      '예시: 노트북',          // 품목
      '예시: 사용',            // 자산상태
      '예시: 삼성',            // 제조사
      '예시: NT500R5W',       // 모델
      '예시: 2024-01-15',     // 취득일자
      '예시: 1200000',        // 취득가
      '예시: 홍길동',          // 등록자
      '예시: i5-1135G7',      // ✅ CPU
      '예시: 16GB',           // ✅ 메모리
      '예시: Intel Iris Xe',  // ✅ 그래픽카드
      '예시: 512'             // ✅ 저장공간(GB)
    ];

    const warningRow = ['⚠️ 이 줄은 예시입니다. 업로드 전에 반드시 삭제해주세요.'];
    
    
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

{selectedRows.length > 0 && selectedRows.every(idx => !!rowErrors[idx]) && (
  <div className="register-error-alert">
    ⚠️ 선택한 행에 모두 에러가 있습니다. 에러 없는 행만 등록할 수 있습니다.
  </div>
)}


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
        <th></th>
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