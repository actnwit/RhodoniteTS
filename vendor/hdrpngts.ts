/**
 * The original code is hdrpng.js by Enki https://enkimute.github.io/hdrpng.js/
 *
 * Refactored and simplified version.
 */

function rgbeToFloat(buffer: Uint8Array): Float32Array {
  const l = buffer.byteLength >> 2;
  const res = new Float32Array(l * 3);
  for (var i = 0; i < l; i++) {
    const s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
    res[i * 3] = buffer[i * 4] * s;
    res[i * 3 + 1] = buffer[i * 4 + 1] * s;
    res[i * 3 + 2] = buffer[i * 4 + 2] * s;
  }
  return res;
}

export function loadHDR(uint8Array: Uint8Array): {
  width: number;
  height: number;
  dataFloat: Float32Array;
} {
  let header = '';
  let pos = 0;
  const d8 = uint8Array;
  let format = undefined as string | undefined;

  // read header.
  while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);

  // check format.
  format = header.match(/FORMAT=(.*)$/m)![1];
  if (format != '32-bit_rle_rgbe')
    return console.warn('unknown format : ' + format), this.onerror();

  // parse resolution
  let rez = header.split(/\n/).reverse()[1].split(' ');
  const width = (rez[3] as any) * 1;
  const height = (rez[1] as any) * 1;

  // Create image.
  const img = new Uint8Array(width * height * 4);
  let ipos = 0;

  // Read all scanlines
  for (let j = 0; j < height; j++) {
    let rgbe = d8.slice(pos, (pos += 4));
    const scanline: number[] = [];
    if (rgbe[0] != 2 || rgbe[1] != 2 || rgbe[2] & 0x80) {
      let len = width,
        rs = 0;
      pos -= 4;
      while (len > 0) {
        img.set(d8.slice(pos, (pos += 4)), ipos);
        if (img[ipos] == 1 && img[ipos + 1] == 1 && img[ipos + 2] == 1) {
          for (img[ipos + 3] << rs; i > 0; i--) {
            img.set(img.slice(ipos - 4, ipos), ipos);
            ipos += 4;
            len--;
          }
          rs += 8;
        } else {
          len--;
          ipos += 4;
          rs = 0;
        }
      }
    } else {
      if ((rgbe[2] << 8) + rgbe[3] != width)
        return console.warn('HDR line mismatch ..'), this.onerror();
      for (let i = 0; i < 4; i++) {
        let ptr = i * width,
          ptr_end = (i + 1) * width,
          buf,
          count;
        while (ptr < ptr_end) {
          buf = d8.slice(pos, (pos += 2));
          if (buf[0] > 128) {
            count = buf[0] - 128;
            while (count-- > 0) scanline[ptr++] = buf[1];
          } else {
            count = buf[0] - 1;
            scanline[ptr++] = buf[1];
            while (count-- > 0) scanline[ptr++] = d8[pos++];
          }
        }
      }
      for (var i = 0; i < width; i++) {
        img[ipos++] = scanline[i];
        img[ipos++] = scanline[i + width];
        img[ipos++] = scanline[i + 2 * width];
        img[ipos++] = scanline[i + 3 * width];
      }
    }
  }

  const imageFloat32Buffer = rgbeToFloat(img);

  return {
    width,
    height,
    dataFloat: imageFloat32Buffer,
  };
}
