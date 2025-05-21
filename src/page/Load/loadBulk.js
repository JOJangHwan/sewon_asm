import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './loadBulk.css';
import useMediaQuery from '../../utils/hooks/useMediaQuery';

const TABLE_HEADERS = [
  '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
  '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자'
];

const EXCEL_HEADERS = TABLE_HEADERS.slice(0, -1); // 등록자 제외
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
    '전산운영': ['전산실', '서버실'],
    '회계팀': ['재무실'],
  },
  '우신에너지': {
    '경영관리': ['본사 사무실'],
    '자재관리': ['창고'],
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
        newRow.length = 12;
        newRow[11] = LOGIN_USER;

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
      alert('등록할 데이터가 없습니다.');
      return;
    }

    // ✅ 어떤 데이터를 보낼지 결정 (선택된 행 또는 전체)
    const rowsToRegister = selectedRows.length > 0
    ? selectedRows.map((i) => tableData[i])
    : tableData;
      // JSON 데이터를 콘솔에 출력
     //console.log('Sending data to the server:', JSON.stringify(tableData)); // 서버로 전송할 데이터 확인
  // JSON 데이터를 콘솔에 출력
    //console.log('Sending data to the server:', JSON.stringify(formatDataForJson(tableData))); // 서버로 전송할 데이터 확인

     // ✅ 콘솔로 확인
  if (selectedRows.length > 0) {
    console.log(`✅ 선택된 ${selectedRows.length}건만 등록합니다.`);
  } else {
    console.log(`✅ 선택된 행이 없어 전체 ${tableData.length}건을 등록합니다.`);
  }

  // ✅ 최종 JSON 확인
  const finalJson = formatDataForJson(rowsToRegister);
  console.log('📤 전송 JSON 데이터:', JSON.stringify(finalJson, null, 2));

     // 서버로 데이터 전송
  try {
    const response = await fetch('http://localhost:8080/api/asset/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // 서버에 JSON 데이터를 전송
      },
      body: JSON.stringify(formatDataForJson(tableData)), // tableData를 JSON으로 변환하여 전송
    });

    const data = await response.json(); // 응답 데이터 받기

    if (data === 1) { // 서버에서 1을 응답 받으면 등록 완료
      alert('등록이 완료되었습니다!');
      console.log('서버 응답 데이터:', data);
    } else if (data === 0) { // 서버에서 0을 응답 받으면 등록 실패
      alert('❌ 등록 실패: 서버에서 처리 중 오류 발생');
    } else {
      alert('알 수 없는 오류가 발생했습니다.');
    }
  } catch (error) {
    alert('🚨 서버와의 연결에 실패했습니다.');
    console.error('Error:', error);
  }
};

// tableData를 JSON 형태로 변환하는 함수
const formatDataForJson = (data) => {
  const mappedList = data.map((row) => {
    return {
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
    };
  });

  // ✅ 바깥에 list 키로 묶어서 반환
  return { list: mappedList };
};



  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'asset_template.xlsx');
  };

  const isRowSelected = (index) => selectedRows.includes(index);

  return (
    <div className="bulk-container">
      <h2>자산 일괄 등록</h2>

      {rowErrors.length > 0 && (
        <div className="error-summary">
          ⚠️ 총 {rowErrors.length}건의 오류가 있습니다. 빨간 줄과 오른쪽 메시지를 확인하세요.
        </div>
      )}

      <div className="bulk-top-controls">
        <button className="btn primary" onClick={handleDownloadTemplate}>양식 내려받기</button>
        <input type="text" placeholder="파일명" value={fileName} readOnly className="file-name-input" />
        <label htmlFor="file-upload" className="btn upload">양식 업로드</label>
        <input id="file-upload" type="file" hidden onChange={handleFileChange} />
        <button className="btn danger" onClick={handleDelete}>삭제하기</button>
        <button className="btn success" onClick={handleRegister} disabled={!isValid}>등록하기</button>
        <button className="btn" onClick={handleReset}>초기화</button>
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
          {TABLE_HEADERS.slice(0, -1).map((header, i) => (
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
