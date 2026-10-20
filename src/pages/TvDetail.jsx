// import React from 'react'

// export const TvDetail = () => {
//   return (
//     <section className='sub-page pt-25'>
//         <div className="inner">
//             <h2 className="section-title text-3xl font-bold">티비 상세</h2>
//         </div>
//     </section>
//   )
// }
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMovieStore } from '../store/useMovieStore'

export const TvDetail = () => {
  // 주소에서 TV ID 받아오기
  const { id } = useParams();
  const tvId = Number(id);

  // Zustand
  const {
    tvs,
    tvVideo,
    tvDetails,
    seasons,
    episodes,
    onFetchTvVideo,
    onFetchSeason,
    onFetchEpisode,
    episodeVideos,
    onFetchEpisodeVideo,
    onSearchYouTubeEpisode
  } = useMovieStore();

  // 팝업 상태
  const [showPopup, setShowPopup] = useState(false);
  const [playingVideoKey, setPlayingVideoKey] = useState('');
  // 현재 재생할 영상의 youtube key 전달

  // 현재 선택된 시즌
  const [selectedSeason, setSelectedSeason] = useState(null);

  // 인기 TV 목록에서 현재 TV 찾기
  const listTv = tvs.find((t) => t.id === tvId);

  // 상세정보를 우선 사용
  const tv = tvDetails[tvId] || listTv;

  // 현재 TV의 시즌 목록
  const seasonList = seasons[tvId] || [];

  // 현재 선택한 시즌의 에피소드 목록
  const key = `${tvId}-${selectedSeason}`;
  const episodeList = episodes[key] || [];

  // TV 영상과 시즌 정보 가져오기
  useEffect(() => {
    if (tvId) {
      onFetchTvVideo(tvId);
      onFetchSeason(tvId);
    }
  }, [tvId, onFetchTvVideo, onFetchSeason]);

  // TV가 변경되면 시즌 선택 초기화
  useEffect(() => {
    setSelectedSeason(null);
    setShowPopup(false);
  }, [tvId]);

  // 시즌 목록을 가져온 후 첫 번째 정규 시즌 선택
  useEffect(() => {
    if (selectedSeason !== null) return;
    if (seasonList.length === 0) return;

    const firstSeason =
      seasonList.find((s) => s.season_number === 1) ||
      seasonList[0];

    setSelectedSeason(firstSeason.season_number);
  }, [seasonList, selectedSeason]);

  // 선택된 시즌의 에피소드 불러오기
  useEffect(() => {
    if (tvId && selectedSeason !== null) {
      onFetchEpisode(tvId, selectedSeason);
    }
  }, [tvId, selectedSeason, onFetchEpisode]);

  // TV 영상정보
  const video = tvVideo[tvId] || [];

  // 예고편 찾기
  const trailer = video.find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );

  // 팝업 열기: 재생할 YouTube 영상 키를 전달
  const handlePopup = (videoKey) => {
    if (!videoKey) {
      alert("재생할 수 있는 영상이 없습니다.");
      return;
    }

    setPlayingVideoKey(videoKey);
    setShowPopup(true);
  };

  // 팝업 닫기
  const handleClose = () => {
    setShowPopup(false);
    setPlayingVideoKey('');
  };

  // 시즌 변경하기
  const handleSeason = (seasonNumber) => {
    setSelectedSeason(seasonNumber);
  };

  // 이미지 경로 만들기
  const getImage = (path, size = "w500") => {
    return path
      ? `https://image.tmdb.org/t/p/${size}${path}`
      : "https://placehold.co/500x300?text=No+Image";
  };

  if (!Number.isInteger(tvId) || tvId <= 0) {
    return <p className="pt-30 text-center">잘못된 TV 주소입니다.</p>;
  }

  return (
    <section className="sub-page pt-30">

      {/* TV 상세정보 */}
      <div className="inner flex gap-15">

        {/* 포스터 */}
        <div className="w-2/6">
          <img
            src={getImage(tv?.poster_path)}
            alt={tv?.name || "TV 포스터"}
            className="w-full"
          />
        </div>

        {/* TV 정보 */}
        <div className="w-4/6">
          <h2 className="text-5xl">
            {tv?.name}
          </h2>

          <p className="mt-5">
            ⭐ {tv?.vote_average?.toFixed(1)}
          </p>

          <p className="mt-3">
            첫 방영일 : {tv?.first_air_date}
          </p>

          <p className="my-10">
            {tv?.overview}
          </p>

          <div className="flex gap-5">
            <button
              className="bg-black text-white p-4"
              onClick={handlePopup}
            >
              재생하기
            </button>

            <button className="border p-4">
              찜하기
            </button>
          </div>
        </div>
      </div>

      {/* 시즌 및 에피소드 */}
      <div className="inner mt-20 pb-20">

        <h2 className="text-3xl font-bold mb-8">
          시즌 및 에피소드
        </h2>

        {/* 시즌 선택 버튼 */}
        <div className="flex gap-3 mb-10 flex-wrap">
          {seasonList.map((season) => (
            <button
              key={season.id}
              onClick={() =>
                handleSeason(season.season_number)
              }
              className={`border px-6 py-3 rounded-lg
                                ${selectedSeason === season.season_number
                  ? "bg-black text-white"
                  : "bg-white text-black"
                }
                            `}
            >
              {season.name}
            </button>
          ))}
        </div>

        {/* 에피소드 리스트 */}
        <div className="flex flex-col gap-8">

          {episodeList.map((episode) => (
            <div
              key={episode.id}
              className="flex gap-8 border-b pb-8"
            >

              {/* 에피소드 이미지 */}
              <div className="w-2/6 shrink-0">
                <img
                  src={getImage(
                    episode.still_path,
                    "w500"
                  )}
                  alt={episode.name}
                  className="w-full rounded-lg"
                />
              </div>

              {/* 에피소드 설명 */}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3">
                  {episode.episode_number}화.
                  {" "}{episode.name}
                </h3>

                <p className="text-gray-500 mb-4">
                  {episode.runtime
                    ? `${episode.runtime}분`
                    : "상영시간 미정"}
                  {" · "}
                  {episode.air_date || "방영일 미정"}
                </p>

                <p className="text-gray-700">
                  {episode.overview ||
                    "에피소드 설명이 없습니다."}
                </p>
                {/* 에피소드별 재생 버튼 */}
                <button
                  className="bg-black text-white px-6 py-3 mt-5 rounded"
                  onClick={async () => {
                    const videos = await onSearchYouTubeEpisode(
                      tv?.name || tv?.original_name || "",
                      selectedSeason,
                      episode
                    );

                    if (videos.length > 0) {
                      handlePopup(videos[0].key);
                    } else {
                      alert("검색된 YouTube 영상이 없습니다.");
                    }
                  }}
                >
                  ▶ 재생하기
                </button>
              </div>

            </div>
          ))}

          {selectedSeason !== null &&
            episodes[key] &&
            episodeList.length === 0 && (
              <p>등록된 에피소드가 없습니다.</p>
            )}

        </div>
      </div>

      {/* 영상 팝업 */}
      {showPopup && playingVideoKey && (
        <div className="fixed inset-0 bg-black z-[10000]">

          <button
            className="absolute right-5 top-5 bg-white text-black p-3 z-10"
            onClick={handleClose}
          >
            닫기 ✕
          </button>

          <iframe
            key={playingVideoKey}
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${playingVideoKey}?autoplay=1&mute=1`}
            title="에피소드 영상"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

    </section>
  );
};