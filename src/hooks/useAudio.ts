import { useCallback, useRef, useEffect } from "react";

type SoundType =
  | "place"
  | "clear"
  | "levelup"
  | "combo"
  | "gameover"
  | "newpiece"
  | "invalid"
  | "winstreak"
  | "button";

interface SoundConfig {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  place: { frequency: 523.25, duration: 0.08, gain: 0.25, type: "sine" },
  invalid: {
    frequency: 130.81,
    duration: 0.12,
    gain: 0.2,
    type: "sawtooth",
  },
  clear: { frequency: 659.25, duration: 0.2, gain: 0.3, type: "sine" },
  combo: { frequency: 783.99, duration: 0.25, gain: 0.35, type: "sine" },
  winstreak: { frequency: 1046.5, duration: 0.25, gain: 0.35, type: "sine" },
  newpiece: { frequency: 440.0, duration: 0.15, gain: 0.25, type: "sine" },
  levelup: { frequency: 880.0, duration: 0.3, gain: 0.4, type: "sine" },
  gameover: {
    frequency: 293.66,
    duration: 0.3,
    gain: 0.3,
    type: "sawtooth",
  },
  button: { frequency: 880.0, duration: 0.05, gain: 0.2, type: "sine" },
};

const ATTACK_TIME = 0.01;
const RELEASE_TIME = 0.01;
const MIN_GAIN = 0.001;

