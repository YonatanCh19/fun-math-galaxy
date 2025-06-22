
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { UserProgress } from '@/lib/progressUtils';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { AvatarSelector, AvatarCharacter, renderAvatarByType } from '@/components/AvatarSelector';
import { updateProfileAvatar } from '@/lib/avatarUtils';

type ProfileWithProgress = Profile & { progress?: UserProgress };

const AnimatedCount = ({ count }: { count: number }) => {
    const [displayCount, setDisplayCount] = useState(0);

    useEffect(() => {
        if (count === 0) {
            setDisplayCount(0);
            return;
        }
        
        let startTimestamp: number | null = null;
        const duration = 800; // ms

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentCount = Math.floor(progress * count);
            setDisplayCount(currentCount);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [count]);

    return <>{displayCount}</>;
}

const AnimatedProgress = ({ value, correctAnswers }: { value: number, correctAnswers: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // This is for the progress bar width animation
        const timer = setTimeout(() => setProgress(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="w-full text-center">
            <Progress value={progress} className="h-3 bg-pinkKid/30" indicatorClassName="bg-pinkKid" />
            <span className="text-xs font-bold text-pinkKid">
                <AnimatedCount count={correctAnswers} /> תשובות נכונות
            </span>
        </div>
    );
};

export default function ProfileSelection() {
  const { user, profiles, selectProfile, signOut, refetchProfiles, loading } = useAuth();
  const navigate = useNavigate();
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // State for PIN entry
  const [selectedForPin, setSelectedForPin] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // State for profile management
  const [profileToManage, setProfileToManage] = useState<Profile | null>(null);
  const [isAuthParentDialogOpen, setIsAuthParentDialogOpen] = useState(false);
  const [parentPassword, setParentPassword] = useState('');
  const [isManageProfileDialogOpen, setIsManageProfileDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Avatar selection states
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [profileForAvatarSelection, setProfileForAvatarSelection] = useState<Profile | null>(null);
  const [showNewProfileAvatarSelector, setShowNewProfileAvatarSelector] = useState(false);
  const [newProfileData, setNewProfileData] = useState<{name: string, pin: string} | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleAuthError = async (error: any) => {
    console.error('Auth error in ProfileSelection:', error);
    
    if (error?.code === '401' || 
        error?.code === '400' || 
        error?.code === '406' ||
        error?.message?.includes('refresh_token') ||
        error?.message?.includes('JWT expired') ||
        error?.message?.includes('Invalid JWT')) {
      
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
      }
      
      navigate('/auth', { replace: true });
      return;
    }
  };

  const { data: profilesWithProgress } = useQuery({
    queryKey: ['profilesWithProgress', profiles?.map(p => p.id).join(',')],
    queryFn: async (): Promise<ProfileWithProgress[]> => {
      if (!profiles || profiles.length === 0) {
        return [];
      }

      try {
        const profileIds = profiles.map(p => p.id);
        const { data: progresses, error } = await supabase
          .from('user_progress')
          .select('*')
          .in('profile_id', profileIds);

        if (error) {
          await handleAuthError(error);
          console.error('Error fetching progress:', error);
          toast.error("שגיאה בטעינת התקדמות הפרופילים.");
          return profiles.map(p => ({ ...p, progress: undefined }));
        }

        const progressMap = new Map<string, UserProgress>();
        if (progresses) {
          for (const p of progresses) {
            if (p.profile_id) {
              progressMap.set(p.profile_id, p);
            }
          }
        }

        return profiles.map(profile => ({
          ...profile,
          progress: progressMap.get(profile.id),
        }));
      } catch (error: any) {
        await handleAuthError(error);
        return profiles.map(p => ({ ...p, progress: undefined }));
      }
    },
    enabled: !loading && !!profiles && profiles.length > 0,
  });

  const handleProfileSelect = (profile: Profile) => {
    if (profile.pin) {
      setSelectedForPin(profile);
    } else {
      selectProfile(profile);
      navigate('/practice', { state: { showTip: true } });
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !user || !newProfilePin.match(/^\d{4}$/)) {
      toast.error('יש למלא שם וקוד סודי בן 4 ספרות.');
      return;
    }

    // Store the profile data and show avatar selector
    setNewProfileData({ name: newProfileName.trim(), pin: newProfilePin });
    setShowNewProfileAvatarSelector(true);
  };

  const handleNewProfileAvatarSelect = async (avatarCharacter: AvatarCharacter) => {
    if (!newProfileData || !user) return;
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({ 
          name: newProfileData.name, 
          user_id: user.id, 
          pin: newProfileData.pin,
          avatar_character: avatarCharacter
        });

      if (error) {
        await handleAuthError(error);
        toast.error('שגיאה ביצירת פרופיל חדש: ' + error.message);
      } else {
        toast.success(`'${newProfileData.name}' נוסף בהצלחה!`);
        setNewProfileName('');
        setNewProfilePin('');
        setNewProfileData(null);
        if (refetchProfiles) {
          refetchProfiles();
        }
      }
    } catch (error: any) {
      await handleAuthError(error);
      toast.error('שגיאה ביצירת פרופיל חדש');
    }
    setIsAdding(false);
    setShowNewProfileAvatarSelector(false);
  };
  
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === selectedForPin?.pin) {
      selectProfile(selectedForPin);
      setSelectedForPin(null);
      setPinInput('');
      navigate('/practice', { state: { showTip: true } });
    } else {
      setPinError('קוד שגוי, נסה/י שוב.');
      toast.error('קוד שגוי');
    }
  };

  const handleOpenManageFlow = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setProfileToManage(profile);
    setEditName(profile.name);
    setEditPin(profile.pin || '');
    setIsAuthParentDialogOpen(true);
  };

  const handleOpenAvatarSelector = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setProfileForAvatarSelection(profile);
    setIsAvatarSelectorOpen(true);
  };

  const handleAvatarSelect = async (avatarCharacter: AvatarCharacter) => {
    if (!profileForAvatarSelection) return;

    const result = await updateProfileAvatar(profileForAvatarSelection.id, avatarCharacter);
    if (result.success) {
      toast.success('הדמות עודכנה בהצלחה!');
      if (refetchProfiles) {
        refetchProfiles();
      }
    } else {
      toast.error('שגיאה בעדכון הדמות');
    }
    
    setIsAvatarSelectorOpen(false);
    setProfileForAvatarSelection(null);
  };

  const handleParentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentPassword.trim() || !user?.email) {
      toast.error("יש להזין סיסמה.");
      return;
    }
    setIsProcessing(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parentPassword,
      });
      
      if (error) {
        await handleAuthError(error);
        setIsProcessing(false);
        toast.error("סיסמה שגויה. נסה/י שוב.");
      } else {
        // Small delay to allow session to refresh if needed, and give user feedback
        setTimeout(() => {
          setIsProcessing(false);
          toast.success("אימות הושלם בהצלחה!");
          setIsAuthParentDialogOpen(false);
          setParentPassword('');
          setIsManageProfileDialogOpen(true);
        }, 500);
      }
    } catch (error: any) {
      await handleAuthError(error);
      setIsProcessing(false);
      toast.error("שגיאה באימות");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileToManage || !editName.trim() || !editPin.match(/^\d{4}$/)) {
      toast.error('יש למלא שם וקוד סודי בן 4 ספרות.');
      return;
    }
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName.trim(), pin: editPin })
        .eq('id', profileToManage.id);
      
      setIsProcessing(false);

      if (error) {
        await handleAuthError(error);
        toast.error('שגיאה בעדכון הפרופיל: ' + error.message);
      } else {
        toast.success(`'${editName.trim()}' עודכן בהצלחה!`);
        setIsManageProfileDialogOpen(false);
        setProfileToManage(null);
        if (refetchProfiles) refetchProfiles();
      }
    } catch (error: any) {
      await handleAuthError(error);
      setIsProcessing(false);
      toast.error('שגיאה בעדכון הפרופיל');
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToManage) return;
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileToManage.id);

      setIsProcessing(false);
      
      if (error) {
        await handleAuthError(error);
        toast.error('שגיאה במחיקת הפרופיל: ' + error.message);
      } else {
        toast.success(`הפרופיל '${profileToManage.name}' נמחק בהצלחה.`);
        setIsManageProfileDialogOpen(false);
        setProfileToManage(null);
        if (refetchProfiles) refetchProfiles();
      }
    } catch (error: any) {
      await handleAuthError(error);
      setIsProcessing(false);
      toast.error('שגיאה במחיקת הפרופיל');
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // Clean up local storage first
      localStorage.removeItem('selectedProfileId');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
        toast.error('שגיאה בהתנתקות: ' + error.message);
      } else {
        toast.success('התנתקת בהצלחה');
        // Force page reload for complete cleanup
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Unexpected sign out error:', error);
      toast.error('שגיאה בהתנתקות');
      // Force navigation even if there's an error
      window.location.href = '/';
    }
    setIsSigningOut(false);
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela text-xl text-pinkKid">
        טוען...
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-kidGradient font-varela p-4 sm:p-8 flex flex-col items-center justify-center" dir="rtl">
        <div className="w-full max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">בחירת פרופיל</h1>
          <p className="text-lg text-white/90 mb-8">מי משחק היום?</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {profilesWithProgress?.map((profile) => {
                const progress = profile.progress;
                const percentage = progress && progress.total > 0 ? (progress.correct / progress.total) * 100 : 0;
                const correctAnswers = progress?.correct || 0;
                
                return (
                <Card
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className="bg-white/80 cursor-pointer hover:bg-white hover:scale-105 transition-transform duration-200 aspect-square relative"
                >
                  <CardContent className="flex flex-col items-center justify-between p-4 h-full">
                    {/* Action buttons positioned at corners */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                      {/* Edit button on the left */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 sm:h-10 sm:w-10 bg-white/90 text-blueKid hover:bg-white hover:text-blueKid shadow-sm border border-gray-200 min-h-[44px] min-w-[44px]" 
                        onClick={(e) => handleOpenManageFlow(e, profile)}
                        title="ערוך פרופיל"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Avatar change button on the right */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 sm:h-10 sm:w-10 bg-white/90 text-greenKid hover:bg-white hover:text-greenKid shadow-sm border border-gray-200 min-h-[44px] min-w-[44px]" 
                        onClick={(e) => handleOpenAvatarSelector(e, profile)}
                        title="שנה דמות"
                      >
                        <span className="text-lg">🎨</span>
                      </Button>
                    </div>
                    
                    <div className='flex flex-col items-center pt-4'>
                        <div className="mb-3 transform hover:scale-110 transition-transform duration-200">
                          {renderAvatarByType(profile.avatar_character as AvatarCharacter, 'md')}
                        </div>
                        <p className="font-bold text-lg text-blueKid text-center">{profile.name}</p>
                    </div>
                    <div className="w-full px-2">
                      {progress && progress.total > 0 ? (
                        <AnimatedProgress value={percentage} correctAnswers={correctAnswers} />
                      ) : (
                        <div className="h-[28px] flex items-center justify-center">
                           <span className="text-xs font-bold text-pinkKid">0 תשובות נכונות</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            )}

            <Card
              className="bg-white/60 border-2 border-dashed border-gray-400 aspect-square"
            >
              <CardContent className="flex flex-col items-center justify-center p-2 sm:p-4 h-full">
                <form onSubmit={handleAddProfile} className="flex flex-col items-center gap-2 w-full">
                  <p className="font-bold text-sm sm:text-md text-blueKid mb-2 text-center">הוספת שחקן חדש</p>
                  <Input
                    type="text"
                    placeholder="שם הילד/ה"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="text-center text-sm"
                    required
                  />
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    placeholder="קוד סודי (4 ספרות)"
                    value={newProfilePin}
                    onChange={(e) => setNewProfilePin(e.target.value)}
                    className="text-center text-sm"
                    required
                  />
                  <Button type="submit" size="sm" disabled={isAdding || !newProfileName.trim() || !newProfilePin.match(/^\d{4}$/)} className="w-full text-xs">
                    <PlusCircle className="ml-1 h-3 w-3" />
                    {isAdding ? "מוסיף..." : "הוספה"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Button 
            variant="ghost" 
            onClick={handleSignOut} 
            disabled={isSigningOut}
            className="text-white/80 hover:text-white min-h-[44px] px-6 py-3"
          >
            {isSigningOut ? "מתנתק..." : "התנתקות מחשבון ההורה"}
          </Button>
        </div>

        {/* Avatar Selector for existing profiles */}
        <AvatarSelector
          isOpen={isAvatarSelectorOpen}
          onClose={() => {
            setIsAvatarSelectorOpen(false);
            setProfileForAvatarSelection(null);
          }}
          onSelect={handleAvatarSelect}
          currentAvatar={profileForAvatarSelection?.avatar_character as AvatarCharacter}
        />

        {/* Avatar Selector for new profiles */}
        <AvatarSelector
          isOpen={showNewProfileAvatarSelector}
          onClose={() => {
            setShowNewProfileAvatarSelector(false);
            setNewProfileData(null);
          }}
          onSelect={handleNewProfileAvatarSelect}
          currentAvatar={null}
        />

        {/* ... keep existing code (all dialog components) the same */}
        
        {/* PIN Entry Dialog */}
        <Dialog open={selectedForPin !== null} onOpenChange={() => {setSelectedForPin(null); setPinInput(''); setPinError('');}}>
          <DialogContent dir="rtl" className="bg-orangeKid border-4 border-pinkKid rounded-xl text-blue-900">
            <DialogHeader>
              <DialogTitle className="text-pinkKid">שלום {selectedForPin?.name}, יש להקיש קוד סודי</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePinSubmit}>
              <div className="py-4">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {setPinInput(e.target.value); setPinError('');}}
                  className="text-center text-2xl tracking-[.5em]"
                  autoFocus
                />
                {pinError && <p className="text-red-500 text-sm text-center mt-2">{pinError}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!pinInput.match(/^\d{4}$/)}>כניסה</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Parent Auth Dialog */}
        <Dialog open={isAuthParentDialogOpen} onOpenChange={(open) => { if (!open) { setIsAuthParentDialogOpen(false); setParentPassword(''); }}}>
          <DialogContent dir="rtl" className="bg-orangeKid border-4 border-pinkKid rounded-xl text-blue-900">
            <DialogHeader>
              <DialogTitle className="text-pinkKid">אימות הורה</DialogTitle>
              <DialogDescription className="text-blue-900/80">
                כדי לנהל את הפרופיל של {profileToManage?.name}, יש להזין את סיסמת חשבון ההורה.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleParentAuthSubmit}>
              <div className="py-4">
                <Input
                  type="password"
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  className="text-center"
                  placeholder="סיסמת חשבון הורה"
                  autoFocus
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAuthParentDialogOpen(false)}>ביטול</Button>
                <Button type="submit" disabled={isProcessing || !parentPassword}>
                  {isProcessing ? "מאמת..." : "אישור"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Manage Profile Dialog */}
        <Dialog open={isManageProfileDialogOpen} onOpenChange={setIsManageProfileDialogOpen}>
          <DialogContent dir="rtl" className="bg-orangeKid border-4 border-pinkKid rounded-xl text-blue-900">
            <DialogHeader>
              <DialogTitle className="text-pinkKid">ניהול פרופיל של {profileToManage?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile}>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-right block mb-2">שם</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="edit-pin" className="text-right block mb-2">קוד סודי (4 ספרות)</Label>
                  <Input id="edit-pin" type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} value={editPin} onChange={(e) => setEditPin(e.target.value)} required />
                </div>
              </div>
              <DialogFooter className="sm:justify-between items-center mt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isProcessing}>
                      <Trash2 className="ml-2 h-4 w-4" />
                      מחק פרופיל
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl" className="bg-orangeKid border-4 border-pinkKid rounded-xl text-blue-900">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-pinkKid">האם למחוק את {profileToManage?.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-blue-900/80">
                        פעולה זו תמחק את הפרופיל ואת כל ההתקדמות שצבר. לא ניתן לשחזר את הפעולה.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteProfile} disabled={isProcessing}>
                        {isProcessing ? "מוחק..." : "כן, למחוק"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsManageProfileDialogOpen(false)}>ביטול</Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? "מעדכן..." : "עדכון פרופיל"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
