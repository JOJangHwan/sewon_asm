import { useState, useEffect } from "react";
import "./Search.css";

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

export default function Search() {
  const originalItems = Array.from({ length: 150 }, (_, i) => ({
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
    registrant: "홍길동"
  }));

  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [item, setItem] = useState("");
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [filteredItems, setFilteredItems] = useState(originalItems);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const pageNumberLimit = 5;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  useEffect(() => {
    setDepartment("");
    setLocation("");
  }, [company]);

  useEffect(() => {
    setLocation("");
  }, [department]);

  useEffect(() => {
    setItem("");
  }, [assetCategory]);

  const handleSearch = () => {
    let result = originalItems.filter(item => {
      const matchesCompany = company ? item.company === company : true;
      const matchesDepartment = department ? item.department === department : true;
      const matchesLocation = location ? item.location === location : true;
      const matchesCategory = assetCategory ? item.assetCategory === assetCategory : true;
      const matchesItem = item ? item.itemName === item : true;
      const matchesKeyword = keyword ? item.barcode.includes(keyword) : true;
      const matchesStart = startDate ? item.acquisitionDate >= startDate : true;
      const matchesEnd = endDate ? item.acquisitionDate <= endDate : true;

      return (
        matchesCompany &&
        matchesDepartment &&
        matchesLocation &&
        matchesCategory &&
        matchesItem &&
        matchesKeyword &&
        matchesStart &&
        matchesEnd
      );
    });
    setFilteredItems(result);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setCompany("");
    setDepartment("");
    setLocation("");
    setAssetCategory("");
    setItem("");
    setKeyword("");
    setStartDate("");
    setEndDate("");
    setFilteredItems(originalItems);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const maxPageNumberLimit = Math.ceil(currentPage / pageNumberLimit) * pageNumberLimit;
  const minPageNumberLimit = maxPageNumberLimit - pageNumberLimit + 1;

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i >= minPageNumberLimit && i <= maxPageNumberLimit) {
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

      <div className="search-bar-wrapper">
        <div className="search-bar">
          <select className="search-input" value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">회사구분</option>
            {Object.keys(companyData).map((comp) => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>

          <select className="search-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">부서구분</option>
            {company && Object.keys(companyData[company] || {}).map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>

          <select className="search-input" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">세부위치</option>
            {company && department && (companyData[company]?.[department] || []).map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select className="search-input" value={assetCategory} onChange={(e) => setAssetCategory(e.target.value)}>
            <option value="">자산분류</option>
            {Object.keys(assetCategoryData).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select className="search-input" value={item} onChange={(e) => setItem(e.target.value)}>
            <option value="">품목</option>
            {(assetCategoryData[assetCategory] || []).map(it => (
              <option key={it} value={it}>{it}</option>
            ))}
          </select>

          <input type="text" className="search-input wide" placeholder="검색어" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <input type="date" className="search-input date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="search-input date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button className="search-button" onClick={handleSearch}>🔍 조회</button>
          <button className="search-button reset" onClick={handleReset}>↺ 초기화</button>
        </div>
      </div>

      <div className="search-table-wrapper">
        <table className="search-asset-table">
          <thead>
            <tr>
              <th>바코드</th>
              <th>회사구분</th>
              <th>부서구분</th>
              <th>세부위치</th>
              <th>취득구분</th>
              <th>자산분류</th>
              <th>품목</th>
              <th>자산상태</th>
              <th>제조사</th>
              <th>모델</th>
              <th>취득일자</th>
              <th>취득가</th>
              <th>등록자</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={index}>
                <td>{item.barcode}</td>
                <td>{item.company}</td>
                <td>{item.department}</td>
                <td>{item.location}</td>
                <td>{item.acquisitionType}</td>
                <td>{item.assetCategory}</td>
                <td>{item.itemName}</td>
                <td>{item.assetStatus}</td>
                <td>{item.manufacturer}</td>
                <td>{item.model}</td>
                <td>{item.acquisitionDate}</td>
                <td>{item.acquisitionPrice}</td>
                <td>{item.registrant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="search-pagination">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="search-page-button">처음</button>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="search-page-button">이전</button>
        {renderPageNumbers()}
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="search-page-button">다음</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="search-page-button">끝</button>
      </div>
    </div>
  );
}
