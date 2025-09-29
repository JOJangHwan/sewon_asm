import React, { useState, useEffect, useRef } from "react";
import "./Search.css";
import { authFetchWithRefresh } from "../../utils/authFetchWithRefresh";  // 인증 포함 fetch 함수 사용
import { createRoot } from "react-dom/client";
import LabelPrint from "../MyInfor/LabelPrint";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";     
import { getUILang, uiToI18n } from "../../utils/lang/pref"; // ✅ 언어 유틸
const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";


export default function Search() {
    const { t } = useTranslation("search");                     

  // ✅ 모든 fetch 옵션에 언어 헤더 자동 부착
  const withLang = (opts = {}) => {
    const ui = getUILang();           // 'KR' | 'CN' | 'VN'
    const lng = uiToI18n(ui);         // 'ko' | 'zh' | 'vi'
    return {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        "X-Client-Lang": lng,
        "X-Client-Lang-UI": ui,
      },
    };
  };
  const [companyData, setCompanyData] = useState({});
  const [assetCategoryData, setAssetCategoryData] = useState({});
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [searched, setSearched] = useState(false);

  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewCount, setViewCount] = useState(0);
  
    const [companyList, setCompanyList] = useState([]);
    const [companyIdMap, setCompanyIdMap] = useState({});  // ✅ ID 매핑용

    const [parentTypeId, setParentTypeId] = useState(null);  // 자산 분류 ID
    const [assetCategoryMap, setAssetCategoryMap] = useState({});

    const [childTypeId, setChildTypeId] = useState(null);  
    const [statusFilter, setStatusFilter] = useState("");   // ✅ 상태 필터
    const STATUS_CODE = { "사용": 0, "미사용": 1, "폐각": 2 }; // ✅ 서버 코드 맵 (필요 시 조정)  

    const headerCheckboxRef = useRef(); // ✅ ref 선언

    
     const [selectedItem, setSelectedItem] = useState(null); // 🆕 선택된 항목 저장
     const [isDetailOpen, setIsDetailOpen] = useState(false); // 🆕 상세 패널 열림 여부
    

    const [corporationId, setCorporationId] = useState(null);
const [affiliationId, setAffiliationId] = useState(null);
const [locationId, setLocationId] = useState(null);


 // ▼ Web/PDA 모드 상태 (auto | web | pda)
const effectiveMode = useResponsiveMode();



