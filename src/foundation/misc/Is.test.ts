import { Is } from './Is';

// Is.defined

test('Is.defined(undefined) return true', () => {
  expect(Is.defined(null)).toBe(true);
});

test('Is.defined(undefined) return false', () => {
  expect(Is.defined(undefined)).toBe(false);
});

// Is.undefined

test('Is.undefined(undefined) return true', () => {
  expect(Is.undefined(undefined)).toBe(true);
});

test('Is.undefined(null) return false', () => {
  expect(Is.undefined(null)).toBe(false);
});

// Is.null

test('Is.null(null) return true', () => {
  expect(Is.null(null)).toBe(true);
});

test('Is.null(undefined) return false', () => {
  expect(Is.null(undefined)).toBe(false);
});

// Is.true
test('Is.true(true) return true', () => {
  expect(Is.true(true)).toBe(true);
});

test('Is.true(false) return false', () => {
  expect(Is.true(false)).toBe(false);
});

test('Is.true(obj) return false', () => {
  const map = new Map();
  expect(Is.true(map)).toBe(false);
});

// Is.false

test('Is.false(false) return true', () => {
  expect(Is.false(false)).toBe(true);
});

test('Is.false(true) return false', () => {
  expect(Is.false(true)).toBe(false);
});

// Is.truly
test('Is.truly(true) return true', () => {
  expect(Is.truly(true)).toBe(true);
});

test('Is.truly(false) return false', () => {
  expect(Is.truly(false)).toBe(false);
});

test('Is.truly(obj) return true', () => {
  const map = new Map();
  expect(Is.truly(map)).toBe(true);
});

test('Is.truly(null) return false', () => {
  expect(Is.truly(null)).toBe(false);
});

test('Is.truly(undefined) return false', () => {
  expect(Is.truly(undefined)).toBe(false);
});

// Is.falsy

test('Is.falsy(false) return true', () => {
  expect(Is.falsy(false)).toBe(true);
});

test('Is.falsy(true) return false', () => {
  expect(Is.falsy(true)).toBe(false);
});

test('Is.falsy(obj) return false', () => {
  const map = new Map();
  expect(Is.falsy(map)).toBe(false);
});

test('Is.falsy(null) return true', () => {
  expect(Is.falsy(null)).toBe(true);
});

test('Is.falsy(undefined) return true', () => {
  expect(Is.falsy(undefined)).toBe(true);
});

// Is.exist

test('Is.exist(0) return true', () => {
  expect(Is.exist(0)).toBe(true);
});

test('Is.exist(false) return true', () => {
  expect(Is.exist(false)).toBe(true);
});

test('Is.exist("") return true', () => {
  expect(Is.exist('')).toBe(true);
});

test('Is.exist([]) return true', () => {
  expect(Is.exist([])).toBe(true);
});

test('Is.exist([]) return true', () => {
  expect(Is.exist({})).toBe(true);
});

test('Is.exist(null) return false', () => {
  expect(Is.exist(null)).toBe(false);
});

test('Is.exist(undefined) return false', () => {
  expect(Is.exist(undefined)).toBe(false);
});

// Is.function

test('Is.function(()=>{}) return true', () => {
  expect(Is.function(() => {})).toBe(true);
});

test('Is.function({}) return false', () => {
  expect(Is.function({})).toBe(false);
});

// Is.not

test('Is.not.null(null) return false', () => {
  expect(Is.not.null(null)).toBe(false);
});

test('Is.not.null(null) return true', () => {
  expect(Is.not.null(undefined)).toBe(true);
});

// Is.all

test('Is.all.null(null, null, null) return true', () => {
  expect(Is.all.null(null, null, null)).toBe(true);
});

test('Is.all.null(null, null, undefined) return false', () => {
  expect(Is.all.null(null, null, undefined)).toBe(false);
});

test('Is.all.null([null, null, null]) return true', () => {
  expect(Is.all.null([null, null, null])).toBe(true);
});

test('Is.all.null([null, null, undefined]) return false', () => {
  expect(Is.all.null([null, null, undefined])).toBe(false);
});

// Is.any

test('Is.any.null(null, null, null) return true', () => {
  expect(Is.any.null(null, null, undefined)).toBe(true);
});

test('Is.any.null(undefined, undefined, undefined) return false', () => {
  expect(Is.any.null(undefined, undefined, undefined)).toBe(false);
});

test('Is.any.null([null, null, undefined]) return true', () => {
  expect(Is.any.null([null, null, undefined])).toBe(true);
});

test('Is.any.null([undefined, undefined, undefined]) return false', () => {
  expect(Is.any.null([undefined, undefined, undefined])).toBe(false);
});
