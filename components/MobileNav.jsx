"use client";

import Link from "next/link";

/**
 * Fixed bottom navigation bar for mobile screens.
 *
 * @param {{ activeTab: string, clientCode: string, onShare?: () => void, onSignOut?: () => void }} props
 */
export default function MobileNav({ activeTab, clientCode, onShare, onSignOut, onInsights }) {
  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: `/dashboard/${clientCode}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="12" width="4" height="9" rx="1" />
          <rect x="10" y="7" width="4" height="14" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      ),
    },
    {
      key: "insights",
      label: "Insights",
      icon: (
        /* sparkle / AI */
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      ),
    },
    {
      key: "share",
      label: "Share",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      key: "signout",
      label: "Sign Out",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
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

          /* Insights button — scroll to AI analysis section */
          if (item.key === "insights") {
            return (
              <button
                key={item.key}
                onClick={onInsights}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${color}`}
              >
                {item.icon}
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          }

          /* Sign Out button — triggers callback */
          if (item.key === "signout") {
            return (
              <button
                key={item.key}
                onClick={onSignOut}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${color}`}
              >
                {item.icon}
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
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
