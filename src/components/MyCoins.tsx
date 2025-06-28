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
import { getUserProgress, useFreeGame, UserProgress } from '@/lib/progressUtils';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';

interface MyCoinsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyCoins({ isOpen, onClose }: MyCoinsProps) {
  console.log("Rendering: MyCoins");
  
  const { t } = useTranslation();
  const { selectedProfile } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCoins, setUsingCoins] = useState(false);

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

    setUsingCoins(true);
    try {
      const success = await useFreeGame(selectedProfile.id);
      if (success) {
        toast.success('השתמשת במשחק חינם! בהצלחה!');
        await loadProgress(); // Refresh the data
        onClose();
      } else {
        toast.error('אין לך משחקים חינם זמינים');
      }
    } catch (error) {
      console.error('Error using free game:', error);
      toast.error('שגיאה בשימוש במשחק חינם');
    } finally {
      setUsingCoins(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent dir="rtl" className="bg-kidGradient border-4 border-pinkKid rounded-2xl max-w-md">
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
      <DialogContent dir="rtl" className="bg-kidGradient border-4 border-pinkKid rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-blue-900 flex items-center justify-center gap-2">
            <Coins className="text-yellow-500" size={32} />
            {t('my_coins_title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="pt-4 text-center text-blue-900 space-y-6">
          {/* Coins Display */}
          <div className="bg-white/80 rounded-xl p-6 shadow-lg border-2 border-yellow-400">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coins className="text-yellow-500" size={48} />
              <span className="text-4xl font-bold text-yellow-600">{progress?.coins || 0}</span>
            </div>
            <p className="text-lg font-semibold text-blue-800">
              {t('my_coins_description', { count: progress?.coins || 0 })}
            </p>
          </div>

          {/* Free Games Display */}
          <div className="bg-white/80 rounded-xl p-6 shadow-lg border-2 border-green-400">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gift className="text-green-500" size={48} />
              <span className="text-4xl font-bold text-green-600">{progress?.free_games || 0}</span>
            </div>
            <p className="text-lg font-semibold text-blue-800 mb-4">
              משחקים חינם זמינים
            </p>
            
            {progress && progress.free_games > 0 ? (
              <Button
                onClick={handleUseFreeGame}
                disabled={usingCoins}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg w-full"
              >
                {usingCoins ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Gamepad2 className="ml-2" size={20} />
                    השתמש במשחק חינם
                  </>
                )}
              </Button>
            ) : (
              <p className="text-gray-600 text-sm">
                זכה בתחרויות אונליין כדי לקבל משחקים חינם!
              </p>
            )}
          </div>

          {/* Rules */}
          <div className="bg-white/60 rounded-xl p-4 text-right space-y-3">
            <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              איך מרוויחים?
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Coins className="text-yellow-500" size={16} />
                <span>{t('my_coins_rules_1')}</span>
              </p>
              <p className="flex items-center gap-2">
                <Trophy className="text-yellow-600" size={16} />
                <span>זכייה בתחרות אונליין = משחק חינם!</span>
              </p>
              <p className="flex items-center gap-2">
                <Gift className="text-green-500" size={16} />
                <span>{t('my_coins_rules_2')}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <Button 
            onClick={onClose}
            className="bg-pinkKid text-white hover:bg-pink-500 hover:text-white w-full font-bold text-lg py-3 rounded-lg"
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}