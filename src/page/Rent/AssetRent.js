// import React, { useState } from 'react';
// import './AssetForm.css';
// import AssetFormModal from './components/AssetModal'; // ✅ 외부 모달로 분리된 컴포넌트 임포트
// import useMediaQuery from '../../utils/hooks/useMediaQuery';

// export default function AssetListPage() {
//   const loginUser = '홍길동';

//   const isMobile = useMediaQuery('(max-width: 768px)');

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [checkedItems, setCheckedItems] = useState([]);
//   const [assets, setAssets] = useState([
//     { barcode: '20ORSFFL1', company: '평택 공장', department: '전산운영P', location: '전산실', category: 'IT자산', item: '노트북', borrower: '홍길동', registrar: '김영준', startDate: '2025-04-24', endDate: '2025-04-30' },
//     { barcode: '20ORSFFL2', company: '평택 공장', department: '회계팀', location: '서버실', category: 'IT자산', item: '모니터', borrower: '신청중', registrar: '홍길동', startDate: '2025-04-24', endDate: '2025-05-01' },
//     { barcode: '20ORSFFL3', company: '우신비나', department: '생산팀', location: '라인1', category: '사무자산', item: '책상', borrower: '이철수', registrar: '홍길동', startDate: '2025-04-20', endDate: '2025-04-28' },
//     { barcode: '20ORSFFL4', company: '우신비나', department: '자재팀', location: '창고', category: '사무자산', item: '의자', borrower: '김민지', registrar: '홍길동', startDate: '2025-04-21', endDate: '2025-04-29' }
//   ]);

//   const handleCheck = (barcode) => {
//     setCheckedItems((prev) =>
//       prev.includes(barcode) ? prev.filter((item) => item !== barcode) : [...prev, barcode]
//     );
//   };

//   const handleApproveSelected = () => {
//     const toApprove = checkedItems.filter((b) => {
//       const item = assets.find((a) => a.barcode === b);
//       return item && item.borrower === '신청중' && item.registrar === loginUser;
//     });
//     if (toApprove.length === 0) return alert('승인할 항목이 없습니다.');
//     setAssets((prev) => prev.map((a) => toApprove.includes(a.barcode) ? { ...a, borrower: '대여중' } : a));
//     setCheckedItems([]);
//   };

//   const handleRejectSelected = () => {
//     const toReject = checkedItems.filter((b) => {
//       const item = assets.find((a) => a.barcode === b);
//       return item && item.borrower === '신청중' && item.registrar === loginUser;
//     });
//     if (toReject.length === 0) return alert('거절할 항목이 없습니다.');
//     if (window.confirm('선택한 항목을 거절하시겠습니까?')) {
//       setAssets((prev) => prev.filter((a) => !toReject.includes(a.barcode)));
//       setCheckedItems([]);
//     }
//   };

//   const handleCancelSelected = () => {
//     const toCancel = checkedItems.filter((b) => {
//       const item = assets.find((a) => a.barcode === b);
//       return item && item.borrower === loginUser;
//     });
//     if (toCancel.length === 0) return alert('삭제할 수 있는 항목이 없습니다.');
//     if (window.confirm('선택한 신청을 삭제하시겠습니까?')) {
//       setAssets((prev) => prev.filter((a) => !toCancel.includes(a.barcode)));
//       setCheckedItems([]);
//     }
//   };

//   const 대여신청내역 = assets.filter((a) => a.borrower === '신청중' && a.registrar === loginUser);
//   const 내가신청한자산 = assets.filter((a) => a.borrower === loginUser);
//   const 대여중자산 = assets.filter((a) => a.borrower !== '신청중' && a.borrower !== loginUser);

//   const renderTable = (data, title) => (
//     <>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
//         <h3 style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</h3>
//         {title === '대여 신청 내역' && (
//           <div className="button-group">
//             <button className="primary-btn" onClick={handleApproveSelected}>승인</button>
//             <button className="primary-btn" onClick={handleRejectSelected} style={{ backgroundColor: '#fecaca' }}>거절</button>
//           </div>
//         )}
//         {title === '내가 신청한 자산' && (
//           <div className="button-group">
//             <button className="primary-btn" onClick={handleCancelSelected} style={{ backgroundColor: '#fee2e2' }}>삭제</button>
//           </div>
//         )}
//       </div>
//       <div className="table-wrapper">
//         <table className="asset-table">
//           <thead>
//             <tr>
//               {title !== '대여중' && <th></th>}
//               <th>바코드</th>
//               <th>회사구분</th>
//               <th>부서구분</th>
//               <th>세부위치</th>
//               <th>자산분류</th>
//               <th>품목</th>
//               <th>대여자</th>
//               <th>등록자</th>
//               <th>대여기간</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((item) => (
//               <tr key={item.barcode}>
//                 {title !== '대여중' && (
//                   <td>
//                     <input
//                       type="checkbox"
//                       checked={checkedItems.includes(item.barcode)}
//                       onChange={() => handleCheck(item.barcode)}
//                     />
//                   </td>
//                 )}
//                 <td>{item.barcode}</td>
//                 <td>{item.company}</td>
//                 <td>{item.department}</td>
//                 <td>{item.location}</td>
//                 <td>{item.category}</td>
//                 <td>{item.item}</td>
//                 <td>{item.borrower}</td>
//                 <td>{item.registrar}</td>
//                 <td style={{ fontSize: '13px' }}>{item.startDate && item.endDate ? `${item.startDate} ~ ${item.endDate}` : '-'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h2>자산 대여 목록</h2>
//         <div className="flex gap-2">
//           <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
//             대여신청
//           </button>
//         </div>
//       </div>

