# 1. nginx 기반으로 컨테이너 생성
FROM nginx:alpine

# 2. React 빌드 파일을 nginx 루트 경로로 복사
COPY build/ /usr/share/nginx/html

# 3. 컨테이너 외부에서 접근할 포트 설정
EXPOSE 80