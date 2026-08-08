import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/site-content";

/**
 * Owns playback for the public player: active track, play state (driven by the
 * real <audio> events so the vinyl only spins while audio actually plays),
 * progress/seek and auto-advance.
 */
export function useAudioPlayer(tracks: Track[]) {
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef(false);
  const activeTrack = tracks[trackIndex];

  useEffect(() => {
    setCurrentTime(0);
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      audio.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
        setPlaying(false);
      });
    }
  }, [activeTrack?.id]);

  const changeTrack = useCallback(
    (delta: number, autoPlay = false) => {
      if (!tracks.length) return;
      autoPlayRef.current = autoPlay;
      setTrackIndex((i) => (i + delta + tracks.length) % tracks.length);
    },
    [tracks.length],
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.audio_url) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch (err) {
      console.warn("Playback failed:", err);
      setPlaying(false);
    }
  }, [activeTrack?.audio_url]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const audioProps = {
    ref: audioRef,
    src: activeTrack?.audio_url ?? undefined,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => changeTrack(1, true),
    onError: () => setPlaying(false),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) =>
      setCurrentTime(e.currentTarget.currentTime),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLAudioElement>) =>
      setDuration(e.currentTarget.duration || 0),
  };

  return { playing, activeTrack, currentTime, duration, togglePlay, changeTrack, seek, audioProps };
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>;
