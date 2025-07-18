// utils/token.js
export const saveTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem('accessToken', typeof accessToken === 'object' ? accessToken.token : accessToken);
  localStorage.setItem('refreshToken', typeof refreshToken === 'object' ? refreshToken.token : refreshToken);
};

export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessExp');
  localStorage.removeItem('refreshExp');
};