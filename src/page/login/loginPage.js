// // "use client"
// import { useNavigate } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import './LoginPage.css'; // 경로 주의! (Register.css 아님)

// function LoginPage() {
//   const navigate = useNavigate();

//   // 아이디 저장 상태
//   const [userId, setUserId] = useState('');
//   const [rememberId, setRememberId] = useState(false);

//   // 컴포넌트 처음 로딩 시, localStorage에 저장된 아이디 불러오기
//   useEffect(() => {
//     const savedId = localStorage.getItem('savedUserId');
//     if (savedId) {
//       setUserId(savedId);
//       setRememberId(true);
//     }
//   }, []);

//   // 로그인 버튼 클릭 시
//   const handleLogin = () => {
//     if (rememberId) {
//       localStorage.setItem('savedUserId', userId);
//     } else {
//       localStorage.removeItem('savedUserId');
//     }
//     navigate('/main'); // 메인 페이지 이동
//   };

//   // 회원가입 버튼 클릭 시
//   const handleRegister = () => {
//     navigate('/users/join'); // 회원가입 페이지 이동
//   };

//   // 아이디 저장 체크박스 핸들링
//   const handleRememberChange = (e) => {
//     setRememberId(e.target.checked);
//   };

//   // 아이디 입력 핸들링
//   const handleUserIdChange = (e) => {
//     setUserId(e.target.value);
//   };

//   return (
//     <div className="loginPage-container">
//       {/* 로고 */}
//       <img src="/img/login_img.jpg" alt="로고" className="loginPage-logo" />

//       {/* 타이틀 */}
//       <div className="loginPage-title">세원전자 자산관리 시스템</div>
//       <p className="loginPage-desc">Sewon Electronics<br />Asset Management System</p>

//       {/* 아이디, 비밀번호 입력 */}
//       <input type="text" placeholder="아이디" value={userId} className="loginPage-input" onChange={handleUserIdChange} />
//       <input type="password" placeholder="비밀번호" className="loginPage-input" />

//       {/* 아이디 저장 */}
//       <div className="loginPage-remember">
//         <input type="checkbox" id="remember" checked={rememberId} onChange={handleRememberChange} />
//         <label htmlFor="remember">아이디 저장</label>
//       </div>

//       {/* 버튼들 */}
//       <button className="loginPage-loginButton" onClick={handleLogin}>로그인</button>
//       <button className="loginPage-signupButton" onClick={handleRegister}>회원가입</button>
//     </div>
//   );
// }

// export default LoginPage;

// "use client"
// import { useNavigate } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
// import './LoginPage.css';

// function LoginPage() {
//   const navigate = useNavigate();
//   const { i18n, t } = useTranslation('login');

//   const [userId, setUserId] = useState('');
//   const [rememberId, setRememberId] = useState(false);

//   useEffect(() => {
//     const savedId = localStorage.getItem('savedUserId');
//     if (savedId) {
//       setUserId(savedId);
//       setRememberId(true);
//     }
//   }, []);

//   const handleLogin = () => {
//     if (rememberId) {
//       localStorage.setItem('savedUserId', userId);
//     } else {
//       localStorage.removeItem('savedUserId');
//     }
//     navigate('/main');
//   };

//   const handleRegister = () => {
//     navigate('/join');
//   };

//   const handleLangChange = (e) => {
//     const selectedLang = e.target.value;
//     i18n.changeLanguage(selectedLang);
//     document.documentElement.lang = selectedLang;
//     localStorage.setItem('language', selectedLang);
//   };

//   return (
//     <div className="loginPage-container">
//       {/* ✅ 언어 선택 라디오 */}
//       <div className="loginPage-lang">
//         <label>
//           <input type="radio" name="lang" value="ko" checked={i18n.language === 'ko'} onChange={handleLangChange} />
//           한국어
//         </label>
//         <label>
//           <input type="radio" name="lang" value="vi" checked={i18n.language === 'vi'} onChange={handleLangChange} />
//           Tiếng Việt
//         </label>
//         <label>
//           <input type="radio" name="lang" value="ch" checked={i18n.language === 'ch'} onChange={handleLangChange} />
//           中文
//         </label>
//       </div>

