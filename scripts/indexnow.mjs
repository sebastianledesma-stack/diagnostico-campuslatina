// Avisa a los buscadores compatibles con IndexNow (Bing → ChatGPT Search, Copilot, DuckDuckGo; Yandex; Seznam; Naver)
// qué URLs se publicaron o cambiaron. Correr después de cada deploy con contenido nuevo:
//   node scripts/indexnow.mjs
// La clave se verifica con el archivo public/<clave>.txt publicado en el sitio.
const HOST = "diagnostico.campuslatina.com";
const KEY = "14fa1b1b892f1631472b6694058ebd6e";
const sitemap = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} · ${urlList.length} URLs`);
