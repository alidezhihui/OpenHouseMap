import { useState, useRef, useEffect, useCallback } from "react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressSearchProps {
  onSelect: (address: string, lat: number, lng: number) => void;
}

export default function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { "User-Agent": "HousingMap/1.0" } },
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 500);
  };

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    setOpen(false);
    setResults([]);
    onSelect(result.display_name, parseFloat(result.lat), parseFloat(result.lon));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: 320 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search address..."
        style={{
          width: "100%",
          padding: "6px 10px",
          borderRadius: 4,
          border: "1px solid #475569",
          background: "#0f172a",
          color: "#e2e8f0",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {loading && (
        <span
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          ...
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "#1e293b",
            border: "1px solid #475569",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              style={{
                padding: "8px 10px",
                fontSize: 13,
                color: "#e2e8f0",
                cursor: "pointer",
                borderBottom: i < results.length - 1 ? "1px solid #334155" : "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = "#334155";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = "transparent";
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
