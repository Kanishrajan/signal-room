/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`w-full bg-slate-900/90 text-slate-100 placeholder:text-slate-500 text-sm font-mono border border-slate-700/80 rounded-sm py-2 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-400 focus-visible:border-cyan-500 transition-colors ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};