// ▼ 기존 handlePrint 를 이걸로 교체
const handlePrint = () => {
  if (selected.size === 0) {
    alert(t("Search_Warn_SelectAtLeastOnePrintItem"));
    return;
  }

  const toPrint = items.filter((it) => selected.has(it.barcode));

  const popup = window.open('', '_blank', 'width=900,height=600');
  if (!popup) {
    alert(t("Search_PopupBlocked"));
    return;
  }

  // ✅ 로고 제거, 바코드 좌정렬, 3줄 구조용 CSS
  const VERTICAL_OFFSET_MM = 1.2; // ← 여기 숫자만 조절하면 더 위/아래로 이동
  popup.document.write(`
    <html>
      <head>
        <title>${t("Search_LabelPrint")}</title>
        <style>
          /* === Label Print - Clean CSS (40x15mm) === */
          @page { size: 40mm 15mm; margin: 0; }
          @media print { body { margin: 0; } }
          html, body { width:40mm; height:15mm; margin:0; padding:0; font-family:Arial, sans-serif; }

          .label-print-wrapper { display:flex; flex-direction:column; width:40mm; height:15mm; margin:0; padding:0; }

          .label-box {
            width:40mm; height:15mm; display:flex; align-items:center;
            page-break-after:always; box-sizing:border-box;
            padding-left:1.4mm; /* QR 왼쪽 여백 */
            padding-top:${VERTICAL_OFFSET_MM}mm; /* ★ 위 여백을 조금 주어 전체를 아래로 */
          }

          .qr-section { width:13mm; height:100%; display:flex; justify-content:center; align-items:center; }
          .qr-canvas  { width:11.0mm !important; height:11.0mm !important; }

          .info-section {
            display:flex; flex-direction:column; align-items:flex-start; justify-content:center;
            padding-left:1.7mm; /* 텍스트 왼쪽 여백 */
            flex:1;
          }

          /* 공통 텍스트 */
          .text-line {
            font-size:2.0mm; line-height:2.35mm;
            margin:0; padding:0; white-space:nowrap; color:#000;
          }

          /* 2열: 바코드(좌정렬, 볼드) */
          .barcode-text {
            font-size:2.4mm; line-height:2.35mm; font-weight:700;
            text-align:left; align-self:flex-start;
            margin:0.2mm 0 0.1mm;
          }

          /* 3열: 자산분류 + 품목 (공백만, 말줄임) */
          .category-line {
            font-size:2.0mm; line-height:2.2mm;
            max-width:25mm; /* 40 - 13(QR) - 1.7(padding) 대략 */
            overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);
  popup.document.close();

  // React로 실제 라벨 렌더 → 인쇄
  const timer = setInterval(() => {
    const mount = popup.document.getElementById('print-root');
    if (mount) {
      clearInterval(timer);
      const root = createRoot(mount);
      root.render(
        <LabelPrint
          selectedAssets={toPrint}
          onAllImagesLoaded={() => {
            popup.focus();
            popup.print();
            popup.close();
          }}
        />
      );
    }
  }, 100);
};



  /* -----------------------------------------------------------
     📑 Excel 다운로드
  ----------------------------------------------------------- */
  const handleExportExcel = () => {
    if (!items.length) {
      alert(t("Search_NoDataToExport"));
      return;
    }

      // ✅ 선택한 항목만 내려받기
  const isSelectAll = selected.size === 0; // 체크 없으면 모두 내려받기
  const exportTarget = isSelectAll
    ? items
    : items.filter(item => selected.has(item.barcode));

    if (exportTarget.length === 0) {
      alert("선택한 데이터가 없습니다.");
      return;
    }

    // 1) 시트에 넣을 JSON 데이터 작성
    const exportData = exportTarget.map(item => ({
      바코드: item.barcode,
      회사: item.corporation,
      부서: item.department,
      위치: item.location,
      자산분류: item.parentCategory,
      품목: item.childCategory,
      상태: item.status,
      제조사: item.manufacturer,
      모델: item.model,
      취득일자: item.acquisitionDate,
      취득가: item.acquisitionPrice,
      등록자: item.registerName,
       등록일자: item.registrationDate,  // ✅ 등록일자 추가
 CPU: ["노트북", "컴퓨터"].includes(item.childCategory) ? item.cpu : "",
 GPU: ["노트북", "컴퓨터"].includes(item.childCategory) ? item.gpu : "",
 RAM: ["노트북", "컴퓨터"].includes(item.childCategory) ? item.ram + " GB" : "",
 총저장장치: ["노트북", "컴퓨터"].includes(item.childCategory) ? item.storage + " GB" : "",
    }));

    // 2) 워크시트/워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t("Search_AssetList"));

    // 3) 클라이언트에 저장
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob   = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, t("Search_ExportFileName"));
  };













  /* ===== 체크박스 핸들러 ===== */
  // (1) 단일 행 토글
  const toggleRow = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // (2) 전체선택 토글
  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === items.length
        ? new Set()                    // 모두 해제
        : new Set(items.map((it) => it.barcode)) // 모두 선택
    );

  useEffect(() => {
    const fetchCorporation = async () => {
      try {
        // const res = await authFetchWithRefresh('http://192.168.0.220:8888/corporations');
        const res = await authFetchWithRefresh(`${API_BASE_URL}/corporations`, withLang());
        const result = await res.json();
    
      //  console.log("📦 corporations API 응답 전체 (JSON 형태):");//자산 찍는 부분분
        //console.log(JSON.stringify(result, null, 2));
    
        if (result.code === 1 && result.data?.corporationList) {
          const nestedData = {};      // UI용: {회사명: {부서명: [위치명]}}
          const idMap = {};           // ID 추적용: {회사명: {id, departments: {...}}}
          const names = [];
    
          result.data.corporationList.forEach(corp => {
            const corpName = corp.name;
            const corpId = corp.corporationId;
            names.push(corpName);
    
            nestedData[corpName] = {};
            idMap[corpName] = {
              id: corpId,
              departments: {},
            };
    
            corp.affiliationList.forEach(aff => {
              const deptName = aff.department;
              const deptId = aff.affiliationId;  // ✅ 수정
              const locationList = aff.locations.map(loc => loc.location);
              const locationMap = {};
    
              aff.locations.forEach(loc => {
                //locationMap[loc.location] = loc.id;
                locationMap[loc.location] = loc.locationId;  // ✅ 수정
              });
    
              nestedData[corpName][deptName] = locationList;
              idMap[corpName].departments[deptName] = {
                id: deptId,
                locations: locationMap,
              };
            });
          });
  
          setCompanyData(nestedData);
          setCompanyList(names); // ✅ 회사명 리스트 저장
          setCompanyIdMap(idMap);  // ✅ ID 매핑까지 저장
        } else {
          alert(result.message || t("Search_Error_LoadCorporationFailed"));
        }
              // 자산 유형 계층 정보 가져오기
              // const typeRes = await authFetchWithRefresh('http://192.168.0.220:8888/asset-types/hierarchy');
              const typeRes = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`, withLang());
              const typeResult = await typeRes.json();

              //console.log("📦 부서 API 응답 전체 (JSON 형태):");
             // console.log(JSON.stringify(typeResult, null, 2));
              
              if (typeResult.code === 1 && typeResult.data?.parentList) {
                const nestedAssetType = {};
                const typeIdMap = {};
              //  console.log('자산 분류 데이터:', nestedAssetType);
                typeResult.data.parentList.forEach(parent => {
                  const parentName = parent.name;
                  const parentId = parent.parentId;

                  const children = Array.isArray(parent.childList) ? parent.childList : [];
                  nestedAssetType[parentName] = children.map(child => child.name);
                  typeIdMap[parentName] = {
                    id: parentId,
                    children: {},
                  };

                  
                  children.forEach(child => {
                    typeIdMap[parentName].children[child.name] = child.childId;
                  });

                });
                setAssetCategoryData(nestedAssetType);
                setAssetCategoryMap(typeIdMap); // ✅ ID map 저장
              } else {
                alert(typeResult.message || t("Search_Error_LoadAssetTypeFailed"));
              }





    } catch (err) {
      console.error('초기 데이터 조회 실패:', err);
      alert(t("Search_Error_LoadInitialDataFailed"));
    }
  };
  
    fetchCorporation();
  }, []);


  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        selected.size > 0 && selected.size < items.length;
    }
  }, [selected, items]);
  
  // useEffect(() => {
  //   const fetchLookups = async () => {
  //     try {
  //       const res1 = await fetch("http://localhost:8080/api/lookups/companies");
  //       const company = await res1.json();
  //       setCompanyData(company);

  //       const res2 = await fetch("http://localhost:8080/api/lookups/categories");
  //       const category = await res2.json();
  //       setAssetCategoryData(category);
  //     } catch (err) {
  //       console.error("lookup 불러오기 실패", err);
  //     }
  //   };
  //   fetchLookups();
  // }, []);

  useEffect(() => {
    if (company) {
      const deptKeys = Object.keys(companyIdMap[company]?.departments || {});
      if (deptKeys.length === 0) {
        console.warn("⚠️ 회사에 연결된 부서가 없습니다:", company);
      }
    }
  }, [company]);
  useEffect(() => { setLocation(""); }, [department]);
  useEffect(() => { setItemName(""); }, [assetCategory]);

  const handleSearch = async () => {
    if (startDate && endDate && startDate > endDate) {
      return alert(t("Search_Error_StartAfterEnd"));
    }
  
    try {
      let result = [];
  
      if (barcode.trim()) {
        const url = `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcode.trim())}`;
        const res      = await authFetchWithRefresh(url, withLang({ method: 'GET' }));
        const resJson  = await res.json();
        // const res = await fetch(`http://192.168.0.220:8888/assets/${barcode}`);

        if (resJson.code !== 1 || !resJson.data) {
          alert('❌ ' + t("Search_Error_BarcodeNotFound"));
          setItems([]);          // 테이블 비우기
          setSearched(true);
          return;
        }
  
  /* 테이블에 단건이라도 배열 형태로 넣어야 map() 가능 */
  result = [resJson.data];
      } else {
        // ✅ ID가 전부 있어야 검색 가능
        // if (!corporationId || !affiliationId || !locationId) {
        //   console.warn("❗ ID 누락 확인", {
        //     company, department, location,
        //     corporationId, affiliationId, locationId
        //   });
        //   alert("회사, 부서, 세부위치를 모두 선택해야 검색할 수 있습니다.");
        //   return;
        // }

        // if (!locationId) {
        //   console.warn("❗ 세부위치 ID 누락:", {
        //     company, department, location, locationId
        //   });
        //   alert("세부위치를 선택해야 검색할 수 있습니다.");
        //   return;
        // }
  
        // ✅ GET 방식 쿼리스트링 구성
        const queryParams = new URLSearchParams();
        //queryParams.append("locationId", locationId);


        if (corporationId) queryParams.append("corporationId", corporationId);
        if (affiliationId) queryParams.append("affiliationId", affiliationId);
        if (location) queryParams.append("location", location);       // 세부위치 이름
        if (locationId) queryParams.append("locationId", locationId);
        //if (assetCategory) queryParams.append("parentType", assetCategory); // 자산 대분류
        //if (itemName) queryParams.append("childType", itemName);      // 자산 중분류
        if (parentTypeId) queryParams.append("parentTypeId", parentTypeId);

        if (childTypeId) queryParams.append("childTypeId", childTypeId);
                // ✅ 상태 필터: 코드(자주 쓰는 assetStatus)와 문자열(status) 동시 전송
        if (statusFilter) {
          const code = STATUS_CODE[statusFilter];
          if (code !== undefined) queryParams.append("assetStatus", code);
          queryParams.append("status", statusFilter);
        }
        if (startDate) queryParams.append("after", startDate);        // 시작일
        if (endDate) queryParams.append("before", endDate);           // 종료일
        if (sortField) queryParams.append("sortField", sortField);    // 정렬 필드
         if (viewCount > 0) { // 0보다 크면 무조건 size를 보냄
             queryParams.append("size", viewCount);
           }
           // viewCount가 0이면 size를 보내지 않음            // 페이지당 개수
  
        // const url = `http://192.168.0.220:8888/assets/paged?${queryParams.toString()}`;
       // const url = `${API_BASE_URL}/assets/paged?${queryParams.toString()}`;

        const url = queryParams.toString()
   ? `${API_BASE_URL}/assets/paged?${queryParams.toString()}`
   : `${API_BASE_URL}/assets/paged`; // 조건 없을 때는 쿼리스트링 없이 요청


     //   console.log("최종 전송 URL:", url);   // << 이거 둘 다 추가!
     //   console.log("📤 최종 전송 URL:", url);
    //    console.log("📦 검색 조건 요약:", {
        //   corporationId,
        //   affiliationId,
        //   locationId,
        //   parentTypeId,
        //   childTypeId,
        //   startDate,
        //   endDate,
        //   sortField,
        //   sortOrder,
        //   viewCount,
        // });
  
        const res = await authFetchWithRefresh(url, withLang());
        const resData = await res.json();

        // ✅ 응답 전체 로그 출력
//console.log("✅ 응답 전체:", JSON.stringify(resData, null, 2));

const data = resData.data?.list || [];

//console.log("✅ 서버에서 받은 자산 데이터:", data);





  
        if (!Array.isArray(data) || data.length === 0) {
          alert("❌ " + t("Search_Error_NoResults"));
          setItems([]);
          setSearched(true);
          return;
        }
  
        result = data;
      }
      
      // ✅ 서버가 상태 파라미터를 무시할 경우 대비, 클라이언트에서도 한 번 더 거르기
      if (statusFilter) {
        result = result.filter(it => String(it.status) === statusFilter);
      }
  
      setItems(result);
      setSearched(true);
    } catch (err) {
      console.error("❌ 검색 중 예외 발생:", err);
      alert("🚨 " + t("Search_Error_ServerConnection"));
    }
  };

   const handleRowClick = (item) => {
       setSelectedItem(item);
       setIsDetailOpen(true);
     }
    
  
  

  const handleReset = () => {
    setCompany(""); setDepartment(""); setLocation("");
    setAssetCategory(""); setItemName(""); setBarcode("");
    setStartDate(""); setEndDate(""); setSortField(""); setSortOrder("asc");
    setItems([]); setSearched(false); setViewCount(30);
    setStatusFilter("");
  };

   return (
     <div className={`search-container ${effectiveMode}-mode`}>

      {/* ===== Web 전용 ===== */}
      {effectiveMode === 'web' && (
        <>
      <h1 className="search-title">{t("Search_AssetSearch")}</h1>
      <div className="srch-bar-wrapper">
      <div className="srch-bar top-bar">
          <select className="search-input" value={company} onChange={e => {
  const selected = e.target.value;
  setCompany(selected);
  const corpId = companyIdMap[selected]?.id;
  setCorporationId(corpId || null);
}}>
            <option value="">{t("Search_CompanyType")}</option>
            {Object.keys(companyData).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="search-input" value={department} onChange={e => {
  const selected = e.target.value;
  setDepartment(selected);

  const companyEntry = companyIdMap[company];
  if (companyEntry) {
    const deptEntry = companyEntry.departments?.[selected];
    if (deptEntry) {
     // console.log("✅ 부서 ID 찾음:", deptEntry.id);
      setAffiliationId(deptEntry.id);
    } else {
    //  console.warn("❌ 부서 ID 찾을 수 없음");
      setAffiliationId(null);
    }
  } else {
    console.warn("❌ 회사 ID 매핑 없음:", company);
    setAffiliationId(null);
  }
}}>

            <option value="">{t("Search_DepartmentType")}</option>
            {Object.keys(companyData[company] || {}).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="search-input" value={location} onChange={e => {
  const selected = e.target.value;
  setLocation(selected);
  const locId = companyIdMap[company]?.departments?.[department]?.locations?.[selected];
 // console.log("세부위치 선택:", selected, "→ ID:", locId);
  setLocationId(locId || null);
}}>
  <option value="">{t("Search_DetailLocation")}</option>
  {(companyData[company]?.[department] || []).map(l => (
    <option key={l} value={l}>{l}</option>
  ))}
</select>




<select
  className="search-input"
  value={assetCategory}
  onChange={(e) => {
    const selected = e.target.value;
    setAssetCategory(selected);
    setParentTypeId(assetCategoryMap[selected]?.id || null); // ✅ parentTypeId 설정
    setItemName(""); // 하위 분류 초기화
    setChildTypeId(null);
  }}
>
<option value="">{t("Search_AssetCategory")}</option>
  {Object.keys(assetCategoryData).map(a => (
    <option key={a} value={a}>{a}</option>
  ))}
</select>
<select
  className="search-input"
  value={itemName}
  onChange={(e) => {
    const selected = e.target.value;
    setItemName(selected);
    const childId = assetCategoryMap[assetCategory]?.children?.[selected] || null;
    setChildTypeId(childId); // ✅ childTypeId 설정
  }}
>
   <option value="">{t("Search_Item")}</option>
  {(assetCategoryData[assetCategory] || []).map(i => (
    <option key={i} value={i}>{i}</option>
  ))}
</select>
          <input
            type="number"
            className="srch-input view-count"
            placeholder={t("Search_PrintCount")}
            value={viewCount}
            onChange={e => setViewCount(Number(e.target.value))}
          />
        </div>

       <div className="srch-bar bottom-bar">
          <input type="text" className="search-input barcode-search" placeholder={t("Search_SearchBarcode")}
                 value={barcode} onChange={e => setBarcode(e.target.value)} />
          {/* ✅ 상태 필터 */}
          <select
            className="search-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{t("Search_Status")}</option>
          <option value="">{t("Search_InUse")}</option>
          <option value="">{t("Search_NotInUse")}</option>
          <option value="">{t("Search_Disposed")}</option>
         </select>
          <input type="date" className="search-input date" value={startDate} onChange={e => setStartDate(e.target.value)} aria-label={t("Search_StartDate")} />
          <span>~</span>
          <input type="date" className="search-input date" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label={t("Search_EndDate")} />
          {/* <select className="search-input" value={sortField} onChange={e => setSortField(e.target.value)}>
            <option value="">정렬 항목</option>
            <option value="acquisitionDate">취득일자</option>
            <option value="acquisitionPrice">취득가</option>
          </select>
          <select className="search-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select> */}
          <button className="search-button" onClick={handleSearch}>🔍 {t("Search_Search")}</button>
          <button className="search-button print" onClick={handlePrint}>🖨️ {t("Search_Print")}</button>
          <button className="srch-button reset" onClick={handleReset}>↺ {t("Search_Reset")}</button>
          <button className="search-button download" onClick={handleExportExcel}>⬇️ {t("Search_Download")}</button>
        </div>
      </div>{/* /.srch-bar-wrapper */}

    {searched && (
      <div className="search-table-wrapper">
        <table className="search-asset-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>{t("Search_Barcode")}</th><th>{t("Search_Company")}</th><th>{t("Search_Department")}</th><th>{t("Search_Location")}</th>
              <th>{t("Search_AssetCategory")}</th><th>{t("Search_Item")}</th><th>{t("Search_Status")}</th>
              <th>{t("Search_Manufacturer")}</th><th>{t("Search_Model")}</th><th>{t("Search_AcquisitionDate")}</th>
              <th>{t("Search_AcquisitionCost")}</th><th>{t("Search_Registrar")}</th><th>{t("Search_RegisteredDate")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.barcode} onClick={() => handleRowClick(item)} style={{cursor:'pointer'}}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.barcode)}
                    onClick={(e)=>e.stopPropagation()}
                    onChange={()=>toggleRow(item.barcode)}
                  />
                </td>
                <td>{item.barcode}</td>
                <td>{item.corporation}</td>
                <td>{item.department}</td>
                <td>{item.location}</td>
                <td>{item.parentCategory}</td>
                <td>{item.childCategory}</td>
                <td>{item.status}</td>
                <td>{item.manufacturer}</td>
                <td>{item.model}</td>
                <td>{item.acquisitionDate}</td>
                <td>{Number(item.acquisitionPrice).toLocaleString()}</td>
                <td>{item.registerName}</td>
                <td>{item.registrationDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
        </>
      )} {/* /Web */}
{isDetailOpen && selectedItem && (
  <div className="detail-overlay" onClick={() => setIsDetailOpen(false)}>
    <div
      className="detail-panel"
      onClick={e => e.stopPropagation()} // 내부 클릭 방지
    >
            {/* 닫기 X */}
      <button
        type="button"
        className="detail-close-x"
        aria-label="닫기"
        onClick={() => setIsDetailOpen(false)}
      >
        ×
      </button>
      <div className="detail-header">
        <h3>{t("Search_AssetDetail")}</h3>
      </div>
      <div className="detail-body">
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_BarcodeLabel")}</strong> {selectedItem.barcode}</p>
                {/* ✅ 회계코드: 서버 필드명 categoryCode를 그대로 사용 */}
        {selectedItem.categoryCode !== undefined && selectedItem.categoryCode !== null && (
          <p style={{ color: '#000' }}><strong>회계코드:</strong> {selectedItem.categoryCode}</p>
        )}

        <p style={{ color: '#000' }} ><strong>{t("Search_Detail_CompanyLabel")}</strong> {selectedItem.corporation}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_DepartmentLabel")}</strong> {selectedItem.department}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_LocationLabel")}</strong> {selectedItem.location}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_AssetCategoryLabel")}</strong> {selectedItem.parentCategory}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_ItemLabel")}</strong> {selectedItem.childCategory}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_StatusLabel")}</strong> {selectedItem.status}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_ManufacturerLabel")}</strong> {selectedItem.manufacturer}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_ModelLabel")}</strong> {selectedItem.model}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_AcquisitionDateLabel")}</strong> {selectedItem.acquisitionDate}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_AcquisitionCostLabel")}</strong> {Number(selectedItem.acquisitionPrice).toLocaleString()}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_RegistrarLabel")}</strong> {selectedItem.registerName}</p>
        <p style={{ color: '#000' }}><strong>{t("Search_Detail_RegisteredDateLabel")}</strong> {selectedItem.registrationDate}</p>

        {["노트북", "컴퓨터"].includes(selectedItem.childCategory) && (
          <>
            <p style={{ color: '#000' }}><strong>{t("Search_Detail_CPULabel")}</strong> {selectedItem.cpu}</p>
            <p style={{ color: '#000' }}><strong>{t("Search_Detail_GraphicsCardLabel")}</strong> {selectedItem.gpu}</p>
            <p style={{ color: '#000' }}><strong>{t("Search_Detail_RAMLabel")}</strong> {selectedItem.ram} GB</p>
            <p style={{ color: '#000' }}><strong>{t("Search_Detail_TotalStorageLabel")}</strong> {selectedItem.storage} GB</p>
          </>
        )}
      </div>
    </div>
  </div>
)}

