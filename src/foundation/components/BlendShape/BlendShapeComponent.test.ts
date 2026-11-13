import { expect, test } from 'vitest';
import type { Engine } from '../../system/Engine';
import { BlendShapeComponent } from './BlendShapeComponent';

function createComponent(componentSID: number): BlendShapeComponent {
  const component = Object.create(BlendShapeComponent.prototype) as BlendShapeComponent & {
    __weights: number[];
    __targetNames: string[];
  };
  Object.defineProperty(component, 'componentSID', { value: componentSID, configurable: true });
  component.__weights = [];
  component.__targetNames = [];
  return component;
}

test('setWeightByIndex does not bump updateCount for an unchanged value', () => {
  const component = createComponent(0);
  const before = BlendShapeComponent.updateCount;

  component.setWeightByIndex(0, 0.5);
  expect(BlendShapeComponent.updateCount).toBe(before + 1);
  expect(component.weights[0]).toBe(0.5);

  component.setWeightByIndex(0, 0.5);
  expect(BlendShapeComponent.updateCount).toBe(before + 1);

  component.setWeightByIndex(0, 0.25);
  expect(BlendShapeComponent.updateCount).toBe(before + 2);
});

test('setWeightsFromArrayLike copies only changed values and skips identical updates', () => {
  const component = createComponent(1);
  const before = BlendShapeComponent.updateCount;

  component.setWeightsFromArrayLike(new Float32Array([0.25, 0.5]));
  expect(component.weights).toEqual([0.25, 0.5]);
  expect(BlendShapeComponent.updateCount).toBe(before + 1);

  component.setWeightsFromArrayLike(new Float32Array([0.25, 0.5]));
  expect(BlendShapeComponent.updateCount).toBe(before + 1);

  component.setWeightsFromArrayLike([0.25, 0.75]);
  expect(component.weights).toEqual([0.25, 0.75]);
  expect(BlendShapeComponent.updateCount).toBe(before + 2);
});

test('does not mutate weight arrays shared with the importer', () => {
  const component = createComponent(2);
  const source = [0.25, 0.5];
  component.weights = source;

  component.setWeightsFromArrayLike([0.25, 0.75]);
  expect(source).toEqual([0.25, 0.5]);
  expect(component.weights).toEqual([0.25, 0.75]);
  expect(component.weights).not.toBe(source);

  component.setWeightByIndex(0, 0.5);
  expect(source).toEqual([0.25, 0.5]);
  expect(component.weights).toEqual([0.5, 0.75]);
});

test('getOffsetsInUniform returns a cached array until the layout changes', () => {
  const component0 = createComponent(0);
  const component1 = createComponent(1);
  component0.setWeightsFromArrayLike([0, 0]);
  component1.setWeightsFromArrayLike([0, 0, 0]);

  const components = [component0, component1];
  const engine = {
    componentRepository: {
      getComponentsWithTypeWithoutFiltering: () => components,
    },
  } as unknown as Engine;

  const first = BlendShapeComponent.getOffsetsInUniform(engine);
  expect(first).toEqual([0, 2, 5]);
  expect(BlendShapeComponent.getOffsetsInUniform(engine)).toBe(first);

  component1.setWeightsFromArrayLike([0, 0, 0, 0]);
  const second = BlendShapeComponent.getOffsetsInUniform(engine);
  expect(second).toEqual([0, 2, 6]);
  expect(second).not.toBe(first);
});
