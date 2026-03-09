async function test() {
  const getRes = await fetch("https://veoaifree.com/veo-video-generator/");
  const html = await getRes.text();
  
  // Extract nonce
  const match = html.match(/"nonce"\s*:\s*"([^"]+)"/);
  if (!match) {
    console.error("Nonce not found");
    return;
  }
  const nonce = match[1];
  console.log("Found nonce:", nonce);
  
  const text = "A cat playing with a yarn";
  const body = new URLSearchParams();
  body.append("action", "veo_video_generator");
  body.append("actionType", "main-prompt-generation");
  body.append("prompt", text);
  body.append("nonce", nonce);
  
  const res = await fetch("https://veoaifree.com/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: {
      // Need a typical browser header so WP doesn't block it
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://veoaifree.com/veo-video-generator/",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: body,
  });
  
  const out = await res.text();
  console.log("RESPONSE:", out);
}
test();
