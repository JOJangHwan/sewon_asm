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
  '전자제품': ['노트북','컴퓨터', '모니터']
};

const convertToGB = (value, unit) => {
  const num = parseFloat(value);
  switch (unit) {
    case 'TB': return num * 1024;
    case 'MB': return num / 1024;
    case 'GB': return num;
    default: return 0;
  }
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
    rentalDate: '',
    cpu: '',
    memory: '',
    gpu: '',
    storageList: [{ value: '', unit: 'GB' }],
    totalStorage: ''
  });

  const handleChange = (e, idx = null) => {
    const { name, value } = e.target;
    if (name === 'company') {
      setFormData({ ...formData, company: value, department: '', location: '' });
    } else if (name === 'department') {
      setFormData({ ...formData, department: value, location: '' });
    } else if (name === 'assetCategory') {
      setFormData({ ...formData, assetCategory: value, item: '' });
    } else if (name.startsWith('storage-') && idx !== null) {
      const updated = [...formData.storageList];
      const field = name.split('-')[1];
      updated[idx][field] = value;
      setFormData({ ...formData, storageList: updated });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addStorageField = () => {
    setFormData({
      ...formData,
      storageList: [...formData.storageList, { value: '', unit: 'GB' }]
    });
  };

  const handleStorageConvert = () => {
    const total = formData.storageList.reduce((sum, s) => {
      const value = s.value === '' ? 0 : s.value;
      return sum + convertToGB(value, s.unit);
    }, 0);
    setFormData({ ...formData, totalStorage: total.toFixed(2) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const appendSeconds = (datetime) => {
      if (!datetime) return '';
      return datetime.length === 16 ? datetime + ':00' : datetime;
    };
    
    const requiredFields = [
      'company', 'department', 'location', 'acquisitionType', 'assetCategory', 'item', 'manufacturer', 'model', 'acquisitionDate', 'acquisitionCost'
    ];
    
    for (let field of requiredFields) {
      if (!formData[field]) {
        alert(`필수 입력값이 누락되었습니다: ${field}`);
        return;
      }
    }
    if ((formData.item === '노트북' || formData.item === '컴퓨터') && !formData.totalStorage) {
      alert('총 저장공간을 계산해주세요.');
      return;
    }
    if (formData.assetStatus === '대여' && (!formData.renter || !formData.rentalDate)) {
      alert('대여 상태일 경우 대여자 및 대여일자를 입력해주세요.');
      return;


    }
    
 // ✅ 날짜에 초(:00) 붙여서 전송할 데이터 구성
 const formattedData = {
  ...formData,
  acquisitionDate: appendSeconds(formData.acquisitionDate),
  rentalDate: appendSeconds(formData.rentalDate),
};

console.log('✅ 변환된 날짜 확인:', formattedData.acquisitionDate);
console.log('Sending data:', JSON.stringify(formattedData));

        // 서버로 데이터 전송
        try {
          const response = await fetch('http://localhost:8080/api/asset/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // JSON 형식으로 데이터를 보냄
            },
            body: JSON.stringify(formData), // formData를 JSON으로 변환하여 전송
          });
    
          const data = await response.json();
          
          if (data === 1) { // 성공 시 1 반환
            alert('등록이 완료되었습니다!');
            console.log('등록 데이터:', formData);
          } else {
            alert('❌ 등록 실패: 서버에서 실패 처리');
          }
        } catch (error) {
          alert('🚨 서버와의 연결에 실패했습니다.');
          console.error('Error:', error);
        }
    
    // alert('등록이 완료되었습니다!');
    // console.log('등록 데이터:', formData);
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
        {(formData.item === '노트북' || formData.item === '컴퓨터') && (
          <>
            <div className="form-row">
              <label>CPU</label>
              <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>메모리</label>
              <input type="text" name="memory" value={formData.memory} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>그래픽카드</label>
              <input type="text" name="gpu" value={formData.gpu} onChange={handleChange} />
            </div>
            <div className="form-row">
  <label>데이터 변환기 (PC 저장공간만큼 추가하세요)</label>
  {formData.storageList.map((s, idx) => (
  <div key={idx} className="conversion-group">
    <input
      type="text"
      name={`storage-value`}
      value={s.value}
      onChange={(e) => handleChange({ target: { name: 'storage-value', value: e.target.value } }, idx)}
      placeholder="용량 입력"
    />
    <select
      name={`storage-unit`}
      value={s.unit}ㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷ
      onChange={(e) => handleChange({ target: { name: 'storage-unit', value: e.target.value } }, idx)}
    >
      <option value="GB">GB</option>
      <option value="TB">TB</option>
      <option value="MB">MB</option>
    </select>

    {idx === 0 && (
      <button type="button" className="add-btn" onClick={addStorageField}>➕</button>
    )}
    {formData.storageList.length > 1 && (
      <button
        type="button"
        className="remove-btn"
        onClick={() => {
          if (window.confirm('이 항목을 삭제하시겠습니까?')) {
            const newList = [...formData.storageList];
            newList.splice(idx, 1);
            setFormData({ ...formData, storageList: newList });
          }
        }}
      >➖</button>
    )}
  </div>
))}

  <button type="button" onClick={handleStorageConvert}>변환</button>
</div>
            <div className="form-row">
              <label>총 저장공간(GB기준)</label>
              <input type="text" name="totalStorage" value={formData.totalStorage} readOnly />
            </div>
          </>
        )}
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
          <input
  type="datetime-local"
  name="acquisitionDate"
  value={formData.acquisitionDate}
  onChange={handleChange}
/>
        </div>
        <div className="form-row">
          <label>취득가</label>
          <input type="text" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} />
        </div>
        <button type="submit" className="submit-button">등록</button>
        <button type="button" className="reset-button" onClick={() => window.location.reload()}>초기화</button>
</form>
    </div>
  );
};

export default AssetRegister;
