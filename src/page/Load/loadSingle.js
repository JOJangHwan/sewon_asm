
import '../../utils/lang/i18n';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './loadsingle.css';
import { createRoot } from 'react-dom/client';
import LabelPrint from '../MyInfor/LabelPrint';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh'
import useMediaQuery from '../../utils/hooks/useMediaQuery';

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

// 라벨은 AssetRegister_* 키로 직접 가져옴
const makeLabels = (t) => ({
  select: {
    company:         t('AssetRegister_CompanyType'),
    department:      t('AssetRegister_DepartmentType'),
    location:        t('AssetRegister_DetailLocation'),
    acquisitionType: t('AssetRegister_AcquisitionType'),
    assetCategory:   t('AssetRegister_AssetCategory'),
    item:            t('AssetRegister_Item'),
    assetStatus:     t('AssetRegister_AssetStatus'),
  },
  input: {
    manufacturer:    t('AssetRegister_Manufacturer'),
    model:           t('AssetRegister_Model'),
    acquisitionDate: t('AssetRegister_AcquisitionDate'),
    acquisitionCost: t('AssetRegister_AcquisitionCost'),
    cpu:             t('AssetRegister_CPU'),
    memory:          t('AssetRegister_Memory'),
    gpu:             t('AssetRegister_GraphicsCard'),
    totalStorage:    t('AssetRegister_TotalStorageGB').replace('(GB)','').trim(),
  }
});

const getErrorMsg = (t, labels, name) => {
  if (labels.select[name]) return labels.select[name] + t('AssetRegister_PleaseEnter');
  if (labels.input[name])  return labels.input[name]  + t('AssetRegister_PleaseEnter');
  if (name === 'totalStorage') return t('AssetRegister_CalcTotalStorageWithConvert');
  return '';
};

