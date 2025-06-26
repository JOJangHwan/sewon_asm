

import React, { useState, useEffect } from 'react';
import './loadsingle.css';
import { createRoot } from 'react-dom/client';
import LabelPrint from '../MyInfor/LabelPrint';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh'

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

const convertToGB = (value, unit) => {
  const num = parseFloat(value) || 0;
  switch (unit) {
    case 'TB': return num * 1024;
    case 'MB': return num / 1024;
    case 'GB': return num;
    default: return 0;
  }
};
 // 입력값(YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm)을 받아
 // 항상 YYYY-MM-DDTHH:mm:ss 형태로 돌려준다.
 const toDateTimeWithSeconds = (val) => {
   if (!val) return '';
   // date 타입이면 길이 10, datetime-local이면 16
   if (val.length === 10) return `${val}T00:00:00`;
   if (val.length === 16) return `${val}:00`;
   return val; // 이미 초까지 있으면 그대로
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

// ✅ handleSubmit 함수 위쪽에 위치해야 함
const openLabelPrintWindow = (asset) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('팝업 차단을 해제해주세요.');
    return;
  }

  const { company, department, location, barcode, itemName } = asset;
  const fullLocation = `${company} ${department} ${location}`;
  const logoUrl = 'http://localhost:3000/logo.png';

  printWindow.document.write(`
    <html>
      <head>
        <title>라벨 인쇄</title>
        <style>
          @page { size: 40mm 15mm; margin: 0; }
          html, body {
            width: 40mm;
            height: 15mm;
            margin: 0;
            padding: 0;
          }
  
          .label-print-wrapper {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0;
            margin: 0;
            width: 40mm;
            height: 15mm;
          }
  
          .label-box {
            width: 40mm;
            height: 15mm;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            box-sizing: border-box;
          }
  
          .qr-section {
            width: 11mm;
            height: 11mm;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-left: 1mm;
          }
  
          .qr-canvas {
            width: 10.5mm !important;
            height: 10.5mm !important;
          }
  
          .info-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-left: 1mm;
          }
  
          .logo-wrapper {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 0.5mm;
          }
  
          .logo {
            max-width: 24mm;
            height: 4mm;
            object-fit: contain;
          }
  
          .text-line {
            font-size: 1.8mm;
            font-family: 'Arial', sans-serif;
            line-height: 2.2mm;
            margin: 0;
            padding: 0;
            white-space: nowrap;
            color: black;
          }
  
          .barcode-text {
            font-size: 2.2mm;
            font-weight: bold;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
      </head>
      <body onload="QRCode.toCanvas(document.getElementById('qr-canvas'), '${barcode}', { width: 100, margin: 0 }); window.print(); setTimeout(() => window.close(), 300);">
        <div class="label-print-wrapper">
          <div class="label-box">
            <div class="qr-section">
              <canvas id="qr-canvas" class="qr-canvas"></canvas>
            </div>
            <div class="info-section">
              <div class="logo-wrapper">
                <img src="${logoUrl}" class="logo" />
              </div>
              <p class="text-line">${fullLocation}</p>
              <p class="text-line barcode-text">${barcode}</p>
              <p class="text-line">${itemName}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  

  printWindow.document.close();
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
  const [companyList, setCompanyList] = useState([]);
  const [companyMap, setCompanyMap] = useState({}); // ✅ 여기에 추가
  const [companyData, setCompanyData] = useState({});
  const [assetCategoryData, setAssetCategoryData] = useState({});
  useEffect(() => {
    const fetchCorporation = async () => {
      try {
        // const res = await authFetchWithRefresh('http://192.168.0.220:8888/corporations');
        const res = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const result = await res.json();
  
        if (result.code === 1 && result.data?.corporationList) {
          const nestedData = {};
          const names = [];
  
          result.data.corporationList.forEach(corp => {
            const corpName = corp.name;
            names.push(corpName); // 회사명 수집
            nestedData[corpName] = {};
            corp.affiliationList.forEach(aff => {
              nestedData[corpName][aff.department] =
                aff.locations.map(loc => loc.location);
            });
          });
  
          setCompanyData(nestedData);
          setCompanyList(names); // ✅ 회사명 리스트 저장
        } else {
          alert(result.message || '법인 정보 조회 실패');
        }
              // 자산 유형 계층 정보 가져오기
              // const typeRes = await authFetchWithRefresh('http://192.168.0.220:8888/asset-types/hierarchy');
              const typeRes = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
              const typeResult = await typeRes.json();
              
              if (typeResult.code === 1 && typeResult.data?.parentList) {
                const nestedAssetType = {};
                console.log('자산 분류 데이터:', nestedAssetType);
                typeResult.data.parentList.forEach(parent => {
                  const parentName = parent.name;
                  const children = Array.isArray(parent.childList) ? parent.childList : [];
                  nestedAssetType[parentName] = children.map(child => child.name);
                });
                setAssetCategoryData(nestedAssetType);
              } else {
                alert(typeResult.message || '자산 유형 정보 조회 실패');
              }





    } catch (err) {
      console.error('초기 데이터 조회 실패:', err);
      alert('초기 데이터를 불러오지 못했습니다.');
    }
  };
  
    fetchCorporation();
  }, []);
  
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
  
    //const appendSeconds = (dt) => (dt && dt.length === 16 ? dt + ':00' : dt);
    const statusMap = { '사용': 0, '미사용': 1 };
    const divisionMap = {
      '구매자산(자산)': 0,
      '대여자산(비품)': 1
    };
    
  const formatted = {
  ...formData,
  division: divisionMap[formData.acquisitionType],
   acquisitionDate: toDateTimeWithSeconds(formData.acquisitionDate),
   rentalDate: toDateTimeWithSeconds(formData.rentalDate),
  assetStatus: statusMap[formData.assetStatus],
};

  
    const isElectronic = ['노트북', '컴퓨터'].includes(formData.item);

  //   const url = isElectronic
  // ? 'http://192.168.0.220:8888/assets/electronic'
  // : 'http://192.168.0.220:8888/assets';
  const url = isElectronic
  ? `${API_BASE}/assets/electronic`
  : `${API_BASE}/assets`;


  const dataToSend = isElectronic ? {
    corporation: formData.company,
    department: formData.department,
    location: formData.location,
    division: 0,
    parentType: formData.assetCategory,
    childType: formData.item,
    status: formData.assetStatus === '사용' ? 0 : 1,
    manufacturer: formData.manufacturer,
    model: formData.model,
    acquisitionDate: toDateTimeWithSeconds(formData.acquisitionDate),
    acquisitionPrice: Number(formData.acquisitionCost),
    cpu: formData.cpu,
    gpu: formData.gpu,
    ram: Number(formData.memory),
    storage: Number(formData.totalStorage),
  } : {
    corporation: formData.company,
    department: formData.department,
    location: formData.location,
    division: 0,
    parentType: formData.assetCategory,
    childType: formData.item,
    status: formData.assetStatus === '사용' ? 0 : 1,
    manufacturer: formData.manufacturer,
    model: formData.model,
    acquisitionDate: toDateTimeWithSeconds(formData.acquisitionDate),
    acquisitionPrice: Number(formData.acquisitionCost),
  };

  
  try {
    const res = await authFetchWithRefresh(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    const result = await res.json();

    if (result.code === 1) {
      const barcodeValue = result.data;
      alert(`✅ 등록 완료! 바코드: ${barcodeValue}`);

      const asset = {
        barcode: barcodeValue,
        company: formData.company,
        department: formData.department,
        location: formData.location,
        acquisitionType: formData.acquisitionType,
        assetCategory: formData.assetCategory,
        itemName: formData.item,
        assetStatus: formData.assetStatus,
        manufacturer: formData.manufacturer,
        model: formData.model,
        acquisitionDate: toDateTimeWithSeconds(formData.acquisitionDate),
        acquisitionPrice: Number(formData.acquisitionCost).toLocaleString(),
      };

      openLabelPrintWindow(asset);
      window.location.reload();
      
       // ✅ 인쇄창 생성 및 React 라벨 출력

       
      
  
      //openLabelPrintWindow([asset]);

      window.location.reload();
    } else {
      alert(`❌ 등록 실패: ${result.message || '서버 오류'}`);
    }
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
  {companyList.map((corp) => (
    <option key={corp} value={corp}>{corp}</option>
  ))}
</select>
          {errors.company && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.company}</div>)}
        </div>
{/* 부서구분 */}
<div className="form-row">
  <label>부서구분</label>
  <select
    name="department"
    value={formData.department}
    onChange={handleChange}
    disabled={!formData.company}
  >
    <option value="">선택</option>
    {formData.company &&
      Object.keys(companyData[formData.company] || {}).map((dept) => (
        <option key={dept} value={dept}>
          {dept}
        </option>
      ))}
  </select>
  {errors.department && (
    <div style={{ color: 'red', fontSize: '12px' }}>{errors.department}</div>
  )}
</div>

{/* 세부위치 */}
<div className="form-row">
  <label>세부위치</label>
  <select
    name="location"
    value={formData.location}
    onChange={handleChange}
    disabled={!formData.company || !formData.department}
  >
    <option value="">선택</option>
    {formData.company &&
      formData.department &&
      companyData[formData.company]?.[formData.department]?.map((loc) => (
        <option key={loc} value={loc}>
          {loc}
        </option>
      ))}
  </select>
  {errors.location && (
    <div style={{ color: 'red', fontSize: '12px' }}>{errors.location}</div>
  )}
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
  <select
    name="assetCategory"
    value={formData.assetCategory}
    onChange={handleChange}
  >
    <option value="">선택</option>
    {Object.keys(assetCategoryData).map(parent => (
      <option key={parent} value={parent}>{parent}</option>
    ))}
  </select>
  {errors.assetCategory && (
    <div style={{ color: 'red', fontSize: '12px' }}>{errors.assetCategory}</div>
  )}
</div>

{/* 품목 */}
<div className="form-row">
  <label>품목</label>
  <select
    name="item"
    value={formData.item}
    onChange={handleChange}
    disabled={!formData.assetCategory}
  >
    <option value="">선택</option>
    {
      assetCategoryData[formData.assetCategory]?.map((child) => (
        <option key={child} value={child}>{child}</option>
      ))
    }
  </select>
  {errors.item && (
    <div style={{ color: 'red', fontSize: '12px' }}>{errors.item}</div>
  )}
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
          <input type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} />
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