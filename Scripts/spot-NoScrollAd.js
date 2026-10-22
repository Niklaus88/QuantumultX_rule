/**
 * Spotify Scroll Ads Removal (scrollsita/v1/scroll/spotify)
 * Source: devchristian1337/loon-plugins (adapted for Quantumult X & Loon/Surge)
 */
const isQuanX = typeof $task !== 'undefined';
let body = isQuanX ? new Uint8Array($response.bodyBytes) : $response.body;

let MAX = 666;
let flag = 0;
if (body && body.length) {
  for (let i = 0; i < MAX && i + 1 < body.length; i++) {
    if (body[i] === 0xF2 && body[i + 1] === 0x01) {
      body[i] = 0xF7;
      body[i + 1] = 0x07;
      flag = 1;
      break;
    }
  }
  if (flag) {
    if (isQuanX) {
      $done({ bodyBytes: body.buffer.slice(body.byteOffset, body.byteLength + body.byteOffset) });
    } else {
      $done({ body });
    }
  } else {
    $done({});
  }
} else {
  $done({});
}
