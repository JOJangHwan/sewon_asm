/*  src/pages/BasicDataPage/BasicDataPage.jsx */
import React, { useEffect, useState } from 'react';
import { FiPlus,FiEdit2,FiTrash2 , FiMinus } from 'react-icons/fi';
import './BasicDataPage.css';

import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';

const API_BASE =
  window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

/** 법인 & 자산분류 기초데이터 관리 */
export default function BasicDataPage() {
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
    /* ───────── 트리 노드 수정/삭제 핸들러 ───────── */
    const handleEditNode = async (label, level, parentLabel, ids = {}) => {
      // label: 현재 노드명, level: 타입, parentLabel: 상위노드명, ids: {affiliationId, locationId}
      const newName = prompt(`"${label}" 이름을 수정할까요?`, label);
      if (!newName || newName.trim() === label) return;
      const trimmed = newName.trim();
    
      let endpoint;
      let payload;
    
      if (level === 'dept') {
        // 부서 수정: affiliationId만
        const affiliationId = ids.affiliationId || affId[corp]?.[label];
        const corporationId = corpId[corp];
        if (!affiliationId || !corporationId) return alert('부서 ID 또는 법인 ID를 찾지 못했습니다.');
        endpoint = `${API_BASE}/affiliations/${affiliationId}?department=${encodeURIComponent(trimmed)}&corporationId=${corporationId}`;endpoint = `${API_BASE}/affiliations/${corporationId}/${affiliationId}?department=${encodeURIComponent(trimmed)}`;        payload = null;
      } else if (level === 'loc') {
        const affiliationId = ids.affiliationId || affId[corp]?.[parentLabel];
        const locationId = ids.locationId;
        console.log('[세부위치 수정]', {
          affiliationId,
          locationId,
          corp,
          parentLabel,
          label,
          endpoint: `${API_BASE}/locations/${affiliationId}/${locationId}?location=${encodeURIComponent(trimmed)}`
        });
        if (!affiliationId || !locationId) {
          console.warn('[실패] affiliationId, locationId 확인:', { affiliationId, locationId, ids });
          return alert('부서 ID 또는 세부위치 ID를 찾지 못했습니다.');
        }
        endpoint = `${API_BASE}/locations/${affiliationId}/${locationId}?location=${encodeURIComponent(trimmed)}`;
        payload = null;
        console.log('[세부위치 수정 요청]', 'PUT', endpoint);
      } else if (level === 'cat') {
        // 자산분류
        const id = assetIdMap[label];
        endpoint = `${API_BASE}/asset-types/${id}?type=${encodeURIComponent(trimmed)}`;
        payload = null; // body 필요 없음
      } else if (level === 'item') {
        const cat = parentLabel.trim();
        const item = label.trim();
               // 중복 이름 체크: 이미 같은 카테고리에 동일 이름의 품목이 있으면 막기
       if (assetMap[cat]?.includes(trimmed)) {
        alert('이미 동일한 이름의 품목이 존재합니다.');
         return;
       }
        // 품목
        // item의 id는 itemIdMap[parentLabel][label]
        const id = itemIdMap[parentLabel.trim()]?.[label.trim()];
        console.log('[품목 수정]', { cat, item, id, itemIdMap, rawParentLabel: parentLabel, rawLabel: label });
        if (!id) {
          alert(`품목ID를 찾지 못했습니다: [${parentLabel}][${label}]`);
          return;
        }
        endpoint = `${API_BASE}/asset-types/${id}?type=${encodeURIComponent(trimmed)}`;
        payload = null; // body 필요 없음
      } else {
        alert('수정할 수 없는 항목입니다.');
        return;
      }
      
  // 요청 보내기 전에 로그 남기기
  console.log('[수정 요청]', {
    endpoint,
    payload,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  });
  try {
    const res = await authFetchWithRefresh(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const j = await res.json();
    console.log('수정 응답', j);
    //alert(j.message || "처리 결과 없음");
    if (j.code === 1) {
      alert("변경이 완료되었습니다.");
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
      if (!window.confirm(`${label}을(를) 삭제할까요?`)) return;
    
      let id;
      let endpoint;
      let body = null;
      let method = 'DELETE';
    
  // 소속(부서) 삭제
  if (level === 'dept') {
    const affiliationId = ids.affiliationId || affId[corp]?.[label];
    if (!affiliationId) return alert('소속ID를 찾지 못했습니다.');
    endpoint = `${API_BASE}/affiliations/${affiliationId}`;
  } 
  // 세부위치 삭제
  else if (level === 'loc') {
    const locationId = ids.locationId;
    if (!locationId) return alert('세부위치ID를 찾지 못했습니다.');
    endpoint = `${API_BASE}/locations/${locationId}`;
  }
           else if (level === 'cat') {
               // 자산분류(카테고리) 삭제
                 const assetTypeId = assetIdMap[label];
                 if (!assetTypeId) return alert('자산분류 ID가 없습니다.');
                 endpoint = `${API_BASE}/asset-types/${assetTypeId}`;
                 method = 'DELETE';
                 body = null;
             } else if (level === 'item') {
               // 품목(아이템) 삭제
                 const itemId = itemIdMap[parentLabel]?.[label];
                 if (!itemId) return alert('품목 ID가 없습니다.(새로고침을 하세요)');
                 endpoint = `${API_BASE}/asset-types/${itemId}`;
                 method = 'DELETE';
                 body = null;
      } else {
        alert('삭제할 수 없는 항목입니다.');
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
                    alert('삭제가 완료되었습니다.');
                    window.location.reload();
                  } else if (j.message) {
                    alert(j.message);
                  } else {
                    alert('삭제 실패');
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
        console.log('[응답 전체] (asset-types/hierarchy)', j2);
        if (j2.code === 1 && Array.isArray(j2.data?.parentList)) {
          const aName = {}, aId = {}, iId = {};
          j2.data.parentList.forEach(p => {
            const categoryName = p.name.trim();
            aName[categoryName] = [];
            if (p.parentId) aId[categoryName] = p.parentId; // 자산분류 PK
            iId[categoryName] = {};
            (p.childList || []).forEach(c => {
              aName[categoryName].push(c.name.trim());
              // 실제 PK 필드명 확인!
              console.log('[childList 항목]', c);
              // iId[categoryName][c.name.trim()] = c.itemId ?? c.assetTypeId ?? c.id;
              iId[categoryName][c.name.trim()] = c.childId;
            });
          });
          setAssetMap(aName);
          setAssetIdMap(aId);
          setItemIdMap(iId); // + 추가
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
    alert('⚠️ 이미 등록된 부서 및 세부위치입니다.');
    return;
  }

  /* ───────────────────────────────────────────────
     3) 부서가 이미 있으면 → 세부위치만 등록
  ─────────────────────────────────────────────── */
  if (deptExists && !locExists) {
    const affiliationId = affId[corpNm]?.[deptNm];
    if (!affiliationId) {
      alert('❌ 세부위치를 등록할 부서 ID를 찾지 못했습니다.');
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
      alert('✅ 세부위치 등록 완료');
    } catch (err) {
      console.error(err);
      alert('❌ 세부위치 등록 실패: ' + err.message);
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
    alert('✅ 부서 등록 완료');
  } catch (err) {
    console.error(err);
    alert('❌ 부서 등록 실패: ' + err.message);
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
    alert('✅ 세부위치 등록 완료');
  } catch (err) {
    console.error(err);
    alert('❌ 세부위치 등록 실패: ' + err.message);
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

  // 1) 둘 다 입력해야 등록 가능
  if (!catName || !itemName) {
    alert('자산분류와 품목명을 모두 입력해야 합니다.');
    return;
  }

  const catExists = Object.prototype.hasOwnProperty.call(assetMap, catName);
  const itemExists = catExists && assetMap[catName].includes(itemName);

  // 4) 자산분류+품목 모두 있으면 이미 있다고 알림
  if (itemExists) {
    alert('⚠️ 이미 등록된 자산분류 및 품목입니다.');
    return;
  }

  let parentId = assetIdMap[catName] || null;

  try {
    // 3) 자산분류가 없으면 → 자산분류 먼저 등록
    if (!catExists) {
      console.log('[POST /asset-types] (parent) payload →', { name: catName, nationType: 'kr' });
           console.log('[자산분류 등록 요청]', {
               url: `${API_BASE}/asset-types`,
               payload: { name: catName, nationType: 'kr' }
             });
      const resParent = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, nationType: 'kr' }),
      });
      const jParent = await resParent.json();
      console.log('[응답 JSON] (parent)', jParent);
      if (jParent.code !== 1) throw new Error(jParent.message || '자산분류 등록 실패');
      parentId = jParent.data?.assetTypeId;
      setAssetMap(prev => ({ ...prev, [catName]: [] }));
      setAssetIdMap(prev => ({ ...prev, [catName]: parentId }));
      alert('✅ 자산분류가 먼저 등록되었습니다.');
    }

    // 2) 품목 등록
    if (!parentId) {
      const resH = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
      const jH = await resH.json();
      const list = jH.data?.parentList || [];
      const found = list.find(p => p.name === catName);
      console.log('[카테고리 검색결과]', found);
      parentId = found?.parentId; // <-- 여기!
      setAssetIdMap(prev => ({ ...prev, [catName]: parentId }));
      if (!parentId) throw new Error('parentId 찾기 실패');
    }
       console.log('[품목 등록 요청]', {
         url: `${API_BASE}/asset-types`,
           payload: { parentId, name: itemName, nationType: 'kr' }
         });
    console.log('[POST /asset-types] (child) payload →', { parentId, name: itemName, nationType: 'kr' });
    const resChild = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, name: itemName, nationType: 'kr' }),
    });
    const jChild = await resChild.json();
    console.log('[응답 JSON] (child)', jChild);
    if (jChild.code !== 1) throw new Error(jChild.message || '품목 등록 실패');

    setAssetMap(prev => ({
      ...prev,
      [catName]: [...(prev[catName] || []), itemName],
    }));
    setItem('');
    alert('✅ 품목 등록 완료');

  } catch (err) {
    console.error(err);
    alert(`❌ ${err.message || '등록 실패'}`);
  }
};




  /* ───────── UI ───────── */
  return (
    <div className="page-wrap">
      <h1>법인 및 자산 분류 등록</h1>

      {/* 입력 영역 */}
      <div className="card-wrap">
        <div className="card">
          <h2>🏢 법인 조직도 등록</h2>
          <select value={corp} onChange={e => setCorp(e.target.value)}>
            {Object.keys(corpMap).map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={dept} onChange={e => setDept(e.target.value)} placeholder="부서명(필수입력)" />
          <input value={loc}  onChange={e => setLoc(e.target.value)}  placeholder="세부위치 (필수입력)" />
          <button onClick={onAddCorp}>등록</button>

        </div>

        <div className="card">
          <h2>📦 자산분류 / 품목 등록</h2>
          <input value={cat}  onChange={e => setCat(e.target.value)}  placeholder="자산분류(필수입력)" />
          <input value={item} onChange={e => setItem(e.target.value)} placeholder="품목명(필수입력)" />
          <button onClick={onAddAsset}>등록</button>

        </div>
      </div>

      {/* 목록 영역 */}
      <div className="card-wrap">
        <div className="card">
          <h2>🏢 등록된 법인</h2>
          <TreeView
  data={corpMap}
  onEdit={handleEditNode}
  onDelete={handleDeleteNode}
  affId={affId}
  locationIdMap={locationIdMap}
/>
        </div>

        <div className="card">
          <h2>📦 등록된 품목</h2>
                    <TreeView
            data={assetMap}
            isAsset
            onEdit={handleEditNode}
            onDelete={handleDeleteNode}
          />
        </div>
      </div>
    </div>
  );
}


/* ───────── 트리 컴포넌트 ───────── */
function TreeView({ data, isAsset = false, onEdit, onDelete, affId, locationIdMap }) {

  if (isAsset) {
    return (
      <div className="tree asset-tree">
        <ul>
          {Object.entries(data).map(([cat, items]) => (
            <AssetNode key={cat} label={cat} onEdit={onEdit} onDelete={onDelete} level="cat">
              {items.map(it => (
                <li key={it} className="asset-leaf">
                  {it}
                  <span className="node-actions" onClick={e => e.stopPropagation()}>
                    <FiEdit2 size={12} className="edit-icon" onClick={() => onEdit(it, 'item', cat)} />
                    <FiTrash2 size={12} className="del-icon" onClick={() => onDelete(it, 'item', cat)} />
                  </span>
                </li>
              ))}
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


