import { expect, test } from 'vitest';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import { BlendShapeComponent } from './BlendShapeComponent';

test('the morph weights uniform data keeps the weights of the previous frame', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
  const entityA = engine.entityRepository.addComponentToEntity(BlendShapeComponent, createGroupEntity(engine));
  const entityB = engine.entityRepository.addComponentToEntity(BlendShapeComponent, createGroupEntity(engine));
  const a = entityA.getBlendShape();
  const b = entityB.getBlendShape();
  a.weights = [0.1, 0.2, 0.3];
  b.weights = [0.4, 0.5];

  // Without temporal anti-aliasing, the layout is unchanged.
  expect(BlendShapeComponent._getMorphWeightsVec4Count(engine)).toBe(2);
  let array = new Float32Array(BlendShapeComponent._getMorphWeightsUniformBufferFloatCount(engine));
  expect(BlendShapeComponent._writeMorphWeightsUniformArray(engine, array, true)).toBe(5);
  expect(Array.from(array.slice(0, 5))).toEqual(Array.from(new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])));
  expect(BlendShapeComponent._settlePreviousMorphWeights(engine, array)).toBe(0);

  engine._enablePreviousMorphWeights();
  expect(BlendShapeComponent._getMorphWeightsVec4Count(engine)).toBe(4);
  const previousOffset = BlendShapeComponent._getPreviousMorphWeightsOffset(engine);
  expect(previousOffset).toBe(8);
  array = new Float32Array(BlendShapeComponent._getMorphWeightsUniformBufferFloatCount(engine));
  const previous = () => Array.from(array.slice(previousOffset, previousOffset + 5));
  const current = () => Array.from(array.slice(0, 5));

  // A new buffer: the previous weights are the current ones (no motion).
  expect(BlendShapeComponent._writeMorphWeightsUniformArray(engine, array, true)).toBe(previousOffset + 5);
  expect(previous()).toEqual(current());

  // The weights change: the previous weights are the weights written before.
  const before = current();
  a.weights = [1, 1, 1];
  BlendShapeComponent._writeMorphWeightsUniformArray(engine, array, false);
  expect(previous()).toEqual(before);
  expect(current().slice(0, 3)).toEqual([1, 1, 1]);

  // The next frame without a change: the previous weights catch up once.
  expect(BlendShapeComponent._settlePreviousMorphWeights(engine, array)).toBe(previousOffset + 5);
  expect(previous()).toEqual(current());
  expect(BlendShapeComponent._settlePreviousMorphWeights(engine, array)).toBe(0);
});
