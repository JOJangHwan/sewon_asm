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
import { jwtDecode } from 'jwt-decode';
const API_BASE = window._env_?.REACT_APP_API_URL || 'http://localhost:8080';

export const authFetchWithRefresh = async (url, options = {}) => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

   //console.log('🔐 authFetchWithRefresh ▶ access:', accessToken);
// console.log('🔐 authFetchWithRefresh ▶ refresh:', refreshToken);

 // accessToken 이 객체면 token 필드 꺼냄
 const extract = (tk) =>
   tk && typeof tk === 'object' && 'token' in tk ? tk.token : tk;

 const baseHeaders = {
   ...(options.headers || {}),
   Authorization: `Bearer ${extract(accessToken)}`,
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
            'Authorization-a': extract(accessToken),
             'Authorization-r': extract(refreshToken),
          'Content-Type': 'application/json',
        },
      });

      const refreshResult = await refreshRes.json();

      if (refreshResult?.code === 1 && refreshResult.data) {
        // 새 토큰 저장
        const { accessToken: newAccess, refreshToken: newRefresh } = refreshResult.data;
        // console.log('🔄 재발급 accessToken:', newAccess);
// console.log('🔄 재발급 refreshToken:', newRefresh);
saveTokens({ accessToken: extract(newAccess), refreshToken: extract(newRefresh) });


        // 재시도 요청
        const retryHeaders = {
          ...(options.headers || {}),
          Authorization: `Bearer ${extract(newAccess)}`,
        };
        if ((options.method || 'GET').toUpperCase() !== 'GET') {
          retryHeaders['Content-Type'] = retryHeaders['Content-Type'] || 'application/json';
        }

        response = await fetch(url, { ...options, headers: retryHeaders });
      } else {
        console.warn('❌ 토큰 갱신 실패 응답:', refreshResult);
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


/** accessToken 만료 여부 */
const isExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);          // exp(초)
    return exp * 1000 < Date.now() - 3000;     // 3 초 여유 주고 만료
  } catch {
    return true;                               // 파싱 실패 → 만료 취급
  }
};

/** 항상 유효한 accessToken 반환 (필요 시 refresh) */
export const getValidAccessToken = async () => {
  let access = getAccessToken();
  // console.log('🔐 기존 accessToken:', access);
  
   // ⬇️ 유효하면 바로 리턴 + 로그
   if (access && !isExpired(access)) {
    // console.log('✅ accessToken 유효, 그대로 사용');
     return access;
   }
  // ─ 만료 → refresh
  const refresh = getRefreshToken();
 // console.log('🔄 accessToken 만료, refreshToken 사용 시도:', refresh);
  const res = await fetch(`${API_BASE}/account/auth/token-refresh`, {
    method: 'POST',
    headers: {
      'Authorization-a': access || '',
      'Authorization-r': refresh || '',
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json();
 // console.log('📦 token-refresh 응답:', json);
  if (json.code === 1) {
       //console.log('🔁 새 accessToken:', newAcc);
   //console.log('🔁 새 refreshToken:', newRef);
    const { accessToken: newAcc, refreshToken: newRef } = json.data;
    saveTokens({ accessToken: newAcc, refreshToken: newRef });
    return newAcc;
  }

  // refresh 실패 → 로그아웃
  console.warn('❌ 토큰 갱신 실패. 로그아웃 처리');
  clearTokens();
  window.location.href = '/';
  throw new Error('토큰 갱신 실패');
};