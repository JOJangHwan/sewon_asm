import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScanImg from '../../assets/img/scan.png';
import rentImg from '../../assets/img/rent.png';
import alarmImg from '../../assets/img/alarm.png';
import logoImg from '../../assets/img/sewon.jpg';

function Header({ toggleSidebar, isSidebarOpen }) {
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, text: '[공지] 서버 점검 예정', read: false, time: '2024-04-22 10:30' },
    { id: 2, text: '[알림] 신규 자산 등록됨', read: false, time: '2024-04-22 11:00' },
    { id: 3, text: '[공지] 시스템 업데이트 완료', read: true, time: '2024-04-21 16:00' },
    { id: 4, text: '[경고] 라이센스 만료 임박', read: false, time: '2024-04-22 09:15' },
    { id: 5, text: '[알림] 재고 부족 알림', read: true, time: '2024-04-20 14:20' },
  ]);

  const alarmRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alarmRef.current && !alarmRef.current.contains(e.target)) {
        setIsAlarmOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
  
    // ✅ 여기 먼저 실행되게 해야 함!
    const savedUsername = localStorage.getItem('name');
    const savedDepartment = localStorage.getItem('department');
    if (savedUsername) setName(savedUsername);
    if (savedDepartment) setDepartment(savedDepartment);
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  

  const toggleAlarm = () => setIsAlarmOpen(prev => !prev);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = showUnreadOnly
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger" onClick={toggleSidebar}>
          {isSidebarOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="black" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="black" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* ✅ 로고 클릭 시 메인 이동 */}
        <Link to="/main" className="header-logo-wrap">
          <img src={logoImg} alt="로고" className="header-logo" />
        </Link>

        <div className="header-company-name">세원전자 자산관리 시스템</div>
      </div>

      <div className="header-right" ref={alarmRef}>
        <Link to="/rent" className="header-alarm">
          <img src={rentImg} alt="렌트" className="header-icon" />
        </Link>
        {/* <Link to="/scan" className="header-alarm">
          <img src={ScanImg} alt="스캔" className="header-icon" />
        </Link> */}

        {/* 알림 */}
        <div className="header-alarm" onClick={toggleAlarm} style={{ position: 'relative' }}>
          <img src={alarmImg} alt="알람" className="header-icon" />
          {unreadCount > 0 && (
            <div className="alarm-badge">{unreadCount}</div>
          )}
        </div>

        {isAlarmOpen && (
          <div className="alarm-dropdown">
            <div className="alarm-header">
              <span>알림</span>
              <div className="alarm-header-buttons">
                <button onClick={() => setShowUnreadOnly(prev => !prev)}>
                  {showUnreadOnly ? '전체 보기' : '읽지 않음만'}
                </button>
                <button onClick={markAllAsRead}>모두 읽음</button>
              </div>
            </div>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(n => (
                <div
                  key={n.id}
                  className={`alarm-item ${n.read ? 'read' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="alarm-text">
                    {!n.read && <span className="alarm-dot">●</span>}
                    {n.text}
                    <div className="alarm-time">{n.time}</div>
                  </div>
                  <button
                    className="alarm-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))
            ) : (
              <div className="alarm-empty">알림이 없습니다.</div>
            )}
          </div>
        )}

<div className="header-user">
  <div className="user-name">이름: {name || '로그인을 하시오'}</div>
  <div className="user-dept">소속: {department || '로그인을 하시오'}</div>
  <button
    className="logout-button"
    onClick={() => {
      localStorage.clear(); // 로그아웃 시 정보 삭제
      window.location.href = '/';
    }}
  >
    로그아웃
  </button>
</div>
      </div>
    </header>
  );
}

export default Header;
