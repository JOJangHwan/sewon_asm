import React, { useState } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { Outlet } from 'react-router-dom';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="layout-body">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className="layout-main">
          <Outlet /> {/* 여기에 각 페이지 내용 들어감 */}
        </main>
      </div>

      {/* 오버레이 */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div className="overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
}

export default Layout;
