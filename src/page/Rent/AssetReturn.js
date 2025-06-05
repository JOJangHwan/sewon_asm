import React, { useState } from 'react';
import useMediaQuery from '../../utils/hooks/useMediaQuery';

export default function AssetReturnListPage() {
  const loginUser = '홍길동';
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [checkedItems, setCheckedItems] = useState([]);
  const [assets, setAssets] = useState([
    // 예시 데이터에 rentLocation 필드를 추가했습니다.
    {
      barcode: '20ORSFFL2',
      company: '평택 공장',
      department: '회계팀',
      location: '서버실',     // 세부위치
      rentLocation: '사무실', // 대여위치 (예시)
      category: 'IT자산',
      item: '모니터',
      borrower: '홍길동',
      registrar: '이철수'
    },
    {
      barcode: '20ORSFFL3',
      company: '우신비나',
      department: '생산팀',
      location: '라인1',     // 세부위치
      rentLocation: '사무실', // 대여위치 (예시)
      category: '사무자산',
      item: '책상',
      borrower: '신청중',
      registrar: '홍길동'
    },
    {
      barcode: '20ORSFFL4',
      company: '우신비나',
      department: '자재팀',
      location: '창고',       // 세부위치
      rentLocation: '사무실', // 대여위치 (예시)
      category: '사무자산',
      item: '의자',
      borrower: '신청중',
      registrar: '홍길동'
    }
  ]);

  const handleCheck = (barcode) => {
    setCheckedItems((prev) =>
      prev.includes(barcode) ? prev.filter((item) => item !== barcode) : [...prev, barcode]
    );
  };

  // 1) 내가 현재 빌린 자산에 대해 “반납 신청”
  const handleRequestReturn = () => {
    const toRequest = checkedItems.filter((barcode) => {
      const asset = assets.find((a) => a.barcode === barcode);
      return asset && asset.borrower === loginUser;
    });

    if (toRequest.length === 0) {
      alert('반납 신청할 항목이 없습니다.');
      return;
    }
    if (!window.confirm('선택한 자산을 반납 신청하시겠습니까?')) {
      return;
    }

    setAssets((prev) =>
      prev.map((a) =>
        toRequest.includes(a.barcode)
          ? { ...a, borrower: '신청중' } // borrower를 "신청중"으로 변경
          : a
      )
    );
    setCheckedItems((prev) => prev.filter((b) => !toRequest.includes(b)));
  };

  // 2) 내가 반납 신청한 자산(신청중) → “반납 취소”
  const handleCancelReturn = () => {
    const toCancel = checkedItems.filter((barcode) => {
      const asset = assets.find((a) => a.barcode === barcode);
      // borrower === '신청중' 이면서, 
      // (여기서는 단순히 신청자가 바로 “내가 빌린 자산”이라 간주하므로) 
      // asset.registrar !== loginUser 조건은 제외해도 무방합니다.
      return asset && asset.borrower === '신청중';
    });

    if (toCancel.length === 0) {
      alert('취소할 반납 신청이 없습니다.');
      return;
    }
    if (!window.confirm('선택한 반납 신청을 취소하시겠습니까?')) {
      return;
    }

    setAssets((prev) =>
      prev.map((a) =>
        toCancel.includes(a.barcode)
          ? { ...a, borrower: loginUser } // 다시 내가 대여 중인 상태로 복귀
          : a
      )
    );
    setCheckedItems((prev) => prev.filter((b) => !toCancel.includes(b)));
  };

  // 3) 타인이 내 자산에 반납 신청한 경우 → “승인”
  const handleApprove = () => {
    const toApprove = checkedItems.filter((barcode) => {
      const asset = assets.find((a) => a.barcode === barcode);
      return asset && asset.borrower === '신청중' && asset.registrar === loginUser;
    });

    if (toApprove.length === 0) {
      alert('승인할 항목이 없습니다.');
      return;
    }
    setAssets((prev) =>
      prev.map((a) =>
        toApprove.includes(a.barcode)
          ? { ...a, borrower: '반납완료' } // 반납완료 처리
          : a
      )
    );
    setCheckedItems([]);
  };

  // 3가지 상태로 필터링
  const 내가빌린 = assets.filter((a) => a.borrower === loginUser);
  const 내가반납신청한 = assets.filter((a) => a.borrower === '신청중' && a.registrar !== loginUser);
  const 내자산에들어온신청 = assets.filter((a) => a.borrower === '신청중' && a.registrar === loginUser);

  // 데스크톱용 테이블 렌더링 헬퍼
  const renderTable = (title, data, buttonElement) => (
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
              <th>대여위치</th>  {/* 새로 추가된 컬럼 */}
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
                <td>{item.location}</td>        {/* 세부위치 */}
                <td>{item.rentLocation}</td>    {/* 대여위치 */}
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

  // 모바일용 카드 뷰 렌더링 헬퍼
  const renderCardList = (title, data, buttonElement) => (
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
        <div className="button-group">{buttonElement}</div>
      </div>
      <div className="card-list" style={{ marginTop: 12 }}>
        {data.map((item) => (
          <div key={item.barcode} className="card">
            <div className="card-header">
              <input
                type="checkbox"
                checked={checkedItems.includes(item.barcode)}
                onChange={() => handleCheck(item.barcode)}
              />
            </div>
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
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>자산 반납 신청 목록</h2>
      </div>

      {/* 1. 내가 ↷ 현재 빌린 자산 → “반납 신청” 버튼 */}
      {isMobile
        ? renderCardList(
            '내가 대여 중인 자산',
            내가빌린,
            <button
              className="primary-btn"
              onClick={handleRequestReturn}
              style={{ backgroundColor: '#60a5fa', color: '#fff' }}
            >
              반납 신청
            </button>
          )
        : renderTable(
            '내가 대여 중인 자산',
            내가빌린,
            <button
              className="primary-btn"
              onClick={handleRequestReturn}
              style={{ backgroundColor: '#60a5fa', color: '#fff' }}
            >
              반납 신청
            </button>
          )}

      {/* 2. 내가 ↷ 이미 반납 신청한 자산 → “반납 취소” 버튼 */}
      {isMobile
        ? renderCardList(
            '내가 반납 신청한 자산',
            내가반납신청한,
            <button
              className="primary-btn"
              onClick={handleCancelReturn}
              style={{ backgroundColor: '#fee2e2', color: '#e53e3e' }}
            >
              반납 취소
            </button>
          )
        : renderTable(
            '내가 반납 신청한 자산',
            내가반납신청한,
            <button
              className="primary-btn"
              onClick={handleCancelReturn}
              style={{ backgroundColor: '#fee2e2', color: '#e53e3e' }}
            >
              반납 취소
            </button>
          )}

      {/* 3. ↷ 타인이 내 자산(=내가 등록자) 반납 신청한 자산 → “승인” 버튼 */}
      {isMobile
        ? renderCardList(
            '반납 신청한 자산',
            내자산에들어온신청,
            <button className="primary-btn" onClick={handleApprove}>
              승인
            </button>
          )
        : renderTable(
            '반납 신청한 자산',
            내자산에들어온신청,
            <button className="primary-btn" onClick={handleApprove}>
              승인
            </button>
          )}
    </div>
  );
}
