import React, { useContext,useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref';

import homeImg from '../../assets/img/home.png';
import uploadImg from '../../assets/img/upload.png';
import searchImg from '../../assets/img/search.png';
import auditImg from '../../assets/img/audit.png';
import reportImg from '../../assets/img/report.png';
import myInforImg from '../../assets/img/myInfor.png';
import RegisterCorpAndItemImg from '../../assets/img/b.png';
import AssetTransImg from '../../assets/img/a.png';
import AdminIconImg from '../../assets/img/adminIcon.jpg';
import { UserContext } from '../../utils/UserContext';

// 모든 요청에 언어 헤더 자동 부착
const withLang = (opts = {}) => {
  const ui = getUILang();           // 'KR' | 'CN' | 'VN'
  const lng = uiToI18n(ui);         // 'ko' | 'zh' | 'vi'
  return {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'X-Client-Lang': lng,
      'X-Client-Lang-UI': ui,
    },
  };
};


function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const { t } = useTranslation('Sidebar');
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const { user } = useContext(UserContext);
  if (!user) return null;
  //console.log(user)
  const menuItems = [
    { path: '/main', icon: homeImg, label: t('Sidebar_Home') },
    {
      label: t('Sidebar_Register'),
      icon: uploadImg,
      subMenus:[
        { path: '/load/single',label: t('Sidebar_AssetRegister')},
        { path: '/load/bulk', label: t('Sidebar_LoadBulk')},
        { path: '/load/disposal', label: t('Sidebar_DisposalRegister')}
      ]
    },
    { path: '/search', icon: searchImg, label: t('Sidebar_Search') },
    { 
      label: t('Sidebar_Audit'),
      icon: auditImg,
      subMenus: [
        { path: '/audit/upload', label: t('Sidebar_AuditRegister') },
        { path: '/audit/list', label: t('Sidebar_AuditSearch') },
      ],
    },
        { 
      label: t('Sidebar_AssetAssignTransfer'),
      icon: RegisterCorpAndItemImg,
      subMenus: [
        { path: '/RegisterCorpAndItem', label: t('Sidebar_RegisterCorpAndItem') },
        { path: '/DualTransferSimple', label: t('Sidebar_TransferRegister') },
         { path: '/AssetRegistrarChange', label: t('Sidebar_ChangeRegistrar') },
      ],
    },
    // { path: '/report', icon: reportImg, label: '보고서' },
    // { path: '/RegisterCorpAndItem', icon: RegisterCorpAndItemImg, label: '법인 및 자산분류 등록' },
    // { path: '/DualTransferSimple', icon: AssetTransImg, label: '이관 등록' },
    // { path: '/AssetRegistrarChange', icon: AssetTransImg, label: '자산 등록자 변경' },
    { path: '/profile', icon: myInforImg, label: t('Sidebar_Profile') },
      ...(user.username === 'admin'
       ? [{
         label: '관리자',
             icon: AdminIconImg,
               subMenus:[
                 { path: '/UserManage',label: '사용자관리'},
               ]
             }]
           : [])
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
