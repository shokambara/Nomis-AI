// 1. バージョニング: CACHE_NAMEに変数を使い、バージョン管理ができるようにします。
const CACHE_VERSION = 'v2';
const CACHE_NAME = `nomis-ai-cache-${CACHE_VERSION}`;

// 2. プレキャッシュ: installイベントで、主要なファイルをキャッシュします。
const urlsToCache = [
  '/',
  '/index.html',
  '/travel_times.json',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap'
];

/**
 * Service Workerのインストールイベント
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened, caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 3. 即座にactivateイベントに進む
        console.log('Service Worker installed, skipping wait.');
        return self.skipWaiting();
      })
  );
});

/**
 * Service Workerのアクティベートイベント
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 4. 新しいバージョンのキャッシュ以外、全ての古いキャッシュを削除
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 5. 開いている全てのページの制御を即座に取得
      console.log('Service Worker activated, claiming clients.');
      return self.clients.claim();
    })
  );
});

/**
 * fetchイベント: ネットワーク優先、失敗時にキャッシュから応答
 */
self.addEventListener('fetch', event => {
  // HTMLファイルへのナビゲーションリクエストでない場合のみ処理
  if (event.request.mode !== 'navigate') {
    event.respondWith(
      // 6. ネットワークへのリクエストを試みる
      fetch(event.request)
        .then(networkResponse => {
          // ネットワークから正常に取得できた場合、レスポンスをクローンしてキャッシュを更新
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        })
        .catch(() => {
          // ネットワークリクエストが失敗した場合、キャッシュから応答を試みる
          return caches.match(event.request);
        })
    );
  }
});


