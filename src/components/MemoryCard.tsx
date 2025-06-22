import React from 'react';

type Props = {
  card: { id: number; value: string; isFlipped: boolean; isMatched: boolean };
  onClick: (id: number) => void;
};

export default function MemoryCard({ card, onClick }: Props) {
  console.log("Rendering: MemoryCard");
  
  return (
    <div
      className={`relative w-24 h-32 rounded-lg shadow-lg cursor-pointer transform transition-transform duration-500 [transform-style:preserve-3d] ${card.isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      onClick={() => !card.isFlipped && !card.isMatched && onClick(card.id)}
    >
      <div className="absolute w-full h-full bg-pinkKid rounded-lg flex items-center justify-center text-4xl font-bold text-white [backface-visibility:hidden]">
        ?
      </div>
      <div className="absolute w-full h-full bg-yellowKid rounded-lg flex items-center justify-center text-5xl font-bold text-blue-900 [transform:rotateY(180deg)] [backface-visibility:hidden]">
        {card.value}
      </div>
    </div>
  );
}
