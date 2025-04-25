import React, { useState } from 'react';
import './MyInfoModal.css';

const COMPANY_MAP = {
  '평택공장': ['전산운영팀', '회계팀'],
  '우신에너지': ['자재관리', '경영관리'],
};

const InfoEditModal = ({ userInfo, onClose, onSave }) => {
  const [company, setCompany] = useState(userInfo.company);
  const [department, setDepartment] = useState(userInfo.department);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [id, setId] = useState('');

  const handleCompanyChange = (e) => {
    const newCompany = e.target.value;
    setCompany(newCompany);
    setDepartment(COMPANY_MAP[newCompany][0]);
  };

  const handleSubmit = () => {
    onSave({
      ...userInfo,
      company,
      department,
      name: name || userInfo.name,
      password,
      id: id || userInfo.id,
    });
  };

  return (
    <div className="modal-background">
      <div className="modal-content">
        <h2>내정보 수정하기</h2>

        <label>회사구분</label>
        <select value={company} onChange={handleCompanyChange}>
          {Object.keys(COMPANY_MAP).map(comp => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>

        <label>부서구분</label>
        <select value={department} onChange={e => setDepartment(e.target.value)}>
          {COMPANY_MAP[company].map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <label>이름</label>
        <input
          type="text"
          placeholder={userInfo.name}
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label>아이디</label>
        <input
          type="text"
          placeholder={userInfo.id}
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