// import React, { useState, useRef } from 'react';
// import EditModal from './EditModal';
// import InfoEditModal from './MyInfoModal';
// import './myInfor.css';

// const MyInfoPage = () => {
//   const [items, setItems] = useState(Array.from({ length: 100 }, (_, i) => ({
//     barcode: `200RSFFL${i + 1}`,
//     company: '평택공장',
//     department: '전산운영팀',
//     location: '전산실',
//     acquisitionType: '구매',
//     assetCategory: 'IT자산',
//     itemName: '노트북',
//     assetStatus: '사용',
//     manufacturer: '삼성',
//     model: 'SLD-5700',
//     acquisitionDate: '2025-03-20',
//     acquisitionPrice: '1,300,000',
//   })));

//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editItem, setEditItem] = useState(null);
//   const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

//   const userInfo = {
//     company: '평택공장',
//     department: '전산운영팀',
//     name: '홍길동',
//     id: 'ghdrlfehdWkd123',
//   };

//   const itemsPerPage = 10;
//   const totalPages = Math.ceil(items.length / itemsPerPage);

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

//   const handlePrint = () => {
//     if (selectedItems.length === 0) {
//       alert('인쇄할 항목을 선택하세요!');
//       return;
//     }

//     const printingAssets = selectedItems.map(idx => {
//       const globalIndex = (currentPage - 1) * itemsPerPage + idx;
//       return items[globalIndex];
//     });

//     const printWindow = window.open('', '_blank', 'width=800,height=600');

//     const html = `
//       <html>
//         <head>
//           <title>자산 라벨 인쇄</title>
//           <style>
//             body { font-family: Arial, sans-serif; padding: 20px; display: flex; flex-wrap: wrap; }
//             .label { border: 2px solid black; border-radius: 10px; margin: 10px; padding: 10px; width: 360px; height: 180px; display: flex; align-items: center; background: white; }
//             .qr { width: 90px; height: 90px; }
//             .info { margin-left: 10px; font-size: 14px; display: flex; flex-direction: column; }
//             .info div { margin-bottom: 5px; }
//             .logo { width: 100px; margin-bottom: 10px; }
//           </style>
//         </head>
//         <body>
//           ${printingAssets.map(asset => `
//             <div class="label">
//               <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${asset.barcode}" class="qr" />
//               <div class="info">
//                 <img src="/img/sewon.jpg" class="logo" alt="sewon logo" />
//                 <div><strong>${asset.company} ${asset.department}</strong></div>
//                 <div>${asset.location}</div>
//                 <div>${asset.barcode}</div>
//                 <div>${asset.itemName}</div>
//               </div>
//             </div>
//           `).join('')}
//           <script>
//             window.onload = function() {
//               window.print();
//               window.onafterprint = function() {
//                 window.close();
//               };
//             };
//           </script>
//         </body>
//       </html>
//     `;

//     printWindow.document.write(html);
//     printWindow.document.close();
//   };

//   const handleSelectAll = () => {
//     if (!selectAll) {
//       setSelectedItems(currentItems.map((_, idx) => idx));
//     } else {
//       setSelectedItems([]);
//     }
//     setSelectAll(!selectAll);
//   };

//   const handleCheckboxChange = (idx) => {
//     if (selectedItems.includes(idx)) {
//       setSelectedItems(selectedItems.filter(id => id !== idx));
//     } else {
//       setSelectedItems([...selectedItems, idx]);
//     }
//   };

//   const handleModify = () => {
//     if (selectedItems.length !== 1) {
//       alert('수정은 하나만 선택해야 합니다.');
//       return;
//     }
//     const selectedItem = currentItems[selectedItems[0]];
//     setEditItem({ ...selectedItem, idx: selectedItems[0] });
//     setIsModalOpen(true);
//   };

//   const handleDelete = () => {
//     if (selectedItems.length === 0) {
//       alert('삭제할 항목을 선택하세요.');
//       return;
//     }
//     if (window.confirm('선택한 항목을 삭제하시겠습니까?')) {
//       const newItems = [...items];
//       const startIndex = (currentPage - 1) * itemsPerPage;
//       selectedItems.sort((a, b) => b - a).forEach(idx => {
//         newItems.splice(startIndex + idx, 1);
//       });
//       setItems(newItems);
//       setSelectedItems([]);
//       setSelectAll(false);
//       alert('삭제가 완료되었습니다.');
//     }
//   };

