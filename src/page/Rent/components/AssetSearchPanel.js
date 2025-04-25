// AssetSearchPanel.js
import React, { useState } from 'react';
import './AssetSearchPanel.css';

const dummyAssets = [
  { id: 1, assetType: 'IT', itemName: '노트북', asset: '자산 바코드1', detailLocation: '전산실', registrar: '홍길동', renter: '' },
  { id: 2, assetType: 'IT', itemName: '노트북', asset: '자산 바코드2', detailLocation: '전산실', registrar: '홍길동', renter: '홍길동' },
  { id: 3, assetType: 'IT', itemName: '프린터', asset: '자산 바코드3', detailLocation: '창고', registrar: '홍길동', renter: '' },
  { id: 4, assetType: '사무용품', itemName: '의자', asset: '자산 바코드4', detailLocation: '회의실', registrar: '홍길동', renter: '' },
];

const assetTypes = {
  IT: ['노트북', '프린터'],
  사무용품: ['의자', '책상']
};

const locations = {
  노트북: ['전산실', '창고'],
  프린터: ['창고'],
  의자: ['회의실'],
  책상: ['창고']
};

export default function AssetSearchPanel({ isOpen, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [item, setItem] = useState('');
  const [location, setLocation] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);

  if (!isOpen) return null;

  const handleSearch = () => {
    const result = dummyAssets.filter(
      a =>
        (!type || a.assetType === type) &&
        (!item || a.itemName === item) &&
        (!location || a.detailLocation === location) &&
        (!a.renter) &&
        a.itemName.includes(search)
    );
    setFilteredAssets(result);
  };

  return (
    <div className="slide-panel">
      <div className="panel-header">
        <h3>자산 검색</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="panel-body">
        <div className="filters">
          <select value={type} onChange={(e) => { setType(e.target.value); setItem(''); setLocation(''); }}>
            <option value="">자산분류</option>
            {Object.keys(assetTypes).map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={item} onChange={(e) => { setItem(e.target.value); setLocation(''); }} disabled={!type}>
            <option value="">품목</option>
            {(assetTypes[type] || []).map(i => <option key={i}>{i}</option>)}
          </select>
          <select value={location} onChange={(e) => setLocation(e.target.value)} disabled={!item}>
            <option value="">세부위치</option>
            {(locations[item] || []).map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="search-box">
          <input type="text" placeholder="품목 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={handleSearch}>🔍</button>
        </div>
        <table className="asset-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>자산 바코드</th>
              <th>세부위치</th>
              <th>자산상태</th>
              <th>등록자</th>
              <th>선택</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset, idx) => (
              <tr key={asset.id}>
                <td>{idx + 1}</td>
                <td>{asset.asset}</td>
                <td>{asset.detailLocation}</td>
                <td>{asset.renter ? '대여중' : '대여가능'}</td>
                <td>{asset.registrar}</td>
                <td><button className="select-btn" onClick={() => onSelect(asset)}>선택</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
