// ✅ AssetDetailPage.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import './AssetDetailPage.css';

const AssetDetailPage = () => {
  const { state: asset } = useLocation();

  return (
    <div className="asset-detail-container">
      <h2>자산 상세 정보</h2>
      {asset ? (
        <>
          <p className="asset-info-row"><strong>📦 바코드 번호:</strong> {asset.barcode}</p>
          <p className="asset-info-row"><strong>🏢 회사 구분:</strong> {asset.company}</p>
          <p className="asset-info-row"><strong>🧩 부서 구분:</strong> {asset.department}</p>
          <p className="asset-info-row"><strong>📍 세부 위치:</strong> {asset.location}</p>
          <p className="asset-info-row"><strong>📁 자산 분류:</strong> {asset.assetCategory}</p>
          <p className="asset-info-row"><strong>🔧 품목:</strong> {asset.itemName}</p>
          <p className="asset-info-row"><strong>📌 자산 상태:</strong> {asset.assetStatus}</p>
          <p className="asset-info-row"><strong>🏭 제조사:</strong> {asset.manufacturer}</p>
          <p className="asset-info-row"><strong>💻 모델:</strong> {asset.model}</p>
          <p className="asset-info-row"><strong>📅 취득일자:</strong> {asset.acquisitionDate}</p>
          <p className="asset-info-row"><strong>💰 취득가:</strong> {asset.acquisitionPrice.toLocaleString()} 원</p>
          <p className="asset-info-row"><strong>📝 등록자:</strong> {asset.registrant}</p>
        </>
      ) : (
        <p>QR 정보가 없습니다.</p>
      )}
    </div>
  );
};

export default AssetDetailPage;
