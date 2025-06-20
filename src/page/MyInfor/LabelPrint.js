// import React, { useState } from 'react';
// import { QRCodeCanvas } from 'qrcode.react';

// const LabelPrint = ({ selectedAssets, onAllImagesLoaded }) => {
//   const [loadedCount, setLoadedCount] = useState(0);

//   const handleImageLoad = () => {
//     setLoadedCount(prev => {
//       const newCount = prev + 1;
//       if (newCount === selectedAssets.length) {
//         // 모든 이미지가 로드 완료되었으면 콜백 호출
//         onAllImagesLoaded();
//       }
//       return newCount;
//     });
//   };

//   return (
//     <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', justifyContent: 'center' }}>
//       {selectedAssets.map((asset, idx) => (
//         <div key={idx} style={{
//           width: '360px',
//           height: '180px',
//           margin: '10px',
//           padding: '10px 20px',
//           border: '2px solid black',
//           borderRadius: '10px',
//           backgroundColor: 'white',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'flex-start',
//         }}>
//           <div style={{ flex: '0 0 auto' }}>
//             <QRCodeCanvas value={asset.barcode} size={90} />
//           </div>
//           <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
//             {/* 로고 */}
//             <img
//               src="/img/sewon.jpg"
//               alt="sewon logo"
//               style={{ width: '90px', marginTop: '8px' }}
//               onLoad={handleImageLoad}
//             />
//             {/* 텍스트 */}
//             <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{asset.company} {asset.department} {asset.location}</div>
//             <div style={{ fontSize: '14px', marginTop: '2px' }}>{asset.barcode}</div>
//             <div style={{ fontSize: '14px', marginTop: '2px' }}>{asset.itemName}</div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default LabelPrint;



// import React, { useState } from 'react';
// import { QRCodeCanvas } from 'qrcode.react';
// import './labelPrint.css';

// const LabelPrint = ({ selectedAssets, onAllImagesLoaded }) => {
//   const [loadedCount, setLoadedCount] = useState(0);

//   const handleLogoLoad = () => {
//     setLoadedCount(prev => {
//       const next = prev + 1;
//       if (next === selectedAssets.length) {
//         onAllImagesLoaded();
//       }
//       return next;
//     });
//   };

//   return (
//     <div className="label-print-container">
//       {selectedAssets.map((asset, idx) => (
//         <div key={idx} className="label-print-box">
//           <div className="label-print-qr">
//             <QRCodeCanvas value={asset.barcode} size={80} />
//           </div>
//           <div className="label-print-info">
//             <img
//               src="/img/sewon.jpg"
//               alt="sewon logo"
//               className="label-print-logo"
//               onLoad={handleLogoLoad}
//             />
//             <div className="label-print-line">
//               {asset.company} {asset.department} {asset.location}
//             </div>
//             <div className="label-print-line">{asset.barcode}</div>
//             <div className="label-print-line">{asset.itemName}</div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default LabelPrint;

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
