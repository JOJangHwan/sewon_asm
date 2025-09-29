/*  src/pages/BasicDataPage/BasicDataPage.jsx */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref';
import { FiPlus,FiEdit2,FiTrash2 , FiMinus } from 'react-icons/fi';
import './BasicDataPage.css';

import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';

// 모든 요청에 언어 헤더 자동 부착
const withLang = (opts = {}) => {
  const ui = getUILang();           // 'KR' | 'CN' | 'VN'
  const lng = uiToI18n(ui);         // 'ko' | 'zh' | 'vi'
  return {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'X-Client-Lang': lng,
      'X-Client-Lang-UI': ui,
    },
  };
};

const API_BASE =
  window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

/** 법인 & 자산분류 기초데이터 관리 */
export default function BasicDataPage() {
  
  // 화면 폭/포인터 특성으로 web/pda 자동 판별
  const effectiveMode = useResponsiveMode();
  const { t } = useTranslation('RegisterCorpAndItem');
      // Enter 로 제출되도록 폼 submit 핸들러
    const handleCorpSubmit = (e) => { e.preventDefault(); onAddCorp(); };
    const handleAssetSubmit = (e) => { e.preventDefault(); onAddAsset(); };
  /* ───────── state ───────── */
  const [corpMap , setCorpMap ] = useState({});   // {회사:{부서:[위치…]}}
  const [corpId  , setCorpId  ] = useState({});   // {회사:companyId}
  const [affId   , setAffId   ] = useState({});   // {회사:{부서:affId}}
  const [assetMap, setAssetMap] = useState({});   // {분류:[품목…]}
  const [assetIdMap, setAssetIdMap] = useState({});   //  ←  추가!
  const [itemIdMap, setItemIdMap] = useState({}); // {카테고리: {품목: itemId}}
  const [locationIdMap, setLocationIdMap] = useState({});

  const [corp, setCorp] = useState('');
  const [dept, setDept] = useState('');
  const [loc , setLoc ] = useState('');
  const [cat , setCat ] = useState('');
  const [item, setItem] = useState('');
 const [accountCode, setAccountCode] = useState(''); // 회계 코드(선택)

const [itemMetaMap, setItemMetaMap] = useState({});
const [itemEdit, setItemEdit] = useState(null); 

    /* ───────── 트리 노드 수정/삭제 핸들러 ───────── */
    const handleEditNode = async (label, level, parentLabel, ids = {}) => {
  // 아이템(품목) 수정은 모달로 운영: 프롬프트 건너뛰기
  if (level === 'item') {
    const cat  = parentLabel.trim();
    const name = label.trim();
    const id   = itemIdMap[cat]?.[name];
    const acc  = itemMetaMap[cat]?.[name]?.accountCode ?? '';
    if (!id) { alert(`품목ID를 찾지 못했습니다: [${parentLabel}][${label}]`); return; }
   // ✅ GET 없이 캐시값만 넣고 모달 오픈
 setItemEdit({
   id, cat,
   originalName: name,
   originalAccountCode: acc,   // ← 원본 코드 저장
   name,
   accountCode: acc,
   loading: false
});
   return;
  }

  // 그 외(dept/loc/cat)는 기존 프롬프트 유지
  const newName = prompt(`"${label}" ${t('RegisterCorpAndItem_ConfirmEditName')}`, label);
  if (!newName || newName.trim() === label) return;
  const trimmed = newName.trim();
    
      let endpoint;
      let payload;
    
      if (level === 'dept') {
        // 부서 수정: affiliationId만
        const affiliationId = ids.affiliationId || affId[corp]?.[label];
        const corporationId = corpId[corp];
        if (!affiliationId || !corporationId) return alert(t('RegisterCorpAndItem_NotFoundDeptOrCorpId'));
        endpoint = `${API_BASE}/affiliations/${affiliationId}?department=${encodeURIComponent(trimmed)}&corporationId=${corporationId}`;endpoint = `${API_BASE}/affiliations/${corporationId}/${affiliationId}?department=${encodeURIComponent(trimmed)}`;        payload = null;
      } else if (level === 'loc') {
        const affiliationId = ids.affiliationId || affId[corp]?.[parentLabel];
        const locationId = ids.locationId;
       // console.log('[세부위치 수정]', {
        //   affiliationId,
        //   locationId,
        //   corp,
        //   parentLabel,
        //   label,
        //   endpoint: `${API_BASE}/locations/${affiliationId}/${locationId}?location=${encodeURIComponent(trimmed)}`
        // });
        if (!affiliationId || !locationId) {
          console.warn('[실패] affiliationId, locationId 확인:', { affiliationId, locationId, ids });
          return alert(t('RegisterCorpAndItem_NotFoundDeptOrDetailLocationId'));
        }
        endpoint = `${API_BASE}/locations/${affiliationId}/${locationId}?location=${encodeURIComponent(trimmed)}`;
        payload = null;
       // console.log('[세부위치 수정 요청]', 'PUT', endpoint);
      } else if (level === 'cat') {
        // 자산분류
        const id = assetIdMap[label];
endpoint = `${API_BASE}/asset-types/${id}?type=${encodeURIComponent(trimmed)}`;
        payload = null; // body 필요 없음
      } else if (level === 'item') {
  // ▶ 모달로 전환
  const cat  = parentLabel.trim();
  const name = label.trim();
  const id   = itemIdMap[cat]?.[name];
  const acc  = itemMetaMap[cat]?.[name]?.accountCode ?? '';
  if (!id) { alert(`품목ID를 찾지 못했습니다: [${parentLabel}][${label}]`); return; }
  setItemEdit({ id, cat, originalName: name, name, accountCode: acc });
  return;
      } else {
        alert('수정할 수 없는 항목입니다.');
        return;
      }
      
  // 요청 보내기 전에 로그 남기기
  // console.log('[수정 요청]', {
  //   endpoint,
  //   payload,
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' }
  // });
  try {
    const res = await authFetchWithRefresh(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const j = await res.json();
   // console.log('수정 응답', j);
    //alert(j.message || "처리 결과 없음");
    if (j.code === 1) {
      alert(t('RegisterCorpAndItem_ChangeCompleted'));
      window.location.reload();
    } 
    // else {
    //   alert(j.message || "처리 결과 없음");
    // }
  } catch (err) {
    alert('❌ ' + (err.message || '수정 실패'));
  }
    };
    
    
    
  
    const handleDeleteNode = async (label, level, parentLabel, ids = {}) => {
      if (!window.confirm(`${label}${t('RegisterCorpAndItem_ConfirmDelete')}`)) return;
    
      let id;
      let endpoint;
      let body = null;
      let method = 'DELETE';
    
  // 소속(부서) 삭제
  if (level === 'dept') {
    const affiliationId = ids.affiliationId || affId[corp]?.[label];
    if (!affiliationId) return alert(t('RegisterCorpAndItem_AffiliationIdNotFoundRefresh'));
    endpoint = `${API_BASE}/affiliations/${affiliationId}`;
  } 
  // 세부위치 삭제
  else if (level === 'loc') {
    const locationId = ids.locationId;
    if (!locationId) return alert(t('RegisterCorpAndItem_DetailLocationIdNotFoundRefresh'));
    endpoint = `${API_BASE}/locations/${locationId}`;
  }
           else if (level === 'cat') {
               // 자산분류(카테고리) 삭제
                 const assetTypeId = assetIdMap[label];
                  if (!assetTypeId) return alert(t('RegisterCorpAndItem_AssetCategoryIdMissingRefresh'));
                 endpoint = `${API_BASE}/asset-types/${assetTypeId}`;
                 method = 'DELETE';
                 body = null;
             } else if (level === 'item') {
               // 품목(아이템) 삭제
                 const itemId = itemIdMap[parentLabel]?.[label];
                if (!itemId) return alert(t('RegisterCorpAndItem_ItemIdMissingRefresh'));
                 endpoint = `${API_BASE}/asset-types/${itemId}`;
                 method = 'DELETE';
                 body = null;
      } else {
         alert(t('RegisterCorpAndItem_CannotDeleteItem'));
        return;
      }
    
      try {
             const options = {
                 method: method || 'DELETE',   // POST/DELETE 동적 선택
                 headers: { 'Content-Type': 'application/json' }
               };
               if (body) options.body = JSON.stringify(body);
    
        const res = await authFetchWithRefresh(endpoint, options);
        const j = await res.json();
                if (j.code === 1) {
                    alert(t('RegisterCorpAndItem_DeleteCompleted'));
                    window.location.reload();
                  } else if (j.message) {
                    alert(j.message);
                  } else {
                    alert(t('RegisterCorpAndItem_DeleteFailed'));
                  }
      } catch (err) {
        alert('❌ ' + (err.message || '삭제 실패'));
      }
    };
    



  /* ───────── 최초 로드 ───────── */
  useEffect(() => {
    (async () => {
      try {
        /* 1) 법인/부서/위치 */
        const r1 = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const j1 = await r1.json();
        if (j1.code === 1 && Array.isArray(j1.data?.corporationList)) {
          const cMap = {}, idMap = {}, aMap = {}, locMap = {};
          j1.data.corporationList.forEach(co => {
            idMap[co.name] = co.corporationId;
            cMap[co.name]  = {};
            aMap[co.name]  = {};
            locMap[co.name] = {};
            (co.affiliationList || []).forEach(af => {
              cMap[co.name][af.department] = [];
              locMap[co.name][af.department] = {};
              aMap[co.name][af.department]  = af.affiliationId;
              (af.locations || []).forEach(l => {
                cMap[co.name][af.department].push(l.location);
                locMap[co.name][af.department][l.location] = l.locationId;
              });
            });
          });
          setCorpMap(cMap); setCorpId(idMap); setAffId(aMap); setLocationIdMap(locMap);
          setCorp(Object.keys(cMap)[0] || '');
        }

        /* 2) 자산 분류/품목 */
        const r2 = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
        const j2 = await r2.json();
        console.groupCollapsed('%c[HIERARCHY] /asset-types/hierarchy', 'color:#8b5cf6;font-weight:700;');
        console.log('raw:', j2);
        if (j2.code === 1 && Array.isArray(j2.data?.parentList)) {
        const aName = {}, aId = {}, iId = {}, iMeta = {};
          const tableRows = [];
          j2.data.parentList.forEach(p => {
            const categoryName = p.name.trim();
            aName[categoryName] = [];
            if (p.parentId) aId[categoryName] = p.parentId; // 자산분류 PK
            iMeta[categoryName] = {};
            iId[categoryName] = {};
            (p.childList || []).forEach(c => {
               const childName = c.name.trim();
              aName[categoryName].push(c.name.trim());
              // 실제 PK 필드명 확인!
             // console.log('[childList 항목]', c);
              // iId[categoryName][c.name.trim()] = c.itemId ?? c.assetTypeId ?? c.id;
 iId[categoryName][c.name.trim()] = c.childId;
 // 계층 응답에 담긴 코드 로깅
//  console.log('[HIERARCHY child]', {
// accountCode: c.accountingCode ?? c.accountCode });
                   iMeta[categoryName][childName] = {
       id: c.childId,
        accountCode: (c.accountingCode ?? c.accountCode ?? '')
     };
            });
          });
                  // ★ DEBUG: 최종 맵 요약
        console.log('[MAP] assetIdMap (category -> parentId):', aId);
        console.log('[MAP] itemIdMap (category -> {item: childId}):', iId);
        console.log('[MAP] itemMetaMap (category -> {item: {id, accountCode}}):', iMeta);

          setAssetMap(aName);
          setAssetIdMap(aId);
          setItemIdMap(iId); // + 추가
          setItemMetaMap(iMeta);
        }
      } catch (err) {
        console.warn('[서버 응답 실패] 기본값 없이 동작', err);
      }
    })();
  }, []);

  /* ───────── 부서/위치 등록 ───────── */
// ───────── 부서 + 세부위치 등록 (세부위치 필수) ─────────
const onAddCorp = async () => {
  const corpNm = corp.trim();
  const deptNm = dept.trim();
  const locNm  = loc.trim();

  /* 1) 세 항목 모두 입력해야 진행 */
  if (!corpNm || !deptNm || !locNm) {
    alert('⚠️ 회사·부서·세부위치를 모두 입력해야 합니다.');
    return;
  }

  /* 2) 중복 여부 확인 */
  const deptExists = !!corpMap[corpNm]?.[deptNm];
  const locExists  = deptExists && corpMap[corpNm][deptNm].includes(locNm);

  if (deptExists && locExists) {
    alert(t('RegisterCorpAndItem_Error_AlreadyRegisteredDeptAndDetailLocation'));
    return;
  }

  /* ───────────────────────────────────────────────
     3) 부서가 이미 있으면 → 세부위치만 등록
  ─────────────────────────────────────────────── */
  if (deptExists && !locExists) {
    const affiliationId = affId[corpNm]?.[deptNm];
    if (!affiliationId) {
      alert(t('RegisterCorpAndItem_Error_NotFoundDeptIdForDetailLocationRegister'));
      return;
    }

    try {
      await postLocation(affiliationId, locNm);
      /* state 동기화 */
      setCorpMap(prev => {
        const next = { ...prev };
        next[corpNm][deptNm].push(locNm);
        return next;
      });
      alert(t('RegisterCorpAndItem_DetailLocationRegisterCompleted'));
    } catch (err) {
      console.error(err);
      alert(t('RegisterCorpAndItem_DetailLocationRegisterFailedLabel') + err.message);
    }
    setLoc('');
    return;
  }

  /* ───────────────────────────────────────────────
     4) 부서가 없으면 → 부서 등록 후 세부위치 등록
  ─────────────────────────────────────────────── */
  let affiliationId;
  try {
    const res = await authFetchWithRefresh(`${API_BASE}/affiliations`, {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ corporationId: corpId[corpNm], department: deptNm })
    });
    const j = await res.json();
    if (j.code !== 1) throw new Error(j.message);

    affiliationId = j.data?.affiliationId;
    if (!affiliationId) throw new Error('부서 ID 응답 없음');

    /* state: 부서 추가 */
    setAffId(prev  => ({
      ...prev,
      [corpNm]: { ...(prev[corpNm] || {}), [deptNm]: affiliationId }
    }));
    setCorpMap(prev => ({
      ...prev,
      [corpNm]: { ...(prev[corpNm] || {}), [deptNm]: [] }
    }));
    alert(t('RegisterCorpAndItem_DepartmentRegisterCompleted'));
  } catch (err) {
    console.error(err);
    alert(t('RegisterCorpAndItem_DepartmentRegisterFailedLabel') + err.message);
    return;
  }

  /* 부서 등록 성공 → 세부위치 등록 */
  try {
    await postLocation(affiliationId, locNm);
    setCorpMap(prev => {
      const next = { ...prev };
      next[corpNm][deptNm].push(locNm);
      return next;
    });
    alert(t('RegisterCorpAndItem_DetailLocationRegisterCompleted'));
  } catch (err) {
    console.error(err);
    alert(t('RegisterCorpAndItem_DetailLocationRegisterFailedLabel') + err.message);
  }

  /* 입력칸 초기화 */
  setDept('');
  setLoc('');
};

