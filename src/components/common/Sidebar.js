import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import homeImg from '../../assets/img/home.png';
import uploadImg from '../../assets/img/upload.png';
import searchImg from '../../assets/img/search.png';
import auditImg from '../../assets/img/audit.png';
import reportImg from '../../assets/img/report.png';
import myInforImg from '../../assets/img/myInfor.png';
import RegisterCorpAndItemImg from '../../assets/img/b.png';
import AssetTransImg from '../../assets/img/a.png';

function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const menuItems = [
    { path: '/main', icon: homeImg, label: '홈' },
    {
      label: '등록',
      icon: uploadImg,
      subMenus:[
        { path: '/load/single',label: '개별등록'},
        { path: '/load/bulk', label: '일괄등록'},
        { path: '/load/disposal', label: '폐기등록'}
      ]
    },
    { path: '/search', icon: searchImg, label: '조회' },
    { 
      label: '실사',
      icon: auditImg,
      subMenus: [
        { path: '/audit/upload', label: '실사 등록' },
        { path: '/audit/list', label: '실사 조회' },
      ],
    },
    // { path: '/report', icon: reportImg, label: '보고서' },
    { path: '/RegisterCorpAndItem', icon: RegisterCorpAndItemImg, label: '법인 및 품목등록' },
    { path: '/DualTransferSimple', icon: AssetTransImg, label: '이관 등록' },
    { path: '/profile', icon: myInforImg, label: '내정보' },
  ];

  const isMobile = window.innerWidth <= 768; // 모바일인지 체크

  return (
    <>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        {menuItems.map((item, idx) => (
          <div 
            key={idx}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => {
              if (item.path) {
                navigate(item.path);
                if (isMobile) toggleSidebar(); // ✅ 모바일에서 클릭 시 닫힘
              }
            }}
            onMouseEnter={() => setHoveredMenu(item.label)}
            onMouseLeave={() => setHoveredMenu(null)}
          >
            <div className="sidebar-icon">
              <img src={item.icon} alt={item.label} />
            </div>
            <div className="sidebar-label">{item.label}</div>

            {/* 실사 하위 메뉴 */}
            {item.subMenus && hoveredMenu === item.label && (
              <div className="submenu">
                {item.subMenus.map((subItem, subIdx) => (
                  <div
                    key={subIdx}
                    className="submenu-item"
                    onClick={() => {
                      navigate(subItem.path);
                      if (isMobile) toggleSidebar(); // ✅ 모바일에서 클릭 시 닫힘
                    }}
                  >
                    {subItem.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* 🔥 오버레이는 모바일일 때만 띄워야 한다!! */}
      {isSidebarOpen && isMobile && (
        <div className="overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
}

export default Sidebar;
