import is from './IsUtil';

// is.defined

test('is.defined(undefined) return true', () => {
  expect(is.defined(null)).toBe(true);
});

test('is.defined(undefined) return false', () => {
  expect(is.defined(undefined)).toBe(false);
});

// is.undefined

test('is.undefined(undefined) return true', () => {
  expect(is.undefined(undefined)).toBe(true);
});

test('is.undefined(null) return false', () => {
  expect(is.undefined(null)).toBe(false);
});

// is.null

test('is.null(null) return true', () => {
  expect(is.null(null)).toBe(true);
});

test('is.null(undefined) return false', () => {
  expect(is.null(undefined)).toBe(false);
});

// is.exist

test('is.exist(0) return true', () => {
  expect(is.exist(0)).toBe(true);
});

test('is.exist(false) return true', () => {
  expect(is.exist(false)).toBe(true);
});

test('is.exist("") return true', () => {
  expect(is.exist("")).toBe(true);
});

test('is.exist([]) return true', () => {
  expect(is.exist([])).toBe(true);
});

test('is.exist([]) return true', () => {
  expect(is.exist({})).toBe(true);
});

test('is.exist(null) return false', () => {
  expect(is.exist(null)).toBe(false);
});

test('is.exist(undefined) return false', () => {
  expect(is.exist(undefined)).toBe(false);
});

// is.function

test('is.function(()=>{}) return true', () => {
  expect(is.function(()=>{})).toBe(true);
});

test('is.function({}) return false', () => {
  expect(is.function({})).toBe(false);
});

// is.not

test('is.not.null(null) return false', () => {
  expect(is.not.null(null)).toBe(false);
});

test('is.not.null(null) return true', () => {
  expect(is.not.null(undefined)).toBe(true);
});

// is.all

test('is.all.null(null, null, null) return true', () => {
  expect(is.all.null(null, null, null)).toBe(true);
});

test('is.all.null(null, null, undefined) return false', () => {
  expect(is.all.null(null, null, undefined)).toBe(false);
});

test('is.all.null([null, null, null]) return true', () => {
  expect(is.all.null([null, null, null])).toBe(true);
});

test('is.all.null([null, null, undefined]) return false', () => {
  expect(is.all.null([null, null, undefined])).toBe(false);
});

// is.any

test('is.any.null(null, null, null) return true', () => {
  expect(is.any.null(null, null, undefined)).toBe(true);
});

test('is.any.null(undefined, undefined, undefined) return false', () => {
  expect(is.any.null(undefined, undefined, undefined)).toBe(false);
});


test('is.any.null([null, null, undefined]) return true', () => {
  expect(is.any.null([null, null, undefined])).toBe(true);
});

test('is.any.null([undefined, undefined, undefined]) return false', () => {
  expect(is.any.null([undefined, undefined, undefined])).toBe(false);
});