/* ─ 헬퍼: 세부위치 POST 공통 함수 ─ */
async function postLocation(affiliationId, location) {
  const res = await authFetchWithRefresh(`${API_BASE}/locations`, {
    method : 'POST',
    headers: { 'Content-Type':'application/json' },
    body   : JSON.stringify({ affiliationId, location })
  });
  const j = await res.json();
  if (j.code !== 1) throw new Error(j.message);
}


  /* ───────── 자산 분류/품목 등록 ───────── */
// ───────── 자산분류 / 품목 등록 ─────────
const onAddAsset = async () => {
  const catName  = cat.trim();
  const itemName = item.trim();
  const accCode  = accountCode.trim();

  // 1) 둘 다 입력해야 등록 가능
  if (!catName || !itemName) {
   alert(t('RegisterCorpAndItem_Error_MustEnterAssetCategoryAndItemName'));
    return;
  }

  const catExists = Object.prototype.hasOwnProperty.call(assetMap, catName);
  const itemExists = catExists && assetMap[catName].includes(itemName);

  // 4) 자산분류+품목 모두 있으면 이미 있다고 알림
  if (itemExists) {
    alert(t('RegisterCorpAndItem_Error_AlreadyRegisteredAssetCategoryAndItem'));
    return;
  }

  let parentId = assetIdMap[catName] || null;

  try {
    // 3) 자산분류가 없으면 → 자산분류 먼저 등록
    if (!catExists) {
    //  console.log('[POST /asset-types] (parent) payload →', { name: catName, nationType: 'kr' });
          //  console.log('[자산분류 등록 요청]', {
          //      url: `${API_BASE}/asset-types`,
          //      payload: { name: catName, nationType: 'kr' }
          //    });
      const resParent = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, nationType: 'kr' }),
      });
      const jParent = await resParent.json();
      //console.log('[응답 JSON] (parent)', jParent);
      if (jParent.code !== 1) throw new Error(jParent.message || '자산분류 등록 실패');
      parentId = jParent.data?.assetTypeId;
      setAssetMap(prev => ({ ...prev, [catName]: [] }));
      setAssetIdMap(prev => ({ ...prev, [catName]: parentId }));
      alert(t('RegisterCorpAndItem_AssetCategoryRegisteredFirst'));
    }

    // 2) 품목 등록
    if (!parentId) {
      const resH = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
      const jH = await resH.json();
      const list = jH.data?.parentList || [];
      const found = list.find(p => p.name === catName);
     // console.log('[카테고리 검색결과]', found);
      parentId = found?.parentId; // <-- 여기!
      setAssetIdMap(prev => ({ ...prev, [catName]: parentId }));
      if (!parentId) throw new Error('parentId 찾기 실패');
    }
     //  console.log('[품목 등록 요청]', {
        //  url: `${API_BASE}/asset-types`,
        //    payload: { parentId, name: itemName, nationType: 'kr' }
        //  });
   // console.log('[POST /asset-types] (child) payload →', { parentId, name: itemName, nationType: 'kr' });
  // 회계코드는 선택 사항 → 값이 있을 때만 보내기
 const payloadChild = { parentId, name: itemName, nationType: 'kr' };
 // 백엔드 DTO 필드명에 맞춤: accountingCode
 if (accCode) payloadChild.accountingCode = accCode;
  // console.log('[POST /asset-types] child payload:', payloadChild);

  const resChild = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadChild),
  });
    const jChild = await resChild.json();
   // console.log('[응답 JSON] (child)', jChild);
    if (jChild.code !== 1) throw new Error(jChild.message || '품목 등록 실패');

    setAssetMap(prev => ({
      ...prev,
      [catName]: [...(prev[catName] || []), itemName],
    }));
    setItem('');
    setAccountCode(''); // ← 성공 시 회계 코드 입력칸도 초기화
     // 화면에 회계코드 바로 보이도록 메타도 갱신
 setItemMetaMap(prev => ({
   ...prev,
   [catName]: {
     ...(prev[catName] || {}),
     [itemName]: {
       id: (jChild?.data?.childId ?? jChild?.data?.assetTypeId ?? null), // 서버 응답 필드에 맞춰 자동 주입
       accountCode: accCode || ''  // 화면 표시는 기존 키 유지
     }
   }
 }));
    alert(t('RegisterCorpAndItem_ItemRegisterCompleted'));

  } catch (err) {
    console.error(err);
    alert(`❌ ${err.message || '등록 실패'}`);
  }
};

