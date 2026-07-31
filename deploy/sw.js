"use strict";
var CACHE = "vault-mart-v5-4";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./fonts/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2",
  "./fonts/-F6qfjptAgt5VM-kVkqdyU8n3pQPwlBFgg.woff2",
  "./fonts/-F6qfjptAgt5VM-kVkqdyU8n3vAOwlBFgg.woff2",
  "./fonts/BCa2qYENg9Kw1mpLpO0bGM5lfHAAZHhDXE2g-lgHrQ.woff2",
  "./fonts/BCa2qYENg9Kw1mpLpO0bGM5lfHAAZHhDXE2i-lg.woff2",
  "./fonts/BCa5qYENg9Kw1mpLpO0bGM5lfHAAZHhDXEUZ3006jDu19Q.woff2",
  "./fonts/BCa5qYENg9Kw1mpLpO0bGM5lfHAAZHhDXEV93k04jDs.woff2",
  "./fonts/BCa5qYENg9Kw1mpLpO0bGM5lfHAAZHhDXEV93k06jDu19Q.woff2",
  "./fonts/BCa5qYENg9Kw1mpLpO0bGM5lfHAAZHhDXEVR2U04jDs.woff2",
  "./fonts/BCa5qYENg9Kw1mpLpO0bGM5lfHAAZHhDXEVR2U06jDu19Q.woff2"
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return c.add(u).catch(function () { /* missing asset must not fail install */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  /* The app is network-first so a redeploy lands on the next load; the cache is
     the offline fallback. Other assets stay cache-first. */
  var isDoc = req.mode === "navigate" || /\.html$/.test(new URL(req.url).pathname);
  if (isDoc) {
    ev.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        /* Never hand the app shell to an <img>/<script>/manifest request —
           only a navigation may fall back to the cached document. */
        return Response.error();
      });
    })
  );
});
