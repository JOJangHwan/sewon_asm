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
    registrant: "홍길동"
  }));

  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [item, setItem] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  useEffect(() => {
    setDepartment("");
    setLocation("");
  }, [company]);

  useEffect(() => {
    setLocation("");
  }, [department]);

  useEffect(() => {
    setItem("");
  }, [category]);

  const handleClickPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const pageGroupSize = 5;
  const groupStart = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
  const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

  const isAllSelected = selectedItems.length === currentItems.length && currentItems.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map(item => item.barcode));
    }
  };

  const handleSelectItem = (barcode) => {
    setSelectedItems(prev =>
      prev.includes(barcode)
        ? prev.filter(id => id !== barcode)
        : [...prev, barcode]
    );
  };

  return (
    <div className="audit-search-container">
      <h2 className="audit-title">실사 조회</h2>

      <div className="audit-search-filter">
        <select className="audit-search-simple" value={company} onChange={(e) => { setCompany(e.target.value); }}>
          <option value="">회사구분</option>
          {Object.keys(companyData).map((comp) => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>

        <select className="audit-search-simple" value={department} onChange={(e) => { setDepartment(e.target.value); }}>
          <option value="">부서구분</option>
          {company && Object.keys(companyData[company] || {}).map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>

        <select className="audit-search-simple" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">세부위치</option>
          {(companyData[company]?.[department] || []).map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <select className="audit-search-simple" value={category} onChange={(e) => { setCategory(e.target.value); }}>
          <option value="">자산분류</option>
          {Object.keys(assetCategoryData).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select className="audit-search-simple" value={item} onChange={(e) => setItem(e.target.value)}>
          <option value="">품목</option>
          {(assetCategoryData[category] || []).map(it => (
            <option key={it} value={it}>{it}</option>
          ))}
        </select>

        <input type="text" placeholder="검색어" className="audit-search-simple" />
        <input type="date" className="audit-search-simple" />
        <input type="date" className="audit-search-simple" />
        <button className="audit-search-btn"><FaSearch /> 조회</button>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
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
            {currentItems.map((item, idx) => (
              <tr key={idx}>
                <td><input type="checkbox" checked={selectedItems.includes(item.barcode)} onChange={() => handleSelectItem(item.barcode)} /></td>
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

      <div className="audit-pagination">
        <button onClick={() => handleClickPage(1)}>처음</button>
        <button onClick={() => handleClickPage(currentPage - 1)}>이전</button>
        {Array.from({ length: groupEnd - groupStart + 1 }, (_, idx) => groupStart + idx).map((pageNum) => (
          <button key={pageNum} onClick={() => handleClickPage(pageNum)} className={currentPage === pageNum ? "active" : ""}>{pageNum}</button>
        ))}
        <button onClick={() => handleClickPage(currentPage + 1)}>다음</button>
        <button onClick={() => handleClickPage(totalPages)}>끝</button>
      </div>
    </div>
  );
}

