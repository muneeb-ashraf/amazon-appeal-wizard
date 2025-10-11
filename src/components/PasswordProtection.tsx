"use client";
import * as React from 'react';

// --- TYPE DEFINITIONS ---
type IconProps = {
    className?: string;
};

// --- SVG ICONS (matching app style) ---
const LogoIcon = ({ className = "h-10 w-auto" }: IconProps) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="url(#paint0_linear_1_2)" />
        <path d="M13 29V11L22 16L27 13.5V23.5L22 26L13 29Z" fill="white" />
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
        </defs>
    </svg>
);

const LockIcon = ({ className = "w-4 h-4" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

// Helper component for styled input fields (matching LandingPage style)
const StyledInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
);

interface PasswordProtectionProps {
    children: React.ReactNode;
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    // Check if user is already authenticated (stored in sessionStorage for session-only persistence)
    React.useEffect(() => {
        const authStatus = sessionStorage.getItem('app-authenticated');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate a small delay for better UX
        setTimeout(() => {
            if (password === '1DontForget2!') {
                setIsAuthenticated(true);
                sessionStorage.setItem('app-authenticated', 'true');
                setError('');
            } else {
                setError('Incorrect password. Please try again.');
            }
            setIsLoading(false);
        }, 800);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased">
            {/* IMPORTANT FONT UPGRADE: 
                For the best look, add the 'Inter' font to your project.
                1. In your main CSS file (e.g., globals.css), add:
                   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                2. In your tailwind.config.js, extend the theme:
                   theme: {
                     extend: {
                       fontFamily: {
                         sans: ['Inter', 'sans-serif'],
                       },
                     },
                   },
            */}
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 transition-all duration-300">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <LogoIcon className="h-16 w-auto" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">AmzAppeal Pro</h1>
                        <p className="text-slate-600 mb-6">Your AI-Powered Path to Reinstatement</p>
                        
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-lg">
                                <LockIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Secure Access</h2>
                        <p className="text-slate-500 text-sm">Please enter the access password to continue</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                Access Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 pr-12 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    placeholder="Enter access password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className={`w-full py-3 px-6 rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                isLoading
                                    ? 'bg-slate-400 text-white cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Verifying...
                                </div>
                            ) : (
                                'Access Application'
                            )}
                        </button>
                    </form>

                    {/* Security notice */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                        <div className="flex items-center justify-center text-xs text-slate-500">
                            <LockIcon className="w-3 h-3 mr-1" />
                            <span>Secure access required for data protection</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}