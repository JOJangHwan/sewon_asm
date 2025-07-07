import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import ScanImg  from '../../assets/img/scan.png';
import rentImg  from '../../assets/img/rent.png';
import alarmImg from '../../assets/img/alarm.png';
import logoImg  from '../../assets/img/sewon.jpg';
import { UserContext }        from '../../utils/UserContext';
import { getAccessToken } from '../../utils/token';
import NotificationDropdown    from '../common/NotificationDropdown';

const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";

function Header({ toggleSidebar, isSidebarOpen }) {
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const { user } = useContext(UserContext);
  //const [notifications, setNotifications] = useState([]); //sse
  const [sseRent,  setSseRent]  = useState([]);   // 대여·반납 실시간
  const [sseAudit, setSseAudit] = useState([]);   // 실사 실시간
  const [dbNoti, setDbNoti] = useState([]);  //DB

  const alarmRef = useRef(null);

  useEffect(() => {
    let sse;
  
    const connectSSE = async () => {
      const userId = user?.id;
     // console.log(user);
      if (!userId) {
        console.warn('❗ userId가 없습니다. SSE 연결 중단');
        return;
      }
  
       const rawToken = getAccessToken();  // ✅ 간단하게 현재 토큰만 사용
       if (!rawToken) {
         console.warn('❗ accessToken 없음 → SSE 연결 중단');
         return;
       }
      
     // console.log('🔐 rawToken:', rawToken);
      
      const encodedToken = encodeURIComponent(rawToken);
     // console.log('🔗 encodedToken:', encodedToken);
      
      const url = `${API_BASE_URL}/notification/connect/${userId}?token=${encodedToken}`;
     // console.log('📡 SSE 연결 URL:', url);
      sse = new EventSource(url);




       sse.addEventListener('connect', (event) => {
         console.log('📨 [message] 기본 이벤트 수신:', event.data);
     });
  
      sse.addEventListener('notification', (event) => {
console.log('🔔[notification] 알림 수신', event.data);
        let parsed;

        try {
          parsed = JSON.parse(event.data);           // { message, notifyTime }
        } catch (err) {
          console.warn('⚠️ JSON 파싱 실패:', parsed.data);
          return;

        } 
        console.log('🔔 알림 수신:', parsed); // ✔️ 여기에 진짜 로그가 뜸
          // 1) JSON 파싱
          //const content = JSON.parse(event.data);   // { id, text, read, time } 구조여야 함
          //console.log('🔔 알림 수신:', content);

             const formatted = {
                 id: Date.now(),
                 text : parsed.message,
                 time : parsed.notifyTime,
                 read : false,
               };
            
               // 📌 유형 구분: parsed.type 값이 'RENT_RETURN' 이면 rent, 그 외 audit
              //  if (parsed.type === 'RENT_RETURN') {
              //    setSseRent(prev  => [formatted, ...prev]);
              //  } else {
              //    setSseAudit(prev => [formatted, ...prev]);
              //  }
               // 📌 type 이 없으면 기본적으로 대여·반납 알림으로 간주
 if (parsed.type === 'RENT_RETURN' || parsed.type === undefined) {
   setSseRent(prev => [formatted, ...prev]);
 } else {
   setSseAudit(prev => [formatted, ...prev]);
 }


      });
  
      sse.onerror = (err) => {
        console.error('❌ SSE 오류:', err);
        sse.close();
      };
    };
  
    connectSSE();
  
    return () => {
      if (sse) sse.close();
    };
  }, [user]); // user 변경될 때마다 재연결
  

  const toggleAlarm = () => setIsAlarmOpen(prev => !prev);


    const markAsRead = (id) => {
     
         setSseRent (prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
         setSseAudit(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
        };

         const markAllAsRead = () => {
             setSseRent (prev => prev.map(n => ({ ...n, read: true })));
             setSseAudit(prev => prev.map(n => ({ ...n, read: true })));
           };

  const deleteNotification = (id) => {
       setSseRent (prev => prev.filter(n => n.id !== id));
       setSseAudit(prev => prev.filter(n => n.id !== id));
      };

       const unreadCount =
         [...sseRent, ...sseAudit].filter(n => !n.read).length;



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
        </Link>  */}

 {/* 알림 아이콘 */}
<div className="header-alarm" onClick={toggleAlarm} style={{ position: 'relative' }}>
  <img src={alarmImg} alt="알람" className="header-icon" />
  {unreadCount > 0 && (
    <div className="alarm-badge">{unreadCount}</div>
  )}
</div>

{/* 알림 모달 */}
{isAlarmOpen && (
  // <AlertModal
  //   notifications={notifications}
  //   onClose={() => setIsAlarmOpen(false)}
  //   onRead={markAsRead}
  //   onDelete={deleteNotification}
  // />
    <NotificationDropdown
    anchorRef={alarmRef}
    onClose={() => setIsAlarmOpen(false)}
     sseRentList={sseRent}            // ✅
     sseAuditList={sseAudit}          // ✅
    dbList={dbNoti}
    onRead={markAsRead}
    onDelete={deleteNotification}
  />
  
)}


<div className="header-user">
<div className="user-name">이름: {user?.name || '로그인을 하시오'}</div>
<div className="user-dept">소속: {user?.department || '로그인을 하시오'}</div>
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
