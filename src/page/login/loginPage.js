// "use client"
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LoginPage.css'; // 경로 주의! (Register.css 아님)

function LoginPage() {
  const navigate = useNavigate();

  // 아이디 저장 상태
  const [userId, setUserId] = useState('');
  const [rememberId, setRememberId] = useState(false);

  // 컴포넌트 처음 로딩 시, localStorage에 저장된 아이디 불러오기
  useEffect(() => {
    const savedId = localStorage.getItem('savedUserId');
    if (savedId) {
      setUserId(savedId);
      setRememberId(true);
    }
  }, []);

  // 로그인 버튼 클릭 시
  const handleLogin = () => {
    if (rememberId) {
      localStorage.setItem('savedUserId', userId);
    } else {
      localStorage.removeItem('savedUserId');
    }
    navigate('/main'); // 메인 페이지 이동
  };

  // 회원가입 버튼 클릭 시
  const handleRegister = () => {
    navigate('/users/join'); // 회원가입 페이지 이동
  };

  // 아이디 저장 체크박스 핸들링
  const handleRememberChange = (e) => {
    setRememberId(e.target.checked);
  };

  // 아이디 입력 핸들링
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
  };

  return (
    <div className="loginPage-container">
      {/* 로고 */}
      <img src="/img/login_img.jpg" alt="로고" className="loginPage-logo" />

      {/* 타이틀 */}
      <div className="loginPage-title">세원전자 자산관리 시스템</div>
      <p className="loginPage-desc">Sewon Electronics<br />Asset Management System</p>

      {/* 아이디, 비밀번호 입력 */}
      <input type="text" placeholder="아이디" value={userId} className="loginPage-input" onChange={handleUserIdChange} />
      <input type="password" placeholder="비밀번호" className="loginPage-input" />

      {/* 아이디 저장 */}
      <div className="loginPage-remember">
        <input type="checkbox" id="remember" checked={rememberId} onChange={handleRememberChange} />
        <label htmlFor="remember">아이디 저장</label>
      </div>

      {/* 버튼들 */}
      <button className="loginPage-loginButton" onClick={handleLogin}>로그인</button>
      <button className="loginPage-signupButton" onClick={handleRegister}>회원가입</button>
    </div>
  );
}

export default LoginPage;
