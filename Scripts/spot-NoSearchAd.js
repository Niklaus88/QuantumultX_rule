/**
 * Spotify Search Ads Removal (browsita/v1/browse)
 * Source: devchristian1337/loon-plugins (adapted for Quantumult X & Loon/Surge)
 */
const isQuanX = typeof $task !== 'undefined';
let body = isQuanX ? new Uint8Array($response.bodyBytes) : $response.body;

function readVarint(buffer, offset) {
  let result = 0;
  let shift = 0;
  let pos = offset;

  while (true) {
    const byte = buffer[pos];
    const value = byte & 0x7F;
    result |= value << shift;
    pos++;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }

  return {
    value: result,
    length: pos - offset
  };
}

function parseField6(buffer) {
  for (let i = 0; i < MAX; i++) {
    if (buffer[i] === 0x32) { // found field 6
      const { value, length } = readVarint(buffer, i + 1);
      if (value > 12000) {
        buffer[i] = 0x7A;
        return {
          offset: i,
          dataLength: value,
          varintLength: length,
          totalLength: 1 + length + value
        };
      }  
    }
  }
  return null;
}

let MAX = 666;
if (body && body.length) {
  parseField6(body);
  if (isQuanX) {
    $done({ bodyBytes: body.buffer.slice(body.byteOffset, body.byteLength + body.byteOffset) });
  } else {
    $done({ body });
  }
} else {
  $done({});
}
