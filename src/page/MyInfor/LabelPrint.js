import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const LabelPrint = ({ selectedAssets, onAllImagesLoaded }) => {
  const [loadedCount, setLoadedCount] = useState(0);

  const handleImageLoad = () => {
    setLoadedCount(prev => {
      const newCount = prev + 1;
      if (newCount === selectedAssets.length) {
        // 모든 이미지가 로드 완료되었으면 콜백 호출
        onAllImagesLoaded();
      }
      return newCount;
    });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', justifyContent: 'center' }}>
      {selectedAssets.map((asset, idx) => (
        <div key={idx} style={{
          width: '360px',
          height: '180px',
          margin: '10px',
          padding: '10px 20px',
          border: '2px solid black',
          borderRadius: '10px',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <QRCodeCanvas value={asset.barcode} size={90} />
          </div>
          <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* 로고 */}
            <img 
              src="/img/sewon.jpg" 
              alt="sewon logo" 
              style={{ width: '100px', marginBottom: '5px' }}
              onLoad={handleImageLoad}
            />
            {/* 텍스트 */}
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{asset.company} {asset.department} {asset.location}</div>
            <div style={{ fontSize: '14px', marginTop: '2px' }}>{asset.barcode}</div>
            <div style={{ fontSize: '14px', marginTop: '2px' }}>{asset.itemName}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LabelPrint;
