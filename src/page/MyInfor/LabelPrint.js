

// src/page/MyInfor/LabelPrint.js
import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';


export default function LabelPrint({ selectedAssets, onAllImagesLoaded }) {
  const [loadedCount, setLoadedCount] = useState(0);

  const handleLogoLoad = () => {
    setLoadedCount(prev => prev + 1);
  };

  useEffect(() => {
    if (loadedCount === selectedAssets.length) {
      onAllImagesLoaded();
    }
  }, [loadedCount, selectedAssets.length, onAllImagesLoaded]);

  return (
    <div className="label-print-wrapper">
      {selectedAssets.map((asset, idx) => (
        <div className="label-box" key={idx}>
          {/* 좌측 QR 코드 */}
          <div className="qr-section">
            <QRCodeCanvas
              value={asset.barcode}
              size={46}  // mm 단위 고려, 약 11~13mm에 해당
              level="H"
              includeMargin={false}
              className="qr-canvas"
            />
          </div>

          {/* 우측 정보 */}
          <div className="info-section">
            <div className="logo-wrapper">
              <img
                src="/img/sewon.jpg"
                alt="sewon logo"
                className="logo"
                onLoad={handleLogoLoad}
              />
            </div>
            <p className="text-line main-location">
              {asset.company} {asset.department} {asset.location}
            </p>
            <p className="text-line barcode-text">{asset.barcode}</p>
            <p className="text-line item-name">{asset.itemName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
