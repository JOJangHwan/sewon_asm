import React, { useEffect, useState } from "react";
import "./Search.css";

export default function Search() {
  const [companyData, setCompanyData] = useState({});
  const [assetCategoryData, setAssetCategoryData] = useState({});
  const [items, setItems] = useState([]);
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
  const [viewCount, setViewCount] = useState(30);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res1 = await fetch("http://localhost:8080/api/lookups/companies");
        const company = await res1.json();
        setCompanyData(company);

        const res2 = await fetch("http://localhost:8080/api/lookups/categories");
        const category = await res2.json();
        setAssetCategoryData(category);
      } catch (err) {
        console.error("lookup 불러오기 실패", err);
      }
    };
    fetchLookups();
  }, []);

  useEffect(() => { setDepartment(""); setLocation(""); }, [company]);
  useEffect(() => { setLocation(""); }, [department]);
  useEffect(() => { setItemName(""); }, [assetCategory]);

  const handleSearch = async () => {
    if (startDate && endDate && startDate > endDate) {
      return alert("시작일이 종료일보다 늦을 수 없습니다.");
    }
  
    try {
      let result = [];
  
      if (barcode.trim()) {
        const res = await fetch(`http://localhost:8080/api/assets/${barcode}`);
        const data = await res.json();
  
        if (data === 0 || !data) {
          alert("❌ 바코드 조회 실패: 데이터가 없습니다.");
          setItems([]);
          setSearched(true);
          return;
        }
  
        result = [data]; // 1건이라도 있으면 배열로 넣기
      } else {
        const res = await fetch("http://localhost:8080/api/assets/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company, department, location,
            assetCategory, itemName, startDate, endDate,
            sortField, sortOrder,
          }),
        });
  
        const data = await res.json();
  
        if (data === 0 || !Array.isArray(data)) {
          alert("❌ 자산 검색 실패: 조건에 맞는 항목이 없습니다.");
          setItems([]);
          setSearched(true);
          return;
        }
  
        result = data;
      }
  
      setItems(viewCount > 0 ? result.slice(0, viewCount) : result);
      setSearched(true);
    } catch (err) {
      console.error("❌ 검색 중 예외 발생:", err);
      alert("🚨 서버와의 연결에 실패했습니다. 담당자에게 문의하세요.");
    }
  };
  

  const handleReset = () => {
    setCompany(""); setDepartment(""); setLocation("");
    setAssetCategory(""); setItemName(""); setBarcode("");
    setStartDate(""); setEndDate(""); setSortField(""); setSortOrder("asc");
    setItems([]); setSearched(false); setViewCount(30);
  };

  return (
    <div className="search-container">
      <h1 className="search-title">자산 조회</h1>

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
          <select className="search-input" value={itemName} onChange={e => setItemName(e.target.value)}>
            <option value="">품목</option>
            {(assetCategoryData[assetCategory] || []).map(i => <option key={i} value={i}>{i}</option>)}
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
          <input type="text" className="search-input barcode-search" placeholder="바코드 검색"
                 value={barcode} onChange={e => setBarcode(e.target.value)} />
          <input type="date" className="search-input date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>~</span>
          <input type="date" className="search-input date" value={endDate} onChange={e => setEndDate(e.target.value)} />
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

      {searched && (
        <div className="search-table-wrapper">
          <table className="search-asset-table">
            <thead>
              <tr>
                <th>바코드</th><th>회사</th><th>부서</th><th>위치</th><th>자산분류</th>
                <th>품목</th><th>상태</th><th>제조사</th><th>모델</th><th>취득일자</th><th>취득가</th><th>등록자</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.barcode}</td><td>{item.company}</td><td>{item.department}</td><td>{item.location}</td>
                  <td>{item.assetCategory}</td><td>{item.itemName}</td><td>{item.assetStatus}</td>
                  <td>{item.manufacturer}</td><td>{item.model}</td><td>{item.acquisitionDate}</td>
                  <td>{Number(item.acquisitionPrice).toLocaleString()}</td><td>{item.registrant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
