import { MutableVector3 } from '../MutableVector3';
import { MathSphere } from './MathSphere';

test('MathSphere collision success 1', () => {
  const sphere = new MathSphere(MutableVector3.fromCopy3(0, 0, 0), 1);
  const rayPos = MutableVector3.fromCopy3(0, -1, 0);
  const rayDir = MutableVector3.fromCopy3(0, 1, 0);
  expect(sphere.calcCollision(rayPos, rayDir)).toBe(true);
});

test('MathSphere collision success 2', () => {
  const sphere = new MathSphere(MutableVector3.fromCopy3(0, 0, 0), 1);
  const rayPos = MutableVector3.fromCopy3(0.9, -1, 0);
  const rayDir = MutableVector3.fromCopy3(0, 1, 0);
  expect(sphere.calcCollision(rayPos, rayDir)).toBe(true);
});

test('MathSphere collision success 3', () => {
  const sphere = new MathSphere(MutableVector3.fromCopy3(0, 0, 0), 1);
  const rayPos = MutableVector3.fromCopy3(1, -1, 0);
  const rayDir = MutableVector3.fromCopy3(0, 1, 0);
  expect(sphere.calcCollision(rayPos, rayDir)).toBe(true);
});

test('MathSphere collision fail 2', () => {
  const sphere = new MathSphere(MutableVector3.fromCopy3(0, 0, 0), 1);
  const rayPos = MutableVector3.fromCopy3(1.1, -1, 0);
  const rayDir = MutableVector3.fromCopy3(0, 1, 0);
  expect(sphere.calcCollision(rayPos, rayDir)).toBe(false);
});

test('MathSphere collision fail 2', () => {
  const sphere = new MathSphere(MutableVector3.fromCopy3(0, 0, 0), 1);
  const rayPos = MutableVector3.fromCopy3(2, -1, 0);
  const rayDir = MutableVector3.fromCopy3(0, 1, 0);
  expect(sphere.calcCollision(rayPos, rayDir)).toBe(false);
});
