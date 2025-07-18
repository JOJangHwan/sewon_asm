import React, { useEffect, useState, useMemo, useContext } from 'react';
import './AssetForm.css';
import AssetFormModal from './components/AssetModal';
import useMediaQuery from '../../utils/hooks/useMediaQuery';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { UserContext } from '../../utils/UserContext';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

export default function AssetListPage() {
  const loginUser   = '';
  const isMobile    = useMediaQuery('(max-width: 768px)');
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [checkedItems,  setCheckedItems]  = useState([]);
  const [assets,        setAssets]        = useState([]);
  const [otherRequests, setOtherRequests] = useState([]);
  const [deptRequests,  setDeptRequests]  = useState([]);
  const [inUseAssets,   setInUseAssets]   = useState([]);

  const { user } = useContext(UserContext);

  // useMemo 세 개를 useEffect보다 위로 올린다!
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

  const formattedDept = useMemo(
    () => deptRequests.map(r => ({
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
      status      : r.status,
    })),
    [deptRequests]
  );

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

  // useEffect는 그 다음에 와야 함!!
  useEffect(() => {

    
    //console.log('[formattedInUse]', formattedInUse);
    //console.log('[formattedDept]', formattedDept);
   // console.log('[formattedOthers]', formattedOthers);
  }, [formattedInUse, formattedDept, formattedOthers]);


  const affiliationId = user?.affiliationId;
const corporation   = user?.corporation;
const department    = user?.department;
const name          = user?.name;
    /* ---------- 날짜 계산 ---------- */
    const today = useMemo(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);
/* ────────────────────────────────── */
/* 1. 부서 대여 신청 목록 가져오기   */
/* ────────────────────────────────── */

const fetchDeptRentals = async () => {
  const affiliationId = user?.affiliationId;
  if (!affiliationId) return;
  const url = `${API_BASE}/rental/request/mine?affiliationId=${affiliationId}`;
  //console.log('🔵 [fetchDeptRentals] 요청 URL:', url);

  try {
    const res = await authFetchWithRefresh(url, { method: 'GET' });
    //console.log('🟡 [fetchDeptRentals] 응답 Response:', res);

    const json = await res.json();
    //console.log('🟢 [fetchDeptRentals] 응답 JSON:', json);

    if (json.code === 1) {
     // console.table(json.data?.list); // 표로
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
      const affiliationId = user?.affiliationId;
      if (!affiliationId) return;
      const url = `${API_BASE}/rental/request/others?affiliationId=${affiliationId}`;
      //console.log('🔵 [fetchOtherRequests] 요청 URL:', url);
    
      try {
        const res = await authFetchWithRefresh(url, { method: 'GET' });
        //console.log('🟡 [fetchOtherRequests] 응답 Response:', res);
    
        const json = await res.json();
       // console.log('🟢 [fetchOtherRequests] 응답 JSON:', json);
    
        if (json.code === 1) {
          //console.table(json.data?.list); // 표로 보기 쉽게 출력
          setOtherRequests(json.data.list || []);
        } else {
          console.warn('타부서 대여 요청 실패', json.message);
        }
      } catch (err) {
        console.error('타부서 대여 요청 오류', err);
      }
    };
    
    /* ────────────────────────────────── */
    /* 3. 대여중(부서 전체) 목록 가져오기 */
    /* ────────────────────────────────── */
    const fetchInUse = async () => {
      const affiliationId = user?.affiliationId;
      if (!affiliationId) return;
      const url = `${API_BASE}/rental?affiliationId=${affiliationId}`;
      console.log('🔵 [반납부분 대여중] 요청 URL:', url);
    
      try {
        const res = await authFetchWithRefresh(url, { method: 'GET' });
       // console.log('🟡 [fetchInUse] 응답 Response:', res);
    
        const json = await res.json();
        //console.log('🟢 [fetchInUse] 응답 JSON:', json);
    
        if (json.code === 1) {
          // status === 1(대여중) 만 남김
          const inUseList = (json.data.list || []).filter(r => r.status === 1);
          console.table(inUseList); // 표로 확인
          setInUseAssets(inUseList);
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
  if (!user?.affiliationId) return;  // user 객체에 값이 없으면 리턴
  fetchDeptRentals();
  fetchOtherRequests();
  fetchInUse();
}, [user]); // user가 바뀔 때마다 실행







const handleCheck = (barcode) => {
  setCheckedItems((prev) =>
    prev.includes(barcode) ? prev.filter((item) => item !== barcode) : [...prev, barcode]
  );
};

  /* ---------- 승인 / 거절 ---------- */
  const handleApproveSelected = async () => {
    const ids = checkedItems
      .map(bc => formattedOthers.find(o => o.barcode === bc)?.id)
      .filter(Boolean)
      .map(Number);
  
    if (ids.length === 0) {
      alert('선택된 항목이 없습니다');
      return;
    }
  
    try {
      const res = await authFetchWithRefresh(`${API_BASE}/rental/approve`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ ids }),
      });
      const json = await res.json();
  
      if (json.code === 1) {
        alert('✅ 승인 완료');
        setOtherRequests(prev => prev.filter(o => !ids.includes(o.id)));
        setCheckedItems([]);
      } else {
        alert(`❌ 승인 실패: ${json.message || '서버 오류'}`);
      }
    } catch (err) {
      alert('🚨 서버와 통신할 수 없습니다.');
      console.error('승인 요청 오류', err);
    }
  };

  // 부서 대여 신청 자산 삭제 (DELETE)
const handleDeleteDeptRequests = async () => {
  // 선택된 바코드에 해당하는 id만 추출
  const ids = checkedItems
    .map(bc => formattedDept.find(d => d.barcode === bc)?.id)
    .filter(Boolean)
    .map(Number);

  if (ids.length === 0) {
    alert('삭제할 항목을 선택하세요');
    return;
  }

  if (!window.confirm('선택한 신청을 삭제하시겠습니까?')) return;

  try {
    const res = await authFetchWithRefresh(`${API_BASE}/rental`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }), // { ids: [1, 2, 3] }
    });

    const json = await res.json();
    if (json.code === 1) {
      alert('삭제 완료');
      // 성공시 상태에서 제거
      setDeptRequests(prev => prev.filter(d => !ids.includes(d.id)));
      setCheckedItems([]);
    } else {
      alert(`삭제 실패: ${json.message || '서버 오류'}`);
    }
  } catch (e) {
    alert('🚨 서버와 통신할 수 없습니다.');
    console.error('삭제 오류', e);
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
      // delete는 body를 직접 넣을 수 있는 fetch 사용
      const res = await authFetchWithRefresh(`${API_BASE}/rental/request/reject`, {
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
      console.error('거절오류', e);
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


  // =========== 테이블 렌더링 =============
  const renderTable = (data, title, buttonGroup = null) => (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</h3>
        <div className="button-group">{buttonGroup}</div>
      </div>
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
            {data.length === 0 ? (
              <tr>
                <td colSpan={title !== '대여중' ? 11 : 10} style={{ textAlign: "center", color: "#aaa" }}>
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id || item.barcode}>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
  

  // =========== 렌더링 =============
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

      {/* 타부서 대여신청 자산 */}
      {renderTable(
        formattedOthers,
        '받은 대여 요청',
        <>
          <button className="primary-btn" onClick={handleApproveSelected}>
            승인
          </button>
          <button
  className="primary-btn"
  style={{ backgroundColor: '#fee2e2', color: '#e53e3e' }}
  onClick={handleRejectRequest}
>
  거절
</button>
        </>
      )}

      {/* 부서 대여 신청 자산 */}
      {renderTable(
  formattedDept,
  '보낸 대여 요청',
  <button
    className="primary-btn"
    style={{ backgroundColor: '#fee2e2', color: '#e53e3e' }}
    onClick={handleDeleteDeptRequests}
  >
    삭제
  </button>
)}

      {/* 대여중 */}
      {renderTable(formattedInUse, '대여 중인 자산', null)}

      <AssetFormModal
        isOpen={isModalOpen}
        onClose={(saved) => {
          setIsModalOpen(false);
          if (saved) fetchDeptRentals();
        }}
      />
    </div>
  );
}


