import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AssetDetailPage.css';

const AssetDetailPage = () => {
  const { state: asset } = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const isElectronicAsset = ["노트북", "컴퓨터"].includes(asset?.childCategory);

  return (
    <div className="asset-detail-container">
      <h2>자산 상세 정보</h2>

      <button className="back-button" onClick={handleBack}>← 뒤로가기</button>

      {asset ? (
        <>
          <p className="asset-info-row"><strong>📦 바코드:</strong> {asset.barcode}</p>
          <p className="asset-info-row"><strong>🏢 회사:</strong> {asset.corporation}</p>
          <p className="asset-info-row"><strong>🧩 부서:</strong> {asset.department}</p>
          <p className="asset-info-row"><strong>📍 위치:</strong> {asset.location}</p>
          <p className="asset-info-row"><strong>📁 자산분류:</strong> {asset.parentCategory}</p>
          <p className="asset-info-row"><strong>🔧 품목:</strong> {asset.childCategory}</p>
          <p className="asset-info-row"><strong>📌 자산 상태:</strong> {asset.status}</p>
          <p className="asset-info-row"><strong>🏭 제조사:</strong> {asset.manufacturer}</p>
          <p className="asset-info-row"><strong>💻 모델:</strong> {asset.model}</p>
          <p className="asset-info-row"><strong>📅 취득일자:</strong> {asset.acquisitionDate}</p>
          <p className="asset-info-row"><strong>💰 취득가:</strong> {Number(asset.acquisitionPrice).toLocaleString()} 원</p>
          <p className="asset-info-row"><strong>📝 등록자:</strong> {asset.registerName}</p>
          <p className="asset-info-row"><strong>🗓️ 등록일자:</strong> {asset.registrationDate}</p>
          <p className="asset-info-row"><strong>📄 취득구분:</strong> {asset.division}</p>

          {isElectronicAsset && (
            <>
              <p className="asset-info-row"><strong>⚙️ CPU:</strong> {asset.cpu}</p>
              <p className="asset-info-row"><strong>🎮 그래픽카드:</strong> {asset.gpu}</p>
              <p className="asset-info-row"><strong>🧠 RAM:</strong> {asset.ram} GB</p>
              <p className="asset-info-row"><strong>💾 저장공간:</strong> {asset.storage} GB</p>
            </>
          )}
        </>
      ) : (
        <p>QR 정보가 없습니다.</p>
      )}
    </div>
  );
};

export default AssetDetailPage;
