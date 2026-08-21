import React, { useState, useEffect } from 'react';
import { SpinnerIcon, ShieldCheckIcon, CheckCircleIcon } from './Icons';
import { USER_PASSWORD } from './constants';
import { validatePassword } from '../utils/validation';
import { PasswordGenerator } from './PasswordGenerator';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordCriteriaList: React.FC<{ criteria: { [key: string]: boolean } }> = ({ criteria }) => {
    const criteriaList = [
        { label: 'At least 8 characters', met: criteria.minLength },
        { label: 'One uppercase letter', met: criteria.hasUppercase },
        { label: 'One lowercase letter', met: criteria.hasLowercase },
        { label: 'One number', met: criteria.hasNumber },
        { label: 'One special character', met: criteria.hasSpecialChar },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            {criteriaList.map(c => (
                <div key={c.label} className={`flex items-center transition-colors ${c.met ? 'text-green-600' : 'text-[#0F172A]'}`}>
                    <CheckCircleIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>{c.label}</span>
                </div>
            ))}
        </div>
    );
};


export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecialChar: false,
  });

  useEffect(() => {
    setPasswordCriteria(validatePassword(newPassword));
  }, [newPassword]);

  const handleGeneratedPassword = (password: string) => {
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (currentPassword !== USER_PASSWORD) {
      setError('Your current password is not correct.');
      return;
    }
    if (!Object.values(passwordCriteria).every(Boolean)) {
        setError('New password does not meet all security requirements.');
        return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-slate-200 rounded-2xl shadow-digital p-8 w-full max-w-md m-4 relative">
        {isSuccess ? (
          <div className="text-center p-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="mt-4 text-2xl font-bold text-[#1E293B]">Password Changed!</h3>
            <p className="text-[#0F172A] mt-2">You can now use your new password to log in.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4 shadow-digital-inset">
                    <ShieldCheckIcon className="w-8 h-8 text-[#0F172A]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E293B]">Change Password</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-[#0F172A]">Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 w-full p-2 rounded-md shadow-digital-inset" />
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-[#0F172A]">New Password</label>
                        <button type="button" onClick={() => setShowGenerator(p => !p)} className="text-xs font-semibold text-primary-600 hover:underline">
                            {showGenerator ? 'Hide' : 'Generate'}
                        </button>
                    </div>
                    {showGenerator && <PasswordGenerator onPasswordGenerated={handleGeneratedPassword} />}
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full p-2 rounded-md shadow-digital-inset" />
                    <PasswordCriteriaList criteria={passwordCriteria} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#0F172A]">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 rounded-md shadow-digital-inset" />
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-bold text-[#0F172A] bg-slate-200 rounded-lg shadow-digital">Cancel</button>
                    <button type="submit" disabled={isProcessing} className="px-4 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-primary rounded-lg shadow-md flex items-center">
                        {isProcessing && <SpinnerIcon className="w-5 h-5 mr-2" />}
                        Save Changes
                    </button>
                </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};