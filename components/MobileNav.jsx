"use client";

import Link from "next/link";

/**
 * Fixed bottom navigation bar for mobile screens.
 *
 * @param {{ activeTab: string, clientCode: string, onShare?: () => void }} props
 */
export default function MobileNav({ activeTab, clientCode, onShare }) {
  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: `/dashboard/${clientCode}`,
      icon: (
        /* chart-bar */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="12" width="4" height="9" rx="1" />
          <rect x="10" y="7" width="4" height="14" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      ),
    },
    {
      key: "log",
      label: "Log",
      href: `/log/${clientCode}`,
      icon: (
        /* plus-circle */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      key: "share",
      label: "Share",
      icon: (
        /* share / arrow-up-from-square */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      key: "help",
      label: "Help",
      href: "https://calendly.com/reflexity",
      external: true,
      icon: (
        /* question-mark-circle */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E293B] border-t border-[#334155] md:hidden">
      <div className="flex items-center justify-around h-14 pb-safe">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          const color = isActive ? "text-[#7C3AED]" : "text-slate-400";

          /* Share button — triggers callback instead of navigating */
          if (item.key === "share") {
            return (
              <button
                key={item.key}
                onClick={onShare}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${color}`}
              >
                {item.icon}
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          }

          /* External link (Help / Calendly) */
          if (item.external) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${color}`}
              >
                {item.icon}
                <span className="text-[10px] leading-tight">{item.label}</span>
              </a>
            );
          }

          /* Internal link */
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${color}`}
            >
              {item.icon}
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
