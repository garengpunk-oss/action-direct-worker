export default {
  async fetch(request) {
    const url = new URL(request.url);
    const genre = url.searchParams.get("genre") || "action";
    const page = url.searchParams.get("page") || "1";

    // GANTI INI DENGAN DOMAIN ASLI KAMU
    const targetUrl = `https://tv12.lk21official.cc/${genre}?page=${page}`;

    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();

    let movies = [];

    // --- CONTOH PARSER, SESUAIKAN DENGAN HTML SITUS KAMU ---
    // Misal HTML kamu: <div class="movie"><img src="..."><h2>Judul (2023)</h2><span class="genre">Action</span><a data-m3u8="...">
    const regex = /<div class="movie">.*?src="([^"]+)".*?<h2>(.*?) \((\d{4})\)<\/h2>.*?class="genre">(.*?)<\/span>.*?data-m3u8="([^"]+)"/gs;
    let match;
    while ((match = regex.exec(html))!== null) {
      movies.push({
        image: match[1],
        title: match[2].trim(),
        year: match[3],
        genre: match[4].trim(),
        m3u8: match[5]
      });
    }

    // Build M3U dengan logo & info
    let m3u = "#EXTM3U\n";
    for (const m of movies) {
      m3u += `#EXTINF:-1 tvg-logo="${m.image}" group-title="${m.genre}" year="${m.year}",${m.title} (${m.year})\n`;
      m3u += `${m.m3u8}\n`;
    }

    if (movies.length === 0) {
      m3u += `#EXTINF:-1,Parser kosong - cek selector HTML di example.com\n`;
      m3u += `https://tv12.lk21official.cc/notfound.m3u8\n`;
    }

    return new Response(m3u, {
      headers: {
        "Content-Type": "application/x-mpegurl; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      }
    });
  }
}
