

// import React, { useState, useEffect } from "react";
// import { FaSearch } from "react-icons/fa";
// import "./auditList.css";

// const COLUMN_LABELS = [
//   { key: "barcode", label: "바코드" },
//   { key: "company", label: "회사" },
//   { key: "department", label: "부서" },
//   { key: "location", label: "위치" },
//   { key: "acquisitionType", label: "취득구분" },
//   { key: "assetCategory", label: "자산분류" },
//   { key: "itemName", label: "품목" },
//   { key: "assetStatus", label: "상태" },
//   { key: "manufacturer", label: "제조사" },
//   { key: "model", label: "모델" },
//   { key: "acquisitionDate", label: "취득일자" },
//   { key: "acquisitionPrice", label: "취득가" },
//   { key: "registrant", label: "등록자" },
//   { key: "inspectionStatus", label: "실사상태" },
// ];


// const companyData = {
//   "평택 공장": {
//     "전산운영P": ["전산실", "서버실"],
//     "관리팀": ["총무실", "회의실"]
//   },
//   "우신비나": {
//     "자재팀": ["자재창고", "입출고구역"],
//     "생산팀": ["라인1", "라인2"]
//   }
// };

// const assetCategoryData = {
//   "전자제품": ["노트북", "모니터"],
//   "가구": ["책상", "의자"]
// };

// function useMediaQuery(query) {
//   const [matches, setMatches] = useState(window.matchMedia(query).matches);
//   useEffect(() => {
//     const media = window.matchMedia(query);
//     const listener = e => setMatches(e.matches);
//     media.addEventListener("change", listener);
//     return () => media.removeEventListener("change", listener);
//   }, [query]);
//   return matches;
// }

// function FullPageDetail({ item, onClose }) {
//   return (
//     <div className="detail-fullpage">
//       <button className="detail-back" onClick={onClose}>← 뒤로</button>
//       <h2>자산 상세</h2>
//       <ul>
//         {COLUMN_LABELS.map(col => (
//           <li key={col.key}><strong>{col.label}:</strong> {item[col.key]}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// function SideDrawerDetail({ item, onClose }) {
//   return (
//     <>
//       <div className="drawer-overlay" onClick={onClose} />
//       <div className="drawer">
//         <button className="drawer-close" onClick={onClose}>×</button>
//         <h2>자산 상세</h2>
//         <ul>
//           {COLUMN_LABELS.map(col => (
//             <li key={col.key}><strong>{col.label}:</strong> {item[col.key]}</li>
//           ))}
//         </ul>
//       </div>
//     </>
//   );
// }


// function DetailWrapper({ item, onClose }) {
//   const isMobile = useMediaQuery("(max-width: 768px)");
//   return isMobile
//     ? <FullPageDetail item={item} onClose={onClose} />
//     : <SideDrawerDetail item={item} onClose={onClose} />;
// }

// export default function AuditSearch() {
//   const items = Array.from({ length: 130 }, (_, i) => ({
//     barcode: `200RSFFL${i + 1}`,
//     company: "평택 공장",
//     department: "전산운영P",
//     location: "전산실",
//     acquisitionType: "구매자산",
//     assetCategory: "전자제품",
//     itemName: "노트북",
//     assetStatus: "사용",
//     manufacturer: "삼성",
//     model: "SLD-5700",
//     acquisitionDate: "2025-03-20",
//     acquisitionPrice: "1,300,000",
//     registrant: "홍길동",
//     inspectionStatus: i % 2 === 0 ? "완료" : "미완료"
//   }));

//   const [company, setCompany] = useState("");
//   const [department, setDepartment] = useState("");
//   const [location, setLocation] = useState("");
//   const [category, setCategory] = useState("");
//   const [item, setItem] = useState("");
//   const [barcodeKeyword, setBarcodeKeyword] = useState("");
//   const [inspectionStatus, setInspectionStatus] = useState("");
//   const [viewCount, setViewCount] = useState(30);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [filteredItems, setFilteredItems] = useState([]);
//   const [searched, setSearched] = useState(false);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [detailItem, setDetailItem] = useState(null);


//   const itemsPerPage = 10;

//   useEffect(() => { setDepartment(""); setLocation(""); }, [company]);
//   useEffect(() => { setLocation(""); }, [department]);
//   useEffect(() => { setItem(""); }, [category]);

//   const handleSearch = () => {
//     let result = items.filter(it => {
//       return (!company || it.company === company) &&
//              (!department || it.department === department) &&
//              (!location || it.location === location) &&
//              (!category || it.assetCategory === category) &&
//              (!item || it.itemName === item) &&
//              (!barcodeKeyword || it.barcode === barcodeKeyword) &&
//              (!inspectionStatus || it.inspectionStatus === inspectionStatus) &&
//              (!startDate || it.acquisitionDate >= startDate) &&
//              (!endDate || it.acquisitionDate <= endDate);
//     });

//     if (viewCount > 0) result = result.slice(0, viewCount);

//     setFilteredItems(result);
//     setSearched(true);
//     setSelectedItems([]);
//     setCurrentPage(1);
//   };

