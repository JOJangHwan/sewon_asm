// "use client"
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const API_BASE = window._env_?.REACT_APP_API_URL|| 'http://localhost:8888';

//console.log("환경변수확인 :", API_BASE);
const SignupForm = () => {
  const navigate = useNavigate();

  const [corporationMap, setCorporationMap] = useState({});
const [company, setCompany] = useState('');
const [department, setDepartment] = useState('');
const selectedCorporation = corporationMap[company]; // key가 이제 ID
const selectedDepartment = selectedCorporation?.departments.find((d) => d.name === department);

  // 입력값 상태 관리
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  //const [company, setCompany] = useState('');
  //const [department, setDepartment] = useState('');

  // 유효성 검사 결과 상태
  const [idCheck, setidCheck] = useState(false);
  const [passwordCheck, setPasswordCheck] = useState(false);
  const [passwordLengthCheck, setpasswordLenghtCheck] = useState(false);
  const [nameCheck, setnameCheck] = useState(false);

  // 경고 및 안내 메시지
  const [idMessage, setIdMessage] = useState('');
  const [passwordLengthMessage, setPasswordLenghtMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [nameMessage, setnameMessage] = useState('');
  const [departmentMessage, setDepartmentMessage] = useState('');

  // 모달과 에러 상태
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 로그인 페이지 이동 함수
  const handleLogin = () => {
    navigate('/');
  };

  // 추가: 간단한 성공 모달
const SuccessModal = ({ text, onClose }) => (
    <div className="sm-overlay">
    <div className="sm-box">
        <p>{text}</p>
        <button onClick={onClose}>확인</button>
      </div>
    </div>
  );

  // 아이디 유효성 검사
  const validateId = (value) => {
    // const hasLetter = /[a-zA-Z]/.test(value);
    // const hasNumber = /[0-9]/.test(value);
    const hasLetterOrNumber = /^[a-zA-Z0-9]+$/.test(value);

    if (!value) {
      setIdMessage('아이디를 입력해주세요');
      setidCheck(false);
    } else if (value.length < 5) {
      setIdMessage('아이디를 5자 이상 입력해주세요');
      setidCheck(false);
    } else if (value.length > 15) {
      setIdMessage('아이디를 15자 이하로 입력해주세요');
      setidCheck(false);
} else if (!hasLetterOrNumber) {
  setIdMessage('아이디는 영문자와 숫자만 사용할 수 있습니다.');
  setidCheck(false);
} else {
      setIdMessage('사용 가능한 아이디입니다.');
      setidCheck(true);
    }
  };

  // 비밀번호 길이 유효성 검사
  const validatePassword = (value) => {
    if (!value) {
      setPasswordLenghtMessage('비밀번호를 입력해주세요');
      setpasswordLenghtCheck(false);
    } else if (value.length < 5) {
      setPasswordLenghtMessage('비밀번호는 5자 이상 입력하세요');
      setpasswordLenghtCheck(false);
    } else if (value.length > 20) {
      setPasswordLenghtMessage('비밀번호를 20자 이내로 입력하세요');
      setpasswordLenghtCheck(false);
    } else {
      setPasswordLenghtMessage('사용 가능한 비밀번호입니다.');
      setpasswordLenghtCheck(true);
    }
  };

  // 비밀번호와 비밀번호 확인 일치 여부 검사
  const validatePasswordMatch = (passwordValue, confirmPasswordValue) => {
    if (passwordValue.length >= 5 && passwordValue.length <= 20 && confirmPasswordValue.length > 0) {
      if (passwordValue === confirmPasswordValue) {
        setPasswordMessage('비밀번호가 일치합니다.');
        setPasswordCheck(true);
      } else {
        setPasswordMessage('비밀번호가 일치하지 않습니다.');
        setPasswordCheck(false);
      }
    } else {
      setPasswordMessage('');
      setPasswordCheck(false);
    }
  };

  // 이름 유효성 검사
  const VaildateName = (value) => {
    const namePattern = /^[가-힣a-zA-Z\s]+$/;
    if (!value.trim()) {
      return { valid: false, message: '이름을 입력해주세요' };
    } else if (value.trim().length < 2) {
      return { valid: false, message: '이름은 2자 이상 입력해야 합니다.' };
    } else if (value.trim().length > 20) {
      return { valid: false, message: '이름은 20자 이내로 입력해야 합니다.' };
    } else if (!namePattern.test(value)) {
      return { valid: false, message: '이름에는 한글과 영문자만 입력할 수 있습니다.' };
    } else {
      return { valid: true, message: '사용 가능한 이름입니다.' };
    }
  };

  // 회원가입 버튼 눌렀을 때
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 모든 필수 항목 체크
    if (!(idCheck && passwordLengthCheck && passwordCheck && nameCheck && company && department)) {
      setErrorMessage('모든 항목을 정확히 입력하세요.');
      return;
    }

    // 정상 회원가입 진행
    setErrorMessage('');
    //setIsAlertOpen(true);

    const userData = {
      username: id,
      password,
      name,
      corporationId: Number(company), // ← 이젠 바로 ID
      affiliationId: Number(selectedDepartment?.id),
      role: 1
    };


    // JSON 데이터 콘솔 출력
    //console.log("Sending data:", JSON.stringify(userData));  // JSON 데이터 확인용

    try {
      // const response = await fetch('http://192.168.0.220:8888/account/register', {
        const response = await fetch(`${API_BASE}/account/register`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // JSON 형식으로 데이터를 보냄
        },
        body: JSON.stringify(userData), // JSON 형태로 변환해서 전송
      });
  
      const data = await response.json();
  
      if (data.code === 1) { // 성공 시 1 반환
        setIsAlertOpen(true);  // 회원가입 완료 후 모달 띄우기
      } else if (data === 0) { // 실패 시 0 반환
        setErrorMessage('❌ 회원가입 실패: 서버에서 실패 처리');
      } else {
        console.error('❌ 서버 실패 메시지:', data.message); // ← 콘솔에 출력
        setErrorMessage(data.message || '❌ 회원가입 실패: 알 수 없는 오류');
      }
    } catch (error) {
      setErrorMessage(error?.message || '🚨 서버와의 연결에 실패했습니다.');
      console.error('Error:', error);

    }

    
  };

  
  

  // 에러메세지 3초 후 자동 제거
  useEffect(() => {
    // ✅ 기존 타이머 제거 로직
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  
    // ✅ 🔽 추가: 법인 목록 불러오기
    const fetchCorporations = async () => {
      try {
        // const res = await fetch('http://192.168.0.220:8888/corporations', {
          const res = await fetch(`${API_BASE}/corporations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const result = await res.json();
  
        if (result.code === 1 && result.data?.corporationList) {
          const newMap = {};
          result.data.corporationList.forEach((corp) => {
            //console.log("법인이름 확인:", corp.name); // ✅ 확인
            newMap[corp.corporationId] = {
              name: corp.name,
              departments: corp.affiliationList.map((aff) => ({
                id: aff.affiliationId ?? aff.id,
                name: aff.department
              }))
            };
          });
          setCorporationMap(newMap);
        } else {
          console.error('법인 응답 오류:', result);
          setErrorMessage(result.message || '❌ 알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('법인 조회 실패:', err);
        setErrorMessage(err?.message || '🚨 서버 요청 중 오류가 발생했습니다.');
      }
    };
  
    fetchCorporations();
  }, [errorMessage]);  // ← 기존과 동일한 dependency 유지
  

  return (
    <div className="from_wrap">
      <form onSubmit={handleSubmit}>
        {/* 로고 */}
        <img src="/img/login_img.jpg" alt="SeWON Electronics" className="logo" />

        {/* 아이디 입력 */}
        <label htmlFor="id">아이디:</label>
        <input type="text" id="id" value={id} onChange={(e) => { setId(e.target.value); validateId(e.target.value); }} required className="input-field__input" />
        {idMessage && <p style={{ color: idCheck ? 'green' : 'red' }}>{idMessage}</p>}

        {/* 비밀번호 입력 */}
        <label htmlFor="password">비밀번호:</label>
        <input type="password" id="password" value={password} onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); validatePasswordMatch(e.target.value, confirmPassword); }} required className="input-field__input" />
        {passwordLengthMessage && <p style={{ color: passwordLengthCheck ? 'green' : 'red' }}>{passwordLengthMessage}</p>}

        {/* 비밀번호 확인 */}
        <label htmlFor="confirmPassword">비밀번호 확인:</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); validatePasswordMatch(password, e.target.value); }} required className="input-field__input" />
        {passwordMessage && <p style={{ color: passwordCheck ? 'green' : 'red' }}>{passwordMessage}</p>}

        {/* 이름 입력 */}
        <label htmlFor="name">이름:</label>
        <input type="text" id="name" value={name} onChange={(e) => { setName(e.target.value); const { valid, message } = VaildateName(e.target.value); setnameMessage(message); setnameCheck(valid); }} required className="input-field__input" />
        {nameMessage && <p style={{ color: nameCheck ? 'green' : 'red' }}>{nameMessage}</p>}

        {/* 회사 선택 */}
        {/* <label htmlFor="company">회사구분:</label>
        <select id="company" value={company} onChange={(e) => { setCompany(e.target.value); setDepartment(''); }} className="input-field__input">
          <option value="">회사 선택</option>
          {Object.keys(companyData).map((comp) => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select> */}

<label htmlFor="company">회사구분:</label>
<select
  id="company"
  value={company}
  onChange={(e) => {
    setCompany(e.target.value);
    setDepartment('');
  }}
  className="input-field__input"
>
  <option value="">회사 선택</option>
  {Object.entries(corporationMap).map(([id, corp]) => (
    <option key={id} value={id}>
      {corp.name ?? `법인-${id}`}
    </option>
  ))}
</select>
        {/* 부서 선택 */}
        {/* <label htmlFor="department">부서구분:</label>
        <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!company} className="input-field__input">
          <option value="">부서 선택</option>
          {company && companyData[company].map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select> */}
        <label htmlFor="department">부서구분:</label>
        <select
  id="department"
  value={department}
  onChange={(e) => setDepartment(e.target.value)}
  disabled={!company}
  className="input-field__input"
>
  <option value="">부서 선택</option>
  {company && corporationMap[company]?.departments.map((dept) => (
    <option key={dept.id} value={dept.name}>{dept.name}</option>
  ))}
</select>

        {/* 에러메세지 출력 */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* 회원가입 버튼 */}
        <button type="submit" className="sign-up-button">
          회원가입
        </button>
      </form>

      {/* 회원가입 완료 알람 모달 */}
      {isAlertOpen && (
  <SuccessModal
    text="회원가입이 완료되었습니다."
    onClose={handleLogin}
  />
)}
    </div>
  );
};

export default SignupForm;
