"use client";

// ✅ GLOBAL notification manager (only 1 at a time)
let currentNotification: HTMLElement | null = null;

export function showNotification(
  title: string,
  message: string,
  type: "info" | "success" | "error" | "warning",
  duration?: number
) {
  // ✅ Remove existing notification first
  if (currentNotification && document.body.contains(currentNotification)) {
    document.body.removeChild(currentNotification);
    currentNotification = null;
  }

  const color =
    type === "success"
      ? "#10b981"
      : type === "error"
      ? "#ef4444"
      : type === "warning"
      ? "#f59e0b"
      : "#3b82f6";

  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, ${color}, ${color}dd);
    color: white;
    padding: 14px 18px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 10001;
    max-width: 300px;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    border: 2px solid rgba(255, 255, 255, 0.15);
  `;

  notification.innerHTML = `
    <div>
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; letter-spacing: -0.3px;">${title}</div>
      <div style="font-size: 12px; opacity: 0.95; line-height: 1.4;">${message}</div>
    </div>
  `;

  document.body.appendChild(notification);
  currentNotification = notification;

  // ✅ Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  });

  // ✅ Auto-remove
  const displayDuration =
    duration ||
    (type === "info"
      ? 2000
      : type === "success"
      ? 2500
      : type === "error"
      ? 5000
      : 3000);

  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(400px)";

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
        if (currentNotification === notification) {
          currentNotification = null;
        }
      }, 300);
    }
  }, displayDuration);
}
