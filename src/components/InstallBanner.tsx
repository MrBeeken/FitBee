import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";

type PromptEvent = Event & { prompt: () => Promise<void> };

export function InstallBanner() {
  const dismissed = useAppStore((s) => s.dismissedInstall);
  const dismiss = useAppStore((s) => s.dismissInstall);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStand =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
    setIos(isIos);
    setStandalone(isStand);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (dismissed || standalone) return null;
  if (!prompt && !ios) return null;

  return (
    <div className="banner">
      <div style={{ flex: 1 }}>
        <strong>Put FitBee on the home screen</strong>
        <p className="tiny muted" style={{ marginTop: 4 }}>
          {ios
            ? "In Safari, tap Share, then Add to Home Screen. It opens like an app."
            : "Install FitBee so today’s workout is one tap away — no browser chrome."}
        </p>
        {prompt ? (
          <button
            className="btn btn-honey"
            style={{ marginTop: 10 }}
            onClick={async () => {
              await prompt.prompt();
              setPrompt(null);
            }}
          >
            Install
          </button>
        ) : null}
      </div>
      <button className="btn-quiet" onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
