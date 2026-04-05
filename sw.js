/* ══════════════════════════════════════════
   الجدول الدوري — Service Worker v2
   يدعم العمل بدون إنترنت (Offline Mode)
══════════════════════════════════════════ */

const CACHE_NAME = 'periodic-table-v2';

// الملفات التي سيتم حفظها في ذاكرة الهاتف/الكمبيوتر فوراً
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

/* ── المرحلة 1: التثبيت (Install) ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── المرحلة 2: التفعيل (Activate) ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/* ── المرحلة 3: جلب البيانات (Fetch) ── */
// هذا هو الجزء الذي سألت عنه، وهو المسؤول عن تشغيل التطبيق أوفلاين
self.addEventListener('fetch', event => {
  // تجاهل أي طلبات ليست من نوع GET (مثل طلبات الإضافة أو الحذف)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // إذا كان الملف موجوداً في الذاكرة، استخرجه منها
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يكن موجوداً، اطلبه من الإنترنت واحفظ نسخة منه للمرة القادمة
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // إذا فشل الإنترنت تماماً، افتح الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
