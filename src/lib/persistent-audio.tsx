import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import type { Track } from "@/lib/site-content";

type ConfigureOptions = { tracks: Track[]; autoplay: boolean };

function samePlaylist(a: Track[], b: Track[]) {
  return (
    a.length === b.length &&
    a.every((track, index) => track.id === b[index]?.id && track.audio_url === b[index]?.audio_url)
  );
}

export function PersistentAudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldResumeRef = useRef(false);
  const initialAutoplayAttempted = useRef(false);
  const activeTrack = tracks[trackIndex];

  useEffect(() => {
    if (!("mediaSession" in navigator) || !activeTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: activeTrack.title,
      artist: activeTrack.artist || undefined,
      artwork: activeTrack.cover_url ? [{ src: activeTrack.cover_url }] : undefined,
    });
  }, [activeTrack]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration || !Number.isFinite(duration)) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate || 1,
        position: Math.min(Math.max(currentTime, 0), duration),
      });
    } catch {
      // Older Safari versions expose Media Session without position-state support.
    }
  }, [currentTime, duration]);

  const configure = useCallback(({ tracks: nextTracks, autoplay }: ConfigureOptions) => {
    if (autoplay && !initialAutoplayAttempted.current) setMuted(true);
    setTracks((current) => (samePlaylist(current, nextTracks) ? current : nextTracks));
    setAutoplayEnabled(autoplay);
  }, []);

  useEffect(() => {
    if (trackIndex >= tracks.length) setTrackIndex(0);
  }, [trackIndex, tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.audio_url) return;

    setCurrentTime(0);
    audio.load();
    const shouldPlay =
      shouldResumeRef.current || (!initialAutoplayAttempted.current && autoplayEnabled);
    initialAutoplayAttempted.current = true;
    shouldResumeRef.current = false;
    if (!shouldPlay) return;

    void audio.play().catch(() => setPlaying(false));
  }, [activeTrack?.id, activeTrack?.audio_url, autoplayEnabled]);

  const changeTrack = useCallback(
    (delta: number, autoPlay = false) => {
      if (!tracks.length) return;
      shouldResumeRef.current = autoPlay;
      setTrackIndex((index) => (index + delta + tracks.length) % tracks.length);
    },
    [tracks.length],
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack?.audio_url) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
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
    if (audioRef.current) {
      audioRef.current.volume = safe;
      audioRef.current.muted = safe === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const mediaSession = navigator.mediaSession;
    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      ["previoustrack", () => changeTrack(-1, true)],
      ["nexttrack", () => changeTrack(1, true)],
      [
        "seekbackward",
        (details) => {
          const audio = audioRef.current;
          if (audio)
            audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
        },
      ],
      [
        "seekforward",
        (details) => {
          const audio = audioRef.current;
          if (audio)
            audio.currentTime = Math.min(
              Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 10,
              audio.currentTime + (details.seekOffset || 10),
            );
        },
      ],
      [
        "seekto",
        (details) => {
          if (audioRef.current && details.seekTime != null) {
            audioRef.current.currentTime = details.seekTime;
          }
        },
      ],
    ];

    for (const [action, handler] of handlers) {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // A browser may expose Media Session while omitting individual actions.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unsupported actions during cleanup as well.
        }
      }
    };
  }, [changeTrack]);

  const value = useMemo(
    () => ({
      configure,
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
    }),
    [
      configure,
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
    ],
  );

  return (
    <PersistentAudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={activeTrack?.audio_url || undefined}
        autoPlay={autoplayEnabled}
        muted={muted}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => changeTrack(1, true)}
        onError={() => setPlaying(false)}
        onTimeUpdate={(event: SyntheticEvent<HTMLAudioElement>) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onLoadedMetadata={(event: SyntheticEvent<HTMLAudioElement>) =>
          setDuration(event.currentTarget.duration || 0)
        }
      />
    </PersistentAudioContext.Provider>
  );
}

const PersistentAudioContext = createContext<
  | {
      configure: (options: ConfigureOptions) => void;
      playing: boolean;
      activeTrack: Track | undefined;
      currentTime: number;
      duration: number;
      muted: boolean;
      volume: number;
      togglePlay: () => Promise<void>;
      changeTrack: (delta: number, autoPlay?: boolean) => void;
      seek: (time: number) => void;
      setPlayerVolume: (volume: number) => void;
      toggleMute: () => void;
    }
  | undefined
>(undefined);

// The provider and its companion hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export function usePersistentAudio() {
  const value = useContext(PersistentAudioContext);
  if (!value) throw new Error("usePersistentAudio must be used inside PersistentAudioProvider");
  return value;
}
