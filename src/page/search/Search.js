// import { useState, useEffect } from "react";
// import { filterItems } from "./searchUtils";
// import "./Search.css";

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
//   "가구": ["책상", "의자"],
//   "전자제품": ["노트북", "모니터"]
// };

// const generateDummyItems = () =>
//   Array.from({ length: 500 }, (_, i) => ({
//     barcode: `200RSFFL${i + 1}`,
//     company: i % 2 === 0 ? "평택 공장" : "우신비나",
//     department: i % 4 === 0 ? "전산운영P" : "자재팀",
//     location: i % 3 === 0 ? "전산실" : "라인1",
//     acquisitionType: "구매자산",
//     assetCategory: i % 2 === 0 ? "전자제품" : "가구",
//     itemName: i % 2 === 0 ? "노트북" : "책상",
//     assetStatus: i % 2 === 0 ? "사용" : "보관",
//     manufacturer: "삼성",
//     model: `SLD-${5700 + i}`,
//     acquisitionDate: `2025-03-${String((i % 28) + 1).padStart(2, '0')}`,
//     acquisitionPrice: 1000000 + i * 1000,
//     registrant: i % 2 === 0 ? "홍길동" : "김영희"
//   }));

// export default function Search() {
//   const [originalItems] = useState(generateDummyItems());

//   // 검색 필터 상태
//   const [company, setCompany] = useState("");
//   const [department, setDepartment] = useState("");
//   const [location, setLocation] = useState("");
//   const [assetCategory, setAssetCategory] = useState("");
//   const [item, setItem] = useState("");
//   const [barcodeKeyword, setBarcodeKeyword] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [viewCount, setViewCount] = useState(30);
//   const [sortField, setSortField] = useState("");
//   const [sortOrder, setSortOrder] = useState("asc");

//   // 검색 결과 + 상태
//   const [filteredItems, setFilteredItems] = useState([]);
//   const [searched, setSearched] = useState(false);

//   // 페이징
//   const [currentPage, setCurrentPage] = useState(1);
//   const pageNumberLimit = 5;
//   const itemsPerPage = 10;

//   // 종속 필터 초기화
//   useEffect(() => { setDepartment(""); setLocation(""); }, [company]);
//   useEffect(() => { setLocation(""); }, [department]);
//   useEffect(() => { setItem(""); }, [assetCategory]);

//   // 검색 실행
//   const handleSearch = () => {
//     if (startDate && endDate && startDate > endDate) {
//       alert("시작일자는 종료일자보다 빠를 수 없습니다.");
//       return;
//     }

//     let result = filterItems(originalItems, {
//       company,
//       department,
//       location,
//       assetCategory,
//       item,
//       barcodeKeyword,  // 완전 일치 검색
//       startDate,
//       endDate,
//       sortField,
//       sortOrder,
//     });

//     result = result.slice(0, viewCount);

//     setFilteredItems(result);
//     setSearched(true);
//     setCurrentPage(1);
//   };

//   // 초기화
//   const handleReset = () => {
//     setCompany(""); setDepartment(""); setLocation("");
//     setAssetCategory(""); setItem(""); setBarcodeKeyword("");
//     setStartDate(""); setEndDate(""); setViewCount(30);
//     setSortField(""); setSortOrder("asc");
//     setFilteredItems([]);
//     setSearched(false);
//     setCurrentPage(1);
//   };

//   // 렌더링할 리스트 결정
//   const listToDisplay = searched ? filteredItems : originalItems;
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = listToDisplay.slice(indexOfFirstItem, indexOfLastItem);

//   // 페이지 그룹 계산
//   const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
//   const maxPageNumberLimit = Math.ceil(currentPage / pageNumberLimit) * pageNumberLimit;
//   const minPageNumberLimit = maxPageNumberLimit - pageNumberLimit + 1;

//   const renderPageNumbers = () => {
//     const pages = [];
//     for (let i = 1; i <= totalPages; i++) {
//       if (i >= minPageNumberLimit && i <= maxPageNumberLimit) {
//         pages.push(
//           <button
//             key={i}
//             onClick={() => setCurrentPage(i)}
//             className={`search-page-button ${currentPage === i ? "active" : ""}`}
//           >
//             {i}
//           </button>
//         );
//       }
//     }
//     return pages;
//   };

//   return (
//     <div className="search-container">
//       <h1 className="search-title">자산 조회</h1>

//       <div className="search-bar-wrapper">
//         <div className="search-bar top-bar">
//           <select className="search-input" value={company} onChange={e => setCompany(e.target.value)}>
//             <option value="">회사구분</option>
//             {Object.keys(companyData).map(comp => (
//               <option key={comp} value={comp}>{comp}</option>
//             ))}
//           </select>

