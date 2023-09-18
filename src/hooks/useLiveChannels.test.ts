import { describe, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import type { EpgChannel } from '#types/epg';
import useLiveChannels from '#src/hooks/useLiveChannels';
import { createWrapper, waitForWithFakeTimers } from '#test/testUtils';
import type { Playlist } from '#types/playlist';
import livePlaylistFixture from '#test/fixtures/livePlaylist.json';
import epgChannelsFixture from '#test/fixtures/epgChannels.json';
import epgChannelsUpdateFixture from '#test/fixtures/epgChannelsUpdate.json';
import { CONTROLLERS } from '#src/ioc/types';

const livePlaylist: Playlist = livePlaylistFixture;
const schedule: EpgChannel[] = epgChannelsFixture;
const scheduleUpdate: EpgChannel[] = epgChannelsUpdateFixture;

const mockSchedule = vi.fn();

vi.mock('#src/ioc/container', () => ({
  getController: (type: symbol) => {
    switch (type) {
      case CONTROLLERS.Epg:
        return { getSchedules: mockSchedule };
    }
  },
}));

describe('useLiveChannels', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('gets the date using the EPG service getSchedules method', async () => {
    const mock = mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: '' }), {
      wrapper: createWrapper(),
    });

    // initial empty channels
    expect(result.current.channels).toEqual([]);
    expect(result.current.channel).toBeUndefined();
    expect(result.current.program).toBeUndefined();

    await waitForWithFakeTimers();

    expect(mock).toHaveBeenCalledOnce();
    expect(mock).toHaveBeenCalledWith(livePlaylist.playlist);

    // channels are set in state
    expect(result.current.channels).toEqual(schedule);
    // first channel selected
    expect(result.current.channel).toEqual(schedule[0]);
  });

  test('selects the initial channel based of the initialChannelId', async () => {
    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: 'channel2' }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // second channel selected (initial channel id)
    expect(result.current.channel).toEqual(schedule[1]);
  });

  test('selects the live program of the current channel', async () => {
    vi.setSystemTime(new Date('2022-07-15T10:45:00Z'));

    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // select live program on first channel
    expect(result.current.program).toMatchObject({ id: 'program2' });
  });

  test('updates the program automatically when no program was found', async () => {
    vi.setSystemTime(new Date('2022-07-15T09:00:00Z'));

    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // no program is selected
    expect(result.current.program).toBeUndefined();

    // update time to next program
    act(() => {
      vi.setSystemTime(new Date('2022-07-15T10:01:00Z'));
      vi.runOnlyPendingTimers();
    });

    await waitForWithFakeTimers();

    expect(result.current.program).toMatchObject({ id: 'program1' });
  });

  test('updates the program automatically when being live', async () => {
    vi.setSystemTime(new Date('2022-07-15T10:15:00Z'));

    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // first program is selected
    expect(result.current.program).toMatchObject({ id: 'program1' });

    // update time to next program
    act(() => {
      vi.setSystemTime(new Date('2022-07-15T10:31:00Z'));
      vi.runOnlyPendingTimers();
    });
    await waitForWithFakeTimers();

    expect(result.current.program).toMatchObject({ id: 'program2' });
  });

  test("doesn't update the program automatically when not being live", async () => {
    vi.setSystemTime(new Date('2022-07-15T10:15:00Z'));

    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // first program is selected
    expect(result.current.program).toMatchObject({ id: 'program1' });

    // update time to next program
    act(() => {
      vi.setSystemTime(new Date('2022-07-15T10:31:00Z'));
      vi.runOnlyPendingTimers();
    });
    await waitForWithFakeTimers();

    expect(result.current.program).toMatchObject({ id: 'program2' });
  });

  test('updates the channel and program when using the `setChannel` function', async () => {
    vi.setSystemTime(new Date('2022-07-15T10:15:00Z'));

    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // first program is selected
    expect(result.current.program).toMatchObject({ id: 'program1' });

    act(() => {
      result.current.setActiveChannel('channel2');
    });

    // channel 2 should be selected and program 3 which is live
    expect(result.current.channel).toMatchObject({ id: 'channel2' });
    expect(result.current.program).toMatchObject({ id: 'program3' });

    // update channel and program
    act(() => {
      result.current.setActiveChannel('channel1', 'program2');
    });

    expect(result.current.channel).toMatchObject({ id: 'channel1' });
    expect(result.current.program).toMatchObject({ id: 'program2' });
  });

  test("doesn't update the channel or program when using the `setChannel` function with an invalid channelId ", async () => {
    vi.setSystemTime(new Date('2022-07-15T10:15:00Z'));

    mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // first program is selected
    expect(result.current.program).toMatchObject({ id: 'program1' });

    act(() => {
      result.current.setActiveChannel('channel3', 'program5');
    });

    // channel 1 should still be selected
    expect(result.current.channel).toMatchObject({ id: 'channel1' });
    expect(result.current.program).toMatchObject({ id: 'program1' });
  });

  test('updates the channel and program when the data changes', async () => {
    vi.setSystemTime(new Date('2022-07-15T10:15:00Z'));

    const mock = mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // first program is selected
    expect(result.current.program).toMatchObject({ id: 'program1' });
    expect(result.current.channel?.programs.length).toBe(2);
    expect(mock).toHaveBeenCalledTimes(1);

    mock.mockResolvedValue(scheduleUpdate);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    await waitForWithFakeTimers();

    // the endTime for program1 should be changed
    expect(mock).toHaveBeenCalledTimes(2);
    expect(result.current.channel?.programs.length).toBe(3);
    expect(result.current.program).toMatchObject({ id: 'program1', endTime: '2022-07-15T10:45:00Z' });
  });

  test('updates the channel and program when the data changes', async () => {
    vi.setSystemTime(new Date('2022-07-15T11:05:00Z'));

    const mock = mockSchedule.mockResolvedValue(schedule);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // no program is selected (we have an outdated schedule)
    expect(result.current.program).toBeUndefined();
    expect(mock).toHaveBeenCalledTimes(1);

    mock.mockResolvedValue(scheduleUpdate);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    await waitForWithFakeTimers();

    // the program should be updated to the live program with the updated data
    expect(mock).toHaveBeenCalledTimes(2);
    expect(result.current.program).toMatchObject({ id: 'program5' });
  });

  test("clears the program when the current program get's removed from the data", async () => {
    vi.setSystemTime(new Date('2022-07-15T11:05:00Z'));

    // start with update schedule (which has more programs)
    const mock = mockSchedule.mockResolvedValue(scheduleUpdate);
    const { result } = renderHook(() => useLiveChannels({ playlist: livePlaylist.playlist, initialChannelId: undefined }), {
      wrapper: createWrapper(),
    });

    await waitForWithFakeTimers();

    // program 5 is selected
    expect(result.current.program).toMatchObject({ id: 'program5' });

    // we use the default schedule data which doesn't have program5
    mock.mockResolvedValue(schedule);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    await waitForWithFakeTimers();

    // the program should be undefined since it couldn't be found in the latest data
    expect(mock).toHaveBeenCalledTimes(2);
    expect(result.current.program).toBeUndefined();
  });
});