// ✅ handleSubmit 함수 위쪽에 위치해야 함
// ✅ 기존 openLabelPrintWindow 를 이걸로 통째로 교체
const openLabelPrintWindow = (asset) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return alert('팝업 차단을 해제해주세요.');

  const { company, department, location, barcode } = asset;
  const fullLocation = [company, department, location].filter(Boolean).join(' ');
  const categoryLine = [asset.assetCategory, asset.itemName].filter(Boolean).join(' ');

  // 🔧 필요시 미세 보정값 (오른쪽 +, 왼쪽 -, 위쪽 - , 아래쪽 +)
  const H_SHIFT_MM = 0.8;   // ← 오른쪽으로 0.8mm 이동 (왼쪽으로 치우쳤을 때)
  const V_SHIFT_MM = -0.6;  // ← 위로 0.6mm 이동   (아래로 치우쳤을 때)

  printWindow.document.write(`
    <html>
      <head>
        <title>라벨 인쇄</title>
        <style>
          /* === Label (40 x 15 mm) === */
          @page { size: 40mm 15mm; margin: 0; }
          @media print { body { margin: 0; } }
          html, body {
            width: 40mm; height: 15mm; margin: 0; padding: 0;
            font-family: Arial, sans-serif;
          }

          .label-print-wrapper {
            display: flex; width: 40mm; height: 15mm; margin: 0; padding: 0;
          }

          .label-box {
            width: 40mm; height: 15mm;
            display: flex; flex-direction: row;
            /* ✅ 가로/세로 모두 가운데 정렬 */
            justify-content: center;
            align-items: center;

            /* ✅ 좌측 패딩 제거(왼쪽 치우침 원인) + 요소 간격 */
            padding: 0;
            gap: 2mm;

            box-sizing: border-box;
            page-break-after: always;

            /* ✅ 물리종이 오프셋 보정(필요 없으면 0mm/0mm) */
            transform: translate(${H_SHIFT_MM}mm, ${V_SHIFT_MM}mm);

            transform: translate(+3.0mm, -0.6mm); /* +는 오른쪽, -는 위쪽 */
          }

          .qr-section {
            width: 12mm; height: 12mm;
            display: flex; justify-content: center; align-items: center;
          }
          /* QR은 canvas든 img든 10mm로 고정 */
          .qr-section > canvas,
          .qr-section > img,
          .qr-section > * {
            width: 10mm !important;
            height: 10mm !important;
          }

          .info-section {
            display: flex; flex-direction: column; justify-content: center;
            align-items: flex-start;
            /* ✅ 텍스트와 QR 사이 간격은 gap으로 처리, 여기 패딩은 0 */
            padding: 0;
            flex: 1;
          }

          .text-line {
            font-size: 2.0mm; line-height: 2.35mm;
            margin: 0; padding: 0; white-space: nowrap; color: #000;
          }

          /* 2열: 바코드(좌정렬, 볼드) */
          .barcode-text {
            font-size: 2.4mm; line-height: 2.35mm; font-weight: 700;
            text-align: left; align-self: flex-start;
            margin: 0.2mm 0 0.1mm;
          }

          /* 3열: 자산분류 + 품목 (공백만, 길면 말줄임) */
          .category-line {
            font-size: 2.0mm; line-height: 2.2mm;
            max-width: 25.5mm;  /* 40 - 12(QR) - 2(gap) 대략 */
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
      </head>
      <body
        onload="
          /* 해상도만 담당(크기X). 90px이면 10mm에 충분히 선명 */
          QRCode.toCanvas(
            document.getElementById('qr-canvas'),
            '${String(barcode || '')}',
            { width: 90, margin: 0 }
          );
          window.print();
          setTimeout(()=>window.close(), 300);
        "
      >
        <div class="label-print-wrapper">
          <div class="label-box">
            <div class="qr-section">
              <canvas id="qr-canvas"></canvas>
            </div>
            <div class="info-section">
              <p class="text-line">${fullLocation}</p>
              <p class="text-line barcode-text">${barcode}</p>
              <p class="text-line category-line">${categoryLine}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
};



const AssetRegister = () => {
  const { t } = useTranslation('loadSingle');
  const labels = makeLabels(t);
  const optionSelect = t('AssetRegister_Select'); // "선택"
// 화면 크기에 따라 web/pda 클래스 분리
const isMobile = useMediaQuery('(max-width: 768px)');
const modeClass = isMobile ? 'pda-mode' : 'web-mode';
  
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
      alert(t('AssetRegister_RegisterFail_ServerError'));
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
      { key: 'company',         label: labels.select.company },
      { key: 'department',      label: labels.select.department },
      { key: 'location',        label: labels.select.location },
      { key: 'acquisitionType', label: labels.select.acquisitionType },
      { key: 'assetCategory',   label: labels.select.assetCategory },
      { key: 'item',            label: labels.select.item },
      { key: 'manufacturer',    label: labels.input.manufacturer },
      { key: 'model',           label: labels.input.model },
      { key: 'acquisitionDate', label: labels.input.acquisitionDate },
      { key: 'acquisitionCost', label: labels.input.acquisitionCost },
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field.key] || formData[field.key] === '') {
        newErrors[field.key] = t('error.input', { field: field.label });
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
        newErrors.totalStorage = t('AssetRegister_CalcTotalStorageWithConvert');
      }
    }
  }
  
  
  
    
    // 에러 있을 때 알림 한 번만
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert(t('AssetRegister_FillRequiredFields'));
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
       alert(t('AssetRegister_RegisterSuccessBarcode') + barcodeValue);
  
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
        alert((t('AssetRegister_RegisterFail_ServerError')) + (result.message ? ' ' + result.message : ''));
      }
    } catch (err) {
      console.error(err);
       alert(t('AssetRegister_RegisterFail_NetworkOrServer'));
    }
  };
  


  
  
  

  return (
    <div className={`asset-register-page ${modeClass}`}>
      <h2 className="asset-register-title">{t('AssetRegister_Title')}</h2>
      <form className="asset-register-form" onSubmit={handleSubmit}>
        {/* 회사구분 */}
        <div className="form-row">
          <label>{labels.select.company}</label>
          <select name="company" value={formData.company} onChange={handleChange}>
<option value="">{optionSelect}</option>
  {companyList.map((corp) => (
    <option key={corp} value={corp}>{corp}</option>
  ))}
</select>
          {errors.company && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.company}</div>)}
        </div>
{/* 부서구분 */}
<div className="form-row">
<label>{labels.select.department}</label>
  <select
    name="department"
    value={formData.department}
    onChange={handleChange}
    disabled={!formData.company}
  >
<option value="">{optionSelect}</option>
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
<label>{labels.select.location}</label>
{/* <option value="">{optionSelect}</option> */}
  <select
    name="location"
    value={formData.location}
    onChange={handleChange}
    disabled={!formData.company || !formData.department}
  >
<option value="">{optionSelect}</option>
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
          <label>{labels.select.acquisitionType}</label>
          <select name="acquisitionType" value={formData.acquisitionType} onChange={handleChange}>
  <option value="">{optionSelect}</option>
  <option value="구매자산">{t('AssetRegister_PurchasedAsset')}</option>
  <option value="이관자산">{t('AssetRegister_TransferredAsset')}</option>
          </select>
          {errors.acquisitionType && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionType}</div>)}
        </div>
{/* 자산분류 */}
<div className="form-row">
  <label>{labels.select.assetCategory}</label>
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
 <option value="">{optionSelect}</option>
   {Object.entries(parentTypeIdMap).map(([name, id]) => (
   <option key={`${id}-${name}`} value={id}>{name}</option>
  ))}
</select>
{errors.assetCategory && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.assetCategory}</div>)}

</div>

{/* 품목 */}
<div className="form-row">
<label>{labels.select.item}</label>
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
<option value="">{optionSelect}</option>
  
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
              <label>{labels.input.cpu}</label>
              <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} />
              {errors.cpu && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.cpu}</div>)}
            </div>
            <div className="form-row">
              <label>{labels.input.memory}</label>
              <input type="text" name="memory" value={formData.memory} onChange={handleChange} />
              {errors.memory && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.memory}</div>)}
            </div>
            <div className="form-row">
              <label>{labels.input.gpu}</label>
              <input type="text" name="gpu" value={formData.gpu} onChange={handleChange} />
              {errors.gpu && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.gpu}</div>)}
            </div>
            <div className="form-row">
              <label>{t('AssetRegister_DataConverter_PCStorage')}</label>
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
              <button type="button" onClick={handleStorageConvert}>{t('AssetRegister_Convert')}</button>
              {errors.totalStorage && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.totalStorage}</div>)}
            </div>
            <div className="form-row">
              <label>{t('AssetRegister_TotalStorageGB')}</label>
              <input type="text" name="totalStorage" value={formData.totalStorage} readOnly />
            </div>
          </>
        )}
        {/* 자산상태 */}
        <div className="form-row">
          <label>{labels.select.assetStatus}</label>
          <div className="radio-group">
              {[t('AssetRegister_InUse'), t('AssetRegister_NotInUse')].map((st, i) => {
     const raw = i === 0 ? '사용' : '미사용'; // 서버로 보내는 값은 원문 유지
     return (
              <label key={st}>
                <input type="radio" name="assetStatus" value={raw}
                checked={formData.assetStatus === raw}
                onChange={(e)=> setFormData(prev=>({...prev, assetStatus: e.target.value}))} />
                {st}
              </label>
            )})}
          </div>
        </div>
        {/* 제조사 */}
        <div className="form-row">
          <label>{labels.input.manufacturer}</label>
          <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
          {errors.manufacturer && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.manufacturer}</div>)}
        </div>
        {/* 모델 */}
        <div className="form-row">
          <label>{labels.input.model}</label>
          <input type="text" name="model" value={formData.model} onChange={handleChange} />
          {errors.model && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.model}</div>)}
        </div>
        {/* 취득일자 */}
        <div className="form-row">
          <label>{labels.input.acquisitionDate}</label>
          <input type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleChange} />
          {errors.acquisitionDate && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionDate}</div>)}
        </div>
        {/* 취득가 */}
        <div className="form-row">
          <label>{labels.input.acquisitionCost}</label>
          <input type="number" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} />
          {errors.acquisitionCost && (<div style={{ color: 'red', fontSize: '12px' }}>{errors.acquisitionCost}</div>)}
        </div>
        {/* 버튼 영역 */}
  <button type="submit" className="submit-button">{t('AssetRegister_Submit')}</button>
  <button type="button" className="reset-button" onClick={() => window.location.reload()}>{t('AssetRegister_Reset')}</button>
      </form>
    </div>
  );
};

export default AssetRegister;