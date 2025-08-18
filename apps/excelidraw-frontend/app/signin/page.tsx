"use client"
import { useState } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle, LogIn } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';

export default function SigninForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const { login, loading, error, clearError } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing errors when user starts typing
    if (error) {
      clearError();
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Clear any existing messages
    clearError();
    setSuccessMessage('');

    // Basic client-side validation
    if (!formData.username.trim() || !formData.password.trim()) {
      // The AuthContext will handle this validation
      return;
    }

    try {
      const success = await login({
        username: formData.username,
        password: formData.password
      });

      if (success) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/'); // Use Next.js router for navigation
        }, 1500);
      }
      // Error handling is done by AuthContext
    } catch (err) {
      // AuthContext handles errors
      console.error('Login error:', err);
    }
  };

  // Determine what message to show
  const displayMessage = error || successMessage;
  const messageType = error ? 'error' : 'success';

  return (
    <div>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-black w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your email address"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Message Display */}
              {displayMessage && (
                <div className={`flex items-center space-x-2 p-4 rounded-xl ${
                  messageType === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {messageType === 'error' ? (
                    <AlertCircle size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  <span className="text-sm font-medium">{displayMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Dont have an account?{' '}
                <a href="/signup" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                  Create one here
                </a>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Secure login protected by advanced encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}