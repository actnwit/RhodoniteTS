// src/foundation/gizmos/RotationGizmo.ts
import { CameraComponent } from "../components/Camera/CameraComponent.js";
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { createGroupEntity } from "../components/SceneGraph/createGroupEntity.js";
import { AlphaMode } from "../definitions/AlphaMode.js";
import { Mesh } from "../geometry/Mesh.js";
import { Ring } from "../geometry/shapes/Ring.js";
import { createClassicUberMaterial } from "../helpers/materials/createClassicUberMaterial.js";
import { Matrix33 } from "../math/Matrix33.js";
import { MutableMatrix44 } from "../math/MutableMatrix44.js";
import { MutableQuaternion } from "../math/MutableQuaternion.js";
import { MutableVector2 } from "../math/MutableVector2.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { MutableVector4 } from "../math/MutableVector4.js";
import { Quaternion } from "../math/Quaternion.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector4 } from "../math/Vector4.js";
import { Is } from "../misc/Is.js";
import { assertExist } from "../misc/MiscUtil.js";
import { getEvent, INPUT_HANDLING_STATE_GIZMO_ROTATION, InputManager } from "../system/InputManager.js";
import { Gizmo } from "./Gizmo.js";
var _RotationGizmo = class _RotationGizmo extends Gizmo {
  constructor() {
    super(...arguments);
    this.__isPointerDown = false;
    this.__startVector = Vector3.zero();
    this.__deltaQuaternion = Quaternion.identity();
    this.__targetRotationBackup = Quaternion.identity();
    this.__onPointerDownFunc = this.__onPointerDown.bind(this);
    this.__onPointerMoveFunc = this.__onPointerMove.bind(this);
    this.__onPointerUpFunc = this.__onPointerUp.bind(this);
    this.__isCameraControllerDisabled = false;
    this.__pointerPrev = MutableVector2.zero();
    this.__dragScreenDirection = MutableVector2.zero();
    this.__rotationAxisForQuaternion = MutableVector3.zero();
    this.__dragScale = 0;
    this.__accumulatedAngle = 0;
  }
  /**
   * Gets the resources for a specific engine, or undefined if not initialized.
   */
  static __getResources(engine) {
    return _RotationGizmo.__resourcesMap.get(engine.objectUID);
  }
  ///
  ///
  /// Accessors
  ///
  ///
  get isSetup() {
    return Is.exist(this.__topEntity);
  }
  /**
   * Sets the ring radius of the gizmo.
   * @param val - The ring radius value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value only affects the geometry generated
   * before the gizmo resources are created.
   */
  set length(val) {
    _RotationGizmo.__length = val;
  }
  /**
   * Gets the ring radius of the gizmo.
   * @returns The ring radius value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value only affects the geometry generated
   * before the gizmo resources are created.
   */
  get length() {
    return _RotationGizmo.__length;
  }
  /**
   * Sets the gizmo size as a fraction of the viewport height.
   * The unit ring radius is projected to this fraction of the viewport height.
   * @param val - The ratio of the viewport height (for example, 0.08 for 8%)
   */
  set screenSpaceRatio(val) {
    _RotationGizmo.__screenSpaceRatio = val;
  }
  /**
   * Gets the gizmo size as a fraction of the viewport height.
   * @returns The ratio of the viewport height occupied by the gizmo's unit ring radius
   */
  get screenSpaceRatio() {
    return _RotationGizmo.__screenSpaceRatio;
  }
  get isVisible() {
    return this.__isVisible;
  }
  set isVisible(flg) {
    const resources = _RotationGizmo.__getResources(this.__engine);
    if (!resources) {
      return;
    }
    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(this.__engine.config.eventTargetDom)) {
        eventTargetDom = this.__engine.config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_ROTATION, [
        {
          eventName: getEvent("start"),
          handler: this.__onPointerDownFunc,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: getEvent("move"),
          handler: this.__onPointerMoveFunc,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: getEvent("end"),
          handler: this.__onPointerUpFunc,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "pointerleave",
          handler: this.__onPointerUpFunc,
          options: {},
          classInstance: this,
          eventTargetDom
        }
      ]);
      this.__latestTargetEntity = this.__target;
      this.__attachSharedGroup();
      this.__applySpaceToGroup();
    }
    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_ROTATION);
      this.__isPointerDown = false;
      _RotationGizmo.__activeAxis = "none";
    }
    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_ROTATION, flg);
    this.__setVisible(flg);
  }
  setSpace(space) {
    _RotationGizmo.__space = space;
    if (this.__isVisible) {
      this.__applySpaceToGroup();
    }
  }
  ///
  ///
  /// Public Methods
  ///
  ///
  _setup() {
    if (this.__toSkipSetup()) {
      return;
    }
    const targetSceneGraph = this.__target.getSceneGraph();
    if (!targetSceneGraph) {
      return;
    }
    this.__topEntity = createGroupEntity(this.__engine);
    this.__topEntity.tryToSetUniqueName(`RotationGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.__topEntity.getSceneGraph());
    let resources = _RotationGizmo.__getResources(this.__engine);
    if (!resources) {
      resources = this.__createResources();
      _RotationGizmo.__resourcesMap.set(this.__engine.objectUID, resources);
    }
    this.__attachSharedGroup();
    this.__latestTargetEntity = this.__target;
    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: "Gizmo", value: "Rotation" });
    this._update();
  }
  /**
   * Creates all resources needed for the gizmo.
   */
  __createResources() {
    const xRingEntity = createMeshEntity(this.__engine);
    xRingEntity.tryToSetUniqueName("RotationGizmo_xRing", true);
    const xRingMaterial = _RotationGizmo.__createRingMaterial(this.__engine, Vector4.fromCopyArray4([1, 0, 0, 0.85]));
    const xRingMesh = new Mesh(this.__engine);
    const xRingPrimitive = _RotationGizmo.__createRingPrimitive(this.__engine, "x", xRingMaterial);
    xRingMesh.addPrimitive(xRingPrimitive);
    xRingEntity.getMesh().setMesh(xRingMesh);
    const yRingEntity = createMeshEntity(this.__engine);
    yRingEntity.tryToSetUniqueName("RotationGizmo_yRing", true);
    const yRingMaterial = _RotationGizmo.__createRingMaterial(this.__engine, Vector4.fromCopyArray4([0, 1, 0, 0.85]));
    const yRingMesh = new Mesh(this.__engine);
    const yRingPrimitive = _RotationGizmo.__createRingPrimitive(this.__engine, "y", yRingMaterial);
    yRingMesh.addPrimitive(yRingPrimitive);
    yRingEntity.getMesh().setMesh(yRingMesh);
    const zRingEntity = createMeshEntity(this.__engine);
    zRingEntity.tryToSetUniqueName("RotationGizmo_zRing", true);
    const zRingMaterial = _RotationGizmo.__createRingMaterial(this.__engine, Vector4.fromCopyArray4([0, 0, 1, 0.85]));
    const zRingMesh = new Mesh(this.__engine);
    const zRingPrimitive = _RotationGizmo.__createRingPrimitive(this.__engine, "z", zRingMaterial);
    zRingMesh.addPrimitive(zRingPrimitive);
    zRingEntity.getMesh().setMesh(zRingMesh);
    const groupEntity = createGroupEntity(this.__engine);
    return {
      groupEntity,
      xRingEntity,
      yRingEntity,
      zRingEntity,
      xRingMesh,
      yRingMesh,
      zRingMesh,
      xRingMaterial,
      yRingMaterial,
      zRingMaterial,
      xRingPrimitive,
      yRingPrimitive,
      zRingPrimitive
    };
  }
  _update() {
    if (!Is.exist(this.__topEntity)) {
      return;
    }
    const sg = this.__target.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    const worldPosition = aabb.isVanilla() ? sg.position : aabb.centerPoint;
    const transform = this.__topEntity.getTransform();
    transform.localPosition = worldPosition;
    const uniform = Gizmo.__calcScreenSpaceScale(this.__engine, worldPosition, _RotationGizmo.__screenSpaceRatio);
    transform.localScale = Vector3.fromCopy3(uniform, uniform, uniform);
    this.__updateWorldMatricesOfSubtree();
    if (this.__isPointerDown && _RotationGizmo.__activeAxis !== "none") {
      if (this.__latestTargetEntity === this.__target) {
        this.__target.getTransform().localRotation = Quaternion.fromCopyQuaternion(this.__deltaQuaternion);
      }
    }
  }
  _destroy() {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }
  ///
  ///
  /// Private helpers
  ///
  ///
  __attachSharedGroup() {
    const resources = _RotationGizmo.__getResources(this.__engine);
    if (!Is.exist(this.__topEntity) || !resources) {
      return;
    }
    const topSceneGraph = this.__topEntity.getSceneGraph();
    const groupSceneGraph = resources.groupEntity.getSceneGraph();
    topSceneGraph.addChild(groupSceneGraph);
    groupSceneGraph.addChild(resources.xRingEntity.getSceneGraph());
    groupSceneGraph.addChild(resources.yRingEntity.getSceneGraph());
    groupSceneGraph.addChild(resources.zRingEntity.getSceneGraph());
  }
  __applySpaceToGroup() {
    const resources = _RotationGizmo.__getResources(this.__engine);
    if (!resources) {
      return;
    }
    if (_RotationGizmo.__space === "local") {
      const quaternion = _RotationGizmo.__tmpQuaternion_0;
      const parent = this.__target.getSceneGraph().parent;
      if (Is.exist(parent)) {
        parent.getQuaternionRecursivelyTo(quaternion);
      } else {
        quaternion.identity();
      }
      resources.groupEntity.getTransform().localRotation = quaternion;
    } else {
      resources.groupEntity.getTransform().localRotation = _RotationGizmo.__tmpQuaternion_0.identity();
    }
  }
  __onPointerDown(evt) {
    this.__isPointerDown = true;
    this.__activePointerElement = void 0;
    this.__pointerPrev.setComponents(0, 0);
    this.__dragScreenDirection.setComponents(0, 0);
    this.__dragScale = 0;
    this.__accumulatedAngle = 0;
    this.__rotationAxisForQuaternion.setComponents(0, 0, 0);
    const { xResult, yResult, zResult } = _RotationGizmo.__castRay(this.__engine, evt, true);
    _RotationGizmo.__activeAxis = "none";
    const picked = _RotationGizmo.__selectClosestAxis([
      { axis: "x", result: xResult },
      { axis: "y", result: yResult },
      { axis: "z", result: zResult }
    ]);
    if (picked) {
      assertExist(picked.result.data);
      this.__startVector = Vector3.normalize(_RotationGizmo.__projectToPlane(picked.result.data.position, picked.axis));
      _RotationGizmo.__activeAxis = picked.axis;
    }
    if (_RotationGizmo.__activeAxis === "none") {
      this.__isPointerDown = false;
      return;
    }
    evt.preventDefault();
    this.__disableCameraController();
    this.__targetRotationBackup = Quaternion.fromCopyQuaternion(this.__target.getTransform().localRotation);
    this.__deltaQuaternion = Quaternion.fromCopyQuaternion(this.__targetRotationBackup);
    this.__prepareLinearDragMapping(evt, _RotationGizmo.__activeAxis);
  }
  __onPointerMove(evt) {
    evt.preventDefault();
    if (Is.false(this.__isPointerDown)) {
      return;
    }
    const activeAxis = _RotationGizmo.__activeAxis;
    if (activeAxis === "none") {
      return;
    }
    this.__handleLinearDrag(evt);
  }
  __onPointerUp(evt) {
    evt.preventDefault();
    this.__isPointerDown = false;
    _RotationGizmo.__activeAxis = "none";
    this.__enableCameraControllerIfNeeded();
    this.__startVector = Vector3.zero();
    this.__targetRotationBackup = Quaternion.fromCopyQuaternion(this.__target.getTransform().localRotation);
    this.__deltaQuaternion = Quaternion.fromCopyQuaternion(this.__targetRotationBackup);
    this.__activePointerElement = void 0;
    this.__pointerPrev.setComponents(0, 0);
    this.__dragScreenDirection.setComponents(0, 0);
    this.__rotationAxisForQuaternion.setComponents(0, 0, 0);
    this.__dragScale = 0;
    this.__accumulatedAngle = 0;
  }
  __prepareLinearDragMapping(evt, axis) {
    var _a;
    const resources = _RotationGizmo.__getResources(this.__engine);
    if (!resources) {
      return;
    }
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
      this.__activePointerElement = void 0;
    }
    this.__pointerPrev.setComponents(pointerX, pointerY);
    this.__dragScale = 2 * Math.PI / Math.max(width, height, 1);
    this.__accumulatedAngle = 0;
    const axisForQuat = this.__getAxisForQuaternion(axis);
    Vector3.normalizeTo(axisForQuat, this.__rotationAxisForQuaternion);
    const activeCamera = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    );
    const groupSceneGraph = (_a = resources.groupEntity) == null ? void 0 : _a.getSceneGraph();
    if (!element || !activeCamera || !groupSceneGraph) {
      this.__setDefaultDragDirection(axis);
      return;
    }
    const axisLocal = _RotationGizmo.__getAxisVector(axis);
    const tangentLocal = Vector3.crossTo(this.__startVector, axisLocal, _RotationGizmo.__tmpVector3_8);
    if (tangentLocal.lengthSquared() < 1e-10) {
      this.__setFallbackLocalTangent(axis, tangentLocal);
    }
    Vector3.normalizeTo(tangentLocal, tangentLocal);
    const tangentWorld = this.__transformDirectionFromGroupLocal(tangentLocal, _RotationGizmo.__tmpVector3_9);
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.__setFallbackWorldDirection(axisLocal, activeCamera, tangentWorld);
    }
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.__setDefaultDragDirection(axis);
      return;
    }
    Vector3.normalizeTo(tangentWorld, tangentWorld);
    const centerWorld = groupSceneGraph.matrixInner.getTranslateTo(_RotationGizmo.__tmpVector3_7);
    const pvMatrix = MutableMatrix44.multiplyTo(
      activeCamera.projectionMatrix,
      activeCamera.viewMatrix,
      _RotationGizmo.__tmpMatrix44_2
    );
    const clipCenter = pvMatrix.multiplyVectorTo(
      _RotationGizmo.__tmpVector4_0.setComponents(centerWorld.x, centerWorld.y, centerWorld.z, 1),
      _RotationGizmo.__tmpVector4_2
    );
    const clipTangent = pvMatrix.multiplyVectorTo(
      _RotationGizmo.__tmpVector4_1.setComponents(
        centerWorld.x + tangentWorld.x,
        centerWorld.y + tangentWorld.y,
        centerWorld.z + tangentWorld.z,
        1
      ),
      _RotationGizmo.__tmpVector4_3
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
  __setDefaultDragDirection(axis) {
    if (axis === "x") {
      this.__dragScreenDirection.setComponents(0, -1);
    } else if (axis === "y") {
      this.__dragScreenDirection.setComponents(1, 0);
    } else {
      this.__dragScreenDirection.setComponents(1, 0);
    }
  }
  __setFallbackLocalTangent(axis, out) {
    if (axis === "x") {
      out.setComponents(0, 0, 1);
    } else if (axis === "y") {
      out.setComponents(0, 0, 1);
    } else {
      out.setComponents(0, 1, 0);
    }
  }
  __setFallbackWorldDirection(axisLocal, camera, out) {
    const axisWorld = this.__transformDirectionFromGroupLocal(axisLocal, _RotationGizmo.__tmpVector3_6);
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
  __chooseAnyPerpendicular(axis, out) {
    if (Math.abs(axis.x) < 0.9) {
      out.setComponents(0, -axis.z, axis.y);
    } else {
      out.setComponents(-axis.y, axis.x, 0);
    }
    if (out.lengthSquared() < 1e-10) {
      out.setComponents(1, 0, 0);
    }
  }
  __handleLinearDrag(evt) {
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
  __transformDirectionFromGroupLocal(vec, out) {
    var _a;
    const resources = _RotationGizmo.__getResources(this.__engine);
    const groupSceneGraph = (_a = resources == null ? void 0 : resources.groupEntity) == null ? void 0 : _a.getSceneGraph();
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
  __resolvePointerElement(evt) {
    var _a;
    let element = evt.target;
    if (!(element == null ? void 0 : element.getBoundingClientRect)) {
      element = (_a = this.__engine.config.eventTargetDom) != null ? _a : null;
    }
    if (!(element == null ? void 0 : element.getBoundingClientRect)) {
      return void 0;
    }
    return element;
  }
  __disableCameraController() {
    if (this.__isCameraControllerDisabled) {
      return;
    }
    InputManager.disableCameraController();
    this.__isCameraControllerDisabled = true;
  }
  __enableCameraControllerIfNeeded() {
    if (!this.__isCameraControllerDisabled) {
      return;
    }
    InputManager.enableCameraController();
    this.__isCameraControllerDisabled = false;
  }
  static __projectToPlane(position, axis) {
    switch (axis) {
      case "x":
        return Vector3.fromCopy3(0, position.y, position.z);
      case "y":
        return Vector3.fromCopy3(position.x, 0, position.z);
      default:
        return Vector3.fromCopy3(position.x, position.y, 0);
    }
  }
  __getAxisForQuaternion(axis) {
    const parent = this.__target.getSceneGraph().parent;
    if (_RotationGizmo.__space === "local" || Is.not.exist(parent)) {
      return _RotationGizmo.__getAxisVector(axis);
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
    const invRot = Matrix33.transpose(rotMat);
    return invRot.multiplyVector(_RotationGizmo.__getAxisVector(axis));
  }
  static __getAxisVector(axis) {
    switch (axis) {
      case "x":
        return _RotationGizmo.__unitX;
      case "y":
        return _RotationGizmo.__unitY;
      default:
        return _RotationGizmo.__unitZ;
    }
  }
  static __castRay(engine, evt, local = false) {
    const resources = _RotationGizmo.__getResources(engine);
    const empty = { result: false };
    if (!resources) {
      return { xResult: empty, yResult: empty, zResult: empty };
    }
    const rect = evt.target.getBoundingClientRect();
    const width = evt.target.clientWidth;
    const height = evt.target.clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height);
    const activeCamera = engine.componentRepository.getComponent(CameraComponent, CameraComponent.getCurrent(engine));
    const caster = local ? _RotationGizmo.__castFromEntitiesLocal : _RotationGizmo.__castFromEntities;
    if (Is.not.exist(activeCamera)) {
      return { xResult: empty, yResult: empty, zResult: empty };
    }
    const xResult = caster(x, y, activeCamera, viewport, resources.xRingEntity);
    const yResult = caster(x, y, activeCamera, viewport, resources.yRingEntity);
    const zResult = caster(x, y, activeCamera, viewport, resources.zRingEntity);
    return { xResult, yResult, zResult };
  }
  static __castFromEntities(x, y, camera, viewport, ...entities) {
    var _a, _b, _c, _d;
    let closestResult = { result: false };
    for (const entity of entities) {
      if (Is.not.exist(entity)) {
        continue;
      }
      const result = entity.getMesh().castRayFromScreenInWorld(x, y, camera, viewport, 0);
      if (!result.result) {
        continue;
      }
      const currentDistance = (_b = (_a = result.data) == null ? void 0 : _a.t) != null ? _b : Number.POSITIVE_INFINITY;
      const closestDistance = (_d = (_c = closestResult.data) == null ? void 0 : _c.t) != null ? _d : Number.POSITIVE_INFINITY;
      if (!closestResult.result || currentDistance < closestDistance) {
        closestResult = result;
      }
    }
    return closestResult;
  }
  static __castFromEntitiesLocal(x, y, camera, viewport, ...entities) {
    var _a, _b, _c, _d;
    let closestResult = { result: false };
    for (const entity of entities) {
      if (Is.not.exist(entity)) {
        continue;
      }
      const result = entity.getMesh().castRayFromScreenInLocal(x, y, camera, viewport, 0);
      if (!result.result) {
        continue;
      }
      const currentDistance = (_b = (_a = result.data) == null ? void 0 : _a.t) != null ? _b : Number.POSITIVE_INFINITY;
      const closestDistance = (_d = (_c = closestResult.data) == null ? void 0 : _c.t) != null ? _d : Number.POSITIVE_INFINITY;
      if (!closestResult.result || currentDistance < closestDistance) {
        closestResult = result;
      }
    }
    return closestResult;
  }
  static __createRingPrimitive(engine, axis, material) {
    const radius = _RotationGizmo.__length;
    const ring = new Ring(engine);
    ring.generate({
      radius,
      thickness: radius * 0.1,
      segments: 64,
      axis,
      material
    });
    return ring;
  }
  static __selectClosestAxis(candidates) {
    var _a, _b, _c, _d;
    let closest;
    for (const candidate of candidates) {
      if (!candidate.result.result) {
        continue;
      }
      const distance = (_b = (_a = candidate.result.data) == null ? void 0 : _a.t) != null ? _b : Number.POSITIVE_INFINITY;
      if (!closest || distance < ((_d = (_c = closest.result.data) == null ? void 0 : _c.t) != null ? _d : Number.POSITIVE_INFINITY)) {
        closest = candidate;
      }
    }
    return closest;
  }
  static __createRingMaterial(engine, color) {
    const material = createClassicUberMaterial(engine);
    material.alphaMode = AlphaMode.Blend;
    material.cullFace = false;
    material.setParameter("diffuseColorFactor", color);
    return material;
  }
  /**
   * Cleans up all static resources for a specific Engine.
   * This removes the resources associated with the engine from the map.
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(engine) {
    _RotationGizmo.__resourcesMap.delete(engine.objectUID);
    _RotationGizmo.__activeAxis = "none";
  }
};
/** Resources managed per-Engine instance */
_RotationGizmo.__resourcesMap = /* @__PURE__ */ new Map();
_RotationGizmo.__activeAxis = "none";
_RotationGizmo.__space = "world";
_RotationGizmo.__length = 1;
/** Gizmo size as a fraction of the viewport height (ring radius). */
_RotationGizmo.__screenSpaceRatio = 0.08;
_RotationGizmo.__unitX = Vector3.fromCopy3(1, 0, 0);
_RotationGizmo.__unitY = Vector3.fromCopy3(0, 1, 0);
_RotationGizmo.__unitZ = Vector3.fromCopy3(0, 0, 1);
_RotationGizmo.__tmpMatrix44_0 = MutableMatrix44.zero();
_RotationGizmo.__tmpMatrix44_1 = MutableMatrix44.zero();
_RotationGizmo.__tmpMatrix44_2 = MutableMatrix44.zero();
_RotationGizmo.__tmpVector4_0 = MutableVector4.zero();
_RotationGizmo.__tmpVector4_1 = MutableVector4.zero();
_RotationGizmo.__tmpVector4_2 = MutableVector4.zero();
_RotationGizmo.__tmpVector4_3 = MutableVector4.zero();
_RotationGizmo.__tmpVector3_0 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_1 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_2 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_3 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_4 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_5 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_6 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_7 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_8 = MutableVector3.zero();
_RotationGizmo.__tmpVector3_9 = MutableVector3.zero();
/** Reusable quaternion for world-rotation calculations (avoids per-frame allocations) */
_RotationGizmo.__tmpQuaternion_0 = MutableQuaternion.identity();
var RotationGizmo = _RotationGizmo;
export {
  RotationGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL1JvdGF0aW9uR2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVNZXNoRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvY3JlYXRlTWVzaEVudGl0eSc7XG5pbXBvcnQgeyBjcmVhdGVHcm91cEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9jcmVhdGVHcm91cEVudGl0eSc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gJy4uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUmluZyB9IGZyb20gJy4uL2dlb21ldHJ5L3NoYXBlcy9SaW5nJztcbmltcG9ydCB0eXBlIHsgUmF5Y2FzdFJlc3VsdEV4MSB9IGZyb20gJy4uL2dlb21ldHJ5L3R5cGVzL0dlb21ldHJ5VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJTWVzaEVudGl0eSwgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsIH0gZnJvbSAnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTWF0cml4MzMnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBhc3NlcnRFeGlzdCB9IGZyb20gJy4uL21pc2MvTWlzY1V0aWwnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IGdldEV2ZW50LCBJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19ST1RBVElPTiwgSW5wdXRNYW5hZ2VyIH0gZnJvbSAnLi4vc3lzdGVtL0lucHV0TWFuYWdlcic7XG5pbXBvcnQgeyBHaXptbyB9IGZyb20gJy4vR2l6bW8nO1xuXG5kZWNsYXJlIGxldCB3aW5kb3c6IGFueTtcblxudHlwZSBBeGlzID0gJ3gnIHwgJ3knIHwgJ3onO1xuXG4vKipcbiAqIEludGVybmFsIHJlc291cmNlcyBmb3IgUm90YXRpb25HaXptbywgbWFuYWdlZCBwZXItRW5naW5lLlxuICogQGludGVybmFsXG4gKi9cbmludGVyZmFjZSBSb3RhdGlvbkdpem1vUmVzb3VyY2VzIHtcbiAgZ3JvdXBFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5O1xuICB4UmluZ0VudGl0eTogSU1lc2hFbnRpdHk7XG4gIHlSaW5nRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgelJpbmdFbnRpdHk6IElNZXNoRW50aXR5O1xuICB4UmluZ01lc2g6IE1lc2g7XG4gIHlSaW5nTWVzaDogTWVzaDtcbiAgelJpbmdNZXNoOiBNZXNoO1xuICB4UmluZ01hdGVyaWFsOiBNYXRlcmlhbDtcbiAgeVJpbmdNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHpSaW5nTWF0ZXJpYWw6IE1hdGVyaWFsO1xuICB4UmluZ1ByaW1pdGl2ZTogUmluZztcbiAgeVJpbmdQcmltaXRpdmU6IFJpbmc7XG4gIHpSaW5nUHJpbWl0aXZlOiBSaW5nO1xufVxuXG4vKipcbiAqIFJvdGF0aW9uR2l6bW8gcHJvdmlkZXMgaW50ZXJhY3RpdmUgcm90YXRpb24gcmluZ3MgZm9yIG1hbmlwdWxhdGluZyBlbnRpdHkgb3JpZW50YXRpb24uXG4gKiBJdCBvZmZlcnMgdGhyZWUgY29sb3ItY29kZWQgcmluZ3MgKFg6IHJlZCwgWTogZ3JlZW4sIFo6IGJsdWUpIHRoYXQgcmVzcG9uZCB0byBwb2ludGVyXG4gKiBkcmFnIG9wZXJhdGlvbnMgYm90aCBpbiB3b3JsZCBzcGFjZSBhbmQgaW4gbG9jYWwgc3BhY2UgYWxpZ25lZCB0byB0aGUgdGFyZ2V0IGhpZXJhcmNoeS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdGF0aW9uR2l6bW8gZXh0ZW5kcyBHaXptbyB7XG4gIC8qKiBSZXNvdXJjZXMgbWFuYWdlZCBwZXItRW5naW5lIGluc3RhbmNlICovXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb3VyY2VzTWFwOiBNYXA8bnVtYmVyLCBSb3RhdGlvbkdpem1vUmVzb3VyY2VzPiA9IG5ldyBNYXAoKTtcblxuICBwcml2YXRlIHN0YXRpYyBfX2FjdGl2ZUF4aXM6IEF4aXMgfCAnbm9uZScgPSAnbm9uZSc7XG4gIHByaXZhdGUgc3RhdGljIF9fc3BhY2U6ICdsb2NhbCcgfCAnd29ybGQnID0gJ3dvcmxkJztcbiAgcHJpdmF0ZSBzdGF0aWMgX19sZW5ndGggPSAxO1xuICAvKiogR2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgKHJpbmcgcmFkaXVzKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zY3JlZW5TcGFjZVJhdGlvID0gMC4wODtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX191bml0WCA9IFZlY3RvcjMuZnJvbUNvcHkzKDEsIDAsIDApO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3VuaXRZID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdW5pdFogPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAxKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8wID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8xID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8yID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3I0XzAgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yNF8xID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjRfMiA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3I0XzMgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18wID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfMSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzIgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18zID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfNCA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzUgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM182ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfNyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzggPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM185ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAvKiogUmV1c2FibGUgcXVhdGVybmlvbiBmb3Igd29ybGQtcm90YXRpb24gY2FsY3VsYXRpb25zIChhdm9pZHMgcGVyLWZyYW1lIGFsbG9jYXRpb25zKSAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFF1YXRlcm5pb25fMCA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG5cbiAgcHJpdmF0ZSBfX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3N0YXJ0VmVjdG9yID0gVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19kZWx0YVF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBfX2xhdGVzdFRhcmdldEVudGl0eT86IElTY2VuZUdyYXBoRW50aXR5O1xuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bkZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyRG93bi5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyTW92ZUZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyTW92ZS5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyVXBGdW5jID0gdGhpcy5fX29uUG9pbnRlclVwLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcG9pbnRlclByZXYgPSBNdXRhYmxlVmVjdG9yMi56ZXJvKCk7XG4gIHByaXZhdGUgX19kcmFnU2NyZWVuRGlyZWN0aW9uID0gTXV0YWJsZVZlY3RvcjIuemVybygpO1xuICBwcml2YXRlIF9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbiA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2RyYWdTY2FsZSA9IDA7XG4gIHByaXZhdGUgX19hY2N1bXVsYXRlZEFuZ2xlID0gMDtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVBvaW50ZXJFbGVtZW50PzogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlc291cmNlcyBmb3IgYSBzcGVjaWZpYyBlbmdpbmUsIG9yIHVuZGVmaW5lZCBpZiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJlc291cmNlcyhlbmdpbmU6IEVuZ2luZSk6IFJvdGF0aW9uR2l6bW9SZXNvdXJjZXMgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBSb3RhdGlvbkdpem1vLl9fcmVzb3VyY2VzTWFwLmdldChlbmdpbmUub2JqZWN0VUlEKTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgZ2V0IGlzU2V0dXAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIElzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJpbmcgcmFkaXVzIG9mIHRoZSBnaXptby5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSByaW5nIHJhZGl1cyB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgb25seSBhZmZlY3RzIHRoZSBnZW9tZXRyeSBnZW5lcmF0ZWRcbiAgICogYmVmb3JlIHRoZSBnaXptbyByZXNvdXJjZXMgYXJlIGNyZWF0ZWQuXG4gICAqL1xuICBzZXQgbGVuZ3RoKHZhbDogbnVtYmVyKSB7XG4gICAgUm90YXRpb25HaXptby5fX2xlbmd0aCA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByaW5nIHJhZGl1cyBvZiB0aGUgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRoZSByaW5nIHJhZGl1cyB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgb25seSBhZmZlY3RzIHRoZSBnZW9tZXRyeSBnZW5lcmF0ZWRcbiAgICogYmVmb3JlIHRoZSBnaXptbyByZXNvdXJjZXMgYXJlIGNyZWF0ZWQuXG4gICAqL1xuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX19sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZ2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIFRoZSB1bml0IHJpbmcgcmFkaXVzIGlzIHByb2plY3RlZCB0byB0aGlzIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgcmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCAoZm9yIGV4YW1wbGUsIDAuMDggZm9yIDglKVxuICAgKi9cbiAgc2V0IHNjcmVlblNwYWNlUmF0aW8odmFsOiBudW1iZXIpIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fc2NyZWVuU3BhY2VSYXRpbyA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnaXptbyBzaXplIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHZpZXdwb3J0IGhlaWdodC5cbiAgICogQHJldHVybnMgVGhlIHJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgb2NjdXBpZWQgYnkgdGhlIGdpem1vJ3MgdW5pdCByaW5nIHJhZGl1c1xuICAgKi9cbiAgZ2V0IHNjcmVlblNwYWNlUmF0aW8oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUm90YXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW87XG4gIH1cblxuICBnZXQgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNWaXNpYmxlO1xuICB9XG5cbiAgc2V0IGlzVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXNvdXJjZXMgPSBSb3RhdGlvbkdpem1vLl9fZ2V0UmVzb3VyY2VzKHRoaXMuX19lbmdpbmUpO1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX19pc1Zpc2libGUgPT09IGZhbHNlICYmIGZsZyA9PT0gdHJ1ZSkge1xuICAgICAgbGV0IGV2ZW50VGFyZ2V0RG9tID0gd2luZG93O1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tKSkge1xuICAgICAgICBldmVudFRhcmdldERvbSA9IHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tO1xuICAgICAgfVxuICAgICAgSW5wdXRNYW5hZ2VyLnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OLCBbXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6IGdldEV2ZW50KCdzdGFydCcpLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19vblBvaW50ZXJEb3duRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnbW92ZScpLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19vblBvaW50ZXJNb3ZlRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnZW5kJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAncG9pbnRlcmxlYXZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fb25Qb2ludGVyVXBGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHt9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICBdKTtcblxuICAgICAgdGhpcy5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG4gICAgICB0aGlzLl9fYXR0YWNoU2hhcmVkR3JvdXAoKTtcbiAgICAgIHRoaXMuX19hcHBseVNwYWNlVG9Hcm91cCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9faXNWaXNpYmxlID09PSB0cnVlICYmIGZsZyA9PT0gZmFsc2UpIHtcbiAgICAgIElucHV0TWFuYWdlci51bnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OKTtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICB9XG5cbiAgICBJbnB1dE1hbmFnZXIuc2V0QWN0aXZlKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OLCBmbGcpO1xuICAgIHRoaXMuX19zZXRWaXNpYmxlKGZsZyk7XG4gIH1cblxuICBzZXRTcGFjZShzcGFjZTogJ2xvY2FsJyB8ICd3b3JsZCcpIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fc3BhY2UgPSBzcGFjZTtcbiAgICBpZiAodGhpcy5fX2lzVmlzaWJsZSkge1xuICAgICAgdGhpcy5fX2FwcGx5U3BhY2VUb0dyb3VwKCk7XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHVibGljIE1ldGhvZHNcbiAgLy8vXG4gIC8vL1xuXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRTY2VuZUdyYXBoID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCF0YXJnZXRTY2VuZUdyYXBoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX3RvcEVudGl0eSA9IGNyZWF0ZUdyb3VwRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKGBSb3RhdGlvbkdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gdHJ1ZTtcbiAgICB0YXJnZXRTY2VuZUdyYXBoLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpISk7XG5cbiAgICAvLyBDaGVjayBpZiByZXNvdXJjZXMgYWxyZWFkeSBleGlzdCBmb3IgdGhpcyBlbmdpbmVcbiAgICBsZXQgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgLy8gQ3JlYXRlIHJlc291cmNlcyBmb3IgdGhpcyBlbmdpbmVcbiAgICAgIHJlc291cmNlcyA9IHRoaXMuX19jcmVhdGVSZXNvdXJjZXMoKTtcbiAgICAgIFJvdGF0aW9uR2l6bW8uX19yZXNvdXJjZXNNYXAuc2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlELCByZXNvdXJjZXMpO1xuICAgIH1cblxuICAgIHRoaXMuX19hdHRhY2hTaGFyZWRHcm91cCgpO1xuICAgIHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPSB0aGlzLl9fdGFyZ2V0O1xuXG4gICAgdGhpcy5zZXRHaXptb1RhZygpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6ICdHaXptbycsIHZhbHVlOiAnUm90YXRpb24nIH0pO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYWxsIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBnaXptby5cbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVSZXNvdXJjZXMoKTogUm90YXRpb25HaXptb1Jlc291cmNlcyB7XG4gICAgLy8gWCByaW5nXG4gICAgY29uc3QgeFJpbmdFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHhSaW5nRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnUm90YXRpb25HaXptb194UmluZycsIHRydWUpO1xuICAgIGNvbnN0IHhSaW5nTWF0ZXJpYWwgPSBSb3RhdGlvbkdpem1vLl9fY3JlYXRlUmluZ01hdGVyaWFsKHRoaXMuX19lbmdpbmUsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzEsIDAsIDAsIDAuODVdKSk7XG4gICAgY29uc3QgeFJpbmdNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgeFJpbmdQcmltaXRpdmUgPSBSb3RhdGlvbkdpem1vLl9fY3JlYXRlUmluZ1ByaW1pdGl2ZSh0aGlzLl9fZW5naW5lLCAneCcsIHhSaW5nTWF0ZXJpYWwpO1xuICAgIHhSaW5nTWVzaC5hZGRQcmltaXRpdmUoeFJpbmdQcmltaXRpdmUpO1xuICAgIHhSaW5nRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHhSaW5nTWVzaCk7XG5cbiAgICAvLyBZIHJpbmdcbiAgICBjb25zdCB5UmluZ0VudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgeVJpbmdFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdSb3RhdGlvbkdpem1vX3lSaW5nJywgdHJ1ZSk7XG4gICAgY29uc3QgeVJpbmdNYXRlcmlhbCA9IFJvdGF0aW9uR2l6bW8uX19jcmVhdGVSaW5nTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSwgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMCwgMSwgMCwgMC44NV0pKTtcbiAgICBjb25zdCB5UmluZ01lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB5UmluZ1ByaW1pdGl2ZSA9IFJvdGF0aW9uR2l6bW8uX19jcmVhdGVSaW5nUHJpbWl0aXZlKHRoaXMuX19lbmdpbmUsICd5JywgeVJpbmdNYXRlcmlhbCk7XG4gICAgeVJpbmdNZXNoLmFkZFByaW1pdGl2ZSh5UmluZ1ByaW1pdGl2ZSk7XG4gICAgeVJpbmdFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeVJpbmdNZXNoKTtcblxuICAgIC8vIFogcmluZ1xuICAgIGNvbnN0IHpSaW5nRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB6UmluZ0VudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1JvdGF0aW9uR2l6bW9felJpbmcnLCB0cnVlKTtcbiAgICBjb25zdCB6UmluZ01hdGVyaWFsID0gUm90YXRpb25HaXptby5fX2NyZWF0ZVJpbmdNYXRlcmlhbCh0aGlzLl9fZW5naW5lLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLCAwLCAxLCAwLjg1XSkpO1xuICAgIGNvbnN0IHpSaW5nTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHpSaW5nUHJpbWl0aXZlID0gUm90YXRpb25HaXptby5fX2NyZWF0ZVJpbmdQcmltaXRpdmUodGhpcy5fX2VuZ2luZSwgJ3onLCB6UmluZ01hdGVyaWFsKTtcbiAgICB6UmluZ01lc2guYWRkUHJpbWl0aXZlKHpSaW5nUHJpbWl0aXZlKTtcbiAgICB6UmluZ0VudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh6UmluZ01lc2gpO1xuXG4gICAgLy8gR3JvdXAgZW50aXR5XG4gICAgY29uc3QgZ3JvdXBFbnRpdHkgPSBjcmVhdGVHcm91cEVudGl0eSh0aGlzLl9fZW5naW5lKTtcblxuICAgIHJldHVybiB7XG4gICAgICBncm91cEVudGl0eSxcbiAgICAgIHhSaW5nRW50aXR5LFxuICAgICAgeVJpbmdFbnRpdHksXG4gICAgICB6UmluZ0VudGl0eSxcbiAgICAgIHhSaW5nTWVzaCxcbiAgICAgIHlSaW5nTWVzaCxcbiAgICAgIHpSaW5nTWVzaCxcbiAgICAgIHhSaW5nTWF0ZXJpYWwsXG4gICAgICB5UmluZ01hdGVyaWFsLFxuICAgICAgelJpbmdNYXRlcmlhbCxcbiAgICAgIHhSaW5nUHJpbWl0aXZlLFxuICAgICAgeVJpbmdQcmltaXRpdmUsXG4gICAgICB6UmluZ1ByaW1pdGl2ZSxcbiAgICB9O1xuICB9XG5cbiAgX3VwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAoIUlzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2cgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKSE7XG4gICAgY29uc3QgYWFiYiA9IHNnLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICAvLyBHaXptbyBlbnRpdGllcyBhcmUgYXR0YWNoZWQgd2l0aCB0b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gdHJ1ZSxcbiAgICAvLyBzbyBsb2NhbCB2YWx1ZXMgYXJlIHdvcmxkIHZhbHVlcyBoZXJlLlxuICAgIGNvbnN0IHdvcmxkUG9zaXRpb24gPSBhYWJiLmlzVmFuaWxsYSgpID8gc2cucG9zaXRpb24gOiBhYWJiLmNlbnRlclBvaW50O1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhO1xuICAgIHRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uID0gd29ybGRQb3NpdGlvbjtcblxuICAgIC8vIEtlZXAgdGhlIGdpem1vIGF0IGEgY29uc3RhbnQgc2l6ZSBvbiBzY3JlZW4gcmVnYXJkbGVzcyBvZiB0aGUgdGFyZ2V0IHNpemUuXG4gICAgY29uc3QgdW5pZm9ybSA9IEdpem1vLl9fY2FsY1NjcmVlblNwYWNlU2NhbGUodGhpcy5fX2VuZ2luZSwgd29ybGRQb3NpdGlvbiwgUm90YXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW8pO1xuICAgIHRyYW5zZm9ybS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTModW5pZm9ybSwgdW5pZm9ybSwgdW5pZm9ybSk7XG4gICAgLy8gUmVmbGVjdCB0aGUgbmV3IHNjYWxlIGluIHRoZSBzYW1lIGZyYW1lLiBUaGUgUmVuZGVyIHN0YWdlIHVwbG9hZHMgdGhlIGluc3RhbmNlIGRhdGFcbiAgICAvLyBiZWZvcmUgdGhlIG1hdHJpY2VzIHdvdWxkIGJlIHJlY2FsY3VsYXRlZCBsYXppbHksIHNvIG1hdGVyaWFsaXplIHRoZW0gbm93LlxuICAgIHRoaXMuX191cGRhdGVXb3JsZE1hdHJpY2VzT2ZTdWJ0cmVlKCk7XG5cbiAgICBpZiAodGhpcy5fX2lzUG9pbnRlckRvd24gJiYgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgIT09ICdub25lJykge1xuICAgICAgaWYgKHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPT09IHRoaXMuX190YXJnZXQpIHtcbiAgICAgICAgdGhpcy5fX3RhcmdldC5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tQ29weVF1YXRlcm5pb24odGhpcy5fX2RlbHRhUXVhdGVybmlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpKSB7XG4gICAgICB0aGlzLl9fdG9wRW50aXR5Ll9kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHJpdmF0ZSBoZWxwZXJzXG4gIC8vL1xuICAvLy9cblxuICBwcml2YXRlIF9fYXR0YWNoU2hhcmVkR3JvdXAoKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIUlzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpIHx8ICFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdG9wU2NlbmVHcmFwaCA9IHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKTtcbiAgICBjb25zdCBncm91cFNjZW5lR3JhcGggPSByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgIHRvcFNjZW5lR3JhcGguYWRkQ2hpbGQoZ3JvdXBTY2VuZUdyYXBoKTtcbiAgICBncm91cFNjZW5lR3JhcGguYWRkQ2hpbGQocmVzb3VyY2VzLnhSaW5nRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgZ3JvdXBTY2VuZUdyYXBoLmFkZENoaWxkKHJlc291cmNlcy55UmluZ0VudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgIGdyb3VwU2NlbmVHcmFwaC5hZGRDaGlsZChyZXNvdXJjZXMuelJpbmdFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseVNwYWNlVG9Hcm91cCgpIHtcbiAgICBjb25zdCByZXNvdXJjZXMgPSBSb3RhdGlvbkdpem1vLl9fZ2V0UmVzb3VyY2VzKHRoaXMuX19lbmdpbmUpO1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFJvdGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ2xvY2FsJykge1xuICAgICAgY29uc3QgcXVhdGVybmlvbiA9IFJvdGF0aW9uR2l6bW8uX190bXBRdWF0ZXJuaW9uXzA7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgICBpZiAoSXMuZXhpc3QocGFyZW50KSkge1xuICAgICAgICBwYXJlbnQuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8ocXVhdGVybmlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gICAgICB9XG4gICAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbiA9IHF1YXRlcm5pb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gUm90YXRpb25HaXptby5fX3RtcFF1YXRlcm5pb25fMC5pZGVudGl0eSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19vblBvaW50ZXJEb3duKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgdGhpcy5fX2lzUG9pbnRlckRvd24gPSB0cnVlO1xuICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcG9pbnRlclByZXYuc2V0Q29tcG9uZW50cygwLCAwKTtcbiAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDAsIDApO1xuICAgIHRoaXMuX19kcmFnU2NhbGUgPSAwO1xuICAgIHRoaXMuX19hY2N1bXVsYXRlZEFuZ2xlID0gMDtcbiAgICB0aGlzLl9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbi5zZXRDb21wb25lbnRzKDAsIDAsIDApO1xuXG4gICAgY29uc3QgeyB4UmVzdWx0LCB5UmVzdWx0LCB6UmVzdWx0IH0gPSBSb3RhdGlvbkdpem1vLl9fY2FzdFJheSh0aGlzLl9fZW5naW5lLCBldnQsIHRydWUpO1xuICAgIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gJ25vbmUnO1xuXG4gICAgY29uc3QgcGlja2VkID0gUm90YXRpb25HaXptby5fX3NlbGVjdENsb3Nlc3RBeGlzKFtcbiAgICAgIHsgYXhpczogJ3gnLCByZXN1bHQ6IHhSZXN1bHQgfSxcbiAgICAgIHsgYXhpczogJ3knLCByZXN1bHQ6IHlSZXN1bHQgfSxcbiAgICAgIHsgYXhpczogJ3onLCByZXN1bHQ6IHpSZXN1bHQgfSxcbiAgICBdKTtcblxuICAgIGlmIChwaWNrZWQpIHtcbiAgICAgIGFzc2VydEV4aXN0KHBpY2tlZC5yZXN1bHQuZGF0YSk7XG4gICAgICB0aGlzLl9fc3RhcnRWZWN0b3IgPSBWZWN0b3IzLm5vcm1hbGl6ZShSb3RhdGlvbkdpem1vLl9fcHJvamVjdFRvUGxhbmUocGlja2VkLnJlc3VsdC5kYXRhLnBvc2l0aW9uLCBwaWNrZWQuYXhpcykpO1xuICAgICAgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPSBwaWNrZWQuYXhpcztcbiAgICB9XG5cbiAgICBpZiAoUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPT09ICdub25lJykge1xuICAgICAgdGhpcy5fX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPbmx5IHByZXZlbnQgZGVmYXVsdCBhZnRlciBjb25maXJtaW5nIGFuIGF4aXMgd2FzIHBpY2tlZFxuICAgIC8vIFRoaXMgYWxsb3dzIGNhbWVyYSBjb250cm9sbGVyIHRvIGhhbmRsZSBldmVudHMgd2hlbiBnaXptbyBpcyBub3QgYmVpbmcgdXNlZFxuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuX19kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbik7XG4gICAgdGhpcy5fX2RlbHRhUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCk7XG4gICAgdGhpcy5fX3ByZXBhcmVMaW5lYXJEcmFnTWFwcGluZyhldnQsIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzKTtcbiAgfVxuXG4gIHByaXZhdGUgX19vblBvaW50ZXJNb3ZlKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKElzLmZhbHNlKHRoaXMuX19pc1BvaW50ZXJEb3duKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZUF4aXMgPSBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcztcbiAgICBpZiAoYWN0aXZlQXhpcyA9PT0gJ25vbmUnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX2hhbmRsZUxpbmVhckRyYWcoZXZ0KTtcbiAgfVxuXG4gIHByaXZhdGUgX19vblBvaW50ZXJVcChldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPSAnbm9uZSc7XG4gICAgdGhpcy5fX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCgpO1xuICAgIHRoaXMuX19zdGFydFZlY3RvciA9IFZlY3RvcjMuemVybygpO1xuICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbik7XG4gICAgdGhpcy5fX2RlbHRhUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCk7XG4gICAgdGhpcy5fX2FjdGl2ZVBvaW50ZXJFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19wb2ludGVyUHJldi5zZXRDb21wb25lbnRzKDAsIDApO1xuICAgIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnNldENvbXBvbmVudHMoMCwgMCk7XG4gICAgdGhpcy5fX3JvdGF0aW9uQXhpc0ZvclF1YXRlcm5pb24uc2V0Q29tcG9uZW50cygwLCAwLCAwKTtcbiAgICB0aGlzLl9fZHJhZ1NjYWxlID0gMDtcbiAgICB0aGlzLl9fYWNjdW11bGF0ZWRBbmdsZSA9IDA7XG4gIH1cblxuICBwcml2YXRlIF9fcHJlcGFyZUxpbmVhckRyYWdNYXBwaW5nKGV2dDogUG9pbnRlckV2ZW50LCBheGlzOiBBeGlzKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnNldENvbXBvbmVudHMoMCwgMCk7XG5cbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fX3Jlc29sdmVQb2ludGVyRWxlbWVudChldnQpO1xuICAgIGxldCB3aWR0aCA9IDE7XG4gICAgbGV0IGhlaWdodCA9IDE7XG4gICAgbGV0IHBvaW50ZXJYID0gMDtcbiAgICBsZXQgcG9pbnRlclkgPSAwO1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBjb25zdCByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHdpZHRoID0gcmVjdC53aWR0aCB8fCBlbGVtZW50LmNsaWVudFdpZHRoIHx8IDE7XG4gICAgICBoZWlnaHQgPSByZWN0LmhlaWdodCB8fCBlbGVtZW50LmNsaWVudEhlaWdodCB8fCAxO1xuICAgICAgcG9pbnRlclggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgIHBvaW50ZXJZID0gZXZ0LmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLl9fcG9pbnRlclByZXYuc2V0Q29tcG9uZW50cyhwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIHRoaXMuX19kcmFnU2NhbGUgPSAoMiAqIE1hdGguUEkpIC8gTWF0aC5tYXgod2lkdGgsIGhlaWdodCwgMSk7XG4gICAgdGhpcy5fX2FjY3VtdWxhdGVkQW5nbGUgPSAwO1xuXG4gICAgY29uc3QgYXhpc0ZvclF1YXQgPSB0aGlzLl9fZ2V0QXhpc0ZvclF1YXRlcm5pb24oYXhpcyk7XG4gICAgVmVjdG9yMy5ub3JtYWxpemVUbyhheGlzRm9yUXVhdCwgdGhpcy5fX3JvdGF0aW9uQXhpc0ZvclF1YXRlcm5pb24pO1xuXG4gICAgY29uc3QgYWN0aXZlQ2FtZXJhID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KHRoaXMuX19lbmdpbmUpXG4gICAgKSBhcyBDYW1lcmFDb21wb25lbnQgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgZ3JvdXBTY2VuZUdyYXBoID0gcmVzb3VyY2VzLmdyb3VwRW50aXR5Py5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCFlbGVtZW50IHx8ICFhY3RpdmVDYW1lcmEgfHwgIWdyb3VwU2NlbmVHcmFwaCkge1xuICAgICAgdGhpcy5fX3NldERlZmF1bHREcmFnRGlyZWN0aW9uKGF4aXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGF4aXNMb2NhbCA9IFJvdGF0aW9uR2l6bW8uX19nZXRBeGlzVmVjdG9yKGF4aXMpO1xuICAgIGNvbnN0IHRhbmdlbnRMb2NhbCA9IFZlY3RvcjMuY3Jvc3NUbyh0aGlzLl9fc3RhcnRWZWN0b3IsIGF4aXNMb2NhbCwgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfOCk7XG4gICAgaWYgKHRhbmdlbnRMb2NhbC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgdGhpcy5fX3NldEZhbGxiYWNrTG9jYWxUYW5nZW50KGF4aXMsIHRhbmdlbnRMb2NhbCk7XG4gICAgfVxuICAgIFZlY3RvcjMubm9ybWFsaXplVG8odGFuZ2VudExvY2FsLCB0YW5nZW50TG9jYWwpO1xuXG4gICAgY29uc3QgdGFuZ2VudFdvcmxkID0gdGhpcy5fX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsKHRhbmdlbnRMb2NhbCwgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfOSk7XG4gICAgaWYgKHRhbmdlbnRXb3JsZC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgdGhpcy5fX3NldEZhbGxiYWNrV29ybGREaXJlY3Rpb24oYXhpc0xvY2FsLCBhY3RpdmVDYW1lcmEsIHRhbmdlbnRXb3JsZCk7XG4gICAgfVxuICAgIGlmICh0YW5nZW50V29ybGQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIHRoaXMuX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbihheGlzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgVmVjdG9yMy5ub3JtYWxpemVUbyh0YW5nZW50V29ybGQsIHRhbmdlbnRXb3JsZCk7XG5cbiAgICBjb25zdCBjZW50ZXJXb3JsZCA9IGdyb3VwU2NlbmVHcmFwaC5tYXRyaXhJbm5lci5nZXRUcmFuc2xhdGVUbyhSb3RhdGlvbkdpem1vLl9fdG1wVmVjdG9yM183KTtcbiAgICBjb25zdCBwdk1hdHJpeCA9IE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKFxuICAgICAgYWN0aXZlQ2FtZXJhLnByb2plY3Rpb25NYXRyaXgsXG4gICAgICBhY3RpdmVDYW1lcmEudmlld01hdHJpeCxcbiAgICAgIFJvdGF0aW9uR2l6bW8uX190bXBNYXRyaXg0NF8yXG4gICAgKTtcblxuICAgIGNvbnN0IGNsaXBDZW50ZXIgPSBwdk1hdHJpeC5tdWx0aXBseVZlY3RvclRvKFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfMC5zZXRDb21wb25lbnRzKGNlbnRlcldvcmxkLngsIGNlbnRlcldvcmxkLnksIGNlbnRlcldvcmxkLnosIDEpLFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfMlxuICAgICk7XG4gICAgY29uc3QgY2xpcFRhbmdlbnQgPSBwdk1hdHJpeC5tdWx0aXBseVZlY3RvclRvKFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfMS5zZXRDb21wb25lbnRzKFxuICAgICAgICBjZW50ZXJXb3JsZC54ICsgdGFuZ2VudFdvcmxkLngsXG4gICAgICAgIGNlbnRlcldvcmxkLnkgKyB0YW5nZW50V29ybGQueSxcbiAgICAgICAgY2VudGVyV29ybGQueiArIHRhbmdlbnRXb3JsZC56LFxuICAgICAgICAxXG4gICAgICApLFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfM1xuICAgICk7XG5cbiAgICBjb25zdCB3MCA9IGNsaXBDZW50ZXIudztcbiAgICBjb25zdCB3MSA9IGNsaXBUYW5nZW50Lnc7XG4gICAgaWYgKHcwID09PSAwIHx8IHcxID09PSAwKSB7XG4gICAgICB0aGlzLl9fc2V0RGVmYXVsdERyYWdEaXJlY3Rpb24oYXhpcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmRjQ2VudGVyWCA9IGNsaXBDZW50ZXIueCAvIHcwO1xuICAgIGNvbnN0IG5kY0NlbnRlclkgPSBjbGlwQ2VudGVyLnkgLyB3MDtcbiAgICBjb25zdCBuZGNUYW5nZW50WCA9IGNsaXBUYW5nZW50LnggLyB3MTtcbiAgICBjb25zdCBuZGNUYW5nZW50WSA9IGNsaXBUYW5nZW50LnkgLyB3MTtcblxuICAgIGNvbnN0IHNjcmVlblRhbmdlbnRYID0gKG5kY1RhbmdlbnRYIC0gbmRjQ2VudGVyWCkgKiB3aWR0aCAqIDAuNTtcbiAgICBjb25zdCBzY3JlZW5UYW5nZW50WSA9IC0obmRjVGFuZ2VudFkgLSBuZGNDZW50ZXJZKSAqIGhlaWdodCAqIDAuNTtcbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHNjcmVlblRhbmdlbnRYLCBzY3JlZW5UYW5nZW50WSk7XG4gICAgaWYgKGxlbmd0aCA8IDFlLTUpIHtcbiAgICAgIHRoaXMuX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbihheGlzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKHNjcmVlblRhbmdlbnRYIC8gbGVuZ3RoLCBzY3JlZW5UYW5nZW50WSAvIGxlbmd0aCk7XG4gIH1cblxuICBwcml2YXRlIF9fc2V0RGVmYXVsdERyYWdEaXJlY3Rpb24oYXhpczogQXhpcykge1xuICAgIGlmIChheGlzID09PSAneCcpIHtcbiAgICAgIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnNldENvbXBvbmVudHMoMCwgLTEpO1xuICAgIH0gZWxzZSBpZiAoYXhpcyA9PT0gJ3knKSB7XG4gICAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDEsIDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDEsIDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19zZXRGYWxsYmFja0xvY2FsVGFuZ2VudChheGlzOiBBeGlzLCBvdXQ6IE11dGFibGVWZWN0b3IzKSB7XG4gICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMCwgMCwgMSk7XG4gICAgfSBlbHNlIGlmIChheGlzID09PSAneScpIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKDAsIDAsIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQuc2V0Q29tcG9uZW50cygwLCAxLCAwKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fc2V0RmFsbGJhY2tXb3JsZERpcmVjdGlvbihheGlzTG9jYWw6IFZlY3RvcjMsIGNhbWVyYTogQ2FtZXJhQ29tcG9uZW50LCBvdXQ6IE11dGFibGVWZWN0b3IzKSB7XG4gICAgY29uc3QgYXhpc1dvcmxkID0gdGhpcy5fX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsKGF4aXNMb2NhbCwgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfNik7XG4gICAgaWYgKGF4aXNXb3JsZC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMSwgMCwgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFZlY3RvcjMubm9ybWFsaXplVG8oYXhpc1dvcmxkLCBheGlzV29ybGQpO1xuXG4gICAgVmVjdG9yMy5jcm9zc1RvKGF4aXNXb3JsZCwgY2FtZXJhLmRpcmVjdGlvbklubmVyLCBvdXQpO1xuICAgIGlmIChvdXQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIFZlY3RvcjMuY3Jvc3NUbyhjYW1lcmEudXBJbm5lciwgYXhpc1dvcmxkLCBvdXQpO1xuICAgIH1cbiAgICBpZiAob3V0Lmxlbmd0aFNxdWFyZWQoKSA8IDFlLTEwKSB7XG4gICAgICB0aGlzLl9fY2hvb3NlQW55UGVycGVuZGljdWxhcihheGlzV29ybGQsIG91dCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2Nob29zZUFueVBlcnBlbmRpY3VsYXIoYXhpczogSVZlY3RvcjMsIG91dDogTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBpZiAoTWF0aC5hYnMoYXhpcy54KSA8IDAuOSkge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMCwgLWF4aXMueiwgYXhpcy55KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoLWF4aXMueSwgYXhpcy54LCAwKTtcbiAgICB9XG4gICAgaWYgKG91dC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMSwgMCwgMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2hhbmRsZUxpbmVhckRyYWcoZXZ0OiBQb2ludGVyRXZlbnQpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fX2FjdGl2ZVBvaW50ZXJFbGVtZW50O1xuICAgIGlmICghZWxlbWVudCB8fCB0aGlzLl9fZHJhZ1NjYWxlID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKHJlY3Qud2lkdGggPT09IDAgfHwgcmVjdC5oZWlnaHQgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50WCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IGN1cnJlbnRZID0gZXZ0LmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBjb25zdCBkZWx0YVggPSBjdXJyZW50WCAtIHRoaXMuX19wb2ludGVyUHJldi54O1xuICAgIGNvbnN0IGRlbHRhWSA9IGN1cnJlbnRZIC0gdGhpcy5fX3BvaW50ZXJQcmV2Lnk7XG4gICAgdGhpcy5fX3BvaW50ZXJQcmV2LnNldENvbXBvbmVudHMoY3VycmVudFgsIGN1cnJlbnRZKTtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShkZWx0YVgpIHx8ICFOdW1iZXIuaXNGaW5pdGUoZGVsdGFZKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZGVsdGFYID09PSAwICYmIGRlbHRhWSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNjYWxhciA9IC1kZWx0YVggKiB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi54IC0gZGVsdGFZICogdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24ueTtcbiAgICBpZiAoc2NhbGFyID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGVsdGFBbmdsZSA9IHNjYWxhciAqIHRoaXMuX19kcmFnU2NhbGU7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZGVsdGFBbmdsZSkgfHwgZGVsdGFBbmdsZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19hY2N1bXVsYXRlZEFuZ2xlICs9IGRlbHRhQW5nbGU7XG4gICAgY29uc3QgZGVsdGFRdWF0ID0gUXVhdGVybmlvbi5mcm9tQXhpc0FuZ2xlKHRoaXMuX19yb3RhdGlvbkF4aXNGb3JRdWF0ZXJuaW9uLCB0aGlzLl9fYWNjdW11bGF0ZWRBbmdsZSk7XG4gICAgdGhpcy5fX2RlbHRhUXVhdGVybmlvbiA9IFF1YXRlcm5pb24ubXVsdGlwbHkoZGVsdGFRdWF0LCB0aGlzLl9fdGFyZ2V0Um90YXRpb25CYWNrdXApO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsKHZlYzogSVZlY3RvcjMsIG91dDogTXV0YWJsZVZlY3RvcjMpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCBncm91cFNjZW5lR3JhcGggPSByZXNvdXJjZXM/Lmdyb3VwRW50aXR5Py5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCFncm91cFNjZW5lR3JhcGgpIHtcbiAgICAgIHJldHVybiBvdXQuc2V0Q29tcG9uZW50cyh2ZWMueCwgdmVjLnksIHZlYy56KTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRyaXggPSBncm91cFNjZW5lR3JhcGgubWF0cml4SW5uZXI7XG4gICAgY29uc3QgeCA9IHZlYy54O1xuICAgIGNvbnN0IHkgPSB2ZWMueTtcbiAgICBjb25zdCB6ID0gdmVjLno7XG5cbiAgICBjb25zdCB3b3JsZFggPSBtYXRyaXgubTAwICogeCArIG1hdHJpeC5tMDEgKiB5ICsgbWF0cml4Lm0wMiAqIHo7XG4gICAgY29uc3Qgd29ybGRZID0gbWF0cml4Lm0xMCAqIHggKyBtYXRyaXgubTExICogeSArIG1hdHJpeC5tMTIgKiB6O1xuICAgIGNvbnN0IHdvcmxkWiA9IG1hdHJpeC5tMjAgKiB4ICsgbWF0cml4Lm0yMSAqIHkgKyBtYXRyaXgubTIyICogejtcblxuICAgIHJldHVybiBvdXQuc2V0Q29tcG9uZW50cyh3b3JsZFgsIHdvcmxkWSwgd29ybGRaKTtcbiAgfVxuXG4gIHByaXZhdGUgX19yZXNvbHZlUG9pbnRlckVsZW1lbnQoZXZ0OiBQb2ludGVyRXZlbnQpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGVsZW1lbnQgPSBldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoIWVsZW1lbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgZWxlbWVudCA9IHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tID8/IG51bGw7XG4gICAgfVxuICAgIGlmICghZWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHByaXZhdGUgX19kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpIHtcbiAgICBpZiAodGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIElucHV0TWFuYWdlci5kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9fZW5hYmxlQ2FtZXJhQ29udHJvbGxlcklmTmVlZGVkKCkge1xuICAgIGlmICghdGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIElucHV0TWFuYWdlci5lbmFibGVDYW1lcmFDb250cm9sbGVyKCk7XG4gICAgdGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3Byb2plY3RUb1BsYW5lKHBvc2l0aW9uOiBJVmVjdG9yMywgYXhpczogQXhpcyk6IFZlY3RvcjMge1xuICAgIHN3aXRjaCAoYXhpcykge1xuICAgICAgY2FzZSAneCc6XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5MygwLCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KTtcbiAgICAgIGNhc2UgJ3knOlxuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgMCwgcG9zaXRpb24ueik7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2dldEF4aXNGb3JRdWF0ZXJuaW9uKGF4aXM6IEF4aXMpOiBWZWN0b3IzIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgaWYgKFJvdGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ2xvY2FsJyB8fCBJcy5ub3QuZXhpc3QocGFyZW50KSkge1xuICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX19nZXRBeGlzVmVjdG9yKGF4aXMpO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gcGFyZW50Lm1hdHJpeElubmVyLmdldFJvdGF0ZSgpO1xuICAgIGNvbnN0IHJvdE1hdCA9IE1hdHJpeDMzLmZyb21Db3B5OVJvd01ham9yKFxuICAgICAgd29ybGRNYXRyaXgubTAwLFxuICAgICAgd29ybGRNYXRyaXgubTAxLFxuICAgICAgd29ybGRNYXRyaXgubTAyLFxuICAgICAgd29ybGRNYXRyaXgubTEwLFxuICAgICAgd29ybGRNYXRyaXgubTExLFxuICAgICAgd29ybGRNYXRyaXgubTEyLFxuICAgICAgd29ybGRNYXRyaXgubTIwLFxuICAgICAgd29ybGRNYXRyaXgubTIxLFxuICAgICAgd29ybGRNYXRyaXgubTIyXG4gICAgKTtcbiAgICBjb25zdCBpbnZSb3QgPSBNYXRyaXgzMy50cmFuc3Bvc2Uocm90TWF0KSBhcyBNYXRyaXgzMztcbiAgICByZXR1cm4gaW52Um90Lm11bHRpcGx5VmVjdG9yKFJvdGF0aW9uR2l6bW8uX19nZXRBeGlzVmVjdG9yKGF4aXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0QXhpc1ZlY3RvcihheGlzOiBBeGlzKTogVmVjdG9yMyB7XG4gICAgc3dpdGNoIChheGlzKSB7XG4gICAgICBjYXNlICd4JzpcbiAgICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX191bml0WDtcbiAgICAgIGNhc2UgJ3knOlxuICAgICAgICByZXR1cm4gUm90YXRpb25HaXptby5fX3VuaXRZO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX191bml0WjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2Nhc3RSYXkoZW5naW5lOiBFbmdpbmUsIGV2dDogUG9pbnRlckV2ZW50LCBsb2NhbCA9IGZhbHNlKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyhlbmdpbmUpO1xuICAgIGNvbnN0IGVtcHR5OiBSYXljYXN0UmVzdWx0RXgxID0geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgaWYgKCFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybiB7IHhSZXN1bHQ6IGVtcHR5LCB5UmVzdWx0OiBlbXB0eSwgelJlc3VsdDogZW1wdHkgfTtcbiAgICB9XG5cbiAgICBjb25zdCByZWN0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHdpZHRoID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3QgeCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSByZWN0LmhlaWdodCAtIChldnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IFZlY3RvcjQuZnJvbUNvcHk0KDAsIDAsIHdpZHRoLCBoZWlnaHQpIGFzIFZlY3RvcjQ7XG4gICAgY29uc3QgYWN0aXZlQ2FtZXJhID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KENhbWVyYUNvbXBvbmVudCwgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKSkgYXNcbiAgICAgIHwgQ2FtZXJhQ29tcG9uZW50XG4gICAgICB8IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGNhc3RlciA9IGxvY2FsID8gUm90YXRpb25HaXptby5fX2Nhc3RGcm9tRW50aXRpZXNMb2NhbCA6IFJvdGF0aW9uR2l6bW8uX19jYXN0RnJvbUVudGl0aWVzO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoYWN0aXZlQ2FtZXJhKSkge1xuICAgICAgcmV0dXJuIHsgeFJlc3VsdDogZW1wdHksIHlSZXN1bHQ6IGVtcHR5LCB6UmVzdWx0OiBlbXB0eSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHhSZXN1bHQgPSBjYXN0ZXIoeCwgeSwgYWN0aXZlQ2FtZXJhLCB2aWV3cG9ydCwgcmVzb3VyY2VzLnhSaW5nRW50aXR5KTtcbiAgICBjb25zdCB5UmVzdWx0ID0gY2FzdGVyKHgsIHksIGFjdGl2ZUNhbWVyYSwgdmlld3BvcnQsIHJlc291cmNlcy55UmluZ0VudGl0eSk7XG4gICAgY29uc3QgelJlc3VsdCA9IGNhc3Rlcih4LCB5LCBhY3RpdmVDYW1lcmEsIHZpZXdwb3J0LCByZXNvdXJjZXMuelJpbmdFbnRpdHkpO1xuXG4gICAgcmV0dXJuIHsgeFJlc3VsdCwgeVJlc3VsdCwgelJlc3VsdCB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYXN0RnJvbUVudGl0aWVzKFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgY2FtZXJhOiBDYW1lcmFDb21wb25lbnQsXG4gICAgdmlld3BvcnQ6IFZlY3RvcjQsXG4gICAgLi4uZW50aXRpZXM6IEFycmF5PElNZXNoRW50aXR5IHwgdW5kZWZpbmVkPlxuICApOiBSYXljYXN0UmVzdWx0RXgxIHtcbiAgICBsZXQgY2xvc2VzdFJlc3VsdDogUmF5Y2FzdFJlc3VsdEV4MSA9IHsgcmVzdWx0OiBmYWxzZSB9O1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGVudGl0eSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBlbnRpdHkuZ2V0TWVzaCgpLmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBjYW1lcmEsIHZpZXdwb3J0LCAwLjApO1xuICAgICAgaWYgKCFyZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudERpc3RhbmNlID0gcmVzdWx0LmRhdGE/LnQgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgY29uc3QgY2xvc2VzdERpc3RhbmNlID0gY2xvc2VzdFJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGlmICghY2xvc2VzdFJlc3VsdC5yZXN1bHQgfHwgY3VycmVudERpc3RhbmNlIDwgY2xvc2VzdERpc3RhbmNlKSB7XG4gICAgICAgIGNsb3Nlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbG9zZXN0UmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYXN0RnJvbUVudGl0aWVzTG9jYWwoXG4gICAgeDogbnVtYmVyLFxuICAgIHk6IG51bWJlcixcbiAgICBjYW1lcmE6IENhbWVyYUNvbXBvbmVudCxcbiAgICB2aWV3cG9ydDogVmVjdG9yNCxcbiAgICAuLi5lbnRpdGllczogQXJyYXk8SU1lc2hFbnRpdHkgfCB1bmRlZmluZWQ+XG4gICk6IFJheWNhc3RSZXN1bHRFeDEge1xuICAgIGxldCBjbG9zZXN0UmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxID0geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3QoZW50aXR5KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGVudGl0eS5nZXRNZXNoKCkuY2FzdFJheUZyb21TY3JlZW5JbkxvY2FsKHgsIHksIGNhbWVyYSwgdmlld3BvcnQsIDAuMCk7XG4gICAgICBpZiAoIXJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50RGlzdGFuY2UgPSByZXN1bHQuZGF0YT8udCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgICBjb25zdCBjbG9zZXN0RGlzdGFuY2UgPSBjbG9zZXN0UmVzdWx0LmRhdGE/LnQgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgaWYgKCFjbG9zZXN0UmVzdWx0LnJlc3VsdCB8fCBjdXJyZW50RGlzdGFuY2UgPCBjbG9zZXN0RGlzdGFuY2UpIHtcbiAgICAgICAgY2xvc2VzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3RSZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVJpbmdQcmltaXRpdmUoZW5naW5lOiBFbmdpbmUsIGF4aXM6IEF4aXMsIG1hdGVyaWFsOiBNYXRlcmlhbCk6IFJpbmcge1xuICAgIGNvbnN0IHJhZGl1cyA9IFJvdGF0aW9uR2l6bW8uX19sZW5ndGg7XG4gICAgY29uc3QgcmluZyA9IG5ldyBSaW5nKGVuZ2luZSk7XG4gICAgcmluZy5nZW5lcmF0ZSh7XG4gICAgICByYWRpdXMsXG4gICAgICB0aGlja25lc3M6IHJhZGl1cyAqIDAuMSxcbiAgICAgIHNlZ21lbnRzOiA2NCxcbiAgICAgIGF4aXMsXG4gICAgICBtYXRlcmlhbCxcbiAgICB9KTtcbiAgICByZXR1cm4gcmluZztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc2VsZWN0Q2xvc2VzdEF4aXMoXG4gICAgY2FuZGlkYXRlczogQXJyYXk8eyBheGlzOiBBeGlzOyByZXN1bHQ6IFJheWNhc3RSZXN1bHRFeDEgfT5cbiAgKTogeyBheGlzOiBBeGlzOyByZXN1bHQ6IFJheWNhc3RSZXN1bHRFeDEgfSB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGNsb3Nlc3Q6IHsgYXhpczogQXhpczsgcmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxIH0gfCB1bmRlZmluZWQ7XG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgICAgaWYgKCFjYW5kaWRhdGUucmVzdWx0LnJlc3VsdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gY2FuZGlkYXRlLnJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGlmICghY2xvc2VzdCB8fCBkaXN0YW5jZSA8IChjbG9zZXN0LnJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkpIHtcbiAgICAgICAgY2xvc2VzdCA9IGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3Q7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVJpbmdNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgY29sb3I6IFZlY3RvcjQpOiBNYXRlcmlhbCB7XG4gICAgY29uc3QgbWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKGVuZ2luZSk7XG4gICAgbWF0ZXJpYWwuYWxwaGFNb2RlID0gQWxwaGFNb2RlLkJsZW5kO1xuICAgIG1hdGVyaWFsLmN1bGxGYWNlID0gZmFsc2U7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBjb2xvcik7XG4gICAgcmV0dXJuIG1hdGVyaWFsO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBhbGwgc3RhdGljIHJlc291cmNlcyBmb3IgYSBzcGVjaWZpYyBFbmdpbmUuXG4gICAqIFRoaXMgcmVtb3ZlcyB0aGUgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgZW5naW5lIGZyb20gdGhlIG1hcC5cbiAgICogQGludGVybmFsIENhbGxlZCBmcm9tIEVuZ2luZS5kZXN0cm95KClcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIFJvdGF0aW9uR2l6bW8uX19yZXNvdXJjZXNNYXAuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gJ25vbmUnO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsWUFBWTtBQUdyQixTQUFTLGlDQUFpQztBQUcxQyxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsVUFBVTtBQUNuQixTQUFTLG1CQUFtQjtBQUU1QixTQUFTLFVBQVUscUNBQXFDLG9CQUFvQjtBQUM1RSxTQUFTLGFBQWE7QUErQmYsSUFBTSxpQkFBTixNQUFNLHVCQUFzQixNQUFNO0FBQUEsRUFBbEM7QUFBQTtBQWdDTCxTQUFRLGtCQUFrQjtBQUMxQixTQUFRLGdCQUFnQixRQUFRLEtBQUs7QUFDckMsU0FBUSxvQkFBb0IsV0FBVyxTQUFTO0FBQ2hELFNBQVEseUJBQXlCLFdBQVcsU0FBUztBQUVyRCxTQUFRLHNCQUFzQixLQUFLLGdCQUFnQixLQUFLLElBQUk7QUFDNUQsU0FBUSxzQkFBc0IsS0FBSyxnQkFBZ0IsS0FBSyxJQUFJO0FBQzVELFNBQVEsb0JBQW9CLEtBQUssY0FBYyxLQUFLLElBQUk7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
