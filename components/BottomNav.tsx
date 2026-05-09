"use client";

import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          stroke={active ? "#6c63ff" : "#6b7280"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? "#6c63ff22" : "none"}
        />
      </svg>
    ),
  },
  {
    label: "Start",
    path: "/workout",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="9"
          stroke={active ? "#6c63ff" : "#6b7280"}
          strokeWidth="2"
          fill={active ? "#6c63ff22" : "none"}
        />
        <path
          d="M10 8L16 12L10 16V8Z"
          fill={active ? "#6c63ff" : "#6b7280"}
        />
      </svg>
    ),
  },
  {
    label: "History",
    path: "/history",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8V12L14 14"
          stroke={active ? "#6c63ff" : "#6b7280"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="12" cy="12" r="9"
          stroke={active ? "#6c63ff" : "#6b7280"}
          strokeWidth="2"
          fill={active ? "#6c63ff22" : "none"}
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="3"
          stroke={active ? "#6c63ff" : "#6b7280"}
          strokeWidth="2"
          fill={active ? "#6c63ff22" : "none"}
        />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke={active ? "#6c63ff" : "#6b7280"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/auth" || pathname === "/workout") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#13151f] border-t border-border">
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors"
            >
              {item.icon(active)}
              <span
                className="text-xs font-medium transition-colors"
                style={{ color: active ? "#6c63ff" : "#6b7280" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}