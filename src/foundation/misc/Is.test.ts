import {Is} from './Is';

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
