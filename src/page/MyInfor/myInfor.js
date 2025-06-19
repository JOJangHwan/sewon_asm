// src/page/MyInfor/MyInfoPage.js
import React, { useState, useEffect } from 'react';
import EditModal from './EditModal';
import InfoEditModal from './MyInfoModal';
import LabelPrint from './LabelPrint';
import { createRoot } from 'react-dom/client';
import './myInfor.css';

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
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
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
  const [selectedItems, setSelectedItems]     = useState([]);
  const [selectAll, setSelectAll]             = useState(false);
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editItem, setEditItem]               = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // ── 상세보기 상태
  const [detailItem, setDetailItem] = useState(null);

  // ── 내 정보
  const userInfo = {
    company: '경영기획',
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
      if (company         && it.company         !== company)         return false;
      if (department      && it.department      !== department)      return false;
      if (location        && it.location        !== location)        return false;
      if (assetCategory   && it.assetCategory   !== assetCategory)   return false;
      if (itemName        && it.itemName        !== itemName)        return false;
      if (barcodeKeyword  && it.barcode         !== barcodeKeyword)  return false;
      if (startDate       && it.acquisitionDate <  startDate)       return false;
      if (endDate         && it.acquisitionDate >  endDate)         return false;
      return true;
    });
  };

  // ── 검색/초기화
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
  const handleReset = () => {
    setCompany(''); setDepartment(''); setLocation('');
    setAssetCategory(''); setItemName(''); setBarcodeKeyword('');
    setStartDate(''); setEndDate(''); setViewCount(30);
    setFilteredItems([]); setSearched(false);
    setCurrentPage(1); setSelectAll(false); setSelectedItems([]);
  };

  // ── 페이지별 리스트
  const listToShow = searched ? filteredItems : items;
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

  // ── 수정/삭제/인쇄
  const handleModify = () => {
    if (selectedItems.length !== 1) return alert('수정은 하나만 선택해야 합니다.');
    const sel = currentList[selectedItems[0]];
    setEditItem({ ...sel, idx: selectedItems[0] });
    setIsModalOpen(true);
  };
  const handleDelete = () => {
    if (!selectedItems.length) return alert('삭제할 항목을 선택하세요.');
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    const newArr = [...items];
    const base   = (currentPage - 1) * itemsPerPage;
    selectedItems.sort((a,b)=>b-a).forEach(idx => newArr.splice(base + idx, 1));
    setItems(newArr); setSelectAll(false); setSelectedItems([]);
    alert('삭제되었습니다.');
  };
  const handlePrint = () => {
    if (!selectedItems.length) return alert('인쇄할 항목을 선택하세요!');
    const toPrint = selectedItems.map(idx => listToShow[(currentPage - 1) * itemsPerPage + idx]);
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
          className="info-edit-button"
          onClick={()=>setIsInfoModalOpen(true)}
        >
          내 정보 수정하기
        </button>
      </div>

      {/* 2. 조회 필터 */}
      <div className="search-section">
        <h2 className="section-title">자산 조회</h2>
        <div className="search-bar-wrapper">
          <div className="search-bar">
            <select className="search-input" value={company} onChange={e=>setCompany(e.target.value)}>
              <option value="">회사</option><option>평택공장</option><option>우신비나</option>
            </select>
            <select className="search-input" value={department} onChange={e=>setDepartment(e.target.value)}>
              <option value="">부서</option><option>전산운영팀</option><option>자재팀</option>
            </select>
            <select className="search-input" value={location} onChange={e=>setLocation(e.target.value)}>
              <option value="">위치</option><option>전산실</option><option>라인1</option>
            </select>
            <select className="search-input" value={assetCategory} onChange={e=>setAssetCategory(e.target.value)}>
              <option value="">분류</option><option>IT자산</option><option>가구</option>
            </select>
            <select className="search-input" value={itemName} onChange={e=>setItemName(e.target.value)}>
              <option value="">품목</option><option>노트북</option><option>책상</option>
            </select>
            <input
              type="number"
              className="search-input view-count"
              placeholder="출력개수"
              value={viewCount}
              onChange={e=>setViewCount(+e.target.value)}
            />
          </div>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="바코드"
              value={barcodeKeyword}
              onChange={e=>setBarcodeKeyword(e.target.value)}
            />
            <input type="date" className="search-input" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            <span>~</span>
            <input type="date" className="search-input" value={endDate}   onChange={e=>setEndDate(e.target.value)} />
            <button className="search-button" onClick={handleSearch}>🔍 조회</button>
            <button className="search-button reset" onClick={handleReset}>↺ 초기화</button>
          </div>
        </div>
      </div>

      {/* 3. 제목 + 액션 버튼 */}
      <div className="bottom-header">
        <h2 className="section-title">내가 올린 정보</h2>
        <div className="button-group">
          <button className="action-button" onClick={handleModify} disabled={selectedItems.length!==1}>
            수정하기
          </button>
          <button className="action-button" onClick={handleDelete} disabled={!selectedItems.length}>
            삭제하기
          </button>
          <button className="action-button" onClick={handlePrint} disabled={!selectedItems.length}>
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
              {currentList.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => setDetailItem(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(idx)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => handleCheckboxChange(idx)}
                    />
                  </td>
                  <td>{row.barcode}</td><td>{row.company}</td><td>{row.department}</td><td>{row.location}</td>
                  <td>{row.acquisitionType}</td><td>{row.assetCategory}</td><td>{row.itemName}</td>
                  <td>{row.assetStatus}</td><td>{row.manufacturer}</td><td>{row.model}</td>
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
            const arr=[...items];
            const gi=(currentPage-1)*itemsPerPage + edited.idx;
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
