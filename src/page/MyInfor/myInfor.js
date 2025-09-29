// src/page/MyInfor/MyInfoPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref.js';
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

// 화면 크기/포인터 특성으로 web/pda 모드 결정
function useResponsiveMode() {
  const [mode, setMode] = React.useState('web');
  React.useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      setMode((w <= 920 || (coarse && w <= 1200)) ? 'pda' : 'web');
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

export default function MyInfoPage() {
 const { t, i18n } = useTranslation('myInfor');
    const langUI = getUILang();          // 'KR' | 'CN' | 'VN'
     const langI18n = uiToI18n(langUI);        // 'ko'|'zh'|'vi'
  const mode = useResponsiveMode();
  const { user } = useContext(UserContext);
  
  // 🔎 UserContext 소비자 측 스냅샷 로그
  useEffect(() => {
    if (!user) {
      //console.log('[UserContext][MyInfoPage] user is null/undefined');
      return;
    }
    //console.groupCollapsed('%c[UserContext][MyInfoPage] user snapshot', 'color:#0aa;font-weight:600;');
    //console.log('raw user object:', user);
    const {
      username, name, company, department,
      departmentId, corporationId, roles,
      // 필요하면 추가 키도 여기서 펼쳐서 보세요
    } = user || {};
    // console.table([{
    //   username, name, company, department,
    //   departmentId, corporationId,
    //   roles: Array.isArray(roles) ? roles.join(', ') : roles
    // }]);
   // console.groupEnd();
  }, [user]);

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

// ✅ UserContext의 affiliationId(부서ID) 우선, 없으면 id 사용
useEffect(() => {
  if (!selectedDeptId && (user?.affiliationId ?? user?.id) != null) {
    setSelectedDeptId(user.affiliationId ?? user.id);
   // console.log("[MyInfoPage] selectedDeptId <-", user.affiliationId ?? user.id);
  }
}, [user, selectedDeptId]);


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
  const [loading, setLoading] = useState(false);// 로딩창
  // ✅ 자산 상태(사용/미사용/폐각) 필터
  const [statusFilter, setStatusFilter] = useState("");
  const STATUS_CODE = { "사용": 0, "미사용": 1, "폐각": 2 };

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
    company:    user?.company     ?? localStorage.getItem('company')     ?? localStorage.getItem('corporation') ?? t('MyInfo_Unspecified'),
    department: user?.department  ?? localStorage.getItem('department')  ?? t('MyInfo_Unspecified'),
    name:       user?.name        ?? localStorage.getItem('name')        ?? t('MyInfo_NoName'),
    id:         user?.username    ?? localStorage.getItem('username')    ?? t('MyInfo_NoId'),
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
        // 🔽 이름 → ID 매핑 (selectedCorpId, selectedDeptId 채우기)
         // 1) 법인 ID
         const corpEntryByName = list.find(c => c.name === ctxCorp);
         if (corpEntryByName) {
           setSelectedCorpId(corpEntryByName.id);
          // 2) 부서 ID (키 이름/타입 차이 대응)
          const aff = corpEntryByName.affiliationList?.find(a => a.department === ctxDept);
          if (aff?.departmentId || aff?.affiliationId || aff?.id) {
            setSelectedDeptId(aff.departmentId ?? aff.affiliationId ?? aff.id);
          }
         }
  
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
      //  console.error("초기 lookup 로딩 오류:", err);
      }
    }
    loadLookups();
  }, [user]);
  



   useEffect(() => {
       // selectedDeptId 가 있을 때만 locations 세팅
       if (!selectedDeptId) return;
    
       const corp = corporations.find(c => c.id === selectedCorpId);
  const aff  = corp?.affiliationList.find(a =>
    String(a.departmentId ?? a.affiliationId ?? a.id) === String(selectedDeptId)
  );
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
    setStatusFilter(""); // ✅ 상태 필터 리셋
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
    if (selectedBarcodes.size !== 1) return alert(t('MyInfo_EditSelectOnlyOne'));
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
    if (!selectedBarcodes.size) return alert(t('MyInfo_SelectItemsToDelete'));
    if (!window.confirm(t('MyInfo_ConfirmDelete'))) return;
  
    // 선택된 바코드로부터 id 추출 (items 또는 currentList 기준)
  
    if (!ids.length) return alert("삭제할 ID가 없습니다.");
  
    try {
      const res = await authFetchWithRefresh(`${API_BASE_URL}/assets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),    // { ids: [1, 2, 3] }
      });
      const json = await res.json();
    //  console.log('자산 검색 결과 데이터:', json); // ✅
    // ... 이하 기존 코드 ...
      if (json.code === 1) {
        // 삭제 성공 시, 목록 갱신
        setItems(prev => prev.filter(item => !ids.includes(item.id)));
        setFilteredItems(prev => prev.filter(item => !ids.includes(item.id)));
        setSelectedBarcodes(new Set());
        setSelectAll(false);
        alert(t('MyInfo_AssetDeleted'));
      } else {
        alert(t('MyInfo_DeleteFailed') + ": " + (json.message || t('MyInfo_ServerCannotCommunicate')));
      }
    } catch (err) {
   //   console.error("삭제 요청 오류:", err);
      alert(t('MyInfo_ServerCannotCommunicate'));
    }
  };

  const handlePrint = () => {
if (!selectedBarcodes.size) return alert(t('MyInfo_SelectItemsToPrint'));
const toPrint = listToShow.filter(row => selectedBarcodes.has(row.barcode));

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return alert(t('MyInfo_DisablePopupBlocker'));

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('MyInfo_LabelPrint')}</title>
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
    padding-left: 3.0mm;
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
  align-items: flex-start;   /* 기본은 좌측 정렬 유지 */
  padding-left: 1.5mm;
  flex: 1;                   /* 남은 폭을 꽉 채워서 가운데 정렬이 먹게 함 */
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
   text-align: left;        /* ← 왼쪽 정렬 */
   align-self: flex-start;  /* ← 컨테이너의 왼쪽에 붙이기 */
   width: auto;             /* ← 100% 해제(선택) */
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
  <p class="text-line">세원전자 전산운영 사무실</p>   
  <p class="text-line barcode-text">2508200681</p>     
  <p class="text-line category-line">자산분류 품목명</p>
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
      //  if (!selectedLocId) {
      //      alert("세부위치를 선택하세요.");
      //      return;
      //    }
    if (loading) return;        // 중복 방지
   setLoading(true);           // ⏳ 로딩 시작
    // … 검색 로직 …
    // 기본 유효성 검사 (날짜 범위)
    if (startDate && endDate && startDate > endDate) {
      setLoading(false);
        return alert(t('MyInfo_StartAfterEnd'));
      }
         // ✅ 로그인 사용자의 부서 ID 확보 (selectedDeptId 기준)
 const deptId =
   selectedDeptId ||
   user?.affiliationId ||        // ✅ 부서/소속 ID
   user?.id ||
   user?.departmentId ||
   localStorage.getItem("departmentId");
   if (!deptId) {
     setLoading(false);
     return alert("로그인된 부서 정보를 찾을 수 없습니다.");
   }
//  console.log("[MyInfoPage][SEARCH] departmentId ->", deptId, "(type:", typeof deptId, ")");
      // 쿼리스트링 빌드
    const params = new URLSearchParams();
   // ⚠️ '부서 자산만' 보이게 하려면 departmentId는 항상 포함
 // 서버가 어떤 키를 받는지 확실치 않다면 둘 다 전송 (확정되면 하나만 남기세요)
 params.append("affiliationId", String(deptId));
 params.append("departmentId", String(deptId));

   // (원하면 위치/분류/날짜 등 추가 필터는 그대로 사용 가능)
   if (selectedLocId)        params.append("locationId", selectedLocId);
     if (selectedCategoryId) params.append("parentTypeId", selectedCategoryId); // ✅
     if (selectedItemId)     params.append("childTypeId",  selectedItemId); 
          // ✅ 상태 필터 전달 (코드와 문자열 둘 다 전송)
     if (statusFilter) {
       const code = STATUS_CODE[statusFilter];
       if (code !== undefined) params.append("assetStatus", String(code));
       params.append("status", statusFilter);
     }
      if (startDate)         params.append("after", startDate);
      if (endDate)           params.append("before", endDate);
      if (viewCount > 0)     params.append("size", viewCount);

  
      try {

     const url = `${API_BASE_URL}/assets/paged?${params.toString()}`;
     // 🔎 최종 요청 로그 (URL / 파라미터 객체)
    // console.log("[MyInfoPage][SEARCH] GET:", url);
    // console.log("[MyInfoPage][SEARCH] params:", Object.fromEntries(params));
       // console.log("자산 받을때 url : "+url)
        const res = await authFetchWithRefresh(url);
        const json = await res.json();
          //console.log('자산 조회 응답 (전체):', json);
        if (json.code !== 1 || json.data.list.length === 0) {
         alert(t('MyInfo_NoAssetsMatch'));
          setFilteredItems([]);
          setSearched(true);
          return;
        }
        // console.log("📦 자산 리스트:", json.data.list);
        // // data.list 안에 자산 배열이 들어옵니다
        // setFilteredItems(json.data.list);
           //     console.log("📦 자산 리스트:", json.data.list);

        /*  (1) 백엔드 → 프런트 맵핑
           ──────────────────────────────
           · corporation  ➜ company
           · parentCategory / childCategory 등은
             이미 프런트에서 쓰이는 이름이므로 그대로 둡니다.
        */
 const mapped = json.data.list.map(it => ({
   ...it,
   company: it.corporation,   // 회사
   // 부서명이 다른 키로 올 경우 대비
   department: it.department ?? it.affiliation ?? it.departmentName ?? it.affiliationName ?? "",
 }));

        /*  (2) 상태 반영 (서버가 무시할 경우를 대비한 클라이언트 필터) */
        const finalized = statusFilter
          ? mapped.filter(it => String(it.status) === statusFilter)
          : mapped;
        setFilteredItems(finalized);
        setSearched(true);
        setSelectedBarcodes(new Set());   // 페이징·체크박스 초기화
        setCurrentPage(1);
      } catch (err) {
       // console.error(err);
        alert(t('MyInfo_ServerCommError'));
         } finally {
             setLoading(false);        // ⏹️ 로딩 종료
      }
  };




  return (
    <div className={`my-info-container ${mode}-mode`}>

      {/* 1. 내정보 + 수정 버튼 */}
      <div className="top-section">
  <h2 className="section-title">{t('MyInfo_MyInfo')}</h2>
  <div className="user-info-inline">
    <div>{t('MyInfo_Affiliation')}: {userInfo.company} {userInfo.department}</div>
    <div>{t('MyInfo_Id')}: {userInfo.id}</div>
    <div>{t('MyInfo_Name')}: {userInfo.name}</div>
  </div>
  <button
    className="btn-edit-info"
    onClick={() => setIsInfoModalOpen(true)}
  >
    {t('MyInfo_EditMyInfo')}
  </button>
</div>

        {/* 2. 조회 필터 */}
{/* 2. 조회 필터 (WEB / PDA 완전 분리) */}
<div className="search-section">
  <h2 className="section-title asset-search-title">{t('MyInfo_AssetSearch')}</h2>

  {mode === 'web' ? (
  // ── WEB: 2줄 레이아웃
  <div className="web-search-rows">
    {/* 1열: 세부위치 · 자산분류 · 품목 · 갯수 */}
    <div className="web-row">
      <select
        className="search-input"
        value={selectedLocId}
        onChange={(e) => setSelectedLocId(e.target.value)}
      >
        <option value="">{t('MyInfo_DetailLocation')}</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      <select
        className="search-input type-select"
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
      >
        <option value="">{t('MyInfo_AssetCategory')}</option>
        {assetCategories.map((cat) => (
          <option key={cat.parentId} value={cat.parentId}>{cat.name}</option>
        ))}
      </select>

      <select
        className="search-input item-select"
        value={selectedItemId}
        onChange={(e) => setSelectedItemId(Number(e.target.value))}
        disabled={!selectedCategoryId}
      >
        <option value="">{t('MyInfo_Item')}</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>{it.name}</option>
        ))}
      </select>

      <input
        type="number"
        className="search-input view-count"
        value={viewCount}
        onChange={(e) => setViewCount(+e.target.value)}
        placeholder="30"
      />
    </div>

    {/* 2열: 자산상태 · (시작)년월일 · (끝)년월일 · 조회 · 초기화 */}
    <div className="web-row">
      <select
        className="search-input"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">{t('MyInfo_AssetStatus')}</option>
        <option value="사용">{t('MyInfo_InUse')}</option>
        <option value="미사용">{t('MyInfo_NotInUse')}</option>
        <option value="폐각">{t('MyInfo_Disposal')}</option>
      </select>

      <input
        type="date"
        className="search-input date-input"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <span className="date-tilde">~</span>
      <input
        type="date"
        className="search-input date-input"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />

      <button className="btn-search" onClick={handleSearch}>🔍 {t('MyInfo_Search')}</button>
      <button className="btn-reset"  onClick={handleReset}>↺ {t('MyInfo_Reset')}</button>
    </div>
  </div>
) : (

    // ── PDA: 4줄 스택 폼
    <div className="pda-search-rows">
      <div className="pda-row">
        <select
          className="search-input"
          value={selectedLocId}
          onChange={(e) => setSelectedLocId(e.target.value)}
        >
          <option value="">세부위치</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

 <div className="pda-row pda-2col">
        <select
          className="search-input type-select"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
        >
          <option value="">자산분류</option>
          {assetCategories.map((cat) => (
            <option key={cat.parentId} value={cat.parentId}>{cat.name}</option>
          ))}
        </select>
    <select
          className="search-input item-select"
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(Number(e.target.value))}
          disabled={!selectedCategoryId}
        >
          <option value="">품목</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>{it.name}</option>
          ))}
        </select>
      </div>

      <div className="pda-row">
        <input
          type="number"
          className="search-input"
          value={viewCount}
          onChange={(e) => setViewCount(+e.target.value)}
          placeholder="갯수"
        />
      </div>
          {/* ✅ 상태(사용/미사용/폐각) */}
      <div className="pda-row">
        <select
          className="search-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">상태</option>
          <option value="사용">사용</option>
          <option value="미사용">미사용</option>
          <option value="폐각">폐각</option>
        </select>
      </div>


      <div className="pda-row pda-dates">
        <div className="date-row">
          <span className="date-label">{t('MyInfo_StartDate')}</span>
          <input
            type="date"
            className="search-input date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="date-row">
          <span className="date-label">{t('MyInfo_EndDate')}</span>
          <input
            type="date"
            className="search-input date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="pda-row pda-buttons">
        <button className="btn-search" onClick={handleSearch}>🔍 {t('MyInfo_Search')}</button>
        <button className="btn-reset"  onClick={handleReset}>↺ {t('MyInfo_Reset')}</button>
      </div>
    </div>
  )}
</div>



      {/* 3. 제목 + 액션 버튼 */}
      <div className="bottom-header">
        <h2 className="section-title">{t('MyInfo_DepartmentAssetInfo')}</h2>
        <div className="button-group">
          <button className="action-button" data-tip={t('MyInfo_SelectExactlyOne')} onClick={handleModify} disabled={selectedBarcodes.size !== 1}>
            {t('MyInfo_Edit')}
          </button>
<button
  className="action-button"
  data-tip={t('MyInfo_SelectAtLeastOne')}
  onClick={handleDelete}
  disabled={!selectedBarcodes.size}
>
  {t('MyInfo_Delete')}
</button>
          <button className="action-button" data-tip="1개이상 선택하시오." onClick={handlePrint} disabled={!selectedBarcodes.size}>
            {t('MyInfo_Print')}
          </button>
        </div>
      </div>

      {/* 4. 테이블 & 페이징 */}
      <div className="table-section">
        <div className="table-container">
        {loading && (
    <div className="table-loading-overlay">
      <div className="loading-spinner" />
    </div>
  )}
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                </th>
 <th>{t('MyInfo_Barcode')}</th><th>{t('MyInfo_Company')}</th><th>{t('MyInfo_Department')}</th><th>{t('MyInfo_Location')}</th>
 <th>{t('MyInfo_AcquisitionType')}</th><th>{t('MyInfo_AssetCategory')}</th><th>{t('MyInfo_Item')}</th><th>{t('MyInfo_AssetStatus')}</th>
 <th>{t('MyInfo_Manufacturer')}</th><th>{t('MyInfo_Model')}</th><th>{t('MyInfo_AcquisitionDate')}</th><th>{t('MyInfo_AcquisitionCost')}</th>
              </tr>
            </thead>
            <tbody>
            {currentList.length === 0
    ? (
      <tr>
        <td colSpan={13} style={{ textAlign: 'center', padding: '1rem 0' }}>
          {t('MyInfo_NoSearchResults')}
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
          <button className="page-btn" onClick={()=>setCurrentPage(1)} disabled={currentPage===1}>{t('MyInfo_First')}</button>
          <button className="page-btn" onClick={()=>setCurrentPage(p=>Math.max(p-1,1))} disabled={currentPage===1}>{t('MyInfo_Prev')}</button>
          {renderPageNumbers()}
          <button className="page-btn" onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages}>{t('MyInfo_Next')}</button>
          <button className="page-btn" onClick={()=>setCurrentPage(totalPages)} disabled={currentPage===totalPages}>{t('MyInfo_End')}</button>
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
            alert(t('MyInfo_MyInfoUpdated'));
            setIsInfoModalOpen(false);
          }}
        />
      )}
{isModalOpen && editItem && (
<EditModal
  item={editItem}
onSave={edited => {
  // 공통: API/수정모달의 필드명 → 화면 row 필드로 변환
  const mappedEdited = {
    ...edited,
    division:
      edited.acquisitionType === '0' ? "구매자산"
    : edited.acquisitionType === '1' ? "대여자산"
    : (edited.division || ""),

    status:
      edited.assetStatus === '0' ? "사용"
    : edited.assetStatus === '1' ? "미사용"
    : (edited.status || ""),

    parentCategory: edited.assetCategory || edited.parentCategory || "",
    childCategory:  edited.itemName      || edited.childCategory  || "",

    // 전자자산(노트북/컴퓨터)일 때만 spec 필드 갱신, 비전자자산은 기존값 유지
    cpu:     edited.cpu     ?? edited.cpu,
    gpu:     edited.gpu     ?? edited.gpu,
    ram:     edited.memory  ?? edited.ram,
    storage: edited.totalStorage ?? edited.storage,
  };

  setItems(prev =>
    prev.map(i =>
      i.barcode === edited.barcode ? { ...i, ...mappedEdited } : i
    )
  );
  setFilteredItems(prev =>
    prev.map(i =>
      i.barcode === edited.barcode ? { ...i, ...mappedEdited } : i
    )
  );
  setDetailItem(prev =>
    prev && prev.barcode === edited.barcode ? { ...prev, ...mappedEdited } : prev
  );
  setIsModalOpen(false);
  setSelectedBarcodes(new Set());
  setSelectAll(false);
  alert(t('MyInfo_AssetInfoUpdated'));
}}

  onClose={() => setIsModalOpen(false)}
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
  const { t } = useTranslation('myInfor');
  const isElectronic = item.parentCategory === "노트북" || item.parentCategory === "컴퓨터";
  
  return (
    <div className="detail-fullpage">
      <button className="detail-back" onClick={onClose}>← {t('MyInfo_Back')}</button>
      <h2>{t('MyInfo_AssetDetail')}</h2>
      <ul>
        <li><strong>{t('MyInfo_Barcode')}:</strong> {item.barcode}</li>
        {/* ✅ 회계코드 (categoryCode) */}
{item.categoryCode !== undefined && item.categoryCode !== null && item.categoryCode !== "" && (
  <li><strong>회계코드:</strong> {item.categoryCode}</li>
)}
        <li><strong>회사:</strong> {item.company}</li>
        <li><strong>부서:</strong> {item.department}</li>
        <li><strong>위치:</strong> {item.location}</li>
        <li><strong>취득일자:</strong> {item.acquisitionDate}</li>
        <li><strong>취득가:</strong> {item.acquisitionPrice.toLocaleString()} 원</li>
        <li><strong>취득구분:</strong> {item.division}</li>
        <li><strong>자산분류:</strong> {item.parentCategory}</li>
        <li><strong>품목:</strong> {item.childCategory}</li>
        <li><strong>제조사:</strong> {item.manufacturer}</li>
        <li><strong>모델:</strong> {item.model}</li>
        <li><strong>자산상태:</strong> {item.status}</li>
        <li><strong>등록자:</strong> {item.registerName}</li>
        <li><strong>등록일:</strong> {item.registrationDate}</li>

        {isElectronic && (
          <>
            <li><strong>CPU:</strong> {item.cpu}</li>
            <li><strong>GPU:</strong> {item.gpu}</li>
            <li><strong>RAM:</strong> {item.ram} GB</li>
            <li><strong>Storage:</strong> {item.storage} GB</li>
          </>
        )}
      </ul>
    </div>
  );
}


function SideDrawerDetail({ item, onClose }) {
  const { t } = useTranslation('myInfor');
  const isElectronic = ["노트북", "컴퓨터"].includes(item.childCategory);
  
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}>×</button>
        <h2>{t('MyInfo_AssetDetail')}</h2>
        <ul>
          <li><strong>{t('MyInfo_Barcode')}:</strong> {item.barcode}</li>
          {/* ✅ 회계코드 (categoryCode) */}
{item.categoryCode !== undefined && item.categoryCode !== null && item.categoryCode !== "" && (
  <li><strong>회계코드:</strong> {item.categoryCode}</li>
)}
 <li><strong>{t('MyInfo_Company')}:</strong> {item.company}</li>

 <li><strong>{t('MyInfo_Department')}:</strong> {item.department}</li>

 <li><strong>{t('MyInfo_Location')}:</strong> {item.location}</li>

 <li><strong>{t('MyInfo_AcquisitionDate')}:</strong> {item.acquisitionDate}</li>

 <li><strong>{t('MyInfo_AcquisitionCost')}:</strong> {item.acquisitionPrice.toLocaleString()} {t('MyInfo_Won')}</li>

 <li><strong>{t('MyInfo_AcquisitionType')}:</strong> {item.division}</li>

 <li><strong>{t('MyInfo_AssetCategory')}:</strong> {item.parentCategory}</li>

 <li><strong>{t('MyInfo_Item')}:</strong> {item.childCategory}</li>

 <li><strong>{t('MyInfo_Manufacturer')}:</strong> {item.manufacturer}</li>

 <li><strong>{t('MyInfo_Model')}:</strong> {item.model}</li>

 <li><strong>{t('MyInfo_AssetStatus')}:</strong> {item.status}</li>

 <li><strong>{t('MyInfo_Registrar')}:</strong> {item.registerName}</li>

 <li><strong>{t('MyInfo_RegisteredDate')}:</strong> {item.registrationDate}</li>

          {isElectronic && (
            <>

 <li><strong>{t('MyInfo_CPULabel')}</strong> {item.cpu}</li>

 <li><strong>{t('MyInfo_GPU')}:</strong> {item.gpu}</li>

 <li><strong>{t('MyInfo_RAM')}:</strong> {item.ram} GB</li>

 <li><strong>{t('MyInfo_Storage')}:</strong> {item.storage} GB</li>
            </>
          )}
        </ul>
      </div>
    </>
  );
}
