import "./chunk-MHR6JRBZ.js";

// vendor/hdrpng.js
var hdrpng_default = (function(name, context, definition) {
  const HDRImage = definition();
  return HDRImage;
})("HDRImage", void 0, function() {
  function HDRImage() {
    var res = document.createElement("canvas"), HDRsrc = "t", HDRexposure = 1, HDRgamma = 2.2, HDRdata = null, context, HDRD;
    res.__defineGetter__("exposure", function() {
      return HDRexposure;
    });
    res.__defineSetter__("exposure", function(val) {
      HDRexposure = val;
      if (HDRdata) {
        rgbeToLDR(HDRdata, HDRexposure, HDRgamma, HDRD.data);
        context.putImageData(HDRD, 0, 0);
      }
    });
    res.__defineGetter__("gamma", function() {
      return HDRgamma;
    });
    res.__defineSetter__("gamma", function(val) {
      HDRgamma = val;
      if (HDRdata) {
        rgbeToLDR(HDRdata, HDRexposure, HDRgamma, HDRD.data);
        context.putImageData(HDRD, 0, 0);
      }
    });
    res.__defineGetter__("dataFloat", function() {
      return rgbeToFloat(HDRdata);
    });
    res.__defineGetter__("dataRGBE", function() {
      return HDRdata;
    });
    res.toHDRBlob = function(cb, m2, q) {
      function createShader(gl2, source, type) {
        var shader = gl2.createShader(type);
        gl2.shaderSource(shader, source);
        gl2.compileShader(shader);
        return shader;
      }
      function createProgram(gl2, vertexShaderSource, fragmentShaderSource) {
        var program2 = gl2.createProgram(), vs, fs;
        gl2.attachShader(program2, vs = createShader(gl2, vertexShaderSource, gl2.VERTEX_SHADER));
        gl2.attachShader(program2, fs = createShader(gl2, fragmentShaderSource, gl2.FRAGMENT_SHADER));
        gl2.linkProgram(program2);
        gl2.deleteShader(vs);
        gl2.deleteShader(fs);
        return program2;
      }
      ;
      var ar = m2 && m2.match(/rgb9_e5/i) ? new Uint8Array(floatToRgb9_e5(rgbeToFloat(HDRdata)).buffer) : new Uint8Array(HDRdata.buffer);
      var vs2 = "precision highp float;\nattribute vec3 position;\nvarying vec2 tex;\nvoid main() { tex = position.xy/2.0+0.5; gl_Position = vec4(position, 1.0); }";
      var fs2 = "precision highp float;\nprecision highp sampler2D;\nuniform sampler2D tx;\nvarying vec2 tex;\nvoid main() { gl_FragColor = texture2D(tx,tex); }";
      var x = this.width, y = this.height;
      if (x * y * 4 < ar.byteLength) return console.error("not big enough.");
      var c = document.createElement("canvas");
      c.width = x;
      c.height = y;
      var gl = c.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
      var texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, x, y, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(ar.buffer));
      var program = createProgram(gl, vs2, fs2), uniformTexLocation = gl.getUniformLocation(program, "tx");
      var positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0]), vertexPosBuffer = gl.createBuffer();
      gl.enableVertexAttribArray(0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.useProgram(program);
      gl.uniform1i(uniformTexLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      if (cb) return c.toBlob(cb);
    };
    res.__defineGetter__("src", function() {
      return HDRsrc;
    });
    res.__defineSetter__("src", function(val) {
      HDRsrc = val;
      context && context.clearRect(0, 0, this.width, this.height);
      if (val.match(/\.hdr$/i)) loadHDR(val, function(img, width, height) {
        HDRdata = img;
        this.width = this.style.width = width;
        this.height = this.style.height = height;
        context = this.getContext("2d");
        HDRD = context.getImageData(0, 0, width, height);
        rgbeToLDR(img, HDRexposure, HDRgamma, HDRD.data);
        context.putImageData(HDRD, 0, 0);
        this.onload && this.onload();
      }.bind(res));
      else if (val.match(/\.rgb9_e5\.png$/i)) {
        var i = new Image();
        i.src = val;
        i.onload = function() {
          var c = document.createElement("canvas"), x = this.width = this.style.width = c.width = i.width, y = this.height = this.style.height = c.height = i.height, gl = c.getContext("webgl");
          var texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
          fb = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
          var res2 = new Uint8Array(x * y * 4);
          gl.readPixels(0, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, res2);
          gl.deleteTexture(texture);
          gl.deleteFramebuffer(fb);
          this.dataRAW = new Uint32Array(res2.buffer);
          HDRdata = floatToRgbe(rgb9_e5ToFloat(this.dataRAW));
          context = this.getContext("2d");
          HDRD = context.getImageData(0, 0, x, y);
          rgbeToLDR(HDRdata, HDRexposure, HDRgamma, HDRD.data);
          context.putImageData(HDRD, 0, 0);
          this.onload && this.onload();
        }.bind(res);
      } else if (val.match(/\.hdr\.png$|\.rgbe\.png/i)) {
        var i = new Image();
        i.src = val;
        i.onload = function() {
          var c = document.createElement("canvas"), x = this.width = this.style.width = c.width = i.width, y = this.height = this.style.height = c.height = i.height, gl = c.getContext("webgl");
          var texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
          fb = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
          var res2 = new Uint8Array(x * y * 4);
          gl.readPixels(0, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, res2);
          gl.deleteTexture(texture);
          gl.deleteFramebuffer(fb);
          HDRdata = res2;
          context = this.getContext("2d");
          HDRD = context.getImageData(0, 0, x, y);
          rgbeToLDR(HDRdata, HDRexposure, HDRgamma, HDRD.data);
          context.putImageData(HDRD, 0, 0);
          this.onload && this.onload();
        }.bind(res);
      }
    });
    return res;
  }
  function m(a, b) {
    for (var i in b) a[i] = b[i];
    return a;
  }
  ;
  function loadHDR(url, completion) {
    var req = m(new XMLHttpRequest(), { responseType: "arraybuffer" });
    req.onerror = completion.bind(req, false);
    req.onload = function() {
      if (this.status >= 400) return this.onerror();
      var header = "", pos = 0, d8 = new Uint8Array(this.response), format;
      while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);
      format = header.match(/FORMAT=(.*)$/m)[1];
      if (format != "32-bit_rle_rgbe") return console.warn("unknown format : " + format), this.onerror();
      var rez = header.split(/\n/).reverse()[1].split(" "), width = rez[3] * 1, height = rez[1] * 1;
      var img = new Uint8Array(width * height * 4), ipos = 0;
      for (var j = 0; j < height; j++) {
        var rgbe = d8.slice(pos, pos += 4), scanline = [];
        if (rgbe[0] != 2 || rgbe[1] != 2 || rgbe[2] & 128) {
          var len = width, rs = 0;
          pos -= 4;
          while (len > 0) {
            img.set(d8.slice(pos, pos += 4), ipos);
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
          if ((rgbe[2] << 8) + rgbe[3] != width) return console.warn("HDR line mismatch .."), this.onerror();
          for (var i = 0; i < 4; i++) {
            var ptr = i * width, ptr_end = (i + 1) * width, buf, count;
            while (ptr < ptr_end) {
              buf = d8.slice(pos, pos += 2);
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
      completion && completion(img, width, height);
    };
    req.open("GET", url, true);
    req.send(null);
    return req;
  }
  function floatToRgb9_e5(buffer, res) {
    var r, g, b, v, maxColor, ExpShared, denom, s, l = buffer.byteLength / 12 | 0, res = res || new Uint32Array(l);
    for (var i = 0; i < l; i++) {
      r = Math.min(32768, buffer[i * 3]);
      g = Math.min(32768, buffer[i * 3 + 1]);
      b = Math.min(32768, buffer[i * 3 + 2]);
      maxColor = Math.max(Math.max(r, g), b);
      ExpShared = Math.max(-16, Math.floor(Math.log2(maxColor))) + 16;
      denom = Math.pow(2, ExpShared - 24);
      if (Math.floor(maxColor / denom + 0.5) == 511) {
        denom *= 2;
        ExpShared += 1;
      }
      res[i] = (Math.floor(r / denom + 0.5) << 23) + (Math.floor(g / denom + 0.5) << 14) + (Math.floor(b / denom + 0.5) << 5) + (ExpShared | 0);
    }
    return res;
  }
  function rgb9_e5ToFloat(buffer, res) {
    var v, s, l = buffer.byteLength >> 2, res = res || new Float32Array(l * 3);
    for (var i = 0; i < l; i++) {
      v = buffer[i];
      s = Math.pow(2, (v & 31) - 24);
      res[i * 3] = (v >>> 23) * s;
      res[i * 3 + 1] = (v >>> 14 & 511) * s;
      res[i * 3 + 2] = (v >>> 5 & 511) * s;
    }
    return res;
  }
  function floatToRgbe(buffer, res) {
    var r, g, b, v, s, l = buffer.byteLength / 12 | 0, res = res || new Uint8Array(l * 4);
    for (var i = 0; i < l; i++) {
      r = buffer[i * 3];
      g = buffer[i * 3 + 1];
      b = buffer[i * 3 + 2];
      v = Math.max(Math.max(r, g), b);
      e = Math.ceil(Math.log2(v));
      s = Math.pow(2, e - 8);
      res[i * 4] = r / s | 0;
      res[i * 4 + 1] = g / s | 0;
      res[i * 4 + 2] = b / s | 0;
      res[i * 4 + 3] = e + 128;
    }
    return res;
  }
  function rgbeToFloat(buffer, res) {
    var s, l = buffer.byteLength >> 2, res = res || new Float32Array(l * 3);
    for (var i = 0; i < l; i++) {
      s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
      res[i * 3] = buffer[i * 4] * s;
      res[i * 3 + 1] = buffer[i * 4 + 1] * s;
      res[i * 3 + 2] = buffer[i * 4 + 2] * s;
    }
    return res;
  }
  function rgbeToLDR(buffer, exposure, gamma, res) {
    exposure = Math.pow(2, exposure === void 0 ? 1 : exposure) / 2;
    if (gamma === void 0) gamma = 2.2;
    var one_over_gamma = 1 / gamma, s, l = buffer.byteLength >> 2, res = res || new Uint8ClampedArray(l * 4);
    for (var i = 0; i < l; i++) {
      s = exposure * Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
      res[i * 4] = 255 * Math.pow(buffer[i * 4] * s, one_over_gamma);
      res[i * 4 + 1] = 255 * Math.pow(buffer[i * 4 + 1] * s, one_over_gamma);
      res[i * 4 + 2] = 255 * Math.pow(buffer[i * 4 + 2] * s, one_over_gamma);
      res[i * 4 + 3] = 255;
    }
    return res;
  }
  function floatToLDR(buffer, exposure, gamma, res) {
    exposure = Math.pow(2, exposure === void 0 ? 1 : exposure) / 2;
    if (gamma === void 0) gamma = 2.2;
    var one_over_gamma = 1 / gamma, s, l = buffer.byteLength / 12 | 0, res = res || new Uint8ClampedArray(l * 4);
    for (var i = 0; i < l; i++) {
      res[i * 4] = 255 * Math.pow(buffer[i * 3] * exposure, one_over_gamma);
      res[i * 4 + 1] = 255 * Math.pow(buffer[i * 3 + 1] * exposure, one_over_gamma);
      res[i * 4 + 2] = 255 * Math.pow(buffer[i * 3 + 2] * exposure, one_over_gamma);
      res[i * 4 + 3] = 255;
    }
    return res;
  }
  HDRImage.floatToRgbe = floatToRgbe;
  HDRImage.rgbeToFloat = rgbeToFloat;
  HDRImage.floatToRgb9_e5 = floatToRgb9_e5;
  HDRImage.rgb9_e5ToFloat = rgb9_e5ToFloat;
  HDRImage.rgbeToLDR = rgbeToLDR;
  HDRImage.floatToLDR = floatToLDR;
  return HDRImage;
});
export {
  hdrpng_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vdmVuZG9yL2hkcnBuZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBoZHJwbmcuanMgLSBzdXBwb3J0IGZvciBSYWRpYW5jZSAuSERSIGFuZCBSR0JFIC8gUkdCOV9FNSBpbWFnZXMgaW4gUE5HLlxuICogQGF1dGhvciBFbmtpXG4gKiBAZGVzYyBsb2FkL3NhdmUgUmFkaWFuY2UgLkhEUiwgUkdCRSBpbiBQTkcgYW5kIFJHQjlfRTUgaW4gUE5HIGZvciBIVE1MNSwgd2ViR0wsIHdlYkdMMi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBkZWZpbml0aW9uKSB7XG4gIGNvbnN0IEhEUkltYWdlID0gZGVmaW5pdGlvbigpO1xuICByZXR1cm4gSERSSW1hZ2U7XG59KCdIRFJJbWFnZScsIHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgLyoqXG4gICAqIEhEUkltYWdlIC0gd3JhcHBlciB0aGF0IGV4cG9zZXMgZGVmYXVsdCBJbWFnZSBsaWtlIGludGVyZmFjZSBmb3IgSERSIGltZ2Flcy4gKHRpbGwgZXh0ZW5kaW5nIEhUTUxDYW52YXNFbGVtZW50IGFjdHVhbGx5IHdvcmtzIC4uKVxuICAgKiBAcmV0dXJucyB7SERSSW1hZ2V9IGEgaHRtbCBIRFIgaW1hZ2UgZWxlbWVudFxuICAgKi9cbiAgZnVuY3Rpb24gSERSSW1hZ2UoKSB7XG4gICAgdmFyIHJlcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLCBIRFJzcmM9J3QnLEhEUmV4cG9zdXJlPTEuMCxIRFJnYW1tYT0yLjIsSERSZGF0YT1udWxsLGNvbnRleHQsSERSRDtcbiAgICByZXMuX19kZWZpbmVHZXR0ZXJfXygnZXhwb3N1cmUnLGZ1bmN0aW9uKCl7cmV0dXJuIEhEUmV4cG9zdXJlfSk7XG4gICAgcmVzLl9fZGVmaW5lU2V0dGVyX18oJ2V4cG9zdXJlJyxmdW5jdGlvbih2YWwpeyBIRFJleHBvc3VyZT12YWw7IGlmIChIRFJkYXRhKSB7IHJnYmVUb0xEUihIRFJkYXRhLEhEUmV4cG9zdXJlLEhEUmdhbW1hLEhEUkQuZGF0YSk7IGNvbnRleHQucHV0SW1hZ2VEYXRhKEhEUkQsMCwwKTsgfX0pO1xuICAgIHJlcy5fX2RlZmluZUdldHRlcl9fKCdnYW1tYScsZnVuY3Rpb24oKXtyZXR1cm4gSERSZ2FtbWF9KTtcbiAgICByZXMuX19kZWZpbmVTZXR0ZXJfXygnZ2FtbWEnLGZ1bmN0aW9uKHZhbCl7IEhEUmdhbW1hPXZhbDsgaWYgKEhEUmRhdGEpIHsgcmdiZVRvTERSKEhEUmRhdGEsSERSZXhwb3N1cmUsSERSZ2FtbWEsSERSRC5kYXRhKTsgY29udGV4dC5wdXRJbWFnZURhdGEoSERSRCwwLDApOyB9fSk7XG4gICAgcmVzLl9fZGVmaW5lR2V0dGVyX18oJ2RhdGFGbG9hdCcsZnVuY3Rpb24oKXsgcmV0dXJuIHJnYmVUb0Zsb2F0KEhEUmRhdGEpOyB9KTtcbiAgICByZXMuX19kZWZpbmVHZXR0ZXJfXygnZGF0YVJHQkUnLGZ1bmN0aW9uKCl7IHJldHVybiBIRFJkYXRhOyB9KTtcbiAgICByZXMudG9IRFJCbG9iID0gZnVuY3Rpb24oY2IsbSxxKSB7XG4gICAgICAvLyBBcnJheSB0byBpbWFnZS4uIHNsaWdodGx5IG1vcmUgaW52b2x2ZWQuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVNoYWRlcihnbCwgc291cmNlLCB0eXBlKSB7XG4gICAgICAgICAgICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpO1xuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcbiAgICAgICAgICAgIHJldHVybiBzaGFkZXI7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUHJvZ3JhbShnbCwgdmVydGV4U2hhZGVyU291cmNlLCBmcmFnbWVudFNoYWRlclNvdXJjZSkge1xuICAgICAgICAgICAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCksdnMsZnM7XG4gICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnM9Y3JlYXRlU2hhZGVyKGdsLCB2ZXJ0ZXhTaGFkZXJTb3VyY2UsIGdsLlZFUlRFWF9TSEFERVIpKTtcbiAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcz1jcmVhdGVTaGFkZXIoZ2wsIGZyYWdtZW50U2hhZGVyU291cmNlLCBnbC5GUkFHTUVOVF9TSEFERVIpKTtcbiAgICAgICAgICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pOyBnbC5kZWxldGVTaGFkZXIodnMpOyBnbC5kZWxldGVTaGFkZXIoZnMpO1xuICAgICAgICAgICAgcmV0dXJuIHByb2dyYW07XG4gICAgICAgIH07XG4gICAgICAgIHZhciBhciA9IChtICYmIG0ubWF0Y2goL3JnYjlfZTUvaSkpID8gbmV3IFVpbnQ4QXJyYXkoIGZsb2F0VG9SZ2I5X2U1KHJnYmVUb0Zsb2F0KEhEUmRhdGEpKS5idWZmZXIgKSA6IG5ldyBVaW50OEFycmF5KEhEUmRhdGEuYnVmZmVyKTtcbiAgICAgICAgdmFyIHZzMj0ncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcbmF0dHJpYnV0ZSB2ZWMzIHBvc2l0aW9uO1xcbnZhcnlpbmcgdmVjMiB0ZXg7XFxudm9pZCBtYWluKCkgeyB0ZXggPSBwb3NpdGlvbi54eS8yLjArMC41OyBnbF9Qb3NpdGlvbiA9IHZlYzQocG9zaXRpb24sIDEuMCk7IH0nO1xuICAgICAgICB2YXIgZnMyPSdwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxucHJlY2lzaW9uIGhpZ2hwIHNhbXBsZXIyRDtcXG51bmlmb3JtIHNhbXBsZXIyRCB0eDtcXG52YXJ5aW5nIHZlYzIgdGV4O1xcbnZvaWQgbWFpbigpIHsgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHR4LHRleCk7IH0nO1xuICAgICAgICB2YXIgeCA9IHRoaXMud2lkdGgsIHkgPSB0aGlzLmhlaWdodDtcbiAgICAgICAgaWYgKHgqeSo0IDwgYXIuYnl0ZUxlbmd0aCkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ25vdCBiaWcgZW5vdWdoLicpO1xuICAgICAgICB2YXIgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBjLndpZHRoPXg7IGMuaGVpZ2h0PXk7XG4gICAgICAgIHZhciBnbCA9IGMuZ2V0Q29udGV4dCgnd2ViZ2wnLHthbnRpYWxpYXM6ZmFsc2UsYWxwaGE6dHJ1ZSxwcmVtdWx0aXBsaWVkQWxwaGE6ZmFsc2UscHJlc2VydmVEcmF3aW5nQnVmZmVyOnRydWV9KTtcblxuICAgICAgICB2YXIgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7ICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTsgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsdHJ1ZSk7XG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTsgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTsgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgIGdsLnRleEltYWdlMkQoIGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIHgsIHksIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KGFyLmJ1ZmZlcikpO1xuXG4gICAgICAgIHZhciBwcm9ncmFtID0gY3JlYXRlUHJvZ3JhbShnbCwgdnMyLCBmczIpLCB1bmlmb3JtVGV4TG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgJ3R4Jyk7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkoWy0xLCAtMSwgMCwgMSwgLTEsIDAsIDEsICAxLCAwLCAxLCAgMSwgMCwgLTEsICAxLCAwLCAtMSwgLTEsIDAgXSksIHZlcnRleFBvc0J1ZmZlcj1nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoMCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0ZXhQb3NCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgcG9zaXRpb25zLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoMCwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICBnbC51c2VQcm9ncmFtKHByb2dyYW0pO1xuICAgICAgICBnbC51bmlmb3JtMWkodW5pZm9ybVRleExvY2F0aW9uLCAwKTtcbiAgICAgICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIDYpO1xuXG4gICAgICAgIGdsLmRlbGV0ZVRleHR1cmUodGV4dHVyZSk7XG4gICAgICAgIGdsLmRlbGV0ZVByb2dyYW0ocHJvZ3JhbSk7XG5cbiAgICAgICAgaWYgKGNiKSByZXR1cm4gYy50b0Jsb2IoY2IpO1xuICAgIH1cbiAgICByZXMuX19kZWZpbmVHZXR0ZXJfXygnc3JjJyxmdW5jdGlvbigpe3JldHVybiBIRFJzcmN9KTtcbiAgICByZXMuX19kZWZpbmVTZXR0ZXJfXygnc3JjJyxmdW5jdGlvbih2YWwpe1xuICAgICAgSERSc3JjPXZhbDtcbiAgICAgIGNvbnRleHQmJmNvbnRleHQuY2xlYXJSZWN0KDAsMCx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KTtcbiAgICAgIGlmICh2YWwubWF0Y2goL1xcLmhkciQvaSkpIGxvYWRIRFIodmFsLGZ1bmN0aW9uKGltZyx3aWR0aCxoZWlnaHQpe1xuICAgICAgICBIRFJkYXRhID0gaW1nO1xuICAgICAgICB0aGlzLndpZHRoICA9IHRoaXMuc3R5bGUud2lkdGggID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIGNvbnRleHQgPSB0aGlzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIEhEUkQgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLDAsd2lkdGgsaGVpZ2h0KTtcbiAgICAgICAgcmdiZVRvTERSKGltZyxIRFJleHBvc3VyZSxIRFJnYW1tYSxIRFJELmRhdGEpO1xuICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShIRFJELDAsMCk7XG4gICAgICAgIHRoaXMub25sb2FkJiZ0aGlzLm9ubG9hZCgpO1xuICAgICAgfS5iaW5kKHJlcykpO1xuICAgICAgZWxzZSBpZiAodmFsLm1hdGNoKC9cXC5yZ2I5X2U1XFwucG5nJC9pKSkge1xuICAgICAgICB2YXIgaSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpLnNyYyA9IHZhbDtcbiAgICAgICAgaS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLCB4PXRoaXMud2lkdGg9dGhpcy5zdHlsZS53aWR0aD1jLndpZHRoPWkud2lkdGgsIHk9dGhpcy5oZWlnaHQ9dGhpcy5zdHlsZS5oZWlnaHQ9Yy5oZWlnaHQ9aS5oZWlnaHQsIGdsPWMuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcblxuICAgICAgICAgIHZhciB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpO1xuICAgICAgICAgIGdsLnRleEltYWdlMkQoIGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGkpO1xuXG4gICAgICAgICAgZmIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmIpO1xuICAgICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKCBnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuXG4gICAgICAgICAgdmFyIHJlcyA9IG5ldyBVaW50OEFycmF5KHgqeSo0KTtcbiAgICAgICAgICBnbC5yZWFkUGl4ZWxzKDAsMCx4LHksZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHJlcyk7XG5cbiAgICAgICAgICBnbC5kZWxldGVUZXh0dXJlKHRleHR1cmUpO1xuICAgICAgICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKGZiKTtcblxuICAgICAgICAgIHRoaXMuZGF0YVJBVyA9IG5ldyBVaW50MzJBcnJheShyZXMuYnVmZmVyKTtcbiAgICAgICAgICBIRFJkYXRhID0gZmxvYXRUb1JnYmUocmdiOV9lNVRvRmxvYXQodGhpcy5kYXRhUkFXKSk7XG4gICAgICAgICAgY29udGV4dCA9IHRoaXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBIRFJEID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwwLHgseSk7XG4gICAgICAgICAgcmdiZVRvTERSKEhEUmRhdGEsSERSZXhwb3N1cmUsSERSZ2FtbWEsSERSRC5kYXRhKTtcbiAgICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShIRFJELDAsMCk7XG4gICAgICAgICAgdGhpcy5vbmxvYWQmJnRoaXMub25sb2FkKCk7XG4gICAgICAgIH0uYmluZChyZXMpO1xuICAgICAgfSBlbHNlIGlmICh2YWwubWF0Y2goL1xcLmhkclxcLnBuZyR8XFwucmdiZVxcLnBuZy9pKSkge1xuICAgICAgICB2YXIgaSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpLnNyYyA9IHZhbDtcbiAgICAgICAgaS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLCB4PXRoaXMud2lkdGg9dGhpcy5zdHlsZS53aWR0aD1jLndpZHRoPWkud2lkdGgsIHk9dGhpcy5oZWlnaHQ9dGhpcy5zdHlsZS5oZWlnaHQ9Yy5oZWlnaHQ9aS5oZWlnaHQsIGdsPWMuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcblxuICAgICAgICAgIHZhciB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpO1xuICAgICAgICAgIGdsLnRleEltYWdlMkQoIGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGkpO1xuXG4gICAgICAgICAgZmIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZmIpO1xuICAgICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKCBnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuXG4gICAgICAgICAgdmFyIHJlcyA9IG5ldyBVaW50OEFycmF5KHgqeSo0KTtcbiAgICAgICAgICBnbC5yZWFkUGl4ZWxzKDAsMCx4LHksZ2wuUkdCQSxnbC5VTlNJR05FRF9CWVRFLHJlcyk7XG5cbiAgICAgICAgICBnbC5kZWxldGVUZXh0dXJlKHRleHR1cmUpO1xuICAgICAgICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKGZiKTtcblxuICAgICAgICAgIEhEUmRhdGEgPSByZXM7XG4gICAgICAgICAgY29udGV4dCA9IHRoaXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICBIRFJEID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwwLHgseSk7XG4gICAgICAgICAgcmdiZVRvTERSKEhEUmRhdGEsSERSZXhwb3N1cmUsSERSZ2FtbWEsSERSRC5kYXRhKTtcbiAgICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShIRFJELDAsMCk7XG4gICAgICAgICAgdGhpcy5vbmxvYWQmJnRoaXMub25sb2FkKCk7XG4gICAgICAgIH0uYmluZChyZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH1cblxuICBmdW5jdGlvbiBtKGEsYikgeyBmb3IgKHZhciBpIGluIGIpIGFbaV09YltpXTsgcmV0dXJuIGE7IH07XG5cbiAgLyoqIExvYWQgYW5kIHBhcnNlIGEgUmFkaWFuY2UgLkhEUiBmaWxlLiBJdCBjb21wbGV0ZXMgd2l0aCBhIDMyYml0IFJHQkUgYnVmZmVyLlxuICAgICogQHBhcmFtIHtVUkx9IHVybCBsb2NhdGlvbiBvZiAuSERSIGZpbGUgdG8gbG9hZC5cbiAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBsZXRpb24gY29tcGxldGlvbiBjYWxsYmFjay5cbiAgICAqIEByZXR1cm5zIHtYTUxIdHRwUmVxdWVzdH0gdGhlIFhNTEh0dHBSZXF1ZXN0IHVzZWQgdG8gZG93bmxvYWQgdGhlIGZpbGUuXG4gICAgKi9cbiAgZnVuY3Rpb24gbG9hZEhEUiggdXJsLCBjb21wbGV0aW9uICkge1xuICAgIHZhciByZXEgPSBtKG5ldyBYTUxIdHRwUmVxdWVzdCgpLHtyZXNwb25zZVR5cGU6XCJhcnJheWJ1ZmZlclwifSk7XG4gICAgcmVxLm9uZXJyb3IgPSBjb21wbGV0aW9uLmJpbmQocmVxLGZhbHNlKTtcbiAgICByZXEub25sb2FkICA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc3RhdHVzPj00MDApIHJldHVybiB0aGlzLm9uZXJyb3IoKTtcbiAgICAgIHZhciBoZWFkZXI9JycscG9zPTAsZDg9bmV3IFVpbnQ4QXJyYXkodGhpcy5yZXNwb25zZSksZm9ybWF0O1xuICAgIC8vIHJlYWQgaGVhZGVyLlxuICAgICAgd2hpbGUgKCFoZWFkZXIubWF0Y2goL1xcblxcblteXFxuXStcXG4vZykpIGhlYWRlciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGQ4W3BvcysrXSk7XG4gICAgLy8gY2hlY2sgZm9ybWF0LlxuICAgICAgZm9ybWF0ID0gaGVhZGVyLm1hdGNoKC9GT1JNQVQ9KC4qKSQvbSlbMV07XG4gICAgICBpZiAoZm9ybWF0IT0nMzItYml0X3JsZV9yZ2JlJykgcmV0dXJuIGNvbnNvbGUud2FybigndW5rbm93biBmb3JtYXQgOiAnK2Zvcm1hdCksdGhpcy5vbmVycm9yKCk7XG4gICAgLy8gcGFyc2UgcmVzb2x1dGlvblxuICAgICAgdmFyIHJlej1oZWFkZXIuc3BsaXQoL1xcbi8pLnJldmVyc2UoKVsxXS5zcGxpdCgnICcpLCB3aWR0aD1yZXpbM10qMSwgaGVpZ2h0PXJlelsxXSoxO1xuICAgIC8vIENyZWF0ZSBpbWFnZS5cbiAgICAgIHZhciBpbWc9bmV3IFVpbnQ4QXJyYXkod2lkdGgqaGVpZ2h0KjQpLGlwb3M9MDtcbiAgICAvLyBSZWFkIGFsbCBzY2FubGluZXNcbiAgICAgIGZvciAodmFyIGo9MDsgajxoZWlnaHQ7IGorKykge1xuICAgICAgICB2YXIgcmdiZT1kOC5zbGljZShwb3MscG9zKz00KSxzY2FubGluZT1bXTtcbiAgICAgICAgaWYgKHJnYmVbMF0hPTJ8fChyZ2JlWzFdIT0yKXx8KHJnYmVbMl0mMHg4MCkpIHtcbiAgICAgICAgICB2YXIgbGVuPXdpZHRoLHJzPTA7IHBvcy09NDsgd2hpbGUgKGxlbj4wKSB7XG4gICAgICAgICAgICBpbWcuc2V0KGQ4LnNsaWNlKHBvcyxwb3MrPTQpLGlwb3MpO1xuICAgICAgICAgICAgaWYgKGltZ1tpcG9zXT09MSYmaW1nW2lwb3MrMV09PTEmJmltZ1tpcG9zKzJdPT0xKSB7XG4gICAgICAgICAgICAgIGZvciAoaW1nW2lwb3MrM108PHJzOyBpPjA7IGktLSkge1xuICAgICAgICAgICAgICAgIGltZy5zZXQoaW1nLnNsaWNlKGlwb3MtNCxpcG9zKSxpcG9zKTtcbiAgICAgICAgICAgICAgICBpcG9zKz00O1xuICAgICAgICAgICAgICAgIGxlbi0tXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcnMrPTg7XG4gICAgICAgICAgICB9IGVsc2UgeyBsZW4tLTsgaXBvcys9NDsgcnM9MDsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoKHJnYmVbMl08PDgpK3JnYmVbM10hPXdpZHRoKSByZXR1cm4gY29uc29sZS53YXJuKCdIRFIgbGluZSBtaXNtYXRjaCAuLicpLHRoaXMub25lcnJvcigpO1xuICAgICAgICAgIGZvciAodmFyIGk9MDtpPDQ7aSsrKSB7XG4gICAgICAgICAgICAgIHZhciBwdHI9aSp3aWR0aCxwdHJfZW5kPShpKzEpKndpZHRoLGJ1Zixjb3VudDtcbiAgICAgICAgICAgICAgd2hpbGUgKHB0cjxwdHJfZW5kKXtcbiAgICAgICAgICAgICAgICAgIGJ1ZiA9IGQ4LnNsaWNlKHBvcyxwb3MrPTIpO1xuICAgICAgICAgICAgICAgICAgaWYgKGJ1ZlswXSA+IDEyOCkgeyBjb3VudCA9IGJ1ZlswXS0xMjg7IHdoaWxlKGNvdW50LS0gPiAwKSBzY2FubGluZVtwdHIrK10gPSBidWZbMV07IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHsgY291bnQgPSBidWZbMF0tMTsgc2NhbmxpbmVbcHRyKytdPWJ1ZlsxXTsgd2hpbGUoY291bnQtLT4wKSBzY2FubGluZVtwdHIrK109ZDhbcG9zKytdOyB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICh2YXIgaT0wO2k8d2lkdGg7aSsrKSB7IGltZ1tpcG9zKytdPXNjYW5saW5lW2ldOyBpbWdbaXBvcysrXT1zY2FubGluZVtpK3dpZHRoXTsgaW1nW2lwb3MrK109c2NhbmxpbmVbaSsyKndpZHRoXTsgaW1nW2lwb3MrK109c2NhbmxpbmVbaSszKndpZHRoXTsgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb21wbGV0aW9uJiZjb21wbGV0aW9uKGltZyx3aWR0aCxoZWlnaHQpO1xuICAgIH1cbiAgICByZXEub3BlbihcIkdFVFwiLHVybCx0cnVlKTtcbiAgICByZXEuc2VuZChudWxsKTtcbiAgICByZXR1cm4gcmVxO1xuICB9XG5cbiAgLyoqIENvbnZlcnQgYSBmbG9hdCBidWZmZXIgdG8gYSBSR0I5X0U1IGJ1ZmZlci4gKHJlZiBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9PcGVuR0wvZXh0ZW5zaW9ucy9FWFQvRVhUX3RleHR1cmVfc2hhcmVkX2V4cG9uZW50LnR4dClcbiAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBCdWZmZXIgRmxvYXRpbmcgcG9pbnQgaW5wdXQgYnVmZmVyICg5NiBiaXRzL3BpeGVsKS5cbiAgICAqIEBwYXJhbSB7VWludDMyQXJyYXl9IFtyZXNdIE9wdGlvbmFsIG91dHB1dCBidWZmZXIgd2l0aCAzMiBiaXQgUkdCOV9FNSBwZXIgcGl4ZWwuXG4gICAgKiBAcmV0dXJucyB7VWludDMyQXJyYXl9IEEgMzJiaXQgdWludDMyIGFycmF5IGluIFJHQjlfRTVcbiAgICAqL1xuICBmdW5jdGlvbiBmbG9hdFRvUmdiOV9lNShidWZmZXIscmVzKSB7XG4gICAgdmFyIHIsZyxiLHYsbWF4Q29sb3IsRXhwU2hhcmVkLGRlbm9tLHMsbD0oYnVmZmVyLmJ5dGVMZW5ndGgvMTIpfDAsIHJlcz1yZXN8fG5ldyBVaW50MzJBcnJheShsKTtcbiAgICBmb3IgKHZhciBpPTA7aTxsO2krKykge1xuICAgICAgcj1NYXRoLm1pbigzMjc2OC4wLGJ1ZmZlcltpKjNdKTsgZz1NYXRoLm1pbigzMjc2OC4wLGJ1ZmZlcltpKjMrMV0pOyBiPU1hdGgubWluKDMyNzY4LjAsYnVmZmVyW2kqMysyXSk7XG4gICAgICBtYXhDb2xvciA9IE1hdGgubWF4KE1hdGgubWF4KHIsZyksYik7XG4gICAgICBFeHBTaGFyZWQgPSBNYXRoLm1heCgtMTYsTWF0aC5mbG9vcihNYXRoLmxvZzIobWF4Q29sb3IpKSkgKyAxNjtcbiAgICAgIGRlbm9tID0gTWF0aC5wb3coMixFeHBTaGFyZWQtMjQpO1xuICAgICAgaWYgKE1hdGguZmxvb3IobWF4Q29sb3IvZGVub20rMC41KSA9PSA1MTEpIHsgZGVub20gKj0gMjsgRXhwU2hhcmVkICs9IDE7IH1cbiAgICAgIHJlc1tpXSA9IChNYXRoLmZsb29yKHIvZGVub20rMC41KTw8MjMpKyhNYXRoLmZsb29yKGcvZGVub20rMC41KTw8MTQpKyhNYXRoLmZsb29yKGIvZGVub20rMC41KTw8NSkrIChFeHBTaGFyZWR8MCk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogQ29udmVydCBhbiBSR0I5X0U1IGJ1ZmZlciB0byBhIEZsb2F0IGJ1ZmZlci5cbiAgICAqIEBwYXJhbSB7VWludDMyQXJyYXl9IEJ1ZmZlciBpbiBSR0I5X0U1IGZvcm1hdC4gKFVpbnQzMiBidWZmZXIpLlxuICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IFtyZXNdIE9wdGlvbmFsIGZsb2F0IG91dHB1dCBidWZmZXIuXG4gICAgKiBAcmV0dXJucyB7RmxvYXQzMkFycmF5fSBBIEZsb2F0MzJBcnJheS5cbiAgICAqL1xuICBmdW5jdGlvbiByZ2I5X2U1VG9GbG9hdChidWZmZXIscmVzKSB7XG4gICAgdmFyIHYscyxsPWJ1ZmZlci5ieXRlTGVuZ3RoPj4yLCByZXM9cmVzfHxuZXcgRmxvYXQzMkFycmF5KGwqMyk7XG4gICAgZm9yICh2YXIgaT0wO2k8bDtpKyspIHtcbiAgICAgIHYgPSBidWZmZXJbaV07IHMgPSBNYXRoLnBvdygyLCh2JjMxKS0yNCk7XG4gICAgICByZXNbaSozXSAgID0gICh2Pj4+MjMpKnM7XG4gICAgICByZXNbaSozKzFdID0gKCh2Pj4+MTQpJjUxMSkqcztcbiAgICAgIHJlc1tpKjMrMl0gPSAoKHY+Pj41KSY1MTEpKnM7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICAvKiogQ29udmVydCBhIGZsb2F0IGJ1ZmZlciB0byBhIFJHQkUgYnVmZmVyLlxuICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IEJ1ZmZlciBGbG9hdGluZyBwb2ludCBpbnB1dCBidWZmZXIgKDk2IGJpdHMvcGl4ZWwpLlxuICAgICogQHBhcmFtIHtVaW50OEFycmF5fSBbcmVzXSBPcHRpb25hbCBvdXRwdXQgYnVmZmVyIHdpdGggMzIgYml0IFJHQkUgcGVyIHBpeGVsLlxuICAgICogQHJldHVybnMge1VpbnQ4QXJyYXl9IEEgMzJiaXQgdWludDggYXJyYXkgaW4gUkdCRVxuICAgICovXG4gIGZ1bmN0aW9uIGZsb2F0VG9SZ2JlKGJ1ZmZlcixyZXMpIHtcbiAgICB2YXIgcixnLGIsdixzLGw9KGJ1ZmZlci5ieXRlTGVuZ3RoLzEyKXwwLCByZXM9cmVzfHxuZXcgVWludDhBcnJheShsKjQpO1xuICAgIGZvciAodmFyIGk9MDtpPGw7aSsrKSB7XG4gICAgICByID0gYnVmZmVyW2kqM107IGcgPSBidWZmZXJbaSozKzFdOyBiID0gYnVmZmVyW2kqMysyXTtcbiAgICAgIHYgPSBNYXRoLm1heChNYXRoLm1heChyLGcpLGIpOyBlID0gTWF0aC5jZWlsKE1hdGgubG9nMih2KSk7IHMgPSBNYXRoLnBvdygyLGUtOCk7XG4gICAgICByZXNbaSo0XSAgID0gKHIvcyl8MDtcbiAgICAgIHJlc1tpKjQrMV0gPSAoZy9zKXwwO1xuICAgICAgcmVzW2kqNCsyXSA9IChiL3MpfDA7XG4gICAgICByZXNbaSo0KzNdID0gKGUrMTI4KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKiBDb252ZXJ0IGFuIFJHQkUgYnVmZmVyIHRvIGEgRmxvYXQgYnVmZmVyLlxuICAgICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgVGhlIGlucHV0IGJ1ZmZlciBpbiBSR0JFIGZvcm1hdC4gKGFzIHJldHVybmVkIGZyb20gbG9hZEhEUilcbiAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBbcmVzXSBPcHRpb25hbCByZXN1bHQgYnVmZmVyIGNvbnRhaW5pbmcgMyBmbG9hdHMgcGVyIHBpeGVsLlxuICAgICogQHJldHVybnMge0Zsb2F0MzJBcnJheX0gQSBmbG9hdGluZyBwb2ludCBidWZmZXIgd2l0aCA5NiBiaXRzIHBlciBwaXhlbCAoMzIgcGVyIGNoYW5uZWwsIDMgY2hhbm5lbHMpLlxuICAgICovXG4gIGZ1bmN0aW9uIHJnYmVUb0Zsb2F0KGJ1ZmZlcixyZXMpIHtcbiAgICB2YXIgcyxsPWJ1ZmZlci5ieXRlTGVuZ3RoPj4yLCByZXM9cmVzfHxuZXcgRmxvYXQzMkFycmF5KGwqMyk7XG4gICAgZm9yICh2YXIgaT0wO2k8bDtpKyspIHtcbiAgICAgIHMgPSBNYXRoLnBvdygyLGJ1ZmZlcltpKjQrM10tKDEyOCs4KSk7XG4gICAgICByZXNbaSozXT1idWZmZXJbaSo0XSpzO1xuICAgICAgcmVzW2kqMysxXT1idWZmZXJbaSo0KzFdKnM7XG4gICAgICByZXNbaSozKzJdPWJ1ZmZlcltpKjQrMl0qcztcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIC8qKiBDb252ZXJ0IGFuIFJHQkUgYnVmZmVyIHRvIExEUiB3aXRoIGdpdmVuIGV4cG9zdXJlIGFuZCBkaXNwbGF5IGdhbW1hLlxuICAgICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgVGhlIGlucHV0IGJ1ZmZlciBpbiBSR0JFIGZvcm1hdC4gKGFzIHJldHVybmVkIGZyb20gbG9hZEhEUilcbiAgICAqIEBwYXJhbSB7ZmxvYXR9IFtleHBvc3VyZT0xXSBPcHRpb25hbCBleHBvc3VyZSB2YWx1ZS4gKDE9ZGVmYXVsdCwgMj0xIHN0ZXAgdXAsIDM9MiBzdGVwcyB1cCwgLTIgPSAzIHN0ZXBzIGRvd24pXG4gICAgKiBAcGFyYW0ge2Zsb2F0fSBbZ2FtbWE9Mi4yXSAgT3B0aW9uYWwgZGlzcGxheSBnYW1tYSB0byByZXNwZWN0LiAoMS4wID0gbGluZWFyLCAyLjIgPSBkZWZhdWx0IG1vbml0b3IpXG4gICAgKiBAcGFyYW0ge0FycmF5fSBbcmVzXSByZXMgT3B0aW9uYWwgcmVzdWx0IGJ1ZmZlci5cbiAgICAqL1xuICBmdW5jdGlvbiByZ2JlVG9MRFIoYnVmZmVyLGV4cG9zdXJlLGdhbW1hLHJlcykge1xuICAgIGV4cG9zdXJlID0gTWF0aC5wb3coMixleHBvc3VyZT09PXVuZGVmaW5lZD8xOmV4cG9zdXJlKS8yO1xuICAgIGlmIChnYW1tYT09PXVuZGVmaW5lZCkgZ2FtbWEgPSAyLjI7XG4gICAgdmFyIG9uZV9vdmVyX2dhbW1hPTEvZ2FtbWEscyxsPWJ1ZmZlci5ieXRlTGVuZ3RoPj4yLCByZXM9cmVzfHxuZXcgVWludDhDbGFtcGVkQXJyYXkobCo0KTtcbiAgICBmb3IgKHZhciBpPTA7aTxsO2krKykge1xuICAgICAgcyA9IGV4cG9zdXJlICogTWF0aC5wb3coMixidWZmZXJbaSo0KzNdLSgxMjgrOCkpO1xuICAgICAgcmVzW2kqNF0gID0yNTUqTWF0aC5wb3coYnVmZmVyW2kqNF0qcyxvbmVfb3Zlcl9nYW1tYSk7XG4gICAgICByZXNbaSo0KzFdPTI1NSpNYXRoLnBvdyhidWZmZXJbaSo0KzFdKnMsb25lX292ZXJfZ2FtbWEpO1xuICAgICAgcmVzW2kqNCsyXT0yNTUqTWF0aC5wb3coYnVmZmVyW2kqNCsyXSpzLG9uZV9vdmVyX2dhbW1hKTtcbiAgICAgIHJlc1tpKjQrM109MjU1O1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLyoqIENvbnZlcnQgYW4gZmxvYXQgYnVmZmVyIHRvIExEUiB3aXRoIGdpdmVuIGV4cG9zdXJlIGFuZCBkaXNwbGF5IGdhbW1hLlxuICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IGJ1ZmZlciBUaGUgaW5wdXQgYnVmZmVyIGluIGZsb2F0aW5nIHBvaW50IGZvcm1hdC5cbiAgICAqIEBwYXJhbSB7ZmxvYXR9IFtleHBvc3VyZT0xXSBPcHRpb25hbCBleHBvc3VyZSB2YWx1ZS4gKDE9ZGVmYXVsdCwgMj0xIHN0ZXAgdXAsIDM9MiBzdGVwcyB1cCwgLTIgPSAzIHN0ZXBzIGRvd24pXG4gICAgKiBAcGFyYW0ge2Zsb2F0fSBbZ2FtbWE9Mi4yXSAgT3B0aW9uYWwgZGlzcGxheSBnYW1tYSB0byByZXNwZWN0LiAoMS4wID0gbGluZWFyLCAyLjIgPSBkZWZhdWx0IG1vbml0b3IpXG4gICAgKiBAcGFyYW0ge0FycmF5fSBbcmVzXSByZXMgT3B0aW9uYWwgcmVzdWx0IGJ1ZmZlci5cbiAgICAqL1xuICBmdW5jdGlvbiBmbG9hdFRvTERSKGJ1ZmZlcixleHBvc3VyZSxnYW1tYSxyZXMpIHtcbiAgICBleHBvc3VyZSA9IE1hdGgucG93KDIsZXhwb3N1cmU9PT11bmRlZmluZWQ/MTpleHBvc3VyZSkvMjtcbiAgICBpZiAoZ2FtbWE9PT11bmRlZmluZWQpIGdhbW1hID0gMi4yO1xuICAgIHZhciBvbmVfb3Zlcl9nYW1tYT0xL2dhbW1hLHMsbD0oYnVmZmVyLmJ5dGVMZW5ndGgvMTIpfDAsIHJlcz1yZXN8fG5ldyBVaW50OENsYW1wZWRBcnJheShsKjQpO1xuICAgIGZvciAodmFyIGk9MDtpPGw7aSsrKSB7XG4gICAgICByZXNbaSo0XSAgPTI1NSpNYXRoLnBvdyhidWZmZXJbaSozXSpleHBvc3VyZSxvbmVfb3Zlcl9nYW1tYSk7XG4gICAgICByZXNbaSo0KzFdPTI1NSpNYXRoLnBvdyhidWZmZXJbaSozKzFdKmV4cG9zdXJlLG9uZV9vdmVyX2dhbW1hKTtcbiAgICAgIHJlc1tpKjQrMl09MjU1Kk1hdGgucG93KGJ1ZmZlcltpKjMrMl0qZXhwb3N1cmUsb25lX292ZXJfZ2FtbWEpO1xuICAgICAgcmVzW2kqNCszXT0yNTU7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuXG4gIC8vIEZsb2F0L1JHQkUgY29udmVyc2lvbnMuXG4gIEhEUkltYWdlLmZsb2F0VG9SZ2JlID0gZmxvYXRUb1JnYmU7XG4gIEhEUkltYWdlLnJnYmVUb0Zsb2F0ID0gcmdiZVRvRmxvYXQ7XG5cbiAgLy8gRmxvYXQvUkdCOV9FNSBjb252ZXJzaW9ucy5cbiAgSERSSW1hZ2UuZmxvYXRUb1JnYjlfZTUgPSBmbG9hdFRvUmdiOV9lNTtcbiAgSERSSW1hZ2UucmdiOV9lNVRvRmxvYXQgPSByZ2I5X2U1VG9GbG9hdDtcblxuICAvLyB4IHRvIExEUiBjb252ZXJzaW9uLlxuICBIRFJJbWFnZS5yZ2JlVG9MRFIgICA9IHJnYmVUb0xEUjtcbiAgSERSSW1hZ2UuZmxvYXRUb0xEUiAgPSBmbG9hdFRvTERSO1xuXG5cbiAgcmV0dXJuIEhEUkltYWdlO1xufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBS0EsSUFBTyxrQkFBUyxTQUFVLE1BQU0sU0FBUyxZQUFZO0FBQ25ELFFBQU0sV0FBVyxXQUFXO0FBQzVCLFNBQU87QUFDVCxHQUFFLFlBQVksUUFBTSxXQUFZO0FBSzlCLFdBQVMsV0FBVztBQUNsQixRQUFJLE1BQU0sU0FBUyxjQUFjLFFBQVEsR0FBRyxTQUFPLEtBQUksY0FBWSxHQUFJLFdBQVMsS0FBSSxVQUFRLE1BQUssU0FBUTtBQUN6RyxRQUFJLGlCQUFpQixZQUFXLFdBQVU7QUFBQyxhQUFPO0FBQUEsSUFBVyxDQUFDO0FBQzlELFFBQUksaUJBQWlCLFlBQVcsU0FBUyxLQUFJO0FBQUUsb0JBQVk7QUFBSyxVQUFJLFNBQVM7QUFBRSxrQkFBVSxTQUFRLGFBQVksVUFBUyxLQUFLLElBQUk7QUFBRyxnQkFBUSxhQUFhLE1BQUssR0FBRSxDQUFDO0FBQUEsTUFBRztBQUFBLElBQUMsQ0FBQztBQUNwSyxRQUFJLGlCQUFpQixTQUFRLFdBQVU7QUFBQyxhQUFPO0FBQUEsSUFBUSxDQUFDO0FBQ3hELFFBQUksaUJBQWlCLFNBQVEsU0FBUyxLQUFJO0FBQUUsaUJBQVM7QUFBSyxVQUFJLFNBQVM7QUFBRSxrQkFBVSxTQUFRLGFBQVksVUFBUyxLQUFLLElBQUk7QUFBRyxnQkFBUSxhQUFhLE1BQUssR0FBRSxDQUFDO0FBQUEsTUFBRztBQUFBLElBQUMsQ0FBQztBQUM5SixRQUFJLGlCQUFpQixhQUFZLFdBQVU7QUFBRSxhQUFPLFlBQVksT0FBTztBQUFBLElBQUcsQ0FBQztBQUMzRSxRQUFJLGlCQUFpQixZQUFXLFdBQVU7QUFBRSxhQUFPO0FBQUEsSUFBUyxDQUFDO0FBQzdELFFBQUksWUFBWSxTQUFTLElBQUdBLElBQUUsR0FBRztBQUU3Qixl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TyxVQUFTLE9BQU0sS0FBSztBQUM1QyxlQUFXLEtBQUssSUFBSSxHQUFFLGFBQVcsU0FBVSxJQUFFLFFBQVEsSUFBRTtBQUN2RCxRQUFJLFVBQVEsT0FBVyxTQUFRO0FBQy9CLFFBQUksaUJBQWUsSUFBRSxPQUFNLEdBQUUsSUFBRSxPQUFPLGNBQVksR0FBRyxNQUFJLE9BQUssSUFBSSxrQkFBa0IsSUFBRSxDQUFDO0FBQ3ZGLGFBQVMsSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFLO0FBQ3BCLFVBQUksV0FBVyxLQUFLLElBQUksR0FBRSxPQUFPLElBQUUsSUFBRSxDQUFDLEtBQUcsTUFBSSxFQUFFO0FBQy9DLFVBQUksSUFBRSxDQUFDLElBQUksTUFBSSxLQUFLLElBQUksT0FBTyxJQUFFLENBQUMsSUFBRSxHQUFFLGNBQWM7QUFDcEQsVUFBSSxJQUFFLElBQUUsQ0FBQyxJQUFFLE1BQUksS0FBSyxJQUFJLE9BQU8sSUFBRSxJQUFFLENBQUMsSUFBRSxHQUFFLGNBQWM7QUFDdEQsVUFBSSxJQUFFLElBQUUsQ0FBQyxJQUFFLE1BQUksS0FBSyxJQUFJLE9BQU8sSUFBRSxJQUFFLENBQUMsSUFBRSxHQUFFLGNBQWM7QUFDdEQsVUFBSSxJQUFFLElBQUUsQ0FBQyxJQUFFO0FBQUEsSUFDYjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBUUEsV0FBUyxXQUFXLFFBQU8sVUFBUyxPQUFNLEtBQUs7QUFDN0MsZUFBVyxLQUFLLElBQUksR0FBRSxhQUFXLFNBQVUsSUFBRSxRQUFRLElBQUU7QUFDdkQsUUFBSSxVQUFRLE9BQVcsU0FBUTtBQUMvQixRQUFJLGlCQUFlLElBQUUsT0FBTSxHQUFFLElBQUcsT0FBTyxhQUFXLEtBQUksR0FBRyxNQUFJLE9BQUssSUFBSSxrQkFBa0IsSUFBRSxDQUFDO0FBQzNGLGFBQVMsSUFBRSxHQUFFLElBQUUsR0FBRSxLQUFLO0FBQ3BCLFVBQUksSUFBRSxDQUFDLElBQUksTUFBSSxLQUFLLElBQUksT0FBTyxJQUFFLENBQUMsSUFBRSxVQUFTLGNBQWM7QUFDM0QsVUFBSSxJQUFFLElBQUUsQ0FBQyxJQUFFLE1BQUksS0FBSyxJQUFJLE9BQU8sSUFBRSxJQUFFLENBQUMsSUFBRSxVQUFTLGNBQWM7QUFDN0QsVUFBSSxJQUFFLElBQUUsQ0FBQyxJQUFFLE1BQUksS0FBSyxJQUFJLE9BQU8sSUFBRSxJQUFFLENBQUMsSUFBRSxVQUFTLGNBQWM7QUFDN0QsVUFBSSxJQUFFLElBQUUsQ0FBQyxJQUFFO0FBQUEsSUFDYjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBSUEsV0FBUyxjQUFjO0FBQ3ZCLFdBQVMsY0FBYztBQUd2QixXQUFTLGlCQUFpQjtBQUMxQixXQUFTLGlCQUFpQjtBQUcxQixXQUFTLFlBQWM7QUFDdkIsV0FBUyxhQUFjO0FBR3ZCLFNBQU87QUFDVCxDQUFDOyIsCiAgIm5hbWVzIjogWyJtIiwgImdsIiwgInByb2dyYW0iLCAicmVzIl0KfQo=
