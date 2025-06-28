import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

  // פונקציה שמטפלת בסיום משחק - חזרה אוטומטית לתרגול
  useEffect(() => {
    const handleGameEnd = () => {
      // האזנה לאירועי סיום משחק
      const handleBeforeUnload = () => {
        // אם המשתמש עוזב את דף המשחקים, נחזיר אותו לתרגול
        setTimeout(() => {
          if (window.location.pathname.includes('/games/')) {
            nav('/practice');
          }
        }, 100);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    };

    return handleGameEnd();
  }, [nav]);

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
      {/* כפתור חזרה */}
      <div className="w-full max-w-4xl flex justify-start mb-4">
        <Button
          onClick={() => nav("/practice")}
          variant="ghost"
          className="bg-white/80 text-blue-800 hover:bg-white hover:scale-105 transition-transform flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          חזרה לתרגול
        </Button>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold mb-7 text-blueKid drop-shadow text-center">{t('games_page_title')}</h1>
      
      {/* הודעת עידוד */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-3xl p-6 mb-8 max-w-2xl text-center shadow-xl">
        <h2 className="text-xl sm:text-2xl font-bold text-orange-800 mb-3">
          🎉 כל הכבוד! הגעת לעולם המשחקים! 🎉
        </h2>
        <p className="text-base sm:text-lg text-orange-700">
          בחר במשחק שהכי מעניין אותך ותהנה! אחרי המשחק תחזור אוטומטית לתרגול.
        </p>
      </div>

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
    </div>
  );
}