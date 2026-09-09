import React from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw, Terminal } from 'lucide-react';

export interface ErrorDetails {
  code: number;
  title: string;
  bnTitle: string;
  description: string;
  technicalDetails?: string;
  urlPath?: string;
}

interface ErrorScreenProps {
  error?: ErrorDetails;
  onGoHome: () => void;
}

export function ErrorScreen({ error, onGoHome }: ErrorScreenProps) {
  // Default error if not specified
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const defaultError: ErrorDetails = (() => {
    if (error) return error;

    const lowerPath = path.toLowerCase();
    
    if (lowerPath.includes('/admin') || lowerPath.includes('/login') || lowerPath.includes('/auth') || lowerPath.includes('/dashboard')) {
      return {
        code: 404,
        title: 'Page Not Found / Access Restricted',
        bnTitle: 'পেইজটি পাওয়া যায়নি / এক্সেস রেস্ট্রিক্টেড',
        description: 'The requested admin endpoint or URL path was not found on this server. Please verify the URL or return to the main shop directory.',
        technicalDetails: `Error 404 (Path_Not_Found): No public route registered for [${path}].`,
        urlPath: path
      };
    }

    if (lowerPath.includes('/api') || lowerPath.includes('/server') || lowerPath.includes('.php') || lowerPath.includes('/cpanel')) {
      return {
        code: 505,
        title: 'HTTP Version Not Supported',
        bnTitle: 'এইচটিটিপি ভার্সন নট সাপোর্টেড',
        description: 'The server does not support or refuses to support the major version of HTTP that was used in the request message.',
        technicalDetails: `Error 505 (HTTP_Version_Not_Supported): Protocol negotiation failure on endpoint [${path}].`,
        urlPath: path
      };
    }

    return {
      code: 404,
      title: 'Page Not Found / Resource Unavailable',
      bnTitle: 'পেইজটি পাওয়া যায়নি',
      description: 'The requested URL path was not found on this server. Please verify the URL or return to the main shop directory.',
      technicalDetails: `Error 404 (Path_Not_Found): No static route or dynamic handler registered for [${path}].`,
      urlPath: path
    };
  })();

  const currentError = error || defaultError;
  const rayId = `ray_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const timestamp = new Date().toUTCString();

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
        {/* Top Server & Error Status Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                  HTTP ERROR {currentError.code}
                </span>
                <span className="text-xs text-slate-400 font-mono">STATUS_{currentError.code}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Secure Gateway Firewall Filter</p>
            </div>
          </div>
        </div>

        {/* Big Code and Heading */}
        <div className="text-center sm:text-left space-y-4 mb-8">
          <div className="inline-flex items-baseline gap-3">
            <h1 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 tracking-tight font-mono">
              {currentError.code}
            </h1>
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {currentError.code === 440 && 'Login Timeout'}
              {currentError.code === 505 && 'HTTP Version Not Supported'}
              {currentError.code === 404 && 'Not Found'}
              {currentError.code === 403 && 'Access Forbidden'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {currentError.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {currentError.description}
          </p>
          <p className="text-xs text-amber-300/90 font-medium">
            বাংলা: {currentError.bnTitle}। এই ইউআরএল বা ডিরেক্টরিতে কোনো পেইজ পাওয়া যায়নি।
          </p>
        </div>

        {/* Technical Diagnostics Box */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 font-mono text-xs text-slate-400 space-y-2 mb-8 shadow-inner">
          <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800/60 pb-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Diagnostic Logs & Headers</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[11px]">
            <div><span className="text-slate-400">Request Path:</span> <span className="text-amber-400 break-all">{currentError.urlPath || path}</span></div>
            <div><span className="text-slate-400">Gateway ID:</span> <span className="text-blue-400">{rayId}</span></div>
            <div><span className="text-slate-400">Server Protocol:</span> <span className="text-emerald-400">HTTP/2.0 TLSv1.3</span></div>
            <div><span className="text-slate-400">Response Code:</span> <span className="text-red-400 font-bold">{currentError.code}</span></div>
            <div className="sm:col-span-2"><span className="text-slate-400">Timestamp:</span> <span className="text-slate-300">{timestamp}</span></div>
          </div>
          {currentError.technicalDetails && (
            <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/60 break-all">
              {currentError.technicalDetails}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage (হোমে ফিরে যান)</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>হোমপেজ রিলোড করুন</span>
          </button>
        </div>
      </div>

      {/* Footer System Notice */}
      <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
        <p>Arishten Secure Server Core • Web Application Gateway Firewall</p>
        <p className="text-[10px] text-slate-400">Security event logged under session hash: #{rayId}</p>
      </div>
    </div>
  );
}
