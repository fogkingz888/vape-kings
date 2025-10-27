import React, { useState, useCallback, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import { Database, User } from './types';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import FirstTimeSetupScreen from './components/FirstTimeSetupScreen';

// --- Supabase Credentials ---
const SUPABASE_URL = 'https://jgsfhobymbsmteasgtkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc2Zob2J5bWJzbXRlYXNndGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjM0OTcsImV4cCI6MjA3NzEzOTQ5N30.pWre-lg1UD5q7YKruT9ci-pYhsJcmQrjrXI1CJtoEdM';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('VapeSmart PH');
  const [needsSetup, setNeedsSetup] = useState(false);

  const getProfile = useCallback(async (session: Session | null) => {
    if (!session) {
      setCurrentUser(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.username,
          email: data.email,
          role: data.role,
          branch_id: data.branch_id,
          has_changed_username: data.has_changed_username,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const performInitialCheck = async () => {
      setLoading(true);
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (count === 0) {
        setNeedsSetup(true);
        setLoading(false);
      } else {
        setNeedsSetup(false);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        await getProfile(session);
        setLoading(false);
      }
    };

    performInitialCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      await getProfile(session);
    });

    return () => subscription.unsubscribe();
  }, [getProfile]);


  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const handleBusinessNameChange = useCallback((newName: string) => {
    setBusinessName(newName);
  }, []);

  const handleSetupComplete = useCallback(async () => {
    setNeedsSetup(false);
  }, []);
  
  if (loading) {
     return <div className="flex items-center justify-center min-h-screen text-2xl font-bold">Loading...</div>;
  }

  if (needsSetup) {
    return <FirstTimeSetupScreen onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-hiphop-900 font-sans">
      {session && currentUser ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          businessName={businessName}
          onBusinessNameChange={handleBusinessNameChange}
        />
      ) : (
        <LoginScreen 
          supabase={supabase}
          businessName={businessName}
        />
      )}
    </div>
  );
};

export default App;