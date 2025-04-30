// import React, { useState, useEffect } from "react";
// import { FaSearch } from "react-icons/fa";
// import "./auditList.css";

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
//     registrant: "홍길동"
//   }));

//   const [company, setCompany] = useState("");
//   const [department, setDepartment] = useState("");
//   const [location, setLocation] = useState("");
//   const [category, setCategory] = useState("");
//   const [item, setItem] = useState("");
//   const [barcodeKeyword, setBarcodeKeyword] = useState("");
//   const [viewCount, setViewCount] = useState(30);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [filteredItems, setFilteredItems] = useState([]);
//   const [searched, setSearched] = useState(false);
//   const [selectedItems, setSelectedItems] = useState([]);

//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     setDepartment("");
//     setLocation("");
//   }, [company]);

//   useEffect(() => {
//     setLocation("");
//   }, [department]);

//   useEffect(() => {
//     setItem("");
//   }, [category]);

//   const handleSearch = () => {
//     let result = items.filter(it => {
//       const matchCompany = company ? it.company === company : true;
//       const matchDepartment = department ? it.department === department : true;
//       const matchLocation = location ? it.location === location : true;
//       const matchCategory = category ? it.assetCategory === category : true;
//       const matchItem = item ? it.itemName === item : true;
//       const matchBarcode = barcodeKeyword ? it.barcode === barcodeKeyword : true;

//       const matchStartDate = startDate ? it.acquisitionDate >= startDate : true;
//       const matchEndDate = endDate ? it.acquisitionDate <= endDate : true;
//       return matchCompany && matchDepartment && matchLocation && matchCategory && matchItem && matchBarcode && matchStartDate && matchEndDate;
//     });

//     if (viewCount > 0) {
//       result = result.slice(0, viewCount);
//     }

//     setFilteredItems(result);
//     setSearched(true);
//     setSelectedItems([]);
//     setCurrentPage(1);
//   };

//   const handleReset = () => {
//     setCompany("");
//     setDepartment("");
//     setLocation("");
//     setCategory("");
//     setItem("");
//     setBarcodeKeyword("");
//     setStartDate("");
//     setEndDate("");
//     setViewCount(30);
//     setFilteredItems([]);
//     setSearched(false);
//     setSelectedItems([]);
//     setCurrentPage(1);
//   };

//   const listToDisplay = searched ? filteredItems : items;

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = listToDisplay.slice(indexOfFirstItem, indexOfLastItem);

//   const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
//   const pageGroupSize = 5;
//   const groupStart = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
//   const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

//   const isAllSelected = selectedItems.length === currentItems.length && currentItems.length > 0;

//   const handleSelectAll = () => {
//     if (isAllSelected) {
//       setSelectedItems([]);
//     } else {
//       setSelectedItems(currentItems.map(item => item.barcode));
//     }
//   };

//   const handleSelectItem = (barcode) => {
//     setSelectedItems(prev =>
//       prev.includes(barcode)
//         ? prev.filter(id => id !== barcode)
//         : [...prev, barcode]
//     );
//   };

//   const handleClickPage = (pageNumber) => {
//     setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
//   };

//   return (
//     <div className="audit-search-container">
//       <h2 className="audit-title">실사 조회</h2>

//       <div className="audit-search-filter">
//         {/* 1열 */}
//         <div className="audit-search-row">
//           <select className="audit-search-simple" value={company} onChange={(e) => setCompany(e.target.value)}>
//             <option value="">회사구분</option>
//             {Object.keys(companyData).map(comp => (
//               <option key={comp} value={comp}>{comp}</option>
//             ))}
//           </select>

//           <select className="audit-search-simple" value={department} onChange={(e) => setDepartment(e.target.value)}>
//             <option value="">부서구분</option>
//             {company && Object.keys(companyData[company] || {}).map(dep => (
//               <option key={dep} value={dep}>{dep}</option>
//             ))}
//           </select>

//           <select className="audit-search-simple" value={location} onChange={(e) => setLocation(e.target.value)}>
//             <option value="">세부위치</option>
//             {(companyData[company]?.[department] || []).map(loc => (
//               <option key={loc} value={loc}>{loc}</option>
//             ))}
//           </select>

//           <select className="audit-search-simple" value={category} onChange={(e) => setCategory(e.target.value)}>
//             <option value="">자산분류</option>
//             {Object.keys(assetCategoryData).map(cat => (
//               <option key={cat} value={cat}>{cat}</option>
//             ))}
//           </select>

//           <select className="audit-search-simple" value={item} onChange={(e) => setItem(e.target.value)}>
//             <option value="">품목</option>
//             {(assetCategoryData[category] || []).map(it => (
//               <option key={it} value={it}>{it}</option>
//             ))}
//           </select>
//         </div>

//         {/* 2열 */}
//         <div className="audit-search-row">
//           <input
//             type="text"
//             placeholder="바코드 검색"
//             className="audit-search-simple"
//             value={barcodeKeyword}
//             onChange={(e) => setBarcodeKeyword(e.target.value)}
//           />

//           <input
//             type="number"
//             placeholder="출력개수"
//             className="audit-search-simple"
//             value={viewCount}
//             min="1"
//             onChange={(e) => setViewCount(Number(e.target.value))}
//           />

//           <input
//             type="date"
//             className="audit-search-simple"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//           />
//           <span>~</span>
//           <input
//             type="date"
//             className="audit-search-simple"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//           />

//           <button className="audit-search-btn" onClick={handleSearch}><FaSearch /> 조회</button>
//           <button className="audit-search-btn reset" onClick={handleReset}>↺ 초기화</button>
//         </div>
//       </div>

