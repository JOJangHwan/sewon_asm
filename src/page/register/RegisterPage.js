// "use client"
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Register.css';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n, setUILang } from '../../utils/lang/pref';

const API_BASE = window._env_?.REACT_APP_API_URL|| 'http://localhost:8888';


// 현재 UI 언어를 서버에 함께 보낼 때 쓰는 옵션 머지 헬퍼
const withLang = (opts = {}) => {
  const ui  = getUILang();      // 'KR' | 'CN' | 'VN'
  const lng = uiToI18n(ui);     // 'ko' | 'zh' | 'vi'
  return {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'Accept-Language': lng, // 표준
      'language': ui,         // 서버 커스텀
    },
  };
};



// 서버가 주는 에러 메시지 우선 추출
const pickServerMsg = (obj, fallback) =>
  obj?.message
  || obj?.msg
  || obj?.error
  || obj?.data?.message
  || obj?.data?.error
  || obj?.errors?.[0]?.message
  || fallback;

//console.log("환경변수확인 :", API_BASE);
 const SignupForm = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { t, i18n, ready } = useTranslation('register', { useSuspense: false });

  

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
        <button onClick={onClose}>{t('RegisterPage_Confirm')}</button>
      </div>
    </div>
  );

  // 아이디 유효성 검사
  const validateId = (value) => {
    // const hasLetter = /[a-zA-Z]/.test(value);
    // const hasNumber = /[0-9]/.test(value);
    const hasLetterOrNumber = /^[a-zA-Z0-9]+$/.test(value);

    if (!value) {
      setIdMessage(t('RegisterPage_Validation_UsernameRequired'));
      setidCheck(false);
    } else if (value.length < 5) {
      setIdMessage(t('RegisterPage_Validation_UsernameMinLen'));
      setidCheck(false);
    } else if (value.length > 15) {
      setIdMessage(t('RegisterPage_Validation_UsernameMaxLen'));
      setidCheck(false);
} else if (!hasLetterOrNumber) {
  setIdMessage(t('RegisterPage_Validation_UsernameAlnumOnly'));
  setidCheck(false);
} else {
      setIdMessage(t('RegisterPage_Validation_UsernameAvailable'));
      setidCheck(true);
    }
  };

  // 비밀번호 길이 유효성 검사
  const validatePassword = (value) => {
    if (!value) {
      setPasswordLenghtMessage(t('RegisterPage_Validation_PasswordRequired'));
      setpasswordLenghtCheck(false);
    } else if (value.length < 5) {
      setPasswordLenghtMessage(t('RegisterPage_Validation_PasswordMinLen'));
      setpasswordLenghtCheck(false);
    } else if (value.length > 20) {
      setPasswordLenghtMessage(t('RegisterPage_Validation_PasswordMaxLen'));
      setpasswordLenghtCheck(false);
    } else {
      setPasswordLenghtMessage(t('RegisterPage_Validation_PasswordValid'));
      setpasswordLenghtCheck(true);
    }
  };

  // 비밀번호와 비밀번호 확인 일치 여부 검사
  const validatePasswordMatch = (passwordValue, confirmPasswordValue) => {
    if (passwordValue.length >= 5 && passwordValue.length <= 20 && confirmPasswordValue.length > 0) {
      if (passwordValue === confirmPasswordValue) {
        setPasswordMessage(t('RegisterPage_Validation_PasswordsMatch'));
        setPasswordCheck(true);
      } else {
        setPasswordMessage(t('RegisterPage_Validation_PasswordsNotMatch'));
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
      return { valid: false, message: t('RegisterPage_Validation_NameRequired') };
    } else if (value.trim().length < 2) {
      return { valid: false, message: t('RegisterPage_Validation_NameMinLen') };
    } else if (value.trim().length > 20) {
      return { valid: false, message: t('RegisterPage_Validation_NameMaxLen') };
    } else if (!namePattern.test(value)) {
      return { valid: false, message: t('RegisterPage_Validation_NameKrEnOnly') };
    } else {
      return { valid: true, message: t('RegisterPage_Validation_NameAvailable') };
    }
  };

  // 회원가입 버튼 눌렀을 때
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 모든 필수 항목 체크
 if (!(idCheck && passwordLengthCheck && passwordCheck && nameCheck && company && department)) {
   setErrorMessage(t('RegisterPage_FillAllFieldsAccurately'));
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
const response = await fetch(
  `${API_BASE}/account/register`,
  withLang({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
);
  
      let data = null;
      try { data = await response.json(); } catch {}
      if (response.ok && data?.code === 1) {
        setIsAlertOpen(true);
} else {
  const msg = pickServerMsg(
    data,
    `${t('RegisterPage_Error_SignUpFailed_Unknown')} (${response.status})`
  );
        console.error('❌ 서버 실패:', data || response);
        setErrorMessage(msg);
      }
} catch (error) {
  setErrorMessage(error?.message || t('RegisterPage_Error_ServerConnection'));
      console.error('Error:', error);

    }

    
  };

   // ▶ 최초 진입 시 URL/state에서 넘어온 언어를 i18n과 <html lang>에 반영
 useEffect(() => {
   const params = new URLSearchParams(location.search);
   const fromURL = params.get('lang');          // 'KR' | 'CN' | 'VN'
   const fromState = location.state?.langUI;    // navigate('/join', { state:{ langUI } })
   const ui = fromURL || fromState || getUILang() || 'KR';
   setUILang(ui);                               // 로컬 저장
   const lng = uiToI18n(ui);                    // 'ko' | 'zh' | 'vi'
   i18n.changeLanguage(lng);                    // i18n 적용
   document.documentElement.lang = lng;         // <html lang="...">
 }, [location, i18n]);

  
  

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
const res = await fetch(
  `${API_BASE}/corporations`,
  withLang({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
  })
);
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
          setErrorMessage(pickServerMsg(result, `❌ ${t('RegisterPage_Error_RequestFailed')}`));
        }
      } catch (err) {
        console.error('법인 조회 실패:', err);
        setErrorMessage(err?.message || `🚨 ${t('RegisterPage_Error_RequestFailed')}`);
      }
    };
  
    fetchCorporations();
  }, [errorMessage]);  // ← 기존과 동일한 dependency 유지
  

