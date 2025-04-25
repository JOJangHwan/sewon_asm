import React, { useState, useRef } from 'react';
import EditModal from './EditModal';
import InfoEditModal from './MyInfoModal';
import './myInfor.css';

const MyInfoPage = () => {
  const [items, setItems] = useState(Array.from({ length: 100 }, (_, i) => ({
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
  })));

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const userInfo = {
    company: '평택공장',
    department: '전산운영팀',
    name: '홍길동',
    id: 'ghdrlfehdWkd123',
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      alert('인쇄할 항목을 선택하세요!');
      return;
    }

    const printingAssets = selectedItems.map(idx => {
      const globalIndex = (currentPage - 1) * itemsPerPage + idx;
      return items[globalIndex];
    });

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    const html = `
      <html>
        <head>
          <title>자산 라벨 인쇄</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; display: flex; flex-wrap: wrap; }
            .label { border: 2px solid black; border-radius: 10px; margin: 10px; padding: 10px; width: 360px; height: 180px; display: flex; align-items: center; background: white; }
            .qr { width: 90px; height: 90px; }
            .info { margin-left: 10px; font-size: 14px; display: flex; flex-direction: column; }
            .info div { margin-bottom: 5px; }
            .logo { width: 100px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${printingAssets.map(asset => `
            <div class="label">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${asset.barcode}" class="qr" />
              <div class="info">
                <img src="/img/sewon.jpg" class="logo" alt="sewon logo" />
                <div><strong>${asset.company} ${asset.department}</strong></div>
                <div>${asset.location}</div>
                <div>${asset.barcode}</div>
                <div>${asset.itemName}</div>
              </div>
            </div>
          `).join('')}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSelectAll = () => {
    if (!selectAll) {
      setSelectedItems(currentItems.map((_, idx) => idx));
    } else {
      setSelectedItems([]);
    }
    setSelectAll(!selectAll);
  };

  const handleCheckboxChange = (idx) => {
    if (selectedItems.includes(idx)) {
      setSelectedItems(selectedItems.filter(id => id !== idx));
    } else {
      setSelectedItems([...selectedItems, idx]);
    }
  };

  const handleModify = () => {
    if (selectedItems.length !== 1) {
      alert('수정은 하나만 선택해야 합니다.');
      return;
    }
    const selectedItem = currentItems[selectedItems[0]];
    setEditItem({ ...selectedItem, idx: selectedItems[0] });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedItems.length === 0) {
      alert('삭제할 항목을 선택하세요.');
      return;
    }
    if (window.confirm('선택한 항목을 삭제하시겠습니까?')) {
      const newItems = [...items];
      const startIndex = (currentPage - 1) * itemsPerPage;
      selectedItems.sort((a, b) => b - a).forEach(idx => {
        newItems.splice(startIndex + idx, 1);
      });
      setItems(newItems);
      setSelectedItems([]);
      setSelectAll(false);
      alert('삭제가 완료되었습니다.');
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const pageNumberLimit = 5;
    let startPage = Math.floor((currentPage - 1) / pageNumberLimit) * pageNumberLimit + 1;
    let endPage = Math.min(startPage + pageNumberLimit - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>처음</button>
        <button className="page-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>이전</button>
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={`page-btn ${currentPage === number ? 'active' : ''}`}
          >
            {number}
          </button>
        ))}
        <button className="page-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>다음</button>
        <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>끝</button>
      </div>
    );
  };

  return (
    <div className="my-info-container">
      <div className="info-top-row">
        <h2>내가 올린 정보</h2>
        <div className="user-info-inline">
          <div className="user-info-item">소속 : {userInfo.company} {userInfo.department}</div>
          <div className="user-info-item">아이디 : {userInfo.id}</div>
          <div className="user-info-item">이름 : {userInfo.name}</div>
          <button className="info-edit-button" onClick={() => setIsInfoModalOpen(true)}>내 정보 수정하기</button>
        </div>
      </div>

      <div className="top-actions">
        <div className="button-group">
          <button className="action-button" onClick={handleModify} disabled={selectedItems.length !== 1}>수정하기</button>
          <button className="action-button" onClick={handleDelete} disabled={selectedItems.length === 0}>삭제하기</button>
          <button className="action-button" onClick={handlePrint} disabled={selectedItems.length === 0}>인쇄하기</button>
        </div>
        {selectedItems.length > 0 && (
          <div className="selected-count">{selectedItems.length}개 선택됨</div>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
              <th>바코드</th>
              <th>회사구분</th>
              <th>부서구분</th>
              <th>세부위치</th>
              <th>취득구분</th>
              <th>자산분류</th>
              <th>품목</th>
              <th>자산상태</th>
              <th>제조사</th>
              <th>모델</th>
              <th>취득일자</th>
              <th>취득가</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, idx) => (
              <tr key={idx}>
                <td><input type="checkbox" checked={selectedItems.includes(idx)} onChange={() => handleCheckboxChange(idx)} /></td>
                <td>{item.barcode}</td>
                <td>{item.company}</td>
                <td>{item.department}</td>
                <td>{item.location}</td>
                <td>{item.acquisitionType}</td>
                <td>{item.assetCategory}</td>
                <td>{item.itemName}</td>
                <td>{item.assetStatus}</td>
                <td>{item.manufacturer}</td>
                <td>{item.model}</td>
                <td>{item.acquisitionDate}</td>
                <td>{item.acquisitionPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderPagination()}

      {isModalOpen && editItem && (
        <EditModal
          item={editItem}
          onSave={(editedItem) => {
            const newItems = [...items];
            const globalIndex = (currentPage - 1) * itemsPerPage + editedItem.idx;
            newItems[globalIndex] = { ...editedItem };
            delete newItems[globalIndex].idx;
            setItems(newItems);
            setIsModalOpen(false);
            setSelectedItems([]);
            setSelectAll(false);
            alert('수정이 완료되었습니다.');
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isInfoModalOpen && (
        <InfoEditModal
          userInfo={userInfo}
          onClose={() => setIsInfoModalOpen(false)}
          onSave={(newInfo) => {
            alert('내 정보가 수정되었습니다.');
            setIsInfoModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MyInfoPage;