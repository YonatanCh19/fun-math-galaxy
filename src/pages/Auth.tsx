
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslation } from '@/hooks/useTranslation';
import { Session } from '@supabase/supabase-js';

export default function Auth() {
  console.log("Rendering: Auth");
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          navigate('/profile-selection', { replace: true });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session && event === 'SIGNED_IN') {
          navigate('/profile-selection', { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t('login_success'));
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t('signup_success'));
      }
    } catch (error: any) {
      toast.error(error.message || (isLogin ? t('login_error') : t('signup_error')));
    } finally {
      setLoading(false);
    }
  }, [email, password, isLogin, t]);

  const handleGuestLogin = useCallback(async () => {
    setGuestLoading(true);
    
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      
      toast.success('נכנסת כאורח בהצלחה!');
      navigate('/practice', { replace: true });
    } catch (error: any) {
      console.error('Anonymous sign-in error:', error);
      toast.error('שגיאה בכניסה כאורח. נסה שוב.');
    } finally {
      setGuestLoading(false);
    }
  }, [navigate]);

  const handleForgotPassword = useCallback(async () => {
    if (!email) {
      toast.error(t('enter_email_for_reset'));
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success(t('reset_email_sent'));
    } catch (error: any) {
      toast.error(error.message || t('reset_error'));
    }
  }, [email, t]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kidGradient font-varela">
        <p className="text-xl text-pinkKid animate-pulse">טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kidGradient p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blueKid">
            {isLogin ? t('login_title') : t('signup_title')}
          </CardTitle>
          <CardDescription>
            {isLogin ? t('login_description') : t('signup_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder={t('email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
                dir="ltr"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <LoadingSpinner message={isLogin ? "מתחבר..." : "נרשם..."} size="sm" />
              ) : (
                isLogin ? t('login_button') : t('signup_button')
              )}
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            <Button
              onClick={() => setIsLogin(!isLogin)}
              variant="link"
              className="w-full text-blueKid"
            >
              {isLogin ? t('switch_to_signup') : t('switch_to_login')}
            </Button>
            
            {isLogin && (
              <Button
                onClick={handleForgotPassword}
                variant="link"
                className="w-full text-sm text-gray-600"
              >
                {t('forgot_password')}
              </Button>
            )}
            
            <Button
              onClick={handleGuestLogin}
              variant="outline"
              className="w-full bg-greenKid hover:bg-green-500 text-white border-greenKid"
              disabled={guestLoading}
            >
              {guestLoading ? (
                <LoadingSpinner message="מכין לך תרגיל מיוחד..." size="sm" />
              ) : (
                'שחק כאורח'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
