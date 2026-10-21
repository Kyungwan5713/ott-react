import test from 'node:test'
import assert from 'node:assert/strict'
import { validStream, normalizeSchedule, fetchOfficialLiveGames } from '../src/services/baseball.js'

test('player accepts only HTTPS embeds from supported providers', () => {
  assert.equal(validStream('https://www.youtube.com/embed/abcdefghijk'), 'https://www.youtube.com/embed/abcdefghijk')
  for (const url of ['javascript:alert(1)', 'https://evil.test/embed/abc', 'https://www.youtube.com.evil.test/embed/abc', 'http://www.youtube.com/embed/abc', 'https://www.youtube.com/watch?v=abc', null]) assert.equal(validStream(url), null)
})
test('schedule separates live, scheduled and ended games and removes duplicates', () => {
  const game = (id, state) => ({ gamePk: id, gameDate: '2026-10-21T09:00:00Z', teams: { away: { team: { name: 'A' }, score: 2 }, home: { team: { name: 'B' }, score: 1 } }, status: { abstractGameState: state } })
  const result = normalizeSchedule({ dates: [{ games: [game(1, 'Final'), game(2, 'Preview'), game(3, 'Live'), game(3, 'Live')] }] })
  assert.equal(result.length, 3)
  assert.equal(result[0].id, 'mlb-3')
  assert.equal(result[0].status, 'live')
  assert.equal(result.find(item => item.id === 'mlb-1').status, 'ended')
  assert.equal(result.find(item => item.id === 'mlb-2').status, 'scheduled')
  assert.equal(result[0].awayScore, 2)
  assert.deepEqual(normalizeSchedule({}), [])
})
test('missing YouTube key does not create fake broadcasts', async () => {
  assert.deepEqual(await fetchOfficialLiveGames('', new AbortController().signal), [])
})
test('official search excludes ended, non-embeddable and non-baseball videos', async () => {
  const previous = globalThis.fetch
  globalThis.fetch = async input => {
    const url = new URL(input)
    let data
    if (url.pathname.endsWith('/channels')) data = { items: [{ id: url.searchParams.get('forHandle') }] }
    else if (url.pathname.endsWith('/search')) {
      assert.equal(url.searchParams.get('eventType'), 'live')
      assert.equal(url.searchParams.get('videoEmbeddable'), 'true')
      data = { items: [{ id: { videoId: 'abcdefghijk' } }] }
    } else data = { items: [
      { id: 'abcdefghijk', snippet: { title: 'LIVE baseball final' }, status: { embeddable: true }, liveStreamingDetails: { actualStartTime: 'now' } },
      { id: 'ended', snippet: { title: 'baseball' }, status: { embeddable: true }, liveStreamingDetails: { actualStartTime: 'then', actualEndTime: 'now' } },
      { id: 'private', snippet: { title: 'baseball' }, status: { embeddable: false }, liveStreamingDetails: { actualStartTime: 'now' } },
      { id: 'other', snippet: { title: 'press conference' }, status: { embeddable: true }, liveStreamingDetails: { actualStartTime: 'now' } },
    ] }
    return { ok: true, json: async () => data }
  }
  try {
    const games = await fetchOfficialLiveGames('test-key', new AbortController().signal)
    assert.equal(games.length, 2)
    assert.ok(games.every(game => game.status === 'live' && game.id === 'yt-abcdefghijk'))
  } finally { globalThis.fetch = previous }
})
