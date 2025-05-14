// ✅ 대여 화면용 카드형 렌더링 함수
// MobileAssetCardView.js
import React from 'react';

export function renderRentCardList(data, title, checkedItems, handleCheck) {
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{title}</h3>
      <div className="card-list">
        {data.map((item) => (
          <div key={item.barcode} className="card">
            {title !== '대여중' && (
              <div className="card-header">
                <input
                  type="checkbox"
                  checked={checkedItems.includes(item.barcode)}
                  onChange={() => handleCheck(item.barcode)}
                />
              </div>
            )}
            <div className="card-row"><span className="card-label">바코드</span><span className="card-value">{item.barcode}</span></div>
            <div className="card-row"><span className="card-label">회사</span><span className="card-value">{item.company}</span></div>
            <div className="card-row"><span className="card-label">부서</span><span className="card-value">{item.department}</span></div>
            <div className="card-row"><span className="card-label">위치</span><span className="card-value">{item.location}</span></div>
            <div className="card-row"><span className="card-label">분류</span><span className="card-value">{item.category}</span></div>
            <div className="card-row"><span className="card-label">품목</span><span className="card-value">{item.item}</span></div>
            <div className="card-row"><span className="card-label">대여자</span><span className="card-value">{item.borrower}</span></div>
            <div className="card-row"><span className="card-label">등록자</span><span className="card-value">{item.registrar}</span></div>
            {item.startDate && item.endDate && (
              <div className="card-row">
                <span className="card-label">대여기간</span>
                <span className="card-value">{item.startDate} ~ {item.endDate}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

  
  
  // ✅ 반납 화면용 카드형 렌더링 함수
  export function renderReturnCardList(data, checkedItems, handleCheck) {
    return (
      <div className="card-list">
        {data.map((item) => (
          <div key={item.barcode} className="card">
            <div className="card-header">
              <input
                type="checkbox"
                checked={checkedItems.includes(item.barcode)}
                onChange={() => handleCheck(item.barcode)}
              />
            </div>
            <div className="card-row"><span className="card-label">바코드</span><span className="card-value">{item.barcode}</span></div>
            <div className="card-row"><span className="card-label">회사</span><span className="card-value">{item.company}</span></div>
            <div className="card-row"><span className="card-label">부서</span><span className="card-value">{item.department}</span></div>
            <div className="card-row"><span className="card-label">위치</span><span className="card-value">{item.location}</span></div>
            <div className="card-row"><span className="card-label">분류</span><span className="card-value">{item.category}</span></div>
            <div className="card-row"><span className="card-label">품목</span><span className="card-value">{item.item}</span></div>
            <div className="card-row"><span className="card-label">대여자</span><span className="card-value">{item.borrower}</span></div>
            <div className="card-row"><span className="card-label">등록자</span><span className="card-value">{item.registrar}</span></div>
          </div>
        ))}
      </div>
    );
  }
  