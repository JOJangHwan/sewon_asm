
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';
import { saveTokens } from '../../utils/token'; // 토큰 유틸 경로는 맞게 조정하세요



function LoginPage() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('login');

    // ✅ 환경변수 기반 백엔드 URL 설정
    const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

  
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
      // const res = await fetch('http://192.168.0.220:8888/account/login', {
        const res = await fetch(`${API_BASE}/account/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userId, password }),
      });

      const result = await res.json();

      if (result.code === 1) {
        const { accessToken, refreshToken,name, id, username, department,corporation,affiliationId } = result.data;
       // console.log("로그인할때 받는 정보"+result.data);

        // ✅ 토큰 및 사용자 정보 저장
        saveTokens({ accessToken, refreshToken });
        //console.log("로그인할때 받는 정보"+result.corporation)
        localStorage.setItem('corporation',corporation)
        localStorage.setItem('name', name);
        localStorage.setItem('userId', id);
        localStorage.setItem('username', username);
        localStorage.setItem('department', department);
        localStorage.setItem('affiliationId', affiliationId);

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
  
      {/* ✅ <form> 시작 */}
      <form className="loginPage-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
  
        {/* ===== 언어 선택을 폼 내부로 이동 ===== */}
        <div className="loginPage-lang">
          <label><input type="radio" name="lang" value="ko" checked={i18n.language === 'ko'} onChange={handleLangChange}/>한국어</label>
          <label><input type="radio" name="lang" value="vi" checked={i18n.language === 'vi'} onChange={handleLangChange}/>Tiếng Việt</label>
          <label><input type="radio" name="lang" value="ch" checked={i18n.language === 'ch'} onChange={handleLangChange}/>中文</label>
        </div>
  
        {/* 로고 / 타이틀 */}
        <img src="/img/login_img.jpg" alt="로고" className="loginPage-logo" />
        <div className="loginPage-title">{t('title') || '세원전자 자산관리 시스템'}</div>
        <p className="loginPage-desc">Sewon Electronics<br />Asset Management System</p>
  
        {/* 아이디 / 비밀번호 */}
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
  
        {/* 아이디 저장 */}
        <div className="loginPage-remember">
          <input
            type="checkbox"
            id="remember"
            checked={rememberId}
            onChange={(e) => setRememberId(e.target.checked)}
          />
          <label htmlFor="remember">{t('remember') || '아이디 저장'}</label>
        </div>
  
        {/* 에러 메시지 */}
        {error && <div style={{ color: 'red', fontSize: '13px' }}>{error}</div>}
  
        {/* 버튼 */}
        <button type="submit" className="loginPage-loginButton">
          {t('submit') || '로그인'}
        </button>
        <button type="button" className="loginPage-signupButton" onClick={handleRegister}>
          {t('register') || '회원가입'}
        </button>
  
      </form>
    </div>
  );
}

export default LoginPage;