import { Trophy } from "lucide-react";

type AnimatedTrophyProps = {
  size?: number;
  className?: string;
};

export default function AnimatedTrophy({ size = 64, className = "" }: AnimatedTrophyProps) {
  console.log("Rendering: AnimatedTrophy");
  
  return (
    <div
      className={`inline-flex justify-center items-center drop-shadow-xl animate-trophy-bounce ${className}`}
      aria-label="מזל טוב! הרווחת גביע"
      role="img"
    >
      <Trophy size={size} color="#ffbe0b" strokeWidth={2.7} fill="#fff685" className="rounded-full bg-yellow-100 p-2" />
    </div>
  );
}