{/* ===== PDA 전용 ===== */}
{effectiveMode === 'pda' && (
  <>
    <h1 className="search-title">{t("Search_AssetSearch")}</h1>
    <div className="srch-bar-wrapper">
     <div className="srch-bar">
        {/* ✅ 1행: 회사구분 - 부서구분 */}
        <div className="pda-grid two">
          <select className="search-input" value={company}
            onChange={(e)=>{const v=e.target.value; setCompany(v); setCorporationId(companyIdMap[v]?.id||null);}}>
             <option value="">{t("Search_CompanyType")}</option>
            {Object.keys(companyData).map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="search-input" value={department}
            onChange={(e)=>{const v=e.target.value; setDepartment(v);
              const dept=companyIdMap[company]?.departments?.[v]; setAffiliationId(dept?dept.id:null);}}>
            <option value="">{t("Search_DepartmentType")}</option>
            {Object.keys(companyData[company]||{}).map(d=> <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* ✅ 2행: 세부위치(1열 풀폭) */}
        <select className="search-input" value={location}
          onChange={(e)=>{const v=e.target.value; setLocation(v);
            const id=companyIdMap[company]?.departments?.[department]?.locations?.[v]; setLocationId(id||null);}}>
          <option value="">{t("Search_DetailLocation")}</option>
          {(companyData[company]?.[department]||[]).map(l=> <option key={l} value={l}>{l}</option>)}
        </select>

        {/* ✅ 3행: 자산분류 - 품목 */}
        <div className="pda-grid two">
          <select className="search-input" value={assetCategory}
            onChange={(e)=>{const v=e.target.value; setAssetCategory(v); setParentTypeId(assetCategoryMap[v]?.id||null); setItemName(''); setChildTypeId(null);}}>
            <option value="">{t("Search_AssetCategory")}</option>
            {Object.keys(assetCategoryData).map(a=> <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="search-input" value={itemName}
            onChange={(e)=>{const v=e.target.value; setItemName(v); setChildTypeId(assetCategoryMap[assetCategory]?.children?.[v]||null);}}>
           <option value="">{t("Search_Item")}</option>
            {(assetCategoryData[assetCategory]||[]).map(i=> <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        
        {/* ✅ 3.5행: 상태 필터 */}
        <select
          className="search-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">{t("Search_Status")}</option>
          <option value="">{t("Search_InUse")}</option>
          <option value="">{t("Search_NotInUse")}</option>
          <option value="">{t("Search_Disposed")}</option>
        </select>

        {/* ✅ 4행: 바코드 검색(1열 풀폭) */}
        <input className="search-input" placeholder="바코드 검색" value={barcode} onChange={e=>setBarcode(e.target.value)} />
        {/* ✅ 시작/끝 라벨 있는 날짜 필드 */}
        <div className="pda-field">
          <span className="pda-field__label">{t("Search_StartDate")}</span>
          <input
            type="date"
            className="search-input"
            value={startDate}
            onChange={e=>setStartDate(e.target.value)}
          />
        </div>
        <div className="pda-field">
          <span className="pda-field__label">{t("Search_EndDate")}</span>
          <input
            type="date"
            className="search-input"
            value={endDate}
            onChange={e=>setEndDate(e.target.value)}
          />
        </div>
        <input
          type="number"
          className="search-input"
          placeholder="출력 개수"
          value={viewCount}
          onChange={e=>setViewCount(Number(e.target.value))}
        />
      </div>
    </div>

        {/* ✅ PDA 액션 버튼: 표 위에 배치 */}
    <div className="srch-bar bottom-bar pda-actions">
      <button className="search-button" onClick={handleSearch}>🔍 {t("Search_Search")}</button>
      <button className="search-button print" onClick={handlePrint}>🖨️ {t("Search_Print")}</button>
      <button className="srch-button reset" onClick={handleReset}>↺ {t("Search_Reset")}</button>
      <button className="search-button download" onClick={handleExportExcel}>⬇️ {t("Search_Download")}</button>
    </div>


    {searched && (
      <div className="search-table-wrapper">
        <table className="search-asset-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>바코드</th><th>회사</th><th>부서</th><th>위치</th>
              <th>자산분류</th><th>품목</th><th>상태</th>
              <th>제조사</th><th>모델</th><th>취득일자</th>
              <th>취득가</th><th>등록자</th><th>등록일자</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.barcode} onClick={() => handleRowClick(item)} style={{cursor:"pointer"}}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.barcode)}
                    onClick={(e)=>e.stopPropagation()}
                    onChange={()=>toggleRow(item.barcode)}
                  />
                </td>
                <td>{item.barcode}</td>
                <td>{item.corporation}</td>
                <td>{item.department}</td>
                <td>{item.location}</td>
                <td>{item.parentCategory}</td>
                <td>{item.childCategory}</td>
                <td>{item.status}</td>
                <td>{item.manufacturer}</td>
                <td>{item.model}</td>
                <td>{item.acquisitionDate}</td>
                <td>{Number(item.acquisitionPrice).toLocaleString()}</td>
                <td>{item.registerName}</td>
                <td>{item.registrationDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    
  </>
)}

  </div>
);

}

 // 반응형 모드 계산 훅
 // 반응형 모드 계산 훅 (자동)
 function useResponsiveMode(){
   const [eff, setEff] = React.useState('web');
   React.useEffect(()=>{
     const compute=()=>{
       const width = window.innerWidth;
       const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
       const isPDA = width <= 920 || (coarse && width <= 1200);
       setEff(isPDA ? 'pda' : 'web');
     };
     compute();
     window.addEventListener('resize', compute);
     window.addEventListener('orientationchange', compute);
     return ()=> {
       window.removeEventListener('resize', compute);
       window.removeEventListener('orientationchange', compute);
     };
   },[]);
   return eff;
 }