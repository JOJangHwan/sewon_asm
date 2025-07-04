// Tooltip.js
import React, { useState } from 'react';

export default function Tooltip({ message, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
  style={{
    position: 'absolute',
    left: '50%',
    top: '-60px',
    transform: 'translateX(-50%)',
    minWidth: 180,
    maxWidth: 250,
    background: '#222',
    color: '#fff',
    fontSize: 14,
    lineHeight: 1.6,
    padding: '10px 15px',
    borderRadius: 12,
    textAlign: 'center',
    boxShadow: '0 2px 10px #2225',
    wordBreak: 'keep-all',
    whiteSpace: 'pre-line',
    zIndex: 10,
        }}>
          {message}
        </div>
      )}
    </span>
  );
}