//       <img src="/img/login_img.jpg" alt="로고" className="loginPage-logo" />
//       <div className="loginPage-title">{t('title') || '세원전자 자산관리 시스템'}</div>
//       <p className="loginPage-desc">
//         Sewon Electronics<br />Asset Management System
//       </p>

//       <input type="text" placeholder={t('username') || '아이디'} value={userId} className="loginPage-input" onChange={(e) => setUserId(e.target.value)} />
//       <input type="password" placeholder={t('password') || '비밀번호'} className="loginPage-input" />

//       <div className="loginPage-remember">
//         <input type="checkbox" id="remember" checked={rememberId} onChange={(e) => setRememberId(e.target.checked)} />
//         <label htmlFor="remember">{t('remember') || '아이디 저장'}</label>
//       </div>

//       <button className="loginPage-loginButton" onClick={handleLogin}>{t('submit') || '로그인'}</button>
//       <button className="loginPage-signupButton" onClick={handleRegister}>{t('register') || '회원가입'}</button>
//     </div>
//   );
// }

// export default LoginPage;




//적용할때 풀기
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';
import { saveTokens } from '../../utils/token'; // 토큰 유틸 경로는 맞게 조정하세요

function LoginPage() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('login');

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedId = localStorage.getItem('savedUserId');
    if (savedId) {
      setUserId(savedId);
      setRememberId(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (rememberId) {
      localStorage.setItem('savedUserId', userId);
    } else {
      localStorage.removeItem('savedUserId');
    }

    try {
      const res = await fetch('http://192.168.0.220:8888/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userId, password }),
      });

      const result = await res.json();

      if (result.code === 1) {
        const { accessToken, refreshToken, id, username, department } = result.data;

        // ✅ 토큰 및 사용자 정보 저장
        saveTokens({ accessToken, refreshToken });
        localStorage.setItem('userId', id);
        localStorage.setItem('username', username);
        localStorage.setItem('department', department);

        navigate('/main');
      } else {
        setError('❌ 로그인 실패: 사용자 정보가 잘못되었습니다.');
      }
    } catch (err) {
      setError('🚨 서버 연결에 실패했습니다.');
      console.error(err);
    }
  };

  const handleRegister = () => {
    navigate('/join');
  };

  const handleLangChange = (e) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
    document.documentElement.lang = selectedLang;
    localStorage.setItem('language', selectedLang);
  };

  return (
    <div className="loginPage-container">
      {/* 언어 선택 */}
      <div className="loginPage-lang">
        <label><input type="radio" name="lang" value="ko" checked={i18n.language === 'ko'} onChange={handleLangChange} />한국어</label>
        <label><input type="radio" name="lang" value="vi" checked={i18n.language === 'vi'} onChange={handleLangChange} />Tiếng Việt</label>
        <label><input type="radio" name="lang" value="ch" checked={i18n.language === 'ch'} onChange={handleLangChange} />中文</label>
      </div>

      <img src="/img/login_img.jpg" alt="로고" className="loginPage-logo" />
      <div className="loginPage-title">{t('title') || '세원전자 자산관리 시스템'}</div>
      <p className="loginPage-desc">Sewon Electronics<br />Asset Management System</p>

      <input
        type="text"
        placeholder={t('username') || '아이디'}
        value={userId}
        className="loginPage-input"
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        type="password"
        placeholder={t('password') || '비밀번호'}
        className="loginPage-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="loginPage-remember">
        <input
          type="checkbox"
          id="remember"
          checked={rememberId}
          onChange={(e) => setRememberId(e.target.checked)}
        />
        <label htmlFor="remember">{t('remember') || '아이디 저장'}</label>
      </div>

      {error && <div style={{ color: 'red', fontSize: '13px' }}>{error}</div>}

      <button className="loginPage-loginButton" onClick={handleLogin}>
        {t('submit') || '로그인'}
      </button>
      <button className="loginPage-signupButton" onClick={handleRegister}>
        {t('register') || '회원가입'}
      </button>
    </div>
  );
}

export default LoginPage;
