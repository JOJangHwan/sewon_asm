// src/page/MyInfor/MyInfoPage.js
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../utils/UserContext';
import EditModal from './EditModal';
import InfoEditModal from './MyInfoModal';
import LabelPrint from '../MyInfor/LabelPrint.js';
import { createRoot } from 'react-dom/client';
import './myInfor.css';
import { authFetchWithRefresh } from "../../utils/authFetchWithRefresh";  // 인증 포함 fetch 함수 사용
const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";


function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = e => setMatches(e.matches);
    mql.addEventListener
      ? mql.addEventListener('change', handler)
      : mql.addListener(handler);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener('change', handler)
        : mql.removeListener(handler);
    };
  }, [query]);
  return matches;
}

export default function MyInfoPage() {
  const { user } = useContext(UserContext);

  // 1) 법인 계층 (corporationList)
  const [corporations, setCorporations] = useState([]);
  const [selectedCorp, setSelectedCorp] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [locations, setLocations]     = useState([]);
  const [selectedLoc, setSelectedLoc] = useState("");


  // → ID 전용으로 분리
const [selectedCorpId, setSelectedCorpId] = useState("");
const [selectedDeptId, setSelectedDeptId] = useState("");
const [selectedLocId,  setSelectedLocId]  = useState("");



// 여기에 missing!
const [selectedCategoryId, setSelectedCategoryId] = useState("");
const [selectedItemId, setSelectedItemId]         = useState("");


  // 2) 자산 분류 계층 (assetCategories)
  const [assetCategories, setAssetCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem]   = useState("");

  // ── 검색 필터 상태



  const [assetCategory, setAssetCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [barcodeKeyword, setBarcodeKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewCount, setViewCount] = useState(30);


  // ── 필터된 결과 & 검색 여부
  const [filteredItems, setFilteredItems] = useState([]);
  const [searched, setSearched]           = useState(false);

  // ── 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage    = 10;
  const pageNumberLimit = 5;

  // ── 선택 & 모달 상태
  const [selectedBarcodes, setSelectedBarcodes] = useState(new Set());
  const [selectAll, setSelectAll]             = useState(false);
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editItem, setEditItem]               = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  

  // ── 상세보기 상태
  const [detailItem, setDetailItem] = useState(null);


  // ── 내 정보
    // ── 내 정보 – Context 값 기준으로 표시
    const userInfo = {
      company:    user?.company     ?? localStorage.getItem('company')     ?? localStorage.getItem('corporation') ?? '미지정',
      department: user?.department  ?? localStorage.getItem('department')  ?? '미지정',
      name:       user?.name        ?? localStorage.getItem('name')        ?? '이름 없음',
      id:         user?.username    ?? localStorage.getItem('username')    ?? '아이디 없음',
    };
    
// 맵핑용
     const [companyData, setCompanyData] = useState({});

     useEffect(() => {
      if (!selectedCorp || !selectedDept || corporations.length === 0) {
        setLocations([]);
        setSelectedLocId("");
        return;
      }
      const corpEntry = corporations.find(c => c.name === selectedCorp);
      if (!corpEntry) {
        setLocations([]);
        setSelectedLocId("");
        return;
      }
      const aff = corpEntry.affiliationList.find(a => a.department === selectedDept);
      if (aff && Array.isArray(aff.locations)) {
        setLocations(aff.locations.map(l => ({
          id: l.locationId,
          name: l.location
        })));
        setSelectedLocId("");
      } else {
        setLocations([]);
        setSelectedLocId("");
      }
    }, [selectedCorp, selectedDept, corporations]);


    //로그인 정보 가져오기
  //  const [logName, setLogName] = useState('');
  //  const [logCorporation,setloginCorporation]=useState('');
  //  const [logDepartment, setLogDepartment] = useState('');
  // //로그인 정보 저장
  // console.log(localStorage)
  // const savedUsername = localStorage.getItem('name');
  // const saveCorporation =localStorage.getItem('corporation');
  // const savedDepartment = localStorage.getItem('department');
  // const savedCorp = localStorage.getItem('corporation');
  // const savedDept = localStorage.getItem('department');
  // ── 상태들 선언이 끝난 바로 다음 위치에
// useEffect(() => {                     // ★ 추가
//   const corp = localStorage.getItem('corporation');  // 예: 평택공장
//   const dept = localStorage.getItem('department');   // 예: 전산운영팀
//   const savedCorp = localStorage.getItem('corporation');
// const savedDept = localStorage.getItem('department');
//   if (corp) setSelectedCorp(corp);
//   if (dept) setSelectedDept(dept);
// }, []);

  //console.log(saveCorporation,savedDepartment,savedUsername)


  // ── 종속 필터 초기화

  useEffect(() => {
    async function loadLookups() {
      try {
        // 법인 계층 호출
        const corpRes  = await authFetchWithRefresh(`${API_BASE_URL}/corporations`);
        const corpJson = await corpRes.json();
        if (corpJson.code === 1) {
          const list = corpJson.data.corporationList;
          setCorporations(list);
  
          // Context > localStorage > ""
          const ctxCorp = user?.company || localStorage.getItem("corporation") || "";
          const ctxDept = user?.department || localStorage.getItem("department") || "";
          setSelectedCorp(ctxCorp);
          setSelectedDept(ctxDept);
  
          // [optional] 만약 바로 locations 세팅도 하고 싶으면
          if (ctxCorp && ctxDept) {
            const corpEntry = list.find(c => c.name === ctxCorp);
            if (corpEntry) {
              const aff = corpEntry.affiliationList.find(a => a.department === ctxDept);
              if (aff) {
                setLocations(
                  aff.locations.map(l => ({
                    id:   l.locationId,
                    name: l.location
                  }))
                );
              }
            }
          }
        }
        // 자산 분류 계층 호출
        const typeRes  = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`);
        const typeJson = await typeRes.json();
        if (typeJson.code === 1) {
          setAssetCategories(typeJson.data.parentList);
        }
      } catch (err) {
        console.error("초기 lookup 로딩 오류:", err);
      }
    }
    loadLookups();
  }, [user]);
  



   useEffect(() => {
       // selectedDeptId 가 있을 때만 locations 세팅
       if (!selectedDeptId) return;
    
       const corp = corporations.find(c => c.id === selectedCorpId);
      const aff  = corp?.affiliationList.find(a => a.departmentId === selectedDeptId);
       if (aff) {
         setLocations(
           aff.locations.map(l => ({
            id:   l.locationId,
            name: l.location
          }))
         );
       }
     }, [selectedDeptId, selectedCorpId, corporations]);

// 자산분류 선택 시 → 품목(childList) 초기화

useEffect(() => {
  setItems([]);
  setSelectedItemId("");


  // 문자열 비교로 통일
    if (!selectedCategoryId) return;
  
    // 숫자 대 숫자로 비교
   const parent = assetCategories.find(p => p.parentId === selectedCategoryId);
  if (parent && Array.isArray(parent.childList)) {
    setItems(
      parent.childList.map(c => ({
        id:   c.childId,
        name: c.name
      }))
    );
  }
}, [selectedCategoryId, assetCategories]);


  // ── 내부 필터링
  const applyFilter = () => {
    return items.filter(it => {
if (selectedCorp   && it.company      !== selectedCorp)   return false;
if (selectedDept   && it.department   !== selectedDept)   return false;
if (selectedLoc    && it.location     !== selectedLoc)    return false;
      if (assetCategory   && it.assetCategory   !== assetCategory)   return false;
      if (itemName        && it.itemName        !== itemName)        return false;
      if (barcodeKeyword  && it.barcode         !== barcodeKeyword)  return false;
      if (startDate       && it.acquisitionDate <  startDate)       return false;
      if (endDate         && it.acquisitionDate >  endDate)         return false;
      return true;
    });
  };





  const handleReset = () => {

    setSelectedLoc(''); 
    setAssetCategory(''); setItemName(''); setBarcodeKeyword('');
    setStartDate(''); setEndDate(''); setViewCount(30);
    setFilteredItems([]); setSearched(false);
    setCurrentPage(1); setSelectAll(false); setSelectedBarcodes(new Set());
  };

  // ── 페이지별 리스트
  // const listToShow = searched ? filteredItems : items;
    // ── 페이지별 리스트 (검색 결과만 보여줌)
  const listToShow = searched ? filteredItems : [];
  const totalPages = Math.ceil(listToShow.length / itemsPerPage);
  const idxLast = currentPage * itemsPerPage;
  const idxFirst = idxLast - itemsPerPage;
  const currentList = listToShow.slice(idxFirst, idxLast);

  

  // ── 페이징 버튼
  const maxPageNum = Math.ceil(currentPage / pageNumberLimit) * pageNumberLimit;
  const minPageNum = maxPageNum - pageNumberLimit + 1;
  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i >= minPageNum && i <= maxPageNum) {
        pages.push(
          <button key={i} onClick={() => setCurrentPage(i)} className={`page-btn ${currentPage === i ? 'active' : ''}`}>
            {i}
          </button>
        );
      }
    }
    return pages;
  };

  // ── 전체/단일 선택
  const handleSelectAll = () => {
    const currentBarcodes = currentList.map(row => row.barcode);
    const isAllSelected = currentBarcodes.every(bc => selectedBarcodes.has(bc));
  
    setSelectedBarcodes(prev => {
      const next = new Set(prev);
      if (isAllSelected) {
        // 전체 해제
        currentBarcodes.forEach(bc => next.delete(bc));
      } else {
        // 전체 추가
        currentBarcodes.forEach(bc => next.add(bc));
      }
      return next;
    });
  };
  
  const handleCheckboxChange = (barcode) => {
    setSelectedBarcodes(prev => {
      const next = new Set(prev);
      if (next.has(barcode)) {
        next.delete(barcode);
      } else {
        next.add(barcode);
      }
      return next;
    });
  };
  

  // ── 수정/삭제/인쇄
  const handleModify = () => {
    if (selectedBarcodes.size !== 1) return alert("수정은 하나만 선택해야 합니다.");
                 // ✅ 그대로 넘기던 부분
    
        /* ─────────────────────────
           📌 ① 모달이 요구하는 필드명으로 변환
              · division   → acquisitionType
              · status     → assetStatus
              · parentCategory / childCategory → assetCategory / itemName
          ───────────────────────── */
      const raw = currentList.find(row => selectedBarcodes.has(row.barcode));
        // ① 화면 표기(한글) → 코드값(0/1) 치환
  const divisionCode =
    raw.division === "구매자산" ? 0 :
    raw.division === "대여자산" ? 1 : raw.division;         // 이미 0/1 이면 그대로

  const statusCode   =
    raw.status   === "사용"   ? 0 :
    raw.status   === "미사용" ? 1 : raw.status;
      const mapped = {
          ...raw,
             acquisitionType: String(divisionCode),   // ← 모달에서 보여줄 값
             assetStatus:     String(statusCode),
          assetCategory:   raw.parentCategory,
          itemName:        raw.childCategory,
      };
    
        setEditItem(mapped); 
    setIsModalOpen(true);
  };


  const handleDelete = async () => {
    const ids = currentList
      .filter(item => selectedBarcodes.has(item.barcode))
      .map(item => item.id)
      .filter(Boolean);
    if (!selectedBarcodes.size) return alert("삭제할 항목을 선택하세요.");
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
  
    // 선택된 바코드로부터 id 추출 (items 또는 currentList 기준)
  
    if (!ids.length) return alert("삭제할 ID가 없습니다.");
  
    try {
      const res = await authFetchWithRefresh(`${API_BASE_URL}/assets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),    // { ids: [1, 2, 3] }
      });
      const json = await res.json();
      if (json.code === 1) {
        // 삭제 성공 시, 목록 갱신
        setItems(prev => prev.filter(item => !ids.includes(item.id)));
        setFilteredItems(prev => prev.filter(item => !ids.includes(item.id)));
        setSelectedBarcodes(new Set());
        setSelectAll(false);
        alert("자산이 삭제되었습니다.");
      } else {
        alert("삭제 실패: " + (json.message || "서버 오류"));
      }
    } catch (err) {
      console.error("삭제 요청 오류:", err);
      alert("서버와 통신할 수 없습니다.");
    }
  };

  const handlePrint = () => {
if (!selectedBarcodes.size) return alert("인쇄할 항목을 선택하세요!");
const toPrint = listToShow.filter(row => selectedBarcodes.has(row.barcode));

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return alert('팝업 차단을 해제해주세요.');

    printWindow.document.write(`
      <html>
        <head>
          <title>라벨 인쇄</title>
          <style>
            @page {
              size: 45mm 15mm;
              margin: 0;
            }
    
            html, body {
              width: 45mm;
              height: 15mm;
              margin: 0;
              padding: 0;
            }
    
  .label-print-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    margin: 0;
    width: 45mm;
  }
    
  .label-box {
    width: 45mm;
    height: 15mm;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    page-break-after: always;
    box-sizing: border-box;
  }
    
            .qr-section {
              width: 13mm;
              height: 13mm;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-left: 1mm;
            }
    
            .qr-canvas {
              width: 11.5mm !important;
              height: 11.5mm !important;
            }
    
            .info-section {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              padding-left: 1.5mm;
            }
    
            .logo-wrapper {
              width: 100%;
              display: flex;
              justify-content: flex-start;
              margin-bottom: 0.5mm;
            }
    
            .logo {
              max-width: 30mm;
              height: 4.5mm;
              object-fit: contain;
            }
    
            .text-line {
              font-size: 2.2mm;
              font-family: 'Arial', sans-serif;
              line-height: 2.6mm;
              margin: 0;
              padding: 0;
              white-space: nowrap;
              color: black;
            }
    
            .barcode-text {
              font-size: 2.6mm;
              font-weight: bold;
              margin-top: 0.5mm;
            }
          </style>
        </head>
        <body>
          <div id="print-root" class="label-print-wrapper">
            <div class="label-box">
              <div class="qr-section">
                <canvas class="qr-canvas"></canvas>
              </div>
              <div class="info-section">
                <div class="logo-wrapper">
                  <img src="로고URL" class="logo" />
                </div>
                <p class="text-line">평택공장 전산운영팀 전산실</p>
                <p class="text-line barcode-text">200RSFFL1</p>
                <p class="text-line">노트북</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    
    printWindow.document.close();
  
    const interval = setInterval(() => {
      const container = printWindow.document.getElementById('print-root');
      if (container) {
        clearInterval(interval);
        const root = createRoot(container);
        root.render(
          <LabelPrint
            selectedAssets={toPrint}
            onAllImagesLoaded={() => {
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            }}
          />
        );
      }
    }, 100);
  };

  const handleSearch = async () => {
    // … 검색 로직 …
    // 기본 유효성 검사 (날짜 범위)
    if (startDate && endDate && startDate > endDate) {
        return alert("시작일이 종료일보다 클 수 없습니다.");
      }
  
      // 쿼리스트링 빌드
    const params = new URLSearchParams();
     if (selectedLocId)        params.append("locationId", selectedLocId);
     if (selectedCategoryId) params.append("parentTypeId", selectedCategoryId); // ✅
     if (selectedItemId)     params.append("childTypeId",  selectedItemId); 
      if (startDate)         params.append("after", startDate);
      if (endDate)           params.append("before", endDate);
      if (viewCount > 0)     params.append("size", viewCount);

  
      try {
        const url = `${API_BASE_URL}/assets/paged?${params.toString()}`;
        const res = await authFetchWithRefresh(url);
        const json = await res.json();
        if (json.code !== 1 || json.data.list.length === 0) {
         alert("조건에 맞는 자산이 없습니다.");
          setFilteredItems([]);
          setSearched(true);
          return;
        }
        // console.log("📦 자산 리스트:", json.data.list);
        // // data.list 안에 자산 배열이 들어옵니다
        // setFilteredItems(json.data.list);
                console.log("📦 자산 리스트:", json.data.list);

        /*  (1) 백엔드 → 프런트 맵핑
           ──────────────────────────────
           · corporation  ➜ company
           · parentCategory / childCategory 등은
             이미 프런트에서 쓰이는 이름이므로 그대로 둡니다.
        */
        const mapped = json.data.list.map(it => ({
          ...it,
          company: it.corporation,   // ✅ 회사 컬럼에 쓸 필드
        }));

        /*  (2) 상태 반영 */
        setFilteredItems(mapped);
        setSearched(true);
        setSelectedBarcodes(new Set());   // 페이징·체크박스 초기화
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
        alert("서버 통신 중 오류가 발생했습니다.");
      }
  };




  return (
    <div className="my-info-container">

      {/* 1. 내정보 + 수정 버튼 */}
      <div className="top-section">
  <h2 className="section-title">내 정보</h2>
  <div className="user-info-inline">
    <div>소속: {userInfo.company} {userInfo.department}</div>
    <div>아이디: {userInfo.id}</div>
    <div>이름: {userInfo.name}</div>
  </div>
  <button
    className="btn-edit-info"
    onClick={() => setIsInfoModalOpen(true)}
  >
    내 정보 수정하기
  </button>
</div>

    {/* 2. 조회 필터 */}
<div className="search-section">
  <h2 className="section-title">자산 조회</h2>
  <div className="search-bar-wrapper">
  <div className="search-bar-row">
    {/* === 1행: 드롭다운 + 출력개수 === */}
    <div className="search-bar-row">
      {/* 세부위치 */}
      <select
        className="search-input"
        value={selectedLocId}
        onChange={e => setSelectedLocId(e.target.value)}
      >
        <option value="">세부위치</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>
      {/* 분류 */}
      <select
        className="search-input"
        value={selectedCategoryId}
        onChange={e => setSelectedCategoryId(Number(e.target.value))}
      >
        <option value="">분류</option>
        {assetCategories.map(cat => (
          <option key={cat.parentId} value={cat.parentId}>{cat.name}</option>
        ))}
      </select>
      {/* 품목 */}
      <select
        className="search-input"
        value={selectedItemId}
        onChange={e => setSelectedItemId(Number(e.target.value))}
        disabled={!selectedCategoryId}
      >
        <option value="">품목</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      {/* 출력개수 */}
      <input
        type="number"
        className="search-input view-count"
        placeholder="출력개수"
        value={viewCount}
        onChange={e => setViewCount(+e.target.value)}
      />
    </div>

    {/* === 2행: 날짜 + 버튼 === */}
    <div className="search-bar-row buttons">
      <input
        type="date"
        className="search-input"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
      />
      <span style={{ fontWeight: 500 }}>~</span>
      <input
        type="date"
        className="search-input"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
      />
      <button className="btn-search" onClick={handleSearch}>🔍 조회</button>
      <button className="btn-reset" onClick={handleReset}>↺ 초기화</button>
      </div>
    </div>
  </div>
</div>


      {/* 3. 제목 + 액션 버튼 */}
      <div className="bottom-header">
        <h2 className="section-title">부서 자산 정보</h2>
        <div className="button-group">
          <button className="action-button" onClick={handleModify} disabled={selectedBarcodes.size !== 1}>
            수정하기
          </button>
<button
  className="action-button"
  onClick={handleDelete}
  disabled={!selectedBarcodes.size}
>
  삭제하기
</button>
          <button className="action-button" onClick={handlePrint} disabled={!selectedBarcodes.size}>
            인쇄하기
          </button>
        </div>
      </div>

      {/* 4. 테이블 & 페이징 */}
      <div className="table-section">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                </th>
                <th>바코드</th><th>회사</th><th>부서</th><th>위치</th>
                <th>취득구분</th><th>자산분류</th><th>품목</th><th>자산상태</th>
                <th>제조사</th><th>모델</th><th>취득일자</th><th>취득가</th>
              </tr>
            </thead>
            <tbody>
            {currentList.length === 0
    ? (
      <tr>
        <td colSpan={13} style={{ textAlign: 'center', padding: '1rem 0' }}>
          검색 결과가 없습니다.
        </td>
      </tr>
    )
    : currentList.map((row, idx) => (
      <tr key={idx} onClick={() => setDetailItem(row)} style={{ cursor: 'pointer' }}>
                  <td>
                  <input
  type="checkbox"
  checked={selectedBarcodes.has(row.barcode)}
  onClick={e => e.stopPropagation()}
  onChange={() => handleCheckboxChange(row.barcode)}
/>
                  </td>
                  <td>{row.barcode}</td><td>{row.company}</td><td>{row.department}</td><td>{row.location}</td>
                  <td>{row.division}</td><td>{row.parentCategory}</td><td>{row.childCategory}</td>   
                  <td>{row.status}</td><td>{row.manufacturer}</td><td>{row.model}</td>
                  <td>{row.acquisitionDate}</td><td>{row.acquisitionPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="page-btn" onClick={()=>setCurrentPage(1)} disabled={currentPage===1}>처음</button>
          <button className="page-btn" onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}>이전</button>
          {renderPageNumbers()}
          <button className="page-btn" onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>다음</button>
          <button className="page-btn" onClick={()=>setCurrentPage(totalPages)} disabled={currentPage===totalPages}>끝</button>
        </div>
      </div>

      {/* 5. 상세보기 */}
      {detailItem && <DetailWrapper item={detailItem} onClose={()=>setDetailItem(null)} />}

      {/* 6. 모달 */}
      {isInfoModalOpen && (
        <InfoEditModal
          userInfo={userInfo}
          onClose={()=>setIsInfoModalOpen(false)}
          onSave={newInfo=>{
            alert('내 정보가 수정되었습니다.');
            setIsInfoModalOpen(false);
          }}
        />
      )}
      {isModalOpen && editItem && (
        <EditModal
          item={editItem}
          onSave={edited=>{
                 const arr = [...items];
                 const gi = arr.findIndex(i => i.barcode === edited.barcode);
                 if (gi !== -1) arr[gi] = edited;
            setItems(arr);
            setIsModalOpen(false);
            setSelectedBarcodes(new Set()); setSelectAll(false);
            alert('수정되었습니다.');
          }}
          onClose={()=>setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── DetailWrapper 구현
function DetailWrapper({ item, onClose }) {
  const isMobile = useMediaQuery('(max-width:768px)');
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
        <li><strong>취득일자:</strong> {item.acquisitionDate}</li>
        <li><strong>취득가:</strong> {item.acquisitionPrice}</li>
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
          <li><strong>취득일자:</strong> {item.acquisitionDate}</li>
          <li><strong>취득가:</strong> {item.acquisitionPrice}</li>
        </ul>
      </div>
    </>
  );
}
