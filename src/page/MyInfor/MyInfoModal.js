// MyInfoModal.js
import React, { useState, useEffect } from 'react';
import './MyInfoModal.css';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8080';

const COMPANY_MAP = {
  '평택공장': ['전산운영팀', '회계팀'],
  '우신에너지': ['자재관리', '경영관리'],
};

const InfoEditModal = ({ userInfo, onClose, onSave }) => {
  // 1) userInfo.company 가 맵에 없으면 맵의 첫 키를 기본값으로 사용
  const companyKeys = Object.keys(COMPANY_MAP);
  const initialCompany = companyKeys.includes(userInfo.company)
    ? userInfo.company
    : companyKeys[0];

  const [company, setCompany] = useState(initialCompany);
  const [department, setDepartment] = useState(
    // 2) COMPANY_MAP[company] 이 undefined 여도 빈 배열에서 첫 요소로
    (COMPANY_MAP[initialCompany] || [])[0] || ''
  );
  const [name, setName]       = useState(userInfo.name);
  const [id, setId]           = useState(userInfo.id);
  const [password, setPassword] = useState('');

  // 회사가 바뀔 때마다, 해당 회사의 부서 첫 번째로 초기화
  useEffect(() => {
    const depts = COMPANY_MAP[company] || [];
    setDepartment(depts[0] || '');
  }, [company]);

  const handleCompanyChange = (e) => {
    setCompany(e.target.value);
    // department 는 useEffect 에서 자동 세팅됩니다
  };

  const handleSubmit = async () => {
    const current = { company, department, name, id, password };
    const changed = {};
  
    if (current.company !== userInfo.company) changed.company = current.company;
    if (current.department !== userInfo.department) changed.department = current.department;
    if (current.name !== userInfo.name) changed.name = current.name;
    if (current.id !== userInfo.id) changed.id = current.id;
    if (current.password) changed.password = current.password;
  
    // 변경된 항목이 없다면
    if (Object.keys(changed).length === 0) {
      alert('변경된 내용이 없습니다.');
      return;
    }
  
    // ID 등 식별자는 항상 포함 (백엔드가 필요로 할 경우)
    const payload = {
      id: userInfo.id, // 기존 id로 식별
      ...changed,
    };
  
    console.log('📤 서버로 전송할 수정 항목:', payload);
  
    try {
      // const response = await fetch('http://localhost:8080/api/user/update', {
        const response = await fetch(`${API_BASE}/api/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const result = await response.json(); // 1 또는 0
  
      if (result === 1) {
        alert('✅ 정보 수정이 완료되었습니다.');
        onClose(); // 모달 닫기
      } else {
        alert('❌ 수정 실패: 서버에서 실패 처리되었습니다.');
      }
    } catch (error) {
      alert('🚨 서버 통신 실패');
      console.error('수정 요청 오류:', error);
    }
  };
  


  return (
    <div className="modal-background">
      <div className="modal-content">
        <h2>내정보 수정하기</h2>

        <label>회사구분</label>
        <select value={company} onChange={handleCompanyChange}>
          {companyKeys.map(comp => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>

        <label>부서구분</label>
        <select value={department} onChange={e => setDepartment(e.target.value)}>
          {/* COMPANY_MAP[company] 이 안전하게 빈 배열 혹은 실제 부서 배열 */}
          {(COMPANY_MAP[company] || []).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
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
          <button className="close-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default InfoEditModal;
