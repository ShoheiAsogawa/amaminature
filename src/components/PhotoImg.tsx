import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getPhoto } from '../lib/db';
import { REMOTE_PREFIX } from '../store/sync';

const cache = new Map<string, Promise<string | null>>();

/** 写真の object URL を取得（端末内 → なければサーバーのR2から） */
export function loadPhotoUrl(photoId: string, size: 'thumb' | 'full'): Promise<string | null> {
  const key = `${photoId}:${size}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      try {
        if (photoId.startsWith(REMOTE_PREFIX)) {
          const blob = await api.photo(photoId.slice(REMOTE_PREFIX.length), size);
          return URL.createObjectURL(blob);
        }
        const rec = await getPhoto(photoId);
        if (!rec) return null;
        return URL.createObjectURL(size === 'thumb' ? rec.thumb : rec.full);
      } catch {
        cache.delete(key);
        return null;
      }
    })();
    cache.set(key, p);
  }
  return p;
}

export function usePhotoUrl(photoId: string | null | undefined, size: 'thumb' | 'full' = 'thumb') {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (photoId) void loadPhotoUrl(photoId, size).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [photoId, size]);
  return url;
}

export function PhotoImg({
  photoId,
  size = 'thumb',
  alt,
  className = '',
}: {
  photoId: string | null | undefined;
  size?: 'thumb' | 'full';
  alt: string;
  className?: string;
}) {
  const url = usePhotoUrl(photoId, size);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-ink/[0.06] ${className}`}>
      {url && (
        <img
          src={url}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          draggable={false}
        />
      )}
    </div>
  );
}
