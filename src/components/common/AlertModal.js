import React from 'react';
import './AlertModal.css';

const AlertModal = ({ notifications, onClose, onRead, onDelete }) => {
  return (
    <div className="nc-overlay">
      <div className="nc-panel">
        <div className="nc-header">
          <h3>알림함</h3>
          <button className="nc-close" onClick={onClose}>✖</button>
        </div>
        <div className="nc-list">
        {Array.isArray(notifications) && notifications.length === 0 ? (
            <div className="nc-empty">알림이 없습니다.</div>
          ) : Array.isArray(notifications) && (
                       notifications.map((n) => (
              <div
                key={n.id}
                className={`nc-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => onRead(n.id)}
              >
                <div className="nc-message">{n.text}</div>
                <div className="nc-meta">
                  <span className="nc-time">{n.time}</span>
                  <button className="nc-delete" onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}>삭제</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default AlertModal;
