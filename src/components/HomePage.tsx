"use client";
import React from 'react';

// --- TYPE DEFINITIONS ---
type IconProps = {
    className?: string;
};

type HomePageProps = {
    onStartAppeal: () => void;
};

// --- SVG ICONS ---
const LogoIcon = ({ className = "h-16 w-auto" }: IconProps) => (
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

const CheckIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const ChatBotIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

// --- MAIN HOMEPAGE COMPONENT ---
export default function HomePage({ onStartAppeal }: HomePageProps) {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen">
            {/* Header with blue banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4">
                <div className="max-w-6xl mx-auto">
                    <p className="text-center font-medium">Your Amazon suspension appeal assistant</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Main Content */}
                    <div className="space-y-8">
                        {/* Logo and Title */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <LogoIcon className="h-12 w-auto" />
                                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                                    AmzAppeal Pro
                                </h1>
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                                    Get Your Amazon Account Back with{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                        AI-Generated Appeals
                                    </span>
                                </h1>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    Our AI wizard will guide you through creating a professional, effective appeal for your 
                                    Amazon suspension. We use advanced AI technology to analyze your specific 
                                    situation and generate a customized appeal.
                                </p>
                            </div>
                        </div>

                        {/* Pricing Box */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-blue-700 font-medium">Fixed fee:</p>
                                    <p className="text-3xl font-bold text-blue-900">$350<span className="text-lg text-blue-600"> per appeal</span></p>
                                </div>
                            </div>
                            <p className="text-sm text-blue-800">
                                Get a customized, AI-generated appeal tailored to your specific suspension type.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div className="space-y-4">
                            <button
                                onClick={onStartAppeal}
                                className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                Start Your Appeal with Our Wizard
                            </button>
                        </div>


                    </div>

                    {/* Right Column - Benefits */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Why Choose AMZ Appeal.AI?</h2>
                        </div>

                        <div className="space-y-6">
                            {[
                                {
                                    title: "AI-generated appeals tailored to your specific suspension type",
                                    description: "Our advanced AI analyzes your situation and creates a personalized appeal."
                                },
                                {
                                    title: "Appeal templates from Amazon suspension experts", 
                                    description: "Based on successful appeals and expert knowledge of Amazon policies."
                                },
                                {
                                    title: "Step-by-step wizard to identify your suspension type",
                                    description: "Easy-to-follow process that guides you through every step."
                                },
                                {
                                    title: "Multiple AI providers for uninterrupted service",
                                    description: "Reliable service with backup systems to ensure availability."
                                },
                                {
                                    title: "AI assistant chatbot for guidance throughout the process",
                                    description: "Get instant help and answers to your questions anytime."
                                }
                            ].map((benefit, index) => (
                                <div key={index} className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="bg-green-100 rounded-full p-1">
                                            <CheckIcon className="w-4 h-4 text-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                                        <p className="text-sm text-slate-600">{benefit.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom CTA Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Your Amazon Account Reinstated?</h2>
                    <p className="text-xl text-slate-300 mb-8">
                        Don't let your Amazon suspension drag on. Start your professional appeal today.
                    </p>
                    <button
                        onClick={onStartAppeal}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Start Your Appeal Now
                    </button>
                </div>
            </div>
        </div>
    );
}