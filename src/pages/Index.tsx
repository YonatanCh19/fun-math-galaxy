
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/profile-selection', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [session, loading, navigate]);

  return null;
}
