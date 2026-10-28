import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, videoFixture } from '@/test/fixtures';
import { FAVOURITES_STORAGE_KEY } from '@/lib/favourites';
import App from './App';

vi.mock('@/lib/socket', () => ({
  useGameSocket: () => ({ usersOnline: 1, status: 'connected', error: null }),
}));
vi.mock('@/components/QuestionArea', () => ({
  QuestionArea: ({ onCorrect, onWrong }: { onCorrect: () => void; onWrong: () => void }) => (
    <div>
      <button onClick={onCorrect}>Correct answer</button>
      <button onClick={onWrong}>Wrong answer</button>
    </div>
  ),
}));

const FETCH = vi.fn<typeof fetch>();
beforeEach(() => {
  FETCH.mockReset();
  vi.stubGlobal('fetch', FETCH);
});

describe('public game compatibility', () => {
  it('removes administration and keeps favourites local across reloads', async () => {
    FETCH.mockImplementation(async () => jsonResponse([videoFixture()]));
    const user = userEvent.setup();
    const mounted = render(<App />);
    const favourite = await screen.findByRole('button', { name: 'Favourite Video 1' });
    expect(screen.queryByPlaceholderText('Add Video URL')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete video/i })).not.toBeInTheDocument();
    const before = FETCH.mock.calls.length;
    await user.click(favourite);
    expect(favourite).toHaveAttribute('aria-pressed', 'true');
    expect(FETCH).toHaveBeenCalledTimes(before);
    expect(JSON.parse(localStorage.getItem(FAVOURITES_STORAGE_KEY) ?? '[]')).toEqual([
      videoFixture().id,
    ]);
    mounted.unmount();
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Favourite Video 1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    for (const [, options] of FETCH.mock.calls) {
      expect(options?.method ?? 'GET').toBe('GET');
      expect(new Headers(options?.headers).get('X-Admin-Key')).toBeNull();
    }
  });

  it('keeps favourites usable when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    FETCH.mockImplementation(async () => jsonResponse([videoFixture()]));
    render(<App />);
    const favourite = await screen.findByRole('button', { name: 'Favourite Video 1' });
    await userEvent.click(favourite);
    expect(favourite).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Favourites will last only for this session/)).toBeInTheDocument();
  });

  it('loads a second page instead of silently limiting the game to 100 videos', async () => {
    FETCH.mockResolvedValueOnce(
      jsonResponse(Array.from({ length: 100 }, (_, index) => videoFixture(index + 1)))
    ).mockResolvedValueOnce(jsonResponse([videoFixture(101), videoFixture(102)]));
    render(<App />);
    await screen.findByText('100 videos loaded');
    await userEvent.click(screen.getByRole('button', { name: 'Load more videos' }));
    await screen.findByText('102 videos loaded');
    expect(FETCH.mock.calls[1][0]).toContain('offset=100');
    expect(screen.queryByRole('button', { name: 'Load more videos' })).not.toBeInTheDocument();
  });

  it('shows access errors and lets the user retry loading', async () => {
    FETCH.mockResolvedValueOnce(jsonResponse({}, 401)).mockResolvedValueOnce(
      jsonResponse([videoFixture()])
    );
    render(<App />);
    await screen.findByText(/API key is missing or invalid/);
    await userEvent.click(screen.getByRole('button', { name: 'Retry video loading' }));
    await screen.findByRole('button', { name: 'Favourite Video 1' });
    expect(screen.queryByText('Could not load videos')).not.toBeInTheDocument();
  });

  it('preserves loaded videos and the page offset after a failed load-more request', async () => {
    FETCH.mockResolvedValueOnce(
      jsonResponse(Array.from({ length: 100 }, (_, index) => videoFixture(index + 1)))
    )
      .mockResolvedValueOnce(jsonResponse({}, 429, { 'Retry-After': '9' }))
      .mockResolvedValueOnce(jsonResponse([videoFixture(101)]));
    render(<App />);
    await screen.findByText('100 videos loaded');
    await userEvent.click(screen.getByRole('button', { name: 'Load more videos' }));
    await screen.findByText(/try again in 9 seconds/);
    expect(screen.getByText('100 videos loaded')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Load more videos' }));
    await screen.findByText('101 videos loaded');
    expect(FETCH.mock.calls[2][0]).toContain('offset=100');
  });

  it('submits one score per game and labels the top-100 leaderboard', async () => {
    FETCH.mockResolvedValueOnce(jsonResponse([videoFixture()]))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(
        jsonResponse([{ id: videoFixture().id, playerName: 'Player', score: 100 }])
      );
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Favourite Video 1' });
    await user.click(screen.getByRole('button', { name: 'Correct answer' }));
    for (let i = 0; i < 3; i++)
      await user.click(screen.getByRole('button', { name: 'Wrong answer' }));
    await user.type(screen.getByRole('textbox', { name: 'Player name' }), 'Player');
    await user.click(screen.getByRole('button', { name: 'Submit score' }));
    await screen.findByText('Your score was saved.');
    await screen.findByText('Top 100 scores');
    expect(screen.getByRole('button', { name: 'Score submitted' })).toBeDisabled();
    expect(FETCH.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  });

  it('does not resubmit a saved score when only the leaderboard read fails', async () => {
    FETCH.mockResolvedValueOnce(jsonResponse([videoFixture()]))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse([]));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Favourite Video 1' });
    for (let i = 0; i < 3; i++)
      await user.click(screen.getByRole('button', { name: 'Wrong answer' }));
    await user.type(screen.getByRole('textbox', { name: 'Player name' }), 'Player');
    await user.click(screen.getByRole('button', { name: 'Submit score' }));
    await screen.findByText('Leaderboard unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry leaderboard' }));
    await waitFor(() =>
      expect(screen.queryByText('Leaderboard unavailable')).not.toBeInTheDocument()
    );
    expect(FETCH.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  });
});
