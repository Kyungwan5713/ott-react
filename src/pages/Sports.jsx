import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import './Sports.css'
import { validStream, fetchBaseballSchedule, fetchOfficialLiveGames } from '../services/baseball'

const examples = [
  ['LG 트윈스', '두산 베어스', '잠실'], ['삼성 라이온즈', '롯데 자이언츠', '대구'],
  ['KIA 타이거즈', '한화 이글스', '광주'], ['SSG 랜더스', 'KT 위즈', '인천'],
  ['NC 다이노스', '키움 히어로즈', '창원'], ['뉴욕 양키스', 'LA 다저스', 'MLB'],
].map(([away, home, venue], i) => ({ id: `example-${i}`, away, home, venue, status: 'example' }))

function GameChat({ game }) {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const realGame = game.status !== 'example'
  useEffect(() => auth ? onAuthStateChanged(auth, setUser) : undefined, [])
  useEffect(() => {
    if (!db || !realGame || !user) return
    return onSnapshot(query(collection(db, 'sportsGames', game.id, 'messages'), orderBy('createdAt', 'desc'), limit(100)), snapshot => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).reverse())
      setStatus('connected')
    }, () => { setStatus('error'); setError('채팅에 연결하지 못했습니다. 권한과 네트워크를 확인해 주세요.') })
  }, [game.id, realGame, user])
  useEffect(() => { if (messages.length) endRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages])
  async function send(event) {
    event.preventDefault()
    if (!user || !db || !text.trim() || sending || status !== 'connected') return
    setSending(true)
    setError('')
    try {
      await addDoc(collection(db, 'sportsGames', game.id, 'messages'), {
        uid: user.uid, name: user.displayName || '야구팬', text: text.trim(), createdAt: serverTimestamp(),
      })
      setText('')
    } catch { setError('메시지 전송에 실패했습니다. 다시 시도해 주세요.') }
    finally { setSending(false) }
  }
  const enabled = realGame && user && status === 'connected'
  return <aside className="sports-chat" aria-label="경기 실시간 채팅">
    <div className="sports-chat-heading"><h2>실시간 응원톡</h2><span>{enabled ? '연결됨' : '대기 중'}</span></div>
    <p className="sports-chat-caption">같은 경기를 보는 팬들과 함께 응원하세요</p>
    <div className="sports-messages" role="log" aria-label="채팅 메시지" aria-live="polite">
      {!db ? <p className="sports-empty">Firebase 연결 설정이 필요합니다.</p>
        : !realGame ? <p className="sports-empty">예시 경기입니다. 실제 경기 등록 후 채팅이 열립니다.</p>
        : !user ? <p className="sports-empty"><Link to="/login">로그인</Link> 후 응원톡에 참여하세요.</p>
        : messages.length === 0 ? <p className="sports-empty">{status === 'connected' ? '첫 응원 메시지를 남겨보세요!' : '채팅 연결 중…'}</p> : null}
      {user && messages.map(message => <div className={`sports-message ${message.uid === user?.uid ? 'mine' : ''}`} key={message.id}>
        <strong>{message.name}</strong><p>{message.text}</p>
      </div>)}<div ref={endRef} />
    </div>
    {error && <p role="alert" className="sports-error">{error}</p>}
    <form onSubmit={send} className="sports-chat-form">
      <label htmlFor="sports-message">응원 메시지</label>
      <div><input id="sports-message" value={text} onChange={event => setText(event.target.value)} maxLength={300} disabled={!enabled || sending} placeholder="응원의 한마디를 남겨주세요" autoComplete="off" />
        <button disabled={!enabled || sending || !text.trim()}>{sending ? '전송 중' : '전송'}</button></div>
      <small>{text.length}/300 · 서로 존중하며 응원해 주세요</small>
    </form>
  </aside>
}

