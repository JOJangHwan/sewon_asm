// "use client"
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../../components/common/AlertModal.js';
import './Register.css';

// 회사 및 부서 데이터
const companyData = {
  경영기획팀: ['회계', '감사인사', '원가', '전산운영'],
  관리팀: ['노무총무', '품질보증'],
  기술개발팀: ['기술', '개발'],
  생산운영팀: ['생산관리', '영업'],
  경산공장: [],
  우신에너지: ['경영관리', '자재관리', '구매관리'],
  덕주파니타: [],
  위해풍국: [],
  우신비나: ['1공장','2공장','3공장'],
};

const SignupForm = () => {
  const navigate = useNavigate();

  // 입력값 상태 관리
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');

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

  // 아이디 유효성 검사
  const validateId = (value) => {
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    if (!value) {
      setIdMessage('아이디를 입력해주세요');
      setidCheck(false);
    } else if (value.length < 5) {
      setIdMessage('아이디를 5자 이상 입력해주세요');
      setidCheck(false);
    } else if (value.length > 15) {
      setIdMessage('아이디를 15자 이하로 입력해주세요');
      setidCheck(false);
    } else if (!(hasLetter && hasNumber)) {
      setIdMessage('아이디에는 영문자와 숫자가 모두 포함되어야 합니다.');
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
    } else if (value.length < 10) {
      setPasswordLenghtMessage('비밀번호는 10자 이상 입력하세요');
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
    if (passwordValue.length >= 10 && passwordValue.length <= 20 && confirmPasswordValue.length > 0) {
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
      id,
      password,
      name,
      company,
      department
    };

    // JSON 데이터 콘솔 출력
    console.log("Sending data:", JSON.stringify(userData));  // JSON 데이터 확인용

    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // JSON 형식으로 데이터를 보냄
        },
        body: JSON.stringify(userData), // JSON 형태로 변환해서 전송
      });
  
      const data = await response.json();
  
      if (data === 1) { // 성공 시 1 반환
        setIsAlertOpen(true);  // 회원가입 완료 후 모달 띄우기
      } else if (data === 0) { // 실패 시 0 반환
        setErrorMessage('❌ 회원가입 실패: 서버에서 실패 처리');
      } else {
        setErrorMessage('알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      setErrorMessage('🚨 서버와의 연결에 실패했습니다.');
      console.error('Error:', error);
    }

    
  };

  
  

  // 에러메세지 3초 후 자동 제거
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

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
        <label htmlFor="company">회사구분:</label>
        <select id="company" value={company} onChange={(e) => { setCompany(e.target.value); setDepartment(''); }} className="input-field__input">
          <option value="">회사 선택</option>
          {Object.keys(companyData).map((comp) => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>

        {/* 부서 선택 */}
        <label htmlFor="department">부서구분:</label>
        <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!company} className="input-field__input">
          <option value="">부서 선택</option>
          {company && companyData[company].map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
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
        <AlertModal
          message="회원가입이 완료되었습니다."
          onClose={handleLogin}
        />
      )}
    </div>
  );
};

export default SignupForm;
