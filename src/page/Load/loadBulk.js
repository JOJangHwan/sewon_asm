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
<<<<<<< HEAD
=======
  //db에서 가져오는 정보들을 맵핑하기 위한 정보
  const [companyMap,        setCompanyMap]        = useState(DUMMY_COMPANY_MAP);
   const [assetCategoryMap,  setAssetCategoryMap]  = useState(DUMMY_ASSET_MAP);

 // ⬇️ 이름→ID 변환에 쓰일 새 맵
 const [parentTypeIdMap, setParentTypeIdMap] = useState({});
 const [childTypeIdMap,  setChildTypeIdMap]  = useState({});

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
              a.locations.forEach(l => {
             //   console.log('[디버그] location 원본:', l);
              });
              map[c.name][a.department] = a.locations.map(l => ({
                name: l.location,
                id: l.locationId || l.id || l.code  // 실제 있는 키로!
              }));
            });
          });
         // console.log('🗺️ [CORP] final map:', map);
          setCompanyMap(map);
        }
  
        // ② 자산분류 - 품목 계층
        const assetRes = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
        const assetJson = await assetRes.json();
     //  console.log("방금"+JSON.stringify(assetJson, null, 2));
        if (assetJson.code === 1) {
          const map    = {};   // 화면(이름)용
          const pIdMap = {};   // 분류 id
          const cIdMap = {};   //  └─ 품목 id
          assetJson.data?.parentList?.forEach(p => {
            // map[p.name] = p.childList.map(c => c.name);
              map[p.name]         = (p.childList || []).map(c => c.name);
                            // 📌 서버마다 id 필드 명이 조금씩 달라질 수 있으니, 후보를 모두 검사
                          const parentIdRaw =
                              p.parentTypeId ??      // ① 우리 앱이 원래 기대했던 이름
                              p.parentId      ??      // ② 다른 팀에서 쓰는 이름
                              p.typeId        ??      // ③ 혹시 이런 이름?
                              p.id;                   // ④ 마지막 fallback
              
                            pIdMap[p.name] = Number(parentIdRaw); 
              cIdMap[p.name]      = {};
              (p.childList || []).forEach(c => {
                                const childIdRaw =
                                  c.childTypeId ??      // ①
                                  c.childId      ??      // ②
                                  c.typeId       ??      // ③
                                  c.id;                 // ④
                
                                cIdMap[p.name][c.name] = Number(childIdRaw);
              });
           // console.log([p.name])
          });
        //  console.log("✅ parentList 예시:", assetJson.data?.parentList);
        //  console.log('🗺️ [ASSET] final map:', map);
         // console.log("map"+map)
          setAssetCategoryMap(map);   // 이름 목록 (UI)
          setParentTypeIdMap(pIdMap); // 🔑 분류 → id
          setChildTypeIdMap(cIdMap);  // 🔑 (분류, 품목) → id
        }
      } catch (e) {
        console.error('데이터 불러오기 실패:', e);
      }
    })();
  }, []);
  
>>>>>>> a48c2f1 (반응형 웹 수정)
  const [fileName, setFileName] = useState('');
  const [tableData, setTableData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);
<<<<<<< HEAD
=======
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
  const modeClass = isMobile ? 'pda-mode' : 'web-mode';
>>>>>>> a48c2f1 (반응형 웹 수정)

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
    <div className={`bulk-container ${modeClass}`}>
      <h2>자산 일괄 등록</h2>

      {rowErrors.length > 0 && (
        <div className="error-summary">
          ⚠️ 총 {rowErrors.length}건의 오류가 있습니다. 빨간 줄과 오른쪽 메시지를 확인하세요.
        </div>
      )}

<<<<<<< HEAD
      <div className="bulk-top-controls">
        <button className="btn primary" onClick={handleDownloadTemplate}>양식 내려받기</button>
        <input type="text" placeholder="파일명" value={fileName} readOnly className="file-name-input" />
        <label htmlFor="file-upload" className="btn upload">양식 업로드</label>
        <input id="file-upload" type="file" hidden onChange={handleFileChange} />
        <button className="btn danger" onClick={handleDelete}>삭제하기</button>
        <button className="btn success" onClick={handleRegister} disabled={!isValid}>등록하기</button>
=======

  <div className="bulk-top-controls">
    <div className="controls-left">
      <button className="btn primary" onClick={handleDownloadTemplate}>양식 내려받기</button>
      <input type="text" placeholder="파일명" value={fileName} readOnly className="file-name-input" />
      <label htmlFor="file-upload" className="btn upload">양식 업로드</label>
      <input id="file-upload" type="file" hidden onChange={handleFileChange} />
    </div>

    <div className="controls-right">
      <button className="btn danger" onClick={handleDelete}>삭제하기</button>
      <button
        className={
          `btn success` +
          (selectedRows.length > 0 && selectedRows.every(idx => !!rowErrors[idx]) ? ' btn-error-disabled' : '')
        }
        onClick={handleRegister}
        disabled={selectedRows.length > 0 ? selectedRows.every(idx => !!rowErrors[idx]) : !isValid}
      >
        등록하기
      </button>
      <button className="btn gray" onClick={handleReset}>초기화</button>
         {/* ✅ PDA에서만: 초기화 버튼 바로 아래에 전체 선택 */}
    {isMobile && (
      <div className="select-all-container">
        <label>
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={isAllSelected}
          />
          전체 선택
        </label>
      </div>
    )}
    </div>
    

    {selectedRows.length > 0 && selectedRows.some(idx => !!rowErrors[idx]) && (
      <div className="register-error-alert">
        ⚠️ 에러가 있는 행은 등록할 수 없습니다. 에러가 없는 행만 선택해주세요.
>>>>>>> a48c2f1 (반응형 웹 수정)
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
<<<<<<< HEAD
      </table>
=======
      </table> */}
      {/* === 📋 테이블 (PC 전용) === */}
 {!isMobile && (
  <div className="table-wrapper">
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
  </div>
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
          </div>
 {TABLE_HEADERS.slice(0, 12).map((header, i) => (
   <div key={i} className="card-row">
     <strong>{header}:</strong>
     <span className="value">{row[i]}</span>
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




>>>>>>> a48c2f1 (반응형 웹 수정)
    </div>
  );
};

export default LoadBulk;
