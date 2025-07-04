import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Coins, Gift, Trophy, Gamepad2, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { getUserProgress, useFreeGame, useCoinsForGame, UserProgress } from '@/lib/progressUtils';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';

interface MyCoinsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyCoins({ isOpen, onClose }: MyCoinsProps) {
  console.log("Rendering: MyCoins");
  
  const { t } = useTranslation();
  const { selectedProfile } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCoins, setUsingCoins] = useState(false);
  const [usingFreeGame, setUsingFreeGame] = useState(false);

  useEffect(() => {
    if (isOpen && selectedProfile) {
      loadProgress();
    }
  }, [isOpen, selectedProfile]);

  const loadProgress = async () => {
    if (!selectedProfile) return;
    
    setLoading(true);
    try {
      const userProgress = await getUserProgress(selectedProfile.id);
      setProgress(userProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleUseFreeGame = async () => {
    if (!selectedProfile || !progress) return;

    setUsingFreeGame(true);
    try {
      const success = await useFreeGame(selectedProfile.id);
      if (success) {
        toast.success('השתמשת במשחק חינם! בהצלחה!', {
          description: 'מעביר אותך לדף המשחקים...',
          duration: 3000,
        });
        
        // Close the dialog first
        onClose();
        
        // Navigate to games page after a short delay
        setTimeout(() => {
          navigate('/games');
        }, 500);
        
        // Refresh the data
        await loadProgress();
      } else {
        toast.error('אין לך משחקים חינם זמינים');
      }
    } catch (error) {
      console.error('Error using free game:', error);
      toast.error('שגיאה בשימוש במשחק חינם');
    } finally {
      setUsingFreeGame(false);
    }
  };

  const handleUseCoins = async () => {
    if (!selectedProfile || !progress || progress.coins < 3) return;

    setUsingCoins(true);
    try {
      const success = await useCoinsForGame(selectedProfile.id);
      if (success) {
        toast.success('השתמשת ב-3 מטבעות! בהצלחה במשחק!', {
          description: 'מעביר אותך לדף המשחקים...',
          duration: 3000,
        });
        
        // Close the dialog first
        onClose();
        
        // Navigate to games page after a short delay
        setTimeout(() => {
          navigate('/games');
        }, 500);
        
        // Refresh the data
        await loadProgress();
      } else {
        toast.error('אין לך מספיק מטבעות');
      }
    } catch (error) {
      console.error('Error using coins:', error);
      toast.error('שגיאה בשימוש במטבעות');
    } finally {
      setUsingCoins(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          dir="rtl" 
          className="bg-kidGradient border-4 border-pinkKid rounded-2xl w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">טוען נתונים</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner message="טוען נתונים..." size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        dir="rtl" 
        className="bg-kidGradient border-4 border-pinkKid rounded-2xl w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl sm:text-2xl text-center text-blue-900 flex items-center justify-center gap-2">
            <Coins className="text-yellow-500" size={28} />
            {t('my_coins_title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            מידע על המטבעות והמשחקים החינם שלך
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-2 text-center text-blue-900 space-y-4 sm:space-y-6">
          {/* Coins Display */}
          <div className="bg-white/80 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-yellow-400">
            <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
              <Coins className="text-yellow-500" size={40} />
              <span className="text-3xl sm:text-4xl font-bold text-yellow-600">{progress?.coins || 0}</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-blue-800 mb-3 sm:mb-4">
              {t('my_coins_description', { count: progress?.coins || 0 })}
            </p>
            
            {/* Use Coins Button */}
            {progress && progress.coins >= 3 ? (
              <Button
                onClick={handleUseCoins}
                disabled={usingCoins}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg w-full mb-2 text-sm sm:text-base min-h-[44px]"
              >
                {usingCoins ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Gamepad2 className="ml-2" size={18} />
                    {t('play_for_free_button', { coins: progress.coins })}
                  </>
                )}
              </Button>
            ) : (
              <div className="bg-gray-100 rounded-lg p-3 text-gray-600 text-xs sm:text-sm">
                צריך 3 מטבעות למשחק חינם
              </div>
            )}
          </div>

          {/* Free Games Display */}
          <div className="bg-white/80 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-green-400">
            <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
              <Gift className="text-green-500" size={40} />
              <span className="text-3xl sm:text-4xl font-bold text-green-600">{progress?.free_games || 0}</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-blue-800 mb-3 sm:mb-4">
              משחקים חינם זמינים
            </p>
            
            {progress && progress.free_games > 0 ? (
              <Button
                onClick={handleUseFreeGame}
                disabled={usingFreeGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg w-full text-sm sm:text-base min-h-[44px]"
              >
                {usingFreeGame ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Gamepad2 className="ml-2" size={18} />
                    השתמש במשחק חינם
                  </>
                )}
              </Button>
            ) : (
              <p className="text-gray-600 text-xs sm:text-sm">
                זכה בתחרויות אונליין כדי לקבל משחקים חינם!
              </p>
            )}
          </div>

          {/* Rules */}
          <div className="bg-white/60 rounded-xl p-3 sm:p-4 text-right space-y-2 sm:space-y-3">
            <h3 className="font-bold text-base sm:text-lg text-blue-900 flex items-center gap-2 justify-center">
              <Star className="text-yellow-500" size={18} />
              איך מרוויחים?
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <p className="flex items-center gap-2 justify-start">
                <Coins className="text-yellow-500 flex-shrink-0" size={14} />
                <span>{t('my_coins_rules_1')}</span>
              </p>
              <p className="flex items-center gap-2 justify-start">
                <Trophy className="text-yellow-600 flex-shrink-0" size={14} />
                <span>זכייה בתחרות אונליין = משחק חינם!</span>
              </p>
              <p className="flex items-center gap-2 justify-start">
                <Gift className="text-green-500 flex-shrink-0" size={14} />
                <span>{t('my_coins_rules_2')}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-3 sm:pt-4">
          <Button 
            onClick={onClose}
            className="bg-pinkKid text-white hover:bg-pink-500 hover:text-white w-full font-bold text-base sm:text-lg py-2 sm:py-3 rounded-lg min-h-[44px]"
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}