//   const handleReset = () => {
//     setCompany(""); setDepartment(""); setLocation("");
//     setCategory(""); setItem(""); setBarcodeKeyword(""); setInspectionStatus("");
//     setStartDate(""); setEndDate(""); setViewCount(30);
//     setFilteredItems([]); setSearched(false);
//     setSelectedItems([]); setCurrentPage(1);
//   };

//   const listToDisplay = searched ? filteredItems : items;
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = listToDisplay.slice(indexOfFirstItem, indexOfLastItem);

//   const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
//   const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
//   const groupEnd = Math.min(groupStart + 4, totalPages);

//   const isAllSelected = selectedItems.length === currentItems.length && currentItems.length > 0;

//   const handleSelectAll = () => {
//     setSelectedItems(isAllSelected ? [] : currentItems.map(it => it.barcode));
//   };

//   const handleSelectItem = (barcode) => {
//     setSelectedItems(prev =>
//       prev.includes(barcode)
//         ? prev.filter(b => b !== barcode)
//         : [...prev, barcode]
//     );
//   };

//   return (
//     <div className="audit-search-container">
//       <h2 className="audit-title">실사 조회</h2>
//       <div className="audit-search-filter">
//         <div className="audit-search-row">
//           <select className="audit-search-simple" value={company} onChange={e => setCompany(e.target.value)}>
//             <option value="">회사구분</option>
//             {Object.keys(companyData).map(c => <option key={c}>{c}</option>)}
//           </select>
//           <select className="audit-search-simple" value={department} onChange={e => setDepartment(e.target.value)}>
//             <option value="">부서구분</option>
//             {company && Object.keys(companyData[company] || {}).map(d => <option key={d}>{d}</option>)}
//           </select>
//           <select className="audit-search-simple" value={location} onChange={e => setLocation(e.target.value)}>
//             <option value="">세부위치</option>
//             {(companyData[company]?.[department] || []).map(l => <option key={l}>{l}</option>)}
//           </select>
//           <select className="audit-search-simple" value={category} onChange={e => setCategory(e.target.value)}>
//             <option value="">자산분류</option>
//             {Object.keys(assetCategoryData).map(c => <option key={c}>{c}</option>)}
//           </select>
//           <select className="audit-search-simple" value={item} onChange={e => setItem(e.target.value)}>
//             <option value="">품목</option>
//             {(assetCategoryData[category] || []).map(i => <option key={i}>{i}</option>)}
//           </select>
//           <select className="audit-search-simple" value={inspectionStatus} onChange={e => setInspectionStatus(e.target.value)}>
//             <option value="">실사상태</option>
//             <option value="완료">완료</option>
//             <option value="미완료">미완료</option>
//           </select>
//         </div>
//         <div className="audit-search-row">
//           <input type="text" className="audit-search-simple" placeholder="바코드 검색" value={barcodeKeyword} onChange={e => setBarcodeKeyword(e.target.value)} />
//           <input type="number" className="audit-search-simple" placeholder="출력개수" value={viewCount} onChange={e => setViewCount(+e.target.value)} />
//           <input type="date" className="audit-search-simple" value={startDate} onChange={e => setStartDate(e.target.value)} />
//           <span>~</span>
//           <input type="date" className="audit-search-simple" value={endDate} onChange={e => setEndDate(e.target.value)} />
//           <button className="audit-search-btn" onClick={handleSearch}>🔍  조회</button>
//           <button className="audit-search-btn reset" onClick={handleReset}>↺ 초기화</button>
//         </div>
//       </div>
//       <div className="audit-table-wrapper">
//         <table className="audit-table">
//           <thead>
//             <tr>
//               <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
//               <th>바코드</th><th>회사</th><th>부서</th><th>위치</th>
//               <th>취득구분</th><th>자산분류</th><th>품목</th><th>상태</th>
//               <th>제조사</th><th>모델</th><th>취득일자</th><th>취득가</th><th>등록자</th><th>실사</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentItems.map((row, idx) => (
//               <tr key={idx} onClick={() => setDetailItem(row)} style={{ cursor: 'pointer' }}>
//                 <td onClick={e => e.stopPropagation()}>
//                   <input type="checkbox" checked={selectedItems.includes(row.barcode)} onChange={() => handleSelectItem(row.barcode)} />
//                 </td>
//                 <td>{row.barcode}</td><td>{row.company}</td><td>{row.department}</td><td>{row.location}</td>
//                 <td>{row.acquisitionType}</td><td>{row.assetCategory}</td><td>{row.itemName}</td>
//                 <td>{row.assetStatus}</td><td>{row.manufacturer}</td><td>{row.model}</td>
//                 <td>{row.acquisitionDate}</td><td>{row.acquisitionPrice}</td><td>{row.registrant}</td>
//                 <td>{row.inspectionStatus}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div className="audit-pagination">
//         <button onClick={() => setCurrentPage(1)}>처음</button>
//         <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>이전</button>
//         {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(n => (
//           <button key={n} onClick={() => setCurrentPage(n)} className={currentPage === n ? "active" : ""}>{n}</button>
//         ))}
//         <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>다음</button>
//         <button onClick={() => setCurrentPage(totalPages)}>끝</button>
//       </div>
//       {detailItem && <DetailWrapper item={detailItem} onClose={() => setDetailItem(null)} />}
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import "./auditList.css";

