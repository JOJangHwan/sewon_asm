import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import i18n from '../src/utils/lang/i18n.js';
import React, { useContext, useEffect } from 'react';
import { UserProvider, UserContext } from './utils/UserContext.js';

// 페이지 컴포넌트
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
import AdminUserPage from './page/admin/adminUserManage';
import ScanPage from './page/Scan/Scan';
import AssetDetailPage from './page/Scan/AssetDetailPage';
import RegisterCorpAndItem from './page/admin/RegisterCorpAndItem';
import DualTransferSimple from './page/Load/DualTransferSimple';
import DisposalRegister from './page/Load/DisposalRegister'
import Layout from './components/layout/Layout';

import './index';

const apiUrl = window._env_?.REACT_APP_API_URL || process.env.REACT_APP_API_URL;

/* ───────────────────────────────────────
🌐 언어 초기화
─────────────────────────────────────── */
const LanguageInitializer = ({ children }) => {
  useEffect(() => {
    const lang = localStorage.getItem('language') || 'ko';
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, []);
  return children;
};

/* ───────────────────────────────────────
🔐 보호 라우트
─────────────────────────────────────── */
 const PrivateRoute = ({ element }) => {
     const { user, isLoading } = useContext(UserContext);
  
     if (isLoading) {
       return <div>로딩 중...</div>; // 또는 커스텀 스피너
     }
  
     return user ? element : <Navigate to="/" replace />;
   };

/* ───────────────────────────────────────
🚦 전체 라우트 정의
─────────────────────────────────────── */
const AppRoutes = () => (
  <Routes>
    {/* 공개 페이지 */}
    <Route path="/" element={<LoginPage />} />
    <Route path="/join" element={<RegisterPage />} />

    {/* 보호 페이지 */}
    <Route element={<Layout />}>
      <Route path="/main"               element={<PrivateRoute element={<HomePage />} />} />
      <Route path="/load/single"        element={<PrivateRoute element={<LoadSiglePage />} />} />
      <Route path="/load/bulk"          element={<PrivateRoute element={<LoadBulkPage />} />} />
      <Route path="/load/disposal"      element={<PrivateRoute element={<DisposalRegister/>}/>}/>
      <Route path="/search"             element={<PrivateRoute element={<SearchPage />} />} />
      <Route path="/audit/upload"       element={<PrivateRoute element={<AuditLoadpage />} />} />
      <Route path="/audit/list"         element={<PrivateRoute element={<AuditListpage />} />} />
      <Route path="/report"             element={<PrivateRoute element={<ReportPage />} />} />
      <Route path="/profile"            element={<PrivateRoute element={<MyInforPage />} />} />
      <Route path="/scan"               element={<PrivateRoute element={<ScanPage />} />} />
      <Route path="/asset"              element={<PrivateRoute element={<AssetDetailPage />} />} />
      <Route path="/rent"               element={<PrivateRoute element={<AssetRentPage />} />} />
      <Route path="/RegisterCorpAndItem" element={<PrivateRoute element={<RegisterCorpAndItem />} />} />
      <Route path="/DualTransferSimple"  element={<PrivateRoute element={<DualTransferSimple />} />} />
      <Route path="/UserManage"  element={<PrivateRoute element={<AdminUserPage />} />} />
    </Route>
  </Routes>
);

/* ───────────────────────────────────────
🚀 사용자 초기화 (로딩 처리 포함)
─────────────────────────────────────── */
 const UserInitializer = () => {
     return (
       <Router>
         <LanguageInitializer>
           <AppRoutes />
         </LanguageInitializer>
       </Router>
     );
   };

/* ───────────────────────────────────────
📦 최상위 App 컴포넌트
─────────────────────────────────────── */
function App() {
  return (
    <UserProvider>
      <UserInitializer />
    </UserProvider>
  );
}

export default App;
