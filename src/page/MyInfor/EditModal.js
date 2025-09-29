import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import { v4 as uuidv4 } from 'uuid'; // 상단에 추가
import './editModal.css';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

 const convertToGB = (value, unit) => {
     const num = parseFloat(value) || 0;
     switch (unit) {
       case 'TB': return num * 1024;
       case 'MB': return num / 1024;
       case 'GB': return num;
       default  : return 0;
     }
   };



const EditModal = ({ item, onSave, onClose }) => {
    // ✅ 훅은 컴포넌트 안에서!
  const { t } = useTranslation('EditModal');
  const langUI = getUILang();        // 'KR' | 'CN' | 'VN'
  const langI18n = uiToI18n(langUI); // 'ko' | 'zh' | 'vi'
  // 드롭다운 옵션(라벨 i18n)
  const acquisitionTypeOptions = [
    { value: 0, label: t('EditModal_PurchasedAsset') },
    { value: 1, label: t('EditModal_OnLoanAsset') },
  ];
  const assetStatusOptions = [
    { value: 0, label: t('EditModal_InUse') },
    { value: 1, label: t('EditModal_NotInUse') },
  ];
  // console.log('[EditModal 진입] item:', item);
  /* ────────────────────────────────────
     드롭다운 옵션(state)
  ‑────────────────────────────────────*/
  const [companies,   setCompanies]   = useState([]);   // corporationList
  const [departments, setDepartments] = useState([]);   // affiliationList of 선택 회사
  const [locations,   setLocations]   = useState([]);   // locations of 선택 부서

  const [parents,     setParents]   = useState([]);     // parentList (자산 분류)
  const [children,    setChildren]  = useState([]);     // childList of 선택 parent

  /* ────────────────────────────────────
     선택 값(state)
  ‑────────────────────────────────────*/
  const [edited, setEdited] = useState({
    ...item,
    acquisitionType: item.acquisitionType !== undefined && item.acquisitionType !== null
      ? String(item.acquisitionType)
      : '',
    assetStatus: item.assetStatus !== undefined && item.assetStatus !== null
      ? String(item.assetStatus)
      : '',
      storageList: item.storageList?.map(s => ({ ...s, id: uuidv4() })) || [{ id: uuidv4(), value: '', unit: 'GB' }],
      totalStorage: item.storage || item.totalStorage || '',
      cpu         : item.cpu   || '',
 memory      : item.ram   || item.memory || '',
 gpu         : item.gpu   || '',
 storage     : item.storage || item.totalStorage || '',
  });

  const [company,    setCompany]    = useState(item.company);
  const [department, setDepartment] = useState(item.department);
  const [location,   setLocation]   = useState(item.location);
  const [locationId, setLocationId] = useState(item.locationId);

  const [parent, setParent] = useState(item.assetCategory);
  const [child,  setChild]  = useState(item.itemName);

  const onStorageChange = (id, field, val) => {
    setEdited(prev => {
      const list = prev.storageList.map(s =>
        s.id === id ? { ...s, [field]: val } : s
      );
      return { ...prev, storageList: list };
    });
  };
// 삭제 보류!
  // const convertToGB = (value, unit) => {
  //   const num = parseFloat(value) || 0;
  //   switch (unit) {
  //     case 'TB': return num * 1024;
  //     case 'MB': return num / 1024;
  //     case 'GB': return num;
  //     default  : return 0;
  //   }
  // };

  const handleStorageConvert = () => {
    const total = edited.storageList.reduce(
      (sum, s) => sum + convertToGB(s.value, s.unit),
      0
    );
    setEdited(prev => ({ ...prev, totalStorage: total.toFixed(2) }));
  };

  /* ────────────────────────────────────
     초기 API 로딩
  ‑────────────────────────────────────*/
  useEffect(() => {
    (async () => {
      try {
        const corpRes = await authFetchWithRefresh(`${API_BASE}/corporations`, {
          headers: { 'Accept-Language': langI18n, language: langUI },
        });
        const corpJson = await corpRes.json();
        if (corpJson.code === 1) setCompanies(corpJson.data.corporationList);

        const typeRes = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`, {
          headers: { 'Accept-Language': langI18n, language: langUI },
        });
        const typeJson = await typeRes.json();
        if (typeJson.code === 1) setParents(typeJson.data.parentList);
      } catch (e) {
        console.error('lookup 로딩 오류', e);
      }
    })();
  }, []);

  /* ────────────────────────────────────
     회사 ➜ 부서 갱신
  ‑────────────────────────────────────*/
  useEffect(() => {
    const corp = companies.find(c => c.name === company);
    setDepartments(corp?.affiliationList || []);
  }, [company, companies]);

  /* ────────────────────────────────────
     부서 ➜ 세부위치 갱신
  ‑────────────────────────────────────*/
  useEffect(() => {
    const aff = departments.find(a => a.department === department);
    setLocations(aff?.locations || []);
  }, [department, departments]);
    /* ───────────────────────────────
     🔄 세부위치 ID 초기 매핑
     (location·locations 가 준비되면
      locationId 와 edited.locationId 동기화)
  ───────────────────────────────*/
  useEffect(() => {
    if (!location || locations.length === 0) return;

    const found = locations.find(loc => loc.location === location);
    if (found) {
      setLocationId(found.locationId);                 // state
      setEdited(prev => ({ ...prev, locationId: found.locationId })); // payload용
    }
  }, [locations, location]);

  /* ────────────────────────────────────
     자산분류 ➜ 품목 갱신
  ‑────────────────────────────────────*/
  useEffect(() => {
    const p = parents.find(p => p.name === parent);
    setChildren(p?.childList || []);
  }, [parent, parents]);

  /* ────────────────────────────────────
     공통 입력 핸들러
  ‑────────────────────────────────────*/
  const onBasicChange = e => {
    const { name, value } = e.target;
    setEdited(prev => ({ ...prev, [name]: value }));
  };

  /* ─ company / department / location 체인드 */
  const changeCompany = e => {
    const v = e.target.value;
    setCompany(v); setDepartment(''); setLocation(''); setLocationId('');
    setEdited(prev => ({ ...prev, company: v, department: '', location: '', locationId: '' }));
  };

  const changeDepartment = e => {
    const v = e.target.value;
    setDepartment(v); setLocation(''); setLocationId('');
    setEdited(prev => ({ ...prev, department: v, location: '', locationId: '' }));
  };

  const changeLocation = e => {
    const v = e.target.value;
    setLocation(v);
    const locObj = locations.find(l => l.location === v);
    setLocationId(locObj?.locationId);
    setEdited(prev => ({ ...prev, location: v, locationId: locObj?.locationId }));
  };

  /* ─ parent / child 체인드 */
  const changeParent = e => {
    const v = e.target.value;
    setParent(v); setChild('');
    setEdited(prev => ({ ...prev, assetCategory: v, itemName: '' }));
  };

  const changeChild = e => {
    const v = e.target.value;
    setChild(v);
    setEdited(prev => ({ ...prev, itemName: v }));
  };

  const toISOStringWithSeconds = (val) => {
    if (!val) return null;
  
    // date 타입이면 길이 10, datetime-local이면 16
    if (val.length === 10) return `${val}T00:00:00`;
    if (val.length === 16) return `${val}:00`;
  
    // 이미 초까지 있으면 그대로
    return val;
  };

  /* ────────────────────────────────────
     저장
  ‑────────────────────────────────────*/
  const handleSave = async () => {
      const barcode = edited.barcode;

         const parentObj = parents.find(p => p.name === parent);
   const childObj  = children.find(c => c.name === child);
   const parentTypeId = parentObj?.parentId ?? null;
   const childTypeId  = childObj?.childId ?? null;

   const isElectronic = ['노트북', '컴퓨터'].includes(child);

       const payload = {
          locationId,
          division: edited.acquisitionType === '' ? null : Number(edited.acquisitionType),
          parentTypeId,
          childTypeId,
          status: edited.assetStatus === '' ? null : Number(edited.assetStatus),
          manufacturer: edited.manufacturer,
          model: edited.model,
          acquisitionDate: toISOStringWithSeconds(edited.acquisitionDate),
          acquisitionPrice: Number(edited.acquisitionPrice ?? 0),
        };
    
        if (isElectronic) {
          payload.cpu = edited.cpu;
          payload.gpu = edited.gpu;
          payload.ram = Number(edited.memory || 0);
          payload.storage = Number(edited.totalStorage || 0);
        }
    //  console.log('🔍 parentTypeId:', parentTypeId, 'childTypeId:', childTypeId);
     //console.log('🔼 수정 요청 payload:', {
    //     barcode,
    //    ...payload,
    //  });
      try {
            const endpoint = isElectronic
              ? `${API_BASE}/assets/electronic?barcode=${encodeURIComponent(barcode)}`
              : `${API_BASE}/assets?barcode=${encodeURIComponent(barcode)}`;
        
            const res = await authFetchWithRefresh(endpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Accept-Language': langI18n,
                language: langUI,
              },
              body: JSON.stringify(payload),
            });
        const json = await res.json();
        if (json.code === 1) {
          alert('✅ ' + t('EditModal_AssetInfoUpdated'));
         // console.log('[EditModal] onSave 호출:', edited);
          onSave(edited); // 부모에게 전달
        } else {
          alert(`❌ ${t('EditModal_EditFailed')}: ${json.message || t('EditModal_UnknownError')}`);
        }
      } catch (err) {
        alert(`🚨 ${t('EditModal_ServerError')}: ${err.message}`);
        console.error(err);
      }
    };

  /* ────────────────────────────────────
     렌더링
  ‑────────────────────────────────────*/
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{t('EditModal_Title')}</h2>

        {/* 바코드 – 변경 불가 */}
        <label>{t('EditModal_Barcode')}</label>
        <input value={edited.barcode} readOnly />

        {/* 회사 */}
        <label>{t('EditModal_CompanyType')}</label>
        <select value={company} onChange={changeCompany}>
          <option value="">{t('EditModal_Select')}</option>
          {companies.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* 부서 */}
        <label>{t('EditModal_DepartmentType')}</label>
        <select value={department} onChange={changeDepartment} disabled={!company}>
          <option value="">{t('EditModal_Select')}</option>
          {departments.map(a => (
            <option key={a.affiliationId} value={a.department}>{a.department}</option>
          ))}
        </select>

        {/* 세부위치 */}
        <label>{t('EditModal_DetailLocation')}</label>
        <select value={location} onChange={changeLocation} disabled={!department}>
          <option value="">{t('EditModal_Select')}</option>
          {locations.map(l => (
            <option key={l.locationId} value={l.location}>{l.location}</option>
          ))}
        </select>

         {/* 취득구분 */}
 <label>{t('EditModal_AcquisitionType')}</label>
 <select
   name="acquisitionType"          // ✅ 올바른 name
   value={String(edited.acquisitionType)}
   onChange={onBasicChange}
 >
   <option value="">{t('EditModal_Select')}</option>
   {acquisitionTypeOptions.map(opt => (
     <option key={`acq-${opt.value}`} value={opt.value}>{opt.label}</option>
   ))}
 </select>
        {/* 자산분류 */}
        <label>{t('EditModal_AssetCategory')}</label>
        <select value={parent} onChange={changeParent}>
          <option value="">{t('EditModal_Select')}</option>
          {parents.map(p => (
  <option key={p.parentId} value={p.name}>{p.name}</option>
))}
        </select>

        {/* 품목 */}
        <label>{t('EditModal_Item')}</label>
        <select value={child} onChange={changeChild} disabled={!parent}>
          <option value="">{t('EditModal_Select')}</option>
          {children.map(c => (
  <option key={c.childId} value={c.name}>{c.name}</option>
))}
        </select>
        {/* ── 노트북·컴퓨터일 때 PC 스펙 ───────────────────── */}
{/* ── 노트북·컴퓨터일 때 PC 스펙 ───────────────────── */}
{['노트북', '컴퓨터'].includes(child) && (
  <>
    {/* 기존 CPU / 메모리 / GPU ... */}

    {/* 저장공간(다중) 입력 */}
     {['노트북', '컴퓨터'].includes(child) && (
   <>
     <label>{t('EditModal_CPU')}</label>
     <input name="cpu" value={edited.cpu} onChange={onBasicChange} />

     <label>{t('EditModal_Memory')}</label>
     <input name="memory" value={edited.memory} onChange={onBasicChange} />

     <label>{t('EditModal_GPU')}</label>
     <input name="gpu" value={edited.gpu} onChange={onBasicChange} />

     <label>{t('EditModal_DataConverter_PCStorage')}</label>
     {edited.storageList.map((s, idx) => (
      <div key={s.id} className="conversion-group">
<input
  type="text"
  placeholder={t('EditModal_Capacity')}
  value={s.value}
  onChange={(e) => onStorageChange(s.id, 'value', e.target.value)}
/>
<select
  value={s.unit}
  onChange={(e) => onStorageChange(s.id, 'unit', e.target.value)}
>
          <option value="GB">{t('EditModal_GB')}</option>
          <option value="TB">{t('EditModal_TB')}</option>
          <option value="MB">{t('EditModal_MB')}</option>
         </select>
         {idx === 0 && (
           <button type="button" className="add-btn" onClick={() =>
             setEdited(prev => ({
               ...prev,
               storageList: [...prev.storageList, { id: uuidv4(), value: '', unit: 'GB' }],
             }))
           }>➕</button>
         )}
         {edited.storageList.length > 1 && (
        <button type="button" className="add-btn" onClick={() =>
             setEdited(prev => {
               const list = [...prev.storageList];
               list.splice(idx, 1);
               return { ...prev, storageList: list };
             })
           }>➖</button>
         )}
       </div>
     ))}
     <button type="button" onClick={handleStorageConvert}>{t('EditModal_Convert')}</button>

     <label>{t('EditModal_TotalStorageGB')}</label>
     <input name="totalStorage" value={edited.totalStorage} readOnly />
   </>
 )}
  </>
)}



<label>{t('EditModal_AssetStatus')}</label>
<select
  name="assetStatus"
  value={edited.assetStatus}
  onChange={onBasicChange}
>
  <option value="">{t('EditModal_Select')}</option>
    {assetStatusOptions.map(opt => (
   <option key={`status-${opt.value}`} value={opt.value}>{opt.label}</option>
  ))}
</select>

        {/* 제조사 · 모델 */}
        <label>{t('EditModal_Manufacturer')}</label>
        <input name="manufacturer" value={edited.manufacturer} onChange={onBasicChange} />

        <label>{t('EditModal_Model')}</label>
        <input name="model" value={edited.model} onChange={onBasicChange} />

        {/* 취득일 · 취득가 */}
        <label>{t('EditModal_AcquisitionDate')}</label>
        <input name="acquisitionDate" value={edited.acquisitionDate} onChange={onBasicChange} />

        <label>{t('EditModal_AcquisitionCost')}</label>
        <input name="acquisitionPrice" value={edited.acquisitionPrice} onChange={onBasicChange} />

        {/* 버튼 */}
        <div className="modal-button-group">
          <button onClick={handleSave}>{t('EditModal_EditCompleted')}</button>
          <button onClick={onClose}>{t('EditModal_Cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
