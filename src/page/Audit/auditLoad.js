import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './auditLoad.css';

import barcodeIcon from '../../assets/img/scan.png'; // 바코드 아이콘

const AuditLoad = () => {
  const [searchBarcode, setSearchBarcode] = useState('');
  const [items, setItems] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [registeredItems, setRegisteredItems] = useState([]);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scannerVisible && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerVisible]);

  const handleBarcodeClick = () => {
    setScannerVisible(true);
  };

  const onScanSuccess = (decodedText) => {
    const newItem = {
      barcode: decodedText,
      company: '',
      department: '',
      location: '',
      acquisitionType: '',
      assetCategory: '',
      itemName: '',
      assetStatus: '',
      manufacturer: '',
      model: '',
      acquisitionDate: '',
      acquisitionPrice: '',
      registrant: '',
    };
    setItems((prevItems) => [...prevItems, newItem]);
    setScannerVisible(false);

    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  const onScanFailure = (error) => {
    console.warn(`QR 스캔 실패: ${error}`);
  };

  const handleDelete = () => {
    const selectedItems = items.filter(item => !item.selected);
    setItems(selectedItems);
  };

  const handleRegister = () => {
    setRegisteredItems((prev) => [...prev, ...items]);
    setItems([]);
    alert('등록 완료되었습니다.');
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    const updatedItems = items.map(item => ({ ...item, selected: checked }));
    setItems(updatedItems);
  };

  const handleSelectItem = (index) => {
    const updatedItems = [...items];
    updatedItems[index].selected = !updatedItems[index].selected;
    setItems(updatedItems);
  };

  return (
    <div className="audit-container">
      <h2>실사 등록</h2>

      <div className="top-section">
        <img
          src={barcodeIcon}
          alt="바코드 스캔"
          className="barcode-icon"
          onClick={handleBarcodeClick}
        />
        <div className="search-bar">
          <input
            type="text"
            placeholder="바코드 번호"
            value={searchBarcode}
            onChange={(e) => setSearchBarcode(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
          <button className="register-btn" onClick={handleRegister}>등록하기</button>
        </div>
      </div>

      {/* 항상 div를 만들어두고, visible만 조절 */}
      <div
        id="reader"
        className="qr-reader"
        style={{ display: scannerVisible ? 'block' : 'none' }}
      ></div>

      <table className="audit-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={handleSelectAll} /></th>
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
            <th>등록자</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="14" className="no-data">스캔된 데이터가 없습니다.</td></tr>
          ) : (
            items.map((item, index) => (
              <tr key={index}>
                <td><input type="checkbox" checked={item.selected || false} onChange={() => handleSelectItem(index)} /></td>
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
                <td>{item.registrant}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLoad;
