import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { uiToI18n, getUILang, setUILang } from '../../utils/lang/pref';
import './LoginPage.css';
import { saveTokens } from '../../utils/token';
import { UserContext } from '../../utils/UserContext';

function LoginPage() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('login');

  const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8888';

  // ✅ 언어 옵션: 화면/헤더(KR/CN/VN) ↔ i18n(ko/zh/vi) 분리
  // ✅ 언어 옵션: 화면/헤더(KR/CN/VN) ↔ i18n(ko/zh/vi) 분리
  const LANG_OPTIONS = [
    { ui: 'KR', i18n: 'ko', fi: 'kr', label: '한국어' },
    { ui: 'CN', i18n: 'zh', fi: 'cn', label: '中文' },
    { ui: 'VN', i18n: 'vi', fi: 'vn', label: 'Tiếng Việt' },
  ];

  // 문자열 → UI 코드(KR/CN/VN)
  const toUiCode = (val) => {
    if (!val) return 'KR';
    const s = String(val).toLowerCase();
    if (s === 'kr' || s === 'ko' || s.startsWith('kr-') || s.startsWith('ko-')) return 'KR';
    if (s === 'cn' || s === 'zh' || s.startsWith('cn-') || s.startsWith('zh-') || s === 'ch') return 'CN';
    if (s === 'vn' || s === 'vi' || s.startsWith('vn-') || s.startsWith('vi-')) return 'VN';
    return 'KR';
  };

const [langUI, setLangUI] = useState(getUILang());

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const savedId = localStorage.getItem('savedUserId');
    if (savedId) { setUserId(savedId); setRememberId(true); }
  }, []);

  // ✅ 첫 진입 시 저장된 언어로 i18n 동기화(없으면 KR)
  useEffect(() => {
    const initial = getUILang();
    const code = uiToI18n(initial);
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    setLangUI(initial);
  }, [i18n]);



  // 로그인 유지 자동 이동
  useEffect(() => { if (user) navigate('/main'); }, [user, navigate]);

  const extractErrorMessage = (res, result) =>
    result?.message || result?.msg || result?.error || result?.errors?.[0]?.message ||
    `로그인 실패 (${res?.status ?? '-'})`;

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (rememberId) localStorage.setItem('savedUserId', userId);
    else localStorage.removeItem('savedUserId');

    try {
      const res = await fetch(`${API_BASE}/account/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
         language: langUI,                     // 서버 커스텀 헤더(KR/CN/VN)
         'Accept-Language': uiToI18n(langUI),  // 표준 헤더(ko/zh/vi)
        },
        body: JSON.stringify({ username: userId, password }),
      });

      let result = null;
      try { result = await res.json(); } catch {}

      if (res.ok && result?.code === 1) {
        // 로그인 성공 후에도 지금 선택한 언어 그대로(이미 적용되어 있으므로 추가 작업 불필요)
        setUILang(langUI);

        // (선택) 서버가 선호언어를 내려주면 그것으로 덮어쓰기
        // const pref = result.data?.preferredLanguageUI; // 'KR'|'CN'|'VN'
        // if (pref) { i18n.changeLanguage(uiToI18n(pref)); localStorage.setItem('language_ui', pref); }
        const {
          accessToken, refreshToken,
          name, id, username, department, corporation, affiliationId, role,
        } = result.data || {};

        setUser({
          name, id, username, department,
          company: corporation, affiliationId, role,
        });
        saveTokens({ accessToken, refreshToken });
        navigate('/main');
      } else {
        setError(extractErrorMessage(res, result));
      }
    } catch (err) {
      setError(err?.message || '🚨 서버 연결에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //const handleRegister = () => navigate('/join');
    const handleRegister = () => {
    // 지금 라디오에서 선택한 UI 언어를 영구 저장 (Register 페이지/요청에서 사용)
    setUILang(langUI);                 // 'KR' | 'CN' | 'VN'
    // (선택) URL 쿼리 + 라우터 state로도 전달해서 즉시 반영 가능
    navigate(`/join?lang=${langUI}`, { state: { langUI } });
  };

  return (
    <div className="loginPage-container">
      <form className="loginPage-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
        <img src="/img/login_img.jpg" alt="로고" className="loginPage-logo" />
        <div className="loginPage-title">{t('Login_AppTitle') || '세원전자 자산관리 시스템'}</div>
        <p className="loginPage-desc">Sewon Electronics<br/>Asset Management System</p>

        {/* ✅ 언어 라디오 (ID 입력창 위, 코드 표시는 숨김) */}
        <div className="loginPage-lang">
          {LANG_OPTIONS.map(opt => (
            <label key={opt.ui}>
              <input
                type="radio"
                name="lang"
                value={opt.ui}
                checked={langUI === opt.ui}
                onChange={(e) => {
                  const ui = e.target.value;         // 'KR' | 'CN' | 'VN'
                  const code = uiToI18n(ui);         // 'ko' | 'zh' | 'vi'
                  setLangUI(ui);                     // 상태 업데이트
                  setUILang(ui);                     // ✅ 영속 저장
                  i18n.changeLanguage(code);         // ✅ 즉시 미리보기
                  document.documentElement.lang = code;
                }}
              />
              <span className={`fi fi-${opt.fi}`} aria-hidden="true" />
              <span className="lang-text">{opt.ui}</span>
            </label>
          ))}
        </div>

        <input
          type="text"
          placeholder={t('Login_Username') || '아이디'}
          value={userId}
          className="loginPage-input"
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="password"
          placeholder={t('Login_Password') || '비밀번호'}
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
          <label htmlFor="remember">{t('Login_RememberId') || '아이디 저장'}</label>
        </div>

        {error && <div style={{ color: 'red', fontSize: '13px' }}>{error}</div>}
        {loading && <div className="loginPage-spinner" aria-label="Loading" />}

        <button type="submit" className="loginPage-loginButton" disabled={loading}>
          {t('Login_Button') || '로그인'}
        </button>
        <button type="button" className="loginPage-signupButton" onClick={handleRegister}>
          {t('Login_SignUp') || '회원가입'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