// 네임스페이스 로딩 완료 전에는 빈 컨테이너 표시(키 노출 방지)
if (!ready) return <div className="from_wrap" />;
return (
    <div className="from_wrap">
      <form onSubmit={handleSubmit}>
        {/* 로고 */}
        <img src="/img/login_img.jpg" alt="SeWON Electronics" className="logo" />

         

        {/* 아이디 입력 */}
        <label htmlFor="id">{t('RegisterPage_UsernameLabel')}</label>
        <input type="text" id="id" value={id} onChange={(e) => { setId(e.target.value); validateId(e.target.value); }} required className="input-field__input" />
        {idMessage && <p style={{ color: idCheck ? 'green' : 'red' }}>{idMessage}</p>}

        {/* 비밀번호 입력 */}
       <label htmlFor="password">{t('RegisterPage_PasswordLabel')}</label>
        <input type="password" id="password" value={password} onChange={(e) => { setPassword(e.target.value); validatePassword(e.target.value); validatePasswordMatch(e.target.value, confirmPassword); }} required className="input-field__input" />
        {passwordLengthMessage && <p style={{ color: passwordLengthCheck ? 'green' : 'red' }}>{passwordLengthMessage}</p>}

        {/* 비밀번호 확인 */}
        <label htmlFor="confirmPassword">{t('RegisterPage_PasswordConfirmLabel')}</label>
        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); validatePasswordMatch(password, e.target.value); }} required className="input-field__input" />
        {passwordMessage && <p style={{ color: passwordCheck ? 'green' : 'red' }}>{passwordMessage}</p>}

        {/* 이름 입력 */}
        <label htmlFor="name">{t('RegisterPage_NameLabel')}</label>
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

<label htmlFor="company">{t('RegisterPage_CompanyTypeLabel')}</label>
<select
  id="company"
  value={company}
  onChange={(e) => {
    setCompany(e.target.value);
    setDepartment('');
  }}
  className="input-field__input"
>
  <option value="">{t('RegisterPage_SelectCompany')}</option>
  {Object.entries(corporationMap).map(([id, corp]) => (
    <option key={id} value={id}>
      {corp.name ?? `${t('RegisterPage_Corporation')}-${id}`}
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
        <label htmlFor="department">{t('RegisterPage_DepartmentTypeLabel')}</label>
        <select
  id="department"
  value={department}
  onChange={(e) => setDepartment(e.target.value)}
  disabled={!company}
  className="input-field__input"
>
  <option value="">{t('RegisterPage_SelectDepartment')}</option>
  {company && corporationMap[company]?.departments.map((dept) => (
    <option key={dept.id} value={dept.name}>{dept.name}</option>
  ))}
</select>

        {/* 에러메세지 출력 */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* 회원가입 버튼 */}
        <button type="submit" className="sign-up-button">
          {t('RegisterPage_Title')}
        </button>
      </form>

      {/* 회원가입 완료 알람 모달 */}
{isAlertOpen && (
  <SuccessModal
    text={t('RegisterPage_SignUpCompleted')}
    onClose={handleLogin}
  />
)}
    </div>
  );
};

export default SignupForm;
