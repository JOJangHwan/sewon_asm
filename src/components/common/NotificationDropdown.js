// src/components/NotificationDropdown.js
import React, { useState, useEffect } from 'react';
import './NotificationDropdown.css';

function formatDateTime(input) {
    const date = new Date(input);
    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, '0');
    const dd   = String(date.getDate()).padStart(2, '0');
    const hh   = String(date.getHours()).padStart(2, '0');
    const mi   = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

 export default function NotificationDropdown({
       anchorRef,
       onClose,
       sseRentList = [],
       sseAuditList = [],
       dbList = [],
       onRead,
       onDelete,
     }) {
  const [activeTab, setActiveTab] = useState('rent');   // 'rent' | 'audit'

  // ───────────────────────────────────────────
  // ESC 키, 바깥 클릭 시 닫기
  // ───────────────────────────────────────────
  useEffect(() => {
    const handleKey = e => e.key === 'Escape' && onClose?.();
    const handleClick = e =>
      anchorRef?.current &&
      !anchorRef.current.contains(e.target) &&
      !e.target.closest('.nd-panel') &&
      onClose?.();

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [anchorRef, onClose]);

  // 탭별 데이터
//    const listToRender =
//      activeTab === 'rent'
//        ? [...sseRentList]
//        : []; // audit 탭은 아직 미사용

  return (
    <div className="nd-root">
      <div className="nd-panel">
        {/* ───── 상단 헤더 ───── */}
        <header className="nd-header">
          <h3>알림창</h3>
          <button className="nd-close" onClick={onClose}>✖</button>
        </header>

        {/* ───── 탭 버튼 ───── */}
        <div className="nd-tabs">
          <button
            className={activeTab === 'rent' ? 'active' : ''}
            onClick={() => setActiveTab('rent')}
          >
            대여·반납 알림
          </button>
          <button
            className={activeTab === 'audit' ? 'active' : ''}
            onClick={() => setActiveTab('audit')}
          >
            실사알림
          </button>
        </div>

        {/* ───── 실시간 / DB 영역 ───── */}
        <section className="nd-section">
         {activeTab === 'audit' ? (
   <>
     {/* 🆕 실시간 실사 알림 */}
     {sseAuditList.length > 0 && (
       <>
         <div className="nd-subtitle">🆕 새로운 실사 알림</div>
         {sseAuditList.map((n) => (
           <div
             key={n.id}
             className={`nd-item ${n.read ? 'read' : 'unread'}`}
             onClick={() => onRead?.(n.id)}
           >
             <div className="nd-msg">{n.text}</div>
             <div className="nd-meta">
               <time>{formatDateTime(n.time)}</time>
             </div>
           </div>
         ))}
       </>
     )}

     {/* 📁 과거 실사 알림 (재사용) */}
     {Array.isArray(dbList) && dbList.length > 0 && (
       <>
         <div className="nd-subtitle">🗂️ 알림 이력</div>
         {dbList
           .filter((n) => n.type === 'AUDIT') // 👈 필요 시 필터
           .map((n) => (
             <div
               key={n.id}
               className={`nd-item ${n.read ? 'read' : 'unread'}`}
               onClick={() => onRead?.(n.id)}
             >
               <div className="nd-msg">{n.text}</div>
               <div className="nd-meta">
                 <time>{formatDateTime(n.time)}</time>
               </div>
             </div>
         ))}
       </>
     )}

     {sseAuditList.length === 0 && (!Array.isArray(dbList) || dbList.filter(n => n.type === 'AUDIT').length === 0) && (
       <div className="nd-empty">실사 관련 알림이 없습니다.</div>
     )}
   </>
 ) : (
    <>
    {/* 🆕 실시간 알림 */}
      {sseRentList.length > 0 && (
        <>
          <div className="nd-subtitle">🆕 새로운 알림</div>
          {sseRentList.map((n) => (
            <div
              key={n.id}
              className={`nd-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => onRead?.(n.id)}
            >
              <div className="nd-msg">{n.text}</div>
              <div className="nd-meta">
              <time>{formatDateTime(n.time)}</time>
                {/* <button onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(n.id);
                }}>삭제</button> */}
              </div>
            </div>
          ))}
        </>
      )}

{/* 📁 과거 알림 이력 */}
{Array.isArray(dbList) && dbList.filter(n => n.type !== 'AUDIT').length > 0 && (
        <>
          <div className="nd-subtitle">🗂️ 알림 이력</div>
          {dbList
           .filter((n) => n.type !== 'AUDIT')
          .map((n) => (
            
            <div
              key={n.id}
              className={`nd-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => onRead?.(n.id)}
            >
              <div className="nd-msg">{n.text}</div>
              <div className="nd-meta">
                <time>{formatDateTime(n.time)}</time>
                {/* <button
  onClick={(e) => {
    e.stopPropagation();
    if (onDelete) onDelete(n.id);
  }}
>
  삭제
</button> */}
              </div>
            </div>
          ))}
        </>
      )}

      {sseRentList.length === 0 && (!Array.isArray(dbList) || dbList.length === 0) && (
        <div className="nd-empty">알림이 없습니다.</div>
      )}
    </>
  )}
</section>

      </div>
    </div>
  );
}
