import { CameraComponent } from '../components/Camera/CameraComponent';
import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { ComponentRepository } from '../core/ComponentRepository';
import { Config } from '../core/Config';
import { AlphaMode } from '../definitions/AlphaMode';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import { Primitive } from '../geometry/Primitive';
import type { RaycastResultEx1 } from '../geometry/types/GeometryTypes';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import type { Material } from '../materials/core/Material';
import type { IQuaternion } from '../math/IQuaternion';
import type { IVector3 } from '../math/IVector';
import { MathClassUtil } from '../math/MathClassUtil';
import { Matrix33 } from '../math/Matrix33';
import { Matrix44 } from '../math/Matrix44';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { MutableVector2 } from '../math/MutableVector2';
import { MutableVector3 } from '../math/MutableVector3';
import { MutableVector4 } from '../math/MutableVector4';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { assertExist } from '../misc/MiscUtil';
import { INPUT_HANDLING_STATE_GIZMO_ROTATION, InputManager, getEvent } from '../system/InputManager';
import { Gizmo } from './Gizmo';

declare let window: any;

type Axis = 'x' | 'y' | 'z';

/**
 * RotationGizmo provides interactive rotation rings for manipulating entity orientation.
 * It offers three color-coded rings (X: red, Y: green, Z: blue) that respond to pointer
 * drag operations both in world space and in local space aligned to the target hierarchy.
 */
export class RotationGizmo extends Gizmo {
  private static __groupEntity: ISceneGraphEntity;
  private static __xRingEntity: IMeshEntity;
  private static __yRingEntity: IMeshEntity;
  private static __zRingEntity: IMeshEntity;
  private static __xRingMesh: Mesh;
  private static __yRingMesh: Mesh;
  private static __zRingMesh: Mesh;
  private static __xRingMaterial: Material;
  private static __yRingMaterial: Material;
  private static __zRingMaterial: Material;
  private static __xRingPrimitive: Primitive;
  private static __yRingPrimitive: Primitive;
  private static __zRingPrimitive: Primitive;
  private static __activeAxis: Axis | 'none' = 'none';
  private static __space: 'local' | 'world' = 'world';
  private static __length = 1;
  private static readonly __unitX = Vector3.fromCopy3(1, 0, 0);
  private static readonly __unitY = Vector3.fromCopy3(0, 1, 0);
  private static readonly __unitZ = Vector3.fromCopy3(0, 0, 1);
  private static readonly __tmpMatrix44_0 = MutableMatrix44.zero();
  private static readonly __tmpMatrix44_1 = MutableMatrix44.zero();
  private static readonly __tmpMatrix44_2 = MutableMatrix44.zero();
  private static readonly __tmpVector4_0 = MutableVector4.zero();
  private static readonly __tmpVector4_1 = MutableVector4.zero();
  private static readonly __tmpVector4_2 = MutableVector4.zero();
  private static readonly __tmpVector4_3 = MutableVector4.zero();
  private static readonly __tmpVector3_0 = MutableVector3.zero();
  private static readonly __tmpVector3_1 = MutableVector3.zero();
  private static readonly __tmpVector3_2 = MutableVector3.zero();
  private static readonly __tmpVector3_3 = MutableVector3.zero();
  private static readonly __tmpVector3_4 = MutableVector3.zero();
  private static readonly __tmpVector3_5 = MutableVector3.zero();
  private static readonly __tmpVector3_6 = MutableVector3.zero();
  private static readonly __tmpVector3_7 = MutableVector3.zero();
  private static readonly __tmpVector3_8 = MutableVector3.zero();
  private static readonly __tmpVector3_9 = MutableVector3.zero();

  private __isPointerDown = false;
  private __startVector = Vector3.zero();
  private __deltaQuaternion = Quaternion.identity();
  private __targetRotationBackup = Quaternion.identity();
  private __latestTargetEntity?: ISceneGraphEntity;
  private __onPointerDownFunc = this.__onPointerDown.bind(this);
  private __onPointerMoveFunc = this.__onPointerMove.bind(this);
  private __onPointerUpFunc = this.__onPointerUp.bind(this);
  private __isCameraControllerDisabled = false;
  private __pointerPrev = MutableVector2.zero();
  private __dragScreenDirection = MutableVector2.zero();
  private __rotationAxisForQuaternion = MutableVector3.zero();
  private __dragScale = 0;
  private __accumulatedAngle = 0;
  private __activePointerElement?: HTMLElement;

