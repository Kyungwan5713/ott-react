export function validStream(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'].includes(url.hostname)
      && /^\/(embed\/|video\/)[\w-]+$/.test(url.pathname) ? url.href : null
  } catch { return null }
}

export function normalizeSchedule(data) {
  const games = (data.dates || []).flatMap(date => (date.games || []).map(game => ({
    id: `mlb-${game.gamePk}`, away: game.teams?.away?.team?.name,
    home: game.teams?.home?.team?.name, venue: game.venue?.name,
    startsAt: game.gameDate, source: 'mlb',
    status: game.status?.abstractGameState === 'Live' ? 'live' : game.status?.abstractGameState === 'Final' ? 'ended' : 'scheduled',
    detail: game.status?.detailedState,
    awayScore: game.teams?.away?.score, homeScore: game.teams?.home?.score,
    inning: game.linescore?.currentInningOrdinal,
    officialUrl: `https://www.mlb.com/gameday/${game.gamePk}`,
  }))).filter(game => game.home && game.away)
  return [...new Map(games.map(game => [game.id, game])).values()].sort((a, b) =>
    (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || new Date(a.startsAt) - new Date(b.startsAt))
}

export async function fetchBaseballSchedule(signal) {
  const today = new Date()
  const start = new Date(today); start.setUTCDate(start.getUTCDate() - 1)
  const end = new Date(today); end.setUTCDate(end.getUTCDate() + 7)
  const params = new URLSearchParams({ sportId: '1', startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), hydrate: 'linescore' })
  const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?${params}`, { signal })
  if (!response.ok) throw new Error('MLB 경기 정보를 불러오지 못했습니다.')
  return normalizeSchedule(await response.json())
}

// Resolve official channel handles via the API; never invent a video ID or mark a replay live.
export async function fetchOfficialLiveGames(apiKey, signal) {
  if (!apiKey) return []
  async function youtube(endpoint, values) {
    const params = new URLSearchParams({ ...values, key: apiKey })
    const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${params}`, { signal })
    if (!response.ok) throw new Error('공식 생중계 검색에 실패했습니다.')
    return response.json()
  }
  const results = await Promise.all(['MLB', 'WBSC'].map(async handle => {
    const channel = await youtube('channels', { part: 'id', forHandle: handle })
    const channelId = channel.items?.[0]?.id
    if (!channelId) return []
    const search = await youtube('search', { part: 'snippet', channelId, eventType: 'live', type: 'video', videoEmbeddable: 'true', maxResults: '10' })
    const ids = (search.items || []).map(item => item.id?.videoId).filter(Boolean)
    if (!ids.length) return []
    const details = await youtube('videos', { part: 'snippet,status,liveStreamingDetails', id: ids.join(',') })
    return (details.items || []).filter(video => video.status?.embeddable
      && video.liveStreamingDetails?.actualStartTime && !video.liveStreamingDetails?.actualEndTime
      && /baseball|야구|world baseball|premier12/i.test(video.snippet.title)).map(video => ({
      id: `yt-${video.id}`, away: video.snippet.title, home: `${handle} 공식 중계`,
      venue: 'YouTube LIVE', source: 'youtube', status: 'live',
      streamUrl: `https://www.youtube.com/embed/${video.id}`,
    }))
  }))
  return results.flat()
}
