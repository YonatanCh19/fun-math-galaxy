import React, { useState, useEffect, useRef } from 'react';
import MemoryCard from '@/components/MemoryCard';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const EMOJIS = ['🐧', '🐙', '🦋', '🐞', '🐠', '🦕', '🦒', '🦓'];

type Card = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

function shuffle(array: any[]) {
  return array.sort(() => Math.random() - 0.5);
}

function generateCards(): Card[] {
  const cards = EMOJIS.concat(EMOJIS);
  const shuffled = shuffle(cards);
  return shuffled.map((value, index) => ({
    id: index,
    value,
    isFlipped: false,
    isMatched: false,
  }));
}

export default function MemoryGame() {
  console.log("Rendering: MemoryGame");
  
  const [cards, setCards] = useState<Card[]>(generateCards());
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nav = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        setCards(prevCards =>
          prevCards.map(card =>
            card.value === firstCard.value ? { ...card, isMatched: true } : card
          )
        );
         setFlippedCards([]);
      } else {
        flipTimeoutRef.current = setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstId || card.id === secondId ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(m => m + 1);
    }

    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
        flipTimeoutRef.current = null;
      }
    };
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      gameOverTimeoutRef.current = setTimeout(() => setGameOver(true), 500);
    }

    return () => {
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
    };
  }, [cards]);

  useEffect(() => {
    if (gameOver) {
      redirectTimeoutRef.current = setTimeout(() => nav('/practice'), 3000);
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [gameOver, nav]);

  const handleCardClick = (id: number) => {
    const card = cards.find(c => c.id === id);
    if (flippedCards.length < 2 && card && !card.isFlipped) {
      setCards(prevCards =>
        prevCards.map(c =>
          c.id === id ? { ...c, isFlipped: true } : c
        )
      );
      setFlippedCards(current => [...current, id]);
    }
  };
  
  const restartGame = () => {
    setCards(generateCards());
    setFlippedCards([]);
    setMoves(0);
    setGameOver(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-4 sm:p-6 text-center">
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

      <h1 className="text-4xl sm:text-5xl font-extrabold text-blueKid mb-4">{t('memory_game')}</h1>
      
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6 [perspective:1000px]">
        {cards.map(card => (
          <MemoryCard key={card.id} card={card} onClick={handleCardClick} />
        ))}
      </div>

      <div className="text-xl sm:text-2xl text-pinkKid font-bold mb-4">{t('moves_count', { moves })}</div>
      
      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-10 animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-greenKid mb-4">{t('game_over_win_title')}</h2>
            <p className="text-lg sm:text-xl text-blue-900 mb-6">{t('game_over_win_desc', { moves })}</p>
            <p className="text-md sm:text-lg text-blue-800 animate-pulse">חוזר לתרגול בעוד 3 שניות...</p>
          </div>
        </div>
      )}
    </div>
  );
}