  ///
  ///
  /// Accessors
  ///
  ///

  get isSetup(): boolean {
    return Is.exist(this.__topEntity);
  }

  set length(val: number) {
    RotationGizmo.__length = val;
  }

  get length(): number {
    return RotationGizmo.__length;
  }

  set isVisible(flg: boolean) {
    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(Config.eventTargetDom)) {
        eventTargetDom = Config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_ROTATION, [
        {
          eventName: getEvent('start'),
          handler: this.__onPointerDownFunc,
          options: {},
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: getEvent('move'),
          handler: this.__onPointerMoveFunc,
          options: {},
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: getEvent('end'),
          handler: this.__onPointerUpFunc,
          options: {},
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'pointerleave',
          handler: this.__onPointerUpFunc,
          options: {},
          classInstance: this,
          eventTargetDom,
        },
      ]);

      this.__latestTargetEntity = this.__target;
      this.__attachSharedGroup();
      this.__applySpaceToGroup();
    }

    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_ROTATION);
      this.__isPointerDown = false;
      RotationGizmo.__activeAxis = 'none';
    }

    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_ROTATION, flg);
    this.__setVisible(flg);
  }

  setSpace(space: 'local' | 'world') {
    RotationGizmo.__space = space;
    if (this.__isVisible) {
      this.__applySpaceToGroup();
    }
  }

  ///
  ///
  /// Public Methods
  ///
  ///

  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    const targetSceneGraph = this.__target.getSceneGraph();
    if (!targetSceneGraph) {
      return;
    }

    this.__topEntity = createGroupEntity();
    this.__topEntity.tryToSetUniqueName(`RotationGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.__topEntity.getSceneGraph()!);

    this.__createRingEntities();

    if (Is.not.exist(RotationGizmo.__groupEntity)) {
      RotationGizmo.__groupEntity = createGroupEntity();
    }

    this.__attachSharedGroup();
    this.__latestTargetEntity = this.__target;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Rotation' });
    this._update();
  }

  _update(): void {
    if (!Is.exist(this.__topEntity)) {
      return;
    }

    const sg = this.__target.getSceneGraph()!;
    const aabb = sg.worldMergedAABBWithSkeletal;
    if (aabb.isVanilla()) {
      this.__topEntity.getTransform()!.localPosition = sg.position;
    } else {
      this.__topEntity.getTransform()!.localPosition = aabb.centerPoint;
    }
    const max = Math.max(aabb.sizeX, aabb.sizeY, aabb.sizeZ);
    const uniform = Math.min(1, aabb.isVanilla() ? 1 : max / 2);
    this.__topEntity.getTransform()!.localScale = Vector3.fromCopy3(uniform, uniform, uniform);

    if (this.__isPointerDown && RotationGizmo.__activeAxis !== 'none') {
      if (this.__latestTargetEntity === this.__target) {
        this.__target.getTransform().localRotation = Quaternion.fromCopyQuaternion(this.__deltaQuaternion);
      }
    }
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }

  ///
  ///
  /// Private helpers
  ///
  ///

  private __createRingEntities() {
    if (Is.not.exist(RotationGizmo.__xRingEntity)) {
      RotationGizmo.__xRingEntity = createMeshEntity();
      RotationGizmo.__xRingEntity.tryToSetUniqueName('RotationGizmo_xRing', true);
      RotationGizmo.__xRingMaterial = RotationGizmo.__createRingMaterial(Vector4.fromCopyArray4([1, 0, 0, 0.85]));
      RotationGizmo.__xRingMesh = new Mesh();
      RotationGizmo.__xRingPrimitive = RotationGizmo.__createRingPrimitive('x', RotationGizmo.__xRingMaterial);
      RotationGizmo.__xRingMesh.addPrimitive(RotationGizmo.__xRingPrimitive);
      RotationGizmo.__xRingEntity.getMesh().setMesh(RotationGizmo.__xRingMesh);
    }

    if (Is.not.exist(RotationGizmo.__yRingEntity)) {
      RotationGizmo.__yRingEntity = createMeshEntity();
      RotationGizmo.__yRingEntity.tryToSetUniqueName('RotationGizmo_yRing', true);
      RotationGizmo.__yRingMaterial = RotationGizmo.__createRingMaterial(Vector4.fromCopyArray4([0, 1, 0, 0.85]));
      RotationGizmo.__yRingMesh = new Mesh();
      RotationGizmo.__yRingPrimitive = RotationGizmo.__createRingPrimitive('y', RotationGizmo.__yRingMaterial);
      RotationGizmo.__yRingMesh.addPrimitive(RotationGizmo.__yRingPrimitive);
      RotationGizmo.__yRingEntity.getMesh().setMesh(RotationGizmo.__yRingMesh);
    }

    if (Is.not.exist(RotationGizmo.__zRingEntity)) {
      RotationGizmo.__zRingEntity = createMeshEntity();
      RotationGizmo.__zRingEntity.tryToSetUniqueName('RotationGizmo_zRing', true);
      RotationGizmo.__zRingMaterial = RotationGizmo.__createRingMaterial(Vector4.fromCopyArray4([0, 0, 1, 0.85]));
      RotationGizmo.__zRingMesh = new Mesh();
      RotationGizmo.__zRingPrimitive = RotationGizmo.__createRingPrimitive('z', RotationGizmo.__zRingMaterial);
      RotationGizmo.__zRingMesh.addPrimitive(RotationGizmo.__zRingPrimitive);
      RotationGizmo.__zRingEntity.getMesh().setMesh(RotationGizmo.__zRingMesh);
    }
  }

  private __attachSharedGroup() {
    if (!Is.exist(this.__topEntity)) {
      return;
    }
    if (Is.not.exist(RotationGizmo.__groupEntity)) {
      RotationGizmo.__groupEntity = createGroupEntity();
    }
    const topSceneGraph = this.__topEntity!.getSceneGraph();
    const groupSceneGraph = RotationGizmo.__groupEntity!.getSceneGraph();
    topSceneGraph.addChild(groupSceneGraph);
    groupSceneGraph.addChild(RotationGizmo.__xRingEntity!.getSceneGraph());
    groupSceneGraph.addChild(RotationGizmo.__yRingEntity!.getSceneGraph());
    groupSceneGraph.addChild(RotationGizmo.__zRingEntity!.getSceneGraph());
  }

  private __applySpaceToGroup() {
    const groupEntity = RotationGizmo.__groupEntity;
    if (Is.not.exist(groupEntity)) {
      return;
    }

    if (RotationGizmo.__space === 'local') {
      const parent = this.__target.getSceneGraph().parent;
      let quaternion: IQuaternion = Quaternion.identity();
      if (Is.exist(parent)) {
        quaternion = parent.getQuaternionRecursively();
      }
      groupEntity.getTransform().localRotation = quaternion;
    } else {
      groupEntity.getTransform().localRotation = Quaternion.fromCopy4(0, 0, 0, 1);
    }
  }

  private __onPointerDown(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = true;
    this.__activePointerElement = undefined;
    this.__pointerPrev.setComponents(0, 0);
    this.__dragScreenDirection.setComponents(0, 0);
    this.__dragScale = 0;
    this.__accumulatedAngle = 0;
    this.__rotationAxisForQuaternion.setComponents(0, 0, 0);

    const { xResult, yResult, zResult } = RotationGizmo.__castRay(evt, true);
    RotationGizmo.__activeAxis = 'none';

    const picked = RotationGizmo.__selectClosestAxis([
      { axis: 'x', result: xResult },
      { axis: 'y', result: yResult },
      { axis: 'z', result: zResult },
    ]);

    if (picked) {
      assertExist(picked.result.data);
      this.__startVector = Vector3.normalize(RotationGizmo.__projectToPlane(picked.result.data.position, picked.axis));
      RotationGizmo.__activeAxis = picked.axis;
    }

    if (RotationGizmo.__activeAxis === 'none') {
      this.__isPointerDown = false;
      return;
    }

    this.__disableCameraController();
    this.__targetRotationBackup = Quaternion.fromCopyQuaternion(this.__target.getTransform().localRotation);
    this.__deltaQuaternion = Quaternion.fromCopyQuaternion(this.__targetRotationBackup);
    this.__prepareLinearDragMapping(evt, RotationGizmo.__activeAxis);
  }

  private __onPointerMove(evt: PointerEvent) {
    evt.preventDefault();
    if (Is.false(this.__isPointerDown)) {
      return;
    }

    const activeAxis = RotationGizmo.__activeAxis;
    if (activeAxis === 'none') {
      return;
    }

    this.__handleLinearDrag(evt);
  }

  private __onPointerUp(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = false;
    RotationGizmo.__activeAxis = 'none';
    this.__enableCameraControllerIfNeeded();
    this.__startVector = Vector3.zero();
    this.__targetRotationBackup = Quaternion.fromCopyQuaternion(this.__target.getTransform().localRotation);
    this.__deltaQuaternion = Quaternion.fromCopyQuaternion(this.__targetRotationBackup);
    this.__activePointerElement = undefined;
    this.__pointerPrev.setComponents(0, 0);
    this.__dragScreenDirection.setComponents(0, 0);
    this.__rotationAxisForQuaternion.setComponents(0, 0, 0);
    this.__dragScale = 0;
    this.__accumulatedAngle = 0;
  }

  private __prepareLinearDragMapping(evt: PointerEvent, axis: Axis) {
    this.__dragScreenDirection.setComponents(0, 0);

    const element = this.__resolvePointerElement(evt);
    let width = 1;
    let height = 1;
    let pointerX = 0;
    let pointerY = 0;
    if (element) {
      const rect = element.getBoundingClientRect();
      width = rect.width || element.clientWidth || 1;
      height = rect.height || element.clientHeight || 1;
      pointerX = evt.clientX - rect.left;
      pointerY = evt.clientY - rect.top;
      this.__activePointerElement = element;
    } else {
      this.__activePointerElement = undefined;
    }

    this.__pointerPrev.setComponents(pointerX, pointerY);
    this.__dragScale = (2 * Math.PI) / Math.max(width, height, 1);
    this.__accumulatedAngle = 0;

    const axisForQuat = this.__getAxisForQuaternion(axis);
    Vector3.normalizeTo(axisForQuat, this.__rotationAxisForQuaternion);

    const activeCamera = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as
      | CameraComponent
      | undefined;
    const groupSceneGraph = RotationGizmo.__groupEntity?.getSceneGraph();
    if (!element || !activeCamera || !groupSceneGraph) {
      this.__setDefaultDragDirection(axis);
      return;
    }

    const axisLocal = RotationGizmo.__getAxisVector(axis);
    const tangentLocal = Vector3.crossTo(this.__startVector, axisLocal, RotationGizmo.__tmpVector3_8);
    if (tangentLocal.lengthSquared() < 1e-10) {
      this.__setFallbackLocalTangent(axis, tangentLocal);
    }
    Vector3.normalizeTo(tangentLocal, tangentLocal);

    const tangentWorld = this.__transformDirectionFromGroupLocal(tangentLocal, RotationGizmo.__tmpVector3_9);
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.__setFallbackWorldDirection(axisLocal, activeCamera, tangentWorld);
    }
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.__setDefaultDragDirection(axis);
      return;
    }
    Vector3.normalizeTo(tangentWorld, tangentWorld);

    const centerWorld = groupSceneGraph.matrixInner.getTranslateTo(RotationGizmo.__tmpVector3_7);
    const pvMatrix = MutableMatrix44.multiplyTo(
      activeCamera.projectionMatrix,
      activeCamera.viewMatrix,
      RotationGizmo.__tmpMatrix44_2
    );

    const clipCenter = pvMatrix.multiplyVectorTo(
      RotationGizmo.__tmpVector4_0.setComponents(centerWorld.x, centerWorld.y, centerWorld.z, 1),
      RotationGizmo.__tmpVector4_2
    );
    const clipTangent = pvMatrix.multiplyVectorTo(
      RotationGizmo.__tmpVector4_1.setComponents(
        centerWorld.x + tangentWorld.x,
        centerWorld.y + tangentWorld.y,
        centerWorld.z + tangentWorld.z,
        1
      ),
      RotationGizmo.__tmpVector4_3
    );

    const w0 = clipCenter.w;
    const w1 = clipTangent.w;
    if (w0 === 0 || w1 === 0) {
      this.__setDefaultDragDirection(axis);
      return;
    }

    const ndcCenterX = clipCenter.x / w0;
    const ndcCenterY = clipCenter.y / w0;
    const ndcTangentX = clipTangent.x / w1;
    const ndcTangentY = clipTangent.y / w1;

    const screenTangentX = (ndcTangentX - ndcCenterX) * width * 0.5;
    const screenTangentY = -(ndcTangentY - ndcCenterY) * height * 0.5;
    const length = Math.hypot(screenTangentX, screenTangentY);
    if (length < 1e-5) {
      this.__setDefaultDragDirection(axis);
      return;
    }

    this.__dragScreenDirection.setComponents(screenTangentX / length, screenTangentY / length);
  }

  private __setDefaultDragDirection(axis: Axis) {
    if (axis === 'x') {
      this.__dragScreenDirection.setComponents(0, -1);
    } else if (axis === 'y') {
      this.__dragScreenDirection.setComponents(1, 0);
    } else {
      this.__dragScreenDirection.setComponents(1, 0);
    }
  }

  private __setFallbackLocalTangent(axis: Axis, out: MutableVector3) {
    if (axis === 'x') {
      out.setComponents(0, 0, 1);
    } else if (axis === 'y') {
      out.setComponents(0, 0, 1);
    } else {
      out.setComponents(0, 1, 0);
    }
  }

  private __setFallbackWorldDirection(axisLocal: Vector3, camera: CameraComponent, out: MutableVector3) {
    const axisWorld = this.__transformDirectionFromGroupLocal(axisLocal, RotationGizmo.__tmpVector3_6);
    if (axisWorld.lengthSquared() < 1e-10) {
      out.setComponents(1, 0, 0);
      return;
    }
    Vector3.normalizeTo(axisWorld, axisWorld);

    Vector3.crossTo(axisWorld, camera.directionInner, out);
    if (out.lengthSquared() < 1e-10) {
      Vector3.crossTo(camera.upInner, axisWorld, out);
    }
    if (out.lengthSquared() < 1e-10) {
      this.__chooseAnyPerpendicular(axisWorld, out);
    }
  }

  private __chooseAnyPerpendicular(axis: IVector3, out: MutableVector3) {
    if (Math.abs(axis.x) < 0.9) {
      out.setComponents(0, -axis.z, axis.y);
    } else {
      out.setComponents(-axis.y, axis.x, 0);
    }
    if (out.lengthSquared() < 1e-10) {
      out.setComponents(1, 0, 0);
    }
  }

  private __handleLinearDrag(evt: PointerEvent) {
    const element = this.__activePointerElement;
    if (!element || this.__dragScale === 0) {
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const currentX = evt.clientX - rect.left;
    const currentY = evt.clientY - rect.top;
    const deltaX = currentX - this.__pointerPrev.x;
    const deltaY = currentY - this.__pointerPrev.y;
    this.__pointerPrev.setComponents(currentX, currentY);
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      return;
    }
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    const scalar = -deltaX * this.__dragScreenDirection.x - deltaY * this.__dragScreenDirection.y;
    if (scalar === 0) {
      return;
    }

    const deltaAngle = scalar * this.__dragScale;
    if (!Number.isFinite(deltaAngle) || deltaAngle === 0) {
      return;
    }

    this.__accumulatedAngle += deltaAngle;
    const deltaQuat = Quaternion.fromAxisAngle(this.__rotationAxisForQuaternion, this.__accumulatedAngle);
    this.__deltaQuaternion = Quaternion.multiply(deltaQuat, this.__targetRotationBackup);
    this._update();
  }

  private __transformDirectionFromGroupLocal(vec: IVector3, out: MutableVector3): MutableVector3 {
    const groupSceneGraph = RotationGizmo.__groupEntity?.getSceneGraph();
    if (!groupSceneGraph) {
      return out.setComponents(vec.x, vec.y, vec.z);
    }

    const matrix = groupSceneGraph.matrixInner;
    const x = vec.x;
    const y = vec.y;
    const z = vec.z;

    const worldX = matrix.m00 * x + matrix.m01 * y + matrix.m02 * z;
    const worldY = matrix.m10 * x + matrix.m11 * y + matrix.m12 * z;
    const worldZ = matrix.m20 * x + matrix.m21 * y + matrix.m22 * z;

    return out.setComponents(worldX, worldY, worldZ);
  }

  private __resolvePointerElement(evt: PointerEvent): HTMLElement | undefined {
    let element = evt.target as HTMLElement | null;
    if (!element || !element.getBoundingClientRect) {
      element = Config.eventTargetDom ?? null;
    }
    if (!element || !element.getBoundingClientRect) {
      return undefined;
    }
    return element;
  }

  private __disableCameraController() {
    if (this.__isCameraControllerDisabled) {
      return;
    }
    InputManager.disableCameraController();
    this.__isCameraControllerDisabled = true;
  }

  private __enableCameraControllerIfNeeded() {
    if (!this.__isCameraControllerDisabled) {
      return;
    }
    InputManager.enableCameraController();
    this.__isCameraControllerDisabled = false;
  }

  private __intersectPointerWithAxisPlane(evt: PointerEvent, axis: Axis): MutableVector3 | undefined {
    let element = evt.target as HTMLElement | null;
    if (!element || !element.getBoundingClientRect) {
      element = Config.eventTargetDom ?? null;
    }
    if (!element) {
      return undefined;
    }

    const rect = element.getBoundingClientRect();
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (width === 0 || height === 0) {
      return undefined;
    }
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as
      | CameraComponent
      | undefined;
    const groupSceneGraph = RotationGizmo.__groupEntity?.getSceneGraph();
    if (!activeCamera || !groupSceneGraph) {
      return undefined;
    }

    const invPV = MutableMatrix44.multiplyTo(
      activeCamera.projectionMatrix,
      activeCamera.viewMatrix,
      RotationGizmo.__tmpMatrix44_0
    ).invert();
    const nearPoint = MathClassUtil.unProjectTo(x, y, 0, invPV, viewport, RotationGizmo.__tmpVector3_0);
    const farPoint = MathClassUtil.unProjectTo(x, y, 1, invPV, viewport, RotationGizmo.__tmpVector3_1);

    const invGroupMatrix = Matrix44.invertTo(groupSceneGraph.matrixInner, RotationGizmo.__tmpMatrix44_1);
    const nearLocal = invGroupMatrix.multiplyVector3To(nearPoint, RotationGizmo.__tmpVector3_2);
    const farLocal = invGroupMatrix.multiplyVector3To(farPoint, RotationGizmo.__tmpVector3_3);
    const directionLocal = Vector3.subtractTo(farLocal, nearLocal, RotationGizmo.__tmpVector3_4);
    if (directionLocal.lengthSquared() === 0) {
      return undefined;
    }

    const denom = axis === 'x' ? directionLocal.x : axis === 'y' ? directionLocal.y : directionLocal.z;
    if (Math.abs(denom) < 1e-6) {
      return undefined;
    }
    const originCoord = axis === 'x' ? nearLocal.x : axis === 'y' ? nearLocal.y : nearLocal.z;
    const t = -originCoord / denom;
    if (!Number.isFinite(t) || t < 0) {
      return undefined;
    }

    const scaledDir = Vector3.multiplyTo(directionLocal, t, RotationGizmo.__tmpVector3_5);
    return Vector3.addTo(nearLocal, scaledDir, RotationGizmo.__tmpVector3_6) as MutableVector3;
  }

  private static __projectToPlane(position: IVector3, axis: Axis): Vector3 {
    switch (axis) {
      case 'x':
        return Vector3.fromCopy3(0, position.y, position.z);
      case 'y':
        return Vector3.fromCopy3(position.x, 0, position.z);
      default:
        return Vector3.fromCopy3(position.x, position.y, 0);
    }
  }

  private __getAxisForQuaternion(axis: Axis): Vector3 {
    const parent = this.__target.getSceneGraph().parent;
    if (RotationGizmo.__space === 'local' || Is.not.exist(parent)) {
      return RotationGizmo.__getAxisVector(axis);
    }

    const worldMatrix = parent.matrixInner.getRotate();
    const rotMat = Matrix33.fromCopy9RowMajor(
      worldMatrix.m00,
      worldMatrix.m01,
      worldMatrix.m02,
      worldMatrix.m10,
      worldMatrix.m11,
      worldMatrix.m12,
      worldMatrix.m20,
      worldMatrix.m21,
      worldMatrix.m22
    );
    const invRot = Matrix33.transpose(rotMat) as Matrix33;
    return invRot.multiplyVector(RotationGizmo.__getAxisVector(axis));
  }

  private static __getAxisVector(axis: Axis): Vector3 {
    switch (axis) {
      case 'x':
        return RotationGizmo.__unitX;
      case 'y':
        return RotationGizmo.__unitY;
      default:
        return RotationGizmo.__unitZ;
    }
  }

  private static __castRay(evt: PointerEvent, local = false) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as
      | CameraComponent
      | undefined;

    const caster = local ? RotationGizmo.__castFromEntitiesLocal : RotationGizmo.__castFromEntities;
    if (Is.not.exist(activeCamera)) {
      const empty: RaycastResultEx1 = { result: false };
      return { xResult: empty, yResult: empty, zResult: empty };
    }

    const xResult = caster(x, y, activeCamera, viewport, RotationGizmo.__xRingEntity);
    const yResult = caster(x, y, activeCamera, viewport, RotationGizmo.__yRingEntity);
    const zResult = caster(x, y, activeCamera, viewport, RotationGizmo.__zRingEntity);

    return { xResult, yResult, zResult };
  }

  private static __castFromEntities(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    ...entities: Array<IMeshEntity | undefined>
  ): RaycastResultEx1 {
    let closestResult: RaycastResultEx1 = { result: false };
    for (const entity of entities) {
      if (Is.not.exist(entity)) {
        continue;
      }
      const result = entity.getMesh().castRayFromScreenInWorld(x, y, camera, viewport, 0.0);
      if (!result.result) {
        continue;
      }
      const currentDistance = result.data?.t ?? Number.POSITIVE_INFINITY;
      const closestDistance = closestResult.data?.t ?? Number.POSITIVE_INFINITY;
      if (!closestResult.result || currentDistance < closestDistance) {
        closestResult = result;
      }
    }
    return closestResult;
  }

  private static __castFromEntitiesLocal(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    ...entities: Array<IMeshEntity | undefined>
  ): RaycastResultEx1 {
    let closestResult: RaycastResultEx1 = { result: false };
    for (const entity of entities) {
      if (Is.not.exist(entity)) {
        continue;
      }
      const result = entity.getMesh().castRayFromScreenInLocal(x, y, camera, viewport, 0.0);
      if (!result.result) {
        continue;
      }
      const currentDistance = result.data?.t ?? Number.POSITIVE_INFINITY;
      const closestDistance = closestResult.data?.t ?? Number.POSITIVE_INFINITY;
      if (!closestResult.result || currentDistance < closestDistance) {
        closestResult = result;
      }
    }
    return closestResult;
  }

  private static __createRingPrimitive(axis: Axis, material: Material) {
    const segments = 64;
    const radius = RotationGizmo.__length;
    const thickness = radius * 0.1;
    const attributes: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const outer = radius + thickness;
      const inner = Math.max(radius - thickness, 0.0001);

      if (axis === 'x') {
        attributes.push(0, outer * cos, outer * sin);
        attributes.push(0, inner * cos, inner * sin);
      } else if (axis === 'y') {
        attributes.push(outer * cos, 0, outer * sin);
        attributes.push(inner * cos, 0, inner * sin);
      } else {
        attributes.push(outer * cos, outer * sin, 0);
        attributes.push(inner * cos, inner * sin, 0);
      }
    }

    return Primitive.createPrimitive({
      attributeSemantics: [VertexAttribute.Position.XYZ],
      attributes: [new Float32Array(attributes)],
      primitiveMode: PrimitiveMode.TriangleStrip,
      material,
    });
  }

  private static __selectClosestAxis(
    candidates: Array<{ axis: Axis; result: RaycastResultEx1 }>
  ): { axis: Axis; result: RaycastResultEx1 } | undefined {
    let closest: { axis: Axis; result: RaycastResultEx1 } | undefined;
    for (const candidate of candidates) {
      if (!candidate.result.result) {
        continue;
      }
      const distance = candidate.result.data?.t ?? Number.POSITIVE_INFINITY;
      if (!closest || distance < (closest.result.data?.t ?? Number.POSITIVE_INFINITY)) {
        closest = candidate;
      }
    }
    return closest;
  }

  private static __createRingMaterial(color: Vector4): Material {
    const material = MaterialHelper.createClassicUberMaterial();
    material.alphaMode = AlphaMode.Blend;
    material.cullFace = false;
    material.setParameter('diffuseColorFactor', color);
    return material;
  }
}
