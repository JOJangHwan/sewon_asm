import React, { useState } from 'react';

export default function AssetReturnListPage() {
  const loginUser = '홍길동';

  const [checkedItems, setCheckedItems] = useState([]);
  const [assets, setAssets] = useState([
    { barcode: '20ORSFFL2', company: '평택 공장', department: '회계팀', location: '서버실', category: 'IT자산', item: '모니터', borrower: '홍길동', registrar: '이철수' },
    { barcode: '20ORSFFL3', company: '우신비나', department: '생산팀', location: '라인1', category: '사무자산', item: '책상', borrower: '신청중', registrar: '홍길동' },
    { barcode: '20ORSFFL4', company: '우신비나', department: '자재팀', location: '창고', category: '사무자산', item: '의자', borrower: '신청중', registrar: '홍길동' }
  ]);

  const handleCheck = (barcode) => {
    setCheckedItems((prev) =>
      prev.includes(barcode) ? prev.filter((item) => item !== barcode) : [...prev, barcode]
    );
  };

  const handleCancelReturn = () => {
    const toCancel = checkedItems.filter(barcode => {
      const asset = assets.find(a => a.barcode === barcode);
      return asset && asset.borrower === loginUser;
    });
    if (toCancel.length === 0) return alert('취소할 항목이 없습니다.');
    if (window.confirm('선택한 반납 신청을 취소하시겠습니까?')) {
      setAssets(prev => prev.filter(a => !toCancel.includes(a.barcode)));
      setCheckedItems(prev => prev.filter(b => !toCancel.includes(b)));
    }
  };

  const handleApprove = () => {
    const toApprove = checkedItems.filter(barcode => {
      const asset = assets.find(a => a.barcode === barcode);
      return asset && asset.borrower === '신청중' && asset.registrar === loginUser;
    });
    if (toApprove.length === 0) return alert('승인할 항목이 없습니다.');
    setAssets(prev => prev.map(a => toApprove.includes(a.barcode) ? { ...a, borrower: '반납완료' } : a));
    setCheckedItems([]);
  };

  const 내가신청한반납 = assets.filter(a => a.borrower === loginUser);
  const 내자산에들어온반납 = assets.filter(a => a.borrower === '신청중' && a.registrar === loginUser);

  const renderTable = (title, data, buttonGroup) => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</h3>
        <div className="button-group">{buttonGroup}</div>
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
              <th>자산분류</th>
              <th>품목</th>
              <th>대여자</th>
              <th>등록자</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.barcode}>
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
                <td>{item.category}</td>
                <td>{item.item}</td>
                <td>{item.borrower}</td>
                <td>{item.registrar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>자산 반납 신청 목록</h2>
      </div>

      {renderTable(
        '내가 반납 신청한 자산',
        내가신청한반납,
        <button className="primary-btn" onClick={handleCancelReturn} style={{ backgroundColor: '#fee2e2' }}>
          반납 취소
        </button>
      )}

      {renderTable(
        '상대방이 내 자산에 반납 신청한 자산',
        내자산에들어온반납,
        <button className="primary-btn" onClick={handleApprove}>
          승인
        </button>
      )}
    </div>
  );
}