export const useAudio = (soundEnabled: boolean) => {
  const audioContext = useRef<AudioContext | null>(null);
  const audioInitialized = useRef<boolean>(false);
  const audioUnlocked = useRef<boolean>(false);
  const pendingSounds = useRef<Set<SoundType>>(new Set());
  const activeSources = useRef<Set<OscillatorNode>>(new Set());
  const resumeAttempts = useRef<number>(0);
  const lastInteractionTime = useRef<number>(0);
  const maxResumeAttempts = 5;

  const ensureAudioRunning = useCallback(async (): Promise<boolean> => {
    if (!audioContext.current) return false;

    try {
      const state = audioContext.current.state;

      if (state === "suspended") {
        console.log("[AUDIO] 🔄 Context suspended, attempting resume...");
        await audioContext.current.resume();

        await new Promise((resolve) => setTimeout(resolve, 100));

        const newState = audioContext.current.state;
        if (newState === "running") {
          console.log("[AUDIO] ✅ Context resumed successfully");
          resumeAttempts.current = 0;
          return true;
        } else {
          console.warn("[AUDIO] ⚠️ Context still not running after resume");
          return false;
        }
      }

      return state === "running";
    } catch (error) {
      console.error("[AUDIO] ❌ Resume failed:", error);
      return false;
    }
  }, []);

  const initAudio = useCallback(async (): Promise<void> => {
    if (!soundEnabled) {
      console.log("[AUDIO] ⏭️ Sound disabled, skipping init");
      return;
    }

    try {
      if (typeof window === "undefined") return;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("[AUDIO] ❌ Web Audio API not supported");
        return;
      }

      const shouldCreateNewContext =
        !audioContext.current || audioContext.current.state === "closed";

      if (shouldCreateNewContext) {
        console.log("[AUDIO] 🆕 Creating new AudioContext");
        audioContext.current = new AudioContextClass();
      }

      const isRunning = await ensureAudioRunning();

      if (!isRunning && resumeAttempts.current < maxResumeAttempts) {
        resumeAttempts.current++;
        console.log(
          `[AUDIO] 🔄 Retry resume attempt ${resumeAttempts.current}/${maxResumeAttempts}`
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
        return initAudio();
      }

      const shouldUnlock =
        !audioUnlocked.current &&
        audioContext.current !== null &&
        audioContext.current.state === "running";

      if (shouldUnlock) {
        console.log("[AUDIO] 🔓 Unlocking audio...");
        const ctx = audioContext.current;

        // ✅ FIX: Add null guard for ctx (Line 136-144)
        if (!ctx) {
          console.warn("[AUDIO] Context is null during unlock");
          return;
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        gainNode.gain.value = MIN_GAIN;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.01);

        audioUnlocked.current = true;
        console.log("[AUDIO] ✅ Audio unlocked successfully");
      }

      audioInitialized.current = true;

      if (pendingSounds.current.size > 0) {
        console.log(
          `[AUDIO] 🎵 Playing ${pendingSounds.current.size} pending sounds`
        );
        const soundsToPlay = Array.from(pendingSounds.current);
        pendingSounds.current.clear();

        for (const sound of soundsToPlay) {
          await playSound(sound);
        }
      }
    } catch (error) {
      console.warn("[AUDIO] ❌ Failed to initialize:", error);
      audioInitialized.current = false;
    }
  }, [soundEnabled, ensureAudioRunning]);

  const cleanupSource = useCallback((oscillator: OscillatorNode) => {
    activeSources.current.delete(oscillator);
  }, []);

  const playSound = useCallback(
    async (type: SoundType): Promise<void> => {
      if (!soundEnabled) return;

      try {
        const now = Date.now();
        lastInteractionTime.current = now;

        const needsInit =
          !audioInitialized.current ||
          !audioContext.current ||
          audioContext.current.state === "closed";

        if (needsInit) {
          console.log(`[AUDIO] 🔄 Not initialized, queuing sound: ${type}`);
          pendingSounds.current.add(type);
          await initAudio();
          return;
        }

        const isRunning = await ensureAudioRunning();

        if (!isRunning) {
          console.log(`[AUDIO] ⏸️ Context not running, queuing sound: ${type}`);
          pendingSounds.current.add(type);
          await initAudio();
          return;
        }

        const ctx = audioContext.current;

        // ✅ FIX: Add null guard for ctx (Line 208-215)
        if (!ctx) {
          console.warn("[AUDIO] Context is null during playback");
          return;
        }

        const currentTime = ctx.currentTime;
        const config = SOUND_CONFIGS[type];

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = config.frequency;
        oscillator.type = config.type || "sine";

        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(
          config.gain,
          currentTime + ATTACK_TIME
        );
        gainNode.gain.exponentialRampToValueAtTime(
          MIN_GAIN,
          currentTime + config.duration
        );

        activeSources.current.add(oscillator);

        oscillator.onended = () => cleanupSource(oscillator);

        oscillator.start(currentTime);
        oscillator.stop(currentTime + config.duration + RELEASE_TIME);
      } catch (error) {
        console.warn(`[AUDIO] ❌ Playback failed for ${type}:`, error);
        audioInitialized.current = false;
        pendingSounds.current.add(type);
      }
    },
    [soundEnabled, initAudio, cleanupSource, ensureAudioRunning]
  );

  useEffect(() => {
    if (!soundEnabled || typeof window === "undefined") return;

    const handleVisibilityChange = async () => {
      console.log("[AUDIO] 👁️ Visibility changed:", document.visibilityState);

      if (document.visibilityState === "visible") {
        console.log("[AUDIO] 🔄 App became visible, reinitializing audio...");

        audioInitialized.current = false;
        audioUnlocked.current = false;
        resumeAttempts.current = 0;

        await new Promise((resolve) => setTimeout(resolve, 300));

        await initAudio();
      }
    };

    const handleFocus = async () => {
      console.log("[AUDIO] 🎯 Window focused");
      const isSuspended = audioContext.current?.state === "suspended";
      if (audioContext.current && isSuspended) {
        await ensureAudioRunning();
      }
    };

    const handleBlur = () => {
      console.log("[AUDIO] 😴 Window blurred");
    };

    const handlePageShow = async (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log("[AUDIO] 🔄 Page restored from bfcache, reinitializing...");
        audioInitialized.current = false;
        audioUnlocked.current = false;
        await initAudio();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [soundEnabled, initAudio, ensureAudioRunning]);

  useEffect(() => {
    if (!soundEnabled || typeof window === "undefined") return;

    const handleUserInteraction = async () => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionTime.current;

      if (timeSinceLastInteraction < 500) return;

      console.log("[AUDIO] 👆 User interaction detected");

      const needsInit =
        !audioInitialized.current ||
        audioContext.current?.state === "suspended";

      if (needsInit) {
        await initAudio();
      }

      lastInteractionTime.current = now;
    };

    const events = [
      "touchstart",
      "touchend",
      "click",
      "keydown",
      "pointerdown",
      "mousedown",
    ] as const;

    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, {
        once: false,
        passive: true,
        capture: true,
      });
    });

    const timeoutId = setTimeout(() => {
      initAudio().catch((err) =>
        console.warn("[AUDIO] Auto-init failed:", err)
      );
    }, 100);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction, {
          capture: true,
        } as any);
      });
      clearTimeout(timeoutId);
    };
  }, [soundEnabled, initAudio]);

  useEffect(() => {
    if (!soundEnabled || !audioContext.current) return;

    const ctx = audioContext.current;

    const handleStateChange = () => {
      const currentState = ctx.state;
      console.log(`[AUDIO] 📊 State changed to: ${currentState}`);

      if (currentState === "suspended") {
        console.log("[AUDIO] ⚠️ Context suspended, attempting resume...");
        ensureAudioRunning();
      }
    };

    ctx.addEventListener("statechange", handleStateChange);

    return () => {
      ctx.removeEventListener("statechange", handleStateChange);
    };
  }, [soundEnabled, ensureAudioRunning]);

  useEffect(() => {
    return () => {
      console.log("[AUDIO] 🧹 Cleaning up...");

      activeSources.current.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
      activeSources.current.clear();

      if (audioContext.current && audioContext.current.state !== "closed") {
        audioContext.current
          .close()
          .catch((err) => console.warn("[AUDIO] Close failed:", err));
      }

      audioContext.current = null;
      audioInitialized.current = false;
      audioUnlocked.current = false;
      pendingSounds.current.clear();
    };
  }, []);

  return { initAudio, playSound };
};
