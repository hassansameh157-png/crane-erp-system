const CACHE_NAME = 'allcrane-erp-cache-v1';
const APP_SHELL_URL = './Allcrane_Egy_النظام_المحاسبي_مع_قاعدة_بيانات_أونلاين.html';

// عند التثبيت، نحفظ نسخة من صفحة التطبيق الرئيسية في الكاش المحلي
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([APP_SHELL_URL]);
    })
  );
  self.skipWaiting();
});

// عند التفعيل، نحذف أي نسخ كاش قديمة من إصدارات سابقة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/*
  استراتيجية "الشبكة أولًا، والكاش كخطة بديلة" (Network First, Cache Fallback):
  - نحاول دايمًا نجيب أحدث نسخة من الإنترنت أول حاجة، عشان التحديثات والبيانات تكون حديثة.
  - لو النت مقطوع أو الطلب فشل، نرجع للنسخة المحفوظة في الكاش بدل ما تظهر شاشة بيضاء فاضية.
  - لا نتدخل أبدًا في طلبات Supabase (API) — دي لازم تفشل بوضوح لو النت مقطوع،
    بدل ما نرجع بيانات قديمة من الكاش ونخلي المستخدم يفتكرها بيانات حقيقية محدثة.
*/
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('supabase.co') || url.includes('anthropic.com')) {
    return; // نسيب طلبات البيانات والـ API تمر عادي من غير أي تدخل من الكاش
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