//   const renderPagination = () => {
//     const pageNumbers = [];
//     const pageNumberLimit = 5;
//     let startPage = Math.floor((currentPage - 1) / pageNumberLimit) * pageNumberLimit + 1;
//     let endPage = Math.min(startPage + pageNumberLimit - 1, totalPages);

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return (
//       <div className="pagination">
//         <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>처음</button>
//         <button className="page-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>이전</button>
//         {pageNumbers.map(number => (
//           <button
//             key={number}
//             onClick={() => setCurrentPage(number)}
//             className={`page-btn ${currentPage === number ? 'active' : ''}`}
//           >
//             {number}
//           </button>
//         ))}
//         <button className="page-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>다음</button>
//         <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>끝</button>
//       </div>
//     );
//   };

//   return (
//     <div className="my-info-container">
//       <div className="info-top-row">
//         <h2>내가 올린 정보</h2>
//         <div className="user-info-inline">
//           <div className="user-info-item">소속 : {userInfo.company} {userInfo.department}</div>
//           <div className="user-info-item">아이디 : {userInfo.id}</div>
//           <div className="user-info-item">이름 : {userInfo.name}</div>
//           <button className="info-edit-button" onClick={() => setIsInfoModalOpen(true)}>내 정보 수정하기</button>
//         </div>
//       </div>

//       <div className="top-actions">
//         <div className="button-group">
//           <button className="action-button" onClick={handleModify} disabled={selectedItems.length !== 1}>수정하기</button>
//           <button className="action-button" onClick={handleDelete} disabled={selectedItems.length === 0}>삭제하기</button>
//           <button className="action-button" onClick={handlePrint} disabled={selectedItems.length === 0}>인쇄하기</button>
//         </div>
//         {selectedItems.length > 0 && (
//           <div className="selected-count">{selectedItems.length}개 선택됨</div>
//         )}
//       </div>

//       <div className="table-container">
//         <table>
//           <thead>
//             <tr>
//               <th><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
//               <th>바코드</th>
//               <th>회사구분</th>
//               <th>부서구분</th>
//               <th>세부위치</th>
//               <th>취득구분</th>
//               <th>자산분류</th>
//               <th>품목</th>
//               <th>자산상태</th>
//               <th>제조사</th>
//               <th>모델</th>
//               <th>취득일자</th>
//               <th>취득가</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentItems.map((item, idx) => (
//               <tr key={idx}>
//                 <td><input type="checkbox" checked={selectedItems.includes(idx)} onChange={() => handleCheckboxChange(idx)} /></td>
//                 <td>{item.barcode}</td>
//                 <td>{item.company}</td>
//                 <td>{item.department}</td>
//                 <td>{item.location}</td>
//                 <td>{item.acquisitionType}</td>
//                 <td>{item.assetCategory}</td>
//                 <td>{item.itemName}</td>
//                 <td>{item.assetStatus}</td>
//                 <td>{item.manufacturer}</td>
//                 <td>{item.model}</td>
//                 <td>{item.acquisitionDate}</td>
//                 <td>{item.acquisitionPrice}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {renderPagination()}

//       {isModalOpen && editItem && (
//         <EditModal
//           item={editItem}
//           onSave={(editedItem) => {
//             const newItems = [...items];
//             const globalIndex = (currentPage - 1) * itemsPerPage + editedItem.idx;
//             newItems[globalIndex] = { ...editedItem };
//             delete newItems[globalIndex].idx;
//             setItems(newItems);
//             setIsModalOpen(false);
//             setSelectedItems([]);
//             setSelectAll(false);
//             alert('수정이 완료되었습니다.');
//           }}
//           onClose={() => setIsModalOpen(false)}
//         />
//       )}

//       {isInfoModalOpen && (
//         <InfoEditModal
//           userInfo={userInfo}
//           onClose={() => setIsInfoModalOpen(false)}
//           onSave={(newInfo) => {
//             alert('내 정보가 수정되었습니다.');
//             setIsInfoModalOpen(false);
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default MyInfoPage;


import React, { useState, useEffect } from 'react';
import EditModal from './EditModal';
import InfoEditModal from './MyInfoModal';
import './myInfor.css';

export default function MyInfoPage() {
  // ── 더미 데이터
  const [items, setItems] = useState(
    Array.from({ length: 100 }, (_, i) => ({
      barcode: `200RSFFL${i + 1}`,
      company: '평택공장',
      department: '전산운영팀',
      location: '전산실',
      acquisitionType: '구매',
      assetCategory: 'IT자산',
      itemName: '노트북',
      assetStatus: '사용',
      manufacturer: '삼성',
      model: 'SLD-5700',
      acquisitionDate: '2025-03-20',
      acquisitionPrice: '1,300,000',
    }))
  );

  // ── 검색 필터 상태
  const [company, setCompany]             = useState('');
  const [department, setDepartment]       = useState('');
  const [location, setLocation]           = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [itemName, setItemName]           = useState('');
  const [barcodeKeyword, setBarcodeKeyword] = useState('');
  const [startDate, setStartDate]         = useState('');
  const [endDate, setEndDate]             = useState('');
  const [viewCount, setViewCount]         = useState(30);

  // ── 필터된 결과 & 검색 여부
  const [filteredItems, setFilteredItems] = useState([]);
  const [searched, setSearched]           = useState(false);

  // ── 페이징 상태
  const [currentPage, setCurrentPage]     = useState(1);
  const itemsPerPage    = 10;
  const pageNumberLimit = 5;

  // ── 선택 & 모달 상태
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll]         = useState(false);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editItem, setEditItem]           = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // ── 내 정보
  const userInfo = {
    company: '평택공장',
    department: '전산운영팀',
    name: '홍길동',
    id: 'ghdrlfehdWkd123',
  };

  // ── 종속 필터 초기화
  useEffect(() => { setDepartment(''); setLocation(''); }, [company]);
  useEffect(() => { setLocation(''); }, [department]);
  useEffect(() => { setItemName(''); }, [assetCategory]);

  // ── 내부 필터링
  const applyFilter = () => {
    return items.filter(it => {
      if (company && it.company !== company) return false;
      if (department && it.department !== department) return false;
      if (location && it.location !== location) return false;
      if (assetCategory && it.assetCategory !== assetCategory) return false;
      if (itemName && it.itemName !== itemName) return false;
      if (barcodeKeyword && it.barcode !== barcodeKeyword) return false;
      if (startDate && it.acquisitionDate < startDate) return false;
      if (endDate && it.acquisitionDate > endDate) return false;
      return true;
    });
  };

  // ── 검색
  const handleSearch = () => {
    if (startDate && endDate && startDate > endDate) {
      return alert('시작일자가 종료일자보다 빠를 수 없습니다.');
    }
    let result = applyFilter();
    if (viewCount > 0) result = result.slice(0, viewCount);
    setFilteredItems(result);
    setSearched(true);
    setCurrentPage(1);
    setSelectAll(false);
    setSelectedItems([]);
  };

  // ── 초기화
  const handleReset = () => {
    setCompany(''); setDepartment(''); setLocation('');
    setAssetCategory(''); setItemName(''); setBarcodeKeyword('');
    setStartDate(''); setEndDate(''); setViewCount(30);
    setFilteredItems([]); setSearched(false);
    setCurrentPage(1); setSelectAll(false); setSelectedItems([]);
  };

  // ── 페이지별 리스트
  const listToShow  = searched ? filteredItems : items;
  const totalPages  = Math.ceil(listToShow.length / itemsPerPage);
  const idxLast     = currentPage * itemsPerPage;
  const idxFirst    = idxLast - itemsPerPage;
  const currentList = listToShow.slice(idxFirst, idxLast);

  // ── 페이징 버튼
  const maxPageNum = Math.ceil(currentPage / pageNumberLimit) * pageNumberLimit;
  const minPageNum = maxPageNum - pageNumberLimit + 1;
  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i >= minPageNum && i <= maxPageNum) {
        pages.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`page-btn ${currentPage === i ? 'active' : ''}`}
          >
            {i}
          </button>
        );
      }
    }
    return pages;
  };

  // ── 전체/단일 선택
  const handleSelectAll = () => {
    setSelectAll(prev => !prev);
    setSelectedItems(!selectAll ? currentList.map((_, i) => i) : []);
  };
  const handleCheckboxChange = idx => {
    setSelectedItems(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  // ── 수정
  const handleModify = () => {
    if (selectedItems.length !== 1) {
      return alert('수정은 하나만 선택해야 합니다.');
    }
    const sel = currentList[selectedItems[0]];
    setEditItem({ ...sel, idx: selectedItems[0] });
    setIsModalOpen(true);
  };

  // ── 삭제
  const handleDelete = () => {
    if (!selectedItems.length) return alert('삭제할 항목을 선택하세요.');
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    const newArr = [...items];
    const base   = (currentPage - 1) * itemsPerPage;
    selectedItems.sort((a,b) => b - a).forEach(idx => {
      newArr.splice(base + idx, 1);
    });
    setItems(newArr);
    setSelectAll(false);
    setSelectedItems([]);
    alert('삭제되었습니다.');
  };

  // ── 인쇄
  const handlePrint = () => {
    if (!selectedItems.length) return alert('인쇄할 항목을 선택하세요!');
    const toPrint = selectedItems.map(idx => {
      const gi = (currentPage - 1) * itemsPerPage + idx;
      return listToShow[gi];
    });
    const w = window.open('', '_blank', 'width=800,height=600');
    const html = `
      <html><head><title>인쇄</title>
        <style>
          body{font-family:Arial;padding:20px;display:flex;flex-wrap:wrap}
          .lbl{border:1px solid#000;margin:10px;padding:10px;width:200px;text-align:center}
        </style>
      </head><body>
      ${toPrint.map(a=>`
        <div class="lbl">
          <div><strong>${a.barcode}</strong></div>
          <div>${a.itemName}</div>
        </div>
      `).join('')}
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="my-info-container">

      {/* 1. 맨 위: 내정보 박스 + 수정 버튼 */}
      <div className="top-section">
        <div className="user-info-inline">
          <div>소속: {userInfo.company} {userInfo.department}</div>
          <div>아이디: {userInfo.id}</div>
          <div>이름: {userInfo.name}</div>
        </div>
        <button
          className="info-edit-button"
          onClick={() => setIsInfoModalOpen(true)}
        >
          내 정보 수정하기
        </button>
      </div>

      {/* 2. 중간: 조회 필터 */}
      <div className="search-section">
        <h2 className="section-title">자산 조회</h2>
        <div className="search-bar-wrapper">
          <div className="search-bar">
            <select className="search-input" value={company} onChange={e => setCompany(e.target.value)}>
              <option value="">회사</option><option>평택공장</option><option>우신비나</option>
            </select>
            <select className="search-input" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">부서</option><option>전산운영팀</option><option>자재팀</option>
            </select>
            <select className="search-input" value={location} onChange={e => setLocation(e.target.value)}>
              <option value="">위치</option><option>전산실</option><option>라인1</option>
            </select>
            <select className="search-input" value={assetCategory} onChange={e => setAssetCategory(e.target.value)}>
              <option value="">분류</option><option>IT자산</option><option>가구</option>
            </select>
            <select className="search-input" value={itemName} onChange={e => setItemName(e.target.value)}>
              <option value="">품목</option><option>노트북</option><option>책상</option>
            </select>
            <input
              type="number"
              className="search-input view-count"
              placeholder="출력개수"
              value={viewCount}
              min="1"
              onChange={e => setViewCount(+e.target.value)}
            />
          </div>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="바코드"
              value={barcodeKeyword}
              onChange={e => setBarcodeKeyword(e.target.value)}
            />
            <input
              type="date"
              className="search-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span>~</span>
            <input
              type="date"
              className="search-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch}>🔍 조회</button>
            <button className="search-button reset" onClick={handleReset}>↺ 초기화</button>
          </div>
        </div>
      </div>

      {/* 3. 하단 헤더: 제목 + 액션 버튼 */}
      <div className="bottom-header">
        <h2 className="section-title">내가 올린 정보</h2>
        <div className="button-group">
          <button className="action-button" onClick={handleModify} disabled={selectedItems.length!==1}>수정하기</button>
          <button className="action-button" onClick={handleDelete} disabled={!selectedItems.length}>삭제하기</button>
          <button className="action-button" onClick={handlePrint} disabled={!selectedItems.length}>인쇄하기</button>
        </div>
      </div>

      {/* 4. 테이블 & 페이징 */}
      <div className="table-section">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                <th>바코드</th><th>회사구분</th><th>부서구분</th><th>세부위치</th>
                <th>취득구분</th><th>자산분류</th><th>품목</th><th>자산상태</th>
                <th>제조사</th><th>모델</th><th>취득일자</th><th>취득가</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(idx)}
                      onChange={() => handleCheckboxChange(idx)}
                    />
                  </td>
                  <td>{row.barcode}</td><td>{row.company}</td><td>{row.department}</td>
                  <td>{row.location}</td><td>{row.acquisitionType}</td>
                  <td>{row.assetCategory}</td><td>{row.itemName}</td>
                  <td>{row.assetStatus}</td><td>{row.manufacturer}</td>
                  <td>{row.model}</td><td>{row.acquisitionDate}</td><td>{row.acquisitionPrice}</td>
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

      {/* 모달 */}
      {isInfoModalOpen && (
        <InfoEditModal
          userInfo={userInfo}
          onClose={()=>setIsInfoModalOpen(false)}
          onSave={newInfo=>{
            alert('내 정보 수정되었습니다.');
            setIsInfoModalOpen(false);
          }}
        />
      )}
      {isModalOpen && editItem && (
        <EditModal
          item={editItem}
          onSave={edited=>{
            const arr=[...items];
            const gi=(currentPage-1)*itemsPerPage+edited.idx;
            delete edited.idx;
            arr[gi]=edited;
            setItems(arr);
            setIsModalOpen(false);
            setSelectedItems([]); setSelectAll(false);
            alert('수정되었습니다.');
          }}
          onClose={()=>setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
