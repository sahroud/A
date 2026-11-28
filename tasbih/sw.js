const CACHE='sahroud-tasbih-shell-v58';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sahroud-tasbih-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==location.origin)return;
 const isPage=request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/');
 if(isPage){
  event.respondWith(fetch(request,{cache:'no-store'}).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
   return response;
  }).catch(()=>caches.match(request).then(hit=>hit||caches.match('./index.html'))));
  return;
 }
 if(url.pathname.endsWith('/audio/takbir.oga')){
  const audioUrl='https://upload.wikimedia.org/wikipedia/commons/6/69/Ar-eg-%D8%A7%D9%84%D9%84%D9%87_%D8%A3%D9%83%D8%A8%D8%B1.oga';
  event.respondWith(caches.match(request).then(async hit=>{
   if(hit)return hit;
   try{const response=await fetch(audioUrl,{mode:'no-cors',cache:'force-cache'});if(response&&response.type==='opaque'){const copy=response.clone();await caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;}
   catch(error){return caches.match(request).then(cached=>cached||new Response('Audio unavailable',{status:503,headers:{'Content-Type':'text/plain'}}));}
  }));
  return;
 }
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
  return response;
 })));
});
