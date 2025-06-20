// utils/authFetchWithRefresh.js

import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './token';

export const authFetchWithRefresh = async (url, options = {}) => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  let response = await fetch(url, { ...options, headers });

  // 만료된 경우 재발급 시도
  if (response.status === 401 || response.status === 403) {
    const refreshRes = await fetch('http://192.168.0.220:8888/account/auth/token-refresh', {
      method: 'POST',
      headers: {
        'Authorization-a': accessToken,
        'Authorization-r': refreshToken,
        'Content-Type': 'application/json',
      },
    });

    const refreshResult = await refreshRes.json();

    if (refreshResult.code === 1) {
      // ✅ 새 토큰 저장
      const { accessToken: newAccess, refreshToken: newRefresh } = refreshResult.data;
      saveTokens({ accessToken: newAccess, refreshToken: newRefresh });

      // ✅ 재요청
      const retryHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newAccess.token}`,
        'Content-Type': 'application/json',
      };
      return fetch(url, { ...options, headers: retryHeaders });
    } else {
      // ❌ 갱신 실패 → 로그아웃 처리
      clearTokens();
      window.location.href = '/';
      return; // 추가
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || '요청 실패');
    error.response = { status: response.status, data: errorData };
    throw error;
  }

  return response;
};
