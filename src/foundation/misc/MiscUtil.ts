import { Byte } from "../../commontypes/CommonTypes";

const isMobile = function () {
  const ua = [
    'iPod',
    'iPad', // for old version
    'iPhone',
    'Android'
  ];

  for (var i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return isIPad();
}

const isIOS = function () {
  const ua = [
    'iPod',
    'iPad', // for old version
    'iPhone'
  ];

  for (var i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return isIPad();
}

const isIPad = function(){
  return navigator.userAgent.indexOf('Macintosh') > -1 && 'ontouchend' in document;
}

const preventDefaultForDesktopOnly = function (e: Event) {
  if (!isMobile()) {
    e.preventDefault();
  }
}

const isObject = function (o: any) {
  return (o instanceof Object && !(o instanceof Array)) ? true : false;
};

// https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
const fillTemplate = function (templateString: string, templateVars: string) {
  return new Function("return `" + templateString + "`;").call(templateVars);
}

const isNode = function () {
  return (typeof process !== "undefined" && typeof require !== "undefined");
}

const concatArrayBuffers = function (segments: ArrayBuffer[], sizes: Byte[], paddingSize: Byte) {
  var sumLength = 0;
  for (var i = 0; i < sizes.length; ++i) {
    sumLength += sizes[i];
  }
  var whole = new Uint8Array(sumLength + paddingSize);
  var pos = 0;
  for (var i = 0; i < segments.length; ++i) {
    whole.set(new Uint8Array(segments[i], 0, sizes[i]), pos);
    pos += sizes[i];
  }
  return whole.buffer;
}

export const MiscUtil = Object.freeze({ isMobile, isIOS, preventDefaultForDesktopOnly, isObject, fillTemplate, isNode, concatArrayBuffers });
