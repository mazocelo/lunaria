export interface AudioPlaylist {
  playlistId: string;
  source: string;
  title: string;
  ownerId: string | null;
  ownerType: string;
  trackIds: string[];
  currentIndex: number;
  status: string;
  loop: boolean;
  createdAt: string;
  contextLabel: string | null;
  meta: Record<string, unknown>;
}

export interface AudioPlaylistInput {
  playlistId?: string | number | null;
  id?: string | number | null;
  source?: string;
  title?: string;
  ownerId?: string | number | null;
  ownerType?: string;
  trackIds?: Array<string | number>;
  currentIndex?: number;
  status?: string;
  loop?: boolean;
  createdAt?: string;
  contextLabel?: string | null;
  meta?: Record<string, unknown>;
}

export function createAudioPlaylist(input: AudioPlaylistInput = {}): AudioPlaylist {
  return {
    playlistId: String(input.playlistId || input.id || `playlist:${Date.now()}`),
    source: input.source || 'custom',
    title: input.title || 'Playlist',
    ownerId: input.ownerId == null ? null : String(input.ownerId),
    ownerType: input.ownerType || 'playlist',
    trackIds: Array.isArray(input.trackIds) ? input.trackIds.map((id) => String(id)) : [],
    currentIndex: Number.isFinite(input.currentIndex) ? (input.currentIndex as number) : 0,
    status: input.status || 'idle',
    loop: Boolean(input.loop),
    createdAt: input.createdAt || new Date().toISOString(),
    contextLabel: input.contextLabel || null,
    meta: input.meta || {},
  };
}
