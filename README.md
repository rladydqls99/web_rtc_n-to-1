# WEB RTC n-to-1

여러 클라이언트가 단일 서버에 연결하여 실시간 통신이 가능한 WebRTC 구현입니다.

## 주요 기능

- 다중 클라이언트와 단일 서버 연결
- 실시간 오디오/비디오 스트리밍
- WebRTC를 통한 피어 투 피어 연결
- 연결 설정을 위한 시그널링 서버

## 기술 스택

- WebRTC API
- JavaScript
- Node.js (시그널링 서버용)
- Socket.io

## 시작하기

### 필수 조건

- Node.js 설치
- WebRTC를 지원하는 최신 웹 브라우저

### 설치

1. 리포지토리 클론하기

```
git clone https://github.com/your-username/web_rtc_n-to-1.git
```

2. 종속성 설치

```
cd web_rtc_n-to-1
pnpm install
```

3. 시그널링 서버 시작

```
pnpm dev
```

## 사용 방법

1. 브라우저에서 서버 페이지 열기
2. 각자의 브라우저 인터페이스를 통해 여러 클라이언트 연결
3. 실시간 통신 시작하기
