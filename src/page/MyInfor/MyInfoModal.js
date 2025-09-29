import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref.js';
import { UserContext } from '../../utils/UserContext';
import './MyInfoModal.css';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh'

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8080';

/* ─────────────────────────────────────────
   모든 Hook 은 컴포넌트(또는 커스텀 Hook) 안쪽으로 이동
   ───────────────────────────────────────── */

const InfoEditModal = ({ userInfo, onClose /*, onSave */ }) => {
  const { t } = useTranslation('MyInfoModal');        // ✅ i18n
  const langUI = getUILang();                     // 'KR' | 'CN' | 'VN'
  const langI18n = uiToI18n(langUI);              // 'ko' | 'zh' | 'vi'
  //const { login } = useContext(UserContext);
  const { setUser } = useContext(UserContext);
  /* 동적 목록용 상태 */
  const [companies,   setCompanies]   = useState([]); // [{id,name,affiliationList:[]}]
  const [departments, setDepartments] = useState([]); // [{affiliationId,department,...}]
  // 1) userInfo.company 가 맵에 없으면 맵의 첫 키를 기본값으로 사용
  const [company,    setCompany]    = useState(userInfo.company    || '');
  const [department, setDepartment] = useState(userInfo.department || '');
  const [name, setName]       = useState(userInfo.name);
  const [id, setId]           = useState(userInfo.id);
  const [password, setPassword] = useState('');

  // 회사가 바뀔 때마다, 해당 회사의 부서 첫 번째로 초기화
/* COMPANY_MAP 의존 useEffect 제거 → 실제 API 데이터는
   handleCompanyChange 와 초기 로딩 useEffect 에서 처리 */

  const handleCompanyChange = (e) => {
      const selName = e.target.value;
      setCompany(selName);
    
      /* 선택된 회사의 부서 목록 갱신 */
      const corpObj  = companies.find(c => c.name === selName);
      const deptList = corpObj?.affiliationList || [];
      setDepartments(deptList);
      setDepartment(deptList[0]?.department || '');
    };

    useEffect(() => {
        (async () => {
          try {
             const res  = await authFetchWithRefresh(`${API_BASE}/corporations`, {
   headers: {
     'Accept-Language': langI18n,
     'language': langUI,
   },
 });
            const json = await res.json();
            if (json.code !== 1) throw new Error('API 실패');
      
            const corpList = json?.data?.corporationList || [];
            setCompanies(corpList);
      
            /* 로그인 사용자의 회사·부서에 맞춰 초기화 */
            const initCorp = corpList.find(c => c.name === userInfo.company) || corpList[0];
            setCompany(initCorp?.name || '');
      
            const deptList = initCorp?.affiliationList || [];
            setDepartments(deptList);
            const initDept = deptList.find(d => d.department === department) || deptList[0];
            setDepartment(initDept?.department || '');
          } catch (e) {
            console.error('법인/부서 목록 불러오기 실패:', e);
          }
        })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);   // 최초 1회

  const handleSubmit = async () => {
    const current = { name, id, password, department };
    const changed = {};
  
    const targetAff = departments.find(d => d.department === department);
    const affiliationId = targetAff?.affiliationId;
    if (!affiliationId) {
      alert('❌ ' + t('MyInfoModal_Error_InvalidDepartmentSelection'));
      return;
    }


// 소속(부서)도 변경 비교
if (affiliationId !== userInfo.affiliationId) changed.affiliationId = affiliationId;

// 기존과 같이
if (current.name !== userInfo.name) changed.name = current.name;
if (current.id !== userInfo.id) changed.username = current.id;
if (current.password) changed.password = current.password;
  
    // 변경된 항목이 없다면
    if (Object.keys(changed).length === 0) {
      alert(t('MyInfoModal_NoChanges'));
      return;
    }
  
    // ID 등 식별자는 항상 포함 (백엔드가 필요로 할 경우)
    const payload = {
      //affiliationId,
      ...changed,
    };
  
   // console.log('📤 서버로 전송할 수정 항목:', payload);
  
        try {
            const res = await authFetchWithRefresh(`${API_BASE}/account`, {
              method : 'PUT',
                 headers: {
     'Accept-Language': langI18n,
     'language': langUI,
   },
   body   : JSON.stringify(payload),
       });
    //   console.log("전송주소 : "+res)
      
            const json = await res.json();
            if (json.code === 1) {
              alert('✅ ' + t('MyInfoModal_InfoUpdateCompleted'));
                /* ───────── 로컬 스토리지 반영 ───────── */
                      /* 1️⃣  먼저 user 객체를 임시로 만들고 */
                      const newUser = {
                        ...JSON.parse(localStorage.getItem('user') || '{}'),
                        name:         payload.name     ?? userInfo.name,
                        username:     payload.username ?? userInfo.id,
                        company:      company,                 // 추가!
                        department:   department,              // 추가!
                        affiliationId: affiliationId
                      };
                      
                
                      /* 2️⃣  ── 토큰 재발급 요청 */
                      const refRes = await fetch(`${API_BASE}/account/auth/token-refresh`, {
                                                method : 'POST',
                                                headers: {
                                                  'Content-Type':'application/json',
                                                  'Authorization-a': localStorage.getItem('accessToken') || '',
                                                  'Authorization-r': localStorage.getItem('refreshToken') || '',
                                                  'Accept-Language': langI18n,
                                                  'language': langUI,
                                                },
                                                body   : JSON.stringify({
                                                  refreshToken: localStorage.getItem('refreshToken')
                                                })
                                              });
                                              // +++ 추가! 보내는 토큰 콘솔 출력
//console.log('[보내는 토큰]', {
//   'Authorization-a': localStorage.getItem('accessToken'),
//   'Authorization-r': localStorage.getItem('refreshToken'),
// });
const refJson = await refRes.json();
//console.log('[토큰 재발급 응답]', refJson);
                      // 여기! 헤더에서 토큰 꺼내기
                      const newAccessToken  = refJson?.data?.accessToken?.token;
                      const newRefreshToken = refJson?.data?.refreshToken?.token;

                      //const refJson = await refRes.json();
                      //console.log('[토큰 재발급 응답]', refJson, newAccessToken, newRefreshToken);
                       // 토큰이 둘 다 있으면 무조건 성공!
                       if (newAccessToken && newRefreshToken) {
                        localStorage.setItem('accessToken',  newAccessToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                        localStorage.setItem('user', JSON.stringify(newUser));
                        //login(newUser)
                        setUser(newUser);
                        onClose(newUser); // 모달 닫기 (부모 re-render)
                        return;
                      }
                      // +++ 실패 조건 추가 (둘 중 하나라도 없으면) +++
                      alert('🚨 ' + t('MyInfoModal_Error_TokenRefreshFailed_PleaseLogin'));
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      localStorage.removeItem('user');
                      return;

                      



               
            } else {
              alert('🚨 ' + t('MyInfoModal_Error_NoToken_PleaseLogin'));
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
            }
          } catch (err) {
            // authFetchWithRefresh 가 throw한 Error 객체 처리
            if (err.body?.message) {
              alert(`❌ ${err.body.message}`);
            } else {
              alert(`🚨 ${err.message}`);
            }
            console.error('에러 상세:', err);
          }
};
  


  return (
    <div className="modal-background">
      <div className="modal-content">
  {/* 상단 닫기 버튼 (X) */}

  <h2>{t('MyInfoModal_EditMyInfo')}</h2>

 <label>{t('MyInfoModal_CompanyType')}</label>
  <select value={company} onChange={handleCompanyChange}>
  {companies.map(corp => (
    <option key={corp.id} value={corp.name}>
      {corp.name}
    </option>
  ))}
</select>

  <label>{t('MyInfoModal_DepartmentType')}</label>
  <select value={department} onChange={e => setDepartment(e.target.value)}>
  {departments.map(dept => (
    <option key={dept.affiliationId} value={dept.department}>
      {dept.department}
    </option>
  ))}
</select>


  <label>{t('MyInfoModal_Name')}</label>
  <input
    type="text"
    value={name}
    onChange={e => setName(e.target.value)}
  />

  <label>{t('MyInfoModal_Id')}</label>
  <input
    type="text"
    value={id}
    onChange={e => setId(e.target.value)}
  />

 <label>{t('MyInfoModal_Password')}</label>
  <input
    type="password"
    placeholder="********"
    value={password}
    onChange={e => setPassword(e.target.value)}
  />

  <div className="modal-actions">
    <button className="save-btn" onClick={handleSubmit}>{t('MyInfoModal_Edit')}</button>
    <button className="modal-close-btn" onClick={onClose}>{t('MyInfoModal_Close')}</button>
  </div>
</div>
    </div>
  );
};

export default InfoEditModal;