// 기존 saveItemEdit 교체
async function saveItemEdit({ deleteOnly = false } = {}) {
  if (!itemEdit) return;

const { id, cat, originalName, originalAccountCode = '' } = itemEdit;
  const nextName = (itemEdit.name || '').trim();


  // 이름 변경 시 중복 체크
  const changedName = !!nextName && nextName !== originalName;
    // 회계코드 변경 여부(삭제 버튼/빈칸 저장 포함)
  const nextAcc = deleteOnly ? '' : (itemEdit.accountCode || '').trim();
  const changedAcc = deleteOnly || nextAcc !== (originalAccountCode || '');
  if (changedName && assetMap[cat]?.includes(nextName)) {
    alert(t('RegisterCorpAndItem_DuplicateItemName'));
    return;
  }
  
  // ✅ 여기 넣으세요: 둘 다 안 바뀌면 요청하지 않기
  if (!changedName && !changedAcc) {
    alert('변경된 내용이 없습니다.');
    return; // 필요하면 setItemEdit(null)로 모달만 닫아도 됨
  }

  // 백엔드가 @RequestParam("type"), @RequestParam("code") 를 요구
  // - type: 변경 없으면 빈 문자열("") 전송 → 백엔드가 미변경 처리
  // - code: "" 전송 시 코드 삭제(또는 백엔드 규칙에 맞게 처리)
const params = new URLSearchParams();

// 이름이 바뀐 경우에만 type 추가
if (changedName) params.set('type', nextName);

// 코드가 바뀐 경우(삭제 포함)에만 code 추가
// deleteOnly 이거나 nextAcc === '' 인 경우, code= 빈값도 포함되어야 "삭제"로 인식됩니다.
if (changedAcc) params.set('code', nextAcc);

const url = `${API_BASE}/asset-types/${id}?${params.toString()}`;

    // 🔎 전송 직전 디버그
  console.groupCollapsed('%c[PUT] /asset-types/' + id, 'color:#2563eb;font-weight:700;');
  console.log('itemEdit:', itemEdit);
  console.log('cat:', cat, 'originalName:', originalName);
  console.log('changedName?', changedName, 'nextName:', nextName);
  console.log('nextAcc:', nextAcc, 'deleteOnly:', deleteOnly);
  console.log('query params:', Object.fromEntries(params.entries()));
  console.log('URL:', url);
  console.groupEnd();

  try {
    const res = await authFetchWithRefresh(url, { method: 'PUT' });
    console.log('[PUT resp] status:', res.status);
    const j   = await res.json();
    console.log('[PUT resp] json:', j);
    if (j.code !== 1) throw new Error(j.message || '수정 실패');

    // ✅ 로컬 상태 갱신 (새로고침 없이 반영)
    if (changedName) {
      // (1) 리스트에서 이름 변경
      setAssetMap(prev => {
        const arr = prev[cat] || [];
        const nextArr = arr.map(n => (n === originalName ? nextName : n));
        return { ...prev, [cat]: nextArr };
      });
      // (2) id 매핑 이동
      setItemIdMap(prev => {
        const cur = { ...(prev[cat] || {}) };
        const val = cur[originalName];
        delete cur[originalName];
        cur[nextName] = val;
        return { ...prev, [cat]: cur };
      });
      // (3) 메타 이동 + 회계코드 반영
      setItemMetaMap(prev => {
        const cur = { ...(prev[cat] || {}) };
        const meta = cur[originalName] || { id, accountCode: '' };
        delete cur[originalName];
        cur[nextName] = { ...meta, accountCode: nextAcc };
        return { ...prev, [cat]: cur };
      });
    } else {
      
      // 이름은 그대로, 회계 코드만 변경/삭제
      setItemMetaMap(prev => {
        const cur = { ...(prev[cat] || {}) };
        const meta = cur[originalName] || { id, accountCode: '' };
        meta.accountCode = nextAcc; // '' 이면 삭제
        cur[originalName] = meta;
        return { ...prev, [cat]: cur };
      });
    }

    setItemEdit(null);
    alert(deleteOnly ? '회계 코드가 삭제되었습니다.' : t('RegisterCorpAndItem_ChangeCompleted'));
  } catch (e) {
    console.warn('[PUT error] /asset-types/' + id, e);
    alert('❌ ' + (e.message || '수정 실패'));
  }
}






  /* ───────── UI ───────── */
 return (
    <div className={`page-wrap ${effectiveMode}-mode`}>
      <h1>{t('RegisterCorpAndItem_Title')}</h1>

      {effectiveMode === 'pda' ? (
        <>
          {/* 1열: 법인/부서/세부위치 등록 */}
          <div className="card-wrap pda-stack">
            <div className="card">
              <h2>🏢 {t('RegisterCorpAndItem_RegisterOrgChart')}</h2>
              <select value={corp} onChange={e => setCorp(e.target.value)}>
                {Object.keys(corpMap).map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={dept} onChange={e => setDept(e.target.value)} placeholder={t('RegisterCorpAndItem_DepartmentNameRequired')} />
              <input value={loc}  onChange={e => setLoc(e.target.value)}  placeholder={t('RegisterCorpAndItem_DetailLocationRequired')} />
              <button onClick={onAddCorp}>{t('RegisterCorpAndItem_Register')}</button>
            </div>
          </div>

          {/* 2열: 법인/부서/세부위치 트리 */}
          <div className="card-wrap pda-stack">
            <div className="card">
              <h2>🏢 {t('RegisterCorpAndItem_RegisteredCorporations')}</h2>
              <TreeView
                data={corpMap}
                onEdit={handleEditNode}
                onDelete={handleDeleteNode}
                itemMetaMap={itemMetaMap}
                affId={affId}
                locationIdMap={locationIdMap}
              />
            </div>
          </div>

          {/* 3열: 자산분류/품목 등록 */}
          <div className="card-wrap pda-stack">
            <div className="card">
              <h2>📦 {t('RegisterCorpAndItem_RegisterCategoryAndItem')}</h2>
              <input value={cat}  onChange={e => setCat(e.target.value)}  placeholder={t('RegisterCorpAndItem_AssetCategoryRequired')} />
              <input value={item} onChange={e => setItem(e.target.value)} placeholder={t('RegisterCorpAndItem_ItemNameRequired')} />
              <input value={accountCode} onChange={e => setAccountCode(e.target.value)} placeholder="회계 코드 (선택)"/>
              <button onClick={onAddAsset}>{t('RegisterCorpAndItem_Register')}</button>
            </div>
          </div>

          {/* 4열: 자산분류/품목 트리 */}
          <div className="card-wrap pda-stack">
            <div className="card">
              <h2>📦 {t('RegisterCorpAndItem_RegisteredItems')}</h2>
              <TreeView
                data={assetMap}
                isAsset
                onEdit={handleEditNode}
                onDelete={handleDeleteNode}
                itemMetaMap={itemMetaMap}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── WEB: 기존 2열 레이아웃 유지 ── */}
          <div className="card-wrap">
            <div className="card">
               <h2>🏢 {t('RegisterCorpAndItem_RegisterOrgChart')}</h2>
              <select value={corp} onChange={e => setCorp(e.target.value)}>
                {Object.keys(corpMap).map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={dept} onChange={e => setDept(e.target.value)} placeholder={t('RegisterCorpAndItem_DepartmentNameRequired')} />
              <input value={loc}  onChange={e => setLoc(e.target.value)}  placeholder={t('RegisterCorpAndItem_DetailLocationRequired')} />
              <button onClick={onAddCorp}>{t('RegisterCorpAndItem_Register')}</button>
            </div>

            <div className="card">
              <h2>📦 {t('RegisterCorpAndItem_RegisterCategoryAndItem')}</h2>
              <input value={cat}  onChange={e => setCat(e.target.value)}  placeholder={t('RegisterCorpAndItem_AssetCategoryRequired')} />
              <input value={item} onChange={e => setItem(e.target.value)} placeholder={t('RegisterCorpAndItem_ItemNameRequired')} />
              <input value={accountCode} onChange={e => setAccountCode(e.target.value)} placeholder="회계 코드 (선택)"/>
              <button onClick={onAddAsset}>{t('RegisterCorpAndItem_Register')}</button>
            </div>
          </div>

          <div className="card-wrap">
            <div className="card">
              <h2>🏢 {t('RegisterCorpAndItem_RegisteredCorporations')}</h2>
              <TreeView
                data={corpMap}
                onEdit={handleEditNode}
                onDelete={handleDeleteNode}
                affId={affId}
                locationIdMap={locationIdMap}
              />
            </div>

            <div className="card">
              <h2>📦 {t('RegisterCorpAndItem_RegisteredItems')}</h2>
              <TreeView
                data={assetMap}
                isAsset
                onEdit={handleEditNode}
                onDelete={handleDeleteNode}
                itemMetaMap={itemMetaMap}
              />
            </div>
          </div>
        </>
      )}
      {/* 품목 수정 모달 */}
{itemEdit && (
  <div style={{
    position:'fixed', inset:0, background:'rgba(0,0,0,.3)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
  }}>
<div className="bdp-dialog" style={{ background:'#fff', borderRadius:12, padding:16, boxShadow:'0 10px 30px rgba(0,0,0,.2)' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>품목 수정</div>

 <div className="bdp-form">
        {/* <div className="bdp-label">{t('RegisterCorpAndItem_ItemName')}</div> */}
         <div className="bdp-label">{t('RegisterCorpAndItem_ItemName')}</div>
        <input
          className="bdp-input"
          value={itemEdit.name}
          onChange={e=>setItemEdit(s=>({ ...s, name:e.target.value }))}
        />

        <div className="bdp-label">회계 코드 (선택)</div>
        <input
          className="bdp-input"
          value={itemEdit.accountCode}
          onChange={e=>setItemEdit(s=>({ ...s, accountCode:e.target.value }))}
 placeholder={itemEdit.loading ? '불러오는 중…' : '비워두면 유지'}
 disabled={itemEdit.loading}
        />
      </div>

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 }}>
        <button className="ams-btn" onClick={()=>setItemEdit(null)}>취소</button>
        {/* <button className="ams-btn" onClick={()=>saveItemEdit({ deleteOnly:true })}>회계코드 삭제</button> */}
        <button className="ams-btn is-primary" onClick={()=>saveItemEdit({})}>수정하기</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}


/* ───────── 트리 컴포넌트 ───────── */
function TreeView({ data, isAsset = false, onEdit, onDelete, affId, locationIdMap, itemMetaMap = {} }) {

  if (isAsset) {
    return (
      <div className="tree asset-tree">
        <ul>
          {Object.entries(data).map(([cat, items]) => (
            <AssetNode key={cat} label={cat} onEdit={onEdit} onDelete={onDelete} level="cat">
{items.map(it => {
  const code = itemMetaMap?.[cat]?.[it]?.accountCode;
  return (
    <li key={it} className="asset-leaf">
      <span
        className="asset-leaf__text"
        // 텍스트 클릭은 토글/다른 동작과 충돌하지 않도록 기본은 텍스트만
      >
        {it} {code ? <span className="acct-badge">· 회계코드 : {code}</span> : null}
      </span>

      {/* 👉 빨간 상자(연필) 클릭 시 모달 열림 */}
      <span
        className="node-actions"
        onClick={e => e.stopPropagation()}  // 부모 토글 방지
      >
        <FiEdit2
          size={12}
          className="edit-icon"
          title="품목 수정"
          onClick={() => onEdit(it, 'item', cat)}   // ✅ 'item'으로 모달 진입
        />
        <FiTrash2
          size={12}
          className="del-icon"
          title="품목 삭제"
          onClick={() => onDelete(it, 'item', cat)}
        />
      </span>
    </li>
  );
})}
            </AssetNode>
          ))}
        </ul>
      </div>
    );
  }

  /* 🏢 회사/부서/위치 트리 */
  return (
    <div className="tree">
      <ul>
        {Object.entries(data).map(([cName, depts]) => (
            <TreeNode key={cName} label={cName} defaultOpen
                      onEdit={onEdit} onDelete={onDelete} level="corp">
            {Object.entries(depts).map(([dName, locs]) => (
              <TreeNode key={dName}
  label={dName}
  parentLabel={cName}
  onEdit={onEdit}
  onDelete={onDelete}
  level="dept"
>
 {locs.map(l => (
   <TreeNode
     key={l}
     label={l}
     parentLabel={dName}
     onEdit={onEdit}
     onDelete={onDelete}
     level="loc"
      affiliationId={affId[cName]?.[dName]}
      locationId={locationIdMap[cName]?.[dName]?.[l]}

   />
 ))}
</TreeNode>
            ))}
          </TreeNode>
        ))}
      </ul>
    </div>
  );
}

/* ─ 회사용 노드 ─ */
function TreeNode({ label, children, defaultOpen = false, onEdit, onDelete, level, affiliationId, locationId, parentLabel }) {
  const [open, setOpen] = useState(defaultOpen);
  const isLeaf = !children || (Array.isArray(children) && children.length === 0);

  const showActions = level !== 'corp'; // 🔹 level이 'corp'면 아이콘 숨김

  return (
    <li className="tree-node">
      <div
        className="tree-label"
        onClick={() => !isLeaf && setOpen(o => !o)}
      >
        {!isLeaf && (
          <span className="toggle-icon">
            {open ? <FiMinus size={12} /> : <FiPlus size={12} />}
          </span>
        )}
        {label}

        {/* ✏️/🗑️ 아이콘 - 법인(corp)은 표시 안 함 */}
        {showActions && (
          <span className="node-actions" onClick={e => e.stopPropagation()}>
 <FiEdit2
   size={12}
   className="edit-icon"
   onClick={() =>
     onEdit(label, level, parentLabel, {
       affiliationId,
       locationId,
     })
   }
 />
            <FiTrash2
  size={12}
  className="del-icon"
  onClick={() =>
    onDelete(label, level, parentLabel, { affiliationId, locationId })
  }
/>
          </span>
        )}
      </div>
      {!isLeaf && open && <ul>{children}</ul>}
    </li>
  );
}


/* ─ 자산분류용 노드 ─ */
function AssetNode({ label, children, onEdit, onDelete, level }) {
  const [open, setOpen] = useState(true);

  return (
    <li className="asset-node">
      <div
        className="asset-label"

         onClick={() => children && setOpen(o => !o)}
      >
        <span className="toggle-icon">
          {open ? <FiMinus size={12} /> : <FiPlus size={12} />}
        </span>
        {label}
        <span className="node-actions" onClick={e => e.stopPropagation()}>

         <FiEdit2 size={12} className="edit-icon" onClick={() => onEdit(label, level)} />
         <FiTrash2 size={12} className="del-icon" onClick={() => onDelete(label, level)} />
        </span>
      </div>
      {open && <ul>{children}</ul>}
    </li>
  );
}


/* ───────── Web/PDA 자동 판별 훅 (파일 하단에 추가) ───────── */
function useResponsiveMode() {
  const [mode, setMode] = React.useState('web');
  React.useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
      const isPDA = w <= 920 || (coarse && w <= 1200);
      setMode(isPDA ? 'pda' : 'web');
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);
  return mode;
}