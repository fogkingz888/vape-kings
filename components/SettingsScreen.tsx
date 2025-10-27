import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabase } from '../App';
import { PrinterIcon } from './icons';

type SettingsScreenProps = {
  user: User;
  onUsernameChange: (newUsername: string) => Promise<{ success: boolean; message: string }>;
  businessName: string;
  onBusinessNameChange: (newName: string) => void;
  addAuditLog: (action: string, details: string) => Promise<void>;
  isPrinterEnabled: boolean;
  onTogglePrinter: () => void;
  onLogout: () => void;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onUsernameChange, businessName, onBusinessNameChange, addAuditLog, isPrinterEnabled, onTogglePrinter, onLogout }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffMessage, setStaffMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newBusinessName, setNewBusinessName] = useState(businessName);
  const [businessNameMessage, setBusinessNameMessage] = useState('');
  
  const [allowOwnerSignup, setAllowOwnerSignup] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const isOwner = user.role === Role.Owner;

  useEffect(() => {
    if (isOwner) {
      const fetchSettings = async () => {
        setIsLoadingSettings(true);
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'allow_owner_signup')
          .single();
        setAllowOwnerSignup(data?.value === 'true');
        setIsLoadingSettings(false);
      };
      fetchSettings();
    }
  }, [isOwner]);

  const handleToggleSignup = async () => {
    const newValue = !allowOwnerSignup;
    setAllowOwnerSignup(newValue);
    const { error } = await supabase.from('app_settings').upsert({ key: 'allow_owner_signup', value: String(newValue) }, { onConflict: 'key' });
    if (error) {
        console.error("Error updating setting:", error);
        setAllowOwnerSignup(!newValue); // Revert on error
    } else {
        addAuditLog('Setting Change', `Owner account creation from login page ${newValue ? 'enabled' : 'disabled'}.`);
    }
  };


  const handleBusinessNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBusinessName.trim()) {
      onBusinessNameChange(newBusinessName.trim());
      setBusinessNameMessage('Business name updated successfully!');
      setTimeout(() => setBusinessNameMessage(''), 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };
  
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMessage(null);

    if (!newUsername.trim()) {
        setUsernameMessage({ type: 'error', text: 'New username is required.' });
        return;
    }
    if (newUsername.trim().toLowerCase() === user.name.toLowerCase()) {
        setUsernameMessage({ type: 'error', text: 'New username must be different from the current one.' });
        return;
    }
    
    setIsUpdatingUsername(true);
    const result = await onUsernameChange(newUsername.trim());

    if (result.success) {
        setUsernameMessage({ type: 'success', text: 'Username updated successfully! For security, you are being logged out. Please log in again with your new username.' });
        setTimeout(() => {
            onLogout();
        }, 3000);
    } else {
        setUsernameMessage({ type: 'error', text: result.message });
        setIsUpdatingUsername(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMessage(null);

    if (!staffUsername || !staffPassword) {
      setStaffMessage({ type: 'error', text: 'Username and password are required.' });
      return;
    }
     if (staffPassword.length < 6) {
      setStaffMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    const dummyEmail = `new.staff-${Date.now()}@vapesmart.local`;

    const { data, error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: staffPassword,
        options: {
            data: {
                username: staffUsername,
                role: Role.Staff,
                branch_id: user.branch_id,
                has_changed_username: false,
                email: dummyEmail
            }
        }
    });

    if (error) {
        setStaffMessage({ type: 'error', text: error.message });
    } else if (data.user) {
        await addAuditLog('Add Staff', `Added new staff member: ${staffUsername}.`);
        setStaffMessage({ type: 'success', text: `Staff user '${staffUsername}' created successfully!` });
        setStaffUsername('');
        setStaffPassword('');
    } else {
        setStaffMessage({ type: 'error', text: 'Failed to create staff user. An unknown error occurred.' });
    }
  };
  
  const FormField: React.FC<{ label: string; type?:string; value: string; onChange: (val: string) => void }> = ({ label, type = "text", value, onChange }) => (
    <div>
        <label className="block text-sm font-bold uppercase tracking-wider text-hiphop-gray mb-1">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
        />
    </div>
  );

  return (
    <div>
      <h2 className="text-4xl font-marker text-hiphop-light mb-6">Settings</h2>
      
      {isOwner && (
        <div className="bg-hiphop-950 p-8 rounded-sm shadow-xl max-w-lg mx-auto border-2 border-hiphop-800 mb-8">
            <h3 className="text-2xl font-marker mb-4 text-white">Business Settings</h3>
            <form onSubmit={handleBusinessNameSubmit} className="space-y-4">
                <FormField label="Business Name" value={newBusinessName} onChange={setNewBusinessName} />
                {businessNameMessage && <p className="text-sm font-bold text-green-400">{businessNameMessage}</p>}
                <div className="pt-2">
                    <button
                    type="submit"
                    className="w-full bg-hiphop-gold hover:bg-opacity-80 text-hiphop-950 font-bold py-3 px-4 rounded-sm uppercase tracking-wider transition-colors"
                    >
                    Save Business Name
                    </button>
                </div>
            </form>
        </div>
      )}
      
      {isOwner && (
        <>
            <div className="bg-hiphop-950 p-8 rounded-sm shadow-xl max-w-lg mx-auto border-2 border-hiphop-800 mb-8">
                <h3 className="text-2xl font-marker mb-4 text-white">Login Screen Settings</h3>
                <div className="flex items-center justify-between bg-hiphop-800 p-4 rounded-sm">
                    <label htmlFor="ownerSignupToggle" className="text-lg font-bold text-hiphop-light cursor-pointer">Allow New Owner Account Creation</label>
                    <button
                        id="ownerSignupToggle"
                        role="switch"
                        aria-checked={allowOwnerSignup}
                        onClick={handleToggleSignup}
                        disabled={isLoadingSettings}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-hiphop-800 focus:ring-hiphop-cyan ${allowOwnerSignup ? 'bg-hiphop-cyan' : 'bg-hiphop-700'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${allowOwnerSignup ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="bg-hiphop-950 p-8 rounded-sm shadow-xl max-w-lg mx-auto border-2 border-hiphop-800 mb-8">
                <h3 className="text-2xl font-marker mb-4 text-white flex items-center space-x-3"><PrinterIcon /> <span>Printer Settings</span></h3>
                <div className="flex items-center justify-between bg-hiphop-800 p-4 rounded-sm">
                    <label htmlFor="printerToggle" className="text-lg font-bold text-hiphop-light cursor-pointer">Enable Receipt Printing</label>
                    <button
                        id="printerToggle"
                        role="switch"
                        aria-checked={isPrinterEnabled}
                        onClick={onTogglePrinter}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-hiphop-800 focus:ring-hiphop-cyan ${isPrinterEnabled ? 'bg-hiphop-cyan' : 'bg-hiphop-700'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isPrinterEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </>
      )}

      <div className="bg-hiphop-950 p-8 rounded-sm shadow-xl max-w-lg mx-auto border-2 border-hiphop-800 mb-8">
        <h3 className="text-2xl font-marker mb-4 text-white">Change Username</h3>
         {user.role === Role.Staff && user.has_changed_username ? (
            <p className="text-hiphop-gray p-4 bg-hiphop-800 rounded-sm">You have already changed your username. This can only be done once.</p>
        ) : (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <FormField label="New Username" value={newUsername} onChange={setNewUsername} />
                
                {usernameMessage && (
                    <p className={`text-sm font-bold ${usernameMessage.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>
                    {usernameMessage.text}
                    </p>
                )}

                <div className="pt-4">
                    <button
                    type="submit"
                    disabled={isUpdatingUsername}
                    className="w-full bg-hiphop-magenta hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-sm uppercase tracking-wider transition-colors disabled:bg-hiphop-700 disabled:cursor-not-allowed"
                    >
                    {isUpdatingUsername ? 'Updating...' : 'Update Username'}
                    </button>
                </div>
            </form>
        )}
      </div>

      <div className="bg-hiphop-950 p-8 rounded-sm shadow-xl max-w-lg mx-auto border-2 border-hiphop-800 mb-8">
        <h3 className="text-2xl font-marker mb-4 text-white">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <FormField label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
          <FormField label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
          
          {message && (
            <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-hiphop-magenta hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-sm uppercase tracking-wider transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {isOwner && (
        <div className="bg-hiphop-950 p-8 rounded-sm shadow-xl max-w-lg mx-auto border-2 border-hiphop-800">
            <h3 className="text-2xl font-marker mb-4 text-white">User Management</h3>
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
                <h4 className="text-lg font-bold text-hiphop-cyan uppercase tracking-wider">Add New Staff</h4>
                <FormField label="Username" type="text" value={staffUsername} onChange={setStaffUsername} />
                <FormField label="Temporary Password" type="password" value={staffPassword} onChange={setStaffPassword} />
                
                {staffMessage && (
                    <p className={`text-sm font-bold ${staffMessage.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>
                    {staffMessage.text}
                    </p>
                )}

                <div className="pt-4">
                    <button
                    type="submit"
                    className="w-full bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-3 px-4 rounded-sm uppercase tracking-wider transition-colors"
                    >
                    Add Staff Member
                    </button>
                </div>
            </form>
        </div>
      )}

    </div>
  );
};

export default SettingsScreen;