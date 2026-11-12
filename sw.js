const CACHE = 'earnings-log-v17';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './qrcode.js',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 网络优先：在线时拉最新版；失败或被拦截（403 等）时回退本地缓存，保证 App 永远能打开
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if(res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }
      // 服务器拒绝（如"链接不完整"403）：改用本地缓存，别把错误页亮给用户
      return caches.match(e.request, {ignoreSearch: true})
        .then(hit => hit || caches.match('./index.html'))
        .then(hit => hit || res);
    }).catch(() =>
      caches.match(e.request, {ignoreSearch: true}).then(hit => hit || caches.match('./index.html'))
    )
  );
});