export function Sports() {
  const [feed, setFeed] = useState({ games: [], state: db ? 'loading' : 'unconfigured' })
  const [selectedId, setSelectedId] = useState(null)
  const [schedule, setSchedule] = useState({ games: [], state: 'loading' })
  const [broadcasts, setBroadcasts] = useState({ games: [], state: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    async function refresh() {
      try {
        const games = await fetchOfficialLiveGames(import.meta.env.VITE_YOUTUBE_API_KEY, controller.signal)
        if (!controller.signal.aborted) setBroadcasts({ games, state: import.meta.env.VITE_YOUTUBE_API_KEY ? 'connected' : 'unconfigured' })
      } catch {
        if (!controller.signal.aborted) setBroadcasts({ games: [], state: 'error' })
      }
    }
    refresh()
    const timer = setInterval(refresh, 300000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    async function refresh() {
      try {
        const games = await fetchBaseballSchedule(controller.signal)
        if (!controller.signal.aborted) setSchedule({ games, state: 'connected' })
      } catch {
        if (!controller.signal.aborted) setSchedule(previous => ({ ...previous, state: 'error' }))
      }
    }
    refresh()
    const timer = setInterval(refresh, 60000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [])
  useEffect(() => {
    if (!db) return
    return onSnapshot(query(collection(db, 'sportsGames'), limit(100)), snapshot => {
      const games = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(game => typeof game.home === 'string' && typeof game.away === 'string' && ['live', 'scheduled', 'ended'].includes(game.status))
        .sort((a, b) => (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1))
      setFeed({ games, state: 'connected' })
    }, () => setFeed({ games: [], state: 'error' }))
  }, [])
  const combined = [...feed.games, ...broadcasts.games.filter(game => !feed.games.some(item => item.id === game.id)), ...schedule.games.filter(game => !feed.games.some(item => item.id === game.id))]
  const games = combined.length ? combined : examples
  const selected = games.find(game => game.id === selectedId) || games[0]
  const stream = selected.status === 'live' && validStream(selected.streamUrl)
  const labels = { live: 'LIVE', scheduled: '경기 예정', ended: '경기 종료', example: '예시 경기' }
  return <main className="sports-page">
    <div className="sports-container">
      <div className="sports-title"><div><p>SPORTS · BASEBALL</p><h1>야구의 모든 순간, 함께.</h1><span>경기를 보고, 응원을 나누는 우리들의 관중석</span></div><span className="sports-live-count">● {combined.filter(game => game.status === 'live').length} 경기 LIVE</span></div>
      {combined.length === 0 && <p className="sports-notice" role="status">{schedule.state === 'loading' ? '실시간 경기 정보를 불러오는 중입니다.' : schedule.state === 'error' ? '실제 경기 정보를 연결하지 못했습니다. 네트워크를 확인해 주세요.' : '등록된 실시간 경기가 없습니다.'} 아래 6개 경기는 화면 구성 예시이며 실제 일정·중계가 아닙니다.</p>}
      {schedule.state === 'error' && combined.length > 0 && <p className="sports-notice" role="status">MLB 경기 정보 갱신에 실패했습니다. 마지막 수신 정보를 표시하며 자동 재시도합니다.</p>}
      {broadcasts.state === 'unconfigured' && <p className="sports-notice">공식 MLB·WBSC 생중계 자동 검색에는 YouTube API 연결이 필요합니다. 현재 중계가 등록되지 않은 경기는 공식 게임센터에서 시청 가능 여부를 확인하세요.</p>}
      {broadcasts.state === 'error' && <p className="sports-notice" role="status">공식 생중계 검색에 실패했습니다. YouTube API 설정·할당량·네트워크를 확인해 주세요.</p>}
      {broadcasts.state === 'connected' && broadcasts.games.length === 0 && <p className="sports-notice">현재 MLB·WBSC 공식 채널에서 임베드 가능한 야구 생중계가 확인되지 않았습니다. 실제 경기 진행과 영상 중계 가능 여부는 다를 수 있습니다.</p>}
      <div className="sports-watch">
        <section className="sports-player-section" aria-label="선택한 경기 중계">
          <div className="sports-player">{stream ? <iframe key={stream} src={stream} title={`${selected.away} 대 ${selected.home} 실시간 중계`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            : <div className="sports-player-empty"><span aria-hidden="true">⚾</span><h2>{selected.away} <em>vs</em> {selected.home}</h2><p>{selected.status === 'ended' ? '종료된 경기입니다' : '공식 중계 연결 대기'}</p><small>중계가 등록되면 이곳에서 시청할 수 있습니다.</small>{selected.officialUrl && <a className="sports-official-link" href={selected.officialUrl} target="_blank" rel="noreferrer">MLB 공식 게임센터에서 중계 확인 ↗</a>}</div>}</div>
          <div className="sports-now"><span className={selected.status === 'live' ? 'sports-badge live' : 'sports-badge'}>{labels[selected.status]}</span><h2>{selected.away} <span>vs</span> {selected.home}</h2><p>{selected.venue || '경기장 미정'}{selected.inning ? ` · ${selected.inning}` : ''}</p></div>
        </section>
        <GameChat key={selected.id} game={selected} />
      </div>
      <section className="sports-schedule" aria-labelledby="sports-games-title"><div className="sports-section-heading"><h2 id="sports-games-title">야구 경기 목록</h2><span>{games.length}개 경기 · 경기를 선택해 함께 시청하세요</span></div>
        <div className="sports-game-grid">{games.map(game => <button key={game.id} className={`sports-game ${selected.id === game.id ? 'selected' : ''}`} aria-pressed={selected.id === game.id} onClick={() => setSelectedId(game.id)}>
          <div className="sports-game-top"><span className={`sports-badge ${game.status === 'live' ? 'live' : ''}`}>{labels[game.status]}</span><span>{game.venue || '경기장 미정'}</span></div>
          <div className="sports-match"><strong>{game.away}</strong><span>VS</span><strong>{game.home}</strong></div>{game.startsAt && <p className="sports-game-time">{new Date(game.startsAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (한국시간){game.awayScore != null && game.homeScore != null ? ` · ${game.awayScore} : ${game.homeScore}` : ''}</p>}<div className="sports-game-bottom">{game.status === 'live' ? '중계 시청 · 응원톡 참여' : '경기 보기'}<span aria-hidden="true">↗</span></div>
        </button>)}</div>
      </section>
    </div>
  </main>
}
