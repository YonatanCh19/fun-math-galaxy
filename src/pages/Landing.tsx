import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Sparkles, Calculator, Wand2, Heart, Trophy } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleStartPlaying = () => {
    // Preload and play success sound at volume 0 to get browser permission
    const audio = new Audio('/success-sound.mp3');
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(error => {
      console.log('Audio preload failed:', error);
    });
    
    navigate('/auth');
  };

  const floatingElements = Array.from({ length: 15 }).map((_, i) => {
    const icons = [Star, Sparkles, Calculator, Wand2, Heart, Trophy];
    const Icon = icons[i % icons.length];
    return (
      <div
        key={i}
        className="absolute animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }}
      >
        <Icon 
          className="text-white/30" 
          size={16 + Math.random() * 20}
          fill="currentColor"
        />
      </div>
    );
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kidGradient font-varela p-4 relative overflow-hidden">
      {/* בס"ד in top right corner */}
      <div className="absolute top-4 right-4 text-white font-bold text-lg z-20">
        בס"ד
      </div>

      {/* Floating decorative elements */}
      {floatingElements}

      {/* Main content */}
      <div className="text-center z-10 space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-2xl mb-4 animate-scale-in">
            קסם המספרים
          </h1>
          <div className="flex justify-center space-x-4 mb-8">
            <Wand2 className="text-yellow-300 animate-bounce" size={48} fill="currentColor" />
            <Star className="text-pink-300 animate-bounce" size={40} fill="currentColor" style={{ animationDelay: '0.2s' }} />
            <Calculator className="text-blue-300 animate-bounce" size={44} fill="currentColor" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Subtitle */}
        <div className="bg-white/90 rounded-3xl p-6 mx-auto max-w-2xl shadow-2xl border-4 border-yellowKid">
          <p className="text-2xl md:text-3xl text-blueKid font-bold mb-4">
            ברוכים הבאים לעולם הקסם של המספרים! 🎭
          </p>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            🌟 פתרו תרגילים ואספו גביעים
          </p>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            🎮 שחקו במשחקים מהנים
          </p>
          <p className="text-lg md:text-xl text-gray-700">
            📚 למדו חשבון בצורה הכי כיפית שיש!
          </p>
        </div>

        {/* Start button */}
        <div className="relative">
          <Button 
            onClick={handleStartPlaying}
            className="bg-pinkKid hover:bg-pink-500 text-white text-2xl md:text-3xl font-bold px-12 py-6 rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-all duration-300 animate-pulse"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
          >
            🎯 מתחילים לשחק! 🎯
          </Button>
          
          {/* Sparkle effects around button */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="text-yellow-300 animate-spin" size={24} fill="currentColor" />
          </div>
          <div className="absolute -bottom-2 -left-2">
            <Star className="text-pink-300 animate-spin" size={20} fill="currentColor" style={{ animationDirection: 'reverse' }} />
          </div>
        </div>

        {/* Fun math facts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <div className="bg-greenKid/90 rounded-2xl p-4 text-center shadow-lg">
            <Trophy className="mx-auto mb-2 text-yellow-600" size={32} fill="currentColor" />
            <p className="text-white font-bold">אספו גביעים!</p>
          </div>
          <div className="bg-turquoiseKid/90 rounded-2xl p-4 text-center shadow-lg">
            <Calculator className="mx-auto mb-2 text-blue-600" size={32} />
            <p className="text-white font-bold">תרגילים מהנים!</p>
          </div>
          <div className="bg-yellowKid/90 rounded-2xl p-4 text-center shadow-lg">
            <Heart className="mx-auto mb-2 text-red-500" size={32} fill="currentColor" />
            <p className="text-blueKid font-bold">למידה באהבה!</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-white/80 text-sm font-medium">
        בס"ד - ©כל הזכויות שמורות ליונתן כלפון
      </div>
    </div>
  );
}
