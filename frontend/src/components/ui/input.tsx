import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = ({ error, label, className = '', ...props }: InputProps) => {
  const baseStyles =
    'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed';

  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-200">{label}</label>}
      <input className={`${baseStyles} ${errorStyles} ${className}`} {...props} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
};