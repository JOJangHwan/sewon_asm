import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { Outlet } from 'react-router-dom';

function Layout() {
  // ✅ 초기 열림 여부: PC에서는 true, 모바일에서는 false
  const getInitialSidebarState = () => window.innerWidth > 768;

  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

  // ✅ 화면 크기 바뀌면 다시 열어줌 (PC에서)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    // ✅ 모바일일 때만 토글 가능
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(prev => !prev);
    }
  };

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="layout-body">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="layout-main">
          <Outlet />
        </main>
      </div>

      {/* 오버레이: 모바일일 때만 보이게 */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div className="overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
}

export default Layout;
