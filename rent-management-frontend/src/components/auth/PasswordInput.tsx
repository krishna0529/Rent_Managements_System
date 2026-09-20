"use client";

import React, { useState } from "react";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  iconName?: string;
  rightAction?: React.ReactNode;
}

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••••••",
  required = true,
  iconName = "lock_open",
  rightAction,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 field-glow-box rounded-lg">
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="block font-mono text-[12px] text-on-surface-variant transition-colors group-focus-within:text-primary"
        >
          {label}
        </label>
        {rightAction}
      </div>
      <div className="relative flex items-center group">
        <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[20px] transition-colors duration-200 group-focus-within:text-primary">
          {iconName}
        </span>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface placeholder:text-outline/60 text-[14px] focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none focus:shadow-[0_0_16px_rgba(195,192,255,0.15)] transition-all font-mono tracking-tight"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 text-outline hover:text-on-surface transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <span
            className={`material-symbols-outlined text-[18px] transition-colors ${
              showPassword ? "text-primary" : ""
            }`}
          >
            {showPassword ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
}
