// Ward Orders — offline cache. เปลี่ยนเลข VERSION ทุกครั้งที่อัปเดตไฟล์
const VERSION = 'wo-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // หน้าหลัก: ออนไลน์ใช้ฉบับล่าสุด ออฟไลน์ใช้ฉบับที่เก็บไว้
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // ฟอนต์และไฟล์อื่น: ใช้ของในเครื่องก่อน แล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque') && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname))) {
        const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp));
      }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
