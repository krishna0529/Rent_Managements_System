import Link from "next/link";

export default function AuthFooter() {
  return (
    <footer className="w-full py-6 px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-outline-variant/15 bg-surface-container-lowest relative z-10">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[13px] text-on-surface-variant tracking-wider font-semibold">
          SINGH RENT HOUSE
        </span>
        <span className="text-outline-variant text-xs">•</span>
        <p className="text-[12px] text-outline">
          © 2025 RIGHT SINGH RENT HOUSE
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Link
          href="#privacy"
          className="text-on-surface-variant font-mono text-[12px] hover:text-on-surface transition-colors"
        >
          Privacy Protocol
        </Link>
        <Link
          href="#terms"
          className="text-on-surface-variant font-mono text-[12px] hover:text-on-surface transition-colors"
        >
          Terms of Authentication
        </Link>
        <Link
          href="#audit"
          className="text-on-surface-variant font-mono text-[12px] hover:text-on-surface transition-colors"
        >
          System Audit
        </Link>
      </div>
    </footer>
  );
}
