// ============================================
// 🔐 LOGIN PAGE - Secure Authentication
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { signIn, signUp, isAuthenticated } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, setUser } = useStore();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isArabic = language === 'ar';

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        navigate('/chat');
      }
    };
    checkAuth();
  }, [navigate]);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  // Password validation
  const getPasswordStrength = (pass: string): { strength: number; message: string } => {
    let strength = 0;
    const messages: string[] = [];
    
    if (pass.length >= 8) strength++;
    else messages.push(isArabic ? '8 أحرف على الأقل' : 'At least 8 characters');
    
    if (/[A-Z]/.test(pass)) strength++;
    else messages.push(isArabic ? 'حرف كبير' : 'Uppercase letter');
    
    if (/[a-z]/.test(pass)) strength++;
    else messages.push(isArabic ? 'حرف صغير' : 'Lowercase letter');
    
    if (/[0-9]/.test(pass)) strength++;
    else messages.push(isArabic ? 'رقم' : 'Number');
    
    return { 
      strength, 
      message: messages.length > 0 
        ? (isArabic ? 'مطلوب: ' : 'Required: ') + messages.join(', ')
        : (isArabic ? 'كلمة مرور قوية ✓' : 'Strong password ✓')
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!email || !password) {
      setError(isArabic ? 'الرجاء إدخال البريد وكلمة المرور' : 'Please enter email and password');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(isArabic ? 'البريد الإلكتروني غير صالح' : 'Invalid email format');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { strength } = getPasswordStrength(password);
      if (strength < 4) {
        setError(isArabic ? 'كلمة المرور ضعيفة' : 'Password is too weak');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await signUp(email, password, name);
        
        if (signUpError) {
          setError(isArabic ? signUpError.error : (signUpError.errorEn || signUpError.error));
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setUser(data.user);
          navigate('/chat');
        }
      } else {
        const { data, error: signInError } = await signIn(email, password);
        
        if (signInError) {
          setError(isArabic ? signInError.error : (signInError.errorEn || signInError.error));
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setUser(data.user);
          navigate('/chat');
        }
      }
    } catch (err) {
      setError(isArabic ? 'حدث خطأ. حاول مرة أخرى' : 'An error occurred. Please try again');
    }
    
    setIsLoading(false);
  };

  const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : null;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0a0a1a' }}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
      >
        {isArabic ? 'English' : 'العربية'}
      </button>

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 via-transparent to-purple-900/10" />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800 p-8">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neutral-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">T!</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Try-It!</h1>
            <p className="text-gray-400">
              {isArabic ? 'مساعدك الذكي' : 'Your AI Assistant'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-neutral-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-neutral-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isArabic ? 'حساب جديد' : 'Sign Up'}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  {isArabic ? 'الاسم' : 'Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
                  placeholder={isArabic ? 'أدخل اسمك' : 'Enter your name'}
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all"
                placeholder="example@email.com"
                dir="ltr"
                autoComplete="email"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  dir="ltr"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              {/* Password strength indicator (signup only) */}
              {mode === 'signup' && password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          level <= passwordStrength!.strength
                            ? passwordStrength!.strength === 4
                              ? 'bg-green-500'
                              : passwordStrength!.strength >= 2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength!.strength === 4 ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {passwordStrength!.message}
                  </p>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-neutral-600 to-purple-600 hover:from-neutral-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isArabic ? 'جاري المعالجة...' : 'Processing...'}</span>
                </span>
              ) : (
                <span>
                  {mode === 'login' 
                    ? (isArabic ? 'تسجيل الدخول' : 'Sign In')
                    : (isArabic ? 'إنشاء حساب' : 'Create Account')
                  }
                </span>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <span>🔒</span>
              <span>
                {isArabic 
                  ? 'اتصال آمن ومشفر' 
                  : 'Secure encrypted connection'
                }
              </span>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-sm text-center mb-4">
              {isArabic ? 'المميزات المتاحة:' : 'Available Features:'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                isArabic ? 'محادثة ذكية' : 'Smart Chat',
                isArabic ? 'البحث في الإنترنت' : 'Web Search',
                isArabic ? 'تحليل الصور' : 'Image Analysis',
                isArabic ? 'إنشاء ملفات' : 'File Generation',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