// ✅ 환경변수에서 API URL 사용 추가
const API_BASE = window._env_?.REACT_APP_API_URL|| 'http://localhost:8080';

const COLUMN_LABELS = [
  { key: "barcode", label: "바코드" },
  { key: "company", label: "회사" },
  { key: "department", label: "부서" },
  { key: "location", label: "위치" },
  { key: "acquisitionType", label: "취득구분" },
  { key: "assetCategory", label: "자산분류" },
  { key: "itemName", label: "품목" },
  { key: "assetStatus", label: "상태" },
  { key: "manufacturer", label: "제조사" },
  { key: "model", label: "모델" },
  { key: "acquisitionDate", label: "취득일자" },
  { key: "acquisitionPrice", label: "취득가" },
  { key: "registrant", label: "등록자" },
  { key: "inspectionStatus", label: "실사상태" },
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

export default function AuditSearch() {
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

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        // const res1 = await fetch("http://localhost:8080/api/lookups/companies");
        const res1 = await fetch(`${API_BASE}/api/lookups/companies`);
        const comp = await res1.json();
        setCompanyData(comp);
        // const res2 = await fetch("http://localhost:8080/api/lookups/categories");
        const res2 = await fetch(`${API_BASE}/api/lookups/categories`);
        const cat = await res2.json();
        setAssetCategoryData(cat);
      } catch (err) {
        alert("🚨 조회 조건 데이터를 불러오는 중 오류 발생");
        console.error(err);
      }
    };
    fetchLookups();
  }, []);

  useEffect(() => { setDepartment(""); setLocation(""); }, [company]);
  useEffect(() => { setLocation(""); }, [department]);
  useEffect(() => { setItem(""); }, [category]);

  const handleSearch = async () => {
    if (startDate && endDate && startDate > endDate) {
      return alert("시작일이 종료일보다 늦을 수 없습니다.");
    }

    try {
      let result = [];
      if (barcodeKeyword.trim()) {
        // const res = await fetch(`http://localhost:8080/api/assets/${barcodeKeyword}`);
        const res = await fetch(`${API_BASE}/api/assets/${barcodeKeyword}`);
        const data = await res.json();
        if (data === 0 || !data) {
          alert("❌ 바코드로 조회된 자산이 없습니다.");
          setFilteredItems([]);
          setSearched(true);
          return;
        }
        result = [data];
      } else {
        // const res = await fetch("http://localhost:8080/api/assets/search", {
          const res = await fetch(`${API_BASE}/api/assets/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company, department, location,
            assetCategory: category, itemName: item,
            inspectionStatus, startDate, endDate
          }),
        });
        const data = await res.json();
        if (data === 0 || !Array.isArray(data)) {
          alert("❌ 조건에 맞는 자산이 없습니다.");
          setFilteredItems([]);
          setSearched(true);
          return;
        }
        result = data;
      }

      setFilteredItems(viewCount > 0 ? result.slice(0, viewCount) : result);
      setSearched(true);
      setSelectedItems([]);
      setCurrentPage(1);
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
          <select className="audit-search-simple" value={company} onChange={e => setCompany(e.target.value)}>
            <option value="">회사구분</option>
            {Object.keys(companyData).map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="audit-search-simple" value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="">부서구분</option>
            {company && Object.keys(companyData[company] || {}).map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="audit-search-simple" value={location} onChange={e => setLocation(e.target.value)}>
            <option value="">세부위치</option>
            {(companyData[company]?.[department] || []).map(l => <option key={l}>{l}</option>)}
          </select>
          <select className="audit-search-simple" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">자산분류</option>
            {Object.keys(assetCategoryData).map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="audit-search-simple" value={item} onChange={e => setItem(e.target.value)}>
            <option value="">품목</option>
            {(assetCategoryData[category] || []).map(i => <option key={i}>{i}</option>)}
          </select>
          <select className="audit-search-simple" value={inspectionStatus} onChange={e => setInspectionStatus(e.target.value)}>
            <option value="">실사상태</option>
            <option value="완료">완료</option>
            <option value="미완료">미완료</option>
          </select>
        </div>
        <div className="audit-search-row">
          <input type="text" className="audit-search-simple" placeholder="바코드 검색" value={barcodeKeyword} onChange={e => setBarcodeKeyword(e.target.value)} />
          <input type="number" className="audit-search-simple" placeholder="출력개수" value={viewCount} onChange={e => setViewCount(+e.target.value)} />
          <input type="date" className="audit-search-simple" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>~</span>
          <input type="date" className="audit-search-simple" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="audit-search-btn" onClick={handleSearch}>🔍 조회</button>
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
                {COLUMN_LABELS.map(col => <td key={col.key}>{row[col.key]}</td>)}
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
