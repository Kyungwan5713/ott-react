// import { create } from "zustand";

// // TMDB키를 변수로 저장하기
// const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

// export const useMovieStore = create((set, get) => ({
//     // 인기영화를 저장할 배열
//     popMovies: [],
//     // 인기영화를 불러올 메서드
//     onFetchPopular: async () => {
//         const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`)
//         // console.log(res);
//         const data = await res.json();
//         // console.log(data);
//         set({ popMovies: data.results })
//     },
//     // 영화의 비디오를 저장하 변수
//     popVideo: {},
//     // 영화의 비디오를 불러오는 메서드
//     onFetchVideo: async (id) => {
//         // 기존에 불러온 영상이 있는지를 체크해서 있으면 그만 불러와야지??
//         const { popVideo } = get();
//         console.log(popVideo[id])
//         if (popVideo[id]) return;


//         const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}&language=ko-KR`)
//         // console.log("비디오", res)
//         const data = await res.json();
//         // console.log("비디오 데이터", data)
//         set((state) => ({
//             popVideo: {
//                 ...state.popVideo,
//                 [id]: data.results
//             }
//         }))
//     },
//     // #################티비(인기)
//     // 인기 티비프로그램을 저장할 배열
//     tvs: [],
//     // 인기 티비프로그램을 영상을 저장할 오브젝트
//     tvVideo: {},
//     // 인기 티비프로그램을 불러올 메서드
//     onFetchTv: async () => {
//         const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`)
//         const data = await res.json();
//         console.log("인기티비", data);
//         set({ tvs: data.results })
//     },
//     // 인기 티비프로그램의 영상을 메서드
//     onFetchTvVideo: async (id) => {
//         const { tvVideo } = get();
//         if (tvVideo[id]) return;
//         const res = await fetch(`https://api.themoviedb.org/3/tv/videos?api_key=${TMDB_KEY}&language=en-US`)
//         const data = await res.json();
//         set((state) => ({
//             tvVideo: {
//                 ...state.tvVideo,
//                 [id]: data.results
//             }
//         }))
//     },
//     // 시즌
//     seasons: [],
//     onFetchSeason: async (id) => {

//     },
//     // 시즌별 에피소드
//     episodes: [],
//     onFetchEpisode: async (id, season) => { }

// }))
import { create } from "zustand";

