/*  src/pages/BasicDataPage/BasicDataPage.jsx */
import React, { useEffect, useState } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
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

  const [corp, setCorp] = useState('');
  const [dept, setDept] = useState('');
  const [loc , setLoc ] = useState('');
  const [cat , setCat ] = useState('');
  const [item, setItem] = useState('');
    /* ───────── 트리 노드 수정/삭제 핸들러 ───────── */
    const handleEditNode = (label, level) => {
      console.log('[편집]', label, level);           // level: 'corp' | 'dept' | 'loc' | 'cat' | 'item'
      // TODO: 모달 열어서 새 이름 입력 → PUT → state 갱신
    };
  
    const handleDeleteNode = async (label, level) => {
      if (!window.confirm(`${label}을(를) 삭제할까요?`)) return;
      console.log('[삭제]', label, level);
      // TODO: DELETE 호출 → state 갱신
    };



  /* ───────── 최초 로드 ───────── */
  useEffect(() => {
    (async () => {
      try {
        /* 1) 법인/부서/위치 */
        const r1 = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const j1 = await r1.json();
        if (j1.code === 1 && Array.isArray(j1.data?.corporationList)) {
          const cMap = {}, idMap = {}, aMap = {};
          j1.data.corporationList.forEach(co => {
            idMap[co.name] = co.corporationId;
            cMap[co.name]  = {};
            aMap[co.name]  = {};
            (co.affiliationList || []).forEach(af => {
              cMap[co.name][af.department] = (af.locations || []).map(l => l.location);
              aMap[co.name][af.department]  = af.affiliationId;
            });
          });
          setCorpMap(cMap); setCorpId(idMap); setAffId(aMap);
          setCorp(Object.keys(cMap)[0] || '');
        }

        /* 2) 자산 분류/품목 */
        const r2 = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
        const j2 = await r2.json();
        console.log('[응답 전체] (asset-types/hierarchy)', j2);
        if (j2.code === 1 && Array.isArray(j2.data?.parentList)) {
          const aName = {}, aId = {};
        
          j2.data.parentList.forEach(p => {
            const categoryName = p.name;
            const categoryId   = p.assetTypeId       // ↩︎ 백엔드마다 다를 수 있어 둘 다 체크
                             ?? p.parentId;          // ← 여기가 핵심!
            const itemNames    = (p.childList || []).map(c => c.name);
        
            aName[categoryName] = itemNames;
            aId[categoryName]   = categoryId;        // ✅ 올바른 ID 저장
          });
        
          setAssetMap(aName);
          setAssetIdMap(aId);                        // ← 이제 undefined 아닙니다
        }
      } catch (err) {
        console.warn('[서버 응답 실패] 기본값 없이 동작', err);
      }
    })();
  }, []);

  /* ───────── 부서/위치 등록 ───────── */
  const onAddCorp = async () => {
    const corpNm = corp.trim();
    const deptNm = dept.trim();
    const locNm  = loc.trim();
    if (!corpNm || !deptNm) return alert('회사·부서명을 모두 입력하세요.');
  
    const wantLoc = locNm !== '';
  
    // 이미 존재하는지 중복 검사
    if (!wantLoc && corpMap[corpNm]?.[deptNm]) {
      alert('⚠️ 이미 등록된 부서입니다.'); return;
    }
    if (wantLoc && corpMap[corpNm]?.[deptNm]?.includes(locNm)) {
      alert('⚠️ 이미 등록된 세부위치입니다.'); return;
    }

    /* (2) 부서 ID 확보 ─ 없으면 먼저 POST /affiliations */
    let affiliationId = affId[corpNm]?.[deptNm];
    if (!affiliationId) {
      try {
        console.log('[POST /affiliations] →', { corporationId: corpId[corpNm], department: deptNm });
        const res = await authFetchWithRefresh(`${API_BASE}/affiliations`, {
          method : 'POST',
          headers: { 'Content-Type':'application/json' },
          body   : JSON.stringify({ corporationId: corpId[corpNm], department: deptNm })
        });
        const j = await res.json();
        console.log('[응답]', j);
        if (j.code !== 1) throw new Error(j.message);
  
        affiliationId = j.data?.affiliationId;          // 응답에서 먼저 시도
  
        // 응답에 id 가 없으면 /corporations 재조회
        if (!affiliationId) {
          console.log('🔄 id 없음 → /corporations 재조회');
          const rc = await authFetchWithRefresh(`${API_BASE}/corporations`);
          const jc = await rc.json();
          const found = jc.data?.corporationList
            ?.find(c => c.corporationId === corpId[corpNm])
            ?.affiliationList
            ?.find(a => a.department === deptNm);
          affiliationId = found?.affiliationId;
        }
  
        if (!affiliationId) {                       // 다시 시도해도 못 얻으면 여기서 종료
          alert('✅ 부서는 등록됐지만 ID를 찾지 못했습니다.\n세부위치는 다시 시도해 주세요.');
          setDept(''); setLoc('');
          return;
        }
  
        // 부서 state 동기화
        setAffId(prev  => ({ ...prev,
          [corpNm]: { ...(prev[corpNm] || {}), [deptNm]: affiliationId }}));
        setCorpMap(prev => ({ ...prev,
          [corpNm]: { ...(prev[corpNm] || {}), [deptNm]: [] }}));
        alert('✅ 부서가 등록되었습니다.');
      } catch (err) {
        console.error(err);
        alert('❌ 부서 등록 실패'); return;
      }
    }

    /* (3) 세부위치가 있으면 POST /locations */
        /* ➊ 위치 입력이 없으면 바로 종료 ---------------- */
        if (!wantLoc) return;
    
        /* ➋ affiliationId 못 받았으면 에러 메시지 후 종료 -- */
        if (!affiliationId) {
          console.error('❌ affiliationId 없음 – locations POST 중단');
          alert('❌ 세부위치 등록 실패 (부서 ID를 찾지 못했습니다)');
          return;
        }
    
        /* ➌ 여기까지 오면 ID 확보 → POST /locations ------ */
              /* === 콘솔 체크 ②: locations 요청 직전 === */
                console.log('[POST /locations] payload →', {
                  affiliationId,
                  location: locNm
                });
      try {
        const r = await authFetchWithRefresh(`${API_BASE}/locations`, {
          method : 'POST',
          headers: { 'Content-Type':'application/json' },
          body   : JSON.stringify({ affiliationId, location: locNm })
        });
        const j = await r.json();
        if (j.code !== 1) throw new Error(j.message);

        /* state 동기화(위치 추가) */
        setCorpMap(prev => {
          const next = { ...prev };
          next[corpNm][deptNm] = next[corpNm][deptNm] || [];
          if (!next[corpNm][deptNm].includes(locNm)) next[corpNm][deptNm].push(locNm);
          return next;
        });
        alert('✅ 세부위치 등록 완료');
      } catch (err) {
        console.error(err);
        alert('❌ 세부위치 등록 실패');
      }


      

       
           /* (4) 입력칸 초기화 */
           setDept('');
           setLoc('');

        };          /* ✓ onAddCorp 는 여기서 한 번만 닫히면 충분 */

  /* ───────── 자산 분류/품목 등록 ───────── */
 // ───────── 자산분류 / 품목 등록 ─────────
 const onAddAsset = async () => {
  const catName  = cat.trim();
  const itemName = item.trim();

  if (!catName) return alert('자산분류를 입력하세요.');

  const catExists = Object.prototype.hasOwnProperty.call(assetMap, catName);

  /* ── 1) 자산분류만 입력 ─────────────────── */
  if (!itemName) {
    if (catExists) return alert('⚠️ 이미 등록된 자산분류입니다.');
       // ─── LOG: 부모분류 POST 직전 ─────────────────────
   console.log('[POST /asset-types] (parent) payload →',
               { name: catName, nationType:'kr' });

    try {
      const res = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ name: catName, nationType:'kr' })
      });
           // ─── LOG: 부모분류 응답 ─────────────────────────
     console.log('[응답] (parent)', res);
      const j = await res.json();
      console.log('[응답 JSON] (parent)', j);
      if (j.code !== 1) throw new Error(j.message);

      setAssetMap(prev => ({ ...prev, [catName]: [] }));
      setCat('');
      alert('✅ 자산분류 등록 완료');
    } catch (err) {
      console.error(err);
      alert('❌ 자산분류 등록 실패');
    }
    return;
  }

  /* ── 2) 자산분류 + 품목 입력 ──────────────── */
  if (catExists && assetMap[catName].includes(itemName)) {
    return alert('⚠️ 이미 등록된 품목입니다.');
  }

  let parentId = assetIdMap[catName] || null;

  try {
    /* ②-A. 분류가 없으면 부모부터 생성 */
    if (!catExists) {
           console.log('[POST /asset-types] (parent) payload →',
               { name: catName, nationType:'kr' });
      const resParent = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
        method : 'POST',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({ name: catName, nationType:'kr' })
      });
          console.log('[응답] (parent)', resParent);
      const jParent = await resParent.json();
    console.log('[응답 JSON] (parent)', jParent);
      if (jParent.code !== 1) throw new Error(jParent.message || '자산분류 등록 실패');

      parentId = jParent.data?.assetTypeId;
      alert('✅ 자산분류가 먼저 등록되었습니다.');
      setAssetMap(prev => ({ ...prev, [catName]: [] }));   // 새 분류 추가
      setAssetIdMap(prev => ({ ...prev, [catName]: parentId }));
    }

    /* ②-B. 여전히 parentId 없으면 hierarchy 재조회 */
    if (!parentId) {
      setAssetIdMap(prev => ({ ...prev, [catName]: parentId }));
      console.log('[GET /asset-types/hierarchy] 요청');
      const resH = await authFetchWithRefresh(`${API_BASE}/asset-types/hierarchy`);
      console.log('[응답] (hierarchy)', resH);
      const jH   = await resH.json();
      console.log('[응답 JSON] (hierarchy)', jH);
      if (jH.code !== 1) throw new Error('hierarchy 재조회 실패');

      const list = jH.data?.parentList || jH.data?.list || [];
      parentId   = list.find(p => p.name === catName)?.assetTypeId;
      if (!parentId) throw new Error('parentId 찾기 실패');
    }

    /* ②-C. 품목 POST */
      console.log('[POST /asset-types] (child) payload →',
              { parentId, name:itemName, nationType:'kr' });
    const resChild = await authFetchWithRefresh(`${API_BASE}/asset-types`, {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ parentId, name:itemName, nationType:'kr' })
    });
      console.log('[응답] (child)', resChild);
    const jChild = await resChild.json();
  console.log('[응답 JSON] (child)', jChild);
    if (jChild.code !== 1) throw new Error(jChild.message || '품목 등록 실패');

    /* ②-D. state 동기화 */
    setAssetMap(prev => ({
      ...prev,
      [catName]: [...(prev[catName] || []), itemName]
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
          <input value={dept} onChange={e => setDept(e.target.value)} placeholder="부서명" />
          <input value={loc}  onChange={e => setLoc(e.target.value)}  placeholder="세부위치 (선택)" />
          <button onClick={onAddCorp}>등록</button>
          <button >수정</button>
          <button >삭제</button>
        </div>

        <div className="card">
          <h2>📦 자산분류 / 품목 등록</h2>
          <input value={cat}  onChange={e => setCat(e.target.value)}  placeholder="자산분류" />
          <input value={item} onChange={e => setItem(e.target.value)} placeholder="품목명" />
          <button onClick={onAddAsset}>등록</button>
          <button >수정</button>
          <button >삭제</button>
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
function TreeView({ data, isAsset = false, onEdit, onDelete }) {
  if (isAsset) {
    /* 📦 자산분류 / 품목 트리  */
    return (
      <div className="tree asset-tree">
        <ul>
          {Object.entries(data).map(([cat, items]) => (
             <AssetNode key={cat} label={cat} onEdit={onEdit} onDelete={onDelete} level="cat">
              {items.map(it => (
                         <li key={it} className="asset-leaf">
                           {it}
                           {/* 품목 삭제 아이콘 */}
                           <span className="node-actions" onClick={e => e.stopPropagation()}>
                             <FiMinus size={12} className="del-icon"
                               onClick={() => onDelete(it, 'item')} />
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
                 <TreeNode key={dName} label={dName}
                           onEdit={onEdit} onDelete={onDelete} level="dept">
                {locs.map(l => (
                   <TreeNode key={l} label={l}
                   onEdit={onEdit} onDelete={onDelete} level="loc" />
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
function TreeNode({ label, children, defaultOpen = false,
                   onEdit, onDelete, level }) {
  const [open, setOpen] = useState(defaultOpen);
  const isLeaf = !children || (Array.isArray(children) && children.length === 0);

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

       {/* ✏️/🗑️ 아이콘 (hover 시 표시) */}
       <span className="node-actions" onClick={e => e.stopPropagation()}>
          <FiPlus  size={12} className="edit-icon" onClick={() => onEdit(label, level)} />
         <FiMinus size={12} className="del-icon"  onClick={() => onDelete(label, level)} />
       </span>
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
        onClick={() => setOpen(o => !o)}
      >
        <span className="toggle-icon">
          {open ? <FiMinus size={12} /> : <FiPlus size={12} />}
        </span>
                {label}
        <span className="node-actions" onClick={e => e.stopPropagation()}>
          <FiPlus  size={12} className="edit-icon" onClick={() => onEdit(label, level)} />
         <FiMinus size={12} className="del-icon"  onClick={() => onDelete(label, level)} />
       </span>
        
      </div>
      {open && <ul>{children}</ul>}
    </li>
  );
}
