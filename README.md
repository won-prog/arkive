# Luminous AR - Hair Color Simulator

Next.js + MediaPipe 기반 웹 헤어 컬러 시뮬레이터입니다.  
카메라에서 머리 영역을 분리하고, 탈색/염색 단계를 적용한 결과를 실시간으로 보여줍니다.

## 핵심 기능
- 실시간 카메라 입력 + 머리 영역 세그멘테이션 (`@mediapipe/tasks-vision`)
- 머리 윤곽선 오버레이
- 컬러 팔레트 선택 (탈색 계열 / 염색 계열)
- 탈색 `1회 / 2회 / 3회` 시뮬레이션
- 현재 모발 톤 기반 `추천 탈색 횟수` 자동 제안
- 뿌리/중간/끝 구간별 강도 조절
- 전체 강도 슬라이더

## 주요 라우트
- `/` : 랜딩
- `/simulator` : 시뮬레이터 소개 UI
- `/color-matcher` : 컬러 매처 UI
- `/shop` : 가상 상품 UI
- `/flow` : 사용자 플로우 UI
- `/hair-outline` : 실시간 MediaPipe 헤어 컬러 시뮬레이션 (핵심)

## 실행 방법
```bash
yarn install
yarn dev -p 3001
```

브라우저에서 `http://localhost:3001/hair-outline` 접속.

## 캐시 꼬임 복구
간헐적으로 Next dev 캐시가 꼬이면 아래로 재시작하세요.

```bash
rm -rf .next
yarn dev -p 3001
```

## Troubleshooting
### 1) `localhost:3001` 접속 불가
- 원인: 3001 포트를 다른 프로세스가 점유
- 해결:
```bash
lsof -tiTCP:3001 -sTCP:LISTEN | xargs kill -9
yarn dev -p 3001
```

### 2) `EADDRINUSE: address already in use :::3001`
- 원인: 기존 dev 서버가 살아있음
- 해결: 위와 동일하게 3001 점유 프로세스 종료 후 재실행

### 3) `EPERM: operation not permitted 0.0.0.0:3001`
- 원인: 실행 환경 권한 제한
- 해결: 권한이 허용된 터미널/세션에서 `yarn dev -p 3001` 실행

### 4) `Cannot find module './663.js'` (`.next/server/webpack-runtime.js`)
- 원인: Next dev 번들 캐시 꼬임
- 해결:
```bash
rm -rf .next
yarn dev -p 3001
```

### 5) MediaPipe import 빌드 에러 (`Exports field key ... "import"`)
- 원인: `@mediapipe/tasks-vision` 패키지 export 해석 충돌
- 해결: 정적 import 대신 브라우저 런타임 CDN 동적 import 사용

### 6) 컬러/강도 변경이 실시간 반영되지 않음
- 원인: 렌더 루프 클로저에 초기 상태가 고정
- 해결: `selected/strength/bleachPass/root/mid/end` 값을 `ref`로 동기화해 프레임마다 최신값 사용

## 기술 스택
- Next.js 15
- React 19
- TypeScript
- MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)

## 주의 사항
- 카메라 권한 허용이 필요합니다.
- 결과는 시뮬레이션이며 실제 시술 결과는 모발 이력/약제/시간/조명에 따라 달라질 수 있습니다.
