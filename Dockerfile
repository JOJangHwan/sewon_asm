# node 이미지 사용
FROM node    
    
# 이후 명령어를 실행해 컨테이너 내부의 작업 디렉토리 설정
WORKDIR /app 
    
# package.json 파일을 경로(.)에 복사
COPY packakge.json . 

# package.json 내부의 의존성을 설치
RUN npm install

# 프로젝트의 모든 파일을 복사한다. [ 현재 작업 디렉토리의 루트 경로 : .] 에서 [ container 디렉토리의 루트 경로 : . ]로 복사
COPY . .

# 런타임에 사용할 포트 번호 설정
EXPOSE 3000

#  react 프로젝트 시작
CMD ["npm", "start"]

# Step 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
