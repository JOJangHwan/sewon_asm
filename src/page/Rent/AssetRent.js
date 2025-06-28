// AssetListPage.js
import React, { useEffect, useState, useMemo } from 'react';
import './AssetForm.css';
import AssetFormModal from './components/AssetModal';
import useMediaQuery from '../../utils/hooks/useMediaQuery';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';


const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';


export default function AssetListPage() {

    /* ---------- 기본 상태 ---------- */
  const loginUser   = '';
  const isMobile    = useMediaQuery('(max-width: 768px)');
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [checkedItems,  setCheckedItems]  = useState([]);
  const [assets,        setAssets]        = useState([]);           // 내/부서/대여중
  const [otherRequests, setOtherRequests] = useState([]);    
  const [deptRequests, setDeptRequests] = useState([]);
  const [inUseAssets, setInUseAssets] = useState([]);   // 🆕 상태

    /* ---------- 날짜 계산 ---------- */
    const today = useMemo(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);
/* ────────────────────────────────── */
/* 1. 부서 대여 신청 목록 가져오기   */
/* ────────────────────────────────── */

    const fetchDeptRentals = async () => {
      const affiliationId = localStorage.getItem('affiliationId');
      if (!affiliationId) return;
    
      const url = `${API_BASE}/rental?affiliationId=${affiliationId}`;
      console.log('📤 fetchDeptRentals GET URL(부서 대여 신청 목록 가져오기):', url);
      //console.log("부서 대여 신청 목록 가져오기")
    
      try {
        const res  = await authFetchWithRefresh(url, { method: 'GET' });
        const json = await res.json();

        

        console.table(json.data?.list); // 표 형태로 확인
    
        if (json.code === 1) {
          console.log('✅ 부서 대여 신청 수신:', json.data.list);
          setDeptRequests(json.data.list || []);
        } else {
          console.warn('부서 대여 신청 조회 실패', json.message);
        }
      } catch (err) {
        console.error('부서 대여 신청 조회 오류', err);
      }
    };
    
    /* ────────────────────────────────── */
    /* 2. 타부서 대여 신청 목록 가져오기  */
    /* ────────────────────────────────── */
    const fetchOtherRequests = async () => {
      const affiliationId = localStorage.getItem('affiliationId');
      if (!affiliationId) return;
    
      const url = `${API_BASE}/rental/user?affiliationId=${affiliationId}`;
      //console.log('📤 fetchOtherRequests GET URL:', url);
    
      try {
        const res  = await authFetchWithRefresh(url, { method: 'GET' });
        const json = await res.json();
    
        if (json.code === 1) {
          //console.log('✅ 타부서 대여 요청 수신:', json.data.list);
          setOtherRequests(json.data.list || []);
        } else {
          //console.warn('타부서 대여 요청 실패', json.message);
        }
      } catch (err) {
        //console.error('타부서 대여 요청 오류', err);
      }
    };
    
    /* ────────────────────────────────── */
    /* 3. 대여중(부서 전체) 목록 가져오기 */
    /* ────────────────────────────────── */
    const fetchInUse = async () => {
      const affiliationId = localStorage.getItem('affiliationId');
      if (!affiliationId) return;
    
      const url = `${API_BASE}/rental?affiliationId=${affiliationId}`;
      //console.log('📤 fetchInUse GET URL:', url);
    
      try {
        const res  = await authFetchWithRefresh(url, { method: 'GET' });
        const json = await res.json();
    
        if (json.code === 1) {
          // status === 1(대여중) 만 남김
          setInUseAssets((json.data.list || []).filter(r => r.status === 1));
        } else {
          console.warn('대여중 자산 조회 실패', json.message);
        }
      } catch (err) {
        console.error('대여중 자산 조회 오류', err);
      }
    };
   // console.log(localStorage);
 /* ---------- 타부서 신청 불러오기 ---------- */
 useEffect(() => {
  const affiliationId = localStorage.getItem('affiliationId');
  if (!affiliationId) return;       // 로컬스토리지에 없으면 아무것도 하지 않음

  fetchDeptRentals();   // 부서 신청
  fetchOtherRequests(); // 타부서 신청
  fetchInUse();         // 대여중 목록
}, []); 

    /* ---------- 타부서 데이터 가공 ---------- */
    const formattedOthers = useMemo(() =>
      otherRequests.map(r => ({
        id:          r.id,
        barcode:     r.barcode,
        company:     r.corporation,
        department:  r.department,
        location:    r.location,
        rentLocation:r.rentLocation,
        category:    r.parentType,
        item:        r.childType,
        borrower:    r.renter,
        registrar:   r.register,
        startDate:   r.fromDate,
        endDate:     r.toDate,
        status:      r.status,
      }))
    , [otherRequests]);

    /* ---------- 부서-신청 데이터 가공 ---------- */
const formattedDept = useMemo(
  () => deptRequests.map(r => ({
    barcode     : r.barcode,
    company     : r.corporation,
    department  : r.department,
    location    : r.location,
    rentLocation: r.rentLocation,
    category    : r.parentType,
    item        : r.childType,
    borrower    : r.renter,      // 신청자
    registrar   : r.register,    // 등록자
    startDate   : r.fromDate,
    endDate     : r.toDate,
    id          : r.id,
    status      : r.status,      // 0:대여요청중 …
  })),
  [deptRequests]
);
useEffect(() => {
 // console.log('📦 formattedDept (가공 후):', formattedDept);
}, [formattedDept]);
// console.log('📦 formattedDept:', formattedDept);
/* ---------- 대여중 데이터 가공 ---------- */
const formattedInUse = useMemo(
  () => inUseAssets.map(r => ({
    barcode     : r.barcode,
    company     : r.corporation,
    department  : r.department,
    location    : r.location,
    rentLocation: r.rentLocation,
    category    : r.parentType,
    item        : r.childType,
    borrower    : r.renter,
    registrar   : r.register,
    startDate   : r.fromDate,
    endDate     : r.toDate,
    id          : r.id,
    isExpire    : r.isExpire,
  })),
  [inUseAssets]
);







  const handleCheck = (barcode) => {
    setCheckedItems((prev) =>
      prev.includes(barcode) ? prev.filter((item) => item !== barcode) : [...prev, barcode]
    );
  };

  /* ---------- 승인 / 거절 ---------- */
  const handleApproveSelected = async () => {
    // 선택된 바코드 → id 배열 추출
    const ids = checkedItems
      .map(bc => formattedOthers.find(o => o.barcode === bc)?.id)
      .filter(Boolean)       // undefined 제거
      .map(Number);          // 혹시 모를 문자열 → 숫자
  
    if (ids.length === 0) {
      alert('선택된 항목이 없습니다');
      return;
    }
  
    try {
      const res  = await authFetchWithRefresh(`${API_BASE}/rental/approve`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ ids }),   // 👉  { "ids": [1,2,3] }
      });
      const json = await res.json();
  
      if (json.code === 1) {
        alert('✅ 승인 완료');
        // 승인된 행을 목록에서 제거
        setOtherRequests(prev => prev.filter(o => !ids.includes(o.id)));
        setCheckedItems([]);
      } else {
        alert(`❌ 승인 실패: ${json.message || '서버 오류'}`);
      }
    } catch (err) {
      console.error('승인 요청 오류', err);
      alert('🚨 서버와 통신할 수 없습니다.');
    }
  };

  const handleRejectRequest = async () => {
    const ids = checkedItems
      .map(bc => formattedOthers.find(o => o.barcode === bc)?.id)
      .filter(Boolean)
      .map(Number);
  
    if (ids.length === 0) {
      alert('선택된 항목이 없습니다');
      return;
    }
  
    if (!window.confirm('선택한 대여 요청을 거절하시겠습니까?')) return;
  
    try {
      const res = await authFetchWithRefresh(`${API_BASE}/rental/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }), // 📌 형식: { ids: [1,2,3] }
      });
  
      const json = await res.json();
      if (json.code === 1) {
        alert('❌ 거절 완료');
        setOtherRequests(prev => prev.filter(o => !ids.includes(o.id)));
        setCheckedItems([]);
      } else {
        alert(`거절 실패: ${json.message || '서버 오류'}`);
      }
    } catch (e) {
      console.error('거절 오류', e);
      alert('🚨 서버와 통신할 수 없습니다.');
    }
  };
  
  

  const handleRejectSelected = () => {
    const toReject = checkedItems.filter((b) => {
      const item = assets.find((a) => a.barcode === b);
      return item && item.borrower === '신청중' && item.registrar === loginUser;
    });
    if (toReject.length === 0) return alert('거절할 항목이 없습니다.');
    if (window.confirm('선택한 항목을 거절하시겠습니까?')) {
      setAssets((prev) => prev.filter((a) => !toReject.includes(a.barcode)));
      setCheckedItems([]);
    }
  };

  const handleCancelSelected = () => {
    const toCancel = checkedItems.filter((b) => {
      const item = assets.find((a) => a.barcode === b);
      return item && item.borrower === loginUser;
    });
    if (toCancel.length === 0) return alert('삭제할 수 있는 항목이 없습니다.');
    if (window.confirm('선택한 신청을 삭제하시겠습니까?')) {
      setAssets((prev) => prev.filter((a) => !toCancel.includes(a.barcode)));
      setCheckedItems([]);
    }
  };

  // 상태별 필터링
  const 대여신청내역 = assets.filter(
    (a) => a.borrower === '신청중' && a.registrar === loginUser
  );
  const 내가신청한자산 = assets.filter((a) => a.borrower === loginUser);
  const 대여중자산 = assets.filter(
    (a) => a.borrower !== '신청중' && a.borrower !== loginUser
  );

  // 연체된 “대여중” 항목 수 계산
  // const overdueCount = useMemo(() => {
  //   return 대여중자산.reduce((count, a) => {
  //     const end = new Date(a.endDate);
  //     return end < today ? count + 1 : count;
  //   }, 0);
  // }, [대여중자산, today]);

  const overdueCount = useMemo(() =>
    formattedInUse.reduce((cnt, a) =>
      new Date(a.endDate) < today ? cnt + 1 : cnt, 0),
    [formattedInUse, today]
  );


  const renderTable = (data, title) => (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 'bold' }}>
          {title}
          {title === '대여중' && overdueCount > 0 && (
            <span className="overdue-text"> 연체된 대여 자산이 {overdueCount}개 있습니다</span>
          )}
        </h3>
        {title === '타부서 대여신청 자산' && (
          <div className="button-group">
    <button className="primary-btn" onClick={handleApproveSelected}>
      승인
    </button>
    <button
  className="primary-btn"
  onClick={handleRejectRequest} // ✅ 여기만 바꿔주면 끝
  style={{ backgroundColor: '#fecaca' }}
>
  거절
</button>
          </div>
        )}
        {title === '부서 대여 신청 자산' && (
          <div className="button-group">
            <button
              className="primary-btn"
              onClick={handleCancelSelected}
              style={{ backgroundColor: '#fee2e2' }}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {isMobile ? (
        <div className="card-list">
          {data.map((item) => {
            const isOverdue =
              title === '대여중' && new Date(item.endDate) < today;
            return (
              <div
                key={item.barcode}
                className={`card${isOverdue ? ' overdue' : ''}`}
              >
                {title !== '대여중' && (
                  <div className="card-header">
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item.barcode)}
                      onChange={() => handleCheck(item.barcode)}
                    />
                  </div>
                )}
                <div className="card-row">
                  <span className="card-label">바코드</span>
                  <span className="card-value">{item.barcode}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">회사</span>
                  <span className="card-value">{item.company}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">부서</span>
                  <span className="card-value">{item.department}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">세부위치</span>
                  <span className="card-value">{item.location}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">대여위치</span>
                  <span className="card-value">{item.rentLocation}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">분류</span>
                  <span className="card-value">{item.category}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">품목</span>
                  <span className="card-value">{item.item}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">대여자</span>
                  <span className="card-value">{item.borrower}</span>
                </div>
                <div className="card-row">
                  <span className="card-label">등록자</span>
                  <span className="card-value">{item.registrar}</span>
                </div>
                {item.startDate && item.endDate && (
                  <div className="card-row">
                    <span className="card-label">대여기간</span>
                    <span className="card-value">
                      {item.startDate} ~ {item.endDate}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="asset-table">
            <thead>
              <tr>
                {title !== '대여중' && <th></th>}
                <th>바코드</th>
                <th>회사구분</th>
                <th>부서구분</th>
                <th>세부위치</th>
                <th>대여위치</th>
                <th>자산분류</th>
                <th>품목</th>
                <th>대여자</th>
                <th>등록자</th>
                <th>대여기간</th>
              </tr>
            </thead>
            <tbody>
  {data.map((item) => {
    const isOverdue = title === '대여중' && new Date(item.endDate) < today;
    return (
      <tr key={item.id || `${item.barcode}-${item.startDate}`}>
                    {title !== '대여중' && (
                      <td>
                        <input
                          type="checkbox"
                          checked={checkedItems.includes(item.barcode)}
                          onChange={() => handleCheck(item.barcode)}
                        />
                      </td>
                    )}
                    <td>{item.barcode}</td>
                    <td>{item.company}</td>
                    <td>{item.department}</td>
                    <td>{item.location}</td>
                    <td>{item.rentLocation}</td>
                    <td>{item.category}</td>
                    <td>{item.item}</td>
                    <td>{item.borrower}</td>
                    <td>{item.registrar}</td>
                    <td>
                      {item.startDate} ~ {item.endDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
  /* ---------- 렌더 ---------- */
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>자산 대여 목록</h2>
        <div className="flex gap-2">
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            대여신청
          </button>
        </div>
      </div>

    {renderTable(formattedOthers, '타부서 대여신청 자산')}
    {renderTable(formattedDept,   '부서 대여 신청 자산')}
    {renderTable(formattedInUse,  '대여중')}

<AssetFormModal
  isOpen={isModalOpen}
  // saved가 true면 새로고침 함수 호출
  onClose={(saved) => {
    setIsModalOpen(false);
    if (saved) fetchDeptRentals();   // ✅ 목록 다시 불러오기
  }}
/>
    </div>
  );
}
