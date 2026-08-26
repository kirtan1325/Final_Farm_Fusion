import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getNotifications } from "../api/notificationService";
import { useAuth } from "./AuthContext";

const BadgeContext = createContext();

export function BadgeProvider({ children }) {
  const { user } = useAuth();
  const [badges, setBadges] = useState({});

  const fetchBadges = useCallback(async () => {
    if (!user) {
      setBadges({});
      return;
    }
    try {
      const { data } = await getNotifications({ unreadOnly: true, limit: 100 });
      const counts = {};
      if (data && Array.isArray(data)) {
        data.forEach((n) => {
          if (n.link) {
            counts[n.link] = (counts[n.link] || 0) + 1;
          }
        });
      }
      setBadges(counts);
    } catch (err) {
      // silent fail or handle
    }
  }, [user]);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000); // Polling every 15 seconds
    return () => clearInterval(interval);
  }, [fetchBadges]);

  return (
    <BadgeContext.Provider value={{ badges, fetchBadges }}>
      {children}
    </BadgeContext.Provider>
  );
}

export const useBadges = () => useContext(BadgeContext);
