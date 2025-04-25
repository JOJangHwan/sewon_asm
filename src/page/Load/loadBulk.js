import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './loadBulk.css';

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
    '전산운영P': ['전산실', '서버실'],
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

  const handleRegister = () => {
    if (tableData.length === 0) {
      alert('등록할 데이터가 없습니다.');
      return;
    }
    alert('등록이 완료되었습니다!');
    // TODO: axios.post('/api/register', tableData);
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
      </div>

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
    </div>
  );
};

export default LoadBulk;