//           <select className="search-input" value={department} onChange={e => setDepartment(e.target.value)}>
//             <option value="">부서구분</option>
//             {Object.keys(companyData[company] || {}).map(dep => (
//               <option key={dep} value={dep}>{dep}</option>
//             ))}
//           </select>

//           <select className="search-input" value={location} onChange={e => setLocation(e.target.value)}>
//             <option value="">세부위치</option>
//             {(companyData[company]?.[department] || []).map(loc => (
//               <option key={loc} value={loc}>{loc}</option>
//             ))}
//           </select>

//           <select className="search-input" value={assetCategory} onChange={e => setAssetCategory(e.target.value)}>
//             <option value="">자산분류</option>
//             {Object.keys(assetCategoryData).map(cat => (
//               <option key={cat} value={cat}>{cat}</option>
//             ))}
//           </select>

//           <select className="search-input" value={item} onChange={e => setItem(e.target.value)}>
//             <option value="">품목</option>
//             {(assetCategoryData[assetCategory] || []).map(it => (
//               <option key={it} value={it}>{it}</option>
//             ))}
//           </select>

//           <input
//             type="number"
//             className="search-input view-count"
//             placeholder="출력 개수"
//             value={viewCount}
//             min="1"
//             onChange={e => setViewCount(Number(e.target.value))}
//           />
//         </div>

//         <div className="search-bar bottom-bar">
//           <input
//             type="text"
//             className="search-input barcode-search"
//             placeholder="바코드 검색"
//             value={barcodeKeyword}
//             onChange={e => setBarcodeKeyword(e.target.value)}
//           />

//           <input
//             type="date"
//             className="search-input date"
//             value={startDate}
//             onChange={e => setStartDate(e.target.value)}
//           />
//           <span>~</span>
//           <input
//             type="date"
//             className="search-input date"
//             value={endDate}
//             onChange={e => setEndDate(e.target.value)}
//           />

//           <select className="search-input" value={sortField} onChange={e => setSortField(e.target.value)}>
//             <option value="">정렬 항목</option>
//             <option value="acquisitionDate">취득일자</option>
//             <option value="acquisitionPrice">취득가</option>
//           </select>

//           <select className="search-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
//             <option value="asc">오름차순</option>
//             <option value="desc">내림차순</option>
//           </select>

//           <button className="search-button" onClick={handleSearch}>🔍 조회</button>
//           <button className="search-button reset" onClick={handleReset}>↺ 초기화</button>
//         </div>
//       </div>

//       {searched && (
//         <>
//           <div className="search-table-wrapper">
//             <table className="search-asset-table">
//               <thead>
//                 <tr>
//                   <th>바코드</th>
//                   <th>회사구분</th>
//                   <th>부서구분</th>
//                   <th>세부위치</th>
//                   <th>취득구분</th>
//                   <th>자산분류</th>
//                   <th>품목</th>
//                   <th>자산상태</th>
//                   <th>제조사</th>
//                   <th>모델</th>
//                   <th>취득일자</th>
//                   <th>취득가</th>
//                   <th>등록자</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentItems.map((row, idx) => (
//                   <tr key={idx}>
//                     <td>{row.barcode}</td>
//                     <td>{row.company}</td>
//                     <td>{row.department}</td>
//                     <td>{row.location}</td>
//                     <td>{row.acquisitionType}</td>
//                     <td>{row.assetCategory}</td>
//                     <td>{row.itemName}</td>
//                     <td>{row.assetStatus}</td>
//                     <td>{row.manufacturer}</td>
//                     <td>{row.model}</td>
//                     <td>{row.acquisitionDate}</td>
//                     <td>{row.acquisitionPrice.toLocaleString()}</td>
//                     <td>{row.registrant}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div className="search-pagination">
//             <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="search-page-button nav-button">처음</button>
//             <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="search-page-button nav-button">이전</button>
//             {renderPageNumbers()}
//             <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="search-page-button nav-button">다음</button>
//             <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="search-page-button nav-button">끝</button>
//           </div>
//         </>
//       )}
      
//     </div>
//   );
// }

// src/page/search/Search.js

import React, { useState, useEffect } from "react";
import { filterItems } from "./searchUtils";
import "./Search.css";

// lookup 데이터
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
  "가구": ["책상", "의자"],
  "전자제품": ["노트북", "모니터"]
};

