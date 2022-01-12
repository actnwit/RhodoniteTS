import {off} from 'process';
import {Byte, Size} from '../../types/CommonTypes';
import { Is } from './Is';

const isMobile = function () {
  const ua = [
    'iPod',
    'iPad', // for old version
    'iPhone',
    'Android',
  ];

  for (let i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return isIPad();
};

const isSafari = function() {
  const ua = ['Safari'];

  for (let i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return false;
};

const isIOS = function () {
  const ua = [
    'iPod',
    'iPad', // for old version
    'iPhone',
  ];

  for (let i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return isIPad();
};

const isIPad = function () {
  return (
    navigator.userAgent.indexOf('Macintosh') > -1 && 'ontouchend' in document
  );
};

const preventDefaultForDesktopOnly = function (e: Event) {
  if (!isMobile()) {
    e.preventDefault();
  }
};

const isObject = function (o: any) {
  return o instanceof Object && !(o instanceof Array) ? true : false;
};

// https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
const fillTemplate = function (templateString: string, templateVars: string) {
  return new Function('return `' + templateString + '`;').call(templateVars);
};

const isNode = function () {
  return typeof process !== 'undefined' && typeof require !== 'undefined';
};

const concatArrayBuffers = function (
  segments: ArrayBuffer[],
  sizes: Byte[],
  offsets: Byte[],
  finalSize?: Byte
) {
  let sumLength = 0;
  for (let i = 0; i < sizes.length; ++i) {
    sumLength += sizes[i];
  }
  let whole: Uint8Array;
  if (finalSize != null) {
    whole = new Uint8Array(finalSize);
  } else {
    whole = new Uint8Array(sumLength);
  }

  const getExceededSize = (sizeToAdd: Size) => {
    if (finalSize != null && offsetOfBase + sizeToAdd > finalSize) {
      return offsetOfBase + sizeToAdd - finalSize;
    } else {
      return 0;
    }
  };
  let offsetOfBase = 0;
  const addData = (sizeToAdd: Size, i: number) => {
    const exceededSize = getExceededSize(sizeToAdd);
    if (exceededSize) {
      whole.set(
        new Uint8Array(segments[i], offsets[i], exceededSize),
        offsetOfBase
      );
      offsetOfBase += exceededSize;
      return true;
    } else {
      whole.set(
        new Uint8Array(segments[i], offsets[i], sizeToAdd),
        offsetOfBase
      );
      offsetOfBase += sizeToAdd;
      return false;
    }
  };
  const addOverSizeData = (overSize: Size) => {
    const exceededSize = getExceededSize(overSize);
    if (exceededSize) {
      whole.set(new Uint8Array(exceededSize), offsetOfBase);
      offsetOfBase += exceededSize;
      return true;
    } else {
      whole.set(new Uint8Array(overSize), offsetOfBase);
      offsetOfBase += overSize;
      return false;
    }
  };

  for (let i = 0; i < segments.length; ++i) {
    const delta = sizes[i] + offsets[i] - segments[i].byteLength;
    const overSize = delta > 0 ? delta : 0;
    const sizeToAdd = sizes[i] - overSize;
    if (addData(sizeToAdd, i)) {
      return whole.buffer;
    }
    if (overSize > 0) {
      if (addOverSizeData(overSize)) {
        return whole.buffer;
      }
    }
  }
  if (finalSize != null && offsetOfBase < finalSize) {
    whole.set(new Uint8Array(finalSize - offsetOfBase), offsetOfBase);
  }
  return whole.buffer;
};

const concatArrayBuffers2 = ({
  finalSize,
  srcs,
  srcsOffset,
  srcsCopySize,
}: {
  finalSize: Byte;
  srcs: ArrayBuffer[];
  srcsOffset: Byte[];
  srcsCopySize: Byte[];
}) => {
  const dstBuf = new Uint8Array(new ArrayBuffer(finalSize));
  let copiedSize = 0;
  for (const i in srcs) {
    const src = srcs[i];
    const srcBuf = new Uint8Array(src, srcsOffset[i], srcsCopySize[i]);
    dstBuf.set(srcBuf, copiedSize);
    copiedSize += srcsCopySize[i];
  }
  return dstBuf.buffer;
};

export const valueWithDefault = <T>({
  value,
  defaultValue,
}: {
  value?: T;
  defaultValue: T;
}): T => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return defaultValue;
  }
  return value;
};

export const ifExistsThen = <T>(
  callback: (value: T) => void,
  value?: T
): value is T => {
  if (Is.exist(value)) {
    callback(value);
    return true;
  }
  return false;
};

export const ifExistsThenWithReturn = <T>(
  callback: (value: T) => T,
  value?: T
): T | undefined => {
  if (Is.exist(value)) {
    return callback(value);
  }
  return value;
};

export const ifDefinedThen = <T>(
  callback: (value: T) => void,
  value?: T
): value is T => {
  if (Is.exist(value)) {
    callback(value);
    return true;
  }
  return false;
};

export const ifDefinedThenWithReturn = <T>(
  callback: (value: T) => T,
  value?: T
): T | undefined => {
  if (Is.exist(value)) {
    return callback(value);
  }
  return value;
};

export const ifUndefinedThen = <T>(
  callback: () => void,
  value?: T
): value is T => {
  if (Is.undefined(value)) {
    callback();
    return false;
  }
  return true;
};

export const ifUndefinedThenWithReturn = <T>(
  callback: () => T,
  value?: T
): T => {
  if (Is.undefined(value)) {
    return callback();
  }
  return value;
};

export const ifNotExistsThen = <T>(callback: () => void, value?: T): void => {
  if (Is.undefined(value)) {
    callback();
  }
};

export const ifNotExistsThenWithReturn = <T>(
  callback: () => T,
  value?: T
): T => {
  if (Is.undefined(value)) {
    return callback();
  }
  return value;
};

export const defaultValue = <T>(defaultValue: T, value?: T): T => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return defaultValue;
  }
  return value;
};

