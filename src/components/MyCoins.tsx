
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Coins, Gamepad, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { getUserProgress, updateUserProgress, useFreeGame, UserProgress } from '@/lib/progressUtils';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import TrophyDisplay from './TrophyDisplay';

export default function MyCoins({ 
  isOpen, 
  onClose, 
  user
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
}) {
    console.log("Rendering: MyCoins");
    
    const nav = useNavigate();
    const { selectedProfile } = useAuth();
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const { t } = useTranslation();
    
    useEffect(() => {
        if (isOpen && selectedProfile) {
            getUserProgress(selectedProfile.id).then(setProgress);
        } else {
            setProgress(null);
        }
    }, [isOpen, selectedProfile]);
    
    if (!user || !progress || !selectedProfile) return null;

    const coins = progress.coins;
    const trophies = progress.trophies || 0;
    const freeGames = progress.free_games || 0;

    const handlePlayGame = async () => {
        if (coins >= 3 && selectedProfile && progress) {
            const newCoins = coins - 3;
            const newTrophies = trophies + 1;
            const newProgress = { ...progress, coins: newCoins, trophies: newTrophies };
            
            await updateUserProgress(selectedProfile.id, { coins: newCoins, trophies: newTrophies });
            setProgress(newProgress);
            
            toast.success(t('use_coins_and_trophy_success_toast'));
            onClose();
            nav('/games');
        }
    };

    const handleUseFreeGame = async () => {
        if (freeGames > 0 && selectedProfile) {
            const success = await useFreeGame(selectedProfile.id);
            if (success) {
                // Update local state
                setProgress(prev => prev ? { ...prev, free_games: prev.free_games - 1 } : null);
                
                toast.success("נהנה מהמשחק החינם!", {
                    description: "המשחק החינם שלך מופעל עכשיו!",
                    icon: '🎮',
                });
                onClose();
                nav('/games');
            } else {
                toast.error("שגיאה בשימוש במשחק חינם");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent dir={t('bsd') === 'בס"ד' ? 'rtl' : 'ltr'} className="bg-orangeKid/95 border-4 border-blueKid rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl text-blue-900">
                        <Coins className="text-yellow-500" />
                        {t('my_coins_title')}
                    </DialogTitle>
                    <DialogDescription className="text-blue-800 font-semibold">
                        {t('my_coins_description', { count: coins })}
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 text-center text-blue-900 space-y-4">
                    <div className="bg-white/50 rounded-lg p-4">
                        <p className="font-bold text-lg mb-2">מטבעות נוכחיים: {coins} 🪙</p>
                        <p className="text-sm">כל 12 תשובות נכונות רצופות = מטבע אחד</p>
                    </div>
                    
                    {freeGames > 0 && (
                        <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                            <p className="font-bold text-green-800 mb-2 flex items-center gap-2 justify-center">
                                <Gift className="text-green-600" />
                                משחקים חינמיים זמינים: {freeGames} 🎮
                            </p>
                            <p className="text-sm text-green-700">קיבלת משחקים חינמיים מניצחונות באתגרים אונליין!</p>
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <h3 className="font-bold text-lg">{t('your_trophies')}</h3>
                        <TrophyDisplay trophies={trophies} />
                    </div>
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">
                     <Button variant="outline" onClick={onClose}>{t('close')}</Button>
                     
                     {freeGames > 0 && (
                         <Button 
                             onClick={handleUseFreeGame} 
                             className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                         >
                             <Gamepad className="h-4 w-4" />
                             השתמש במשחק חינם ({freeGames})
                         </Button>
                     )}
                     
                     <Button 
                         onClick={handlePlayGame} 
                         disabled={coins < 3} 
                         className="bg-greenKid text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                     >
                        {t('play_for_free_and_trophy_button', { coins })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
