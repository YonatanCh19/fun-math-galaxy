import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function Games() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { t } = useTranslation();

  const games = [
    { name: t('memory_game'), desc: t('memory_game_desc'), img: "https://cdn-icons-png.flaticon.com/512/1180/1180838.png", path: "/games/memory" },
    { name: t('snake'), desc: t('snake_desc'), img: "https://cdn-icons-png.flaticon.com/512/565/565719.png", path: "/games/snake" },
    { name: t('tetris'), desc: t('tetris_desc'), img: "https://cdn-icons-png.flaticon.com/512/3937/3937513.png", path: "/games/tetris" },
    { name: t('balloon_pop'), desc: t('balloon_pop_desc'), img: "https://cdn-icons-png.flaticon.com/512/1684/1684400.png", path: "/games/balloon-pop" },
    { name: t('drawing_board'), desc: t('drawing_board_desc'), img: "https://cdn-icons-png.flaticon.com/512/3503/3503185.png", path: "/games/drawing-board" },
    { name: t('endless_runner'), desc: t('endless_runner_desc'), img: "https://cdn-icons-png.flaticon.com/512/2990/2990398.png", path: "/games/endless-runner" }
  ];

  React.useEffect(() => {
    if (!loading && !user) {
      nav("/auth");
    }
  }, [user, loading, nav]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela text-2xl text-pinkKid">
        {t('loading')}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-kidGradient py-12 font-varela flex flex-col items-center px-4">
      <h1 className="text-3xl sm:text-4xl font-bold mb-7 text-blueKid drop-shadow text-center">{t('games_page_title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7 w-full max-w-4xl">
        {games.map((g, idx) => (
          <div key={idx} tabIndex={0}
            onClick={() => nav(g.path)}
            className="group bg-white/80 rounded-3xl p-4 sm:p-7 flex flex-col items-center shadow-xl border-4 border-yellowKid hover:scale-105 transition focus:ring-4 focus:ring-pinkKid cursor-pointer"
            role="button"
            aria-label={g.name}
          >
            <img src={g.img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shadow-md mb-3" />
            <div className="text-xl sm:text-2xl font-bold text-greenKid mb-2 text-center">{g.name}</div>
            <div className="text-sm sm:text-base text-blue-900 text-center">{g.desc}</div>
          </div>
        ))}
      </div>
      <button onClick={() => nav("/practice")}
        className="mt-8 bg-pinkKid text-white px-6 py-3 text-lg sm:px-8 sm:py-4 sm:text-xl rounded-3xl drop-shadow hover:bg-pink-500 focus:outline-yellowKid font-bold"
      >
        {t('back_to_practice')}
      </button>
    </div>
  );
}
