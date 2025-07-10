
// src/components/asset/AssetSearchPanel.js
import React, { useEffect, useMemo, useState } from "react";
import "./AssetSearchPanel.css";
import { authFetchWithRefresh } from "../../../utils/authFetchWithRefresh";
import { useContext } from "react";
import { UserContext } from "../../../utils/UserContext";

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

  const { user } = useContext(UserContext);
  /* ----------------------- 초기 데이터 로딩 ----------------------- */
  
  useEffect(() => {
    if (!isOpen) return;
  
    const fetchData = async () => {
      try {
        // ① 자산 유형 불러오기
        const res1 = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`);
        const json1 = await res1.json();
        if (json1.code === 1) setParentTypes(json1.data.parentList);
  
        // ② 법인 불러오기
        const res2 = await authFetchWithRefresh(`${API_BASE_URL}/corporations`);
        const json2 = await res2.json();
  
        if (json2.code === 1) {
          const corpList = json2.data.corporationList || [];
          setCorporations(corpList);
  
 
         const matched = corpList.find(c => c.name === user?.company);
          if (matched) {
           setCorporationId(matched.corporationId); // 🔐 문자열 비교 후 ID 저장
            const matchedAff = matched.affiliationList.find(a => a.department === user?.department);
 if (matchedAff) {
   setAffiliationId(matchedAff.affiliationId);
}
          }
        }
  
      } catch (e) {
        console.error("초기 데이터 로딩 오류", e);
      }
    };
  
    fetchData();
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
    //console.log("법인 응답 status:", res.status);
    //console.log("법인 응답 body:", raw);


  
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
       // console.log("▶ corpId:", corporationId, " / affiliations:", result);
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
    //console.log("🧪 검색조건 locationName:", locationName);
    setLoading(true);
    try {
      /* ① 바코드 검색 우선 */
      // if (barcode.trim()) {
      //   const res  = await authFetchWithRefresh(
      //     `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcode.trim())}`
      //   );
      //   const json = await res.json();
      //   setAssets(json.code === 1 && json.data ? [json.data] : []);
      //   return;
      // }

      /* ② 조건별 페이징 검색 */
      const params = new URLSearchParams();
      if (locationId)   params.append("locationId", locationId);     // ✅ ID 기반 전송
      if (parentId)     params.append("parentTypeId", parentId);
      if (childId)      params.append("childTypeId", childId);
      //params.append("size", 50);

      const res  = await authFetchWithRefresh(
        `${API_BASE_URL}/assets/paged/rental/enabled?${params.toString()}`
      );
      const json = await res.json();
      setAssets(json.code === 1 ? json.data.list : []);
    } catch (e) {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------- 렌더링 ----------------------- */
  if (!isOpen) return null;

  return (
    <div className="asp-slide-panel">
      <div className="asp-header">
        <h3>자산 검색</h3>
        <button className="asp-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="asp-body">
        {/* ---------- 필터 선택 ---------- */}
        <div className="asp-filters">


          {/* 회사 */}
                    {/* ---------------- 회사(법인) 선택 ---------------- ⭐ NEW */}
                    <input
  type="text"
  value={
    corporations.find(c => String(c.corporationId) === String(corporationId))?.name || ''
  }
  readOnly
  style={{
    backgroundColor: '#f1f1f1',
    border: '1px solid #ccc',
    borderRadius: '4px',
    height: '36px',
    padding: '0 10px',
    fontSize: '14px',
  }}
/>


          {/* ---------------- 부서 선택 ---------------------- ⭐ NEW */}
          <select
  value={affiliationId}
  onChange={e => {
    setAffiliationId(e.target.value);
    setLocationId("");
  }}
  disabled={!corporationId}
>
  <option value="">부서 선택</option>
 {(affiliations || [])
   .filter(a => a.department !== user?.department) // ✅ 내 부서 제외
   .map(a => (
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
        </div>

        {/* ---------- 바코드 검색 ---------- */}
        {/* <div className="asp-search-box">
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
        </div> */}

<div className="asp-search-box">
  {/* 
  <input
    type="text"
    placeholder="바코드 검색"
    value={barcode}
    onChange={e => setBarcode(e.target.value)}
    onKeyDown={e => e.key === "Enter" && handleSearch()}
  />
  */}
  <button
    onClick={handleSearch}
    disabled={!locationId} // ← locationId 없으면 비활성
  >
    🔍
  </button>
</div>
        

        {/* ---------- 결과 테이블 ---------- */}
        <table className="asp-table">
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
                      className="asp-select-btn"
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
