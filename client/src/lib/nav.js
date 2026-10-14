import { useMemo, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// A tiny version counter: bumping it makes every useData() hook refetch (the SPA equivalent of router.refresh()).
let version = 0;
const subscribers = new Set();
export const bumpData = () => {
  version += 1;
  subscribers.forEach((fn) => fn());
};
export const useDataVersion = () =>
  useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => version,
  );

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (to) => navigate(to),
      replace: (to) => navigate(to, { replace: true }),
      back: () => navigate(-1),
      refresh: bumpData,
    }),
    [navigate],
  );
}

export const usePathname = () => useLocation().pathname;
