
#-----------------------------------------------------------------------------
# 1단계: Node.js로 React 앱을 빌드 (개발 소스 → 정적 파일로 변환)
FROM node:18-alpine AS build

# 작업 디렉터리 설정
WORKDIR /app

# 소스 복사
COPY . .

# 패키지 설치 및 React 앱 빌드
RUN npm install --legacy-peer-deps && npm run build


# 2단계: Nginx로 정적 파일 서빙
FROM nginx:alpine

# React에서 빌드된 파일들을 Nginx 기본 경로로 복사
COPY --from=build /app/build /usr/share/nginx/html

# ✅ nginx 설정 복사
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# entrypoint.sh 스크립트를 복사 (환경변수로 env.js 생성용)
COPY ./entrypoint.sh /entrypoint.sh

# 실행 권한 부여
RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

# 컨테이너 시작 시 entrypoint.sh 실행 → 이후 Nginx 실행
ENTRYPOINT ["/entrypoint.sh"]

# Nginx 포그라운드 실행
CMD ["nginx", "-g", "daemon off;"]
