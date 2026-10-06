import { useEffect, useRef, useState } from "react";
import { fetchBlob } from "../api";

const blobUrls = new Map<string, string>();
let activeLoads = 0;
const waiting: Array<() => void> = [];

function takeSlot(): Promise<void> {
  if (activeLoads < 4) {
    activeLoads += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waiting.push(() => {
      activeLoads += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeLoads -= 1;
  const next = waiting.shift();
  if (next) next();
}

export function useAuthImage(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(path ? blobUrls.get(path) ?? null : null);

  useEffect(() => {
    if (!path) return;
    const existing = blobUrls.get(path);
    if (existing) {
      setUrl(existing);
      return;
    }
    let cancelled = false;
    void takeSlot()
      .then(() => fetchBlob(path))
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        blobUrls.set(path, objectUrl);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(releaseSlot);
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

export function AuthImage({ path, alt, height }: { path: string | null; alt: string; height?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = frame.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  const url = useAuthImage(visible ? path : null);
  return (
    <div
      ref={frame}
      style={{
        height: height,
        minHeight: height ?? 120,
        overflow: "hidden",
        borderRadius: 8,
        background: "#ece6da",
      }}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          style={{
            width: "100%",
            height: height ? "100%" : "auto",
            objectFit: height ? "cover" : undefined,
            display: "block",
            background: "#111",
          }}
        />
      ) : (
        <div style={{ height: height ?? 120 }} aria-label={alt} />
      )}
    </div>
  );
}
