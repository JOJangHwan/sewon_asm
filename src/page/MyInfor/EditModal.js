// // src/page/MyInfor/EditModal.js
// import React, { useState, useEffect } from 'react';
// import { authFetchWithRefresh }  from '../../utils/authFetchWithRefresh';
// import './editModal.css';

// const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

// // 대분류 소분류 연결
// const companyOptions = {
//   '평택공장': ['전산운영팀', '경영기획팀', '생산팀'],
//   '우신에너지': ['경영관리팀', '자재관리팀', '구매팀'],
// };

// const categoryOptions = {
//   'IT자산': ['노트북', '모니터', '서버'],
//   '사무자산': ['책상', '의자', '캐비닛'],
// };

// const statusOptions = ['사용', '대기', '수리중', '폐기'];

// const EditModal = ({ item, onSave, onClose }) => {
  
//   const [editedItem, setEditedItem] = useState(item);

//   const [selectedCompany, setSelectedCompany] = useState(item.company || '');
//   const [selectedDepartment, setSelectedDepartment] = useState(item.department || '');

//   const [selectedCategory, setSelectedCategory] = useState(item.assetCategory || '');
//   const [selectedItemName, setSelectedItemName] = useState(item.itemName || '');

//   useEffect(() => {
//     if (selectedCompany && !companyOptions[selectedCompany]?.includes(selectedDepartment)) {
//       setSelectedDepartment('');
//     }
//     if (selectedCategory && !categoryOptions[selectedCategory]?.includes(selectedItemName)) {
//       setSelectedItemName('');
//     }
//   }, [selectedCompany, selectedCategory]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setEditedItem({ ...editedItem, [name]: value });
//   };

//   const handleCompanyChange = (e) => {
//     const newCompany = e.target.value;
//     setSelectedCompany(newCompany);
//     setSelectedDepartment('');
//     setEditedItem({ ...editedItem, company: newCompany, department: '' });
//   };

//   const handleDepartmentChange = (e) => {
//     const newDepartment = e.target.value;
//     setSelectedDepartment(newDepartment);
//     setEditedItem({ ...editedItem, department: newDepartment });
//   };

//   const handleCategoryChange = (e) => {
//     const newCategory = e.target.value;
//     setSelectedCategory(newCategory);
//     setSelectedItemName('');
//     setEditedItem({ ...editedItem, assetCategory: newCategory, itemName: '' });
//   };

//   const handleItemNameChange = (e) => {
//     const newItemName = e.target.value;
//     setSelectedItemName(newItemName);
//     setEditedItem({ ...editedItem, itemName: newItemName });
//   };

//   const handleSave = () => {
//     onSave(editedItem);
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-content">
//         <h2>자산 수정</h2>

//         <label>바코드</label>
//         <input name="barcode" value={editedItem.barcode} onChange={handleChange} />

//         <label>회사구분</label>
//         <select name="company" value={selectedCompany} onChange={handleCompanyChange}>
//           <option value="">선택</option>
//           {Object.keys(companyOptions).map(company => (
//             <option key={company} value={company}>{company}</option>
//           ))}
//         </select>

//         <label>부서구분</label>
//         <select name="department" value={selectedDepartment} onChange={handleDepartmentChange} disabled={!selectedCompany}>
//           <option value="">선택</option>
//           {companyOptions[selectedCompany]?.map(dept => (
//             <option key={dept} value={dept}>{dept}</option>
//           ))}
//         </select>

//         <label>세부위치</label>
//         <input name="location" value={editedItem.location} onChange={handleChange} />

//         <label>취득구분</label>
//         <input name="acquisitionType" value={editedItem.acquisitionType} onChange={handleChange} />

//         <label>자산분류</label>
//         <select name="assetCategory" value={selectedCategory} onChange={handleCategoryChange}>
//           <option value="">선택</option>
//           {Object.keys(categoryOptions).map(cat => (
//             <option key={cat} value={cat}>{cat}</option>
//           ))}
//         </select>

//         <label>품목</label>
//         <select name="itemName" value={selectedItemName} onChange={handleItemNameChange} disabled={!selectedCategory}>
//           <option value="">선택</option>
//           {categoryOptions[selectedCategory]?.map(item => (
//             <option key={item} value={item}>{item}</option>
//           ))}
//         </select>

//         <label>자산상태</label>
//         <select name="assetStatus" value={editedItem.assetStatus} onChange={handleChange}>
//           <option value="">선택</option>
//           {statusOptions.map(status => (
//             <option key={status} value={status}>{status}</option>
//           ))}
//         </select>

//         <label>제조사</label>
//         <input name="manufacturer" value={editedItem.manufacturer} onChange={handleChange} />

//         <label>모델</label>
//         <input name="model" value={editedItem.model} onChange={handleChange} />

//         <label>취득일자</label>
//         <input name="acquisitionDate" value={editedItem.acquisitionDate} onChange={handleChange} />

//         <label>취득가</label>
//         <input name="acquisitionPrice" value={editedItem.acquisitionPrice} onChange={handleChange} />

//         <div className="modal-button-group">
//           <button onClick={handleSave}>수정 완료</button>
//           <button onClick={onClose}>취소</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditModal;

