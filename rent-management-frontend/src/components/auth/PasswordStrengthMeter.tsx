"use client";

import React, { useMemo } from "react";

interface PasswordStrengthMeterProps {
  password?: string;
  confirmPassword?: string;
  showMatchRule?: boolean;
}

export default function PasswordStrengthMeter({
  password = "",
  confirmPassword = "",
  showMatchRule = true,
}: PasswordStrengthMeterProps) {
  const analysis = useMemo(() => {
    const hasCap = /[A-Z]/.test(password);
    const hasLow = /[a-z]/.test(password);
    const hasSpec = /[@#$!%*?&^()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const hasLen = password.length >= 8;
    const isMatch = password.length > 0 && password === confirmPassword;

    let score = 0;
    if (hasCap) score++;
    if (hasLow) score++;
    if (hasSpec) score++;
    if (hasLen) score++;

    let levelLabel = "Unchecked";
    let labelColor = "text-outline";

    if (password.length > 0) {
      if (score === 1) {
        levelLabel = "Weak";
        labelColor = "text-error";
      } else if (score === 2) {
        levelLabel = "Fair";
        labelColor = "text-outline";
      } else if (score === 3) {
        levelLabel = "Good";
        labelColor = "text-secondary";
      } else if (score === 4) {
        levelLabel = "Military Grade (Cryptographic)";
        labelColor = "text-tertiary font-semibold";
      }
    }

    return {
      hasCap,
      hasLow,
      hasSpec,
      hasLen,
      isMatch,
      score,
      levelLabel,
      labelColor,
    };
  }, [password, confirmPassword]);

  const getBarClass = (barIndex: number) => {
    if (analysis.score === 0 || password.length === 0) {
      return "rounded-full bg-outline-variant/30 transition-all duration-500 ease-out";
    }
    if (barIndex <= analysis.score) {
      if (analysis.score === 1) {
        return "rounded-full bg-error transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,180,171,0.5)]";
      }
      if (analysis.score === 2) {
        return "rounded-full bg-outline transition-all duration-500 ease-out";
      }
      if (analysis.score === 3) {
        return "rounded-full bg-secondary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(76,215,246,0.4)]";
      }
      if (analysis.score === 4) {
        return "rounded-full bg-tertiary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(78,222,163,0.6)]";
      }
    }
    return "rounded-full bg-outline-variant/30 transition-all duration-500 ease-out";
  };

  const renderPill = (label: string, isValid: boolean, isWide = false) => (
    <div
      className={`flex items-center gap-1.5 font-mono text-[12px] transition-all duration-300 ${
        isWide ? "col-span-2 sm:col-span-2" : ""
      } ${isValid ? "text-tertiary" : "text-outline-variant"}`}
    >
      <span
        className={`material-symbols-outlined text-[14px] transition-transform duration-300 ${
          isValid ? "scale-110" : ""
        }`}
      >
        {isValid ? "check_circle" : "radio_button_unchecked"}
      </span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="p-3.5 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/25 space-y-2.5 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-on-surface-variant">
          Cryptographic Password Entropy
        </span>
        <span
          className={`font-mono text-[12px] transition-all duration-300 ${analysis.labelColor}`}
        >
          {analysis.levelLabel}
        </span>
      </div>

      {/* 4-Segment Strength Indicator */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        <div className={getBarClass(1)} />
        <div className={getBarClass(2)} />
        <div className={getBarClass(3)} />
        <div className={getBarClass(4)} />
      </div>

      {/* Dynamic Verification Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {renderPill("Capital (A-Z)", analysis.hasCap)}
        {renderPill("Lowercase (a-z)", analysis.hasLow)}
        {renderPill("Special (@, #, $)", analysis.hasSpec)}
        {renderPill("8 - 12+ Chars", analysis.hasLen)}
        {showMatchRule && renderPill("Passwords Match", analysis.isMatch, true)}
      </div>
    </div>
  );
}
