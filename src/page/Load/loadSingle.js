import React, { useState } from 'react';
import './loadsingle.css';

const companyData = {
  '평택공장': {
    '전산운영P': ['전산실', '서버실'],
    '관리팀': ['총무실', '회의실']
  },
  '우신비나': {
    '자재팀': ['자재창고', '입출고구역'],
    '생산팀': ['라인1', '라인2']
  }
};

const assetCategoryData = {
  '가구': ['책상', '의자'],
  '전자제품': ['노트북', '모니터']
};

const AssetRegister = () => {
  const [formData, setFormData] = useState({
    company: '',
    department: '',
    location: '',
    acquisitionType: '',
    assetCategory: '',
    item: '',
    assetStatus: '사용',
    manufacturer: '',
    model: '',
    acquisitionDate: '',
    acquisitionCost: '',
    renter: '',
    rentalDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company') {
      setFormData({ ...formData, company: value, department: '', location: '' });
    } else if (name === 'department') {
      setFormData({ ...formData, department: value, location: '' });
    } else if (name === 'assetCategory') {
      setFormData({ ...formData, assetCategory: value, item: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('등록 데이터:', formData);
  };

  return (
    <div className="asset-register-page">
      <h2 className="asset-register-title">개별 자산 등록</h2>
      <form className="asset-register-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>회사구분</label>
          <select name="company" value={formData.company} onChange={handleChange}>
            <option value="">선택</option>
            {Object.keys(companyData).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>부서구분</label>
          <select name="department" value={formData.department} onChange={handleChange}>
            <option value="">선택</option>
            {formData.company &&
              Object.keys(companyData[formData.company]).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
          </select>
        </div>
        <div className="form-row">
          <label>세부위치</label>
          <select name="location" value={formData.location} onChange={handleChange}>
            <option value="">선택</option>
            {formData.company && formData.department &&
              companyData[formData.company][formData.department].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
          </select>
        </div>
        <div className="form-row">
          <label>취득구분</label>
          <select name="acquisitionType" value={formData.acquisitionType} onChange={handleChange}>
            <option value="">선택</option>
            <option value="구매자산(자산)">구매자산(자산)</option>
          </select>
        </div>
        <div className="form-row">
          <label>자산분류</label>
          <select name="assetCategory" value={formData.assetCategory} onChange={handleChange}>
            <option value="">선택</option>
            {Object.keys(assetCategoryData).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>품목</label>
          <select name="item" value={formData.item} onChange={handleChange}>
            <option value="">선택</option>
            {formData.assetCategory &&
              assetCategoryData[formData.assetCategory].map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
          </select>
        </div>
        <div className="form-row">
          <label>자산상태</label>
          <div className="radio-group">
            {['사용', '미사용', '대여'].map(status => (
              <label key={status}>
                <input type="radio" name="assetStatus" value={status} checked={formData.assetStatus === status} onChange={handleChange} />
                {status}
              </label>
            ))}
          </div>
        </div>
        {formData.assetStatus === '대여' && (
          <>
            <div className="form-row">
              <label>대여자</label>
              <input type="text" name="renter" value={formData.renter} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>대여일자</label>
              <input type="date" name="rentalDate" value={formData.rentalDate} onChange={handleChange} />
            </div>
          </>
        )}
        <div className="form-row">
          <label>제조사</label>
          <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>모델</label>
          <input type="text" name="model" value={formData.model} onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>취득일자</label>
          <input type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>취득가</label>
          <input type="text" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} />
        </div>
        <button type="submit" className="submit-button">등록</button>
      </form>
    </div>
  );
};

export default AssetRegister;
