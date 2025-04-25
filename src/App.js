import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './page/login/loginPage'; // 로그인인
import HomePage from './page/main/Home';//홈
import RegisterPage from './page/register/RegisterPage'; //회원가입
import SearchPage from './page/search/Search'; //조회
import LoadSiglePage from './page/Load/loadSingle';//자산개별등록
import LoadBulkPage from './page/Load/loadBulk';//자산개별등록

import AuditLoadpage from './page/Audit/auditLoad'; //실사등록
import AuditListpage from './page/Audit/auditList'; //실사리스트
import ReportPage from './page/Report/report'; //보고서
import MyInforPage from './page/MyInfor/myInfor'//내정보

import AssetRentPage from './page/Rent/components/CommonPage'//대여
import ScanPage from './page/Scan/Scan'//스캔기능
import AssetDetailPage from './page/Scan/AssetDetailPage'//상세정보보는 스캔기능

import Layout from './components/layout/Layout';//공통레이아웃


// import 나머지 페이지...
import './index'; // ✅ css를 여기서 불러와야 적용된다!

function App() {
  return (
    // <Router>
    //   <Routes>
    //     <Route path="/users/login" element={<LoginPage />} />
    //     <Route path="/main" element={<MainPage />} />
    //     <Route path="/users/join" element={<RegisterPage/>} />
        
    //   </Routes>
    // </Router>
<Router>
      <Routes>
        {/* 레이아웃 없이 단독 페이지 */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/users/join" element={<RegisterPage />} />

        {/* 공통 레이아웃 적용되는 페이지들 */}
        <Route element={<Layout />}>
          <Route path="/main" element={<HomePage />} />
          <Route path='/load/single' element={<LoadSiglePage/>} />
          <Route path='/load/bulk' element={<LoadBulkPage/>} />

          <Route path='/search' element={<SearchPage/>}></Route>
          <Route path='/audit/upload' element={<AuditLoadpage/>}></Route>
          <Route path='/audit/list' element={<AuditListpage/>}></Route>
          <Route path='/report' element={<ReportPage/>}></Route>
          <Route path='/profile' element={<MyInforPage/>}></Route>

          <Route path='/scan' element={<ScanPage/>}></Route>
          <Route path="/asset" element={<AssetDetailPage />} />
          <Route path='/rent' element={<AssetRentPage/>}></Route>



        </Route>
      </Routes>
    </Router>


  );
}

export default App;
