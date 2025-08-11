import React, { useState, useEffect } from 'react';
import './adminUserManage.css'; // ✅ 네임스페이스화된 CSS
import { authFetchWithRefresh } from '../../utils/authFetchWithRefresh';

export default function AdminUserManage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [checkedItems, setCheckedItems] = useState([]);
  const [agree, setAgree] = useState(false);
  const [companyList, setCompanyList] = useState([]);
  const [companyData, setCompanyData] = useState({});
  const [locationIdMap, setLocationIdMap] = useState({});
  const [affiliationMap, setAffiliationMap] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

  const handleSelectAll = (e) => {
    setCheckedItems(e.target.checked ? users.map((u) => u.id) : []);
  };

  const handleItemChange = (id) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllChecked = users.length > 0 && checkedItems.length === users.length;

  useEffect(() => {
    authFetchWithRefresh(`${API_BASE}/account`)
      .then((res) => res.json())
      .then((data) => {
       // console.log('📥 [GET /account 응답]:', data); // ✅ 추가
        setUsers(Array.isArray(data?.data?.responses) ? data.data.responses : []);
      })
      .catch((err) => {
        console.error('❌ [GET /account 에러]:', err);
        setUsers([]);
      });
  
    const fetchCorporation = async () => {
      try {
        const res = await authFetchWithRefresh(`${API_BASE}/corporations`);
        const result = await res.json();
  
       // console.log('📥 [GET /corporations 응답]:', result); // ✅ 추가
  
        if (result.code === 1 && result.data?.corporationList) {
          const affMap = {};
          const nestedData = {};
          const names = [];
          const locMap = {};
  
          result.data.corporationList.forEach((corp) => {
            const corpName = corp.name;
            names.push(corpName);
            nestedData[corpName] = {};
            locMap[corpName] = {};
  
            corp.affiliationList.forEach((aff) => {
              if (aff.affiliationId != null) {
                affMap[aff.affiliationId] = {
                  company: corpName,
                  department: aff.department,
                };
              }
  
              const dept = aff.department;
              nestedData[corpName][dept] = [];
              locMap[corpName][dept] = {};
  
              aff.locations.forEach((loc) => {
                nestedData[corpName][dept].push(loc.location);
                locMap[corpName][dept][loc.location] = loc.locationId;
              });
            });
          });
  
         // console.log('📦 [affiliationMap 생성 결과]:', affMap); // ✅ 추가
          setCompanyData(nestedData);
          setCompanyList(names);
          setLocationIdMap(locMap);
          setAffiliationMap(affMap);
        }
      } catch (err) {
        console.error('❌ 법인 정보 조회 실패:', err);
      }
    };
  
    fetchCorporation();
  }, []);
  

  const filteredUsers = users.filter((u) => {
    const usernameMatch = u.username?.toLowerCase().includes(search.toLowerCase());
    const nameMatch = u.name?.toLowerCase().includes(search.toLowerCase());
    return usernameMatch || nameMatch ;
  });

  return (
    <div className="aum-container">
      <h1 className="aum-title">사용자 관리</h1>

      <input
        type="text"
        placeholder="이름이나 ID 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="aum-search-input"
      />

      <table className="aum-table">
        <thead>
          <tr>
            <th><input type="checkbox" checked={isAllChecked} onChange={handleSelectAll} /></th>
            <th>ID</th>
            <th>이름</th>
            <th>회사</th>
            <th>부서</th>
            <th>권한</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const aff = affiliationMap[user.affiliationId] || {};
            return (
                       <tr key={user.id} onClick={(e) => {
                           if (e.target.tagName !== 'INPUT') {  // ✅ checkbox 클릭은 제외
                             setSelectedUser(user);
                             setShowModal(true);
                           }
                         }} className="aum-clickable-row">
                <td><input type="checkbox" checked={checkedItems.includes(user.id)} onChange={() => handleItemChange(user.id)} /></td>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{aff.company || '-'}</td>
                <td>{aff.department || '-'}</td>
                <td>{user.role === 'ADMIN' ? '관리자' : user.role === 'GENERAL' ? '일반사용자' : '-'}</td>


              </tr>
            );
          })}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <div className="aum-no-result">검색된 사용자가 없습니다.</div>
      )}

      {showModal && selectedUser && (
        <div className="aum-modal-overlay">
          <div className="aum-modal-content">
            <h2>사용자 상세 정보</h2>
            <p className="aum-modal-row"><span className="aum-label">ID : </span><span className="aum-value">{selectedUser.username}</span></p>
<p className="aum-modal-row"><span className="aum-label">이름 : </span><span className="aum-value">{selectedUser.name}</span></p>
<p className="aum-modal-row"><span className="aum-label">회사 : </span><span className="aum-value">{affiliationMap[selectedUser.affiliationId]?.company || '-'}</span></p>
<p className="aum-modal-row"><span className="aum-label">부서 : </span><span className="aum-value">{affiliationMap[selectedUser.affiliationId]?.department || '-'}</span></p>
<p className="aum-modal-row">
  <span className="aum-label">권한 : </span>
  <span className="aum-value">
    {selectedUser.role === 'ADMIN' ? '관리자' : selectedUser.role === 'GENERAL' ? '일반사용자' : '-'}
  </span>
</p>


            <div className="aum-modal-footer">
              <button onClick={() => setShowModal(false)} className="aum-close-btn">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
