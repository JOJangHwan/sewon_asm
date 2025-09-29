import React from "react";
import { useTranslation } from "react-i18next";
import { authFetchWithRefresh } from "../utils/authFetchWithRefresh";
import "./asset-registrar-change.css";

const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";

/* ============ API (동일) ============ */
const defaultApi = {
  async fetchAssets(){ return []; },
  async fetchUsers(){
    try {
      const res = await authFetchWithRefresh(`${API_BASE_URL}/account`, { method: "GET" });
      const j = await res.json();
      console.log("[GET /account] raw:", j);
      const list = Array.isArray(j?.data?.responses) ? j.data.responses : [];
      const mapped = list
        .map((a, i) => ({
          id: String(a.id ?? a.accountId ?? i),
          name: a.name ?? a.username ?? "",
          username: a.username ?? "",
          affiliationId: a.affiliationId ?? null,
          role: a.role ?? "",
        }))
        .filter(u => u.id && u.name);
      console.log("[GET /account] mapped:", mapped);
      return mapped;
    } catch (e) {
      console.error("[GET /account] failed:", e);
      return [];
    }
  },
  async fetchDepartments(){ return []; },
  async bulkUpdateAssets({ assetIds = [], newRegistrarId }) {
    const payload = {
      ids: assetIds.map(n => Number(n)).filter(n => Number.isFinite(n)),
      accountId: Number(newRegistrarId),
    };
    console.log("[PATCH /asset/register] payload:", payload);
    const res = await authFetchWithRefresh(`${API_BASE_URL}/assets/register`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    console.log("[PATCH /asset/register] response:", json);
    return { updated: payload.ids.length, raw: json };
  },
};

/* ============ 유틸 ============ */
const uniqSorted = (arr) => [...new Set(arr)].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
const getUserById = (users, id) => users.find((u) => String(u.id) === String(id));

/* ============ Core: 한 화면(웹/PDA 공용 로직) ============ */
 function AssetRegistrarChangeCore({ mode = "auto", api = defaultApi }) {
  const { t } = useTranslation('assetRegistrarChange');
  // Search 컴포넌트와 같은 로직
  const variant = useResponsiveMode(mode);   // 'web' | 'pda'
  const isPDA = variant === "pda";
  const [q, setQ] = React.useState("");
  const [fCompany, setFCompany] = React.useState("");
  const [fDept, setFDept] = React.useState("");
  const [fLoc, setFLoc] = React.useState("");
  const [fCat, setFCat] = React.useState("");
  const [fItem, setFItem] = React.useState("");

  const [affIndex, setAffIndex] = React.useState({});

  const [companyData, setCompanyData] = React.useState({});
  const [companyIdMap, setCompanyIdMap] = React.useState({});
  const [assetCategoryData, setAssetCategoryData] = React.useState({});
  const [assetCategoryMap, setAssetCategoryMap] = React.useState({});

  const [corporationId, setCorporationId] = React.useState(null);
  const [affiliationId, setAffiliationId] = React.useState(null);
  const [locationId, setLocationId] = React.useState(null);
  const [parentTypeId, setParentTypeId] = React.useState(null);
  const [childTypeId, setChildTypeId] = React.useState(null);

  const [assets, setAssets] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [newCompany, setNewCompany] = React.useState("");
  const [newDept, setNewDept] = React.useState("");
  const [newRegistrarId, setNewRegistrarId] = React.useState("");

  const registrarOptions = React.useMemo(() => {
    let arr = users;
    if (newCompany) {
      const depMap = companyIdMap[newCompany]?.departments || {};
      const allowedAffIds = new Set(Object.values(depMap).map(d => d.id));
      arr = arr.filter(u => u.affiliationId && allowedAffIds.has(u.affiliationId));
    }
    if (newDept) {
      const depId = companyIdMap[newCompany]?.departments?.[newDept]?.id;
      if (depId) arr = arr.filter(u => u.affiliationId === depId);
    }
    return arr;
  }, [users, newCompany, newDept, companyIdMap]);

  const [deptOptions, setDeptOptions] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());

  const [toastMsg, setToastMsg] = React.useState("");
  const dlgRef = React.useRef(null);
  const notify = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 1800); };

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [uRes, corpRes, typeRes] = await Promise.all([
          api.fetchUsers(),
          authFetchWithRefresh(`${API_BASE_URL}/corporations`),
          authFetchWithRefresh(`${API_BASE_URL}/asset-types/hierarchy`),
        ]);
        setUsers(uRes || []);

        const corpJson = await corpRes.json();
        if (corpJson.code === 1 && corpJson.data?.corporationList) {
          const nested = {};
          const idMap  = {};
          const idx    = {};
          corpJson.data.corporationList.forEach(corp => {
            nested[corp.name] = {};
            idMap[corp.name]  = { id: corp.corporationId, departments: {} };
            corp.affiliationList.forEach(aff => {
              const locList = aff.locations.map(l => l.location);
              const locMap  = {};
              aff.locations.forEach(l => { locMap[l.location] = l.locationId; });
              nested[corp.name][aff.department] = locList;
              idMap[corp.name].departments[aff.department] = {
                id: aff.affiliationId, locations: locMap,
              };
              idx[aff.affiliationId] = { corp: corp.name, corpId: corp.corporationId, dept: aff.department };
            });
          });
          setCompanyData(nested);
          setCompanyIdMap(idMap);
          setAffIndex(idx);
        } else {
          notify(t('AssetRegistrarChange_Error_LoadCorpInfoFailed'));
        }

        const typeJson = await typeRes.json();
        if (typeJson.code === 1 && typeJson.data?.parentList) {
          const nested = {};
          const idMap  = {};
          typeJson.data.parentList.forEach(p => {
            const children = Array.isArray(p.childList) ? p.childList : [];
            nested[p.name] = children.map(c => c.name);
            idMap[p.name]  = { id: p.parentId, children: {} };
            children.forEach(c => { idMap[p.name].children[c.name] = c.childId; });
          });
          setAssetCategoryData(nested);
          setAssetCategoryMap(idMap);
        } else {
          notify(t('AssetRegistrarChange_Error_LoadCategoryItemFailed'));
        }
      } catch (e) {
        notify(e?.message || t('AssetRegistrarChange_Error_InitialLoadFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const companies   = React.useMemo(() => Object.keys(companyData), [companyData]);
  const departments = React.useMemo(() => Object.keys(companyData[fCompany] || {}), [companyData, fCompany]);
  const locations   = React.useMemo(() => (companyData[fCompany]?.[fDept] || []), [companyData, fCompany, fDept]);
  const categories  = React.useMemo(() => Object.keys(assetCategoryData), [assetCategoryData]);
  const items       = React.useMemo(() => (assetCategoryData[fCat] || []), [assetCategoryData, fCat]);

  const list = assets;

  const headerChecked = list.length > 0 && list.every((a) => selected.has(a.id));
  const headerIndeterminate = !headerChecked && list.some((a) => selected.has(a.id));
  const headerRef = React.useRef(null);
  React.useEffect(() => { if (headerRef.current) headerRef.current.indeterminate = headerIndeterminate; }, [headerIndeterminate]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      let result = [];

      if (q.trim()) {
        const url = `${API_BASE_URL}/assets/barcode?value=${encodeURIComponent(q.trim())}`;
        const res = await authFetchWithRefresh(url);
        const json = await res.json();
        if (json.code !== 1 || !json.data) {
          notify(t('AssetRegistrarChange_Error_BarcodeNotFound'));
          setAssets([]); setSelected(new Set());
          return;
        }
        result = [json.data];
      } else {
        const qs = new URLSearchParams();
        if (corporationId) qs.append("corporationId", corporationId);
        if (affiliationId) qs.append("affiliationId", affiliationId);
        if (locationId)    qs.append("locationId", locationId);
        if (parentTypeId)  qs.append("parentTypeId", parentTypeId);
        if (childTypeId)   qs.append("childTypeId", childTypeId);
        const url = qs.toString()
          ? `${API_BASE_URL}/assets/paged?${qs.toString()}`
          : `${API_BASE_URL}/assets/paged`;
        const res  = await authFetchWithRefresh(url);
        const json = await res.json();
        result = json.data?.list || [];
      }

      const mapped = result.map(it => ({
        id: String(it.barcode ?? it.id),
        assetId: it.id ?? it.assetId ?? null,
        barcode: it.barcode,
        company: it.corporation,
        department: it.department,
        location: it.location,
        category: it.parentCategory,
        name: it.childCategory,
        registrarId: undefined,
        registerName: it.registerName,
      }));
      setAssets(mapped);
      setSelected(new Set());
    } catch (e) {
      notify(e?.message || t('AssetRegistrarChange_SearchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQ("");
    setFCompany(""); setFDept(""); setFLoc("");
    setFCat(""); setFItem("");
    setCorporationId(null); setAffiliationId(null); setLocationId(null);
    setParentTypeId(null); setChildTypeId(null);
    setAssets([]); setSelected(new Set());
  };

  const onChangeNewCompany = (v) => {
    setNewCompany(v);
    setNewDept("");
    setNewRegistrarId("");
    const ds = v ? Object.keys(companyData[v] || {}) : [];
    setDeptOptions(ds);
  };

  const openConfirm = () => {
    const hasReg = !!newRegistrarId;
    const hasComp = !!newCompany;
    const hasDept = !!newDept;
    if (hasReg && !(hasComp && hasDept)) return notify(t('AssetRegistrarChange_SelectCompanyDeptFirstToChooseRegistrar'));
    if (!(hasReg || hasComp || hasDept)) return notify(t('AssetRegistrarChange_SelectFieldsToChange'));
    if (selected.size === 0) return notify(t('AssetRegistrarChange_SelectAssetsToChange'));
    dlgRef.current?.showModal();
  };
  const closeConfirm = () => dlgRef.current?.close();

  const applyChange = async () => {
    try {
      const serverIds = assets.filter(a => selected.has(a.id)).map(a => a.assetId ?? a.id);
      if (!newRegistrarId) return notify(t('AssetRegistrarChange_PleaseSelectRegistrar'));
      if (serverIds.length === 0) return notify(t('AssetRegistrarChange_Error_CannotVerifySelectedAssetIds'));


      await api.bulkUpdateAssets({ assetIds: serverIds, newRegistrarId });

      const picked = getUserById(users, newRegistrarId);
      setAssets(prev =>
        prev.map(a =>
          selected.has(a.id)
            ? { ...a, registrarId: newRegistrarId, registerName: picked?.name || a.registerName }
            : a
        )
      );
      setSelected(new Set());
      closeConfirm();
      notify(t('AssetRegistrarChange_Success_SelectedItemsUpdated'));
    } catch (e) {
      notify(e?.message || t('AssetRegistrarChange_SearchFailed'));
    }
  };

  const toggleRow = (id, on) => setSelected(prev => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; });
  const toggleAll = (on) => setSelected(prev => on ? new Set([...prev, ...list.map(a => a.id)]) : new Set([...prev].filter(id => !list.some(a => a.id === id))));

  return (
<div data-ams-root data-ams-scope="arc" data-ams-variant={variant}>
      <div className="ams-layout">
        <div style={{ height: 8 }} />
    <div className="ams-page-title">{t('AssetRegistrarChange_Title')}</div>
    <div className="ams-subtitle">{t('AssetRegistrarChange_BulkChangeDescription')}</div>

        {/* ── 필터 카드 ── */}
        <div className="ams-card">
          <div className="ams-card-header">{t('AssetRegistrarChange_AssetSearch')}</div>
          <div className="ams-card-body">
            <div className="ams-filters">
  {/* 1열: 바코드 검색 */}
  <div className="ams-search-wrap f-barcode">
                <svg className="ams-icon ams-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="7" strokeWidth="1.6" />
                  <path d="m21 21-3.5-3.5" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  className="ams-input"
                  placeholder={t('AssetRegistrarChange_SearchBarcode')}
                  inputMode="numeric"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
              </div>

  <select
    className="ams-input f-company"
                value={fCompany}
                onChange={(e) => {
                  const v = e.target.value;
                  setFCompany(v);
                  setFDept(""); setFLoc("");
                  setAffiliationId(null); setLocationId(null);
                  setCorporationId(companyIdMap[v]?.id || null);
                }}>
                <option value="">{t('AssetRegistrarChange_CompanyType')}</option>
                {companies.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

  {/* 2열: 부서구분 */}
  <select
    className="ams-input f-dept"
                value={fDept}
                onChange={(e) => {
                  const v = e.target.value;
                  setFDept(v); setFLoc("");
                  const dep = companyIdMap[fCompany]?.departments?.[v];
                  setAffiliationId(dep?.id || null);
                }}>
                <option value="">{t('AssetRegistrarChange_DepartmentType')}</option>
                {departments.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

  {/* 2열: 세부위치 */}
  <select
    className="ams-input f-loc"
                value={fLoc}
                onChange={(e) => {
                  const v = e.target.value;
                  setFLoc(v);
                  const locId = companyIdMap[fCompany]?.departments?.[fDept]?.locations?.[v];
                  setLocationId(locId || null);
                }}>
                <option value="">{t('AssetRegistrarChange_DetailLocation')}</option>
                {locations.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              {/* 2행: 자산분류 / 품목 / 버튼 */}
  {/* 3열: 자산분류 */}
  <select
    className="ams-input f-cat"
                value={fCat}
                onChange={(e) => {
                  const v = e.target.value;
                  setFCat(v); setFItem("");
                  setParentTypeId(assetCategoryMap[v]?.id || null);
                  setChildTypeId(null);
                }}>
                <option value="">{t('AssetRegistrarChange_AssetCategory')}</option>
                {categories.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

  {/* 3열: 품목 */}
  <select
    className="ams-input f-item"
                value={fItem}
                onChange={(e) => {
                  const v = e.target.value;
                  setFItem(v);
                  setChildTypeId(assetCategoryMap[fCat]?.children?.[v] || null);
                }}>
                <option value="">{t('AssetRegistrarChange_Item')}</option>
                {items.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
  {/* 4열: 초기화 - 조회 */}
  <div className="ams-row2-actions f-actions">
                <button className="ams-btn is-gray" onClick={handleReset}>{t('AssetRegistrarChange_Reset')}</button>
                <button className="ams-btn is-primary" onClick={handleSearch}>{t('AssetRegistrarChange_Search')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 결과 카드 ── */}
        <div className="ams-card" style={{ marginTop: 14 }}>
          <div className="ams-card-header ams-between">
             <span>{t('AssetRegistrarChange_AssetList')}</span>
                <span className="ams-muted">
              {loading
                ? t('AssetRegistrarChange_Loading')
                : <>{t('AssetRegistrarChange_FilteredCount_Prefix')}<strong>{list.length}</strong>{t('AssetRegistrarChange_Count_Unit')}</>}
            </span>
          </div>
          <div className="ams-card-body is-nopad">
            <div className="ams-table-wrap">
              <table className="ams-table">
                <colgroup>
                  <col style={{width:44}}/>
                  <col style={{width:170}}/>
                  <col/>
                  <col style={{width:120}}/>
                  <col/>
                  <col style={{width:220}}/>
                  <col style={{width:48}}/>
                </colgroup>
                <thead>
                  <tr>
                    <th><input type="checkbox" ref={headerRef} checked={headerChecked} onChange={(e) => toggleAll(e.target.checked)} /></th>
                    <th>{t('AssetRegistrarChange_Barcode')}</th>
                    <th>{t('AssetRegistrarChange_CompanyDeptLocation')}</th>
                    <th>{t('AssetRegistrarChange_AssetCategory')}</th>
                    <th>{t('AssetRegistrarChange_Item')}</th>
                    <th>{t('AssetRegistrarChange_CurrentRegistrar')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => {
                    const u = getUserById(users, a.registrarId) || {};
                    const deptName = u?.affiliationId && affIndex[u.affiliationId]?.dept
                      ? affIndex[u.affiliationId].dept
                      : "-";
                    const checked = selected.has(a.id);
                    return (
                      <tr key={a.id}>
                        <td><input type="checkbox" checked={checked} onChange={(e) => toggleRow(a.id, e.target.checked)} /></td>
                        <td><div className="ams-mono">{a.barcode}</div></td>
                        <td>
                          <div className="ams-badges">
                            <span className="ams-badge is-fill">{a.company}</span>
                            <span className="ams-badge">{a.department}</span>
                            <span className="ams-badge">{a.location}</span>
                          </div>
                        </td>
                        <td><span className="ams-badge">{a.category}</span></td>

                        {/* 품목 셀 클릭 → 선택 토글 */}
                                                <td
                          className="ams-cell-pick"
                          title={checked ? t('AssetRegistrarChange_Deselect') : t('AssetRegistrarChange_SelectThisAsset')}
                          onClick={() => toggleRow(a.id, !checked)}
                        >
                          <button type="button" className="ams-row-name">{a.name}</button>
                        </td>

                        <td>
                          <div>
                            <div className="ams-strong">{a.registerName || u.name || "-"}</div>
                            <div className="ams-muted" style={{ fontSize: 12 }}>
                              {a.company} - {deptName}
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`ams-pick ${checked ? "is-on" : ""}`}
                            title={checked ? t('AssetRegistrarChange_Deselect') : t('AssetRegistrarChange_SelectThisAsset')}
                            aria-pressed={checked}
                            onClick={() => toggleRow(a.id, !checked)}
                          >
                            ✓
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={7} className="ams-muted" style={{ padding: 20, textAlign: "center" }}>
                        {t('AssetRegistrarChange_NoData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* ── 하단 일괄 변경 바 ── */}
        <div className="ams-bulkbar">
          <div className="ams-bulkbar-inner">
            <div className="ams-bulk-grid">
              <div className="ams-control is-company">
                <label htmlFor="newCompany">{t('AssetRegistrarChange_Company')}</label>
                <select id="newCompany" className="ams-input" value={newCompany} onChange={(e) => onChangeNewCompany(e.target.value)}>
                  <option value="">{t('AssetRegistrarChange_SelectNone')}</option>
                  {companies.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="ams-control is-dept">
                <label htmlFor="newDept">{t('AssetRegistrarChange_Department')}</label>
                <select
                  id="newDept"
                  className="ams-input"
                  value={newDept}
                  onChange={(e) => { setNewDept(e.target.value); setNewRegistrarId(""); }}
                >
                  <option value="">{t('AssetRegistrarChange_SelectNone')}</option>
                  {(deptOptions.length
                    ? deptOptions
                    : uniqSorted(assets.filter((a) => !newCompany || a.company === newCompany).map((a) => a.department))
                  ).map((v) => v && <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="ams-control is-registrar">
                <label htmlFor="newRegistrar">{t('AssetRegistrarChange_Registrar')}</label>
                <select
                  id="newRegistrar"
                  className="ams-input"
                  value={newRegistrarId}
                  onChange={(e) => setNewRegistrarId(e.target.value)}
                  disabled={!(newCompany && newDept)}
                >
                  <option value="">
                    {newCompany && newDept ? t('AssetRegistrarChange_SelectNone') : t('AssetRegistrarChange_SelectCompanyDeptFirst')}
                  </option>
                  {newCompany && newDept && registrarOptions.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="ams-counter">
                <div>{t('AssetRegistrarChange_SelectedCount_Prefix')}<b>{selected.size}</b>{t('AssetRegistrarChange_Count_Unit')}</div>
                <div className="ams-counter-actions">
                  <button className="ams-btn" onClick={() => setSelected(new Set())}>{t('AssetRegistrarChange_Deselect')}</button>
                  <button className="ams-btn is-primary" onClick={openConfirm}>{t('AssetRegistrarChange_ChangeRegistrar')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 확인 다이얼로그 ── */}
        <dialog className="ams-dialog" ref={dlgRef}>
          <div className="ams-dialog-header">{t('AssetRegistrarChange_ConfirmChangeRegistrar')}</div>
          <div className="ams-dialog-body">
<div className="ams-muted" style={{ marginBottom: 8 }}>{t('AssetRegistrarChange_BulkChangeConfirm')}</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:8 }}>
               <div className="ams-muted">{t('AssetRegistrarChange_TargetAssets')}</div>
              <div><b>{selected.size}</b>건</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
              <div className="ams-muted">{t('AssetRegistrarChange_ChangeFromTo')}</div>
              <div>
                {[
                  newCompany && `${t('AssetRegistrarChange_Company')}: ${newCompany}`,
                  newDept && `${t('AssetRegistrarChange_Department')}: ${newDept}`,
                  newRegistrarId && `${t('AssetRegistrarChange_Registrar')}: ${(getUserById(users, newRegistrarId) || {}).name}`,
                ].filter(Boolean).join(" · ") || "-"}
              </div>
            </div>
          </div>
          <div className="ams-dialog-foot">
            <button className="ams-btn" onClick={closeConfirm}>{t('AssetRegistrarChange_Cancel')}</button>
            <button className="ams-btn is-primary" onClick={applyChange}>{t('AssetRegistrarChange_Confirm')}</button>
          </div>
        </dialog>

        <div className={`ams-toast ${toastMsg ? "is-show" : ""}`}>{toastMsg}</div>
      </div>
    </div>
  );
}

 export const AssetRegistrarChangeWeb = (props) => <AssetRegistrarChangeCore mode="web" {...props} />;
 export const AssetRegistrarChangePDA = (props) => <AssetRegistrarChangeCore mode="pda" {...props} />;
 // 기본은 자동
 export default function AssetRegistrarChange(props){
   return <AssetRegistrarChangeCore mode="auto" {...props} />;
 }

 function useResponsiveMode(mode){
   const [eff, setEff] = React.useState(mode === "pda" ? "pda" : "web");
   React.useEffect(()=>{
     if (mode !== "auto") { setEff(mode); return; }
     const compute=()=>{
       const width = window.innerWidth;
       const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
       // Search의 기준과 동일
       const isPDA = width <= 920 || (coarse && width <= 1200);
       setEff(isPDA ? "pda" : "web");
     };
     compute();
     window.addEventListener('resize', compute);
     window.addEventListener('orientationchange', compute);
     return ()=> {
       window.removeEventListener('resize', compute);
       window.removeEventListener('orientationchange', compute);
     };
   },[mode]);
   return eff;
 }
