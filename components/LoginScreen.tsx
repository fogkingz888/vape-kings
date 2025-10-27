import React, { useState, FormEvent, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Role } from '../types';

type LoginScreenProps = {
  supabase: SupabaseClient<Database>;
  businessName: string;
};

const InputField: React.FC<{ label: string, type: string, value: string, onChange: (val: string) => void, placeholder?: string, required?: boolean }> = 
  ({ label, type, value, onChange, placeholder, required = true }) => (
    <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-hiphop-gray mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
        />
    </div>
  );

const LoginScreen: React.FC<LoginScreenProps> = ({ supabase, businessName }) => {
    const [view, setView] = useState<'login' | 'forgot' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    useEffect(() => {
        const checkSignupAvailability = async () => {
            const { data: setting } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'allow_owner_signup')
                .single();
            
            setShowSignup(setting?.value === 'true');
        };

        checkSignupAvailability();
    }, [supabase]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', username)
          .single();

        if (profileError || !profile) {
            setError('Invalid username or password.');
            setLoading(false);
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: password,
        });

        if (signInError) {
             if (signInError.message.includes("Email not confirmed")) {
                setError("Account not verified. Please check your email for the confirmation link.");
            } else {
                setError('Invalid username or password.');
            }
        }
        setLoading(false);
    };
    
    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    role: Role.Owner,
                    branch_id: 'branch-1', // Default branch
                    has_changed_username: false,
                    email,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            setMessage('Account created! Please check your email for a verification link to activate your account.');
            setView('login');
        }
        setLoading(false);
    };

    const handlePasswordReset = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', username)
            .single();

        if (profileError || !profile) {
            setError('User not found.');
            setLoading(false);
            return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: window.location.origin,
        });

        if (resetError) {
            setError(resetError.message);
        } else {
            setMessage('Password reset link sent to the email associated with this account.');
            setView('login');
        }
        setLoading(false);
    };
    
    const clearMessages = () => {
        setError('');
        setMessage('');
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-black/30 backdrop-blur-md p-8 rounded-lg shadow-xl border-2 border-hiphop-800">
                <div className="text-center mb-8">
                     <h1 className="text-5xl font-marker text-hiphop-light">{businessName}</h1>
                </div>

                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="e.g., Owner" />
                        <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="e.g., 1234" />
                        
                        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                        {message && <p className="text-green-400 text-sm font-bold">{message}</p>}
                        
                        <button type="submit" disabled={loading} className="w-full bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-3 px-4 rounded-sm uppercase tracking-wider shadow-md transition-transform transform hover:scale-105 disabled:bg-hiphop-700 disabled:cursor-not-allowed">
                            {loading ? 'Logging In...' : 'Log In'}
                        </button>
                        <div className="text-center flex justify-around items-center">
                            <button type="button" onClick={() => { setView('forgot'); clearMessages(); }} className="text-sm text-hiphop-gray hover:text-hiphop-cyan">
                                Forgot Password?
                            </button>
                             {showSignup && (
                                <button type="button" onClick={() => { setView('signup'); clearMessages(); }} className="text-sm text-hiphop-gray hover:text-hiphop-cyan">
                                    Create Owner Account
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {view === 'signup' && (
                    <form onSubmit={handleSignup} className="space-y-6">
                         <h2 className="text-2xl font-bold text-center text-hiphop-light">Create Owner Account</h2>
                        <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="Your email address" />
                        <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="e.g., Owner" />
                        <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 6 characters" />
                        
                        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                        
                        <div className="flex items-center justify-between">
                            <button type="button" onClick={() => { setView('login'); clearMessages(); }} className="text-sm text-hiphop-gray hover:text-hiphop-cyan">
                                Back to Login
                            </button>
                            <button type="submit" disabled={loading} className="bg-hiphop-magenta hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-sm uppercase">
                               {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                )}

                {view === 'forgot' && (
                    <form onSubmit={handlePasswordReset} className="space-y-6">
                        <h2 className="text-2xl font-bold text-center text-hiphop-light">Reset Password</h2>
                        <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="Enter your username" />
                        
                        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                        
                        <div className="flex items-center justify-between">
                            <button type="button" onClick={() => { setView('login'); clearMessages(); }} className="text-sm text-hiphop-gray hover:text-hiphop-cyan">
                                Back to Login
                            </button>
                            <button type="submit" disabled={loading} className="bg-hiphop-magenta hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-sm uppercase">
                               {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;