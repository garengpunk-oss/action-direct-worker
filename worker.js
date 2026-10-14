// Cloudflare Worker - DIRECT M3U8 RESOLVER
// Deploy di: https://dash.cloudflare.com -> Workers
// Hasil: https://vod-direct-action.yourname.workers.dev/?url=https://tv12.lk21official.cc/genre/action/page/1

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) return new Response('Missing?url=', {status: 400});

    const WORKER_LAMA = 'https://berkatasaia.pages.dev/m3u?url=' + encodeURIComponent(targetUrl);

    // Step 1: Ambil M3U bungkus (gambar 1)
    let res = await fetch(WORKER_LAMA);
    let m3uBungkus = await res.text();

    // Parse film
    let lines = m3uBungkus.split('\n');
    let movies = [];
    let cur = null;
    for (let ln of lines) {
      ln = ln.trim();
      if (ln.startsWith('#EXTINF')) {
        let logo = (ln.match(/tvg-logo="([^"]+)"/)||[])[1]||'';
        let title = ln.split(',').pop().trim();
        cur = {title, logo, url: ''};
      } else if (ln.startsWith('https://') && cur) {
        cur.url = ln;
        movies.push(cur);
        cur = null;
      }
    }

    // Step 2: Resolve tiap film jadi m3u8 langsung (gambar 2) - parallel
    async function getM3U8(movieUrl) {
      try {
        let r = await fetch(movieUrl);
        let txt = await r.text();
        let m = txt.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
        return m? m[0] : null;
      } catch { return null; }
    }

    let finalM3U = "#EXTM3U\n# DIRECT ACTION - " + new Date().toISOString() + "\n\n";

    // Fetch 10 film sekaligus biar cepat
    let promises = movies.map(async (mov) => {
      let m3u8 = await getM3U8(mov.url);
      if (!m3u8) return null;
      return `#EXTINF:-1 tvg-logo="${mov.logo}" group-title="Action",${mov.title}\n#EXTVLCOPT:http-user-agent=Mozilla/5.0\n#EXTVLCOPT:http-referer=https://turbovidhls.com/\n${m3u8}\n\n`;
    });

    let results = await Promise.all(promises);
    results.forEach(r => { if(r) finalM3U += r; });

    return new Response(finalM3U, {
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  }
}
