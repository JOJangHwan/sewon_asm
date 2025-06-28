import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import i18n from '../src/utils/lang/i18n.js';
import React, { useContext ,useState,useEffect } from 'react';
import { UserContext } from './utils/UserContext.js';
import LoginPage from './page/login/loginPage';
import HomePage from './page/main/Home';
import RegisterPage from './page/register/RegisterPage';
import SearchPage from './page/search/Search';
import LoadSiglePage from './page/Load/loadSingle';
import LoadBulkPage from './page/Load/loadBulk';
import AuditLoadpage from './page/Audit/auditLoad';
import AuditListpage from './page/Audit/auditList';
import ReportPage from './page/Report/report';
import MyInforPage from './page/MyInfor/myInfor';
import AssetRentPage from './page/Rent/components/CommonPage';
import ScanPage from './page/Scan/Scan';
import AssetDetailPage from './page/Scan/AssetDetailPage';
import Layout from './components/layout/Layout';
import RegisterCorpAndItem from './page/admin/RegisterCorpAndItem.js'

import './index';

// 개발: process.env, Docker: window._env_ 둘 다 지원하고 싶다면
const apiUrl = window._env_?.REACT_APP_API_URL || process.env.REACT_APP_API_URL;


// 언어 설정 적용 (URL 없이 헤더 기반)
const LanguageInitializer = ({ children }) => {
  useEffect(() => {
    const lang = localStorage.getItem('language') || 'ko';
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/join" element={<RegisterPage />} />
    <Route element={<Layout />}>
      <Route path="/main" element={<HomePage />} />
      <Route path="/load/single" element={<LoadSiglePage />} />
      <Route path="/load/bulk" element={<LoadBulkPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/audit/upload" element={<AuditLoadpage />} />
      <Route path="/audit/list" element={<AuditListpage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/profile" element={<MyInforPage />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/asset" element={<AssetDetailPage />} />
      <Route path="/rent" element={<AssetRentPage />} />
      <Route path="/RegisterCorpAndItem" element={<RegisterCorpAndItem/>}/>
    </Route>
  </Routes>
);

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <LanguageInitializer>
          <AppRoutes />
        </LanguageInitializer>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