// 더미 데이터 생성 함수
const generateDummyItems = () =>
  Array.from({ length: 500 }, (_, i) => ({
    barcode: `200RSFFL${i + 1}`,
    company: i % 2 === 0 ? "평택 공장" : "우신비나",
    department: i % 4 === 0 ? "전산운영P" : "자재팀",
    location: i % 3 === 0 ? "전산실" : "라인1",
    acquisitionType: "구매자산",
    assetCategory: i % 2 === 0 ? "전자제품" : "가구",
    itemName: i % 2 === 0 ? "노트북" : "책상",
    assetStatus: i % 2 === 0 ? "사용" : "보관",
    manufacturer: "삼성",
    model: `SLD-${5700 + i}`,
    acquisitionDate: `2025-03-${String((i % 28) + 1).padStart(2, "0")}`,
    acquisitionPrice: 1000000 + i * 1000,
    registrant: i % 2 === 0 ? "홍길동" : "김영희"
  }));

// 화면 크기 체크 훅 (react-responsive 없이 구현)
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = e => setMatches(e.matches);
    mql.addEventListener
      ? mql.addEventListener("change", handler)
      : mql.addListener(handler);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener("change", handler)
        : mql.removeListener(handler);
    };
  }, [query]);
  return matches;
}

export default function Search() {
  // 원본 + 필터 상태
  const [originalItems] = useState(generateDummyItems());
  const [company, setCompany]             = useState("");
  const [department, setDepartment]       = useState("");
  const [location, setLocation]           = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [item, setItem]                   = useState("");
  const [barcodeKeyword, setBarcodeKeyword] = useState("");
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [viewCount, setViewCount]         = useState(30);
  const [sortField, setSortField]         = useState("");
  const [sortOrder, setSortOrder]         = useState("asc");

  // 검색 결과 + 페이징
  const [filteredItems, setFilteredItems] = useState([]);
  const [searched, setSearched]           = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const pageNumberLimit = 5;
  const itemsPerPage    = 10;

  // 상세 보기 상태
  const [detailItem, setDetailItem]       = useState(null);

  // 종속 필터 초기화
  useEffect(() => { setDepartment(""); setLocation(""); }, [company]);
  useEffect(() => { setLocation(""); }, [department]);
  useEffect(() => { setItem(""); }, [assetCategory]);

  // 검색 핸들러
  const handleSearch = () => {
    if (startDate && endDate && startDate > endDate) {
      return alert("시작일자가 종료일자보다 빠를 수 없습니다.");
    }
    let result = filterItems(originalItems, {
      company,
      department,
      location,
      assetCategory,
      item,
      barcodeKeyword,
      startDate,
      endDate,
      sortField,
      sortOrder
    });
    if (viewCount > 0) result = result.slice(0, viewCount);
    setFilteredItems(result);
    setSearched(true);
    setCurrentPage(1);
  };

  // 초기화 핸들러
  const handleReset = () => {
    setCompany(""); setDepartment(""); setLocation("");
    setAssetCategory(""); setItem(""); setBarcodeKeyword("");
    setStartDate(""); setEndDate(""); setViewCount(30);
    setSortField(""); setSortOrder("asc");
    setFilteredItems([]); setSearched(false);
    setCurrentPage(1);
  };

  // 페이징 계산
  const listToDisplay  = searched ? filteredItems : originalItems;
  const totalPages     = Math.ceil(listToDisplay.length / itemsPerPage);
  const idxLast        = currentPage * itemsPerPage;
  const idxFirst       = idxLast - itemsPerPage;
  const currentItemsPg = listToDisplay.slice(idxFirst, idxLast);
  const maxPg = Math.ceil(currentPage / pageNumberLimit) * pageNumberLimit;
  const minPg = maxPg - pageNumberLimit + 1;
  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i >= minPg && i <= maxPg) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`search-page-button ${currentPage === i ? "active" : ""}`}
          >
            {i}
          </button>
        );
      }
    }
    return pages;
  };

  return (
    <div className="search-container">
      <h1 className="search-title">자산 조회</h1>

      {/* ── 필터 UI ──────────────────────────────────────── */}
      <div className="search-bar-wrapper">
        <div className="search-bar top-bar">
          <select className="search-input" value={company} onChange={e => setCompany(e.target.value)}>
            <option value="">회사구분</option>
            {Object.keys(companyData).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="search-input" value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="">부서구분</option>
            {Object.keys(companyData[company] || {}).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="search-input" value={location} onChange={e => setLocation(e.target.value)}>
            <option value="">세부위치</option>
            {(companyData[company]?.[department] || []).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="search-input" value={assetCategory} onChange={e => setAssetCategory(e.target.value)}>
            <option value="">자산분류</option>
            {Object.keys(assetCategoryData).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="search-input" value={item} onChange={e => setItem(e.target.value)}>
            <option value="">품목</option>
            {(assetCategoryData[assetCategory] || []).map(it => <option key={it} value={it}>{it}</option>)}
          </select>
          <input
            type="number"
            className="search-input view-count"
            placeholder="출력 개수"
            value={viewCount}
            onChange={e => setViewCount(Number(e.target.value))}
          />
        </div>
        <div className="search-bar bottom-bar">
          <input
            type="text"
            className="search-input barcode-search"
            placeholder="바코드 검색"
            value={barcodeKeyword}
            onChange={e => setBarcodeKeyword(e.target.value)}
          />
          <input
            type="date"
            className="search-input date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span>~</span>
          <input
            type="date"
            className="search-input date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <select className="search-input" value={sortField} onChange={e => setSortField(e.target.value)}>
            <option value="">정렬 항목</option>
            <option value="acquisitionDate">취득일자</option>
            <option value="acquisitionPrice">취득가</option>
          </select>
          <select className="search-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select>
          <button className="search-button" onClick={handleSearch}>🔍 조회</button>
          <button className="search-button reset" onClick={handleReset}>↺ 초기화</button>
        </div>
      </div>

      {/* ── 테이블 & 페이징 ───────────────────────────────── */}
      {searched && (
        <>
          <div className="search-table-wrapper">
            <table className="search-asset-table">
              <thead>
                <tr>
                  <th>바코드</th><th>회사구분</th><th>부서구분</th><th>세부위치</th><th>취득구분</th>
                  <th>자산분류</th><th>품목</th><th>자산상태</th><th>제조사</th><th>모델</th>
                  <th>취득일자</th><th>취득가</th><th>등록자</th>
                </tr>
              </thead>
              <tbody>
                {currentItemsPg.map((row, idx) => (
                  <tr key={idx} onClick={() => setDetailItem(row)} style={{cursor:"pointer"}}>
                    <td>{row.barcode}</td><td>{row.company}</td><td>{row.department}</td><td>{row.location}</td>
                    <td>{row.acquisitionType}</td><td>{row.assetCategory}</td><td>{row.itemName}</td>
                    <td>{row.assetStatus}</td><td>{row.manufacturer}</td><td>{row.model}</td>
                    <td>{row.acquisitionDate}</td><td>{row.acquisitionPrice.toLocaleString()}</td><td>{row.registrant}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="search-pagination">
            <button onClick={()=>setCurrentPage(1)} disabled={currentPage===1} className="nav-button">처음</button>
            <button onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1} className="nav-button">이전</button>
            {renderPageNumbers()}
            <button onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="nav-button">다음</button>
            <button onClick={()=>setCurrentPage(totalPages)} disabled={currentPage===totalPages} className="nav-button">끝</button>
          </div>
        </>
      )}

      {/* ── 하이브리드 상세 보기 ─────────────────────────── */}
      {detailItem && (
        <DetailWrapper item={detailItem} onClose={()=>setDetailItem(null)} />
      )}
    </div>
  );
}

// DetailWrapper: 모바일 풀페이지 or 데스크탑 드로어
function DetailWrapper({ item, onClose }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  return isMobile
    ? <FullPageDetail item={item} onClose={onClose} />
    : <SideDrawerDetail item={item} onClose={onClose} />;
}

function FullPageDetail({ item, onClose }) {
  return (
    <div className="detail-fullpage">
      <button className="detail-back" onClick={onClose}>← 뒤로</button>
      <h2>자산 상세</h2>
      <ul>
        <li><strong>바코드:</strong> {item.barcode}</li>
        <li><strong>회사:</strong> {item.company}</li>
        <li><strong>부서:</strong> {item.department}</li>
        <li><strong>위치:</strong> {item.location}</li>
        <li><strong>자산분류:</strong> {item.assetCategory}</li>
        <li><strong>품목:</strong> {item.itemName}</li>
        <li><strong>자산상태:</strong> {item.assetStatus}</li>
        <li><strong>제조사:</strong> {item.manufacturer}</li>
        <li><strong>모델:</strong> {item.model}</li>
        <li><strong>취득일자:</strong> {item.acquisitionDate}</li>
        <li><strong>취득가:</strong> {item.acquisitionPrice.toLocaleString()}</li>
        <li><strong>등록자:</strong> {item.registrant}</li>
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
          <li><strong>바코드:</strong> {item.barcode}</li>
          <li><strong>회사:</strong> {item.company}</li>
          <li><strong>부서:</strong> {item.department}</li>
          <li><strong>위치:</strong> {item.location}</li>
          <li><strong>자산분류:</strong> {item.assetCategory}</li>
          <li><strong>품목:</strong> {item.itemName}</li>
          <li><strong>자산상태:</strong> {item.assetStatus}</li>
          <li><strong>제조사:</strong> {item.manufacturer}</li>
          <li><strong>모델:</strong> {item.model}</li>
          <li><strong>취득일자:</strong> {item.acquisitionDate}</li>
          <li><strong>취득가:</strong> {item.acquisitionPrice.toLocaleString()}</li>
          <li><strong>등록자:</strong> {item.registrant}</li>

        </ul>
      </div>
    </>
  );
}
