import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient } from '../services/ApiClient.js';

const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';
const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];
const TTS_LAST_MESSAGE_KEY = 'tts_last_message_id';
const MAX_TTS_TEXT_LENGTH = 4500;
const EMPTY_SEQUENCE_STATE = {
  token: null,
  preparing: false,
  waitingForNext: false,
  lastFinishedIndex: -1
};

function buildItemKey(messageId, segmentId = null) {
  if (segmentId == null || segmentId === '') return String(messageId);
  return `${messageId}::${segmentId}`;
}

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

function shouldSendEmotion(provider, emotion) {
  return provider === 'cartesia' && emotion ? emotion : null;
}

function flattenPreparedEntries(entries = [], fallbackMessageId) {
  const flattened = [];

  entries.forEach((entry) => {
    const urls = Array.isArray(entry?.urls) ? entry.urls : [];
    urls.forEach((url, urlIndex) => {
      flattened.push({
        messageId: entry.messageId ?? fallbackMessageId,
        segmentId: entry.segmentId || null,
        itemKey: entry.itemKey,
        url,
        urlIndex,
        chunkCount: urls.length,
        text: entry.text
      });
    });
  });

  return flattened;
}

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(() => {
    try {
      return localStorage.getItem(TTS_LAST_MESSAGE_KEY);
    } catch (_) {
      return null;
    }
  });
  const [currentSegmentId, setCurrentSegmentId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isSequence, setIsSequence] = useState(false);
  const [currentSequenceKey, setCurrentSequenceKey] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [errorMessageId, setErrorMessageId] = useState(null);
  const [generatingMessageId, setGeneratingMessageId] = useState(null);

  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());
  const queueRef = useRef([]);
  const queueMetaRef = useRef({ messageId: null, sequenceKey: null });
  const playTokenRef = useRef(0);
  const sequenceStateRef = useRef({ ...EMPTY_SEQUENCE_STATE });

  const detachAudioHandlers = useCallback((audio) => {
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.onpause = null;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
  }, []);

  const revokeCacheEntry = useCallback((entry) => {
    if (!entry?.urls) return;
    entry.urls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {
        // no-op
      }
    });
  }, []);

  const resetActiveAudio = useCallback((resetProgress = true) => {
    if (audioRef.current) {
      audioRef.current.pause();
      detachAudioHandlers(audioRef.current);
      audioRef.current = null;
    }

    if (resetProgress) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [detachAudioHandlers]);

  const clearErrorCb = useCallback(() => {
    setLastError(null);
    setErrorMessageId(null);
  }, []);

  const clearPlayback = useCallback((clearMessage = true) => {
    playTokenRef.current += 1;

    resetActiveAudio(true);

    queueRef.current = [];
    queueMetaRef.current = { messageId: null, sequenceKey: null };
    sequenceStateRef.current = { ...EMPTY_SEQUENCE_STATE };
    setIsSequence(false);
    setCurrentSequenceKey(null);
    setQueueIndex(-1);

    if (clearMessage) {
      setCurrentMessageId(null);
      setCurrentSegmentId(null);
    } else {
      setCurrentSegmentId(null);
    }
  }, [resetActiveAudio]);

  const applyPlaybackRate = useCallback((audio) => {
    if (!audio) return;
    audio.playbackRate = playbackRate;
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.mozPreservesPitch = true;
  }, [playbackRate]);

  const playQueueEntry = useCallback((entry, token) => {
    if (!entry || token !== playTokenRef.current) return;

    if (audioRef.current) {
      audioRef.current.pause();
      detachAudioHandlers(audioRef.current);
      audioRef.current = null;
    }

    const audio = new Audio(entry.url);
    audioRef.current = audio;
    applyPlaybackRate(audio);

    setCurrentMessageId(entry.messageId);
    setCurrentSegmentId(entry.segmentId || null);
    setQueueIndex(entry.queueIndex);
    setCurrentTime(0);
    setDuration(0);

    audio.onended = () => {
      if (token !== playTokenRef.current) return;

      const nextEntry = queueRef.current[entry.queueIndex + 1] || null;
      detachAudioHandlers(audio);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      try {
        audio.currentTime = 0;
      } catch (_) {
        // no-op
      }

      if (nextEntry) {
        playQueueEntry(nextEntry, token);
        return;
      }

      const sequenceState = sequenceStateRef.current;
      if (sequenceState.token === token && sequenceState.preparing) {
        sequenceState.waitingForNext = true;
        sequenceState.lastFinishedIndex = entry.queueIndex;
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setCurrentSegmentId(null);
        return;
      }

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentSegmentId(null);
      setQueueIndex(-1);
      sequenceStateRef.current = { ...EMPTY_SEQUENCE_STATE };
    };

    audio.onerror = () => {
      if (token !== playTokenRef.current) return;
      clearPlayback(true);
    };
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
    audio.onloadedmetadata = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);
    };

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => clearPlayback(true));
  }, [applyPlaybackRate, clearPlayback, detachAudioHandlers]);

  const prepareAudioEntry = useCallback(async ({
    text,
    voiceId,
    provider = DEFAULT_TTS_PROVIDER,
    messageId,
    segmentId = null,
    allowGenerate = true,
    forceRegenerate = false,
    emotion = null,
    requestToken = null
  }) => {
    const normalizedText = String(text || '').trim();
    if (!normalizedText || !voiceId) return null;
    if (requestToken != null && requestToken !== playTokenRef.current) return null;

    const itemKey = buildItemKey(messageId, segmentId);

    if (forceRegenerate) {
      const previous = cacheRef.current.get(itemKey);
      if (previous) {
        revokeCacheEntry(previous);
        cacheRef.current.delete(itemKey);
      }
    }

    const cached = cacheRef.current.get(itemKey);
    if (cached && Array.isArray(cached.urls) && cached.urls.length > 0) {
      return {
        ...cached,
        itemKey,
        messageId,
        segmentId,
        text: normalizedText
      };
    }

    if (!allowGenerate) return null;

    const chunks = splitTextForTts(normalizedText);
    const urls = [];
    const selectedEmotion = shouldSendEmotion(provider, emotion);

    for (const chunk of chunks) {
      if (requestToken != null && requestToken !== playTokenRef.current) {
        revokeCacheEntry({ urls });
        return null;
      }

      const body = { text: chunk, voiceId, provider };
      if (selectedEmotion) body.emotion = selectedEmotion;

      const response = await apiClient.post('/tts/generate', body, {
        responseType: 'blob'
      });
      if (requestToken != null && requestToken !== playTokenRef.current) {
        revokeCacheEntry({ urls });
        return null;
      }

      const blob = response instanceof Blob ? response : new Blob([response], { type: 'audio/mpeg' });
      urls.push(createAudioUrlsFromBlob(blob));
    }

    const entry = {
      itemKey,
      messageId,
      segmentId,
      voiceId,
      provider,
      emotion: selectedEmotion,
      text: normalizedText,
      urls
    };

    if (requestToken != null && requestToken !== playTokenRef.current) {
      revokeCacheEntry(entry);
      return null;
    }

    cacheRef.current.set(itemKey, entry);
    return entry;
  }, [revokeCacheEntry]);

  const buildQueueEntries = useCallback((entries = [], messageId, sequenceKey = null) => {
    const queue = flattenPreparedEntries(entries, messageId).map((entry, index) => ({
      ...entry,
      queueIndex: index
    }));

    queueRef.current = queue;
    queueMetaRef.current = { messageId, sequenceKey };
    setIsSequence(queue.length > 1 || entries.length > 1);
    setCurrentSequenceKey(sequenceKey || null);
    setQueueIndex(queue.length > 0 ? 0 : -1);

    return queue;
  }, []);

  const appendQueueEntries = useCallback((entries = [], messageId, sequenceKey = null) => {
    const flattened = flattenPreparedEntries(entries, messageId);
    if (flattened.length === 0) return queueRef.current;

    const startIndex = queueRef.current.length;
    const appended = flattened.map((entry, index) => ({
      ...entry,
      queueIndex: startIndex + index
    }));

    const queue = [...queueRef.current, ...appended];
    queueRef.current = queue;
    queueMetaRef.current = { messageId, sequenceKey };
    setIsSequence(queue.length > 1 || entries.length > 1);
    setCurrentSequenceKey(sequenceKey || null);

    return queue;
  }, []);

  useEffect(() => {
    return () => {
      clearPlayback(true);
      for (const entry of cacheRef.current.values()) {
        revokeCacheEntry(entry);
      }
      cacheRef.current.clear();
    };
  }, [clearPlayback, revokeCacheEntry]);

  useEffect(() => {
    try {
      if (currentMessageId == null) {
        localStorage.removeItem(TTS_LAST_MESSAGE_KEY);
      } else {
        localStorage.setItem(TTS_LAST_MESSAGE_KEY, String(currentMessageId));
      }
    } catch (_) {
      // no-op
    }
  }, [currentMessageId]);

  useEffect(() => {
    applyPlaybackRate(audioRef.current);
  }, [applyPlaybackRate]);

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => clearPlayback(true));
      return;
    }

    audio.pause();
  }, [clearPlayback]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
      } catch (_) {
        // no-op
      }
    }
    clearPlayback(false);
    setCurrentSegmentId(null);
    setCurrentTime(0);
    setDuration(0);
  }, [clearPlayback]);

  const seekTo = useCallback((value) => {
    const audio = audioRef.current;
    if (!audio) return;

    const next = Number(value);
    if (!Number.isFinite(next)) return;

    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const hasAudioForItem = useCallback((itemKey) => {
    if (itemKey == null) return false;
    return cacheRef.current.has(String(itemKey));
  }, []);

  const hasAudioForMessage = useCallback((messageId) => {
    if (messageId == null) return false;
    const key = String(messageId);
    if (cacheRef.current.has(key)) return true;
    for (const cacheKey of cacheRef.current.keys()) {
      if (String(cacheKey).startsWith(`${key}::`)) return true;
    }
    return String(currentMessageId) === key;
  }, [currentMessageId]);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((prev) => {
      const currentIndex = SPEED_STEPS.indexOf(prev);
      if (currentIndex === -1 || currentIndex === SPEED_STEPS.length - 1) return SPEED_STEPS[0];
      return SPEED_STEPS[currentIndex + 1];
    });
  }, []);

  const play = useCallback(async (
    text,
    voiceId,
    messageId,
    provider = DEFAULT_TTS_PROVIDER,
    options = {}
  ) => {
    const {
      allowGenerate = true,
      forceRegenerate = false,
      segmentId = null,
      emotion = null
    } = options;

    const itemKey = buildItemKey(messageId, segmentId);
    const isSameItem = String(currentMessageId) === String(messageId)
      && String(currentSegmentId || '') === String(segmentId || '');

    if (!forceRegenerate && isSameItem && audioRef.current) {
      togglePause();
      return true;
    }

    if (forceRegenerate || !isSameItem) {
      clearPlayback(true);
      setCurrentMessageId(messageId);
      setCurrentSegmentId(segmentId || null);
    }

    const requestToken = playTokenRef.current + 1;
    playTokenRef.current = requestToken;
    setIsLoading(true);
    setLastError(null);
    setErrorMessageId(null);
    try {
      const prepared = await prepareAudioEntry({
        text,
        voiceId,
        provider,
        messageId,
        segmentId,
        allowGenerate,
        forceRegenerate,
        emotion,
        requestToken
      });
      if (requestToken !== playTokenRef.current) return false;

      if (!prepared) {
        if (!forceRegenerate) {
          setCurrentMessageId(messageId);
          setCurrentSegmentId(segmentId || null);
        }
        return false;
      }

      const queue = buildQueueEntries([prepared], messageId, itemKey);
      if (queue.length === 0) return false;

      if (requestToken !== playTokenRef.current) return false;
      playQueueEntry(queue[0], requestToken);
      return true;
    } catch (error) {
      if (requestToken !== playTokenRef.current) return false;
      console.error('TTS error:', error.message);
      setLastError(error.message || 'Erro ao gerar audio');
      setErrorMessageId(messageId);
      clearPlayback(true);
      return false;
    } finally {
      if (requestToken === playTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, [buildQueueEntries, clearPlayback, currentMessageId, currentSegmentId, playQueueEntry, prepareAudioEntry, togglePause]);

  const playSequence = useCallback(async (items = [], messageId, options = {}) => {
    const {
      allowGenerate = true,
      forceRegenerate = false,
      sequenceKey = `sequence:${messageId}`
    } = options;

    const validItems = (Array.isArray(items) ? items : []).filter((item) => item?.text && item?.voiceId);
    if (validItems.length === 0) return false;

    const isSameSequence = queueMetaRef.current.sequenceKey === sequenceKey
      && queueRef.current.length > 0;
    const sequenceInFlight = sequenceStateRef.current.preparing || sequenceStateRef.current.waitingForNext;

    if (!forceRegenerate && isSameSequence && audioRef.current) {
      togglePause();
      return true;
    }

    if (!forceRegenerate && isSameSequence && sequenceInFlight) {
      return true;
    }

    clearPlayback(true);
    setCurrentMessageId(messageId);
    setCurrentSegmentId(null);

    const requestToken = playTokenRef.current + 1;
    playTokenRef.current = requestToken;
    sequenceStateRef.current = {
      token: requestToken,
      preparing: true,
      waitingForNext: false,
      lastFinishedIndex: -1
    };
    setIsLoading(true);
    let firstPreparedIndex = -1;

    try {
      let firstPrepared = null;

      for (let index = 0; index < validItems.length; index += 1) {
        const item = validItems[index];
        let prepared = null;

        try {
          prepared = await prepareAudioEntry({
            text: item.text,
            voiceId: item.voiceId,
            provider: item.provider || DEFAULT_TTS_PROVIDER,
            messageId: item.messageId ?? messageId,
            segmentId: item.segmentId || null,
            allowGenerate: item.allowGenerate ?? allowGenerate,
            forceRegenerate,
            emotion: item.emotion || null,
            requestToken
          });
        } catch (error) {
          if (requestToken !== playTokenRef.current) return false;
          console.error('TTS sequence prepare error:', error.message);
          continue;
        }

        if (requestToken !== playTokenRef.current) return false;
        if (!prepared) continue;

        firstPrepared = prepared;
        firstPreparedIndex = index;
        break;
      }

      if (!firstPrepared) {
        sequenceStateRef.current = { ...EMPTY_SEQUENCE_STATE };
        setCurrentMessageId(messageId);
        setCurrentSegmentId(null);
        return false;
      }

      const queue = buildQueueEntries([firstPrepared], messageId, sequenceKey);
      if (queue.length === 0) {
        sequenceStateRef.current = { ...EMPTY_SEQUENCE_STATE };
        setCurrentMessageId(messageId);
        setCurrentSegmentId(null);
        return false;
      }

      if (requestToken !== playTokenRef.current) return false;
      setIsLoading(false);
      playQueueEntry(queue[0], requestToken);

      const prepareRemainingItems = async () => {
        for (let index = firstPreparedIndex + 1; index < validItems.length; index += 1) {
          const item = validItems[index];
          let prepared = null;

          try {
            prepared = await prepareAudioEntry({
              text: item.text,
              voiceId: item.voiceId,
              provider: item.provider || DEFAULT_TTS_PROVIDER,
              messageId: item.messageId ?? messageId,
              segmentId: item.segmentId || null,
              allowGenerate: item.allowGenerate ?? allowGenerate,
              forceRegenerate,
              emotion: item.emotion || null,
              requestToken
            });
          } catch (error) {
            if (requestToken !== playTokenRef.current) return;
            console.error('TTS sequence prepare error:', error.message);
            continue;
          }

          if (requestToken !== playTokenRef.current) return;
          if (!prepared) continue;

          appendQueueEntries([prepared], messageId, sequenceKey);

          const state = sequenceStateRef.current;
          if (state.token === requestToken && state.waitingForNext) {
            const nextEntry = queueRef.current[state.lastFinishedIndex + 1] || null;
            if (nextEntry) {
              state.waitingForNext = false;
              playQueueEntry(nextEntry, requestToken);
            }
          }
        }

        if (requestToken !== playTokenRef.current) return;
        sequenceStateRef.current = {
          token: requestToken,
          preparing: false,
          waitingForNext: false,
          lastFinishedIndex: sequenceStateRef.current.lastFinishedIndex
        };
      };

      void prepareRemainingItems();
      return true;
    } catch (error) {
      if (requestToken !== playTokenRef.current) return false;
      console.error('TTS sequence error:', error.message);
      setLastError(error.message || 'Erro ao gerar audio');
      setErrorMessageId(messageId);
      sequenceStateRef.current = { ...EMPTY_SEQUENCE_STATE };
      clearPlayback(true);
      return false;
    } finally {
      if (requestToken === playTokenRef.current && firstPreparedIndex === -1) {
        setIsLoading(false);
      }
    }
  }, [appendQueueEntries, buildQueueEntries, clearPlayback, playQueueEntry, prepareAudioEntry, togglePause]);

  const generate = useCallback(async (
    text,
    voiceId,
    messageId,
    provider = DEFAULT_TTS_PROVIDER,
    options = {}
  ) => {
    const { forceRegenerate = false, segmentId = null, emotion = null } = options;
    setGeneratingMessageId(messageId);
    setLastError(null);
    setErrorMessageId(null);
    try {
      const prepared = await prepareAudioEntry({
        text,
        voiceId,
        provider,
        messageId,
        segmentId,
        allowGenerate: true,
        forceRegenerate,
        emotion,
        requestToken: null
      });
      return !!prepared;
    } catch (error) {
      setLastError(error.message || 'Erro ao gerar audio');
      setErrorMessageId(messageId);
      return false;
    } finally {
      setGeneratingMessageId(null);
    }
  }, [prepareAudioEntry]);

  const generateSequence = useCallback(async (items = [], messageId, options = {}) => {
    const { forceRegenerate = false } = options;
    const validItems = (Array.isArray(items) ? items : []).filter((i) => i?.text && i?.voiceId);
    if (validItems.length === 0) return false;
    setGeneratingMessageId(messageId);
    setLastError(null);
    setErrorMessageId(null);
    try {
      for (const item of validItems) {
        await prepareAudioEntry({
          text: item.text,
          voiceId: item.voiceId,
          provider: item.provider || DEFAULT_TTS_PROVIDER,
          messageId: item.messageId ?? messageId,
          segmentId: item.segmentId || null,
          allowGenerate: true,
          forceRegenerate,
          emotion: item.emotion || null,
          requestToken: null
        });
      }
      return true;
    } catch (error) {
      setLastError(error.message || 'Erro ao gerar audio');
      setErrorMessageId(messageId);
      return false;
    } finally {
      setGeneratingMessageId(null);
    }
  }, [prepareAudioEntry]);

  return {
    play,
    playSequence,
    generate,
    generateSequence,
    stop: stopAudio,
    togglePause,
    seekTo,
    cyclePlaybackRate,
    hasAudioForMessage,
    hasAudioForItem,
    isPlaying,
    isLoading,
    currentMessageId,
    currentSegmentId,
    currentTime,
    duration,
    playbackRate,
    queueIndex,
    isSequence,
    currentSequenceKey,
    generatingMessageId,
    lastError,
    errorMessageId,
    clearError: clearErrorCb
  };
};

export default useTTS;
