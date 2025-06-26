
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import "./auditList.css";
import { authFetchWithRefresh } from "../../utils/authFetchWithRefresh";  // 인증 포함 fetch 함수 사용
const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";

// ✅ 환경변수에서 API URL 사용 추가
const API_BASE = window._env_?.REACT_APP_API_URL|| 'http://localhost:8080';

const COLUMN_LABELS = [
  { key: "barcode", label: "바코드" },
  { key: "corporation",  label: "회사" },
  { key: "department", label: "부서" },
  { key: "location", label: "위치" },
  { key: "division", label: "취득구분" }, 
  { key: "parentCategory",  label: "자산분류" },
  { key: "childCategory",   label: "품목" },
  { key: "status",          label: "상태" },
  { key: "manufacturer", label: "제조사" },
  { key: "model", label: "모델" },
  { key: "acquisitionDate", label: "취득일자" },
  { key: "acquisitionPrice", label: "취득가" },
  { key: "registerName", label: "등록자" },
  { key: "isStockTaking", label: "실사상태" },
];



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
  return (
    <div className="detail-fullpage">
      <button className="detail-back" onClick={onClose}>← 뒤로</button>
      <h2>자산 상세</h2>
      <ul>
        {COLUMN_LABELS.map(col => (
          <li key={col.key}><strong>{col.label}:</strong> {item[col.key]}</li>
        ))}
      </ul>
    </div>
  );
}

