import type { AudioTrackRef } from '../domain/trackRef';
import type { AudioPlaylist } from '../domain/playlist';

export interface PreparedAudioEntry {
  trackId: string;
  messageId: string | null;
  segmentId: string | null;
  speakerLabel: string | null;
  text: string;
  speechText: string;
  urls: string[];
}

export class AudioRegistry {
  trackMap: Map<string, AudioTrackRef>;
  playlistMap: Map<string, AudioPlaylist>;
  preparedMap: Map<string, PreparedAudioEntry>;

  constructor() {
    this.trackMap = new Map();
    this.playlistMap = new Map();
    this.preparedMap = new Map();
  }

  registerTrack(track: AudioTrackRef | null | undefined): AudioTrackRef | null {
    if (!track?.trackId) return null;
    this.trackMap.set(String(track.trackId), track);
    return track;
  }

  registerTracks(tracks: AudioTrackRef[] = []): AudioTrackRef[] {
    return (Array.isArray(tracks) ? tracks : [])
      .map((track) => this.registerTrack(track))
      .filter((track): track is AudioTrackRef => track !== null);
  }

  getTrack(trackId: string | number | null | undefined): AudioTrackRef | null {
    if (trackId == null) return null;
    return this.trackMap.get(String(trackId)) || null;
  }

  registerPlaylist(playlist: AudioPlaylist | null | undefined): AudioPlaylist | null {
    if (!playlist?.playlistId) return null;
    this.playlistMap.set(String(playlist.playlistId), playlist);
    return playlist;
  }

  getPlaylist(playlistId: string | number | null | undefined): AudioPlaylist | null {
    if (playlistId == null) return null;
    return this.playlistMap.get(String(playlistId)) || null;
  }

  setPrepared(trackId: string | number | null | undefined, entry: PreparedAudioEntry | null | undefined): void {
    if (trackId == null || !entry) return;
    this.preparedMap.set(String(trackId), entry);
  }

  getPrepared(trackId: string | number | null | undefined): PreparedAudioEntry | null {
    if (trackId == null) return null;
    return this.preparedMap.get(String(trackId)) || null;
  }

  hasPrepared(trackId: string | number | null | undefined): boolean {
    if (trackId == null) return false;
    return this.preparedMap.has(String(trackId));
  }

  hasPreparedForMessage(messageId: string | number | null | undefined): boolean {
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

  revokePrepared(trackId: string | number | null | undefined): void {
    const entry = this.getPrepared(trackId);
    if (!entry?.urls) return;
    entry.urls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    });
    this.preparedMap.delete(String(trackId));
  }

  revokeAllPrepared(): void {
    for (const trackId of this.preparedMap.keys()) {
      this.revokePrepared(trackId);
    }
    this.preparedMap.clear();
  }
}
