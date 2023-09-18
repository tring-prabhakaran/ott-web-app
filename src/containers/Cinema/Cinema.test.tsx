import React from 'react';
import { act } from '@testing-library/react';

import Cinema from './Cinema';

import { renderWithRouter } from '#test/testUtils';
import type { PlaylistItem } from '#types/playlist';
import { CONTROLLERS } from '#src/ioc/types';
import playlistFixture from '#test/fixtures/playlist.json';

vi.mock('#src/ioc/container', () => ({
  getController: (type: symbol) => {
    switch (type) {
      case CONTROLLERS.Api:
        return {
          getPlaylistById: vi.fn(() => playlistFixture),
        };
    }
  },
}));

describe('<Cinema>', () => {
  test('renders and matches snapshot', async () => {
    const item = {
      description: 'Test item description',
      duration: 354,
      feedid: 'ax85aa',
      image: 'http://test/img.jpg',
      images: [],
      link: 'http://test/link',
      genre: 'Tester',
      mediaid: 'zp50pz',
      pubdate: 26092021,
      rating: 'CC_CC',
      sources: [],
      seriesId: 'ag94ag',
      tags: 'Test tag',
      title: 'Test item title',
      tracks: [],
    } as PlaylistItem;

    vi.useFakeTimers();
    vi.advanceTimersByTime(500);

    const { container } = await act(() =>
      renderWithRouter(<Cinema item={item} onPlay={() => null} onPause={() => null} open={true} title={item.title} primaryMetadata="Primary metadata" />),
    );

    expect(container).toMatchSnapshot();
  });
});