//       {/* 테이블 */}
//       <div className="audit-table-wrapper">
//         <table className="audit-table">
//           <thead>
//             <tr>
//               <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
//               <th>바코드</th>
//               <th>회사구분</th>
//               <th>부서구분</th>
//               <th>세부위치</th>
//               <th>취득구분</th>
//               <th>자산분류</th>
//               <th>품목</th>
//               <th>자산상태</th>
//               <th>제조사</th>
//               <th>모델</th>
//               <th>취득일자</th>
//               <th>취득가</th>
//               <th>등록자</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentItems.map((item, idx) => (
//               <tr key={idx}>
//                 <td><input type="checkbox" checked={selectedItems.includes(item.barcode)} onChange={() => handleSelectItem(item.barcode)} /></td>
//                 <td>{item.barcode}</td>
//                 <td>{item.company}</td>
//                 <td>{item.department}</td>
//                 <td>{item.location}</td>
//                 <td>{item.acquisitionType}</td>
//                 <td>{item.assetCategory}</td>
//                 <td>{item.itemName}</td>
//                 <td>{item.assetStatus}</td>
//                 <td>{item.manufacturer}</td>
//                 <td>{item.model}</td>
//                 <td>{item.acquisitionDate}</td>
//                 <td>{item.acquisitionPrice}</td>
//                 <td>{item.registrant}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* 페이징 */}
//       <div className="audit-pagination">
//         <button onClick={() => handleClickPage(1)}>처음</button>
//         <button onClick={() => handleClickPage(currentPage - 1)}>이전</button>
//         {Array.from({ length: groupEnd - groupStart + 1 }, (_, idx) => groupStart + idx).map((pageNum) => (
//           <button key={pageNum} onClick={() => handleClickPage(pageNum)} className={currentPage === pageNum ? "active" : ""}>{pageNum}</button>
//         ))}
//         <button onClick={() => handleClickPage(currentPage + 1)}>다음</button>
//         <button onClick={() => handleClickPage(totalPages)}>끝</button>
//       </div>
//     </div>
//   );
//}

















import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import "./auditList.css";

const companyData = {
  "평택 공장": {
    "전산운영P": ["전산실", "서버실"],
    "관리팀": ["총무실", "회의실"]
  },
  "우신비나": {
    "자재팀": ["자재창고", "입출고구역"],
    "생산팀": ["라인1", "라인2"]
  }
};

const assetCategoryData = {
  "전자제품": ["노트북", "모니터"],
  "가구": ["책상", "의자"]
};

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
        {Object.entries(item).map(([key, value]) => (
          <li key={key}><strong>{key}:</strong> {value}</li>
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
          {Object.entries(item).map(([key, value]) => (
            <li key={key}><strong>{key}:</strong> {value}</li>
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
  const items = Array.from({ length: 130 }, (_, i) => ({
    barcode: `200RSFFL${i + 1}`,
    company: "평택 공장",
    department: "전산운영P",
    location: "전산실",
    acquisitionType: "구매자산",
    assetCategory: "전자제품",
    itemName: "노트북",
    assetStatus: "사용",
    manufacturer: "삼성",
    model: "SLD-5700",
    acquisitionDate: "2025-03-20",
    acquisitionPrice: "1,300,000",
    registrant: "홍길동",
    inspectionStatus: i % 2 === 0 ? "완료" : "미완료"
  }));

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
  const [filteredItems, setFilteredItems] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);


  const itemsPerPage = 10;

  useEffect(() => { setDepartment(""); setLocation(""); }, [company]);
  useEffect(() => { setLocation(""); }, [department]);
  useEffect(() => { setItem(""); }, [category]);

  const handleSearch = () => {
    let result = items.filter(it => {
      return (!company || it.company === company) &&
             (!department || it.department === department) &&
             (!location || it.location === location) &&
             (!category || it.assetCategory === category) &&
             (!item || it.itemName === item) &&
             (!barcodeKeyword || it.barcode === barcodeKeyword) &&
             (!inspectionStatus || it.inspectionStatus === inspectionStatus) &&
             (!startDate || it.acquisitionDate >= startDate) &&
             (!endDate || it.acquisitionDate <= endDate);
    });

    if (viewCount > 0) result = result.slice(0, viewCount);

    setFilteredItems(result);
    setSearched(true);
    setSelectedItems([]);
    setCurrentPage(1);
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

  const handleSelectAll = () => {
    setSelectedItems(isAllSelected ? [] : currentItems.map(it => it.barcode));
  };

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
          <button className="audit-search-btn" onClick={handleSearch}><FaSearch /> 조회</button>
          <button className="audit-search-btn reset" onClick={handleReset}>↺ 초기화</button>
        </div>
      </div>
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
              <th>바코드</th><th>회사</th><th>부서</th><th>위치</th>
              <th>취득구분</th><th>자산분류</th><th>품목</th><th>상태</th>
              <th>제조사</th><th>모델</th><th>취득일자</th><th>취득가</th><th>등록자</th><th>실사</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row, idx) => (
              <tr key={idx} onClick={() => setDetailItem(row)} style={{ cursor: 'pointer' }}>
                <td onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedItems.includes(row.barcode)} onChange={() => handleSelectItem(row.barcode)} />
                </td>
                <td>{row.barcode}</td><td>{row.company}</td><td>{row.department}</td><td>{row.location}</td>
                <td>{row.acquisitionType}</td><td>{row.assetCategory}</td><td>{row.itemName}</td>
                <td>{row.assetStatus}</td><td>{row.manufacturer}</td><td>{row.model}</td>
                <td>{row.acquisitionDate}</td><td>{row.acquisitionPrice}</td><td>{row.registrant}</td>
                <td>{row.inspectionStatus}</td>
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
