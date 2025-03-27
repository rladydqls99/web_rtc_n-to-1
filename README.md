# WebRTC N-to-1 실시간 영상 송출 서비스

이 프로젝트는 WebRTC 기술을 활용하여 송신자(Sender)가 한 채널을 통해 영상을 송출하고, 수신자(Receiver)가 위치 기반으로 해당 영상 스트림을 확인할 수 있는 서비스입니다.

## 주요 기능

- 다중 송신자(N)가 실시간 영상을 송출할 수 있는 환경 구성
- 지도 기반 인터페이스로 송출 위치를 직관적으로 확인
- Socket.IO를 이용한 실시간 통신 및 WebRTC 시그널링
- 카메라 선택, 오디오/비디오 제어 기능
- 실시간 사용자 수 확인 및 접속 관리

## 프로젝트 구조

```
web_rtc_n-to-1/
├── src/
│   ├── configure/       # 서버 설정 파일
│   ├── public/          # 클라이언트 코드
│   │   ├── css/         # 스타일시트
│   │   └── js/          # JavaScript 파일
│   │       ├── modules/ # 모듈화된 JavaScript 컴포넌트
│   │       │   ├── common/  # 공통 설정 및 유틸리티
│   │       │   ├── receiver/ # 수신자(시청자) 관련 모듈
│   │       │   └── sender/   # 송신자(스트리머) 관련 모듈
│   │       ├── receiver.js   # 수신자 메인 스크립트
│   │       └── sender.js     # 송신자 메인 스크립트
│   ├── views/           # HTML 템플릿
│   └── server.js        # 메인 서버 파일
├── package.json         # 프로젝트 의존성 및 스크립트
└── tailwind.config.js   # Tailwind CSS 설정
```

## 기술 스택

- **프론트엔드**:

  - HTML, CSS, JavaScript
  - Tailwind CSS - UI 스타일링
  - WebRTC - 실시간 영상 스트리밍
  - 카카오맵 API - 위치 기반 서비스

- **백엔드**:
  - Node.js - 서버 실행 환경
  - Express - 웹 서버 프레임워크
  - Socket.IO - 실시간 양방향 통신

## 프로젝트 의존성

```json
"dependencies": {
  "@tailwindcss/cli": "^4.0.14",
  "express": "^4.21.2",
  "socket.io": "^4.8.1",
  "tailwindcss": "^4.0.14"
},
"devDependencies": {
  "nodemon": "^3.1.9"
}
```

### 주요 요구사항

- Node.js 22.14.0
- PNPM 10.5.1 (패키지 관리자)

## 프로젝트 설치 및 실행 방법

### 1. 사전 요구사항 설치

```bash
# Node.js 설치 (22.14.0 버전)
nvm install 22.14.0
nvm use 22.14.0

# PNPM 설치
npm install -g pnpm@10.5.1
```

### 2. 프로젝트 설치

```bash
# 레포지토리 클론
git clone https://github.com/your-username/web_rtc_n-to-1.git
cd web_rtc_n-to-1

# 의존성 설치
pnpm install
```

### 3. 환경 설정

- 카카오맵 API 키가 필요합니다. (src/views/receiver.html 파일에서 설정)
- 필요한 경우 ICE 서버 설정을 변경하세요. (src/public/js/modules/common/config.js)

### 4. 프로젝트 실행

```bash
# 개발 서버 실행
pnpm dev

# Tailwind CSS 빌드 (별도 터미널에서)
pnpm tailwind

# 로컬 서버를 외부에서 접근 가능하게 설정 (선택 사항)
pnpm localtunnel
```

서버는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 사용 방법

1. 메인 페이지에서 'Sender'(송신자) 또는 'Receiver'(수신자) 역할을 선택합니다.

### 송신자(Sender) 모드:

- 룸 이름을 입력하고 'Send Video' 버튼을 클릭하여 스트리밍을 시작합니다.
- 카메라를 선택하고 오디오/비디오를 토글할 수 있습니다.
- 현재 시청자 수가 실시간으로 표시됩니다.
- 스트리밍 종료 시 'Disconnect' 버튼을 클릭합니다.

### 수신자(Receiver) 모드:

- 지도에서 활성화된 스트리밍 위치를 확인할 수 있습니다.
- 지도의 마커를 클릭하여 해당 위치의 스트리밍을 시청합니다.
- 여러 스트림을 동시에 시청할 수 있습니다.

## WebRTC 구현 세부사항

- 피어 연결(Peer Connection)은 1:N 구조로 구현되어 있습니다.
- 각 송신자는 고유한 roomId를 생성하고, 수신자는 이 roomId를 통해 스트림에 접속합니다.
- ICE Candidate 교환 및 SDP 오퍼/앤서를 통한 표준 WebRTC 시그널링 프로세스를 따릅니다.
- 연결 해제 이벤트를 적절히 처리하여 자원 관리를 최적화합니다.

## 확장 및 개선 가능성

- 사용자 인증 시스템 추가
- 영상 품질 조정 옵션
- 채팅 기능 구현
- 더 다양한 위치 기반 서비스 통합
- 모바일 최적화

## 문제 해결

- 비디오/오디오 권한이 거부될 경우 브라우저 설정에서 권한을 확인하세요.
- 연결 문제가 있다면 방화벽 설정을 확인하고 STUN/TURN 서버 구성을 검토하세요.
- 개발 중 발생하는 문제는 브라우저 개발자 도구의 콘솔을 확인하세요.
