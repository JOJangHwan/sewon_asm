// src/serviceWorkerRegistration.js

// 로컬환경인지 판별
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
  );
  
  // 서비스 워커 등록 함수
  export function register(config) {
    if ('serviceWorker' in navigator) {
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      if (publicUrl.origin !== window.location.origin) {
        return;
      }
  
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
        if (isLocalhost) {
          // 개발 환경에서는 유효성 확인
          checkValidServiceWorker(swUrl, config);
        } else {
          // 운영 환경은 바로 등록
          registerValidSW(swUrl, config);
        }
      });
    }
  }
  
  function registerValidSW(swUrl, config) {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        if (registration.waiting) {
          console.log('새 콘텐츠가 대기 중입니다.');
  
          if (config && config.onUpdate) {
            config.onUpdate(registration);
          }
        }
  
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;
  
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // 새 콘텐츠가 준비됨
                console.log('새 콘텐츠가 사용 가능합니다.');
  
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // 캐시된 콘텐츠가 준비됨
                console.log('콘텐츠가 캐시되었습니다.');
  
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('Service Worker 등록 중 에러 발생:', error);
      });
  }
  
  function checkValidServiceWorker(swUrl, config) {
    fetch(swUrl, {
      headers: { 'Service-Worker': 'script' }
    })
      .then((response) => {
        const contentType = response.headers.get('content-type');
        if (
          response.status === 404 ||
          (contentType != null && contentType.indexOf('javascript') === -1)
        ) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.unregister().then(() => {
              window.location.reload();
            });
          });
        } else {
          registerValidSW(swUrl, config);
        }
      })
      .catch(() => {
        console.log('인터넷 연결 없음. 앱은 오프라인 모드로 작동 중.');
      });
  }
  
  // 서비스 워커 등록 해제 함수
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister();
        })
        .catch((error) => {
          console.error(error.message);
        });
    }
  }
  