import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import ScanImg  from '../../assets/img/scan.png';
import rentImg  from '../../assets/img/rent.png';
import alarmImg from '../../assets/img/alarm.png';
import logoImg  from '../../assets/img/sewon.jpg';
import { UserContext }        from '../../utils/UserContext';
import { useTranslation } from 'react-i18next';
import { getUILang, uiToI18n } from '../../utils/lang/pref';
import { getValidAccessToken, authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import NotificationDropdown    from '../common/NotificationDropdown';

const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";


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

// ──────────────────────────────────────────────
// 📌 type 값이 없을 때 content 로 분류
const classifyByContent = (text = '') =>
    text.includes('실사') ? 'AUDIT' : 'RENT_RETURN';

function Header({ toggleSidebar, isSidebarOpen }) {
    const { t } = useTranslation('Header');
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const { user } = useContext(UserContext);
  //const [notifications, setNotifications] = useState([]); //sse
  const [sseRent,  setSseRent]  = useState([]);   // 대여·반납 실시간
  const [sseAudit, setSseAudit] = useState([]);   // 실사 실시간
  const [dbNoti, setDbNoti] = useState([]);  //DB

  const alarmRef = useRef(null);
  const lastEventIdRef = useRef(null); // 🔧 마지막 이벤트 ID 저장

  // useEffect(() => {
  //   let sse;
  
  //   const connectSSE = async () => {
  //     const userId = user?.id;
  //     if (!userId) return;
 const sseRef = useRef(null);
 const reconnectAttempts = useRef(0);

 useEffect(() => {
   const connectSSE = async () => {
       if (sseRef.current) {
           sseRef.current.close();
         }
      
         try {
           const rawToken = await getValidAccessToken();   
           const encodedToken = encodeURIComponent(rawToken);
           const userId = user?.id;  // 🔧 추가!
           if (!userId) return;      // 🔧 안전 체크
      
           const url = `${API_BASE_URL}/notifications/connect/${userId}?token=${encodedToken}`;
  
        //console.log("📡 SSE 연결 URL:", url);
  
        // sse = new EventSource(url);
        const sse = new EventSource(url);
        sseRef.current = sse;
  
        sse.addEventListener('connect', (event) => {
         // console.log('📨 [connect] 연결됨:', event.data);
          reconnectAttempts.current = 0; // 성공하면 재시도 카운트 초기화
        });
  
        sse.addEventListener('notification', (event) => {
          // 알림 수신 처리
        });
  
        sse.onerror = (err) => {
          console.error("❌ SSE 오류:", err);
          // sse.close();
          // setTimeout(connectSSE, 10000); // 재연결
         sse.close();
         sseRef.current = null;

         reconnectAttempts.current += 1;
         const delay = Math.min(30000, 5000 * reconnectAttempts.current); // 점진적 지연
        // console.log(`🔄 ${reconnectAttempts.current}번째 재연결 시도 (${delay / 1000}s 후)`);
         setTimeout(connectSSE, delay);
        };
  
      } catch (e) {
        console.error("🔐 SSE 연결 중 토큰 문제:", e);
        setTimeout(connectSSE, 5000);
      }
    };
  
    if (user?.id) connectSSE();
  
    return () => {
      // if (sse) sse.close();
      if (sseRef.current) sseRef.current.close();
    };
  }, [user]);
  

    /* ──────────────────────────────────────
     과거 알림 GET /notifications
     ────────────────────────────────────── */
  const fetchDbNotifications = async () => {
    try {
       const url = `${API_BASE_URL}/notifications`;
      // console.log("db 알림조회 url : " + url);
       const res = await authFetchWithRefresh(url, {
        method: 'GET',
      });
      //console.log("🔗 알림 응답 res:", res); // ✅ 이 위치는 OK

       const payload = await res.json();          
     //  console.log("📦 받은 데이터:", payload);
       
                 const mapped  = (payload.data?.list || []).map((n) => ({
                    id  : n.id,
                    text: n.content,
                    time: n.notifyTime,
                    read: n.read,
                    type: n.type ?? classifyByContent(n.content)   // ← 추가
                  }));
      setDbNoti(mapped);
    } catch (e) {
      console.error('📁 DB 알림 로드 실패:', e);
    }
  };
  

    const toggleAlarm = () => {
        setIsAlarmOpen(prev => {
          const next = !prev;          // 열릴 상태를 미리 계산
    
          // 알림창을 **열 때(= 이전에 닫혀 있었을 때)**만 DB 재조회
          if (!prev) {
            fetchDbNotifications();    // ← 🔄 GET /notifications
          }
    
          return next;
        });
      };


      const markAsRead = async (notificationId) => {
          // ✅ 읽음 시 실시간 알림은 제거, DB 알림은 read 처리
          setSseRent(prev => prev.filter(n => n.notificationId !== notificationId));
          setSseAudit(prev => prev.filter(n => n.notificationId !== notificationId));
          setDbNoti(prev => prev.map(n =>
            (n.notificationId === notificationId || n.id === notificationId)
              ? { ...n, read: true }
              : n
        ));
      
        // ✅ 서버 요청 시 id 그대로 사용
          // ✅ DB에 읽음 처리 요청은 항상 시도
          try {
            await authFetchWithRefresh(`${API_BASE_URL}/notifications/read/${notificationId}`, {
              method: 'POST',
            });
          } catch (e) {
            console.warn('❗ 읽음 처리 실패:', e);
          }
      };

         const markAllAsRead = () => {
             setSseRent (prev => prev.map(n => ({ ...n, read: true })));
             setSseAudit(prev => prev.map(n => ({ ...n, read: true })));
           };

           const deleteNotification = (id) => {
            setSseRent (prev => prev.filter(n => n.notificationId !== id));
            setSseAudit(prev => prev.filter(n => n.notificationId !== id));
            //setDbNoti(prev => prev.filter(n => n.id !== id)); // DB도 같이 삭제하고 싶으면 추가
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

        <div className="header-company-name">{t('Header_AppTitle')}</div>
      </div>

      <div className="header-right" ref={alarmRef}>
           <Link to="/rent" className="header-alarm">
          <img src={rentImg} alt="렌트" className="header-icon" />
        </Link>    
         <Link to="/scan" className="header-alarm">
          <img src={ScanImg} alt="스캔" className="header-icon" />
        </Link>  

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
  sseRentList={sseRent.filter(n => !n.read)}    // ❗ 읽지 않은 것만 전달
  sseAuditList={sseAudit.filter(n => !n.read)}  // ❗ 읽지 않은 것만 전달
  dbList={dbNoti.filter(n => !n.read)}          // ❗ 읽지 않은 것만 전달
  onRead={markAsRead}
  onDelete={deleteNotification}
/>
  
)}


<div className="header-user">
<div className="user-name">{t('Header_Name')}: {user?.name || t('Header_PleaseLogin')}</div>
<div className="user-dept">{t('Header_Affiliation')}: {user?.department || t('Header_PleaseLogin')}</div>
  <button
    className="logout-button"
    onClick={() => {
      localStorage.clear(); // 로그아웃 시 정보 삭제
      window.location.href = '/';
    }}
  >
    {t('Header_Logout')}
  </button>
</div>
      </div>
    </header>
  );
}

export default Header;