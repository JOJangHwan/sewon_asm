import React, { useState, useEffect,useContext } from 'react';
import AssetListPanel from './AssetListPanel';
import './DualTransferSimple.css';
import { authFetchWithRefresh } from "../../utils/authFetchWithRefresh";
import { UserContext } from "../../utils/UserContext"; // 실제 경로 맞게!

const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";

export default function AssetTransferWithFilter() {
  const { user } = useContext(UserContext); // 유저정보 구조 확인!
  // ---- 상태 변수 ----
  const [companyData, setCompanyData] = useState({});
  const [companyIdMap, setCompanyIdMap] = useState({});
  const [companyList, setCompanyList] = useState([]);
  const [assetCategoryData, setAssetCategoryData] = useState({});
  const [assetCategoryMap, setAssetCategoryMap] = useState({});
  const [barcode, setBarcode] = useState('');

  // 필터
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [corporationId, setCorporationId] = useState(null);
  const [affiliationId, setAffiliationId] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [parentTypeId, setParentTypeId] = useState(null);
  const [childTypeId, setChildTypeId] = useState(null);

  // from/to (바코드 배열)
  const [fromItems, setFromItems] = useState([]);
  const [toItems, setToItems] = useState([]);
  const [selectedFrom, setSelectedFrom] = useState([]);

  // 오른쪽(이동대상)
  const [destCorp, setDestCorp] = useState('');
  const [destDept, setDestDept] = useState('');
  const [destLoc, setDestLoc] = useState('');

  const [viewCount, setViewCount] = useState(30); // 한 페이지에 보여줄 개수, 필요 시 input 연동

  // ---- LOOKUP API ----
  useEffect(() => {
    async function fetchLookups() {
      // 1) 법인/부서/위치
      const res = await authFetchWithRefresh(`${API_BASE_URL}/corporations`);
      const result = await res.json();
      if (result.code === 1 && result.data?.corporationList) {
        const nestedData = {};
        const idMap = {};
        //const names = [];
        const namesSet = new Set();
        result.data.corporationList.forEach(corp => {
          const corpName = corp.name;
          const corpId = corp.corporationId;
          //names.push(corpName);
          namesSet.add(corpName);
          nestedData[corpName] = {};
          idMap[corpName] = { id: corpId, departments: {} };
          corp.affiliationList.forEach(aff => {
            const deptName = aff.department;
            const deptId = aff.affiliationId;
            const locationList = aff.locations.map(loc => loc.location);
            const locationMap = {};
            aff.locations.forEach(loc => {
              locationMap[loc.location] = loc.locationId;
            });
            nestedData[corpName][deptName] = locationList;
            idMap[corpName].departments[deptName] = {
              id: deptId,
              locations: locationMap,
            };
          });
        });

        // console.log("======== [companyData] (회사→부서→위치) ========");
        // console.log(nestedData);
        // console.log("======== [companyIdMap] (회사별 ID/부서ID/위치ID) ========");
        // console.log(idMap);
        // console.log("======== [companyList] (회사명 배열) ========");
        // console.log(names);

        setCompanyData(nestedData);
       // setCompanyList(names);
        setCompanyList([...namesSet]);
        setCompanyIdMap(idMap);
      }

      // 2) 자산분류/품목
      const typeRes = await authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`);
      const typeResult = await typeRes.json();
      if (typeResult.code === 1 && typeResult.data?.parentList) {
        const nestedAssetType = {};
        const typeIdMap = {};
        typeResult.data.parentList.forEach(parent => {
          const parentName = parent.name;
          const parentId = parent.parentId;
          const children = Array.isArray(parent.childList) ? parent.childList : [];
          nestedAssetType[parentName] = children.map(child => child.name);
          typeIdMap[parentName] = { id: parentId, children: {} };
          children.forEach(child => {
            typeIdMap[parentName].children[child.name] = child.childId;
          });
        });
        setAssetCategoryData(nestedAssetType);
        setAssetCategoryMap(typeIdMap);
      }
    }
    fetchLookups();
  }, []);

  // ---- 바코드 단건 조회 ----
  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) {
      alert('바코드를 입력하세요.');
      return;
    }
    try {
      const url = `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcode.trim())}`;
      const res = await authFetchWithRefresh(url, { method: 'GET' });
      const resJson = await res.json();
      if (resJson.code !== 1 || !resJson.data) {
        alert('해당 바코드의 자산을 찾을 수 없습니다.');
        return;
      }
      const alreadyExists =
        fromItems.some(item => item.barcode === resJson.data.barcode) ||
        toItems.some(item => item.barcode === resJson.data.barcode);
      if (alreadyExists) {
        alert('이미 추가된 자산입니다.');
        setBarcode('');
        return;
      }
      setFromItems(items => [resJson.data, ...items]);
      setBarcode('');
    } catch (err) {
      console.error('[바코드조회 에러]', err);
      alert('바코드 조회 중 오류 발생!');
    }
  };

// ---- 페이징 조회 ----
// ---- 페이징 조회 ----
const handleSearch = async () => {
  // 1. 바코드 입력된 경우 → 단건 검색만 호출!
  if (barcode.trim()) {
    try {
      const url = `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(barcode.trim())}`;
      const res = await authFetchWithRefresh(url, { method: 'GET' });
      const resJson = await res.json();
      if (resJson.code !== 1 || !resJson.data) {
        alert('해당 바코드의 자산을 찾을 수 없습니다.');
        setFromItems([]);
        return;
      }
      // 이미 포함되어 있는지 검사
      const alreadyExists =
        fromItems.some(item => item.barcode === resJson.data.barcode) ||
        toItems.some(item => item.barcode === resJson.data.barcode);
      if (alreadyExists) {
        alert('이미 추가된 자산입니다.');
        setBarcode('');
        return;
      }
      setFromItems([resJson.data]);
      setBarcode('');
    } catch (err) {
      console.error('[바코드조회 에러]', err);
      alert('바코드 조회 중 오류 발생!');
    }
    return;
  }

  // 2. 바코드가 없는 경우 → 기존 페이징 조건 검색
  if (!corporationId || !affiliationId || !locationId) {
    alert('회사, 부서, 세부위치를 모두 선택해야 검색할 수 있습니다.');
    return;
  }
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("locationId", locationId);
    if (location) queryParams.append("location", location);
    if (childTypeId) queryParams.append("childTypeId", childTypeId);
    else if (parentTypeId) queryParams.append("parentTypeId", parentTypeId);
    queryParams.append("size", viewCount); // ← 여기가 추가됨!

    const url = `${API_BASE_URL}/assets/paged?${queryParams.toString()}`;
   // console.log("최종 전송 URL:", url);

    const res = await authFetchWithRefresh(url, { method: 'GET' });
    if (!res.ok) {
      alert('서버 오류 발생');
      return;
    }
    const resData = await res.json();
    if (resData.code !== 1) {
      alert(resData.message || '조회 실패');
      return;
    }
    const data = resData.data?.list || [];
    setFromItems(data.filter(a => !toItems.some(t => t.barcode === a.barcode)));
    setSelectedFrom([]);
  } catch (err) {
    alert('네트워크 오류!');
    console.error(err);
  }
};





  // ---- 이동처리 ----
  const moveToRight = async () => {
    if (selectedFrom.length === 0 || !destCorp || !destDept || !destLoc) {
      alert('이동할 품목, 회사/부서/세부위치를 선택하세요.');
      return;
    }
    const toLocationId = companyIdMap[destCorp]?.departments?.[destDept]?.locations?.[destLoc];
    if (!toLocationId) {
      alert('이관 대상 세부위치가 올바르지 않습니다.');
      return;
    }
  
    // 로그인 유저ID 가져오기
    const authUser = user?.id || user?.userId || user?.username;
  
    try {
      const moving = fromItems.filter(item => selectedFrom.includes(item.barcode));
      for (const asset of moving) {
      // 품목 전체 정보 콘솔 출력
     // console.log('------ [FROM 품목 전체 정보] ------');
     // console.log(asset);

      // 품목에 들어있는 법인/부서/위치 정보
     // console.log('FROM 법인:', asset.corporation);
     // console.log('FROM 부서:', asset.department);
     // console.log('FROM 세부위치:', asset.location);

      // TO(이동 후) 회사/부서/위치 정보
      //console.log('------ [TO(이동 후) 정보] ------');
     // console.log('회사:', destCorp, '부서:', destDept, '세부위치:', destLoc);

      // locationId 매핑 확인(실제 PK)
      const fromLocationId =
        companyIdMap[asset.corporation]?.departments?.[asset.department]?.locations?.[asset.location];
    //  console.log('FROM locationId:', fromLocationId);
    //  console.log('TO locationId:', toLocationId);
        
      const payload = {
        assetId: Number(asset.id),            // 반드시 숫자
        fromLocationId: Number(fromLocationId), // 반드시 숫자
        toLocationId: Number(toLocationId),     // 반드시 숫자
        //authUser: authUser                     // 이건 String/Number 등 서버에 맞게
      };
      //  console.log("[이관 전송 payload]", payload);
        

       // console.log(typeof payload.assetId);         // number
       // console.log(typeof payload.fromLocationId);  // number
       // console.log(typeof payload.toLocationId);    // number
  

  
        const res = await authFetchWithRefresh(
          `${API_BASE_URL}/assets/transmission`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const resJson = await res.json();
      //  console.log("[이관 응답]", resJson);
  
        if (!res.ok || resJson.code !== 1) {
          throw new Error(resJson.message || '이관 실패');
        }
      }
      setToItems([...toItems, ...moving]);
      setFromItems(fromItems.filter(item => !selectedFrom.includes(item.barcode)));
      setSelectedFrom([]);
      alert('이관 완료!');
    } catch (err) {
      alert('이관 중 오류: ' + err.message);
      console.error(err);
    }
  };
  
  
  

  // ---- Select 연동 ----
  useEffect(() => { setDepartment(""); setAffiliationId(null); setLocation(""); setLocationId(null); }, [company]);
  useEffect(() => { setLocation(""); setLocationId(null); }, [department]);
  useEffect(() => { setItemName(""); setChildTypeId(null); }, [assetCategory]);

  // ---- UI ----
  return (
    <div className="transfer-sketch-wrap">
      {/* ── 검색 영역 ───────────────────────── */}
      <div className="transfer-search-section">
        {/* 1행 : 필터 */}
        <div className="transfer-filter-row">
          <select value={company} onChange={e => {
            const v = e.target.value;
            setCompany(v);
            setCorporationId(companyIdMap[v]?.id || null);
          }}>
            <option value="">회사</option>
            {companyList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={department} onChange={e => {
            const v = e.target.value;
            setDepartment(v);
            const deptId = companyIdMap[company]?.departments?.[v]?.id;
            setAffiliationId(deptId || null);
          }}>
            <option value="">부서</option>
            {Object.keys(companyData[company] || {}).map(d => <option key={d}>{d}</option>)}
          </select>

          <select value={location} onChange={e => {
            const v = e.target.value;
            setLocation(v);
            const locId = companyIdMap[company]?.departments?.[department]?.locations?.[v];
            setLocationId(locId || null);
          }}>
            <option value="">세부위치</option>
            {(companyData[company]?.[department] || []).map(l => <option key={l}>{l}</option>)}
          </select>

          <select value={assetCategory} onChange={e => {
            const v = e.target.value;
            setAssetCategory(v);
            setParentTypeId(assetCategoryMap[v]?.id || null);
            setItemName('');
            setChildTypeId(null);
          }}>
            <option value="">자산분류</option>
            {Object.keys(assetCategoryData).map(a => <option key={a}>{a}</option>)}
          </select>

          <select value={itemName} onChange={e => {
            const v = e.target.value;
            setItemName(v);
            setChildTypeId(assetCategoryMap[assetCategory]?.children?.[v] || null);
          }}>
            <option value="">품명</option>
            {(assetCategoryData[assetCategory] || []).map(i => <option key={i}>{i}</option>)}
          </select>

             <input className="transfer-count-input"
            min={1}
            value={viewCount}
            onChange={e => setViewCount(Number(e.target.value))}
          />

          <button onClick={handleSearch} className="transfer-search-btn">검색</button>
        </div>

        {/* 2행 : 바코드 */}
        <div className="transfer-barcode-row">
          <input
            className="transfer-barcode-input"
            placeholder="바코드 입력"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBarcodeSearch()}
          />
          <button onClick={handleBarcodeSearch} className="transfer-barcode-btn">바코드조회</button>
        </div>
      </div>

      {/* ── 메인 영역 (좌/우 패널) ─────────────── */}
      <div className="transfer-main-row">
        {/* FROM */}
        <div className="transfer-col">
          <div className="col-title">이동할 품목 <span className="from-label">from</span></div>
          <AssetListPanel
            assets={fromItems}
            selected={selectedFrom}
            setSelected={setSelectedFrom}
          />
        </div>

        {/* 화살표 */}
        <div className="transfer-arrow-btns">
        <button
  className="arrow-btn"
  data-tip="from과 to를 다 선택해야지 클릭이 됩니다."
  
  onClick={moveToRight}
  disabled={selectedFrom.length === 0 || !destCorp || !destDept || !destLoc}
>
            <svg width="54" height="54" viewBox="0 0 36 36">
              <path
                d="M9 18h18M21 12l6 6-6 6"
                fill="none"
                stroke="#222"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* TO */}
        <div className="transfer-col">
          <div className="col-title">이동한 품목 <span className="to-label">to</span></div>
          {/* ▼▼▼  TO 위치 선택 Select 세트  ▼▼▼ */}
<div className="transfer-to-select-row" style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
  {/* ── 회사 ── */}
  <select
    value={destCorp}
    onChange={e => {
      const corp = e.target.value;
      setDestCorp(corp);
      setDestDept('');   // 회사가 바뀌면 부서/위치 초기화
      setDestLoc('');
    }}
  >
    <option value="">회사</option>
    {companyList.map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>

  {/* ── 부서 ── */}
  <select
    value={destDept}
    onChange={e => {
      const dept = e.target.value;
      setDestDept(dept);
      setDestLoc('');    // 부서가 바뀌면 위치 초기화
    }}
    disabled={!destCorp}
  >
    <option value="">부서</option>
    {Object.keys(companyData[destCorp] || {}).map(d => (
      <option key={d} value={d}>{d}</option>
    ))}
  </select>

  {/* ── 세부위치 ── */}
  <select
    value={destLoc}
    onChange={e => setDestLoc(e.target.value)}
    disabled={!destDept}
  >
    <option value="">세부위치</option>
    {(companyData[destCorp]?.[destDept] || []).map(l => (
      <option key={l} value={l}>{l}</option>
    ))}
  </select>
</div>
{/* ▲▲▲  TO 위치 선택 끝  ▲▲▲ */}

        </div>
      </div>
    </div>
  );
}