//TMDB키를 변수로 저장하기
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export const useMovieStore = create((set, get) => ({
    // ############ 영화 (인기)
    //인기영화를 저장할 배열
    popMovies: [],
    //인기영화를 불러올 메서드
    onFetchPopular: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`)
        // console.log(res);
        const data = await res.json();
        // console.log(data);
        set({ popMovies: data.results })
    },
    // 영화의 비디오를 저장할 변수
    popVideo: {},
    // 영화의 비디오를 불러오은 메서드
    onFetchVideo: async (id) => {
        //기존에 불러온 영상이 있는지를 체크해서 있으면 그만 불러와야지??
        const { popVideo } = get();

        if (popVideo[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}&language=ko-KR`)
        // console.log("비디오", res)
        const data = await res.json();
        // console.log("비디오 데이터", data)
        set((state) => ({
            popVideo: {
                ...state.popVideo,
                [id]: data.results
            }
        }))
    },

    // ############# 티비 (인기)

    // 인기 TV 목록
    tvs: [],
    // TV 영상 저장
    tvVideo: {},
    // 인기 TV 불러오기
    onFetchTv: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);

        if (!res.ok) throw new Error("TV 목록을 불러오지 못했습니다.");
        const data = await res.json();
        //?? 왼쪽값이 null, undefined 이면 오른쪽을 사용해라
        //? 왼쪽값이 존재하면 체이닝을 실행해라
        set({ tvs: data.results ?? [] });
    },

    // TV 영상 가져오기
    onFetchTvVideo: async (id) => {
        const { tvVideo } = get();
        if (tvVideo[id]) return;
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/videos?api_key=${TMDB_KEY}&language=en-US`);

        if (!res.ok) throw new Error("TV 영상을 불러오지 못했습니다.");
        const data = await res.json();
        set((state) => ({
            tvVideo: {
                ...state.tvVideo,
                [id]: data.results ?? []
            }
        }));
    },

    // ############# 시즌

    // TV ID별 상세정보 저장
    tvDetails: {},

    // TV ID별 시즌 목록 저장
    seasons: {},

    // TV 상세정보 + 시즌 목록 가져오기
    onFetchSeason: async (id) => {
        const { seasons } = get();

        // 이미 저장된 시즌이면 요청하지 않음
        if (seasons[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=ko-KR`);

        if (!res.ok) throw new Error("시즌 정보를 불러오지 못했습니다.");

        const data = await res.json();
        set((state) => ({
            tvDetails: {
                ...state.tvDetails,
                [id]: data
            },
            seasons: {
                ...state.seasons,
                [id]: data.seasons ?? []
            }
        }));
    },

    // ############# 에피소드

    // TV ID와 시즌 번호별 에피소드 저장
    episodes: {},
    // 특정 시즌의 에피소드 가져오기
    onFetchEpisode: async (id, season) => {
        const { episodes } = get();

        // 동일한 TV라도 시즌마다 다른 에피소드
        const key = `${id}-${season}`;
        // 이미 저장된 에피소드면 요청하지 않음
        if (episodes[key]) return;
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${TMDB_KEY}&language=ko-KR`);

        if (!res.ok) throw new Error("에피소드를 불러오지 못했습니다.");

        const data = await res.json();
        set((state) => ({
            episodes: {
                ...state.episodes,
                [key]: data.episodes ?? []
            }
        }));
    },
    // ================= 에피소드별 영상 =================
    episodeVideos: {},

    onFetchEpisodeVideo: async (id, season, episode) => {
        const key = `${id}-${season}-${episode}`;

        // 이미 영상 정보가 저장되어 있으면 재요청하지 않음
        const { episodeVideos } = get();
        if (Object.hasOwn(episodeVideos, key)) return;

        try {
            // 한국어와 영어 영상 정보를 함께 조회
            const languages = ["ko-KR", "en-US"];

            const results = await Promise.all(
                languages.map(async (language) => {
                    const url =
                        `https://api.themoviedb.org/3/tv/${id}/season/${season}/episode/${episode}/videos` +
                        `?api_key=${TMDB_KEY}&language=${language}`;

                    const res = await fetch(url);

                    if (!res.ok) {
                        throw new Error(
                            `TMDB 오류: ${res.status} (${language})`
                        );
                    }

                    const data = await res.json();

                    console.log(
                        `${season}시즌 ${episode}화 / ${language}:`,
                        data.results
                    );

                    return data.results || [];
                })
            );

            // 중복 영상을 제거
            const uniqueVideos = Array.from(
                new Map(
                    results.flat().map((video) => [
                        `${video.site}-${video.key}`,
                        video
                    ])
                ).values()
            );

            console.log("최종 에피소드 영상:", uniqueVideos);

            set((state) => ({
                episodeVideos: {
                    ...state.episodeVideos,
                    [key]: uniqueVideos
                }
            }));
        } catch (error) {
            console.error("에피소드 영상 조회 실패:", error);
        }
    },
     // ================= YouTube 영상 검색 =================
    youtubeVideos: {},

    onSearchYouTubeEpisode: async (tvName, season, episode) => {
        const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

        const key = `${tvName}-${season}-${episode.episode_number}`;

        try {
            const query =
                `${tvName} 시즌 ${season} ${episode.episode_number}화 ${episode.name}`;

            const params = new URLSearchParams({
                part: "snippet",
                q: query,
                type: "video",
                videoEmbeddable: "true",
                maxResults: "5",
                regionCode: "KR",
                relevanceLanguage: "ko",
                key: YOUTUBE_KEY
            });

            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?${params}`
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error?.message || `HTTP ${res.status}`
                );
            }

            const videos = (data.items || [])
                .filter((item) => item.id?.videoId)
                .map((item) => ({
                    key: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails?.medium?.url,
                    channelTitle: item.snippet.channelTitle
                }));

            console.log("YouTube 검색 결과:", videos);

            set((state) => ({
                youtubeVideos: {
                    ...state.youtubeVideos,
                    [key]: videos
                }
            }));

            return videos;
        } catch (error) {
            console.error("YouTube 검색 실패:", error);
            alert(`YouTube 검색 오류: ${error.message}`);
            return [];
        }
    },
}));