const isMobile = function() {
  const ua = [
    'iPod',
    'iPad',
    'iPhone',
    'Android'
  ];

  for (var i=0; i<ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return false;
}

const preventDefaultForDesktopOnly = function(e: Event) {
  if (!isMobile()) {
    e.preventDefault();
  }
}

const isObject = function(o: any) {
  return (o instanceof Object && !(o instanceof Array)) ? true : false;
};

// https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
const fillTemplate = function(templateString: string, templateVars: string){
  return new Function("return `"+templateString +"`;").call(templateVars);
}

const isNode = function() {
  return (typeof process !== "undefined" && typeof require !== "undefined");
}

const concatArrayBuffers = function(segments: ArrayBuffer[]) {
  var sumLength = 0;
  for(var i = 0; i < segments.length; ++i){
      sumLength += segments[i].byteLength;
  }
  var whole = new Uint8Array(sumLength);
  var pos = 0;
  for(var i = 0; i < segments.length; ++i){
      whole.set(new Uint8Array(segments[i]),pos);
      pos += segments[i].byteLength;
  }
  return whole.buffer;
}

export const MiscUtil = Object.freeze({ isMobile, preventDefaultForDesktopOnly, isObject, fillTemplate, isNode, concatArrayBuffers });
