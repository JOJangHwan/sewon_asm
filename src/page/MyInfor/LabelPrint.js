// src/page/MyInfor/LabelPrint.js (최종 3줄/로고 없음)
import React, { useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function LabelPrint({ selectedAssets = [], onAllImagesLoaded = () => {} }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onAllImagesLoaded());
    return () => cancelAnimationFrame(id);
  }, [selectedAssets, onAllImagesLoaded]);

  return (
    <div className="label-print-wrapper">
      {selectedAssets.map((asset, idx) => {
        const corpDeptLoc = [
          asset.company || asset.corporation || "",
          asset.department || "",
          asset.location || ""
        ].filter(Boolean).join(" ");

        // 공백만으로 결합 (하이픈 X)
        const parentName = asset.parentCategory ?? asset.assetCategory ?? "";
        const childName  = asset.childCategory  ?? asset.itemName      ?? "";
        const categoryLine = [parentName, childName].filter(Boolean).join(" ");

        return (
          <div className="label-box" key={asset.barcode || idx}>
            <div className="qr-section">
              <QRCodeCanvas
                value={String(asset.barcode || "")}
                size={46}
                level="H"
                includeMargin={false}
                className="qr-canvas"
              />
            </div>
            <div className="info-section">
              <p className="text-line">{corpDeptLoc}</p>              {/* 1열 */}
              <p className="text-line barcode-text">{asset.barcode}</p> {/* 2열 */}
              <p className="text-line category-line">{categoryLine}</p>  {/* 3열 */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
