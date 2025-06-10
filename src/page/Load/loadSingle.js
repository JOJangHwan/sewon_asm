// import React, { useState } from 'react';
// import './loadsingle.css';

// const companyData = {
//   '평택공장': {
//     '전산운영P': ['전산실', '서버실'],
//     '관리팀': ['총무실', '회의실']
//   },
//   '우신비나': {
//     '자재팀': ['자재창고', '입출고구역'],
//     '생산팀': ['라인1', '라인2']
//   }
// };

// const assetCategoryData = {
//   '가구': ['책상', '의자'],
//   '전자제품': ['노트북','컴퓨터', '모니터']
// };

// const convertToGB = (value, unit) => {
//   const num = parseFloat(value);
//   switch (unit) {
//     case 'TB': return num * 1024;
//     case 'MB': return num / 1024;
//     case 'GB': return num;
//     default: return 0;
//   }
// };

// const AssetRegister = () => {
//   const [formData, setFormData] = useState({
//     company: '',
//     department: '',
//     location: '',
//     acquisitionType: '',
//     assetCategory: '',
//     item: '',
//     assetStatus: '사용',
//     manufacturer: '',
//     model: '',
//     acquisitionDate: '',
//     acquisitionCost: '',
//     renter: '',
//     rentalDate: '',
//     cpu: '',
//     memory: '',
//     gpu: '',
//     storageList: [{ value: '', unit: 'GB' }],
//     totalStorage: ''
//   });