//       {renderTable(대여신청내역, '대여 신청 내역')}
//       {renderTable(내가신청한자산, '내가 신청한 자산')}
//       {renderTable(대여중자산, '대여중')}

//       <AssetFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
//     </div>
//   );
// }

// AssetListPage.js
import React, { useState, useMemo } from 'react';
import './AssetForm.css';
import AssetFormModal from './components/AssetModal';
import useMediaQuery from '../../utils/hooks/useMediaQuery';

export default function AssetListPage() {
  const loginUser = '홍길동';
  const isMobile = useMediaQuery('(max-width: 768px)');
  const today = useMemo(() => {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ); // 시/분/초 제거
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [assets, setAssets] = useState([
    {
      barcode: '20ORSFFL1',
      company: '평택 공장',
      department: '전산운영P',
      location: '전산실',
      rentLocation: '사무실', 
      category: 'IT자산',
      item: '노트북',
      borrower: '홍길동',
      registrar: '김영준',
      startDate: '2025-04-24',
      endDate: '2025-04-30'
    },
    {
      barcode: '20ORSFFL2',
      company: '평택 공장',
      department: '회계팀',
      location: '서버실',
      rentLocation: '사무실',
      category: 'IT자산',
      item: '모니터',
      borrower: '신청중',
      registrar: '홍길동',
      startDate: '2025-04-24',
      endDate: '2025-05-01'
    },
    {
      barcode: '20ORSFFL3',
      company: '우신비나',
      department: '생산팀',
      location: '라인1',
      rentLocation: '사무실',
      category: '사무자산',
      item: '책상',
      borrower: '이철수',
      registrar: '홍길동',
      startDate: '2025-04-20',
      endDate: '2025-04-28'
    },
    {
      barcode: '20ORSFFL4',
      company: '우신비나',
      department: '자재팀',
      location: '창고',
      rentLocation: '사무실',
      category: '사무자산',
      item: '의자',
      borrower: '김민지',
      registrar: '홍길동',
      startDate: '2025-04-21',
      endDate: '2025-04-29'
    }
  ]);

  const handleCheck = (barcode) => {
    setCheckedItems((prev) =>
      prev.includes(barcode) ? prev.filter((item) => item !== barcode) : [...prev, barcode]
    );
  };

  const handleApproveSelected = () => {
    const toApprove = checkedItems.filter((b) => {
      const item = assets.find((a) => a.barcode === b);
      return item && item.borrower === '신청중' && item.registrar === loginUser;
    });
    if (toApprove.length === 0) return alert('승인할 항목이 없습니다.');
    setAssets((prev) =>
      prev.map((a) =>
        toApprove.includes(a.barcode) ? { ...a, borrower: '대여중' } : a
      )
    );
    setCheckedItems([]);
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
  const overdueCount = useMemo(() => {
    return 대여중자산.reduce((count, a) => {
      const end = new Date(a.endDate);
      return end < today ? count + 1 : count;
    }, 0);
  }, [대여중자산, today]);

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
        {title === '대여 신청 내역' && (
          <div className="button-group">
            <button className="primary-btn" onClick={handleApproveSelected}>
              승인
            </button>
            <button
              className="primary-btn"
              onClick={handleRejectSelected}
              style={{ backgroundColor: '#fecaca' }}
            >
              거절
            </button>
          </div>
        )}
        {title === '내가 신청한 자산' && (
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
                const isOverdue =
                  title === '대여중' && new Date(item.endDate) < today;
                return (
                  <tr
                    key={item.barcode}
                    className={isOverdue ? 'overdue' : ''}
                  >
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

      {isMobile
        ? renderTable(대여신청내역, '대여 신청 내역')
        : renderTable(대여신청내역, '대여 신청 내역')}
      {isMobile
        ? renderTable(내가신청한자산, '내가 신청한 자산')
        : renderTable(내가신청한자산, '내가 신청한 자산')}
      {isMobile
        ? renderTable(대여중자산, '대여중')
        : renderTable(대여중자산, '대여중')}

      <AssetFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
