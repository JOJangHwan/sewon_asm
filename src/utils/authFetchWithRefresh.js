// // utils/authFetchWithRefresh.js

// import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './token';

// export const authFetchWithRefresh = async (url, options = {}) => {
//   const accessToken = getAccessToken();
//   const refreshToken = getRefreshToken();

//   const headers = {
//     ...options.headers,
//     Authorization: `Bearer ${accessToken}`,
//     'Content-Type': 'application/json',
//   };

//   let response = await fetch(url, { ...options, headers });

//   // 만료된 경우 재발급 시도
//   if (response.status === 401 || response.status === 403) {
//     const refreshRes = await fetch('http://192.168.0.220:8888/account/auth/token-refresh', {
//       method: 'POST',
//       headers: {
//         'Authorization-a': accessToken,
//         'Authorization-r': refreshToken,
//         'Content-Type': 'application/json',
//       },
//     });

//     const refreshResult = await refreshRes.json();

//     if (refreshResult.code === 1) {
//       // ✅ 새 토큰 저장
//       const { accessToken: newAccess, refreshToken: newRefresh } = refreshResult.data;
//       saveTokens({ accessToken: newAccess, refreshToken: newRefresh });

//       // ✅ 재요청
//       const retryHeaders = {
//         ...options.headers,
//         Authorization: `Bearer ${newAccess.token}`,
//         'Content-Type': 'application/json',
//       };
//       return fetch(url, { ...options, headers: retryHeaders });
//     } else {
//       // ❌ 갱신 실패 → 로그아웃 처리
//       clearTokens();
//       window.location.href = '/';
//       return; // 추가
//     }
//   }

//     /* 4xx / 5xx ---------------------------------------------------- */
//     if (!response.ok) {
//       let errBody = {};
//       try {
//         errBody = await response.clone().json();   // {time,status,code,message}
//       } catch (_) {
//         errBody = { message: response.statusText };
//       }
  
//       const error = new Error(errBody.message || '요청 실패');
//       error.httpStatus = response.status;   // 숫자 status (ex 400)
//       error.body       = errBody;           // time / status / code / message
//       throw error;
//     }

//   return response;
// };

import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './token';

const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8080';

export const authFetchWithRefresh = async (url, options = {}) => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  const baseHeaders = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };

  // GET 외의 요청에는 Content-Type 추가
  if ((options.method || 'GET').toUpperCase() !== 'GET') {
    baseHeaders['Content-Type'] = baseHeaders['Content-Type'] || 'application/json';
  }

  // 최초 요청
  let response = await fetch(url, { ...options, headers: baseHeaders });

  // 토큰 만료 → 재발급 시도
  if (response.status === 401 || response.status === 403) {
    try {
      const refreshRes = await fetch(`${API_BASE}/account/auth/token-refresh`, {
        method: 'POST',
        headers: {
          'Authorization-a': accessToken,
          'Authorization-r': refreshToken,
          'Content-Type': 'application/json',
        },
      });

      const refreshResult = await refreshRes.json();

      if (refreshResult.code === 1) {
        // 새 토큰 저장
        const { accessToken: newAccess, refreshToken: newRefresh } = refreshResult.data;
        saveTokens({ accessToken: newAccess, refreshToken: newRefresh });

        // 재시도 요청
        const retryHeaders = {
          ...(options.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        };
        if ((options.method || 'GET').toUpperCase() !== 'GET') {
          retryHeaders['Content-Type'] = retryHeaders['Content-Type'] || 'application/json';
        }

        response = await fetch(url, { ...options, headers: retryHeaders });
      } else {
        clearTokens();
        window.location.href = '/';
        throw new Error('토큰 갱신 실패');
      }
    } catch (err) {
      clearTokens();
      window.location.href = '/';
      throw new Error('토큰 재발급 중 예외 발생');
    }
  }

  // 실패 응답 처리
  if (!response.ok) {
    let errBody = {};
    try {
      errBody = await response.clone().json(); // 복제한 응답에서 json 파싱
    } catch (_) {
      errBody = { message: response.statusText };
    }

    const error = new Error(errBody.message || '요청 실패');
    error.httpStatus = response.status;
    error.body = errBody;
    throw error;
  }

  return response;
};
