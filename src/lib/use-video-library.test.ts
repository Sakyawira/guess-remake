import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, videoFixture } from '@/test/fixtures';
import { useVideoLibrary } from './use-video-library';

describe('video loading lifecycle', () => {
  it('ignores an older request after a live refresh replaces it', async () => {
    let resolveOld: (response: Response) => void = () => {
      throw new Error('Not initialized');
    };
    const oldResponse = new Promise<Response>((resolve) => {
      resolveOld = resolve;
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(oldResponse)
      .mockResolvedValueOnce(jsonResponse([videoFixture(2)]));
    vi.stubGlobal('fetch', fetcher);
    const { result } = renderHook(useVideoLibrary);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.videos[0]?.id).toBe(videoFixture(2).id));
    await act(async () => {
      resolveOld(jsonResponse([videoFixture(1)]));
      await oldResponse;
    });
    expect(result.current.videos[0].id).toBe(videoFixture(2).id);
    expect(result.current.error).toBeNull();
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
