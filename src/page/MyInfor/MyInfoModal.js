// import React, { useState } from 'react';
// import './MyInfoModal.css';

// const COMPANY_MAP = {
//   '평택공장': ['전산운영팀', '회계팀'],
//   '우신에너지': ['자재관리', '경영관리'],
// };

// const InfoEditModal = ({ userInfo, onClose, onSave }) => {
//   const [company, setCompany] = useState(userInfo.company);
//   const [department, setDepartment] = useState(userInfo.department);
//   const [name, setName] = useState('');
//   const [password, setPassword] = useState('');
//   const [id, setId] = useState('');

//   const handleCompanyChange = (e) => {
//     const newCompany = e.target.value;
//     setCompany(newCompany);
//     setDepartment(COMPANY_MAP[newCompany][0]);
//   };

//   const handleSubmit = () => {
//     onSave({
//       ...userInfo,
//       company,
//       department,
//       name: name || userInfo.name,
//       password,
//       id: id || userInfo.id,
//     });
//   };

//   return (
//     <div className="modal-background">
//       <div className="modal-content">
//         <h2>내정보 수정하기</h2>

//         <label>회사구분</label>
//         <select value={company} onChange={handleCompanyChange}>
//           {Object.keys(COMPANY_MAP).map(comp => (
//             <option key={comp} value={comp}>{comp}</option>
//           ))}
//         </select>

//         <label>부서구분</label>
//         <select value={department} onChange={e => setDepartment(e.target.value)}>
//           {COMPANY_MAP[company].map(dept => (
//             <option key={dept} value={dept}>{dept}</option>
//           ))}
//         </select>

//         <label>이름</label>
//         <input
//           type="text"
//           placeholder={userInfo.name}
//           value={name}
//           onChange={e => setName(e.target.value)}
//         />

//         <label>아이디</label>
//         <input
//           type="text"
//           placeholder={userInfo.id}
//           value={id}
//           onChange={e => setId(e.target.value)}
//         />

//         <label>비밀번호</label>
//         <input
//           type="password"
//           placeholder="********"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//         />

//         <div className="modal-actions">
//           <button className="save-btn" onClick={handleSubmit}>수정하기</button>
//           <button className="close-btn" onClick={onClose}>닫기</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InfoEditModal;

// MyInfoModal.js
import React, { useState, useEffect } from 'react';
import './MyInfoModal.css';

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

  const handleSubmit = () => {
    onSave({
      ...userInfo,
      company,
      department,
      name,
      id,
      password: password || undefined, // 빈 문자열이면 전송하지 않음
    });
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