function SideDrawerDetail({ item, onClose }) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2>자산 상세</h2>
        <ul>
          {COLUMN_LABELS.map(col => (
            <li key={col.key}><strong>{col.label}:</strong> {item[col.key]}</li>
          ))}
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
  const [companyData, setCompanyData] = useState({});
  const [assetCategoryData, setAssetCategoryData] = useState({});
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
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

  useEffect(() => {
    async function fetchLookups() {
      /* ── ① corporations */
      const res  = await authFetchWithRefresh(`${API_BASE_URL}/corporations`);
      const json = await res.json();
      if (json.code === 1) {
        const nested   = {};   // UI용 {회사: {부서: [위치]}}
        const idMapper = {};   // ID용  {회사: {id, departments:{부서:{id,locations:{위치:locId}}}}}
        const names    = [];
  
        (json.data?.corporationList||[]).forEach(corp=>{
          names.push(corp.name);
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
      const typeRes  = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`);
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
        // ── [NEW] 필수값 알림 ───────────────────────
  if (!locationId || !startDate || !endDate) {
    return alert("❌ 세부위치와 시작/종료 날짜를 모두 선택해야 조회할 수 있습니다.");
  }
        if (startDate > endDate) {
          return alert("시작일이 종료일보다 늦을 수 없습니다.");
        }
    
        try {
          /* ── 1. 쿼리 파라미터 구성 (필수 + 선택) ─────── */
          const params = new URLSearchParams();
          params.append("locationId",  locationId);  // 필수
          params.append("after",  startDate);        // 필수
          params.append("before", endDate);          // 필수
          if (viewCount > 0)   params.append("size", viewCount);   // 필수(size)
          if (parentTypeId)    params.append("parentTypeId", parentTypeId); // 선택
          if (childTypeId)     params.append("childTypeId",  childTypeId);  // 선택
          if (inspectionStatus)
            params.append("check", inspectionStatus === "완료" ? 1 : 0);    // 선택
    
          /* ── 2. API 호출 ─────────────────────────────── */
          const url = `${API_BASE}/stock-takings?${params.toString()}`;
          console.log("📤 호출 URL:", url);
    
          const res  = await authFetchWithRefresh(url);
          const json = await res.json();
    
          if (
            json.code !== 1 ||
            (!Array.isArray(json.data?.competedList) &&
             !Array.isArray(json.data?.uncompetedList))
          ) {
            alert("❌ 조건에 맞는 자산이 없습니다.");
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
          alert("🚨 서버 오류 또는 통신 실패");
        }
      };

  const handleReset = () => {
    setCompany(""); setDepartment(""); setLocation("");
    setCategory(""); setItem(""); setBarcodeKeyword(""); setInspectionStatus("");
    setStartDate(""); setEndDate(""); setViewCount(30);
    setFilteredItems([]); setSearched(false);
    setSelectedItems([]); setCurrentPage(1);
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
    <div className="audit-search-container">
      <h2 className="audit-title">실사 조회</h2>
      <div className="audit-search-filter">
        <div className="audit-search-row">
         {/* 회사 */}
<select
 className="audit-search-simple"
value={company} onChange={e=>{
  const v=e.target.value; setCompany(v);
  setCorporationId(companyIdMap[v]?.id||null);
  setDepartment(""); setLocation("");
}}>
  <option value="">회사구분</option>
  {companyList.map(c=> <option key={c}>{c}</option>)}
</select>

{/* 부서 */}
<select  className="audit-search-simple"  value={department} onChange={e=>{
  const v=e.target.value; setDepartment(v);
  const dept = companyIdMap[company]?.departments?.[v];
  setAffiliationId(dept?.id||null);
  setLocation("");
}}>
  <option value="">부서구분</option>
  {Object.keys(companyData[company]||{}).map(d=> <option key={d}>{d}</option>)}
</select>

 {/* 세부위치 */}
<select  className="audit-search-simple" value={location} onChange={e=>{
  const v=e.target.value; setLocation(v);
  const id = companyIdMap[company]?.departments?.[department]?.locations?.[v];
  setLocationId(id||null);
}}>
  <option value="">세부위치</option>
  {(companyData[company]?.[department]||[]).map(l=> <option key={l}>{l}</option>)}
</select>

{/* 자산분류 */}
<select  className="audit-search-simple" value={category} onChange={e=>{
  const v=e.target.value; setCategory(v);
  setParentTypeId(assetCategoryMap[v]?.id||null);
  setItem(""); setChildTypeId(null);
}}>
  <option value="">자산분류</option>
  {Object.keys(assetCategoryData).map(a=> <option key={a}>{a}</option>)}
</select>

{/* 품목 */}
<select  className="audit-search-simple" value={item} disabled={!parentTypeId}
        onChange={e=>{
          const v=e.target.value; setItem(v);
          setChildTypeId(assetCategoryMap[category]?.children?.[v]||null);
}}>
  <option value="">품목</option>
  {(assetCategoryData[category]||[]).map(i=> <option key={i}>{i}</option>)}
</select>
          <select className="audit-search-simple" value={inspectionStatus} onChange={e => setInspectionStatus(e.target.value)}>
            <option value="">실사상태</option>
            <option value="완료">완료</option>
            <option value="미완료">미완료</option>
          </select>
        </div>
        <div className="audit-search-row">
          {/* <input type="text" className="audit-search-simple" placeholder="바코드 검색" value={barcodeKeyword} onChange={e => setBarcodeKeyword(e.target.value)} /> */}
          <input type="number" className="audit-search-simple" placeholder="출력개수" value={viewCount} onChange={e => setViewCount(+e.target.value)} />
          <input type="date" className="audit-search-simple" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>~</span>
          <input type="date" className="audit-search-simple" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="audit-search-btn" onClick={handleSearch}>
  🔍 조회
</button>
          <button className="audit-search-btn reset" onClick={handleReset}>↺ 초기화</button>
        </div>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
              {COLUMN_LABELS.map(col => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row, idx) => (
              <tr key={idx} onClick={() => setDetailItem(row)} style={{ cursor: 'pointer' }}>
                <td onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedItems.includes(row.barcode)} onChange={() => handleSelectItem(row.barcode)} />
                </td>
                 {COLUMN_LABELS.map(col => (
   <td key={col.key}>
     {col.key === "isStockTaking"         
       ? (row[col.key] ? "완료" : "미완료") 
       : row[col.key]}                    
   </td>
 ))}
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="audit-pagination">
        <button onClick={() => setCurrentPage(1)}>처음</button>
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>이전</button>
        {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(n => (
          <button key={n} onClick={() => setCurrentPage(n)} className={currentPage === n ? "active" : ""}>{n}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>다음</button>
        <button onClick={() => setCurrentPage(totalPages)}>끝</button>
      </div>

      {detailItem && <DetailWrapper item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}