// src/page/MyInfor/EditModal.js
// 완성본 – 2025‑06‑28
// * 바코드 읽기 전용
// * 회사/부서/세부위치 · 자산분류/품목 – API 로드
// * POST /assets/update?barcode=… 로 수정

import React, { useState, useEffect } from 'react';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import './editModal.css';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

const acquisitionTypeOptions = [
   { value: 0, label: '구매자산' },
   { value: 1, label: '대여자산' },
  ]
  
  const assetStatusOptions = [
     { value: 0, label: '사용' },
     { value: 1, label: '미사용' },
  ];

const EditModal = ({ item, onSave, onClose }) => {
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
  });

  const [company,    setCompany]    = useState(item.company);
  const [department, setDepartment] = useState(item.department);
  const [location,   setLocation]   = useState(item.location);
  const [locationId, setLocationId] = useState(item.locationId);

  const [parent, setParent] = useState(item.assetCategory);
  const [child,  setChild]  = useState(item.itemName);

  /* ────────────────────────────────────
     초기 API 로딩
  ‑────────────────────────────────────*/
  useEffect(() => {
    (async () => {
      try {
        const corpRes = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const corpJson = await corpRes.json();
        if (corpJson.code === 1) setCompanies(corpJson.data.corporationList);

        const typeRes = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
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
      const payload = {
        locationId: locationId,
        division: edited.acquisitionType === '' ? null : Number(edited.acquisitionType),
        parentType: parent,
        childType: child,
        status: edited.assetStatus === '' ? null : Number(edited.assetStatus),
        manufacturer: edited.manufacturer,
        model: edited.model,
        acquisitionDate: toISOStringWithSeconds(edited.acquisitionDate),  // ← 요기
        acquisitionPrice: Number(edited.acquisitionPrice ?? 0),
      };
      
      console.log('🔼 수정 요청 payload:', {
        barcode,
        ...payload,
      });
      try {
        const res = await authFetchWithRefresh(
          `${API_BASE}/assets/update?barcode=${encodeURIComponent(barcode)}`,
          { method: 'POST', body: JSON.stringify(payload) }
        );
        const json = await res.json();
        if (json.code === 1) {
          alert('✅ 자산 정보가 수정되었습니다.');
          onSave(edited); // 부모에게 전달
        } else {
          alert(`❌ 수정 실패: ${json.message || '알 수 없는 오류'}`);
        }
      } catch (err) {
        alert(`🚨 서버 오류: ${err.message}`);
        console.error(err);
      }
    };

  /* ────────────────────────────────────
     렌더링
  ‑────────────────────────────────────*/
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>자산 수정</h2>

        {/* 바코드 – 변경 불가 */}
        <label>바코드</label>
        <input value={edited.barcode} readOnly />

        {/* 회사 */}
        <label>회사구분</label>
        <select value={company} onChange={changeCompany}>
          <option value="">선택</option>
          {companies.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* 부서 */}
        <label>부서구분</label>
        <select value={department} onChange={changeDepartment} disabled={!company}>
          <option value="">선택</option>
          {departments.map(a => (
            <option key={a.affiliationId} value={a.department}>{a.department}</option>
          ))}
        </select>

        {/* 세부위치 */}
        <label>세부위치</label>
        <select value={location} onChange={changeLocation} disabled={!department}>
          <option value="">선택</option>
          {locations.map(l => (
            <option key={l.locationId} value={l.location}>{l.location}</option>
          ))}
        </select>

         {/* 취득구분 */}
 <label>취득구분</label>
 <select
   name="acquisitionType"          // ✅ 올바른 name
   value={String(edited.acquisitionType)}
   onChange={onBasicChange}
 >
   <option value="">선택</option>
   {acquisitionTypeOptions.map(opt => (
     <option key={`acq-${opt.value}`} value={opt.value}>{opt.label}</option>
   ))}
 </select>
        {/* 자산분류 */}
        <label>자산분류</label>
        <select value={parent} onChange={changeParent}>
          <option value="">선택</option>
          {parents.map(p => (
            <option key={p.parentId} value={p.name}>{p.name}</option>
          ))}
        </select>

        {/* 품목 */}
        <label>품목</label>
        <select value={child} onChange={changeChild} disabled={!parent}>
          <option value="">선택</option>
          {children.map(c => (
            <option key={c.childId} value={c.name}>{c.name}</option>
          ))}
        </select>

<label>자산상태</label>
<select
  name="assetStatus"
  value={edited.assetStatus}
  onChange={onBasicChange}
>
  <option value="">선택</option>
    {assetStatusOptions.map(opt => (
   <option key={`status-${opt.value}`} value={opt.value}>{opt.label}</option>
  ))}
</select>

        {/* 제조사 · 모델 */}
        <label>제조사</label>
        <input name="manufacturer" value={edited.manufacturer} onChange={onBasicChange} />

        <label>모델</label>
        <input name="model" value={edited.model} onChange={onBasicChange} />

        {/* 취득일 · 취득가 */}
        <label>취득일자</label>
        <input name="acquisitionDate" value={edited.acquisitionDate} onChange={onBasicChange} />

        <label>취득가</label>
        <input name="acquisitionPrice" value={edited.acquisitionPrice} onChange={onBasicChange} />

        {/* 버튼 */}
        <div className="modal-button-group">
          <button onClick={handleSave}>수정 완료</button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
