// src/components/asset/AssetSearchPanel.js
import React, { useEffect, useMemo, useState } from "react";
import "./AssetSearchPanel.css";
import { authFetchWithRefresh } from "../../../utils/authFetchWithRefresh";

const API_BASE_URL =
  window._env_?.REACT_APP_API_URL || "http://localhost:8888";

export default function AssetSearchPanel({ isOpen, onClose, onSelect }) {
  /* ----------------------- 로컬 상태 ----------------------- */
  const [parentTypes, setParentTypes] = useState([]);          // [{id, name, children:[{id,name}]}]
  //const [locations, setLocations]   = useState([]);            // [{id,name}]
  const [assets, setAssets]         = useState([]);            // 조회 결과
  const [loading, setLoading]       = useState(false);

  // 회사필터 상태
  const [corporations, setCorporations] = useState([]);
  const [corporationId, setCorporationId] = useState("");
  const [affiliationId, setAffiliationId] = useState("");

  /* 필터 입력 */
  const [parentId,  setParentId]    = useState("");
  const [childId,   setChildId]     = useState("");
  const [locationId,setLocationId]  = useState("");
  const [barcode,   setBarcode]     = useState("");

  //이름상태
  const [locationName, setLocationName] = useState("");
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  /* ----------------------- 초기 데이터 로딩 ----------------------- */
  useEffect(() => {
    if (!isOpen) return;                         // 패널이 열릴 때마다 한 번만
    /* 1) 자산 유형 계층                                                    */
    
    (async () => {
      try {
        const res  = await authFetchWithRefresh(
          `${API_BASE_URL}/asset-types/hierarchy`
        );
        const json = await res.json();
        if (json.code === 1) setParentTypes(json.data.parentList);
      } catch (e) {
        console.error("자산 유형 로딩 오류", e);
      }
    })();

   /* 2) 법인 트리 불러오기 --------------------------------------- ⭐ NEW */
   (async () => {
    try {
      const res = await authFetchWithRefresh(`${API_BASE_URL}/corporations`);
      const json = await res.json();
      if (json.code === 1) {
        console.log("✅ 전체 corporation 응답:", JSON.stringify(json.data.corporationList, null, 2));
        setCorporations(json.data.corporationList || []);
      }
    } catch (err) {
      console.error("법인 불러오기 오류 ❗", err);
    }
  })();


  }, [isOpen]);

  const loadCorporations = async () => {
    const res = await fetch(`${API_BASE_URL}/corporations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}) // ← 문자열 "{}"과 동일
    });
  
    const raw = await res.text();
    console.log("법인 응답 status:", res.status);
    console.log("법인 응답 body:", raw);


  
    if (!res.ok) {
      throw new Error(`법인 조회 실패: ${res.status}`);
    }
  
    const json = JSON.parse(raw);
    return json;
  };

  /* ----------------------- 파생 값 ----------------------- */
  const childOptions = useMemo(() => {
    const parent = parentTypes.find(p => p.parentId === Number(parentId));
    return parent ? parent.childList : [];
  }, [parentId, parentTypes]);

    // ⭐ NEW: 부서·세부위치 파생값
    const affiliations = useMemo(() => {
        const result =
        corporations.find(c => c.corporationId === Number(corporationId))
            ?.affiliationList || [];
        console.log("▶ corpId:", corporationId, " / affiliations:", result);
        return result;
    }, [corporationId, corporations]);
    const locations = useMemo(() => {
      return (
        // affiliations.find(a => a.affiliationId === Number(affiliationId))
        affiliations.find(a => String(a.affiliationId) === String(affiliationId))
          ?.locations || []
      );
    }, [affiliationId, affiliations]);

  /* ----------------------- 검색 ----------------------- */
  const handleSearch = async () => {
    console.log("🧪 검색조건 locationName:", locationName);
    setLoading(true);
    try {
      /* ① 바코드 검색 우선 */
      if (barcode.trim()) {
        const res  = await authFetchWithRefresh(
          `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcode.trim())}`
        );
        const json = await res.json();
        setAssets(json.code === 1 && json.data ? [json.data] : []);
        return;
      }

      /* ② 조건별 페이징 검색 */
      const params = new URLSearchParams();
      if (locationId)   params.append("locationId", locationId);     // ✅ ID 기반 전송
      if (parentId)     params.append("parentTypeId", parentId);
      if (childId)      params.append("childTypeId", childId);
      params.append("size", 50);

      const res  = await authFetchWithRefresh(
        `${API_BASE_URL}/assets/paged?${params.toString()}`
      );
      const json = await res.json();
      setAssets(json.code === 1 ? json.data.list : []);
    } catch (e) {
      console.error("자산 검색 오류", e);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------- 렌더링 ----------------------- */
  if (!isOpen) return null;

  return (
    <div className="slide-panel">
      <div className="panel-header">
        <h3>자산 검색</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-body">
        {/* ---------- 필터 선택 ---------- */}
        <div className="filters">
          {/* 대분류(자산 유형) */}
          <select
  value={parentId}
  onChange={e => {
    const selected = parentTypes.find(p => p.parentId === Number(e.target.value));
    setParentId(e.target.value);
    setChildId("");
    setParentName(selected?.name || ""); // ✅ 이름 저장
    setChildName("");
  }}
>
  <option value="">자산분류(대분류)</option>
  {(parentTypes || []).map(p => (
  <option key={p.parentId} value={p.parentId}>{p.name}</option>
))}
</select>

          {/* 중분류(품목) */}
          <select
  value={childId}
  onChange={e => {
    const selected = childOptions.find(c => c.childId === Number(e.target.value));
    setChildId(e.target.value);
    setChildName(selected?.name || "");  // ✅ 이름 저장
  }}
  disabled={!parentId}
>
  <option value="">품목(중분류)</option>
  {(childOptions || []).map(c => (
  <option key={c.childId} value={c.childId}>{c.name}</option>
))}
</select>

          {/* 회사 */}
                    {/* ---------------- 회사(법인) 선택 ---------------- ⭐ NEW */}
          <select value={corporationId} onChange={e => {
         setCorporationId(e.target.value);
            setAffiliationId("");
            setLocationId("");
          }}>
            <option value="">회사 선택</option>


             {corporations.map(c => (
   <option key={c.corporationId} value={c.corporationId}>
    {c.name}
   </option>
 ))}
          </select>

          {/* ---------------- 부서 선택 ---------------------- ⭐ NEW */}
          <select value={affiliationId} onChange={e => {
            setAffiliationId(e.target.value);
            setLocationId("");
          }} disabled={!corporationId}>
            <option value="">부서 선택</option>
            {(affiliations || []).map(a => (
  <option key={a.affiliationId} value={a.affiliationId}>
    {a.department}
  </option>
))}
          </select>

          {/* ---------------- 세부위치 선택 ------------------- ⭐ NEW */}
          <select

  value={String(locationId)}                                  // NaN 경고 방지
  onChange={e => {
   const selected = locations.find(
      l => l.locationId === Number(e.target.value)
    );
    setLocationId(e.target.value);        // 문자열 그대로
    setLocationName(selected?.location || ""); // ✅ 이름 저장
  }}
  disabled={!affiliationId}
>
  <option value="">세부위치 선택</option>
  {(locations || []).map(l => (
    <option key={l.locationId} value={l.locationId}>
      {l.location}
    </option>
  ))}
</select>
        </div>

        {/* ---------- 바코드 검색 ---------- */}
        <div className="search-box">
          <input
            type="text"
            placeholder="바코드 검색"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button
  onClick={handleSearch}
  disabled={!barcode.trim() && !locationId}   // ← 세부위치 없으면 비활성
>
  🔍
</button>
        </div>

        {/* ---------- 결과 테이블 ---------- */}
        <table className="asset-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>바코드</th>
              <th>세부위치</th>
              <th>자산상태</th>
              <th>등록자</th>
              <th>선택</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* 로딩 스피너 대신 단순 문구 – 필요하면 CSS로 스피너 교체 */
              <tr><td colSpan={6} style={{textAlign:"center"}}>로딩 중...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:"center"}}>검색 결과가 없습니다</td></tr>
            ) : (
              assets.map((asset, idx) => (
                <tr key={asset.id}>
                  <td>{idx + 1}</td>
                  <td>{asset.barcode}</td>
                  <td>{asset.location}</td>
                  <td>{asset.status}</td>
                  <td>{asset.registerName}</td>
                  <td>
                    <button
                      className="select-btn"
                      onClick={() => onSelect(asset)}
                    >
                      선택
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
