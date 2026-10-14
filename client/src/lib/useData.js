import { useEffect, useState } from "react";
import { useDataVersion } from "@/lib/nav";

/**
 * Minimal data hook. Refetches when `deps` change or when router.refresh() is called.
 * `loading` is derived (result key !== current key) so no setState is needed synchronously in the effect.
 */
export function useData(fn, deps = []) {
  const version = useDataVersion();
  const key = `${version}:${JSON.stringify(deps)}`;
  const [result, setResult] = useState({ key: null, data: undefined, error: null });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(fn)
      .then(
        (data) => !cancelled && setResult({ key, data, error: null }),
        (error) => !cancelled && setResult({ key, data: undefined, error }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = result.key !== key;
  return { data: result.data, error: result.error, loading, ready: !loading };
}