//   const handleChange = (e, idx = null) => {
//     const { name, value } = e.target;
//     if (name === 'company') {
//       setFormData({ ...formData, company: value, department: '', location: '' });
//     } else if (name === 'department') {
//       setFormData({ ...formData, department: value, location: '' });
//     } else if (name === 'assetCategory') {
//       setFormData({ ...formData, assetCategory: value, item: '' });
//     } else if (name.startsWith('storage-') && idx !== null) {
//       const updated = [...formData.storageList];
//       const field = name.split('-')[1];
//       updated[idx][field] = value;
//       setFormData({ ...formData, storageList: updated });
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   const addStorageField = () => {
//     setFormData({
//       ...formData,
//       storageList: [...formData.storageList, { value: '', unit: 'GB' }]
//     });
//   };

//   const handleStorageConvert = () => {
//     const total = formData.storageList.reduce((sum, s) => {
//       const value = s.value === '' ? 0 : s.value;
//       return sum + convertToGB(value, s.unit);
//     }, 0);
//     setFormData({ ...formData, totalStorage: total.toFixed(2) });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const appendSeconds = (datetime) => {
//       if (!datetime) return '';
//       return datetime.length === 16 ? datetime + ':00' : datetime;
//     };
    
//     const requiredFields = [
//       'company', 'department', 'location', 'acquisitionType', 'assetCategory', 'item', 'manufacturer', 'model', 'acquisitionDate', 'acquisitionCost'
//     ];
    
//     for (let field of requiredFields) {
//       if (!formData[field]) {
//         alert(`필수 입력값이 누락되었습니다: ${field}`);
//         return;
//       }
//     }
//     if ((formData.item === '노트북' || formData.item === '컴퓨터') && !formData.totalStorage) {
//       alert('총 저장공간을 계산해주세요.');
//       return;
//     }


//     const statusMap = {
//       '사용': 0,
//       '미사용': 1,
//     };
    
//  // ✅ 날짜에 초(:00) 붙여서 전송할 데이터 구성
//  const formattedData = {
//   ...formData,
//   acquisitionDate: appendSeconds(formData.acquisitionDate),
//   rentalDate: appendSeconds(formData.rentalDate),
//   assetStatus: statusMap[formData.assetStatus] // ✅ 숫자로 변환
// };
// const { storageList, ...dataToSend } = formattedData;
// console.log('✅ 변환된 날짜 확인:', formattedData.acquisitionDate);
// console.log('Sending data:', JSON.stringify(formattedData));
// console.log('📦 최종 전송 데이터:', dataToSend); // 서버로 보낼 데이터 확인


//         // 서버로 데이터 전송
//         try {
//           const response = await fetch('http://localhost:8080/api/asset/register', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(dataToSend), // ✅ 여기만 바뀜!
//           });
        
//           const data = await response.json();
        
//           if (data === 1) {
//             alert('등록이 완료되었습니다!');
//           } else {
//             alert('❌ 등록 실패: 서버에서 실패 처리');
//           }
//         } catch (error) {
//           alert('🚨 서버와의 연결에 실패했습니다.');
//           console.error('Error:', error);
//         }
    
//     // alert('등록이 완료되었습니다!');
//     // console.log('등록 데이터:', formData);
//   };

//   return (
//     <div className="asset-register-page">
//       <h2 className="asset-register-title">개별 자산 등록</h2>
//       <form className="asset-register-form" onSubmit={handleSubmit}>
//         <div className="form-row">
//           <label>회사구분</label>
//           <select name="company" value={formData.company} onChange={handleChange}>
//             <option value="">선택</option>
//             {Object.keys(companyData).map(c => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </div>
//         <div className="form-row">
//           <label>부서구분</label>
//           <select name="department" value={formData.department} onChange={handleChange}>
//             <option value="">선택</option>
//             {formData.company &&
//               Object.keys(companyData[formData.company]).map(d => (
//                 <option key={d} value={d}>{d}</option>
//               ))}
//           </select>
//         </div>
//         <div className="form-row">
//           <label>세부위치</label>
//           <select name="location" value={formData.location} onChange={handleChange}>
//             <option value="">선택</option>
//             {formData.company && formData.department &&
//               companyData[formData.company][formData.department].map(l => (
//                 <option key={l} value={l}>{l}</option>
//               ))}
//           </select>
//         </div>
//         <div className="form-row">
//           <label>취득구분</label>
//           <select name="acquisitionType" value={formData.acquisitionType} onChange={handleChange}>
//             <option value="">선택</option>
//             <option value="구매자산(자산)">구매자산(자산)</option>
//           </select>
//         </div>
//         <div className="form-row">
//           <label>자산분류</label>
//           <select name="assetCategory" value={formData.assetCategory} onChange={handleChange}>
//             <option value="">선택</option>
//             {Object.keys(assetCategoryData).map(cat => (
//               <option key={cat} value={cat}>{cat}</option>
//             ))}
//           </select>
//         </div>
//         <div className="form-row">
//           <label>품목</label>
//           <select name="item" value={formData.item} onChange={handleChange}>
//             <option value="">선택</option>
//             {formData.assetCategory &&
//               assetCategoryData[formData.assetCategory].map(item => (
//                 <option key={item} value={item}>{item}</option>
//               ))}
//           </select>
//         </div>
//         {(formData.item === '노트북' || formData.item === '컴퓨터') && (
//           <>
//             <div className="form-row">
//               <label>CPU</label>
//               <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} />
//             </div>
//             <div className="form-row">
//               <label>메모리</label>
//               <input type="text" name="memory" value={formData.memory} onChange={handleChange} />
//             </div>
//             <div className="form-row">
//               <label>그래픽카드</label>
//               <input type="text" name="gpu" value={formData.gpu} onChange={handleChange} />
//             </div>
//             <div className="form-row">
//   <label>데이터 변환기 (PC 저장공간만큼 추가하세요)</label>
//   {formData.storageList.map((s, idx) => (
//   <div key={idx} className="conversion-group">
//     <input
//       type="text"
//       name={`storage-value`}
//       value={s.value}
//       onChange={(e) => handleChange({ target: { name: 'storage-value', value: e.target.value } }, idx)}
//       placeholder="용량 입력"
//     />
//     <select
//       name={`storage-unit`}
//       value={s.unit}
//       onChange={(e) => handleChange({ target: { name: 'storage-unit', value: e.target.value } }, idx)}
//     >
//       <option value="GB">GB</option>
//       <option value="TB">TB</option>
//       <option value="MB">MB</option>
//     </select>

//     {idx === 0 && (
//       <button type="button" className="add-btn" onClick={addStorageField}>➕</button>
//     )}
//     {formData.storageList.length > 1 && (
//       <button
//         type="button"
//         className="remove-btn"
//         onClick={() => {
//           if (window.confirm('이 항목을 삭제하시겠습니까?')) {
//             const newList = [...formData.storageList];
//             newList.splice(idx, 1);
//             setFormData({ ...formData, storageList: newList });
//           }
//         }}
//       >➖</button>
//     )}
//   </div>
// ))}

//   <button type="button" onClick={handleStorageConvert}>변환</button>
// </div>
//             <div className="form-row">
//               <label>총 저장공간(GB기준)</label>
//               <input type="text" name="totalStorage" value={formData.totalStorage} readOnly />
//             </div>
//           </>
//         )}
//         <div className="form-row">
//           <label>자산상태</label>
//           <div className="radio-group">
//           {['사용', '미사용'].map(status => ( // ✅ '대여' 제거
//               <label key={status}>
//               <input type="radio" name="assetStatus" value={status} checked={formData.assetStatus === status} onChange={handleChange} />
//               {status}
//             </label>
//             ))}
//           </div>
//         </div>
//         <div className="form-row">
//           <label>제조사</label>
//           <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
//         </div>
//         <div className="form-row">
//           <label>모델</label>
//           <input type="text" name="model" value={formData.model} onChange={handleChange} />
//         </div>
//         <div className="form-row">
//           <label>취득일자</label>
//           <input
//   type="datetime-local"
//   name="acquisitionDate"
//   value={formData.acquisitionDate}
//   onChange={handleChange}
// />
//         </div>
//         <div className="form-row">
//           <label>취득가</label>
//           <input type="text" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} />
//         </div>
//         <button type="submit" className="submit-button">등록</button>
//         <button type="button" className="reset-button" onClick={() => window.location.reload()}>초기화</button>
// </form>
//     </div>
//   );
// };

// export default AssetRegister;

import React, { useState } from 'react';
import './loadsingle.css';

const companyData = {
  '평택공장': {
    '전산운영P': ['전산실', '서버실'],
    '관리팀': ['총무실', '회의실'],
  },
  '우신비나': {
    '자재팀': ['자재창고', '입출고구역'],
    '생산팀': ['라인1', '라인2'],
  },
};

const assetCategoryData = {
  '가구': ['책상', '의자'],
  '전자제품': ['노트북', '컴퓨터', '모니터'],
};

const convertToGB = (value, unit) => {
  const num = parseFloat(value) || 0;
  switch (unit) {
    case 'TB': return num * 1024;
    case 'MB': return num / 1024;
    case 'GB': return num;
    default: return 0;
  }
};

const selectFieldLabels = {
  company: '회사구분',
  department: '부서구분',
  location: '세부위치',
  acquisitionType: '취득구분',
  assetCategory: '자산분류',
  item: '품목',
  assetStatus: '자산상태',
};
const inputFieldLabels = {
  manufacturer: '제조사',
  model: '모델',
  acquisitionDate: '취득일자',
  acquisitionCost: '취득가',
  cpu: 'CPU',
  memory: '메모리',
  gpu: 'GPU',
  totalStorage: '총 저장공간',
};

const getErrorMsg = (name) => {
  if (selectFieldLabels[name]) return `${selectFieldLabels[name]}을 선택해주세요.`;
  if (inputFieldLabels[name]) return `${inputFieldLabels[name]}를 입력해주세요.`;
  if (name === 'totalStorage') return '총 저장공간을 계산해주세요.';
  return '';
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
    totalStorage: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e, idx = null) => {
    const { name, value } = e.target;
    if (errors[name]) {
      const updated = { ...errors };
      delete updated[name];
      setErrors(updated);
    }
    if (name === 'company') {
      setFormData({ ...formData, company: value, department: '', location: '' });
    } else if (name === 'department') {
      setFormData({ ...formData, department: value, location: '' });
    } else if (name === 'assetCategory') {
      setFormData({ ...formData, assetCategory: value, item: '' });
    } else if (name.startsWith('storage')) {
      const list = [...formData.storageList];
      if (idx !== null) {
        if (name === 'storage-value') list[idx].value = value;
        else if (name === 'storage-unit') list[idx].unit = value;
        setFormData({ ...formData, storageList: list });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addStorageField = () => {
    setFormData({
      ...formData,
      storageList: [...formData.storageList, { value: '', unit: 'GB' }],
    });
  };

  const handleStorageConvert = () => {
    const total = formData.storageList.reduce(
      (sum, s) => sum + convertToGB(s.value, s.unit),
      0
    );
    setFormData({ ...formData, totalStorage: total.toFixed(2) });
    if (errors.totalStorage) {
      const updated = { ...errors };
      delete updated.totalStorage;
      setErrors(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const required = [
      'company', 'department', 'location', 'acquisitionType',
      'assetCategory', 'item', 'manufacturer', 'model',
      'acquisitionDate', 'acquisitionCost'
    ];

    required.forEach((field) => {
      if (!formData[field]) newErrors[field] = getErrorMsg(field);
    });

    if (formData.item === '노트북' || formData.item === '컴퓨터') {
      ['cpu', 'memory', 'gpu'].forEach((f) => {
        if (!formData[f]) newErrors[f] = getErrorMsg(f);
      });
      if (!formData.totalStorage) {
        newErrors.totalStorage = getErrorMsg('totalStorage');
      }
    }

    if (Object.keys(newErrors).length) {
      alert('빈칸을 모두 입력해주세요.');
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const appendSeconds = (dt) => (dt && dt.length === 16 ? dt + ':00' : dt);
    const statusMap = { '사용': 0, '미사용': 1 };
    const formatted = {
      ...formData,
      acquisitionDate: appendSeconds(formData.acquisitionDate),
      rentalDate: appendSeconds(formData.rentalDate),
      assetStatus: statusMap[formData.assetStatus],
    };
    const { storageList, ...dataToSend } = formatted;

    try {
      const res = await fetch('http://localhost:8080/api/asset/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const result = await res.json();
      if (result === 1) alert('등록이 완료되었습니다!');
      else alert('❌ 등록 실패');
    } catch (err) {
      alert('🚨 서버 연결 실패');
      console.error(err);
    }
  };

  return (
    <div className="asset-register-page">
      <h2 className="asset-register-title">개별 자산 등록</h2>
      <form className="asset-register-form" onSubmit={handleSubmit}>
        {/* 회사구분 */}
        <div className="form-row">
          <label>회사구분</label>
          <select name="company" value={formData.company} onChange={handleChange}>
            <option value="">선택</option>
            {Object.keys(companyData).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.company && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.company}</div>)}
        </div>
        {/* 부서구분 */}
        <div className="form-row">
          <label>부서구분</label>
          <select name="department" value={formData.department} onChange={handleChange}>
            <option value="">선택</option>
            {formData.company && Object.keys(companyData[formData.company]).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.department && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.department}</div>)}
        </div>
        {/* 세부위치 */}
        <div className="form-row">
          <label>세부위치</label>
          <select name="location" value={formData.location} onChange={handleChange}>
            <option value="">선택</option>
            {formData.company && formData.department && companyData[formData.company][formData.department].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.location && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.location}</div>)}
        </div>
        {/* 취득구분 */}
        <div className="form-row">
          <label>취득구분</label>
          <select name="acquisitionType" value={formData.acquisitionType} onChange={handleChange}>
            <option value="">선택</option>
            <option value="구매자산(자산)">구매자산(자산)</option>
          </select>
          {errors.acquisitionType && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionType}</div>)}
        </div>
        {/* 자산분류 */}
        <div className="form-row">
          <label>자산분류</label>
          <select name="assetCategory" value={formData.assetCategory} onChange={handleChange}>
            <option value="">선택</option>
            {Object.keys(assetCategoryData).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.assetCategory && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.assetCategory}</div>)}
        </div>
        {/* 품목 */}
        <div className="form-row">
          <label>품목</label>
          <select name="item" value={formData.item} onChange={handleChange}>
            <option value="">선택</option>
            {formData.assetCategory && assetCategoryData[formData.assetCategory].map((it) => (
              <option key={it} value={it}>{it}</option>
            ))}
          </select>
          {errors.item && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.item}</div>)}
        </div>
        {/* 노트북/컴퓨터일 때 PC스펙 입력 */}
        {(formData.item === '노트북' || formData.item === '컴퓨터') && (
          <>
            <div className="form-row">
              <label>CPU</label>
              <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} />
              {errors.cpu && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.cpu}</div>)}
            </div>
            <div className="form-row">
              <label>메모리</label>
              <input type="text" name="memory" value={formData.memory} onChange={handleChange} />
              {errors.memory && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.memory}</div>)}
            </div>
            <div className="form-row">
              <label>GPU</label>
              <input type="text" name="gpu" value={formData.gpu} onChange={handleChange} />
              {errors.gpu && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.gpu}</div>)}
            </div>
            <div className="form-row">
              <label>데이터 변환기 (PC 저장공간)</label>
              {formData.storageList.map((s, idx) => (
                <div key={idx} className="conversion-group">
                  <input type="text" name="storage-value" value={s.value} placeholder="용량" onChange={(e) => handleChange(e, idx)} />
                  <select name="storage-unit" value={s.unit} onChange={(e) => handleChange(e, idx)}>
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                    <option value="MB">MB</option>
                  </select>
                  {idx === 0 && <button type="button" className="add-btn" onClick={addStorageField}>➕</button>}
                  {formData.storageList.length > 1 && <button type="button" className="remove-btn" onClick={() => {
                    if (window.confirm('삭제할까요?')) {
                      const list = [...formData.storageList];
                      list.splice(idx, 1);
                      setFormData({ ...formData, storageList: list });
                    }
                  }}>➖</button>}
                </div>
              ))}
              <button type="button" onClick={handleStorageConvert}>변환</button>
              {errors.totalStorage && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.totalStorage}</div>)}
            </div>
            <div className="form-row">
              <label>총 저장공간(GB)</label>
              <input type="text" name="totalStorage" value={formData.totalStorage} readOnly />
            </div>
          </>
        )}
        {/* 자산상태 */}
        <div className="form-row">
          <label>자산상태</label>
          <div className="radio-group">
            {['사용', '미사용'].map((st) => (
              <label key={st}>
                <input type="radio" name="assetStatus" value={st} checked={formData.assetStatus === st} onChange={handleChange} />
                {st}
              </label>
            ))}
          </div>
        </div>
        {/* 제조사 */}
        <div className="form-row">
          <label>제조사</label>
          <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
          {errors.manufacturer && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.manufacturer}</div>)}
        </div>
        {/* 모델 */}
        <div className="form-row">
          <label>모델</label>
          <input type="text" name="model" value={formData.model} onChange={handleChange} />
          {errors.model && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.model}</div>)}
        </div>
        {/* 취득일자 */}
        <div className="form-row">
          <label>취득일자</label>
          <input type="datetime-local" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} />
          {errors.acquisitionDate && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionDate}</div>)}
        </div>
        {/* 취득가 */}
        <div className="form-row">
          <label>취득가</label>
          <input type="number" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} />
          {errors.acquisitionCost && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionCost}</div>)}
        </div>
        {/* 버튼 영역 */}
        <button type="submit" className="submit-button">등록</button>
        <button type="button" className="reset-button" onClick={() => window.location.reload()}>초기화</button>
      </form>
    </div>
  );
};

export default AssetRegister;