export const valueWithCompensation = <T>({
  value,
  compensation,
}: {
  value?: T;
  compensation: () => T;
}) => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return compensation();
  }
  return value;
};

export const nullishToEmptyArray = <T>(value?: T[] | null): T[] => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return [];
  }
  return value;
};

export const nullishToEmptyMap = <M, N>(
  value?: Map<M, N> | null
): Map<M, N> => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return new Map();
  }
  return value;
};

interface CompareResult {
  result: boolean;
  greater: number;
  less: number;
}

export const greaterThan = (it: number, than: number): CompareResult => {
  if (it > than) {
    return {result: true, greater: it, less: than};
  } else {
    return {result: false, greater: than, less: it};
  }
};

export const lessThan = (it: number, than: number): CompareResult => {
  if (it < than) {
    return {result: true, greater: than, less: it};
  } else {
    return {result: false, greater: it, less: than};
  }
};

export const addLineNumberToCode = (shaderString: string) => {
  const shaderTextLines = shaderString.split(/\r\n|\r|\n/);
  let shaderTextWithLineNumber = '';
  for (let i = 0; i < shaderTextLines.length; i++) {
    const lineIndex = i + 1;
    let splitter = ' : ';
    if (lineIndex < 10) {
      splitter = '  : ';
    } else if (lineIndex >= 100) {
      splitter = ': ';
    }
    shaderTextWithLineNumber +=
      lineIndex + splitter + shaderTextLines[i] + '\n';
  }

  return shaderTextWithLineNumber;
};

export const MiscUtil = Object.freeze({
  isMobile,
  isIOS,
  isSafari,
  preventDefaultForDesktopOnly,
  isObject,
  fillTemplate,
  isNode,
  concatArrayBuffers,
  concatArrayBuffers2,
  addLineNumberToCode,
});
