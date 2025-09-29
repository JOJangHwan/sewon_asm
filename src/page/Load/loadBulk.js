import React, { useState, useEffect } from 'react';
import {useTranslation} from 'react-i18next';
import * as XLSX from 'xlsx';
import './loadBulk.css';
import useMediaQuery from '../../utils/hooks/useMediaQuery';
import { createRoot } from 'react-dom/client';
import LabelPrint from '../MyInfor/LabelPrint';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { getUILang, uiToI18n } from '../../utils/lang/pref';

// ✅ API 주소 상수 정의
const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

// ✅ bulk 인쇄용 (QR=10mm, 오른쪽으로 살짝 이동)
// ✅ bulk 인쇄용 — QR 10mm, 세로 이동 0mm(안잘림), 가로만 +로 조절
const openLabelPrintWindow = (assets, t) => {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return alert(t('LoadBulk_DisablePopupBlocker'));

  // ← 여기 숫자만 바꾸면 됩니다.
 const OFFSET_X_MM = 1.8;   
const OFFSET_Y_MM = 1.6;   

  w.document.write(`
    <html>
      <head>
        <title>라벨 인쇄</title>
        <style>
          @page { size: 40mm 15mm; margin: 0; }
          @media print { body { margin: 0; } }
          html, body { width:40mm; height:15mm; margin:0; padding:0; font-family:Arial, sans-serif; }

          .label-print-wrapper { display:flex; flex-direction:column; width:40mm; height:15mm; margin:0; padding:0; }
          .label-box {
            width:40mm; height:15mm; display:flex; align-items:center;
            box-sizing:border-box; page-break-after:always; margin:0;
            /* transform 삭제! → 잘림 방지 */
            padding-left:${1.6 + OFFSET_X_MM}mm;  /* 기본 1.6mm + X 오프셋 */
            padding-top:${OFFSET_Y_MM}mm;         /* Y 오프셋(0 이상 권장) */
          }

          .qr-section { width:12mm; height:100%; display:flex; justify-content:center; align-items:center; }
          /* 무엇으로 렌더되든 QR은 10mm 고정 */
          .qr-section > canvas, .qr-section > img, .qr-section > * {
            width:10mm !important; height:10mm !important;
          }

          .info-section { display:flex; flex-direction:column; justify-content:center; align-items:flex-start; padding-left:1.7mm; flex:1; }
          .text-line   { font-size:2.0mm; line-height:2.35mm; margin:0; white-space:nowrap; color:#000; }
          .barcode-text{ font-size:2.4mm; line-height:2.35mm; font-weight:700; text-align:left; align-self:flex-start; margin:0.2mm 0 0.1mm; }
          .category-line{ font-size:2.0mm; line-height:2.2mm; max-width:25mm; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);
  w.document.close();

 const timerId = setInterval(() => {
    const mount = w.document.getElementById('print-root');
    if (!mount) return;
    clearInterval(timerId);

    let printed = false;
    const safePrint = () => {
      if (printed) return; printed = true; w.focus(); w.print(); w.close();
    };

    const root = createRoot(mount);
    root.render(<LabelPrint selectedAssets={assets} onAllImagesLoaded={safePrint} />);
    setTimeout(safePrint, 500); // 백업
  }, 100);
};




// const TABLE_HEADERS = [
//   '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
//   '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자',
//   'CPU', 'RAM', '그래픽카드', '총 저장공간(GB)' // ✅ 추가됨
// ];
// //const EXCEL_HEADERS = TABLE_HEADERS.slice(0, -1); // 등록자 제외
// const EXCEL_HEADERS = [
//   '회사구분', '부서구분', '세부위치', '취득구분', '자산분류',
//   '품목', '자산상태', '제조사', '모델', '취득일자', '취득가', '등록자',
//   'CPU', 'RAM', '그래픽카드', '총 저장공간(GB)'
// ];
//const LOGIN_USER = '홍길동';

// i18n 기반 헤더들 (렌더 시점마다 t로 생성)
const makeTableHeaders = (t) => ([
  t('LoadBulk_CompanyType'),
  t('LoadBulk_DepartmentType'),
  t('LoadBulk_DetailLocation'),
  t('LoadBulk_AcquisitionType'),
  t('LoadBulk_AssetCategory'),
  t('LoadBulk_Item'),
  t('LoadBulk_AssetStatus'),
  t('LoadBulk_Manufacturer'),
  t('LoadBulk_Model'),
  t('LoadBulk_AcquisitionDate'),
  t('LoadBulk_AcquisitionCost'),
  t('LoadBulk_Registrar'),
  'CPU',
  'RAM',
  t('LoadBulk_GraphicsCard'),
  t('LoadBulk_TotalStorageGB'),
]);

const makeExeclHeaders = makeTableHeaders;



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
// 🔑  자산분류·품목 → id 매핑용


 const LoadBulk = () => {
 const { t, i18n } = useTranslation('loadbulk');
 const langI18n = i18n.language || 'ko'; // 'ko' | 'zh' | 'vi'
   const langUI = getUILang();          // 'KR' | 'CN' | 'VN'
  const TABLE_HEADERS = makeTableHeaders(t);
  const EXCEL_HEADERS = makeExeclHeaders(t);

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
  const modeClass = isMobile ? 'pda-mode' : 'web-mode';

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
      
        // 날짜 셀 처리
        newRow[9] = convertExcelDate(newRow[9]);
      
        const rowError = [];
      
        const [company, department, location] = [newRow[0], newRow[1], newRow[2]];
        const [category, item] = [
            String(newRow[4] || '').trim(),
            String(newRow[5] || '').trim()
          ];
           const validAcquisitionTypes = ['구매자산', '이관자산'];
           const validStatusTypes = ['사용', '미사용'];

      
        if (!newRow[5]) rowError.push(t('LoadBulk_Error_MissingItem'));
      
        if (!(company in companyMap)) {
         rowError.push(t('LoadBulk_Error_CompanyType'));
        } else if (!(department in companyMap[company])) {
          rowError.push(t('LoadBulk_Error_DepartmentType'));
        } else if (!companyMap[company][department].some(loc => loc.name === location)) {
          rowError.push(t('LoadBulk_Error_DetailLocation'));
        }
      
        if (!(category in assetCategoryMap)) {
          rowError.push(t('LoadBulk_Error_AssetCategory'));
        } else if (!assetCategoryMap[category].includes(item)) {
          rowError.push(t('LoadBulk_Error_Item'));
        }
      
         // 취득구분 체크
 if (!newRow[3] || String(newRow[3]).trim() === '') {
   rowError.push(t('LoadBulk_Error_MissingAcquisitionType'));
 } else if (!validAcquisitionTypes.includes(newRow[3])) {
   rowError.push(t('LoadBulk_Error_AcquisitionTypeConstraint'));
 }

 // 자산상태 체크
 if (!newRow[6] || String(newRow[6]).trim() === '') {
   rowError.push(t('LoadBulk_Error_MissingAssetStatus'));
 } else if (!validStatusTypes.includes(newRow[6])) {
   rowError.push(t('LoadBulk_Error_AssetStatusConstraint'));
 }
   // 1️⃣ 빈칸 먼저 체크
if (!newRow[9] || String(newRow[9]).trim() === '') {
  rowError.push(t('LoadBulk_Error_MissingAcquisitionDate'));
} else if (!dateRegex.test(newRow[9]) || isNaN(Date.parse(newRow[9]))) {
  rowError.push(t('LoadBulk_Error_InvalidDateFormat'));
}

if (!newRow[10] || String(newRow[10]).trim() === '') {
   rowError.push(t('LoadBulk_Error_MissingAcquisitionCost'));
} else if (!/^\d+$/.test(newRow[10])) {
  rowError.push(t('LoadBulk_Error_AcquisitionCostNotNumber'));
}

      
        // === 여기 추가! (노트북/컴퓨터일 때 CPU/메모리/그래픽카드 필수) ===
        if (['노트북', '컴퓨터'].includes(item)) {
// RAM: 입력했으면 숫자인지 확인
if (newRow[13] && !/^\d+$/.test(String(newRow[13]).trim())) {
  rowError.push(t('LoadBulk_Error_RamNotNumber'));
}

// 저장공간: 입력했으면 숫자인지 확인
if (newRow[15] && !/^\d+$/.test(String(newRow[15]).trim())) {
  rowError.push(t('LoadBulk_Error_StorageNotNumber'));
}
          //if (!newRow[12] || String(newRow[12]).trim() === '') rowError.push('CPU 누락'); 
          //if (!newRow[13] || String(newRow[13]).trim() === '') rowError.push('메모리 누락');
        //if (!newRow[14] || String(newRow[14]).trim() === '') rowError.push('그래픽카드 누락');
       // if (!newRow[15] || String(newRow[15]).trim() === '') rowError.push('저장공간 누락');
        }

        // ✅ 등록자 필수
if (!newRow[11] || String(newRow[11]).trim() === '') {
  rowError.push(t('LoadBulk_Error_MissingRegistrar'));
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
      alert(t('LoadBulk_SelectRowsToDelete'));
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
      alert(t('LoadBulk_PressRegisterAfterUpload'));
      return;
    }
  
    const validRows = selectedRows.length > 0
      ? selectedRows.filter(idx => !rowErrors[idx]).map(i => tableData[i])
      : tableData.filter((_, idx) => !rowErrors[idx]);
  
    if (validRows.length === 0) {
      alert(t('LoadBulk_NoRegistrableData'));
      return;
    }
  
    // 분기: 전자/일반
    const electronicRows = validRows.filter(row => ['노트북', '컴퓨터'].includes(row[5]));
    const generalRows    = validRows.filter(row => !['노트북', '컴퓨터'].includes(row[5]));
  
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
       //  console.log('📦 [POST /assets/bulk] payload:', JSON.stringify(payload, null, 2));
 const langUI = getUILang();                // 'KR'|'CN'|'VN'
 const langI18n = uiToI18n(langUI);        // 'ko'|'zh'|'vi'
 const res = await authFetchWithRefresh(`${API_BASE}/assets/bulk`, {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json',
     'Accept-Language': langI18n,
     'language': langUI,
   },
   body: JSON.stringify({ list: payload }),
 });
 //console.log('📡 [POST /assets/bulk] fetch 응답:', res);
 const result = await res.json();
 //console.log('📦 [POST /assets/bulk] 응답 JSON:', result);

      //  console.log('📦 응답 본문:', result);
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
 // console.log('🚀 전자자산 전송 리스트:', JSON.stringify(payload, null, 2));
        // const res = await authFetchWithRefresh('http://192.168.0.220:8888/assets/electronic/bulk', {
          const res = await authFetchWithRefresh(`${API_BASE}/assets/electronic/bulk`, {
          method: 'POST',
             headers: {
     'Content-Type': 'application/json',
     'Accept-Language': langI18n,
     'language': langUI,
   },
          body: JSON.stringify(payload),
          //body: JSON.stringify({ list: electronicRows.map(mapRowToBackend) }),
        });
        
     // console.log('📡 [POST /assets/electronic/bulk] fetch 응답:', res);
      const result = await res.json();
     // console.log('📦 [POST /assets/electronic/bulk] 응답 JSON:', result);
 
        lastResponseMessage = result.message || '';
        if (result.code === 1) {
          const barcodes = result.data;
          barcodes.forEach((barcode, i) => {
            allRegisteredAssets.push({ ...assetListFromRow(electronicRows[i]), barcode });
          });
        }
      }
      
      if (allRegisteredAssets.length > 0) {
        alert(`✅ ${allRegisteredAssets.length}${t('LoadBulk_RegisteredSuffix')}`);
        openLabelPrintWindow(allRegisteredAssets, t);
        handleReset();
      } else {
        alert('❌ ' + t('LoadBulk_RegisterFailed') + (lastResponseMessage || ''));
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
      //console.groupCollapsed('[❌ 등록 실패] 서버 응답');
     // console.log('📦 전체 응답:', err?.response || err);
    //  console.log('📡 상태 코드:', err?.response?.status);
    //  console.log('📝 에러 메시지:', msg);
      console.groupEnd();

      // 사용자 알림
      alert('🚨 ' + t('LoadBulk_ServerSendFailed') + msg);
    }
  };
  const mapRowToBackend = (row) => {
    const acquisitionTypeMap = { '구매자산': 0, '이관자산': 1 };
    const statusMap          = { '사용': 0, '미사용': 1 };
    
  
// 1. 입력값 추출 (trim 필수)
const inputCompany  = String(row[0] || '').trim();
const inputDept     = String(row[1] || '').trim();
const inputLocation = String(row[2] || '').trim();

// 1-1. 분류 / 품목 이름도 trim
const categoryName  = String(row[4] || '').trim();
const itemName      = String(row[5] || '').trim();

  // 🔍 콘솔 로그 추가
 // console.log('🔍 자산분류 이름:', categoryName);
 // console.log('🔍 품목 이름:', itemName);
 // console.log('📦 parentTypeIdMap:', parentTypeIdMap);
//  console.log('📦 childTypeIdMap:', childTypeIdMap);

  
  const parentTypeId = parentTypeIdMap[categoryName] ?? null;
  const childTypeId  = childTypeIdMap[categoryName]?.[itemName] ?? null;

//  console.log('✅ 추출된 parentTypeId:', parentTypeId);
 // console.log('✅ 추출된 childTypeId:', childTypeId);
  
    // 2. 이 위치에 콘솔 찍으세요!
  //  console.log('입력값:', inputCompany, inputDept, inputLocation);
  //  console.log('companyMap:', companyMap);
    if (companyMap[inputCompany]) {
   //   console.log('부서 리스트:', Object.keys(companyMap[inputCompany]));
      if (companyMap[inputCompany][inputDept]) {
    //    console.log('세부위치 리스트:', companyMap[inputCompany][inputDept].map(l => l.name));
      }
    }
  
    // 3. 매핑 시작
    let locationId = null;
    if (companyMap[inputCompany] && companyMap[inputCompany][inputDept]) {
      const matchedLoc = companyMap[inputCompany][inputDept].find(
        loc => (loc.name || '').trim() === inputLocation
      );
      if (matchedLoc) locationId = matchedLoc.id;
    }
    if (!locationId) {
      console.warn('[locationId 매칭 실패]', {
        inputCompany, inputDept, inputLocation,
        map: companyMap[inputCompany]?.[inputDept]
      });
    }
   // console.log('row[6](자산상태):', row[6], '=> status:', statusMap[row[6]]);
    return {
        locationId,                                           // 위치 ID
        division: acquisitionTypeMap[String(row[3] || '').trim()] ?? 0,
      
        // ⭐️ 반드시 숫자(id)로 보내야 함
          parentTypeId: parentTypeIdMap[categoryName]                ?? 0,
          childTypeId : childTypeIdMap[categoryName]?.[itemName]     ?? 0,
      
      status: statusMap[(row[6] || '').trim()] ?? 0,
      manufacturer: row[7],
      model: String(row[8] || '').trim(),
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
      t('LoadBulk_SewonElectronics'),
      t('LoadBulk_ITOperations'),
      t('LoadBulk_DataCenter'),
      t('LoadBulk_PurchasedOrTransferredOnly'),
      t('LoadBulk_ElectronicAsset'),
      t('LoadBulk_Laptop'),
      t('LoadBulk_InUseOrNotUseOnly'),
      t('LoadBulk_Manufacturer'),
      t('LoadBulk_Model'),
      '2024-01-15',
      '1200000',
      t('LoadBulk_Registrar'),
      'i5-1135G7',
      '16',
      t('LoadBulk_GraphicsCard'),
      '512'
    ];

   const warningRow = ['⚠️ ' + t('LoadBulk_SampleRowWarning')];
    
    
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
    <div className={`bulk-container ${modeClass}`}>
      <h2>{t('LoadBulk_Title')}</h2>

 {rowErrors.filter(Boolean).length > 0 && (
   <div className="error-summary">
     ⚠️ {t('LoadBulk_ErrorsFoundSummary_Prefix')} {rowErrors.filter(Boolean).length}{t('LoadBulk_ErrorsFoundSummary_Suffix')}
   </div>
 )}


  <div className="bulk-top-controls">
    <div className="controls-left">
      <button className="btn primary" onClick={handleDownloadTemplate}>{t('LoadBulk_DownloadTemplate')}</button>
      <input type="text" placeholder={t('LoadBulk_FileName')} value={fileName} readOnly className="file-name-input" />
      <label htmlFor="file-upload" className="btn upload">{t('LoadBulk_UploadTemplate')}</label>
      <input id="file-upload" type="file" hidden onChange={handleFileChange} />
    </div>

    <div className="controls-right">
      <button className="btn danger" onClick={handleDelete}>{t('LoadBulk_Delete')}</button>
      <button
        className={
          `btn success` +
          (selectedRows.length > 0 && selectedRows.every(idx => !!rowErrors[idx]) ? ' btn-error-disabled' : '')
        }
        onClick={handleRegister}
        disabled={selectedRows.length > 0 ? selectedRows.every(idx => !!rowErrors[idx]) : !isValid}
      >
        {t('LoadBulk_Register')}
      </button>
      <button className="btn gray" onClick={handleReset}>{t('LoadBulk_Reset')}</button>
    </div>

    {selectedRows.length > 0 && selectedRows.some(idx => !!rowErrors[idx]) && (
      <div className="register-error-alert">
        ⚠️ 에러가 있는 행은 등록할 수 없습니다. 에러가 없는 행만 선택해주세요.
      </div>
    )}
  </div>
{isMobile && (
  <div className="mobile-select-all">
    <label>
      <input
        type="checkbox"
        onChange={handleSelectAll}
        checked={isAllSelected}
      />
      {t('LoadBulk_SelectAll')}
    </label>
  </div>
)}


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
        <th>{t('LoadBulk_ErrorCause')}</th>
      </tr>
    </thead>
    <tbody>
      {/* 실제 데이터만 출력 */}
      {tableData.length === 0 ? (
<tr>
          <td colSpan={TABLE_HEADERS.length + 2}>{t('LoadBulk_NoUploadedData')}</td>
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
       <p>{t('LoadBulk_NoUploadedData')}</p>
     ) : (
       tableData.map((row, idx) => (
         <div key={idx} className={`bulk-card ${rowErrors[idx] ? 'row-error' : ''}`}>
           {/* 체크박스 왼쪽 고정 */}
           <div className="card-header">
             <input
               type="checkbox"
               checked={isRowSelected(idx)}
               onChange={() => handleSelectRow(idx)}
             />
           </div>
           {/* 등록자(11번) 제외, 2열 가로 배치 */}
           <div className="card-body">
             {TABLE_HEADERS.slice(0, 11).map((header, i) => (
               <div key={i} className="card-row">
                 <strong>{header}:</strong>&nbsp;<span>{row[i]}</span>
               </div>
             ))}
           </div>
           {rowErrors[idx] && <div className="error-text">⚠️ {rowErrors[idx]}</div>}
         </div>
       ))
     )}
   </div>
)}





    </div>
  );
};

export default LoadBulk;