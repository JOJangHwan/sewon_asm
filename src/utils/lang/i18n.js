// ✅ src/utils/lang/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// i18n 초기화
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'ko', // 기본 언어
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'ch', 'vi'], // 지원 언어 목록
    ns: ['login','main', 'load', 'myinfor', 'rent', 'report', 'scan'], // 네임스페이스 목록
    defaultNS: 'login',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json' // ex: /locales/ko/main.json, /locales/ch/main.json // 번역 파일 경로
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
