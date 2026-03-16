export function createAudioPlaylist(input = {}) {
  return {
    playlistId: String(input.playlistId || input.id || `playlist:${Date.now()}`),
    source: input.source || 'custom',
    title: input.title || 'Playlist',
    ownerId: input.ownerId == null ? null : String(input.ownerId),
    ownerType: input.ownerType || 'playlist',
    trackIds: Array.isArray(input.trackIds) ? input.trackIds.map((id) => String(id)) : [],
    currentIndex: Number.isFinite(input.currentIndex) ? input.currentIndex : 0,
    status: input.status || 'idle',
    loop: Boolean(input.loop),
    createdAt: input.createdAt || new Date().toISOString(),
    contextLabel: input.contextLabel || null,
    meta: input.meta || {},
  };
}
