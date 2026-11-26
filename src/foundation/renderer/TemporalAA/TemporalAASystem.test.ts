import { describe, expect, test } from 'vitest';
import { createCameraEntity } from '../../components/Camera/createCameraEntity';
import { createGroupEntity } from '../../components/SceneGraph/createGroupEntity';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { Engine } from '../../system/Engine';
import { PreviousFrameDataTracker } from './PreviousFrameDataTracker';
import { getTemporalAAJitter, halton } from './TemporalAASystem';

async function createEngine() {
  return await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
}

describe('halton', () => {
  test('returns the radical inverse of the index', () => {
    expect([1, 2, 3, 4].map(i => halton(i, 2))).toEqual([0.5, 0.25, 0.75, 0.125]);
    expect(halton(1, 3)).toBeCloseTo(1 / 3, 12);
    expect(halton(2, 3)).toBeCloseTo(2 / 3, 12);
    expect(halton(3, 3)).toBeCloseTo(1 / 9, 12);
    expect(halton(0, 2)).toBe(0);
  });
});

describe('getTemporalAAJitter', () => {
  test('stays within half a pixel and repeats every 8 frames', () => {
    const width = 640;
    const height = 360;
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < 8; i++) {
      const jitter = getTemporalAAJitter(i, width, height);
      // Half a pixel is 1 / width in NDC units.
      expect(Math.abs(jitter.x)).toBeLessThanOrEqual(1 / width);
      expect(Math.abs(jitter.y)).toBeLessThanOrEqual(1 / height);
      sumX += jitter.x;
      sumY += jitter.y;
      expect(getTemporalAAJitter(i + 8, width, height).isEqual(jitter)).toBe(true);
    }
    // The positions are spread around the pixel center (the first 8 Halton points average about -1/16 pixel).
    expect(Math.abs(sumX / 8)).toBeLessThan(0.25 / width);
    expect(Math.abs(sumY / 8)).toBeLessThan(0.25 / height);
  });
});

describe('CameraComponent.jitterOffset', () => {
  test('moves the projected position by the jitter without changing projectionMatrixWithoutJitter', async () => {
    const engine = await createEngine();
    const camera = createCameraEntity(engine, true).getCamera();
    camera.zNear = 0.1;
    camera.zFar = 100;
    camera.setFovyAndChangeFocalLength(60);
    camera.aspect = 1;
    camera.$logic();

    const point = Vector4.fromCopy4(0.3, -0.2, -5, 1);
    const ndcOf = (clip: Vector4) => [clip.x / clip.w, clip.y / clip.w, clip.z / clip.w];
    const ndcBefore = ndcOf(camera.projectionMatrix.multiplyVector(point));

    const updateCountBefore = camera.updateCount;
    const gpuDataVersionBefore = engine._gpuInstanceDataVersion;
    camera.jitterOffset = Vector2.fromCopy2(0.01, -0.02);

    const ndcAfter = ndcOf(camera.projectionMatrix.multiplyVector(point));
    expect(ndcAfter[0]).toBeCloseTo(ndcBefore[0] + 0.01, 6);
    expect(ndcAfter[1]).toBeCloseTo(ndcBefore[1] - 0.02, 6);
    expect(ndcAfter[2]).toBeCloseTo(ndcBefore[2], 6);

    const ndcWithoutJitter = ndcOf(camera.projectionMatrixWithoutJitter.multiplyVector(point));
    expect(ndcWithoutJitter[0]).toBeCloseTo(ndcBefore[0], 6);
    expect(ndcWithoutJitter[1]).toBeCloseTo(ndcBefore[1], 6);

    // The jitter requests a GPU upload, but it is not a camera update (which re-runs the logic stage).
    expect(camera.updateCount).toBe(updateCountBefore);
    expect(engine._gpuInstanceDataVersion).toBeGreaterThan(gpuDataVersionBefore);

    // A recomputation of the projection keeps the jitter.
    camera.zFar = 200;
    camera.$logic();
    const ndcRecomputed = ndcOf(camera.projectionMatrix.multiplyVector(point));
    const ndcRecomputedWithoutJitter = ndcOf(camera.projectionMatrixWithoutJitter.multiplyVector(point));
    expect(ndcRecomputed[0]).toBeCloseTo(ndcRecomputedWithoutJitter[0] + 0.01, 6);
    expect(ndcRecomputed[1]).toBeCloseTo(ndcRecomputedWithoutJitter[1] - 0.02, 6);

    camera.jitterOffset = Vector2.zero();
    expect(camera.projectionMatrix.isEqual(camera.projectionMatrixWithoutJitter)).toBe(true);
  });
});

describe('PreviousFrameDataTracker', () => {
  // One frame: prepare (tracker.update) runs before the logic stage, in which the transform marks the world
  // matrix dirty and the scene graph computes it.
  function frame(tracker: PreviousFrameDataTracker, entity: ReturnType<typeof createGroupEntity>, move?: Vector3) {
    const isWritten = tracker.update();
    if (move != null) {
      entity.localPosition = move;
    }
    entity.getTransform().$logic();
    entity.getSceneGraph().matrixInner;
    return isWritten;
  }

  test('keeps the world matrix of the previous frame and stops writing once the entity rests', async () => {
    const engine = await createEngine();
    const entity = createGroupEntity(engine);
    const sceneGraph = entity.getSceneGraph();
    const tracker = new PreviousFrameDataTracker();
    tracker.setEntities([entity]);

    const translationOfPrevious = () => sceneGraph._previousWorldMatrixInner.getTranslate().x;

    expect(frame(tracker, entity)).toBe(true); // first frame: no motion
    expect(translationOfPrevious()).toBe(0);
    expect(frame(tracker, entity)).toBe(true); // settles
    expect(frame(tracker, entity)).toBe(false); // at rest: nothing to write

    // Moves in this frame: the previous matrix is the one of the last frame.
    expect(frame(tracker, entity, Vector3.fromCopy3(1, 0, 0))).toBe(false);
    expect(translationOfPrevious()).toBe(0);
    expect(sceneGraph.matrixInner.getTranslate().x).toBe(1);

    // Next frame (at rest): the previous matrix catches up, then it settles.
    expect(frame(tracker, entity)).toBe(true);
    expect(translationOfPrevious()).toBe(1);
    expect(frame(tracker, entity)).toBe(true);
    expect(frame(tracker, entity)).toBe(false);

    // A world matrix marked dirty between two frames (after rendering) is computed in the next frame: the previous
    // matrix is still the rendered one in that frame.
    entity.localPosition = Vector3.fromCopy3(3, 0, 0);
    entity.getTransform().$logic();
    expect(frame(tracker, entity)).toBe(true);
    expect(translationOfPrevious()).toBe(1);
    expect(sceneGraph.matrixInner.getTranslate().x).toBe(3);
    expect(frame(tracker, entity)).toBe(true);
    expect(translationOfPrevious()).toBe(3);
    expect(frame(tracker, entity)).toBe(false);
  });

  test('drops the entities that are no longer tracked', async () => {
    const engine = await createEngine();
    const entityA = createGroupEntity(engine);
    const entityB = createGroupEntity(engine);
    const tracker = new PreviousFrameDataTracker();
    tracker.setEntities([entityA, entityB]);
    tracker.update();
    tracker.update();
    expect(tracker.update()).toBe(false);

    tracker.setEntities([entityA]);
    expect(tracker.update()).toBe(false);
    // B is new again when it comes back.
    tracker.setEntities([entityA, entityB]);
    expect(tracker.update()).toBe(true);
  });
});
