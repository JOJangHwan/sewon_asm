

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
    locationId: '',
    acquisitionType: '',
    assetCategory: '',
    item: '',
    parentTypeId: '',
    childTypeId: '',
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
   const [assetCategoryData, setAssetCategoryData] = useState({});   // 드롭다운 표시용
 const [parentTypeIdMap,   setParentTypeIdMap]   = useState({});   // {부모이름: id}
 const [childTypeIdMap,    setChildTypeIdMap]    = useState({});   // {부모이름: {자식이름: id}}
  const [locationIdMap, setLocationIdMap] = useState({});  
  useEffect(() => {
    //  console.log('✅ parentTypeIdMap state 업데이트:', parentTypeIdMap);
//  console.log('✅ childTypeIdMap  state 업데이트:', childTypeIdMap);
    const fetchCorporation = async () => {
      try {
        // const res = await authFetchWithRefresh('http://192.168.0.220:8888/corporations');
        const res = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const result = await res.json();
  
        if (result.code === 1 && result.data?.corporationList) {
           const nestedData = {};      // 화면용 {회사 > 부서 > [위치명]}
           const names = [];           // 회사명 배열
           const locMap = {};          // ⭐ ID 매핑 {회사 > 부서 > {위치명: id}}
  
           result.data.corporationList.forEach(corp => {
            const corpName = corp.name;

           if (!names.includes(corpName)) {
             names.push(corpName); // 중복 제거
           }
            nestedData[corpName] = {};
            locMap[corpName] = {};
            
            corp.affiliationList.forEach(aff => {
              const dept = aff.department;
                            nestedData[corpName][dept] = [];
                            locMap[corpName][dept] = {};      // ⭐ 부서 루트
              
                            aff.locations.forEach(loc => {
                              nestedData[corpName][dept].push(loc.location);          // 화면용
                              locMap[corpName][dept][loc.location] = loc.locationId;  // ⭐ ID 저장
                           });
            });
          });
  
          setCompanyData(nestedData);
          setCompanyList(names); // ✅ 회사명 리스트 저장
          setLocationIdMap(locMap);      
        } else {
          alert(result.message || '법인 정보 조회 실패');
        }
              // 자산 유형 계층 정보 가져오기
              // const typeRes = await authFetchWithRefresh('http://192.168.0.220:8888/asset-types/hierarchy');
              const typeRes = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
              const typeResult = await typeRes.json();
              
              if (typeResult.code === 1 && typeResult.data?.parentList) {
                const nestedAssetType = {};
                const parentMap        = {};
                const childMap         = {};
              //  console.log('자산 분류 데이터:', nestedAssetType);
                   typeResult.data.parentList.forEach(parent => {
                   //  console.log('🔍 서버에서 받은 parentList 원본:', typeResult.data.parentList);
 //console.log('🗺️ parentMap 만들고 나서:', parentMap);
// console.log('🗺️ childMap 만들고 나서 :', childMap);
// console.log('🗺️ nestedAssetType       :', nestedAssetType);
                       const parentName = parent.name;
                  
                       // id 가 없으면 건너뛴다 (중복 key 예방)
                        // 부모 ID  ➜  parentId 도 함께 검사
 const pId = parent.parentId ?? parent.id ?? parent.parentTypeId;
                       if (pId == null) return;
                  
                       parentMap[parentName] = pId;  
                  const children = Array.isArray(parent.childList) ? parent.childList : [];
                  // nestedAssetType[parentName] = children.map(child => child.name);
                       nestedAssetType[parentName] = [];
                     childMap[parentName]    = {};
                  
                       children.forEach(child => {
                           // 자식 ID  ➜  childId 도 함께 검사
                           const cId = child.childId ?? child.id ?? child.childTypeId;
                         if (cId == null) return;           // 역시 id 없는 항목 제거
                  
                         nestedAssetType[parentName].push(child.name);
                         childMap[parentName][child.name] = cId;      // ✅

   });
                });
                setAssetCategoryData(nestedAssetType);
                 setParentTypeIdMap(parentMap);
 setChildTypeIdMap(childMap);
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
      setFormData({ ...formData, company: value, department: '', location: '', locationId: '' });
    } else if (name === 'department') {
      setFormData({ ...formData, department: value, location: '', locationId: '' });
    } else if (name === 'location') {
      const id = locationIdMap[formData.company]?.[formData.department]?.[value] ?? '';
      setFormData({ ...formData, location: value, locationId: id });
    } else if (name === 'assetCategory') {
      // setFormData({ ...formData, assetCategory: value, item: '' });
         setFormData({
             ...formData,
             assetCategory: value,
             parentTypeId:  parentTypeIdMap[value] ?? '',
             item: '',
             childTypeId: '',
           });

    } else if (name.startsWith('storage')) {
      const list = [...formData.storageList];
      if (idx !== null) {
        if (name === 'storage-value') list[idx].value = value;
        else if (name === 'storage-unit') list[idx].unit = value;
        setFormData({ ...formData, storageList: list });
      }
        } else if (name === 'item') {
            // ① 품목 전용 처리
            setFormData(prev => ({
              ...prev,
              item: value,
              childTypeId: childTypeIdMap[prev.assetCategory]?.[value] ?? '',
            }));
            
          } else {
            // ② 그 밖의 일반 텍스트/숫자 input
            setFormData(prev => ({ ...prev, [name]: value }));
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
  
    // ✅ 필수 항목 검사
    const requiredFields = [
      { key: 'company', label: '회사구분' },
      { key: 'department', label: '부서구분' },
      { key: 'location', label: '세부위치' },      // locationId ➔ location 으로
      { key: 'acquisitionType', label: '취득구분' },
      { key: 'assetCategory', label: '자산분류' }, // parentTypeId ➔ assetCategory
      { key: 'item', label: '품목' },              // childTypeId ➔ item
      { key: 'manufacturer', label: '제조사' },
      { key: 'model', label: '모델' },
      { key: 'acquisitionDate', label: '취득일자' },
      { key: 'acquisitionCost', label: '취득가' }
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field.key] || formData[field.key] === '') {
        newErrors[field.key] = `${field.label}을(를) 입력해주세요.`;
      }
    });
    
    
  // 노트북/컴퓨터일 때 저장공간 체크
  const isElectronic = ['노트북', '컴퓨터'].includes(formData.item);

  if (isElectronic) {
    const hasInput = formData.storageList.some(s => s.value.trim() !== '');
  
    if (hasInput) {
      // 입력이 있을 때만 변환 여부 검사
      const convertedTotal = formData.storageList.reduce(
        (sum, s) => sum + convertToGB(s.value, s.unit),
        0
      ).toFixed(2);
  
      if (!formData.totalStorage || Number(convertedTotal) !== Number(formData.totalStorage)) {
        newErrors.totalStorage = '총 저장공간을 변환 버튼으로 계산해주세요.';
      }
    }
  }
  
  
  
    
    // 에러 있을 때 알림 한 번만
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('❗ 필수 항목을 모두 입력해주세요.');
      return;
    }
  
    // ✅ 노트북/컴퓨터일 때만 총 저장공간 검사
    // const isElectronic = ['노트북', '컴퓨터'].includes(formData.item);
    // if (isElectronic) {
    //   if (!formData.totalStorage) {
    //     newErrors.totalStorage = '총 저장공간을 계산해주세요.';
    //   }
    // }
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) errorElement.focus();
  
      alert(Object.values(newErrors).join('\n'));
      return;
    }
  
    // ✅ 서버 전송용 데이터 구성
    const statusMap = { '사용': 0, '미사용': 1 };
    const divisionMap = { '구매자산': 0, '이관자산': 1 };
  
    const url = isElectronic
      ? `${API_BASE}/assets/electronic`
      : `${API_BASE}/assets`;
  
    const dataToSend = isElectronic ? {
      locationId: Number(formData.locationId),
      division: divisionMap[formData.acquisitionType],
      corporation: formData.company,
      parentTypeId: Number(formData.parentTypeId),
      childTypeId: Number(formData.childTypeId),
      status: statusMap[formData.assetStatus],
      manufacturer: formData.manufacturer,
      model: formData.model,
      acquisitionDate: toDateTimeWithSeconds(formData.acquisitionDate),
      acquisitionPrice: Number(formData.acquisitionCost),
      cpu: formData.cpu,
      gpu: formData.gpu,
      ram: Number(formData.memory),
      storage: Number(formData.totalStorage),
    } : {
      locationId: Number(formData.locationId),
      division: divisionMap[formData.acquisitionType],
      parentTypeId: Number(formData.parentTypeId),
      childTypeId: Number(formData.childTypeId),
      status: statusMap[formData.assetStatus],
      manufacturer: formData.manufacturer,
      model: formData.model,
      acquisitionDate: toDateTimeWithSeconds(formData.acquisitionDate),
      acquisitionPrice: Number(formData.acquisitionCost),
    };
  
    // ✅ 서버 요청
    try {
      const res = await authFetchWithRefresh(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      } else {
        alert(`❌ 등록 실패: ${result.message || '서버 오류'}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ 등록 실패: 네트워크 또는 서버 오류');
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
  {errors.location && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.location}</div>)}

</div>

        {/* 취득구분 */}
        <div className="form-row">
          <label>취득구분</label>
          <select name="acquisitionType" value={formData.acquisitionType} onChange={handleChange}>
            <option value="">선택</option>
            <option value="구매자산">구매자산</option>
            <option value="이관자산">이관자산</option>
          </select>
          {errors.acquisitionType && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionType}</div>)}
        </div>
{/* 자산분류 */}
<div className="form-row">
  <label>자산분류</label>
  <select
  name="assetCategory"
 value={formData.parentTypeId}
  onChange={(e) => {
    const selectedId = e.target.value;
    const parsedId = Number(selectedId);
    const selectedName = Object.keys(parentTypeIdMap).find(name => parentTypeIdMap[name] == selectedId);
   // console.log('🔸 자산분류 선택 → id:', selectedId, 'name:', selectedName);
    setFormData({
      ...formData,
     assetCategory: selectedName,
     //parentTypeId: selectedId,
     parentTypeId: parsedId,
      item: '',
      childTypeId: '',
    });
  }}
>
  <option value="">선택</option>
   {Object.entries(parentTypeIdMap).map(([name, id]) => (
   <option key={`${id}-${name}`} value={id}>{name}</option>
  ))}
</select>
{errors.assetCategory && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.assetCategory}</div>)}

</div>

{/* 품목 */}
<div className="form-row">
  <label>품목</label>
  <select
  name="item"
 value={formData.childTypeId}
  onChange={(e) => {
    const selectedId = e.target.value;
    const parsedId = Number(selectedId);
    const selectedName = Object.keys(childTypeIdMap[formData.assetCategory] || {})
      .find(name => childTypeIdMap[formData.assetCategory][name] == selectedId);
   //   console.log('🔹 품목 선택 → id:', selectedId, 'name:', selectedName);
    setFormData({
      ...formData,
     item: selectedName,
    //  childTypeId: selectedId,
    childTypeId: parsedId,
    });
    
  }}
  disabled={!formData.assetCategory}
>
  <option value="">선택</option>
  
 {Object.entries(childTypeIdMap[formData.assetCategory] || {}).map(([name, id]) => (
     <option key={`${id}-${name}`} value={id}>{name}</option>
    ))
  }
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
              <label>그래픽 카드</label>
              <input type="text" name="gpu" value={formData.gpu} onChange={handleChange} />
              {errors.gpu && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.gpu}</div>)}
            </div>
            <div className="form-row">
              <label>데이터 변환기 (PC 저장공간)</label>
               {formData.storageList.map((s, idx) => (
   <div key={`${idx}-${s.unit}-${s.value}`} className="conversion-group">
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