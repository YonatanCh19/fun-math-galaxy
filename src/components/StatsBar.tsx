import React from "react";
import AnimatedTrophy from "./AnimatedTrophy";

export default function StatsBar({
  correct,
  total,
  trophies,
}: {
  correct: number;
  total: number;
  trophies: number;
}) {
  console.log("Rendering: StatsBar");
  
  return (
    <div className="flex flex-row-reverse items-center p-2 px-6 rounded-full bg-white/80 shadow-lg mt-4 gap-6 font-varela text-lg font-bold border-4 border-pinkKid">
      <div className="flex items-center pr-2 gap-1">
        <span className="text-yellow-700">נכונות</span>
        <span className="text-green-600">{correct}</span>
      </div>
      <div className="flex items-center gap-2">
        <AnimatedTrophy size={30} className="mx-1" />
        <span className="text-pinkKid">{trophies}</span>
      </div>
      <div className="flex items-center gap-1 text-blue-900">
        <span>סה"כ</span>
        <span className="text-blue-800">{total}</span>
      </div>
    </div>
  );
}
