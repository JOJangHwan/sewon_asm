import React, { useState, useEffect, useRef } from "react";
import "./Search.css";
import { authFetchWithRefresh } from "../../utils/authFetchWithRefresh";  // 인증 포함 fetch 함수 사용
import { createRoot } from "react-dom/client";
import LabelPrint from "../MyInfor/LabelPrint";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";


export default function Search() {
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
  const [viewCount, setViewCount] = useState(30);
  
    const [companyList, setCompanyList] = useState([]);
    const [companyIdMap, setCompanyIdMap] = useState({});  // ✅ ID 매핑용

    const [parentTypeId, setParentTypeId] = useState(null);  // 자산 분류 ID
    const [assetCategoryMap, setAssetCategoryMap] = useState({});

    const [childTypeId, setChildTypeId] = useState(null);    

    const headerCheckboxRef = useRef(); // ✅ ref 선언

    


    const [corporationId, setCorporationId] = useState(null);
const [affiliationId, setAffiliationId] = useState(null);
const [locationId, setLocationId] = useState(null);


const handlePrint = () => {
  /* 1) 선택 검사 */
  if (selected.size === 0) {
    alert('인쇄할 항목을 한 개 이상 체크해주세요.');
    return;
  }

  /* 2) 선택된 자산 목록 */
  const toPrint = items.filter((it) => selected.has(it.barcode));

  /* 3) 팝업 */
  const popup = window.open('', '_blank', 'width=900,height=600');
  if (!popup) {
    alert('팝업이 차단되었습니다. 팝업 허용을 확인하세요.');
    return;
  }

  /* 4) 템플릿 주입 */
  popup.document.write(`
    <html>
      <head>
        <title>라벨 인쇄</title>
        <style>
          @page { size: 40mm 15mm; margin: 0; }
          @media print { body { margin: 0; } }
          html,body { width:40mm; height:15mm; margin:0; padding:0; font-family:Arial; }
          .label-print-wrapper{display:flex;flex-direction:column;width:40mm;height:15mm;margin:0;padding:0;}
          .label-box{width:40mm;height:15mm;display:flex;align-items:center;margin:0;padding:0;page-break-after:always;}
          .qr-section{width:13mm;display:flex;justify-content:center;align-items:center;}
          .qr-canvas{width:11.5mm!important;height:11.5mm!important;}
          .info-section{display:flex;flex-direction:column;align-items:flex-start;padding-left:1.5mm;}
          .logo-wrapper{width:100%;display:flex;justify-content:flex-start;margin-bottom:0.3mm;}
          .logo{max-width:32mm;height:5.5mm;object-fit:contain;}
          .text-line{font-size:2.2mm;margin:0;padding:0;white-space:nowrap;}
          .barcode-text{font-size:2.6mm;font-weight:bold;}
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);
  popup.document.close();

  /* 5) React 라벨 렌더 후 print */
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
};   // ←★★ handlePrint 닫는 중괄호 꼭 필요


  /* -----------------------------------------------------------
     📑 Excel 다운로드
  ----------------------------------------------------------- */
  const handleExportExcel = () => {
    if (!items.length) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

    // 1) 시트에 넣을 JSON 데이터 작성
    const exportData = items.map(item => ({
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
    }));

    // 2) 워크시트/워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "자산목록");

    // 3) 클라이언트에 저장
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob   = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "자산_조회_결과.xlsx");
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
        const res = await authFetchWithRefresh(`${API_BASE_URL}/corporations`);
        const result = await res.json();
    
        console.log("📦 corporations API 응답 전체 (JSON 형태):");//자산 찍는 부분분
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
          alert(result.message || '법인 정보 조회 실패');
        }
              // 자산 유형 계층 정보 가져오기
              // const typeRes = await authFetchWithRefresh('http://192.168.0.220:8888/asset-types/hierarchy');
              const typeRes = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`);
              const typeResult = await typeRes.json();

              //console.log("📦 부서 API 응답 전체 (JSON 형태):");
             // console.log(JSON.stringify(typeResult, null, 2));
              
              if (typeResult.code === 1 && typeResult.data?.parentList) {
                const nestedAssetType = {};
                const typeIdMap = {};
                console.log('자산 분류 데이터:', nestedAssetType);
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
                alert(typeResult.message || '자산 유형 정보 조회 실패');
              }





    } catch (err) {
      console.error('초기 데이터 조회 실패:', err);
      alert('초기 데이터를 불러오지 못했습니다.');
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
      return alert("시작일이 종료일보다 늦을 수 없습니다.");
    }
  
    try {
      let result = [];
  
      if (barcode.trim()) {
        const url = `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcode.trim())}`;
        const res      = await authFetchWithRefresh(url, { method: 'GET' });
        const resJson  = await res.json();
        // const res = await fetch(`http://192.168.0.220:8888/assets/${barcode}`);

        if (resJson.code !== 1 || !resJson.data) {
          alert('❌ 해당 바코드를 찾을 수 없습니다.');
          setItems([]);          // 테이블 비우기
          setSearched(true);
          return;
        }
  
  /* 테이블에 단건이라도 배열 형태로 넣어야 map() 가능 */
  result = [resJson.data];
      } else {
        // ✅ ID가 전부 있어야 검색 가능
        if (!corporationId || !affiliationId || !locationId) {
          console.warn("❗ ID 누락 확인", {
            company, department, location,
            corporationId, affiliationId, locationId
          });
          alert("회사, 부서, 세부위치를 모두 선택해야 검색할 수 있습니다.");
          return;
        }

        if (!locationId) {
          console.warn("❗ 세부위치 ID 누락:", {
            company, department, location, locationId
          });
          alert("세부위치를 선택해야 검색할 수 있습니다.");
          return;
        }
  
        // ✅ GET 방식 쿼리스트링 구성
        const queryParams = new URLSearchParams();
        queryParams.append("locationId", locationId);



        if (location) queryParams.append("location", location);       // 세부위치 이름
        //if (assetCategory) queryParams.append("parentType", assetCategory); // 자산 대분류
        //if (itemName) queryParams.append("childType", itemName);      // 자산 중분류
        if (parentTypeId) queryParams.append("parentTypeId", parentTypeId);
        if (childTypeId) queryParams.append("childTypeId", childTypeId);
        if (startDate) queryParams.append("after", startDate);        // 시작일
        if (endDate) queryParams.append("before", endDate);           // 종료일
        if (sortField) queryParams.append("sortField", sortField);    // 정렬 필드
        queryParams.append("size", viewCount || 30);                  // 페이지당 개수
  
        // const url = `http://192.168.0.220:8888/assets/paged?${queryParams.toString()}`;
        const url = `${API_BASE_URL}/assets/paged?${queryParams.toString()}`;
        console.log("최종 전송 URL:", url);   // << 이거 둘 다 추가!
        console.log("📤 최종 전송 URL:", url);
        console.log("📦 검색 조건 요약:", {
          locationId,
          parentTypeId,
          childTypeId,
          startDate,
          endDate,
          sortField,
          sortOrder,
          viewCount,
        });
  
        const res = await authFetchWithRefresh(url);
        const resData = await res.json();

        // ✅ 응답 전체 로그 출력
//console.log("✅ 응답 전체:", JSON.stringify(resData, null, 2));

const data = resData.data?.list || [];





  
        if (!Array.isArray(data) || data.length === 0) {
          alert("❌ 자산 검색 실패: 조건에 맞는 항목이 없습니다.");
          setItems([]);
          setSearched(true);
          return;
        }
  
        result = data;
      }
  
      setItems(result);
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
          <select className="search-input" value={company} onChange={e => {
  const selected = e.target.value;
  setCompany(selected);
  const corpId = companyIdMap[selected]?.id;
  setCorporationId(corpId || null);
}}>
            <option value="">회사구분</option>
            {Object.keys(companyData).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="search-input" value={department} onChange={e => {
  const selected = e.target.value;
  setDepartment(selected);

  const companyEntry = companyIdMap[company];
  if (companyEntry) {
    const deptEntry = companyEntry.departments?.[selected];
    if (deptEntry) {
      console.log("✅ 부서 ID 찾음:", deptEntry.id);
      setAffiliationId(deptEntry.id);
    } else {
      console.warn("❌ 부서 ID 찾을 수 없음");
      setAffiliationId(null);
    }
  } else {
    console.warn("❌ 회사 ID 매핑 없음:", company);
    setAffiliationId(null);
  }
}}>

            <option value="">부서구분</option>
            {Object.keys(companyData[company] || {}).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="search-input" value={location} onChange={e => {
  const selected = e.target.value;
  setLocation(selected);
  const locId = companyIdMap[company]?.departments?.[department]?.locations?.[selected];
  console.log("세부위치 선택:", selected, "→ ID:", locId);
  setLocationId(locId || null);
}}>
  <option value="">세부위치</option>
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
<option value="">자산분류</option>
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
  <option value="">품목</option>
  {(assetCategoryData[assetCategory] || []).map(i => (
    <option key={i} value={i}>{i}</option>
  ))}
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
          {/* <select className="search-input" value={sortField} onChange={e => setSortField(e.target.value)}>
            <option value="">정렬 항목</option>
            <option value="acquisitionDate">취득일자</option>
            <option value="acquisitionPrice">취득가</option>
          </select>
          <select className="search-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="asc">오름차순</option>
            <option value="desc">내림차순</option>
          </select> */}
          <button className="search-button" onClick={handleSearch}>🔍 조회</button>
          <button className="search-button print" onClick={handlePrint}>🖨️ 인쇄</button>
          <button className="search-button reset" onClick={handleReset}>↺ 초기화</button>
          <button className="search-button download" onClick={handleExportExcel}>⬇️내려받기</button>
        </div>
      </div>

      {searched && (
      <div className="search-table-wrapper">
        <table className="search-asset-table">
          <thead>
            <tr>
              {/* 🆕 전체선택 체크박스 */}
              <th>
              <input
  type="checkbox"
  ref={headerCheckboxRef} // ✅ ref 연결
  checked={selected.size === items.length && items.length > 0}
  onChange={toggleAll}
/>

              </th>
              <th>바코드</th><th>회사</th><th>부서</th><th>위치</th>
              <th>자산분류</th><th>품목</th><th>상태</th>
              <th>제조사</th><th>모델</th><th>취득일자</th>
              <th>취득가</th><th>등록자</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.barcode}>
                {/* 🆕 개별 체크박스 */}
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(item.barcode)}
                    onChange={() => toggleRow(item.barcode)}
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
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}