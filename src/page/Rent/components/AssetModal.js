// ✅ 신청유형 제거 및 외부 mode prop 사용

import React, { useState } from 'react';
import './AssetModal.css';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
import SlidePanel from './AssetSearchPanel';

export default function AssetFormModal({ isOpen, onClose, mode = 'rent' }) {
  const [formData, setFormData] = useState({
    assetType: '', itemName: '', asset: '', detailLocation: '', registrar: '', startDate: '', endDate: ''
  });
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const handleChangeDate = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssetSelect = (asset) => {
    setFormData({
      assetType: asset.assetType,
      itemName: asset.itemName,
      asset: asset.asset,
      detailLocation: asset.detailLocation,
      registrar: asset.registrar,
      startDate: '',
      endDate: ''
    });
    setIsSlideOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.asset) {
      alert('자산을 선택해주세요!');
      return;
    }
    alert(mode === 'rent' ? '대여 신청이 완료되었습니다.' : '반납 처리가 완료되었습니다.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-background">
      <div className="modal-content">
        <div className="modal-top">
          <h3>자산 {mode === 'rent' ? '대여 신청' : '반납 처리'}</h3>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="row"><span>신청자 :</span> <span>홍길동</span></div>
        <div className="row"><span>소속 :</span> <span>서울사무소 전산운영P</span></div>

        <div className="row">
          <span>자산찾기 :</span>
          <button className="icon-btn" onClick={() => setIsSlideOpen(true)}><FaSearch /></button>
        </div>

        <div className="row"><span>자산분류 :</span> <input value={formData.assetType} disabled /></div>
        <div className="row"><span>품목 :</span> <input value={formData.itemName} disabled /></div>
        <div className="row"><span>자산 :</span> <input value={formData.asset} disabled /></div>
        <div className="row"><span>자산 세부 위치 :</span> <input value={formData.detailLocation} disabled /></div>
        <div className="row"><span>자산등록자 :</span> <input value={formData.registrar} disabled /></div>

        {mode === 'rent' && (
          <div className="row">
            <span>대여기간 :</span>
            <div className="date-range">
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChangeDate} />
              <FaCalendarAlt className="calendar-icon" />
              <span style={{ minWidth: '20px', textAlign: 'center' }}>~</span>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChangeDate} />
              <FaCalendarAlt className="calendar-icon" />
            </div>
          </div>
        )}

        <button className="submit-btn" onClick={handleSubmit}>
          {mode === 'rent' ? '대여신청' : '반납처리'}
        </button>

        <SlidePanel isOpen={isSlideOpen} onClose={() => setIsSlideOpen(false)} onSelect={handleAssetSelect} mode={mode} />
      </div>
    </div>
  );
}
