
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import "./auditList.css";
import { authFetchWithRefresh } from "../../utils/authFetchWithRefresh";  // 인증 포함 fetch 함수 사용
// 📦 [추가] 엑셀 내보내기용 라이브러리
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";
import { getUILang, uiToI18n } from "../../utils/lang/pref";

const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";
const withLang = (opts = {}) => {
  const ui  = getUILang();              // 'KR' | 'CN' | 'VN'
  const lng = uiToI18n(ui);             // 'ko' | 'zh' | 'vi'
  return {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      "Accept-Language": lng,
      "language": ui,
      "X-Client-Lang": lng,
      "X-Client-Lang-UI": ui,
    },
  };
};

// ✅ 환경변수에서 API URL 사용 추가
//const API_BASE = window._env_?.REACT_APP_API_URL|| 'http://localhost:8080';

const COLUMN_KEYS = [
  "barcode","corporation","department","location","division",
  "parentCategory","childCategory","status","manufacturer","model",
  "acquisitionDate","acquisitionPrice","registerName","isStockTaking"
];
const DETAIL_KEYS = ["barcode","categoryCode", ...COLUMN_KEYS.slice(1)];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = e => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

function FullPageDetail({ item, onClose }) {
  const { t } = useTranslation('auditList');
  const label = (k) => ({
    barcode: t('AuditList_Barcode'),
    corporation: t('AuditList_Company'),
    department: t('AuditList_Department'),
    location: t('AuditList_Location'),
    division: t('AuditList_AcquisitionType'),
    parentCategory: t('AuditList_AssetCategory'),
    childCategory: t('AuditList_Item'),
    status: t('AuditList_Status'),
    manufacturer: t('AuditList_Manufacturer'),
    model: t('AuditList_Model'),
    acquisitionDate: t('AuditList_AcquisitionDate'),
    acquisitionPrice: t('AuditList_AcquisitionCost'),
    registerName: t('AuditList_Registrar'),
    isStockTaking: t('AuditList_AuditStatus'),
    categoryCode: t('AuditList_AccountingCode','회계코드'),
  }[k]);
  return (
    <div className="detail-fullpage">
      <button type="button" className="detail-close-x" onClick={onClose} aria-label={t('AuditList_Close')}>×</button>
      <h2 className="detail-title">{t('AuditList_AssetDetail')}</h2>
      <ul>
        {DETAIL_KEYS.map(key => {
          // ✅ 회계코드가 null/undefined/'' 이면 항목 숨김
          if (key === "categoryCode" && (item[key] === undefined || item[key] === null || item[key] === "")) {
            return null;
          }
          return (
            <li key={key}>
              <strong>{label(key)}:</strong>{" "}
              {key === "isStockTaking"
                ? (item[key] ? t('AuditList_Completed') : t('AuditList_Incomplete'))
                : item[key]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SideDrawerDetail({ item, onClose }) {
  const { t } = useTranslation('auditList');
  const label = (k) => ({
    barcode: t('AuditList_Barcode'),
    corporation: t('AuditList_Company'),
    department: t('AuditList_Department'),
    location: t('AuditList_Location'),
    division: t('AuditList_AcquisitionType'),
    parentCategory: t('AuditList_AssetCategory'),
    childCategory: t('AuditList_Item'),
    status: t('AuditList_Status'),
    manufacturer: t('AuditList_Manufacturer'),
    model: t('AuditList_Model'),
    acquisitionDate: t('AuditList_AcquisitionDate'),
    acquisitionPrice: t('AuditList_AcquisitionCost'),
    registerName: t('AuditList_Registrar'),
    isStockTaking: t('AuditList_AuditStatus'),
    categoryCode: t('AuditList_AccountingCode','회계코드'),
  }[k]);
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2>{t('AuditList_AssetDetail')}</h2>
        <ul>
          {DETAIL_KEYS.map(key => {
            if (key === "categoryCode" && (item[key] === undefined || item[key] === null || item[key] === "")) {
              return null;
            }
            return (
              <li key={key}>
                <strong>{label(key)}:</strong>{" "}
                {key === "isStockTaking"
                  ? (item[key] ? t('AuditList_Completed') : t('AuditList_Incomplete'))
                  : item[key]}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function DetailWrapper({ item, onClose }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  return isMobile
    ? <FullPageDetail item={item} onClose={onClose} />
    : <SideDrawerDetail item={item} onClose={onClose} />;
}

export default function StockTakingSearch() {
  const { t } = useTranslation('auditList');
  const [companyData, setCompanyData] = useState({});
  const [assetCategoryData, setAssetCategoryData] = useState({});
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);  // ✅ 로딩 상태 추가
  const [searched, setSearched] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);

  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [item, setItem] = useState("");
  const [barcodeKeyword, setBarcodeKeyword] = useState("");
  const [inspectionStatus, setInspectionStatus] = useState("");
  const [viewCount, setViewCount] = useState(30);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── 회사/부서/위치 계층 & ID 매핑
 const [companyIdMap,  setCompanyIdMap]  = useState({});
 const [companyList,   setCompanyList]   = useState([]);

 const [corporationId, setCorporationId] = useState(null);
 const [affiliationId, setAffiliationId] = useState(null);
 const [locationId,    setLocationId]    = useState(null);

// ── 자산분류 계층 & ID 매핑
 const [assetCategoryMap,  setAssetCategoryMap]  = useState({});
 const [parentTypeId,      setParentTypeId]      = useState(null);
 const [childTypeId,       setChildTypeId]       = useState(null);

  const itemsPerPage = 10;
  // 현재 화면 모드(web | pda)
  const effectiveMode = useResponsiveMode();

  useEffect(() => {
    async function fetchLookups() {
      /* ── ① corporations */
      const res  = await authFetchWithRefresh(`${API_BASE_URL}/corporations`, withLang());
      const json = await res.json();
      if (json.code === 1) {
        const nested   = {};   // UI용 {회사: {부서: [위치]}}
        const idMapper = {};   // ID용  {회사: {id, departments:{부서:{id,locations:{위치:locId}}}}}
        const names    = [];
  
        (json.data?.corporationList||[]).forEach(corp=>{
          //names.push(corp.name);
            if (!names.includes(corp.name)) {
                names.push(corp.name);
              }
          nested[corp.name] = {};
          idMapper[corp.name] = { id: corp.corporationId, departments:{} };
  
          corp.affiliationList.forEach(aff => {
              const locationsArr = Array.isArray(aff.locations) ? aff.locations : [];
            
              nested[corp.name][aff.department] = locationsArr.map(l => l.location);
            
              idMapper[corp.name].departments[aff.department] = {
                id: aff.affiliationId,
                locations: Object.fromEntries(
                  locationsArr.map(l => [l.location, l.locationId])
                )
              };
          });
        });
        setCompanyData(nested);
        setCompanyIdMap(idMapper);
        setCompanyList(names);
      }
  
      /* ── ② 자산분류 */
      const typeRes  = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`, withLang());
      const typeJson = await typeRes.json();
      if (typeJson.code === 1) {
        const nested = {};
        const mapper = {};
        (typeJson.data?.parentList||[]).forEach(p=>{
            const childrenArr = Array.isArray(p.childList) ? p.childList : [];
          
            nested[p.name] = childrenArr.map(c => c.name);
            mapper[p.name] = { id: p.parentId, children: {} };
            childrenArr.forEach(c => {
              mapper[p.name].children[c.name] = c.childId;
            });
        });
        setAssetCategoryData(nested);
        setAssetCategoryMap(mapper);
      }
    }
    fetchLookups();
  }, []);

  



    const handleSearch = async () => {
      if (loading) return;         // 중복 클릭 방지
      setLoading(true);            // ⏳ 로딩 시작
        // ── [NEW] 필수값 알림 ───────────────────────
  // if (!locationId || !startDate || !endDate) {
    if (!locationId || !startDate) {
    setLoading(false);
    // return alert("❌ 세부위치와 시작/종료 날짜를 모두 선택해야 조회할 수 있습니다.");
    return alert(`❌ ${t('AuditList_Error_DetailLocAndStartRequired')}`);
  }
        // if (startDate > endDate) {
          if (startDate && endDate && startDate > endDate) {
          setLoading(false);
          return alert(t('AuditList_Error_StartAfterEnd'));
        }
    
        try {
          /* ── 1. 쿼리 파라미터 구성 (필수 + 선택) ─────── */
          const params = new URLSearchParams();
          params.append("locationId",  locationId);  // 필수
          params.append("after",  startDate);        // 필수
          // params.append("before", endDate);          // 필수
           if (endDate) {
               params.append("before", endDate);      // 선택 (있을 때만)
             }
          if (viewCount > 0)   params.append("size", viewCount);   // 필수(size)
          if (parentTypeId)    params.append("parentTypeId", parentTypeId); // 선택
          if (childTypeId)     params.append("childTypeId",  childTypeId);  // 선택
          if (inspectionStatus)
            params.append("check", inspectionStatus === "완료" ? 0 : 1);    // 선택
    
          /* ── 2. API 호출 ─────────────────────────────── */
          const url = `${API_BASE_URL}/stock-takings?${params.toString()}`;
         // console.log("📤 호출 URL:", url);
    
          const res  = await authFetchWithRefresh(url, withLang());
          const json = await res.json();
          //console.log(JSON.stringify(json, null, 2));
 
          if (
            json.code !== 1 ||
            (!Array.isArray(json.data?.competedList) &&
             !Array.isArray(json.data?.uncompetedList))
          ) {
            alert(`❌ ${t('AuditList_Error_NoAssetsMatch')}`);
            setFilteredItems([]);  setSearched(true);
            return;
          }
    
          const result = [
            ...(json.data.competedList   || []),
            ...(json.data.uncompetedList || [])
          ];
    
          setFilteredItems(viewCount > 0 ? result.slice(0, viewCount) : result);
          setSearched(true);
          setSelectedItems([]); setCurrentPage(1);
        } catch (err) {
          console.error("❌ 실사 조회 실패:", err);
          alert(`🚨 ${t('AuditList_Error_ServerOrNetwork')}`);
        } finally {
           setLoading(false);  // ⏹️ 로딩 종료
        }
      };

  const handleReset = () => {
    setCompany(""); setDepartment(""); setLocation("");
    setCategory(""); setItem(""); setBarcodeKeyword(""); setInspectionStatus("");
    setStartDate(""); setEndDate(""); setViewCount(30);
    setFilteredItems([]); setSearched(false);
    setSelectedItems([]); setCurrentPage(1);
  };
    /* -----------------------------------------------------------
       📑 Excel 다운로드
       - 현재 화면에 표시 중인 rows(`currentItems`)만 저장
       - 선택된 행만 저장하려면 ↓ 주석 참고
    ----------------------------------------------------------- */
    const handleExportExcel = () => {
      if (!currentItems.length) {
        alert(t('AuditList_NoDataToExport'));
        return;
      }
  
      // ▶ 선택된 행만 내보내고 싶으면 아래 한 줄 교체
      // const dataToExport = currentItems.filter(row => selectedItems.includes(row.barcode));
      const dataToExport = currentItems;
  
 const jsonData = dataToExport.map(row => ({
   [t('AuditList_Barcode')]: row.barcode,
   [t('AuditList_Company')]: row.corporation,
   [t('AuditList_Department')]: row.department,
   [t('AuditList_Location')]: row.location,
   [t('AuditList_AcquisitionType')]: row.division,
   [t('AuditList_AssetCategory')]: row.parentCategory,
   [t('AuditList_Item')]: row.childCategory,
   [t('AuditList_Status')]: row.status,
   [t('AuditList_Manufacturer')]: row.manufacturer,
   [t('AuditList_Model')]: row.model,
   [t('AuditList_AcquisitionDate')]: row.acquisitionDate,
   [t('AuditList_AcquisitionCost')]: row.acquisitionPrice,
   [t('AuditList_Registrar')]: row.registerName,
   [t('AuditList_AuditStatus')]: row.isStockTaking ? t('AuditList_Completed') : t('AuditList_Incomplete'),
 }));
  
      const ws = XLSX.utils.json_to_sheet(jsonData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "실사목록");
  
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob   = new Blob([buffer], { type: "application/octet-stream" });
      saveAs(blob, t('AuditList_ExportFileName'));
    };

  const listToDisplay = searched ? filteredItems : items;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = listToDisplay.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
  const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
  const groupEnd = Math.min(groupStart + 4, totalPages);

  const isAllSelected = selectedItems.length === currentItems.length && currentItems.length > 0;
  const handleSelectAll = () => setSelectedItems(isAllSelected ? [] : currentItems.map(it => it.barcode));
  const handleSelectItem = (barcode) => {
    setSelectedItems(prev =>
      prev.includes(barcode)
        ? prev.filter(b => b !== barcode)
        : [...prev, barcode]
    );
  };

  return (
    <div className={`audit-search-container ${effectiveMode}-mode`}>
      <h2 className="audit-title">{t('AuditList_AuditSearch')}</h2>
    {/* ---------- Web 모드 ---------- */}
      {effectiveMode === 'web' && (
        <div className="audit-search-filter">
          <div className="audit-search-row">
            {/* 회사 */}
            <select className="audit-search-simple" value={company}
              onChange={e=>{ const v=e.target.value; setCompany(v); setCorporationId(companyIdMap[v]?.id||null); setDepartment(''); setLocation(''); }}>
              <option value="">{t('AuditList_CompanyType')}</option>
              {companyList.map(c=> <option key={c}>{c}</option>)}
            </select>
            {/* 부서 */}
            <select className="audit-search-simple" value={department}
              onChange={e=>{ const v=e.target.value; setDepartment(v); const dept=companyIdMap[company]?.departments?.[v]; setAffiliationId(dept?.id||null); setLocation(''); }}>
              <option value="">{t('AuditList_DepartmentType')}</option>
              {Object.keys(companyData[company]||{}).map(d=> <option key={d}>{d}</option>)}
            </select>
            {/* 세부위치 */}
            <select className="audit-search-simple" value={location}
              onChange={e=>{ const v=e.target.value; setLocation(v); const id=companyIdMap[company]?.departments?.[department]?.locations?.[v]; setLocationId(id||null); }}>
              <option value="">{t('AuditList_DetailLocation')}</option>
              {(companyData[company]?.[department]||[]).map(l=> <option key={l}>{l}</option>)}
            </select>
            {/* 자산분류 */}
            <select className="audit-search-simple" value={category}
              onChange={e=>{ const v=e.target.value; setCategory(v); setParentTypeId(assetCategoryMap[v]?.id||null); setItem(''); setChildTypeId(null); }}>
              <option value="">{t('AuditList_AssetCategory')}</option>
              {Object.keys(assetCategoryData).map(a=> <option key={a}>{a}</option>)}
            </select>
            {/* 품목 */}
            <select className="audit-search-simple" value={item} disabled={!parentTypeId}
              onChange={e=>{ const v=e.target.value; setItem(v); setChildTypeId(assetCategoryMap[category]?.children?.[v]||null); }}>
              <option value="">{t('AuditList_Item')}</option>
              {(assetCategoryData[category]||[]).map(i=> <option key={i}>{i}</option>)}
            </select>
            {/* 실사상태 */}
            <select className="audit-search-simple" value={inspectionStatus} onChange={e=>setInspectionStatus(e.target.value)}>
 <option value="">{t('AuditList_AuditStatus')}</option>
 <option value="완료">{t('AuditList_Completed')}</option>
 <option value="미완료">{t('AuditList_Incomplete')}</option>
            </select>
          </div>
          <div className="audit-search-row">
            <input type="number" className="audit-search-simple" placeholder="{t('AuditList_PrintCount')}" value={viewCount} onChange={e=> setViewCount(+e.target.value)} />
            <div className="audit-date-range">
              <label className="audit-date-label">{t('AuditList_AuditDate')} :</label>
              <input type="date" className="audit-search-simple" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              <span className="audit-date-separator">~</span>
              <input type="date" className="audit-search-simple" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>

 <button type="button" className="audit-search-btn" onClick={handleSearch}>🔍 {t('AuditList_Search')}</button>
 <button type="button" className="audit-search-btn reset" onClick={handleReset}>↺ {t('AuditList_Reset')}</button>
 <button type="button" className="audit-search-btn download wide" onClick={handleExportExcel}>⬇️ {t('AuditList_Download')}</button>
          </div>
        </div>
      )}

      {/* ---------- PDA 모드 ---------- */}
      {effectiveMode === 'pda' && (
        <div className="audit-search-filter">
          {/* 1행: 회사 - 부서 */}
          <div className="pda-grid">
            <select className="audit-search-simple" value={company}
              onChange={e=>{ const v=e.target.value; setCompany(v); setCorporationId(companyIdMap[v]?.id||null); setDepartment(''); setLocation(''); }}>
              <option value="">{t('AuditList_CompanyType')}</option>
              {companyList.map(c=> <option key={c}>{c}</option>)}
            </select>
            <select className="audit-search-simple" value={department}
              onChange={e=>{ const v=e.target.value; setDepartment(v); const dept=companyIdMap[company]?.departments?.[v]; setAffiliationId(dept?.id||null); setLocation(''); }}>
              <option value="">{t('AuditList_DepartmentType')}</option>
              {Object.keys(companyData[company]||{}).map(d=> <option key={d}>{d}</option>)}
            </select>
          </div>
          {/* 2행: 세부위치(풀폭) */}
          <select className="audit-search-simple" value={location}
            onChange={e=>{ const v=e.target.value; setLocation(v); const id=companyIdMap[company]?.departments?.[department]?.locations?.[v]; setLocationId(id||null); }}>
            <option value="">{t('AuditList_DetailLocation')}</option>
            {(companyData[company]?.[department]||[]).map(l=> <option key={l}>{l}</option>)}
          </select>
          {/* 3행: 자산분류 - 품목 */}
          <div className="pda-grid">
            <select className="audit-search-simple" value={category}
              onChange={e=>{ const v=e.target.value; setCategory(v); setParentTypeId(assetCategoryMap[v]?.id||null); setItem(''); setChildTypeId(null); }}>
              <option value="">{t('AuditList_AssetCategory')}</option>
              {Object.keys(assetCategoryData).map(a=> <option key={a}>{a}</option>)}
            </select>
            <select className="audit-search-simple" value={item} disabled={!parentTypeId}
              onChange={e=>{ const v=e.target.value; setItem(v); setChildTypeId(assetCategoryMap[category]?.children?.[v]||null); }}>
              <option value="">{t('AuditList_Item')}</option>
              {(assetCategoryData[category]||[]).map(i=> <option key={i}>{i}</option>)}
            </select>
          </div>
          {/* 4행: 실사상태 */}
          <select className="audit-search-simple" value={inspectionStatus} onChange={e=>setInspectionStatus(e.target.value)}>
            <option value="">{t('AuditList_AuditStatus')}</option>
 <option value="완료">{t('AuditList_Completed')}</option>
 <option value="미완료">{t('AuditList_Incomplete')}</option>
          </select>
          {/* 5행: 날짜(라벨 좌측) */}
          <div className="pda-field">
            <span className="pda-field__label">{t('AuditList_StartDate')}</span>
            <input type="date" className="audit-search-simple" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
          <div className="pda-field">
            <span className="pda-field__label">{t('AuditList_EndDate')}</span>
            <input type="date" className="audit-search-simple" value={endDate} onChange={e=>setEndDate(e.target.value)} />
          </div>
          {/* 6행: 출력개수 */}
          <input type="number" className="audit-search-simple" placeholder="{t('AuditList_PrintCount')}" value={viewCount} onChange={e=> setViewCount(+e.target.value)} />
          {/* 7행: 버튼(2열, 마지막은 전체폭) */}
          <div className="pda-actions">

 <button type="button" className="audit-search-btn" onClick={handleSearch}>🔍 {t('AuditList_Search')}</button>
 <button type="button" className="audit-search-btn reset" onClick={handleReset}>↺ {t('AuditList_Reset')}</button>
 <button type="button" className="audit-search-btn download" onClick={handleExportExcel}>⬇️ {t('AuditList_Download')}</button>
          </div>
        </div>
      )}

      <div className="audit-table-wrapper">
      {loading && (
    <div className="table-loading-overlay">
      <div className="loading-spinner" />
    </div>
  )}
        <table className="audit-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
               {COLUMN_KEYS.map(k => (
   <th key={k}>
     {{
       barcode: t('AuditList_Barcode'),
       corporation: t('AuditList_Company'),
       department: t('AuditList_Department'),
       location: t('AuditList_Location'),
       division: t('AuditList_AcquisitionType'),
       parentCategory: t('AuditList_AssetCategory'),
       childCategory: t('AuditList_Item'),
       status: t('AuditList_Status'),
       manufacturer: t('AuditList_Manufacturer'),
       model: t('AuditList_Model'),
       acquisitionDate: t('AuditList_AcquisitionDate'),
       acquisitionPrice: t('AuditList_AcquisitionCost'),
       registerName: t('AuditList_Registrar'),
       isStockTaking: t('AuditList_AuditStatus'),
     }[k]}
   </th>
 ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row, idx) => (
              <tr key={idx} onClick={() => setDetailItem(row)} style={{ cursor: 'pointer' }}>
                <td onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedItems.includes(row.barcode)} onChange={() => handleSelectItem(row.barcode)} />
                </td>
 {COLUMN_KEYS.map(k => (
   <td key={k}>
     {k === "isStockTaking"
       ? (row[k] ? t('AuditList_Completed') : t('AuditList_Incomplete'))
       : row[k]}
   </td>
 ))}
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="audit-pagination">
        <button onClick={() => setCurrentPage(1)}>{t('AuditList_First')}</button>
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>{t('AuditList_Prev')}</button>
        {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(n => (
          <button key={n} onClick={() => setCurrentPage(n)} className={currentPage === n ? "active" : ""}>{n}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>{t('AuditList_Next')}</button>
        <button onClick={() => setCurrentPage(totalPages)}>{t('AuditList_End')}</button>
      </div>

      {detailItem && <DetailWrapper item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

// -------------------------------
function useResponsiveMode() {
  const [mode, setMode] = useState('web');
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const isPDA = w <= 920 || (coarse && w <= 1200);
      setMode(isPDA ? 'pda' : 'web');
   };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);
  return mode;
}