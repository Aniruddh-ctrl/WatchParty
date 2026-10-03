import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="p-3.5 rounded-lg bg-zinc-800 text-zinc-400 mb-4 border border-white/10">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">404 &bull; Page Not Found</h1>
      <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
        The page you are looking for does not exist or the watch room has ended.
      </p>
      <Link
        to="/"
        className="btn-primary"
      >
        <ArrowLeft size={14} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
