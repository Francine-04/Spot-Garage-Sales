const CACHE='spot-garage-static-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/spot-garage-logo.jpg']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('spot-garage-static-')&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET') return;
 if(event.request.mode==='navigate') event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
 else if(new URL(event.request.url).origin===self.location.origin && ['/spot-garage-logo.jpg'].includes(new URL(event.request.url).pathname)) event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
