# 스포츠 중계와 채팅 연결

`/sports`는 Firestore의 `sportsGames` 컬렉션을 실시간 구독합니다. 실제 경기 데이터가 없거나 연결에 실패하면 6개의 **예시 경기**를 보여줍니다. 예시는 실제 일정이나 생중계가 아니며 채팅도 비활성화됩니다. 실제 데이터가 있으면 등록된 경기 수만큼 표시합니다. 5개 이상 표시하려면 실제 경기 문서를 5개 이상 등록하세요.

## 필요한 설정

기존 Firebase 프로젝트의 `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` 및 나머지 기존 Firebase 설정을 환경 설정에 입력하고 Vite를 재시작하세요. Google 로그인 제공업체와 앱 도메인도 Firebase Authentication에서 허용해야 합니다. Firebase 웹 설정은 클라이언트 번들에 포함되므로 서버용 비밀키를 사용하지 마세요.

Firestore 규칙에 `sports-firestore.rules`의 sportsGames 경로를 병합하세요. 기존 users 경로 규칙을 보존하고, 중복되는 광범위한 쓰기 허용 규칙이 없는지 확인하세요. 이 파일은 자동 배포되지 않습니다. 운영 환경에서는 App Check, 도배 방지와 신고/관리 기능도 추가하세요.

## 경기 등록

Firebase 콘솔 또는 신뢰할 수 있는 Admin SDK에서 `sportsGames/{고유경기ID}` 문서를 등록합니다. 웹 클라이언트의 경기 수정은 허용하지 않습니다.

```json
{
  "away": "원정팀",
  "home": "홈팀",
  "venue": "경기장",
  "status": "live",
  "streamUrl": "https://www.youtube.com/embed/공식영상ID"
}
```

`status`는 `live`, `scheduled`, `ended` 중 하나입니다. 직접 중계할 권한이 있고 임베드를 허용한 공식 생중계 URL을 사용하세요. 지원 URL은 HTTPS YouTube / YouTube-nocookie `/embed/영상ID`와 Vimeo `/video/영상ID`입니다. 임의 HTML, 외부 호스트 또는 일반 영상 페이지 URL은 플레이어로 삽입되지 않습니다. 공급자의 임베드·지역·로그인 제한에 따라 재생이 차단될 수 있습니다. 경기 종료 시 status를 ended로 갱신하세요. 자동 일정·스코어 공급업체는 아직 연결되지 않았습니다.

채팅은 `sportsGames/{경기ID}/messages`에 저장되고 로그인 사용자가 최근 100개를 실시간 구독합니다. 메시지 필드는 uid, name, text, createdAt이며 서버 타임스탬프를 사용합니다. 예시나 허구의 접속자 수/채팅은 생성하지 않습니다. 화면을 떠나거나 경기를 전환하면 이전 구독을 해제합니다.

## 확인 방법

1. 실제 경기 문서를 5개 이상 등록하고 `/sports`에서 목록과 LIVE 표시를 확인합니다.
2. 중계가 활성화된 경기를 선택하고 플레이어 재생을 확인합니다.
3. 서로 다른 두 브라우저에서 로그인한 후 같은 경기를 선택합니다.
4. 양쪽에서 메시지를 보내고 상대 브라우저에 즉시 도착하는지 확인합니다. 다른 경기 채팅방으로 메시지가 섞이지 않는지도 확인합니다.
5. 비로그인 상태에서 전송 불가, 300자 제한, 경기 전환, Firestore 권한 거부 상태를 확인합니다.

현재 클라우드에는 Firebase 설정과 공식 중계 URL이 없어 실제 중계 및 브라우저 간 채팅 검증은 해당 설정 후 수행해야 합니다.

## 공식 소스 자동 연결

MLB 공개 Stats API (`statsapi.mlb.com/api/v1/schedule`)에서 전날부터 7일 후까지 실제 일정과 경기 상태·스코어를 조회하고 60초마다 갱신합니다. 비시즌이나 경기가 적은 날에는 실제 목록이 5개 미만일 수 있으며, 가상의 LIVE 경기로 수를 채우지 않습니다. 중계가 없는 MLB 경기는 공식 MLB 게임센터 링크를 제공합니다. 이는 영상 스트림이 아니며 시청권 구매가 필요할 수 있습니다.

`VITE_YOUTUBE_API_KEY`가 있으면 YouTube Data API v3에서 공식 MLB와 WBSC 채널의 현재 생중계를 5분마다 검색합니다. 채널 핸들을 API로 해석하고 실제 시작·미종료 여부 및 임베드 허용을 재확인합니다. 제목에 야구 관련 키워드가 있는 영상만 표시하므로 일부 중계를 놓칠 수 있습니다. 무료 실시간 경기가 항상 존재한다는 보장은 없습니다. 검색 할당량이 소진되면 오류를 표시합니다. 운영 시 서버에서 검색을 중앙화·캐시해 클라이언트 수에 따른 할당량 소진을 방지해야 합니다. API 키는 YouTube Data API만 허용하고 앱의 HTTP referrer로 제한하세요.

외부 연결 대상: statsapi.mlb.com, www.googleapis.com, www.youtube.com, www.youtube-nocookie.com, www.mlb.com. 이 클라우드의 외부 사이트 확인은 네트워크 프록시에서 HTTP 403으로 차단되어 실제 소스 응답과 재생 여부는 검증하지 못했습니다. 코드와 네트워크 설정 초안만으로 현재 경기가 방송 중이라고 판단하지 마세요.

공식 API 경기 채팅방은 `mlb-{gamePk}`, YouTube는 `yt-{videoId}`로 구분됩니다. 로그인 사용자만 메시지를 읽고 쓸 수 있습니다. 규칙의 해당 ID 패턴은 부모 문서 없는 API 경기 채팅을 지원합니다. 운영에서는 서버에서 실제 경기 ID를 검증·등록하고 Firestore 문서 존재 조건만 허용하도록 강화할 수 있습니다.

## Vercel 배포

Vercel에 이 GitHub 저장소를 연결하고 Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는 `dist`로 설정합니다. `vercel.json`은 `/sports` 등 React 경로의 직접 접근과 새로고침을 지원합니다. 필요한 VITE_FIREBASE_*, VITE_TMDB_API_KEY, VITE_YOUTUBE_API_KEY를 Vercel 환경 변수에 등록하세요. VITE 변수는 브라우저에 공개되므로 서버 비밀키를 넣지 마세요. Firebase 인증의 승인된 도메인에도 배포 도메인을 추가해야 합니다.
