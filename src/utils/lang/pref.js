export const uiToI18n = (ui) => (ui === 'CN' ? 'zh' : ui === 'VN' ? 'vi' : 'ko');
export const i18nToUI = (lng) => (lng === 'zh' ? 'CN' : lng === 'vi' ? 'VN' : 'KR');

// ✅ 입력 값 정규화 (소문자/지역코드 대응)
export const normalizeUI = (v) => {
  if (!v) return 'KR';
  const s = String(v).toUpperCase();
  if (s.startsWith('CN') || s === 'zh') return 'CN';
  if (s.startsWith('VN') || s === 'vi') return 'VN';
  if (s.startsWith('KR') || s === 'ko') return 'KR';
  return 'KR';
};

export const getUILang = () => {
  try {
    const v = localStorage.getItem('language_ui');
    return v === 'CN' || v === 'VN' || v === 'KR' ? v : 'KR';
  } catch { return 'KR'; }
};

// ✅ 저장 시에도 정규화
export const setUILang = (ui) => {
  try { localStorage.setItem('language_ui', normalizeUI(ui)); } catch {}
};

// ✅ 서버 헤더용 헬퍼 (편의)
export const getAcceptLanguage = () => uiToI18n(getUILang()); // 'ko' | 'zh' | 'vi'
export const getServerUILang = () => getUILang();            // 'KR' | 'CN' | 'VN'