// utils/token.js
export const saveTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem('accessToken', accessToken.token);
  localStorage.setItem('refreshToken', refreshToken.token);
  localStorage.setItem('accessExp', accessToken.expiration);
  localStorage.setItem('refreshExp', refreshToken.expiration);
};

export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessExp');
  localStorage.removeItem('refreshExp');
};