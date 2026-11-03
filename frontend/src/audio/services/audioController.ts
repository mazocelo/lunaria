import { apiClient } from '../../services/ApiClient';
import { AudioRegistry, type PreparedAudioEntry } from './audioRegistry';
import { createAudioPlaylist, type AudioPlaylist, type AudioPlaylistInput } from '../domain/playlist';
import {
  createNarrationTrackRef,
  getTrackDisplayLabel,
  normalizeLegacyNarrationItem,
  type AudioTrackRef,
  type AudioTrackRefInput,
} from '../domain/trackRef';

const DEFAULT_TTS_PROVIDER: string = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];
const MAX_TTS_TEXT_LENGTH = 4500;

interface SequenceState {
  token: number | null;
  preparing: boolean;
  waitingForNext: boolean;
  lastFinishedIndex: number;
  playlistId: string | null;
}

const EMPTY_SEQUENCE_STATE: SequenceState = {
  token: null,
  preparing: false,
  waitingForNext: false,
  lastFinishedIndex: -1,
  playlistId: null,
};

export interface QueueItem {
  trackId: string;
  label: string;
  speakerLabel: string | null;
  kindLabel: string;
  status: 'pending' | 'active' | 'completed' | 'preparing' | 'ready';
  isPlaying: boolean;
}

export interface AudioControllerState {
  isPlaying: boolean;
  isLoading: boolean;
  canTogglePlayback: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentMessageId: string | null;
  currentSegmentId: string | null;
  currentTrackId: string | null;
  currentPlaylistId: string | null;
  currentPlaylist: AudioPlaylist | null;
  currentTrack: AudioTrackRef | null;
  currentSequenceKey: string | null;
  queueIndex: number;
  currentChunkIndex: number;
  isSequence: boolean;
  generatingMessageId: string | null;
  loadingTargetId: string | null;
  loadingSegmentId: string | null;
  loadingSequenceKey: string | null;
  preparingOwnerId: string | null;
  waitingForNext: boolean;
  lastError: string | null;
  errorMessageId: string | null;
  queueItems: QueueItem[];
  queueOpen: boolean;
}

interface QueueEntry extends PreparedAudioEntry {
  queueIndex: number;
}

interface PlayOptions {
  forceRegenerate?: boolean;
  allowGenerate?: boolean;
  playlistId?: string | null;
  title?: string | null;
  source?: string | null;
  contextLabel?: string | null;
  segmentId?: string | number | null;
  sequenceKey?: string | null;
  hasPersistedAudio?: boolean;
  emotion?: string | null;
  kind?: string;
  speakerLabel?: string | null;
  [key: string]: unknown;
}

interface PrepareOptions {
  allowGenerate?: boolean;
  forceRegenerate?: boolean;
  requestToken?: number | null;
}

interface PreparedEntryInput {
  trackId?: string | number | null;
  messageId?: string | number | null;
  segmentId?: string | number | null;
  speakerLabel?: string | null;
  text?: string;
  speechText?: string;
  urls?: string[];
}

interface RegisterPlaylistInput {
  playlistId: string;
  ownerId: string | null;
  ownerType?: string;
  tracks?: AudioTrackRefInput[];
  title?: string;
  source?: string;
  contextLabel?: string | null;
}

function splitTextForTts(text: string | null | undefined, maxLength: number = MAX_TTS_TEXT_LENGTH): string[] {
  const normalized = String(text || '').trim();
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushChunk = () => {
    if (current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
  };

  const appendPiece = (piece: string) => {
    const trimmed = piece.trim();
    if (!trimmed) return;

    if (trimmed.length > maxLength) {
      pushChunk();
      for (let index = 0; index < trimmed.length; index += maxLength) {
        chunks.push(trimmed.slice(index, index + maxLength));
      }
      return;
    }

    const candidate = current ? `${current} ${trimmed}` : trimmed;
    if (candidate.length > maxLength) {
      pushChunk();
      current = trimmed;
      return;
    }

    current = candidate;
  };

  paragraphs.forEach((paragraph) => {
    if (paragraph.length <= maxLength) {
      appendPiece(paragraph);
      return;
    }

    const sentences = paragraph
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      appendPiece(paragraph);
      return;
    }

    sentences.forEach(appendPiece);
  });

  pushChunk();
  return chunks;
}

