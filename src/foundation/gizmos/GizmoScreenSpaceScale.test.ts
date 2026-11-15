import { describe, expect, test, vi } from 'vitest';
import type { CameraComponent } from '../components/Camera/CameraComponent';
import { createCameraEntity } from '../components/Camera/createCameraEntity';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { CameraType } from '../definitions/CameraType';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { Vector3 } from '../math/Vector3';
import { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';

/**
 * Exposes the protected screen-space scale helper so that it can be tested directly.
 * No instance is created; only the static helper is used.
 */
class TestGizmo extends Gizmo {
  get isSetup(): boolean {
    return true;
  }

  _setup(): void {
    // Nothing to set up for the test helper.
  }

  _update(): void {
    // Nothing to update for the test helper.
  }

  _destroy(): void {
    // Nothing to destroy for the test helper.
  }

  static calcScreenSpaceScale(engine: Engine, worldPosition: Vector3, screenSpaceRatio: number): number {
    return TestGizmo.__calcScreenSpaceScale(engine, worldPosition, screenSpaceRatio);
  }
}

describe('Gizmo screen-space scale', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });

  const setupPerspectiveCamera = () => {
    const cameraEntity = createCameraEntity(engine, true);
    const camera = cameraEntity.getCamera() as CameraComponent;
    camera.eyeInner = Vector3.fromCopy3(0, 0, 0);
    camera.directionInner = Vector3.fromCopy3(0, 0, -1);
    camera.upInner = Vector3.fromCopy3(0, 1, 0);
    camera.type = CameraType.Perspective;
    camera.fovyInner = 90;
    camera.aspectInner = 1;
    camera.zNearInner = 0.1;
    camera.zFarInner = 100;
    camera.calcViewMatrix();
    camera.calcProjectionMatrix();
    return camera;
  };

  test('projects a unit gizmo to the requested fraction of the viewport height (perspective)', () => {
    setupPerspectiveCamera();

    // fovy = 90 deg -> m11 = 1, so the viewport height at depth 2 is 4 world units.
    const scale = TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -2), 0.125);

    expect(scale).toBeCloseTo(0.5, 6);
  });

  test('keeps the size independent of the distance from the camera (perspective)', () => {
    setupPerspectiveCamera();

    // The viewport height at depth 8 is 16 world units.
    const scale = TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -8), 0.125);

    expect(scale).toBeCloseTo(2.0, 6);
  });

  test('is depth independent for orthographic cameras', () => {
    const camera = setupPerspectiveCamera();
    camera.type = CameraType.Orthographic;
    camera.aspectInner = 2; // ymag
    camera.calcProjectionMatrix();

    // ymag = 2 -> the viewport height is 4 world units at any depth.
    const nearScale = TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -2), 0.125);
    const farScale = TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -50), 0.125);

    expect(nearScale).toBeCloseTo(0.5, 6);
    expect(farScale).toBeCloseTo(0.5, 6);
  });

  test('clamps the depth to the near plane when the target is behind the camera', () => {
    setupPerspectiveCamera();

    const scale = TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, 5), 0.125);

    expect(scale).toBeCloseTo(0.025, 6);
  });

  test('falls back to 1 when the projection matrix has no vertical scale', () => {
    const camera = setupPerspectiveCamera();
    camera.projectionMatrix = MutableMatrix44.zero();

    const scale = TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -2), 0.125);

    expect(scale).toBe(1);
  });

  test('falls back to 1 for an invalid ratio', () => {
    setupPerspectiveCamera();

    expect(TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -2), 0)).toBe(1);
    expect(TestGizmo.calcScreenSpaceScale(engine, Vector3.fromCopy3(0, 0, -2), Number.NaN)).toBe(1);
  });
});

describe('Transform gizmo camera-driven update', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });

  test('updates the registered transform gizmos only when the camera changes', () => {
    const cameraEntity = createCameraEntity(engine, true);
    const camera = cameraEntity.getCamera() as CameraComponent;
    camera.type = CameraType.Perspective;
    camera.calcViewMatrix();
    camera.calcProjectionMatrix();

    const targetEntity = createGroupEntity(engine);
    const sceneGraph = targetEntity.getSceneGraph() as any;
    const updateSpy = vi.fn();
    // A minimal visible transform gizmo is enough to verify the update scheduling.
    sceneGraph.__translationGizmo = { isSetup: true, isVisible: true, _update: updateSpy };
    sceneGraph.__registerTransformGizmoOwner();

    // The first call initializes the camera state and updates the gizmos.
    SceneGraphComponent._updateTransformGizmosByCameraChange(engine);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    // Nothing changed: the gizmos must not be updated again.
    SceneGraphComponent._updateTransformGizmosByCameraChange(engine);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    // A camera-only change must rescale the gizmos.
    camera.eyeInner = Vector3.fromCopy3(0, 0, 6);
    SceneGraphComponent._updateTransformGizmosByCameraChange(engine);
    expect(updateSpy).toHaveBeenCalledTimes(2);

    // Hiding the gizmo removes the node from the registry.
    sceneGraph.__translationGizmo.isVisible = false;
    sceneGraph.__unregisterTransformGizmoOwnerIfNeeded();
    camera.eyeInner = Vector3.fromCopy3(0, 0, 12);
    SceneGraphComponent._updateTransformGizmosByCameraChange(engine);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });
});
