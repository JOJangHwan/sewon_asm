// utils/UserContext.js
import React, { createContext, useState, useEffect } from 'react';
import { getValidAccessToken } from './authFetchWithRefresh';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (userData) => {
    setUserState(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  useEffect(() => {
       const accessToken  = localStorage.getItem('accessToken');
       const refreshToken = localStorage.getItem('refreshToken');
       const activeSession = sessionStorage.getItem('activeSession');
    
       // 1️⃣ F5 새로고침이면 localStorage 기반으로 로그인 복구
       const storedUser = localStorage.getItem('user');
       if (activeSession === 'true' && storedUser && accessToken) {
         setUserState(JSON.parse(storedUser));
         setIsLoading(false);
         return;
       }
    
       // 2️⃣ 브라우저 완전히 닫았다가 다시 열면 자동 로그인 시도
       if (!accessToken || !refreshToken) {
         setIsLoading(false);
         return;
       }

    const initUser = async () => {
     // console.log('🟡 initUser 호출됨');
      try {
        const token = await getValidAccessToken(); // 자동으로 refresh까지 처리됨
     //   console.log('✅ 토큰:', token);
        if (!token) throw new Error('토큰 없음');

        // const res = await fetch(
        //   `${window._env_?.REACT_APP_API_URL || 'http://localhost:8888'}/account/me`,
        //   {
        //     method: 'GET',
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );

        // const result = await res.json();

        // if (result.code === 1) {
        //      setUser(result.data);
        //      sessionStorage.setItem('activeSession', 'true'); // 세션 시작 기록
        // } else {
        //   console.warn('유저 정보 조회 실패');
        //   logout(); // 실패 시 로그아웃
        // }

               // 👉 /account/me 없이도 토큰이 있으면 이전에 저장된 user 사용
               const storedUser = localStorage.getItem('user');
               if (storedUser) {
               setUser(JSON.parse(storedUser));
               } else {
                 console.warn('user 정보 없음, 로그아웃');
                 logout();
               }
        
      } catch (err) {
        console.warn('자동 로그인 실패:', err);
        logout(); // 네트워크 실패 시도 로그아웃
      } finally {
        setIsLoading(false); // 이게 반드시 호출돼야 함!!
      }
    };
   // console.log('✅ isLoading:', isLoading);
   // console.log('✅ user:', user);
    initUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}