function createAudioUrlsFromBlob(blob: Blob): string {
  return URL.createObjectURL(blob);
}

function flattenPreparedEntries(entries: PreparedEntryInput[] = []): PreparedAudioEntry[] {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    trackId: String(entry.trackId ?? ''),
    messageId: entry.messageId == null ? null : String(entry.messageId),
    segmentId: entry.segmentId == null ? null : String(entry.segmentId),
    speakerLabel: entry.speakerLabel || null,
    text: entry.text || '',
    speechText: entry.speechText || entry.text || '',
    urls: Array.isArray(entry.urls) ? entry.urls : [],
  }));
}

class AudioController {
  registry: AudioRegistry;
  listeners: Set<() => void>;
  audio: HTMLAudioElement | null;
  playToken: number;
  queue: QueueEntry[];
  preparingTrackIds: Set<string>;
  sequenceState: SequenceState;
  state: AudioControllerState;

  constructor() {
    this.registry = new AudioRegistry();
    this.listeners = new Set();
    this.audio = null;
    this.playToken = 0;
    this.queue = [];
    this.preparingTrackIds = new Set();
    this.sequenceState = { ...EMPTY_SEQUENCE_STATE };
    this.state = this.buildState();

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.registry.revokeAllPrepared();
      });
    }
  }

  buildQueueItems(
    playlist: AudioPlaylist | null,
    currentTrackId: string | null,
    queueIndex: number,
    isPlaying: boolean
  ): QueueItem[] {
    if (!playlist?.trackIds?.length) return [];

    return playlist.trackIds.map((trackId, index): QueueItem => {
      const track = this.registry.getTrack(trackId);
      const isPrepared = this.registry.hasPrepared(trackId);
      const isActive = String(trackId) === String(currentTrackId);
      const isCompleted = queueIndex > index;
      const isPreparing = this.preparingTrackIds.has(String(trackId));

      let status: QueueItem['status'] = 'pending';
      if (isActive) status = 'active';
      else if (isCompleted) status = 'completed';
      else if (isPreparing) status = 'preparing';
      else if (isPrepared) status = 'ready';

      return {
        trackId: String(trackId),
        label: getTrackDisplayLabel(track),
        speakerLabel: track?.speakerLabel || null,
        kindLabel: track?.kind === 'npc_dialogue' ? 'NPC' : 'Narracao',
        status,
        isPlaying: isActive && Boolean(isPlaying),
      };
    });
  }

  buildState(patch: Partial<AudioControllerState> = {}): AudioControllerState {
    const previous = this.state || ({} as Partial<AudioControllerState>);
    const currentPlaylistId = patch.currentPlaylistId ?? previous.currentPlaylistId ?? null;
    const currentTrackId = patch.currentTrackId ?? previous.currentTrackId ?? null;
    const currentPlaylist = currentPlaylistId ? this.registry.getPlaylist(currentPlaylistId) : null;
    const currentTrack = currentTrackId ? this.registry.getTrack(currentTrackId) : null;

    const defaults: AudioControllerState = {
      isPlaying: false,
      isLoading: false,
      canTogglePlayback: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      currentMessageId: null,
      currentSegmentId: null,
      currentTrackId: null,
      currentPlaylistId: null,
      currentPlaylist: null,
      currentTrack: null,
      currentSequenceKey: null,
      queueIndex: -1,
      currentChunkIndex: 0,
      isSequence: false,
      generatingMessageId: null,
      loadingTargetId: null,
      loadingSegmentId: null,
      loadingSequenceKey: null,
      preparingOwnerId: null,
      waitingForNext: false,
      lastError: null,
      errorMessageId: null,
      queueItems: [],
      queueOpen: false,
    };

    const merged: AudioControllerState = {
      ...defaults,
      ...previous,
      ...patch,
    };

    merged.currentPlaylistId = currentPlaylistId;
    merged.currentTrackId = currentTrackId;
    merged.currentPlaylist = currentPlaylist;
    merged.currentTrack = currentTrack;
    merged.currentSequenceKey = patch.currentSequenceKey ?? currentPlaylistId;
    merged.isSequence = patch.isSequence ?? Boolean(currentPlaylist && currentPlaylist.trackIds.length > 1);
    merged.queueItems = this.buildQueueItems(
      currentPlaylist,
      currentTrackId,
      patch.queueIndex ?? previous.queueIndex ?? -1,
      patch.isPlaying ?? previous.isPlaying ?? false
    );

    return merged;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  emit = (): void => {
    this.listeners.forEach((listener) => listener());
  };

  getState = (): AudioControllerState => this.state;

  setState = (patch: Partial<AudioControllerState> = {}): void => {
    this.state = this.buildState(patch);
    this.emit();
  };

  clearError = (): void => {
    this.setState({ lastError: null, errorMessageId: null });
  };

  setQueueOpen = (value: boolean): void => {
    this.setState({ queueOpen: Boolean(value) });
  };

  toggleQueue = (): void => {
    this.setState({ queueOpen: !this.state.queueOpen });
  };

  getTrack = (trackId: string | number | null | undefined): AudioTrackRef | null =>
    this.registry.getTrack(trackId);

  getPlaylist = (playlistId: string | number | null | undefined): AudioPlaylist | null =>
    this.registry.getPlaylist(playlistId);

  detachAudioHandlers(audio: HTMLAudioElement | null): void {
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.onpause = null;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
  }

  resetAudio(resetProgress = true): void {
    if (this.audio) {
      this.audio.pause();
      this.detachAudioHandlers(this.audio);
      this.audio = null;
    }

    if (resetProgress) {
      this.setState({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      });
    }
  }

  clearPlayback = (clearMessage = true): void => {
    this.playToken += 1;
    this.resetAudio(true);
    this.queue = [];
    this.sequenceState = { ...EMPTY_SEQUENCE_STATE };
    this.preparingTrackIds.clear();

    const patch: Partial<AudioControllerState> = {
      isLoading: false,
      canTogglePlayback: false,
      currentPlaylistId: null,
      currentSequenceKey: null,
      currentTrackId: null,
      queueIndex: -1,
      currentChunkIndex: 0,
      isSequence: false,
      loadingTargetId: null,
      loadingSegmentId: null,
      loadingSequenceKey: null,
      preparingOwnerId: null,
      waitingForNext: false,
      queueItems: [],
    };

    if (clearMessage) {
      patch.currentMessageId = null;
      patch.currentSegmentId = null;
    } else {
      patch.currentSegmentId = null;
    }

    this.setState(patch);
  };

  applyPlaybackRate = (audio: HTMLAudioElement | null): void => {
    if (!audio) return;
    const rate = this.state.playbackRate || 1;
    audio.playbackRate = rate;
    const ext = audio as HTMLAudioElement & {
      preservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
      mozPreservesPitch?: boolean;
    };
    ext.preservesPitch = true;
    ext.webkitPreservesPitch = true;
    ext.mozPreservesPitch = true;
  };

  playQueueEntry = (entry: QueueEntry | null, token: number, chunkIndex = 0): void => {
    if (!entry || token !== this.playToken) return;
    const urls = Array.isArray(entry.urls) ? entry.urls : [];
    const currentUrl = urls[chunkIndex];
    if (!currentUrl) return;

    if (this.audio) {
      this.audio.pause();
      this.detachAudioHandlers(this.audio);
      this.audio = null;
    }

    const audio = new Audio(currentUrl);
    this.audio = audio;
    this.applyPlaybackRate(audio);

    const track = this.registry.getTrack(entry.trackId);

    this.setState({
      canTogglePlayback: true,
      isLoading: false,
      currentTrackId: entry.trackId,
      currentPlaylistId: this.sequenceState.playlistId || this.state.currentPlaylistId,
      currentMessageId: track?.messageId ?? entry.messageId ?? null,
      currentSegmentId: track?.segmentId ?? entry.segmentId ?? null,
      queueIndex: entry.queueIndex,
      currentChunkIndex: chunkIndex,
      currentTime: 0,
      duration: 0,
      waitingForNext: false,
    });

    audio.onended = () => {
      if (token !== this.playToken) return;

      const hasNextChunk = chunkIndex < (urls.length - 1);
      if (hasNextChunk) {
        this.playQueueEntry(entry, token, chunkIndex + 1);
        return;
      }

      const nextEntry = this.queue[entry.queueIndex + 1] || null;
      this.detachAudioHandlers(audio);
      if (this.audio === audio) {
        this.audio = null;
      }

      if (nextEntry) {
        this.playQueueEntry(nextEntry, token);
        return;
      }

      if (this.sequenceState.token === token && this.sequenceState.preparing) {
        this.sequenceState.waitingForNext = true;
        this.sequenceState.lastFinishedIndex = entry.queueIndex;
        this.setState({
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          currentSegmentId: null,
          currentChunkIndex: 0,
          canTogglePlayback: false,
          waitingForNext: true,
        });
        return;
      }

      this.clearPlayback(true);
    };

    audio.onerror = () => {
      if (token !== this.playToken) return;
      this.clearPlayback(true);
    };

    audio.onplay = () => this.setState({ isPlaying: true });
    audio.onpause = () => this.setState({ isPlaying: false });
    audio.ontimeupdate = () => this.setState({ currentTime: audio.currentTime || 0 });
    audio.onloadedmetadata = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      this.setState({ duration: nextDuration });
    };

    audio.play()
      .then(() => this.setState({ isPlaying: true }))
      .catch(() => this.clearPlayback(true));
  };

  async prepareTrack(
    track: AudioTrackRef,
    options: PrepareOptions = {}
  ): Promise<(PreparedAudioEntry & AudioTrackRef) | null> {
    const {
      allowGenerate = true,
      forceRegenerate = false,
      requestToken = null,
    } = options;

    if (!(track?.speechText || track?.text) || !track?.voiceId) return null;
    if (requestToken != null && requestToken !== this.playToken) return null;

    if (forceRegenerate) {
      this.registry.revokePrepared(track.trackId);
    }

    const cached = this.registry.getPrepared(track.trackId);
    if (cached?.urls?.length) {
      return {
        ...cached,
        ...track,
      };
    }

    if (!allowGenerate) return null;

    this.preparingTrackIds.add(String(track.trackId));
    this.setState({ isLoading: true });

    const spokenText = String(track.speechText || track.text || '').trim();
    const chunks = splitTextForTts(spokenText);
    const urls: string[] = [];

    try {
      for (const chunk of chunks) {
        if (requestToken != null && requestToken !== this.playToken) {
          urls.forEach((url) => URL.revokeObjectURL(url));
          return null;
        }

        const body: Record<string, unknown> = {
          text: chunk,
          voiceId: track.voiceId,
          provider: track.provider || DEFAULT_TTS_PROVIDER,
        };
        if (track.emotion) body.emotion = track.emotion;

        const response = await apiClient.post('/tts/generate', body, { responseType: 'blob' });
        const blob = response instanceof Blob
          ? response
          : new Blob([response as BlobPart], { type: 'audio/mpeg' });
        urls.push(createAudioUrlsFromBlob(blob));
      }

      if (requestToken != null && requestToken !== this.playToken) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return null;
      }

      const entry: PreparedAudioEntry = {
        trackId: track.trackId,
        messageId: track.messageId,
        segmentId: track.segmentId,
        speakerLabel: track.speakerLabel,
        text: track.text,
        speechText: spokenText,
        urls,
      };
      this.registry.setPrepared(track.trackId, entry);
      return {
        ...entry,
        ...track,
      };
    } finally {
      this.preparingTrackIds.delete(String(track.trackId));
      this.setState({
        isLoading: this.preparingTrackIds.size > 0,
      });
    }
  }

  buildQueueEntries(entries: PreparedEntryInput[] = []): QueueEntry[] {
    return flattenPreparedEntries(entries).map((entry, index) => ({
      ...entry,
      queueIndex: index,
    }));
  }

  appendQueueEntries(entries: PreparedEntryInput[] = []): QueueEntry[] {
    const flattened = flattenPreparedEntries(entries);
    if (!flattened.length) return this.queue;

    const startIndex = this.queue.length;
    const appended = flattened.map((entry, index) => ({
      ...entry,
      queueIndex: startIndex + index,
    }));

    this.queue = [...this.queue, ...appended];
    return this.queue;
  }

  registerPlaylistWithTracks({
    playlistId,
    ownerId,
    ownerType = 'playlist',
    tracks = [],
    title = 'Narracao',
    source = 'custom',
    contextLabel = null,
  }: RegisterPlaylistInput): { playlist: AudioPlaylist; tracks: AudioTrackRef[] } {
    const normalizedTracks = this.registry.registerTracks(
      tracks.map((track, index) => normalizeLegacyNarrationItem(track, {
        ownerId,
        ownerType,
        order: index,
        sequenceKey: playlistId,
        source,
        title,
      }))
    );

    const playlist = createAudioPlaylist({
      playlistId,
      ownerId,
      ownerType,
      title,
      source,
      contextLabel,
      trackIds: normalizedTracks.map((track) => track.trackId),
      status: 'preparing',
    });

    this.registry.registerPlaylist(playlist);
    return { playlist, tracks: normalizedTracks };
  }

  playTrack = async (trackInput: AudioTrackRefInput, options: PlayOptions = {}): Promise<boolean> => {
    const normalizedTrack = normalizeLegacyNarrationItem(trackInput, {
      ownerId: trackInput?.ownerId ?? trackInput?.messageId,
      ownerType: trackInput?.segmentId ? 'segment' : 'message',
    });

    const playlistId = options.playlistId || normalizedTrack.trackId;
    const { playlist, tracks } = this.registerPlaylistWithTracks({
      playlistId,
      ownerId: normalizedTrack.ownerId || normalizedTrack.messageId,
      ownerType: normalizedTrack.ownerType,
      tracks: [normalizedTrack],
      title: options.title || normalizedTrack.speakerLabel || 'Trecho',
      source: options.source || 'single_track',
      contextLabel: options.contextLabel || 'Trecho',
    });

    return this.playPlaylist(playlist, tracks, options);
  };

  playPlaylist = async (
    playlistInput: AudioPlaylist | AudioPlaylistInput,
    tracksInput: AudioTrackRef[] = [],
    options: PlayOptions = {}
  ): Promise<boolean> => {
    const normalizedPlaylist: AudioPlaylist = ('playlistId' in playlistInput) && playlistInput.playlistId
      ? (playlistInput as AudioPlaylist)
      : createAudioPlaylist(playlistInput || {});
    const tracks = tracksInput.length > 0
      ? tracksInput
      : normalizedPlaylist.trackIds
          .map((trackId) => this.registry.getTrack(trackId))
          .filter((track): track is AudioTrackRef => track !== null);

    const validTracks = tracks.filter((track) => track?.text && track?.voiceId);
    if (!validTracks.length) return false;

    const isSamePlaylist = this.state.currentPlaylistId === normalizedPlaylist.playlistId && this.queue.length > 0;
    const sequenceInFlight = this.sequenceState.preparing || this.sequenceState.waitingForNext;

    if (!options.forceRegenerate && isSamePlaylist && this.audio) {
      this.togglePause();
      return true;
    }

    if (!options.forceRegenerate && isSamePlaylist && sequenceInFlight) {
      return true;
    }

    this.clearPlayback(true);

    const requestToken = this.playToken + 1;
    this.playToken = requestToken;
    this.sequenceState = {
      token: requestToken,
      preparing: true,
      waitingForNext: false,
      lastFinishedIndex: -1,
      playlistId: normalizedPlaylist.playlistId,
    };

    this.setState({
      isLoading: true,
      loadingTargetId: normalizedPlaylist.ownerId,
      loadingSegmentId: null,
      loadingSequenceKey: normalizedPlaylist.playlistId,
      preparingOwnerId: normalizedPlaylist.ownerId,
      currentPlaylistId: null,
      currentSequenceKey: null,
      queueIndex: -1,
      isSequence: validTracks.length > 1,
    });

    let firstPrepared: (PreparedAudioEntry & AudioTrackRef) | null = null;
    let firstPreparedIndex = -1;

    try {
      for (let index = 0; index < validTracks.length; index += 1) {
        const track = validTracks[index];
        let prepared: (PreparedAudioEntry & AudioTrackRef) | null = null;

        try {
          prepared = await this.prepareTrack(track, {
            allowGenerate: options.allowGenerate ?? true,
            forceRegenerate: options.forceRegenerate ?? false,
            requestToken,
          });
        } catch (error) {
          if (requestToken !== this.playToken) return false;
          console.error('Audio playlist prepare error:', (error as Error).message);
          continue;
        }

        if (requestToken !== this.playToken) return false;
        if (!prepared) continue;

        firstPrepared = prepared;
        firstPreparedIndex = index;
        break;
      }

      if (!firstPrepared) {
        this.sequenceState = { ...EMPTY_SEQUENCE_STATE };
        this.clearPlayback(true);
        return false;
      }

      this.registry.registerPlaylist({
        ...normalizedPlaylist,
        trackIds: validTracks.map((track) => track.trackId),
        status: 'playing',
      });

      this.queue = this.buildQueueEntries([firstPrepared]);
      this.setState({
        currentPlaylistId: normalizedPlaylist.playlistId,
        currentSequenceKey: normalizedPlaylist.playlistId,
        isSequence: validTracks.length > 1,
        isLoading: false,
      });

      this.playQueueEntry(this.queue[0], requestToken);

      const prepareRemainingTracks = async () => {
        for (let index = firstPreparedIndex + 1; index < validTracks.length; index += 1) {
          const track = validTracks[index];
          let prepared: (PreparedAudioEntry & AudioTrackRef) | null = null;

          try {
            prepared = await this.prepareTrack(track, {
              allowGenerate: options.allowGenerate ?? true,
              forceRegenerate: options.forceRegenerate ?? false,
              requestToken,
            });
          } catch (error) {
            if (requestToken !== this.playToken) return;
            console.error('Audio playlist prepare error:', (error as Error).message);
            continue;
          }

          if (requestToken !== this.playToken) return;
          if (!prepared) continue;

          this.appendQueueEntries([prepared]);
          this.setState({});

          if (this.sequenceState.token === requestToken && this.sequenceState.waitingForNext) {
            const nextEntry = this.queue[this.sequenceState.lastFinishedIndex + 1] || null;
            if (nextEntry) {
              this.sequenceState.waitingForNext = false;
              this.playQueueEntry(nextEntry, requestToken);
            }
          }
        }

        if (requestToken !== this.playToken) return;

        if (this.sequenceState.waitingForNext) {
          const nextEntry = this.queue[this.sequenceState.lastFinishedIndex + 1] || null;
          if (nextEntry) {
            this.sequenceState.waitingForNext = false;
            this.sequenceState.preparing = false;
            this.setState({
              isLoading: false,
              loadingTargetId: null,
              loadingSegmentId: null,
              loadingSequenceKey: null,
              preparingOwnerId: null,
            });
            this.playQueueEntry(nextEntry, requestToken);
            return;
          }

          this.clearPlayback(true);
          return;
        }

        this.sequenceState.preparing = false;
        this.setState({
          isLoading: false,
          loadingTargetId: null,
          loadingSegmentId: null,
          loadingSequenceKey: null,
          preparingOwnerId: null,
        });
      };

      void prepareRemainingTracks();
      return true;
    } catch (error) {
      if (requestToken !== this.playToken) return false;
      const err = error as Error;
      console.error('Audio playlist error:', err.message);
      this.sequenceState = { ...EMPTY_SEQUENCE_STATE };
      this.setState({
        lastError: err.message || 'Erro ao reproduzir audio',
        errorMessageId: normalizedPlaylist.ownerId,
      });
      this.clearPlayback(true);
      return false;
    }
  };

  generateTrack = async (trackInput: AudioTrackRefInput, options: PlayOptions = {}): Promise<boolean> => {
    const track = normalizeLegacyNarrationItem(trackInput, {
      ownerId: trackInput?.ownerId ?? trackInput?.messageId,
      ownerType: trackInput?.segmentId ? 'segment' : 'message',
    });

    this.registry.registerTrack(track);
    this.setState({
      generatingMessageId: track.ownerId || track.messageId,
      lastError: null,
      errorMessageId: null,
    });

    try {
      const prepared = await this.prepareTrack(track, {
        allowGenerate: true,
        forceRegenerate: options.forceRegenerate ?? false,
      });
      return Boolean(prepared);
    } catch (error) {
      const err = error as Error;
      this.setState({
        lastError: err.message || 'Erro ao gerar audio',
        errorMessageId: track.ownerId || track.messageId,
      });
      return false;
    } finally {
      this.setState({ generatingMessageId: null });
    }
  };

  generatePlaylist = async (
    items: AudioTrackRefInput[] = [],
    ownerId: string | number | null,
    options: PlayOptions = {}
  ): Promise<boolean> => {
    const tracks = items
      .map((item, index) => normalizeLegacyNarrationItem(item, {
        ownerId,
        order: index,
        ownerType: item.segmentId ? 'segment' : 'message',
      }))
      .filter((track) => track.text && track.voiceId);

    if (!tracks.length) return false;

    this.registry.registerTracks(tracks);
    this.setState({
      generatingMessageId: ownerId == null ? null : String(ownerId),
      lastError: null,
      errorMessageId: null,
    });

    try {
      for (const track of tracks) {
        await this.prepareTrack(track, {
          allowGenerate: true,
          forceRegenerate: options.forceRegenerate ?? false,
        });
      }
      return true;
    } catch (error) {
      const err = error as Error;
      this.setState({
        lastError: err.message || 'Erro ao gerar audio',
        errorMessageId: ownerId == null ? null : String(ownerId),
      });
      return false;
    } finally {
      this.setState({ generatingMessageId: null });
    }
  };

  play = async (
    text: string,
    voiceId: string,
    messageId: string | number,
    provider: string = DEFAULT_TTS_PROVIDER,
    options: PlayOptions = {}
  ): Promise<boolean> => {
    const track = createNarrationTrackRef({
      messageId,
      segmentId: options.segmentId || null,
      ownerId: messageId,
      ownerType: options.segmentId ? 'segment' : 'message',
      text,
      voiceId,
      provider,
      emotion: options.emotion || null,
      hasPersistedAudio: options.hasPersistedAudio || false,
      kind: options.kind || 'narration',
      speakerLabel: options.speakerLabel || null,
    });

    const currentSameTrack = String(this.state.currentTrackId || '') === String(track.trackId);
    if (!options.forceRegenerate && currentSameTrack && this.audio) {
      this.togglePause();
      return true;
    }

    return this.playTrack(track, {
      allowGenerate: options.allowGenerate ?? true,
      forceRegenerate: options.forceRegenerate ?? false,
      playlistId: track.trackId,
      title: track.speakerLabel || 'Trecho',
      source: 'single_track',
      contextLabel: 'Trecho',
    });
  };

  playSequence = async (
    items: AudioTrackRefInput[] = [],
    ownerId: string | number | null,
    options: PlayOptions = {}
  ): Promise<boolean> => {
    const sequenceKey = options.sequenceKey || `sequence:${ownerId}`;
    const title = options.title || 'Narracao';
    const source = options.source || 'sequence';

    const { playlist, tracks } = this.registerPlaylistWithTracks({
      playlistId: sequenceKey,
      ownerId: ownerId == null ? null : String(ownerId),
      ownerType: 'playlist',
      tracks: items,
      title,
      source,
      contextLabel: options.contextLabel || title,
    });

    return this.playPlaylist(playlist, tracks, options);
  };

  generate = async (
    text: string,
    voiceId: string,
    messageId: string | number,
    provider: string = DEFAULT_TTS_PROVIDER,
    options: PlayOptions = {}
  ): Promise<boolean> => {
    const track = createNarrationTrackRef({
      messageId,
      segmentId: options.segmentId || null,
      ownerId: messageId,
      ownerType: options.segmentId ? 'segment' : 'message',
      text,
      voiceId,
      provider,
      emotion: options.emotion || null,
      hasPersistedAudio: options.hasPersistedAudio || false,
      kind: options.kind || 'narration',
    });

    return this.generateTrack(track, options);
  };

  generateSequence = async (
    items: AudioTrackRefInput[] = [],
    ownerId: string | number | null,
    options: PlayOptions = {}
  ): Promise<boolean> => {
    return this.generatePlaylist(items, ownerId, options);
  };

  togglePause = (): void => {
    if (!this.audio) return;

    if (this.audio.paused) {
      this.audio.play().catch(() => this.clearPlayback(true));
      return;
    }

    this.audio.pause();
  };

  stop = (): void => {
    if (this.audio) {
      try {
        this.audio.currentTime = 0;
      } catch {
        // no-op
      }
    }
    this.clearPlayback(true);
  };

  seekTo = (value: number | string): void => {
    if (!this.audio) return;
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    this.audio.currentTime = next;
    this.setState({ currentTime: next });
  };

  cyclePlaybackRate = (): void => {
    const currentIndex = SPEED_STEPS.indexOf(this.state.playbackRate);
    const nextRate = currentIndex === -1 || currentIndex === SPEED_STEPS.length - 1
      ? SPEED_STEPS[0]
      : SPEED_STEPS[currentIndex + 1];
    this.setState({ playbackRate: nextRate });
    this.applyPlaybackRate(this.audio);
  };

  next = (): void => {
    if (!this.queue.length) return;
    const nextEntry = this.queue[(this.state.queueIndex ?? -1) + 1] || null;
    if (!nextEntry) return;
    this.playQueueEntry(nextEntry, this.playToken);
  };

  previous = (): void => {
    if (!this.queue.length) return;

    const currentEntry = this.queue[this.state.queueIndex] || null;
    const restartCurrentTrack = (this.audio && (this.audio.currentTime || 0) > 3) || (this.state.currentChunkIndex || 0) > 0;

    if (restartCurrentTrack && currentEntry) {
      this.playQueueEntry(currentEntry, this.playToken, 0);
      return;
    }

    const previousIndex = Math.max(0, (this.state.queueIndex ?? 0) - 1);
    const previousEntry = this.queue[previousIndex] || null;
    if (!previousEntry) return;
    this.playQueueEntry(previousEntry, this.playToken);
  };

  hasAudioForItem = (itemKey: string | number | null | undefined): boolean =>
    this.registry.hasPrepared(itemKey);

  hasAudioForMessage = (messageId: string | number | null | undefined): boolean => {
    if (this.registry.hasPreparedForMessage(messageId)) return true;
    return String(this.state.currentMessageId) === String(messageId);
  };
}

export const audioController = new AudioController();
