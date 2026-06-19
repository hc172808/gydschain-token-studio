/**
 * Single guarded service worker registration wrapper.
 * Never registers in dev, iframe, Lovable preview hosts, or when ?sw=off is set.
 */
const SW_PATH = "/sw.js";

const matchesAppSW = (r: ServiceWorkerRegistration) => {
  const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
  return url.endsWith(SW_PATH);
};

const unregisterStale = async () => {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter(matchesAppSW).map((r) => r.unregister()));
};

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") {
    await unregisterStale();
    return;
  }

  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const host = window.location.hostname;
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" || host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev");

  if (!import.meta.env.PROD || inIframe || isPreview) {
    await unregisterStale();
    return;
  }

  try {
    await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  } catch {
    // swallow — SW is progressive enhancement
  }
};
