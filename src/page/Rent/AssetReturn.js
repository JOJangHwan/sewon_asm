import React, { useState, useEffect } from 'react';
import useMediaQuery            from '../../utils/hooks/useMediaQuery';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { useContext } from 'react';
import { UserContext } from '../../utils/UserContext';

// .env 없이도 동작하도록 기본값 유지
const API_BASE_URL =
  window._env_?.REACT_APP_API_URL || 'http://localhost:8888';


export default function AssetReturnListPage() {
  // 로그인 사용자 · 부서 ID 는 실제 앱에서 내려주는 값을 사용하세요
  // const loginUser     = localStorage.getItem('username')     || '홍길동';
  // const affiliationId = localStorage.getItem('affiliationId');
  const { user } = useContext(UserContext);
  const affiliationId = user?.affiliationId;
  const loginUser     = user?.name || '홍길동'; 
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [checkedItems, setCheckedItems] = useState([]);
  const [assets, setAssets] = useState([]);   // 서버 데이터



  const [deptRequests, setDeptRequests] = useState([]);

  const [incomingRequests, setIncomingRequests] = useState([]);

  // 체크박스 토글 핸들러
  const handleCheck = (barcode) => {
    setCheckedItems((prev) =>
      prev.includes(barcode)
        ? prev.filter((item) => item !== barcode)
        : [...prev, barcode]
    );
  };
  

  // 1) 내가 현재 빌린 자산에 대해 “반납 신청”
  const handleRequestReturn = async () => {
    // checkedItems에서 id 추출
    const toRequest = checkedItems
      .map((barcode) => {
        const asset = assets.find((a) => a.barcode === barcode);
        // "대여 중인 자산"만 (즉, borrower가 나인 것만)
        return asset && asset.borrower === loginUser ? asset.id : null;
      })
      .filter(Boolean);
  
    if (toRequest.length === 0) {
      alert('반납 신청할 항목이 없습니다.');
      return;
    }
    if (!window.confirm('선택한 자산을 반납 신청하시겠습니까?')) {
      return;
    }
  
    try {
      const res = await authFetchWithRefresh(
        `${API_BASE_URL}/return/request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: toRequest }), // <-- id 배열로 전송!
        }
      );
      const json = await res.json();
      if (json.code !== 1) {
        alert('반납 신청 실패: ' + (json.message || '서버 오류'));
        return;
      }
  
      alert('반납 신청 완료!');
      setAssets((prev) =>
        prev.map((a) =>
          toRequest.includes(a.id) ? { ...a, borrower: '신청중' } : a
        )
      );
      setCheckedItems((prev) =>
        prev.filter((barcode) => {
          const asset = assets.find((a) => a.barcode === barcode);
          return asset && !toRequest.includes(asset.id);
        })
      );
    } catch (err) {
      alert('서버와 통신할 수 없습니다.');
      console.error('반납 신청 오류:', err);
    }
  };
  

// 2) 내가 반납 신청한 자산(신청중) → “반납 취소”
const handleCancelReturn = async () => {
  // ✅ deptRequests에서 체크된 barcode의 id만 추출
  const ids = checkedItems
    .map(barcode => {
      const item = deptRequests.find(d => d.barcode === barcode);
      return item ? item.id : null;
    })
    .filter(Boolean);

  if (ids.length === 0) {
    alert('취소할 반납 신청이 없습니다.');
    return;
  }
  if (!window.confirm('선택한 반납 신청을 취소하시겠습니까?')) {
    return;
  }
  try {
    const res = await authFetchWithRefresh(
      `${API_BASE_URL}/return/request/cancel`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }), // ← ids로 변경!
      }
    );
    const json = await res.json();
    if (json.code === 1) {
      alert('반납 신청 취소 완료');
      setDeptRequests(prev => prev.filter(item => !ids.includes(item.id)));
      setCheckedItems(prev => prev.filter(b => {
        const item = deptRequests.find(d => d.barcode === b);
        return !item || !ids.includes(item.id);
      }));
    } else {
      alert(`반납 신청 취소 실패: ${json.message || '서버 오류'}`);
    }
  } catch (err) {
    alert('서버와 통신할 수 없습니다.');
    console.error('반납 신청 취소 오류:', err);
  }
};


  // 3) 타인이 내 자산에 반납 신청한 경우 → “승인”
// 3) 타인이 내 자산에 반납 신청한 경우 → “승인”
const handleApprove = async () => {
  // incomingRequests에서 체크된 barcode의 id만 추출
  const ids = checkedItems
    .map(bc => {
      const item = incomingRequests.find(req => req.barcode === bc);
      return item ? item.id : null;
    })
    .filter(Boolean);

  if (ids.length === 0) {
    alert('승인할 항목이 없습니다.');
    return;
  }
  if (!window.confirm('선택한 반납 신청을 승인하시겠습니까?')) return;

  try {
    const res = await authFetchWithRefresh(
      `${API_BASE_URL}/return/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }), // { ids: [1, 2, 3] }
      }
    );
    const json = await res.json();
    if (json.code === 1) {
      alert('승인 완료');
      // 승인한 항목만 incomingRequests에서 제거
      setIncomingRequests(prev => prev.filter(req => !ids.includes(req.id)));
      setCheckedItems(prev =>
        prev.filter(bc => {
          const item = incomingRequests.find(req => req.barcode === bc);
          return !item || !ids.includes(item.id);
        })
      );
    } else {
      alert(`승인 실패: ${json.message || '서버 오류'}`);
    }
  } catch (err) {
    alert('서버와 통신할 수 없습니다.');
    console.error('반납 승인 오류:', err);
  }
};


    // 3가지 상태로 필터링
    const borrowedAssets    = assets.filter(a => a.borrower === loginUser);                          // 대여 중인 자산
    const requestedReturns  = assets.filter(a => a.borrower === '신청중' && a.registrar !== loginUser); // 반납 신청한 자산
    // incomingRequests  = assets.filter(a => a.borrower === '신청중' && a.registrar === loginUser); // 반납 신청 내역
  

    useEffect(() => {
      if (!affiliationId) return;
      const fetchAssets = async () => {
        try {
          const res = await authFetchWithRefresh(
            `${API_BASE_URL}/rental?affiliationId=${affiliationId}`,
            { method: 'GET' }
          );
          const json = await res.json();
          if (json.code !== 1) return;
          console.log('[서버 응답 데이터]', json.data?.list);
      
          // 1) 매핑
          const mapped = (json.data?.list || []).map(r => ({
            id          : r.id,
            barcode     : r.barcode,
            company     : r.corporation,
            department  : r.department,
            location    : r.location,
            rentLocation: r.rentLocation,
            category    : r.parentType,
            item        : r.childType,
            borrower    : r.renter,
            registrar   : r.register,
            status      : r.status,
            fromDate    : r.fromDate,
            toDate      : r.toDate,
            isExpire    : r.isExpire
          }));
      
          // 2) 바코드 기준 가장 마지막(최신) 항목만 남기기
          const barcodeMap = new Map();
          for (const a of mapped) {
            barcodeMap.set(a.barcode, a); // 같은 바코드면 덮어씀(최신만 남음)
          }
          setAssets(Array.from(barcodeMap.values()));
      
        } catch (err) { }
      };
      
  fetchAssets();
}, [affiliationId]);

    
    
    

     useEffect(() => {
         if (!affiliationId) return;
         // 부서 반납 신청 목록 가져오기
         const fetchDeptRequests = async () => {
           try {
             const res = await authFetchWithRefresh(
               `${API_BASE_URL}/return/request/mine?affiliationId=${affiliationId}`,
               { method: 'GET' }
             );
            const json = await res.json();
            console.log('[반납 신청 내역 API 응답]', json);
           if (json.code !== 1) return;
           const mapped = (json.data?.list || []).map(r => ({
            id:          r.id,
            barcode:     r.barcode,
            company:     r.corporation,      // '회사구분'
            department:  r.department,       // '부서구분'
            location:    r.location,         // '세부위치'
            rentLocation:r.rentLocation,     // '대여위치'
            category:    r.parentType,       // '자산분류'
            item:        r.childType,        // '품목'
            borrower:    r.renter,           // '대여자'
            registrar:   r.register,         // '등록자'
            fromDate:    r.fromDate,         // '대여기간' (시작)
            toDate:      r.toDate,           // '대여기간' (끝)
            status:      r.status,
            isExpire:    r.isExpire,
          }));
          setDeptRequests(mapped);
          
          
           } catch (err) { }
         };
         fetchDeptRequests();
       }, [affiliationId]);

       useEffect(() => {
        if (!affiliationId) return;
        const fetchIncoming = async () => {
          try {
            const res = await authFetchWithRefresh(
              `${API_BASE_URL}/return/request/others?affiliationId=${affiliationId}`,
              { method: 'GET' }
            );
            const json = await res.json();
            if (json.code !== 1) return;
            const mapped = (json.data?.list || []).map(r => ({
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
              status:      r.status,
              fromDate:    r.fromDate,
              toDate:      r.toDate,
              isExpire:    r.isExpire
            }));
            setIncomingRequests(mapped);
          } catch (err) { }
        };
        fetchIncoming();
      }, [affiliationId]);
      






  

   // ========== 테이블 공통 렌더링 ==========
   const renderTable = (title, data, buttonElement) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</h3>
        <div className="button-group">{buttonElement}</div>
      </div>
      <div className="table-wrapper">
      <table className="asset-table">
  <thead>
    <tr>
      <th></th>
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
        <td colSpan={11} style={{ color: '#aaa', textAlign: 'center', fontSize: 15 }}>
          데이터가 없습니다.
        </td>
      </tr>
    ) : (
      data.map(item => (
        <tr key={item.id || item.barcode}>
          <td>
            <input
              type="checkbox"
              checked={checkedItems.includes(item.barcode)}
              onChange={() => handleCheck(item.barcode)}
            />
          </td>
          <td>{item.barcode}</td>
          <td>{item.company}</td>
          <td>{item.department}</td>
          <td>{item.location}</td>
          <td>{item.rentLocation}</td>
          <td>{item.category}</td>
          <td>{item.item}</td>
          <td>{item.borrower}</td>
          <td>{item.registrar}</td>
          <td>{item.fromDate} ~ {item.toDate}</td>
        </tr>
      ))
    )}
  </tbody>
</table>

      </div>
    </div>
  );

  // ========== 실제 렌더링 ==========
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>자산 반납 목록</h2>
      </div>
  
      {/* 1. 대여 중인 자산 */}
      {renderTable(
        '부서에서 대여 신청한 자산',
        borrowedAssets,
        <button
          className="primary-btn"
          onClick={handleRequestReturn}
          style={{ backgroundColor: '#60a5fa', color: '#fff' }}
        >
          반납 신청
        </button>
      )}
  
      {/* 2. 반납 신청한 자산 */}
      {renderTable(
  '부서에서 반납 신청한 자산',
  deptRequests,   // ← 이렇게 직접 넣는 것도 실무에서 흔함!
  <button
    className="primary-btn"
    style={{ backgroundColor: '#fee2e2', color: '#e53e3e' }}
    onClick={handleCancelReturn}
  >
    반납 취소
  </button>
)}

  
      {/* 3. 반납 신청 내역 (내 자산에 타인이 반납 요청) */}
      {renderTable(
  '타부서에서 반납 신청한 자산',
  incomingRequests,  // ← 반드시 이 변수!
  <button className="primary-btn" onClick={handleApprove}>승인</button>
)}

    </div>
  )
}