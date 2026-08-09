import { useEffect } from "react";
import type { Track } from "@/lib/site-content";
import { usePersistentAudio } from "@/lib/persistent-audio";

/**
 * Owns playback for the public player: active track, play state (driven by the
 * real <audio> events so the vinyl only spins while audio actually plays),
 * progress/seek and auto-advance.
 */
export function useAudioPlayer(tracks: Track[], autoplay = false) {
  const player = usePersistentAudio();
  const { configure } = player;
  useEffect(() => configure({ tracks, autoplay }), [configure, tracks, autoplay]);
  return player;
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>;
