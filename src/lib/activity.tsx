import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ActivityKind = "email" | "summary" | "schedule";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  at: string;
};

type ActivityContextValue = {
  activity: ActivityItem[];
  logActivity: (item: Omit<ActivityItem, "id" | "at">) => void;
  clearActivity: () => void;
  ready: boolean;
};

const STORAGE_KEY = "workflow-ai.activity";

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setActivity(JSON.parse(raw) as ActivityItem[]);
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activity.slice(0, 40)));
  }, [activity, ready]);

  const logActivity = useCallback((item: Omit<ActivityItem, "id" | "at">) => {
    setActivity((prev) =>
      [
        {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 40),
    );
  }, []);

  const clearActivity = useCallback(() => setActivity([]), []);

  const value = useMemo(
    () => ({ activity, logActivity, clearActivity, ready }),
    [activity, logActivity, clearActivity, ready],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used inside ActivityProvider");
  return ctx;
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
