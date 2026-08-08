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
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef(false);
  const initialAutoplayAttempted = useRef(false);
  const activeTrack = tracks[trackIndex];

  useEffect(() => {
    setCurrentTime(0);
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    const shouldPlay = autoPlayRef.current || !initialAutoplayAttempted.current;
    initialAutoplayAttempted.current = true;
    if (shouldPlay) {
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

  const setPlayerVolume = useCallback((next: number) => {
    const safe = Math.max(0, Math.min(1, next));
    setVolume(safe);
    setMuted(safe === 0);
    if (audioRef.current) audioRef.current.volume = safe;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
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

  return {
    playing,
    activeTrack,
    currentTime,
    duration,
    muted,
    volume,
    togglePlay,
    changeTrack,
    seek,
    setPlayerVolume,
    toggleMute,
    audioProps,
  };
}

export type AudioPlayer = ReturnType<typeof useAudioPlayer>;
