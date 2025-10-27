import React, { useState, FormEvent } from 'react';
import { supabase } from '../App';
import { Role } from '../types';

type FirstTimeSetupScreenProps = {
  onSetupComplete: () => void;
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

const FirstTimeSetupScreen: React.FC<FirstTimeSetupScreenProps> = ({ onSetupComplete }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('Owner');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetup = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }

        setLoading(true);

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    role: Role.Owner,
                    branch_id: 'branch-1',
                    has_changed_username: false,
                    email,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            setMessage('Owner account created successfully! Please check your email for a verification link. You will be redirected to the login screen shortly.');
            setTimeout(() => {
                onSetupComplete();
            }, 4000);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-black/30 backdrop-blur-md p-8 rounded-lg shadow-xl border-2 border-hiphop-800">
                <div className="text-center mb-8">
                     <h1 className="text-4xl font-marker text-hiphop-light">Welcome to VapeSmart PH</h1>
                     <p className="text-hiphop-gray mt-2">First-Time System Setup</p>
                </div>

                <form onSubmit={handleSetup} className="space-y-6">
                    <h2 className="text-2xl font-bold text-center text-hiphop-light">Create Initial Owner Account</h2>
                    <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="Your email address" />
                    <InputField label="Username" type="text" value={username} onChange={setUsername} placeholder="e.g., Owner" />
                    <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 6 characters" />
                    
                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    {message && <p className="text-green-400 text-sm font-bold">{message}</p>}
                    
                    <button type="submit" disabled={loading || !!message} className="w-full bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-3 px-4 rounded-sm uppercase tracking-wider shadow-md transition-transform transform hover:scale-105 disabled:bg-hiphop-700 disabled:cursor-not-allowed">
                        {loading ? 'Creating Account...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FirstTimeSetupScreen;
