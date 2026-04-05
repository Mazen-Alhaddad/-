/* ══════════════════════════════════════════
   الجدول الدوري — Service Worker v2
   يدعم العمل بدون إنترنت (Offline Mode) وحفظ الصور الخارجية
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
self.addEventListener('fetch', event => {
  // تجاهل أي طلبات ليست من نوع GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. إذا كان الملف (أو الصورة) موجوداً في الكاش، قم بإرجاعه فوراً
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. إذا لم يكن موجوداً، اطلبه من الإنترنت
      return fetch(event.request).then(response => {
        // التحقق من صلاحية الاستجابة
        // استجابات الصور من سيرفرات خارجية (بدون CORS) تظهر بـ status === 0 أو type === 'opaque'
        const isValidResponse = response && 
                               (response.status === 200 || response.status === 0) && 
                               (response.type === 'basic' || response.type === 'cors' || response.type === 'opaque');

        if (!isValidResponse) {
          return response;
        }

        // استنساخ الاستجابة وحفظها في الكاش للمرة القادمة
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // إذا فشل الاتصال بالإنترنت وكان المستخدم يحاول فتح الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
