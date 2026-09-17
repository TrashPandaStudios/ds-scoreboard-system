import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-6 shadow-xl shadow-cyan-500/20">
        <Shield className="w-8 h-8 text-cyan-400" />
      </div>
      <h1 className="text-6xl font-display font-black text-white mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-300 mb-4">Arena View Not Found</h2>
      <p className="text-xs font-mono text-slate-400 max-w-sm mb-8">
        The requested Drone Soccer cage or overlay route does not exist.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-display font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/30"
      >
        <Home className="w-4 h-4" />
        <span>RETURN TO ARENA HUB</span>
      </Link>
    </div>
  );
};
