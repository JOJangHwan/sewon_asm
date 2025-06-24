#!/bin/sh

# 기본값 설정
REACT_APP_API_URL=${REACT_APP_API_URL:-"http://192.168.0.220:8888"}
REACT_APP_LANG=${REACT_APP_LANG:-"ko"}
REACT_APP_VERSION=${REACT_APP_VERSION:-"0.1.0"}
REACT_APP_BUILD_ENV=${REACT_APP_BUILD_ENV:-"development"}

# env.js 생성
cat <<EOF > /usr/share/nginx/html/env.js
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}",
  REACT_APP_LANG: "${REACT_APP_LANG}",
  REACT_APP_VERSION: "${REACT_APP_VERSION}",
  REACT_APP_BUILD_ENV: "${REACT_APP_BUILD_ENV}"
};
EOF

# Nginx 실행
exec "$@"
