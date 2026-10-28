import { useCallback, useEffect, useRef, useState } from 'react';
import { api, MAX_VIDEO_OFFSET, VIDEO_PAGE_SIZE } from './api';
import type { Video } from './api';

interface LibraryState {
  videos: Video[];
  nextOffset: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useVideoLibrary() {
  const [library, setLibrary] = useState<LibraryState>({
    videos: [],
    nextOffset: 0,
    hasMore: true,
    isLoading: true,
    error: null,
  });
  const requestRef = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const loadPage = useCallback(async (offset: number, replace: boolean) => {
    if (!replace && requestRef.current) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const currentGeneration = ++generation.current;
    setLibrary((previous) => ({ ...previous, isLoading: true, error: null }));
    try {
      const page = await api.listVideos(offset, controller.signal);
      if (generation.current !== currentGeneration) return;
      setLibrary((previous) => ({
        videos: [
          ...new Map(
            (replace ? page : [...previous.videos, ...page]).map((video) => [video.id, video])
          ).values(),
        ],
        nextOffset: offset + VIDEO_PAGE_SIZE,
        hasMore: page.length === VIDEO_PAGE_SIZE && offset < MAX_VIDEO_OFFSET,
        isLoading: false,
        error: null,
      }));
    } catch (error: unknown) {
      if (generation.current !== currentGeneration || controller.signal.aborted) return;
      setLibrary((previous) => ({
        ...previous,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Could not load videos. Please try again.',
      }));
    } finally {
      if (generation.current === currentGeneration) requestRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    void loadPage(0, true);
  }, [loadPage]);
  const loadMore = useCallback(() => {
    if (library.hasMore && !library.isLoading) void loadPage(library.nextOffset, false);
  }, [library.hasMore, library.isLoading, library.nextOffset, loadPage]);

  const cancelRequests = useCallback(() => {
    generation.current++;
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    return () => {
      window.clearTimeout(timer);
      cancelRequests();
    };
  }, [refresh, cancelRequests]);

  return { ...library, refresh, loadMore };
}
