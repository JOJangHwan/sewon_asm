import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import ScanImg  from '../../assets/img/scan.png';
import rentImg  from '../../assets/img/rent.png';
import alarmImg from '../../assets/img/alarm.png';
import logoImg  from '../../assets/img/sewon.jpg';
import { UserContext }        from '../../utils/UserContext';
import { getValidAccessToken, authFetchWithRefresh } from '../../utils/authFetchWithRefresh';
import NotificationDropdown    from '../common/NotificationDropdown';

const API_BASE_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8888";

// ──────────────────────────────────────────────
// 📌 type 값이 없을 때 content 로 분류
const classifyByContent = (text = '') =>
    text.includes('실사') ? 'AUDIT' : 'RENT_RETURN';

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
  
            /* 1️⃣ 토큰을 안전하게 얻어오기 ─ 예외가 나더라도 화면이 죽지 않도록     */
            let rawToken;
            try {
              rawToken = await getValidAccessToken();      // ← 유효 accessToken or null
            } catch (err) {
              console.error('🔑 토큰 갱신 실패:', err);
              return;                                      // → SSE 연결 시도 중단
            }
      
            /* 2️⃣ 토큰이 없으면 그냥 종료 (로그아웃 상태)                              */
            if (!rawToken) {
              console.warn('❗ accessToken 없음 → SSE 연결 중단');
              return;
            }
      
     // console.log('🔐 rawToken:', rawToken);
      
      const encodedToken = encodeURIComponent(rawToken);
      console.log('🔗 encodedToken:', encodedToken);
      
      const url = `${API_BASE_URL}/notifications/connect/${userId}?token=${encodedToken}`;
      console.log('📡 SSE 연결 URL:', url);
      sse = new EventSource(url);




       sse.addEventListener('connect', (event) => {
         console.log('📨 [message] 기본 이벤트 수신:', event.data);
     });
  
      sse.addEventListener('notification', (event) => {
console.log('🔔[notification] 알림 수신', event.data);
        const outer   = JSON.parse(event.data);             // {data:{…}} or {…}
        const parsed  = outer.data ?? outer;                // 래퍼 제거

        const text = parsed.content ?? parsed.message;
        const type = parsed.type ?? classifyByContent(text); // ← 핵심

        const formatted = {
          id   : parsed.id ?? Date.now(),
          text : text,
          time : parsed.notifyTime,
          read : false,
          type
        };

        if (type === 'RENT_RETURN') {
          setSseRent (prev => [formatted, ...prev]);
        } else {
          setSseAudit(prev => [formatted, ...prev]);
        }


      });
  
      sse.onerror = (err) => {
        console.error('❌ SSE 오류:', err);
        sse.close();
        setTimeout(connectSSE, 10_000);
      };
    };
  
        // connectSSE();
         if (user?.id) {
             connectSSE();
           }
        fetchDbNotifications();          // 📥 과거 알림 이력 로드
  
    return () => {
      if (sse) sse.close();
    };
  }, [user]); // user 변경될 때마다 재연결

    /* ──────────────────────────────────────
     과거 알림 GET /notifications
     ────────────────────────────────────── */
  const fetchDbNotifications = async () => {
    try {
       const url = `${API_BASE_URL}/notifications`;
       console.log("db 알림조회 url : " + url);
       const res = await authFetchWithRefresh(url, {
        method: 'GET',
      });
      console.log("🔗 알림 응답 res:", res); // ✅ 이 위치는 OK

       const payload = await res.json();          
       console.log("📦 받은 데이터:", payload);
       
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


       const markAsRead = async (id) => {
           let alreadyRead = false;
        
           // 프론트 기준 읽음 여부 확인
           const all = [...sseRent, ...sseAudit, ...dbNoti];
           const target = all.find(n => n.id === id);
           if (target?.read) {
             alreadyRead = true;
           }
        
           // UI 상태 업데이트는 항상 수행
           setSseRent (prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
           setSseAudit(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
           setDbNoti  (prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
        
           // 서버에는 아직 안 읽은 경우만 요청
           if (!alreadyRead) {
             try {
               await authFetchWithRefresh(`${API_BASE_URL}/notifications/read/${id}`, {
                 method: 'POST',
               });
             } catch (e) {
               console.warn('❗ 읽음 처리 실패:', e);
             }
           }
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