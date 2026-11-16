// オフラインでも開けるように、アプリのファイルを端末にしまっておく
// アプリを更新したら、下の版番号を1つ上げる
const CACHE = 'menu-v5';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' … 新しい版を入れるときに、ブラウザに残った古いファイルを拾わないように
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// ネットにつながれば最新を取り、つながらなければしまっておいたものを使う
// （?m や ?t=… の付いたアドレスも、付いていないものとして1つだけしまう）
// cache:'no-cache' … ブラウザに残っている古いもの（GitHub Pages は10分残す）を使わず、毎回サーバーに確かめる
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const u = new URL(req.url), key = u.origin + u.pathname;
  e.respondWith(
    fetch(req.url, {cache: 'no-cache', credentials: 'same-origin'}).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
