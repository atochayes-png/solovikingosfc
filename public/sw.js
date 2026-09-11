// Service worker mínimo: habilita la instalación como app sin cachear
// navegaciones (evita servir versiones viejas o romper flujos de sesión).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
