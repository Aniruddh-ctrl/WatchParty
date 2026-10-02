import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-2xl bg-zinc-800/80 text-zinc-400 mb-4 border border-white/10">
        <AlertCircle size={40} />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">
        The page you are looking for does not exist or the watch room has been closed.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25"
      >
        <ArrowLeft size={16} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
