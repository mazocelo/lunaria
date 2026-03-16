import { apiClient } from '../../services/ApiClient.js';
import { AudioRegistry } from './audioRegistry.js';
import { createAudioPlaylist } from '../domain/playlist.js';
import { createNarrationTrackRef, getTrackDisplayLabel, normalizeLegacyNarrationItem } from '../domain/trackRef.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];
const MAX_TTS_TEXT_LENGTH = 4500;
const EMPTY_SEQUENCE_STATE = {
  token: null,
  preparing: false,
  waitingForNext: false,
  lastFinishedIndex: -1,
  playlistId: null,
};

function splitTextForTts(text, maxLength = MAX_TTS_TEXT_LENGTH) {
  const normalized = String(text || '').trim();
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  const pushChunk = () => {
    if (current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
  };

  const appendPiece = (piece) => {
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

function createAudioUrlsFromBlob(blob) {
  return URL.createObjectURL(blob);
}

function flattenPreparedEntries(entries = []) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({
    trackId: entry.trackId,
    messageId: entry.messageId,
    segmentId: entry.segmentId || null,
    speakerLabel: entry.speakerLabel || null,
    text: entry.text,
    urls: Array.isArray(entry.urls) ? entry.urls : [],
  }));
}

class AudioController {
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

  buildQueueItems(playlist, currentTrackId, queueIndex, isPlaying) {
    if (!playlist?.trackIds?.length) return [];

    return playlist.trackIds.map((trackId, index) => {
      const track = this.registry.getTrack(trackId);
      const isPrepared = this.registry.hasPrepared(trackId);
      const isActive = String(trackId) === String(currentTrackId);
      const isCompleted = queueIndex > index;
      const isPreparing = this.preparingTrackIds.has(String(trackId));

      let status = 'pending';
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

  buildState(patch = {}) {
    const previous = this.state || {};
    const currentPlaylistId = patch.currentPlaylistId ?? previous.currentPlaylistId ?? null;
    const currentTrackId = patch.currentTrackId ?? previous.currentTrackId ?? null;
    const currentPlaylist = currentPlaylistId ? this.registry.getPlaylist(currentPlaylistId) : null;
    const currentTrack = currentTrackId ? this.registry.getTrack(currentTrackId) : null;

    return {
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
      ...previous,
      ...patch,
      currentPlaylistId,
      currentTrackId,
        currentPlaylist,
        currentTrack,
        currentSequenceKey: patch.currentSequenceKey ?? currentPlaylistId,
      isSequence: patch.isSequence ?? Boolean(currentPlaylist && currentPlaylist.trackIds.length > 1),
      queueItems: this.buildQueueItems(
        currentPlaylist,
        currentTrackId,
        patch.queueIndex ?? previous.queueIndex ?? -1,
        patch.isPlaying ?? previous.isPlaying ?? false
      ),
    };
  }

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  emit = () => {
    this.listeners.forEach((listener) => listener());
  };

  getState = () => this.state;

  setState = (patch = {}) => {
    this.state = this.buildState(patch);
    this.emit();
  };

  clearError = () => {
    this.setState({ lastError: null, errorMessageId: null });
  };

  setQueueOpen = (value) => {
    this.setState({ queueOpen: Boolean(value) });
  };

  toggleQueue = () => {
    this.setState({ queueOpen: !this.state.queueOpen });
  };

  getTrack = (trackId) => this.registry.getTrack(trackId);

  getPlaylist = (playlistId) => this.registry.getPlaylist(playlistId);

  detachAudioHandlers(audio) {
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.onpause = null;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
  }

  resetAudio(resetProgress = true) {
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

  clearPlayback = (clearMessage = true) => {
    this.playToken += 1;
    this.resetAudio(true);
    this.queue = [];
    this.sequenceState = { ...EMPTY_SEQUENCE_STATE };
    this.preparingTrackIds.clear();

    const patch = {
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

  applyPlaybackRate = (audio) => {
    if (!audio) return;
    const rate = this.state.playbackRate || 1;
    audio.playbackRate = rate;
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.mozPreservesPitch = true;
  };

  playQueueEntry = (entry, token, chunkIndex = 0) => {
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

  async prepareTrack(track, options = {}) {
    const {
      allowGenerate = true,
      forceRegenerate = false,
      requestToken = null,
    } = options;

    if (!track?.text || !track?.voiceId) return null;
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

    const chunks = splitTextForTts(track.text);
    const urls = [];

    try {
      for (const chunk of chunks) {
        if (requestToken != null && requestToken !== this.playToken) {
          urls.forEach((url) => URL.revokeObjectURL(url));
          return null;
        }

        const body = {
          text: chunk,
          voiceId: track.voiceId,
          provider: track.provider || DEFAULT_TTS_PROVIDER,
        };
        if (track.emotion) body.emotion = track.emotion;

        const response = await apiClient.post('/tts/generate', body, { responseType: 'blob' });
        const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
        urls.push(createAudioUrlsFromBlob(blob));
      }

      if (requestToken != null && requestToken !== this.playToken) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return null;
      }

      const entry = {
        trackId: track.trackId,
        messageId: track.messageId,
        segmentId: track.segmentId,
        speakerLabel: track.speakerLabel,
        text: track.text,
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

  buildQueueEntries(entries = []) {
    return flattenPreparedEntries(entries).map((entry, index) => ({
      ...entry,
      queueIndex: index,
    }));
  }

  appendQueueEntries(entries = []) {
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

  registerPlaylistWithTracks({ playlistId, ownerId, ownerType = 'playlist', tracks = [], title = 'Narracao', source = 'custom', contextLabel = null }) {
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

  playTrack = async (trackInput, options = {}) => {
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

  playPlaylist = async (playlistInput, tracksInput = [], options = {}) => {
    const normalizedPlaylist = playlistInput?.playlistId
      ? playlistInput
      : createAudioPlaylist(playlistInput || {});
    const tracks = tracksInput.length > 0
      ? tracksInput
      : normalizedPlaylist.trackIds.map((trackId) => this.registry.getTrack(trackId)).filter(Boolean);

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

    let firstPrepared = null;
    let firstPreparedIndex = -1;

    try {
      for (let index = 0; index < validTracks.length; index += 1) {
        const track = validTracks[index];
        let prepared = null;

        try {
          prepared = await this.prepareTrack(track, {
            allowGenerate: options.allowGenerate ?? true,
            forceRegenerate: options.forceRegenerate ?? false,
            requestToken,
          });
        } catch (error) {
          if (requestToken !== this.playToken) return false;
          console.error('Audio playlist prepare error:', error.message);
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
          let prepared = null;

          try {
            prepared = await this.prepareTrack(track, {
              allowGenerate: options.allowGenerate ?? true,
              forceRegenerate: options.forceRegenerate ?? false,
              requestToken,
            });
          } catch (error) {
            if (requestToken !== this.playToken) return;
            console.error('Audio playlist prepare error:', error.message);
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
      console.error('Audio playlist error:', error.message);
      this.sequenceState = { ...EMPTY_SEQUENCE_STATE };
      this.setState({
        lastError: error.message || 'Erro ao reproduzir audio',
        errorMessageId: normalizedPlaylist.ownerId,
      });
      this.clearPlayback(true);
      return false;
    }
  };

  generateTrack = async (trackInput, options = {}) => {
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
      this.setState({
        lastError: error.message || 'Erro ao gerar audio',
        errorMessageId: track.ownerId || track.messageId,
      });
      return false;
    } finally {
      this.setState({ generatingMessageId: null });
    }
  };

  generatePlaylist = async (items = [], ownerId, options = {}) => {
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
      generatingMessageId: ownerId,
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
      this.setState({
        lastError: error.message || 'Erro ao gerar audio',
        errorMessageId: ownerId,
      });
      return false;
    } finally {
      this.setState({ generatingMessageId: null });
    }
  };

  play = async (text, voiceId, messageId, provider = DEFAULT_TTS_PROVIDER, options = {}) => {
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

  playSequence = async (items = [], ownerId, options = {}) => {
    const sequenceKey = options.sequenceKey || `sequence:${ownerId}`;
    const title = options.title || 'Narracao';
    const source = options.source || 'sequence';

    const { playlist, tracks } = this.registerPlaylistWithTracks({
      playlistId: sequenceKey,
      ownerId,
      ownerType: 'playlist',
      tracks: items,
      title,
      source,
      contextLabel: options.contextLabel || title,
    });

    return this.playPlaylist(playlist, tracks, options);
  };

  generate = async (text, voiceId, messageId, provider = DEFAULT_TTS_PROVIDER, options = {}) => {
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

  generateSequence = async (items = [], ownerId, options = {}) => {
    return this.generatePlaylist(items, ownerId, options);
  };

  togglePause = () => {
    if (!this.audio) return;

    if (this.audio.paused) {
      this.audio.play().catch(() => this.clearPlayback(true));
      return;
    }

    this.audio.pause();
  };

  stop = () => {
    if (this.audio) {
      try {
        this.audio.currentTime = 0;
      } catch (_) {
        // no-op
      }
    }
    this.clearPlayback(true);
  };

  seekTo = (value) => {
    if (!this.audio) return;
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    this.audio.currentTime = next;
    this.setState({ currentTime: next });
  };

  cyclePlaybackRate = () => {
    const currentIndex = SPEED_STEPS.indexOf(this.state.playbackRate);
    const nextRate = currentIndex === -1 || currentIndex === SPEED_STEPS.length - 1
      ? SPEED_STEPS[0]
      : SPEED_STEPS[currentIndex + 1];
    this.setState({ playbackRate: nextRate });
    this.applyPlaybackRate(this.audio);
  };

  next = () => {
    if (!this.queue.length) return;
    const nextEntry = this.queue[(this.state.queueIndex ?? -1) + 1] || null;
    if (!nextEntry) return;
    this.playQueueEntry(nextEntry, this.playToken);
  };

  previous = () => {
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

  hasAudioForItem = (itemKey) => this.registry.hasPrepared(itemKey);

  hasAudioForMessage = (messageId) => {
    if (this.registry.hasPreparedForMessage(messageId)) return true;
    return String(this.state.currentMessageId) === String(messageId);
  };
}

export const audioController = new AudioController();
