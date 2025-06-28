import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../utils/UserContext';
import './MyInfoModal.css';
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh'

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8080';

/* ─────────────────────────────────────────
   모든 Hook 은 컴포넌트(또는 커스텀 Hook) 안쪽으로 이동
   ───────────────────────────────────────── */

const InfoEditModal = ({ userInfo, onClose /*, onSave */ }) => {
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
            const res  = await authFetchWithRefresh(`${API_BASE}/corporations`);
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
      alert('❌ 부서 선택이 올바르지 않습니다.');
      return;
    }


    if (current.name !== userInfo.name) changed.name = current.name;
    if (current.id !== userInfo.id) changed.username = current.id;  // ✅ username으로 변경
    if (current.password) changed.password = current.password;
  
    // 변경된 항목이 없다면
    if (Object.keys(changed).length === 0) {
      alert('변경된 내용이 없습니다.');
      return;
    }
  
    // ID 등 식별자는 항상 포함 (백엔드가 필요로 할 경우)
    const payload = {
      affiliationId,
      ...changed,
    };
  
    console.log('📤 서버로 전송할 수정 항목:', payload);
  
        try {
            const res = await authFetchWithRefresh(`${API_BASE}/account/update`, {
              method : 'POST',
              body   : JSON.stringify(payload),  // Content-Type 은 훅에서 자동 세팅
       });
      
            const json = await res.json();
            if (json.code === 1) {
              alert('✅ 정보 수정이 완료되었습니다.');
                /* ───────── 로컬 스토리지 반영 ───────── */
                      /* 1️⃣  먼저 user 객체를 임시로 만들고 */
                      const newUser = {
                        ...JSON.parse(localStorage.getItem('user') || '{}'),
                        name:         payload.name     ?? userInfo.name,
                        username:     payload.username ?? userInfo.id,
                        affiliationId,
                      };
                
                      /* 2️⃣  ── 토큰 재발급 요청 */
                      const refRes = await fetch(`${API_BASE}/account/auth/token-refresh`, {
                        method : 'POST',
                        headers: { 'Content-Type':'application/json' },
                        body   : JSON.stringify({
                          refreshToken: localStorage.getItem('refreshToken')
                        })
                      });
                      const refJson = await refRes.json();
                
                      if (refJson.code !== 1) {
                        alert('🚨 토큰 재발급 실패 - 다시 로그인해주세요.');
                        return onClose();            // 모달만 닫고, 필요하면 로그아웃 처리
                      }
                
                      /* 3️⃣  새 토큰 & 사용자 정보 localStorage + Context 업데이트 */
                      localStorage.setItem('accessToken',  refJson.data.accessToken);
                      localStorage.setItem('refreshToken', refJson.data.refreshToken);
                      localStorage.setItem('user', JSON.stringify(newUser));
                      setUser(newUser);
                
                      onClose(newUser);              // 모달 닫기 (부모가 re-render)
            } else {
              alert(`❌ 수정 실패: ${json.message || '알 수 없는 오류'}`);
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

  <h2>내정보 수정하기</h2>

  <label>회사구분</label>
  <select value={company} onChange={handleCompanyChange}>
    {companies.map(corp => (
    <option key={corp.id} value={corp.name}>{corp.name}</option>
  ))}
  </select>

  <label>부서구분</label>
  <select value={department} onChange={e => setDepartment(e.target.value)}>
    {departments.map(dept => (
    <option key={dept.affiliationId} value={dept.department}>
      {dept.department}
    </option>
  ))}
  </select>

  <label>이름</label>
  <input
    type="text"
    value={name}
    onChange={e => setName(e.target.value)}
  />

  <label>아이디</label>
  <input
    type="text"
    value={id}
    onChange={e => setId(e.target.value)}
  />

  <label>비밀번호</label>
  <input
    type="password"
    placeholder="********"
    value={password}
    onChange={e => setPassword(e.target.value)}
  />

  <div className="modal-actions">
    <button className="save-btn" onClick={handleSubmit}>수정하기</button>
    <button className="modal-close-btn" onClick={onClose}>닫기</button>
  </div>
</div>
    </div>
  );
};

export default InfoEditModal;
