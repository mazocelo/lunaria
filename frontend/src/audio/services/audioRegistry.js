export class AudioRegistry {
  constructor() {
    this.trackMap = new Map();
    this.playlistMap = new Map();
    this.preparedMap = new Map();
  }

  registerTrack(track) {
    if (!track?.trackId) return null;
    this.trackMap.set(String(track.trackId), track);
    return track;
  }

  registerTracks(tracks = []) {
    return (Array.isArray(tracks) ? tracks : [])
      .map((track) => this.registerTrack(track))
      .filter(Boolean);
  }

  getTrack(trackId) {
    if (trackId == null) return null;
    return this.trackMap.get(String(trackId)) || null;
  }

  registerPlaylist(playlist) {
    if (!playlist?.playlistId) return null;
    this.playlistMap.set(String(playlist.playlistId), playlist);
    return playlist;
  }

  getPlaylist(playlistId) {
    if (playlistId == null) return null;
    return this.playlistMap.get(String(playlistId)) || null;
  }

  setPrepared(trackId, entry) {
    if (trackId == null || !entry) return;
    this.preparedMap.set(String(trackId), entry);
  }

  getPrepared(trackId) {
    if (trackId == null) return null;
    return this.preparedMap.get(String(trackId)) || null;
  }

  hasPrepared(trackId) {
    if (trackId == null) return false;
    return this.preparedMap.has(String(trackId));
  }

  hasPreparedForMessage(messageId) {
    if (messageId == null) return false;
    const normalizedMessageId = String(messageId);
    for (const [trackId] of this.preparedMap.entries()) {
      const track = this.trackMap.get(trackId);
      if (track && String(track.messageId) === normalizedMessageId) {
        return true;
      }
    }
    return false;
  }

  revokePrepared(trackId) {
    const entry = this.getPrepared(trackId);
    if (!entry?.urls) return;
    entry.urls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {
        // no-op
      }
    });
    this.preparedMap.delete(String(trackId));
  }

  revokeAllPrepared() {
    for (const trackId of this.preparedMap.keys()) {
      this.revokePrepared(trackId);
    }
    this.preparedMap.clear();
  }
}
