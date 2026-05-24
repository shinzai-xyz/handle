const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'bsky-converter-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// 変数名を統一しました
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './image/icon.png'
];

// 1. インストール時にアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // 更新が見つかった場合、即座に新しいSWを待機状態から解放
  );
});

// 2. 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // 他のアプリのキャッシュを誤って消さないよう、プレフィックスで判定
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // インストール後、即座にページをコントロール下におく
  );
});

// 3. リクエスト発生時：ネットワーク優先（Network First）、失敗時にキャッシュを返す
self.addEventListener('fetch', (event) => {
  // GETリクエスト以外（POSTなど）や拡張機能の通信などはバイパス
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 必要であれば、ここで取得した最新レスポンスをキャッシュに保存し直すことも可能です
        return response;
      })
      .catch(() => {
        // ネットワーク接続がない（オフライン）時にキャッシュを探して返す
        return caches.match(event.request);
      })
  );
});
