// ✅ src/utils/lang/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// UI↔i18n 코드 매핑
const uiToI18n = (ui) => (ui === 'CN' ? 'zh' : ui === 'VN' ? 'vi' : 'ko');
const i18nToUI = (lng) => (lng === 'zh' ? 'CN' : lng === 'vi' ? 'VN' : 'KR');

// 저장된 UI 코드로 초기 언어 결정
let savedUI = 'KR';
try {
  savedUI = localStorage.getItem('language_ui') || 'KR';
} catch {}
const initialLng = uiToI18n(savedUI);

// i18n 초기화
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: initialLng,                           // 기본 언어
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'zh', 'vi'],  // 지원 언어(언어만, 지역코드 제외)
    nonExplicitSupportedLngs: true,     // ✅ zh-CN, zh-TW 등이 와도 zh로 매핑
    load: 'languageOnly',               // ✅ 'zh-CN'처럼 들어와도 'zh'만 사용
    lowerCaseLng: true,                 // ✅ 대소문자 섞여도 소문자로 통일
    cleanCode: true,                    // ✅ 코드 정리(공백/언더스코어 등) 
    // ✅ 네임스페이스 목록에 'register' 반드시 포함
    ns: ['login','main','load','myInfor','rent','report','scan','register','loadSingle','loadBluk','Search','Home','auditList','RegisterCorpAndItem','MyInfoModal','EditModal','DisposalRegister'],
    defaultNS: 'login',
    react: { useSuspense: false },
   // debug: true,                      // 필요 시 디버그 확인용
    backend: {
      // ✅ 폴더명을 zh/ 로 두었으니 기본 경로만 사용
      loadPath: '/locales/{{lng}}/{{ns}}.json?v=1' // (선택) 개발 중 캐시 버스터
    },
    interpolation: {
      escapeValue: false
    },
    returnEmptyString: false            // 빈 문자열이면 fallback 사용
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('language_ui', i18nToUI(lng || 'ko'));
    document.documentElement.lang = lng || 'ko';
  } catch {}
});

// 첫 로드 때도 <html lang> 맞춰주기
try { document.documentElement.lang = initialLng; } catch {}


export default i18n;
