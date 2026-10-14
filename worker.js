export default {
  async fetch(request) {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    const targetUrl = `https://tv12.lk21official.cc/genre/action/page/${page}`;
    const listUrl = `https://berkatasaia.pages.dev/m3u?url=${encodeURIComponent(targetUrl)}`;
    let listRes = await fetch(listUrl);
    let listText = await listRes.text();
    let out = "#EXTM3U\n";
    let lines = listText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.startsWith('#EXTINF')) {
        let extinf = line.replace(/group-title="[^"]*"/, 'group-title="Action"');
        let movieWorkerUrl = (lines[i+1] || '').trim();
        if (movieWorkerUrl.includes('m3u?movie=')) {
          try {
            let movieRes = await fetch(movieWorkerUrl);
            let movieText = await movieRes.text();
            let m = movieText.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/);
            if (m) out += extinf + "\n#EXTVLCOPT:http-referer=https://turbovidhls.com/\n" + m[0] + "\n\n";
          } catch(e) {}
        }
        i++;
      }
    }
    return new Response(out, { headers: { 'Content-Type': 'application/x-mpegurl', 'Access-Control-Allow-Origin': '*' }});
  }
}
