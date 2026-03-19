import { useState, useEffect, useCallback } from "react";
import type { Pin } from "../types";
import * as pinService from "../services/pins";

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pinService.fetchPins();
      setPins(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pins, loading, refresh, setPins };
}
