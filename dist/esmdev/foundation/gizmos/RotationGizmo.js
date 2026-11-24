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
    this.Im = false;
    this.Vm = Vector3.zero();
    this.Om = Quaternion.identity();
    this.Km = Quaternion.identity();
    this.pn = this.qn.bind(this);
    this.rn = this.sn.bind(this);
    this.$m = this.tn.bind(this);
    this.Pm = false;
    this.Jm = MutableVector2.zero();
    this.Gm = MutableVector2.zero();
    this.Qm = MutableVector3.zero();
    this.Lm = 0;
    this.Mm = 0;
  }
  /**
   * Gets the resources for a specific engine, or undefined if not initialized.
   */
  static Hm(engine) {
    return _RotationGizmo.Sm.get(engine.objectUID);
  }
  ///
  ///
  /// Accessors
  ///
  ///
  get isSetup() {
    return Is.exist(this.im);
  }
  /**
   * Sets the ring radius of the gizmo.
   * @param val - The ring radius value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value only affects the geometry generated
   * before the gizmo resources are created.
   */
  set length(val) {
    _RotationGizmo.Dm = val;
  }
  /**
   * Gets the ring radius of the gizmo.
   * @returns The ring radius value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value only affects the geometry generated
   * before the gizmo resources are created.
   */
  get length() {
    return _RotationGizmo.Dm;
  }
  /**
   * Sets the gizmo size as a fraction of the viewport height.
   * The unit ring radius is projected to this fraction of the viewport height.
   * @param val - The ratio of the viewport height (for example, 0.08 for 8%)
   */
  set screenSpaceRatio(val) {
    _RotationGizmo.Um = val;
  }
  /**
   * Gets the gizmo size as a fraction of the viewport height.
   * @returns The ratio of the viewport height occupied by the gizmo's unit ring radius
   */
  get screenSpaceRatio() {
    return _RotationGizmo.Um;
  }
  get isVisible() {
    return this.om;
  }
  set isVisible(flg) {
    const resources = _RotationGizmo.Hm(this.c);
    if (!resources) {
      return;
    }
    if (this.om === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(this.c.config.eventTargetDom)) {
        eventTargetDom = this.c.config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_ROTATION, [
        {
          eventName: getEvent("start"),
          handler: this.pn,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: getEvent("move"),
          handler: this.rn,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: getEvent("end"),
          handler: this.$m,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "pointerleave",
          handler: this.$m,
          options: {},
          classInstance: this,
          eventTargetDom
        }
      ]);
      this.Wm = this.jm;
      this.an();
      this.bn();
    }
    if (this.om === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_ROTATION);
      this.Im = false;
      _RotationGizmo.Fm = "none";
    }
    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_ROTATION, flg);
    this.pm(flg);
  }
  setSpace(space) {
    _RotationGizmo.Tm = space;
    if (this.om) {
      this.bn();
    }
  }
  ///
  ///
  /// Public Methods
  ///
  ///
  _setup() {
    if (this.km()) {
      return;
    }
    const targetSceneGraph = this.jm.getSceneGraph();
    if (!targetSceneGraph) {
      return;
    }
    this.im = createGroupEntity(this.c);
    this.im.tryToSetUniqueName(`RotationGizmo_of_${this.jm.uniqueName}`, true);
    this.im.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.im.getSceneGraph());
    let resources = _RotationGizmo.Hm(this.c);
    if (!resources) {
      resources = this.un();
      _RotationGizmo.Sm.set(this.c.objectUID, resources);
    }
    this.an();
    this.Wm = this.jm;
    this.setGizmoTag();
    this.im.tryToSetTag({ tag: "Gizmo", value: "Rotation" });
    this._update();
  }
  /**
   * Creates all resources needed for the gizmo.
   */
  un() {
    const xRingEntity = createMeshEntity(this.c);
    xRingEntity.tryToSetUniqueName("RotationGizmo_xRing", true);
    const xRingMaterial = _RotationGizmo.Xm(this.c, Vector4.fromCopyArray4([1, 0, 0, 0.85]));
    const xRingMesh = new Mesh(this.c);
    const xRingPrimitive = _RotationGizmo.Ym(this.c, "x", xRingMaterial);
    xRingMesh.addPrimitive(xRingPrimitive);
    xRingEntity.getMesh().setMesh(xRingMesh);
    const yRingEntity = createMeshEntity(this.c);
    yRingEntity.tryToSetUniqueName("RotationGizmo_yRing", true);
    const yRingMaterial = _RotationGizmo.Xm(this.c, Vector4.fromCopyArray4([0, 1, 0, 0.85]));
    const yRingMesh = new Mesh(this.c);
    const yRingPrimitive = _RotationGizmo.Ym(this.c, "y", yRingMaterial);
    yRingMesh.addPrimitive(yRingPrimitive);
    yRingEntity.getMesh().setMesh(yRingMesh);
    const zRingEntity = createMeshEntity(this.c);
    zRingEntity.tryToSetUniqueName("RotationGizmo_zRing", true);
    const zRingMaterial = _RotationGizmo.Xm(this.c, Vector4.fromCopyArray4([0, 0, 1, 0.85]));
    const zRingMesh = new Mesh(this.c);
    const zRingPrimitive = _RotationGizmo.Ym(this.c, "z", zRingMaterial);
    zRingMesh.addPrimitive(zRingPrimitive);
    zRingEntity.getMesh().setMesh(zRingMesh);
    const groupEntity = createGroupEntity(this.c);
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
    if (!Is.exist(this.im)) {
      return;
    }
    const sg = this.jm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    const worldPosition = aabb.isVanilla() ? sg.position : aabb.centerPoint;
    const transform = this.im.getTransform();
    transform.localPosition = worldPosition;
    const uniform = Gizmo.rm(this.c, worldPosition, _RotationGizmo.Um);
    transform.localScale = Vector3.fromCopy3(uniform, uniform, uniform);
    this.qm();
    if (this.Im && _RotationGizmo.Fm !== "none") {
      if (this.Wm === this.jm) {
        this.jm.getTransform().localRotation = Quaternion.fromCopyQuaternion(this.Om);
      }
    }
  }
  _destroy() {
    if (Is.exist(this.im)) {
      this.im._destroy();
    }
  }
  ///
  ///
  /// Private helpers
  ///
  ///
  an() {
    const resources = _RotationGizmo.Hm(this.c);
    if (!Is.exist(this.im) || !resources) {
      return;
    }
    const topSceneGraph = this.im.getSceneGraph();
    const groupSceneGraph = resources.groupEntity.getSceneGraph();
    topSceneGraph.addChild(groupSceneGraph);
    groupSceneGraph.addChild(resources.xRingEntity.getSceneGraph());
    groupSceneGraph.addChild(resources.yRingEntity.getSceneGraph());
    groupSceneGraph.addChild(resources.zRingEntity.getSceneGraph());
  }
  bn() {
    const resources = _RotationGizmo.Hm(this.c);
    if (!resources) {
      return;
    }
    if (_RotationGizmo.Tm === "local") {
      const quaternion = _RotationGizmo._m;
      const parent = this.jm.getSceneGraph().parent;
      if (Is.exist(parent)) {
        parent.getQuaternionRecursivelyTo(quaternion);
      } else {
        quaternion.identity();
      }
      resources.groupEntity.getTransform().localRotation = quaternion;
    } else {
      resources.groupEntity.getTransform().localRotation = _RotationGizmo._m.identity();
    }
  }
  qn(evt) {
    this.Im = true;
    this.Nm = void 0;
    this.Jm.setComponents(0, 0);
    this.Gm.setComponents(0, 0);
    this.Lm = 0;
    this.Mm = 0;
    this.Qm.setComponents(0, 0, 0);
    const { xResult, yResult, zResult } = _RotationGizmo.vn(this.c, evt, true);
    _RotationGizmo.Fm = "none";
    const picked = _RotationGizmo.wn([
      { axis: "x", result: xResult },
      { axis: "y", result: yResult },
      { axis: "z", result: zResult }
    ]);
    if (picked) {
      assertExist(picked.result.data);
      this.Vm = Vector3.normalize(_RotationGizmo.xn(picked.result.data.position, picked.axis));
      _RotationGizmo.Fm = picked.axis;
    }
    if (_RotationGizmo.Fm === "none") {
      this.Im = false;
      return;
    }
    evt.preventDefault();
    this.yn();
    this.Km = Quaternion.fromCopyQuaternion(this.jm.getTransform().localRotation);
    this.Om = Quaternion.fromCopyQuaternion(this.Km);
    this.zn(evt, _RotationGizmo.Fm);
  }
  sn(evt) {
    evt.preventDefault();
    if (Is.false(this.Im)) {
      return;
    }
    const activeAxis = _RotationGizmo.Fm;
    if (activeAxis === "none") {
      return;
    }
    this.An(evt);
  }
  tn(evt) {
    evt.preventDefault();
    this.Im = false;
    _RotationGizmo.Fm = "none";
    this.Bn();
    this.Vm = Vector3.zero();
    this.Km = Quaternion.fromCopyQuaternion(this.jm.getTransform().localRotation);
    this.Om = Quaternion.fromCopyQuaternion(this.Km);
    this.Nm = void 0;
    this.Jm.setComponents(0, 0);
    this.Gm.setComponents(0, 0);
    this.Qm.setComponents(0, 0, 0);
    this.Lm = 0;
    this.Mm = 0;
  }
  zn(evt, axis) {
    var _a;
    const resources = _RotationGizmo.Hm(this.c);
    if (!resources) {
      return;
    }
    this.Gm.setComponents(0, 0);
    const element = this.Cn(evt);
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
      this.Nm = element;
    } else {
      this.Nm = void 0;
    }
    this.Jm.setComponents(pointerX, pointerY);
    this.Lm = 2 * Math.PI / Math.max(width, height, 1);
    this.Mm = 0;
    const axisForQuat = this.Dn(axis);
    Vector3.normalizeTo(axisForQuat, this.Qm);
    const activeCamera = this.c.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.c)
    );
    const groupSceneGraph = (_a = resources.groupEntity) == null ? void 0 : _a.getSceneGraph();
    if (!element || !activeCamera || !groupSceneGraph) {
      this.Rm(axis);
      return;
    }
    const axisLocal = _RotationGizmo.Zm(axis);
    const tangentLocal = Vector3.crossTo(this.Vm, axisLocal, _RotationGizmo.nn);
    if (tangentLocal.lengthSquared() < 1e-10) {
      this.En(axis, tangentLocal);
    }
    Vector3.normalizeTo(tangentLocal, tangentLocal);
    const tangentWorld = this.cn(tangentLocal, _RotationGizmo.on);
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.Fn(axisLocal, activeCamera, tangentWorld);
    }
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.Rm(axis);
      return;
    }
    Vector3.normalizeTo(tangentWorld, tangentWorld);
    const centerWorld = groupSceneGraph.matrixInner.getTranslateTo(_RotationGizmo.mn);
    const pvMatrix = MutableMatrix44.multiplyTo(
      activeCamera.projectionMatrix,
      activeCamera.viewMatrix,
      _RotationGizmo.fn
    );
    const clipCenter = pvMatrix.multiplyVectorTo(
      _RotationGizmo.gn.setComponents(centerWorld.x, centerWorld.y, centerWorld.z, 1),
      _RotationGizmo.jn
    );
    const clipTangent = pvMatrix.multiplyVectorTo(
      _RotationGizmo.hn.setComponents(
        centerWorld.x + tangentWorld.x,
        centerWorld.y + tangentWorld.y,
        centerWorld.z + tangentWorld.z,
        1
      ),
      _RotationGizmo.kn
    );
    const w0 = clipCenter.w;
    const w1 = clipTangent.w;
    if (w0 === 0 || w1 === 0) {
      this.Rm(axis);
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
      this.Rm(axis);
      return;
    }
    this.Gm.setComponents(screenTangentX / length, screenTangentY / length);
  }
  Rm(axis) {
    if (axis === "x") {
      this.Gm.setComponents(0, -1);
    } else if (axis === "y") {
      this.Gm.setComponents(1, 0);
    } else {
      this.Gm.setComponents(1, 0);
    }
  }
  En(axis, out) {
    if (axis === "x") {
      out.setComponents(0, 0, 1);
    } else if (axis === "y") {
      out.setComponents(0, 0, 1);
    } else {
      out.setComponents(0, 1, 0);
    }
  }
  Fn(axisLocal, camera, out) {
    const axisWorld = this.cn(axisLocal, _RotationGizmo.ln);
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
      this.Gn(axisWorld, out);
    }
  }
  Gn(axis, out) {
    if (Math.abs(axis.x) < 0.9) {
      out.setComponents(0, -axis.z, axis.y);
    } else {
      out.setComponents(-axis.y, axis.x, 0);
    }
    if (out.lengthSquared() < 1e-10) {
      out.setComponents(1, 0, 0);
    }
  }
  An(evt) {
    const element = this.Nm;
    if (!element || this.Lm === 0) {
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const currentX = evt.clientX - rect.left;
    const currentY = evt.clientY - rect.top;
    const deltaX = currentX - this.Jm.x;
    const deltaY = currentY - this.Jm.y;
    this.Jm.setComponents(currentX, currentY);
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      return;
    }
    if (deltaX === 0 && deltaY === 0) {
      return;
    }
    const scalar = -deltaX * this.Gm.x - deltaY * this.Gm.y;
    if (scalar === 0) {
      return;
    }
    const deltaAngle = scalar * this.Lm;
    if (!Number.isFinite(deltaAngle) || deltaAngle === 0) {
      return;
    }
    this.Mm += deltaAngle;
    const deltaQuat = Quaternion.fromAxisAngle(this.Qm, this.Mm);
    this.Om = Quaternion.multiply(deltaQuat, this.Km);
    this._update();
  }
  cn(vec, out) {
    var _a;
    const resources = _RotationGizmo.Hm(this.c);
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
  Cn(evt) {
    var _a;
    let element = evt.target;
    if (!(element == null ? void 0 : element.getBoundingClientRect)) {
      element = (_a = this.c.config.eventTargetDom) != null ? _a : null;
    }
    if (!(element == null ? void 0 : element.getBoundingClientRect)) {
      return void 0;
    }
    return element;
  }
  yn() {
    if (this.Pm) {
      return;
    }
    InputManager.disableCameraController();
    this.Pm = true;
  }
  Bn() {
    if (!this.Pm) {
      return;
    }
    InputManager.enableCameraController();
    this.Pm = false;
  }
  static xn(position, axis) {
    switch (axis) {
      case "x":
        return Vector3.fromCopy3(0, position.y, position.z);
      case "y":
        return Vector3.fromCopy3(position.x, 0, position.z);
      default:
        return Vector3.fromCopy3(position.x, position.y, 0);
    }
  }
  Dn(axis) {
    const parent = this.jm.getSceneGraph().parent;
    if (_RotationGizmo.Tm === "local" || Is.not.exist(parent)) {
      return _RotationGizmo.Zm(axis);
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
    return invRot.multiplyVector(_RotationGizmo.Zm(axis));
  }
  static Zm(axis) {
    switch (axis) {
      case "x":
        return _RotationGizmo.dn;
      case "y":
        return _RotationGizmo.um;
      default:
        return _RotationGizmo.en;
    }
  }
  static vn(engine, evt, local = false) {
    const resources = _RotationGizmo.Hm(engine);
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
    const caster = local ? _RotationGizmo.Hn : _RotationGizmo.In;
    if (Is.not.exist(activeCamera)) {
      return { xResult: empty, yResult: empty, zResult: empty };
    }
    const xResult = caster(x, y, activeCamera, viewport, resources.xRingEntity);
    const yResult = caster(x, y, activeCamera, viewport, resources.yRingEntity);
    const zResult = caster(x, y, activeCamera, viewport, resources.zRingEntity);
    return { xResult, yResult, zResult };
  }
  static In(x, y, camera, viewport, ...entities) {
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
  static Hn(x, y, camera, viewport, ...entities) {
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
  static Ym(engine, axis, material) {
    const radius = _RotationGizmo.Dm;
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
  static wn(candidates) {
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
  static Xm(engine, color) {
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
    _RotationGizmo.Sm.delete(engine.objectUID);
    _RotationGizmo.Fm = "none";
  }
};
/** Resources managed per-Engine instance */
_RotationGizmo.Sm = /* @__PURE__ */ new Map();
_RotationGizmo.Fm = "none";
_RotationGizmo.Tm = "world";
_RotationGizmo.Dm = 1;
/** Gizmo size as a fraction of the viewport height (ring radius). */
_RotationGizmo.Um = 0.08;
_RotationGizmo.dn = Vector3.fromCopy3(1, 0, 0);
_RotationGizmo.um = Vector3.fromCopy3(0, 1, 0);
_RotationGizmo.en = Vector3.fromCopy3(0, 0, 1);
_RotationGizmo.yc = MutableMatrix44.zero();
_RotationGizmo.Ec = MutableMatrix44.zero();
_RotationGizmo.fn = MutableMatrix44.zero();
_RotationGizmo.gn = MutableVector4.zero();
_RotationGizmo.hn = MutableVector4.zero();
_RotationGizmo.jn = MutableVector4.zero();
_RotationGizmo.kn = MutableVector4.zero();
_RotationGizmo.Dc = MutableVector3.zero();
_RotationGizmo.Ac = MutableVector3.zero();
_RotationGizmo.Bc = MutableVector3.zero();
_RotationGizmo.Jn = MutableVector3.zero();
_RotationGizmo.Kn = MutableVector3.zero();
_RotationGizmo.Ln = MutableVector3.zero();
_RotationGizmo.ln = MutableVector3.zero();
_RotationGizmo.mn = MutableVector3.zero();
_RotationGizmo.nn = MutableVector3.zero();
_RotationGizmo.on = MutableVector3.zero();
/** Reusable quaternion for world-rotation calculations (avoids per-frame allocations) */
_RotationGizmo._m = MutableQuaternion.identity();
var RotationGizmo = _RotationGizmo;
export {
  RotationGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL1JvdGF0aW9uR2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVNZXNoRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvY3JlYXRlTWVzaEVudGl0eSc7XG5pbXBvcnQgeyBjcmVhdGVHcm91cEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9jcmVhdGVHcm91cEVudGl0eSc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gJy4uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUmluZyB9IGZyb20gJy4uL2dlb21ldHJ5L3NoYXBlcy9SaW5nJztcbmltcG9ydCB0eXBlIHsgUmF5Y2FzdFJlc3VsdEV4MSB9IGZyb20gJy4uL2dlb21ldHJ5L3R5cGVzL0dlb21ldHJ5VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJTWVzaEVudGl0eSwgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsIH0gZnJvbSAnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTWF0cml4MzMnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBhc3NlcnRFeGlzdCB9IGZyb20gJy4uL21pc2MvTWlzY1V0aWwnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IGdldEV2ZW50LCBJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19ST1RBVElPTiwgSW5wdXRNYW5hZ2VyIH0gZnJvbSAnLi4vc3lzdGVtL0lucHV0TWFuYWdlcic7XG5pbXBvcnQgeyBHaXptbyB9IGZyb20gJy4vR2l6bW8nO1xuXG5kZWNsYXJlIGxldCB3aW5kb3c6IGFueTtcblxudHlwZSBBeGlzID0gJ3gnIHwgJ3knIHwgJ3onO1xuXG4vKipcbiAqIEludGVybmFsIHJlc291cmNlcyBmb3IgUm90YXRpb25HaXptbywgbWFuYWdlZCBwZXItRW5naW5lLlxuICogQGludGVybmFsXG4gKi9cbmludGVyZmFjZSBSb3RhdGlvbkdpem1vUmVzb3VyY2VzIHtcbiAgZ3JvdXBFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5O1xuICB4UmluZ0VudGl0eTogSU1lc2hFbnRpdHk7XG4gIHlSaW5nRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgelJpbmdFbnRpdHk6IElNZXNoRW50aXR5O1xuICB4UmluZ01lc2g6IE1lc2g7XG4gIHlSaW5nTWVzaDogTWVzaDtcbiAgelJpbmdNZXNoOiBNZXNoO1xuICB4UmluZ01hdGVyaWFsOiBNYXRlcmlhbDtcbiAgeVJpbmdNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHpSaW5nTWF0ZXJpYWw6IE1hdGVyaWFsO1xuICB4UmluZ1ByaW1pdGl2ZTogUmluZztcbiAgeVJpbmdQcmltaXRpdmU6IFJpbmc7XG4gIHpSaW5nUHJpbWl0aXZlOiBSaW5nO1xufVxuXG4vKipcbiAqIFJvdGF0aW9uR2l6bW8gcHJvdmlkZXMgaW50ZXJhY3RpdmUgcm90YXRpb24gcmluZ3MgZm9yIG1hbmlwdWxhdGluZyBlbnRpdHkgb3JpZW50YXRpb24uXG4gKiBJdCBvZmZlcnMgdGhyZWUgY29sb3ItY29kZWQgcmluZ3MgKFg6IHJlZCwgWTogZ3JlZW4sIFo6IGJsdWUpIHRoYXQgcmVzcG9uZCB0byBwb2ludGVyXG4gKiBkcmFnIG9wZXJhdGlvbnMgYm90aCBpbiB3b3JsZCBzcGFjZSBhbmQgaW4gbG9jYWwgc3BhY2UgYWxpZ25lZCB0byB0aGUgdGFyZ2V0IGhpZXJhcmNoeS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdGF0aW9uR2l6bW8gZXh0ZW5kcyBHaXptbyB7XG4gIC8qKiBSZXNvdXJjZXMgbWFuYWdlZCBwZXItRW5naW5lIGluc3RhbmNlICovXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb3VyY2VzTWFwOiBNYXA8bnVtYmVyLCBSb3RhdGlvbkdpem1vUmVzb3VyY2VzPiA9IG5ldyBNYXAoKTtcblxuICBwcml2YXRlIHN0YXRpYyBfX2FjdGl2ZUF4aXM6IEF4aXMgfCAnbm9uZScgPSAnbm9uZSc7XG4gIHByaXZhdGUgc3RhdGljIF9fc3BhY2U6ICdsb2NhbCcgfCAnd29ybGQnID0gJ3dvcmxkJztcbiAgcHJpdmF0ZSBzdGF0aWMgX19sZW5ndGggPSAxO1xuICAvKiogR2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgKHJpbmcgcmFkaXVzKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zY3JlZW5TcGFjZVJhdGlvID0gMC4wODtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX191bml0WCA9IFZlY3RvcjMuZnJvbUNvcHkzKDEsIDAsIDApO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3VuaXRZID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdW5pdFogPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAxKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8wID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8xID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8yID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3I0XzAgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yNF8xID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjRfMiA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3I0XzMgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18wID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfMSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzIgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18zID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfNCA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzUgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM182ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfNyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzggPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM185ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAvKiogUmV1c2FibGUgcXVhdGVybmlvbiBmb3Igd29ybGQtcm90YXRpb24gY2FsY3VsYXRpb25zIChhdm9pZHMgcGVyLWZyYW1lIGFsbG9jYXRpb25zKSAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFF1YXRlcm5pb25fMCA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG5cbiAgcHJpdmF0ZSBfX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3N0YXJ0VmVjdG9yID0gVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19kZWx0YVF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBfX2xhdGVzdFRhcmdldEVudGl0eT86IElTY2VuZUdyYXBoRW50aXR5O1xuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bkZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyRG93bi5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyTW92ZUZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyTW92ZS5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyVXBGdW5jID0gdGhpcy5fX29uUG9pbnRlclVwLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcG9pbnRlclByZXYgPSBNdXRhYmxlVmVjdG9yMi56ZXJvKCk7XG4gIHByaXZhdGUgX19kcmFnU2NyZWVuRGlyZWN0aW9uID0gTXV0YWJsZVZlY3RvcjIuemVybygpO1xuICBwcml2YXRlIF9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbiA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2RyYWdTY2FsZSA9IDA7XG4gIHByaXZhdGUgX19hY2N1bXVsYXRlZEFuZ2xlID0gMDtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVBvaW50ZXJFbGVtZW50PzogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlc291cmNlcyBmb3IgYSBzcGVjaWZpYyBlbmdpbmUsIG9yIHVuZGVmaW5lZCBpZiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJlc291cmNlcyhlbmdpbmU6IEVuZ2luZSk6IFJvdGF0aW9uR2l6bW9SZXNvdXJjZXMgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBSb3RhdGlvbkdpem1vLl9fcmVzb3VyY2VzTWFwLmdldChlbmdpbmUub2JqZWN0VUlEKTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgZ2V0IGlzU2V0dXAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIElzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJpbmcgcmFkaXVzIG9mIHRoZSBnaXptby5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSByaW5nIHJhZGl1cyB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgb25seSBhZmZlY3RzIHRoZSBnZW9tZXRyeSBnZW5lcmF0ZWRcbiAgICogYmVmb3JlIHRoZSBnaXptbyByZXNvdXJjZXMgYXJlIGNyZWF0ZWQuXG4gICAqL1xuICBzZXQgbGVuZ3RoKHZhbDogbnVtYmVyKSB7XG4gICAgUm90YXRpb25HaXptby5fX2xlbmd0aCA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByaW5nIHJhZGl1cyBvZiB0aGUgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRoZSByaW5nIHJhZGl1cyB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgb25seSBhZmZlY3RzIHRoZSBnZW9tZXRyeSBnZW5lcmF0ZWRcbiAgICogYmVmb3JlIHRoZSBnaXptbyByZXNvdXJjZXMgYXJlIGNyZWF0ZWQuXG4gICAqL1xuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX19sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZ2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIFRoZSB1bml0IHJpbmcgcmFkaXVzIGlzIHByb2plY3RlZCB0byB0aGlzIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgcmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCAoZm9yIGV4YW1wbGUsIDAuMDggZm9yIDglKVxuICAgKi9cbiAgc2V0IHNjcmVlblNwYWNlUmF0aW8odmFsOiBudW1iZXIpIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fc2NyZWVuU3BhY2VSYXRpbyA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnaXptbyBzaXplIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHZpZXdwb3J0IGhlaWdodC5cbiAgICogQHJldHVybnMgVGhlIHJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgb2NjdXBpZWQgYnkgdGhlIGdpem1vJ3MgdW5pdCByaW5nIHJhZGl1c1xuICAgKi9cbiAgZ2V0IHNjcmVlblNwYWNlUmF0aW8oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUm90YXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW87XG4gIH1cblxuICBnZXQgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNWaXNpYmxlO1xuICB9XG5cbiAgc2V0IGlzVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXNvdXJjZXMgPSBSb3RhdGlvbkdpem1vLl9fZ2V0UmVzb3VyY2VzKHRoaXMuX19lbmdpbmUpO1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX19pc1Zpc2libGUgPT09IGZhbHNlICYmIGZsZyA9PT0gdHJ1ZSkge1xuICAgICAgbGV0IGV2ZW50VGFyZ2V0RG9tID0gd2luZG93O1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tKSkge1xuICAgICAgICBldmVudFRhcmdldERvbSA9IHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tO1xuICAgICAgfVxuICAgICAgSW5wdXRNYW5hZ2VyLnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OLCBbXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6IGdldEV2ZW50KCdzdGFydCcpLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19vblBvaW50ZXJEb3duRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnbW92ZScpLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19vblBvaW50ZXJNb3ZlRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnZW5kJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAncG9pbnRlcmxlYXZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fb25Qb2ludGVyVXBGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHt9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICBdKTtcblxuICAgICAgdGhpcy5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG4gICAgICB0aGlzLl9fYXR0YWNoU2hhcmVkR3JvdXAoKTtcbiAgICAgIHRoaXMuX19hcHBseVNwYWNlVG9Hcm91cCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9faXNWaXNpYmxlID09PSB0cnVlICYmIGZsZyA9PT0gZmFsc2UpIHtcbiAgICAgIElucHV0TWFuYWdlci51bnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OKTtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICB9XG5cbiAgICBJbnB1dE1hbmFnZXIuc2V0QWN0aXZlKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OLCBmbGcpO1xuICAgIHRoaXMuX19zZXRWaXNpYmxlKGZsZyk7XG4gIH1cblxuICBzZXRTcGFjZShzcGFjZTogJ2xvY2FsJyB8ICd3b3JsZCcpIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fc3BhY2UgPSBzcGFjZTtcbiAgICBpZiAodGhpcy5fX2lzVmlzaWJsZSkge1xuICAgICAgdGhpcy5fX2FwcGx5U3BhY2VUb0dyb3VwKCk7XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHVibGljIE1ldGhvZHNcbiAgLy8vXG4gIC8vL1xuXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRTY2VuZUdyYXBoID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCF0YXJnZXRTY2VuZUdyYXBoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX3RvcEVudGl0eSA9IGNyZWF0ZUdyb3VwRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKGBSb3RhdGlvbkdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gdHJ1ZTtcbiAgICB0YXJnZXRTY2VuZUdyYXBoLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpISk7XG5cbiAgICAvLyBDaGVjayBpZiByZXNvdXJjZXMgYWxyZWFkeSBleGlzdCBmb3IgdGhpcyBlbmdpbmVcbiAgICBsZXQgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgLy8gQ3JlYXRlIHJlc291cmNlcyBmb3IgdGhpcyBlbmdpbmVcbiAgICAgIHJlc291cmNlcyA9IHRoaXMuX19jcmVhdGVSZXNvdXJjZXMoKTtcbiAgICAgIFJvdGF0aW9uR2l6bW8uX19yZXNvdXJjZXNNYXAuc2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlELCByZXNvdXJjZXMpO1xuICAgIH1cblxuICAgIHRoaXMuX19hdHRhY2hTaGFyZWRHcm91cCgpO1xuICAgIHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPSB0aGlzLl9fdGFyZ2V0O1xuXG4gICAgdGhpcy5zZXRHaXptb1RhZygpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6ICdHaXptbycsIHZhbHVlOiAnUm90YXRpb24nIH0pO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYWxsIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBnaXptby5cbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVSZXNvdXJjZXMoKTogUm90YXRpb25HaXptb1Jlc291cmNlcyB7XG4gICAgLy8gWCByaW5nXG4gICAgY29uc3QgeFJpbmdFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHhSaW5nRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnUm90YXRpb25HaXptb194UmluZycsIHRydWUpO1xuICAgIGNvbnN0IHhSaW5nTWF0ZXJpYWwgPSBSb3RhdGlvbkdpem1vLl9fY3JlYXRlUmluZ01hdGVyaWFsKHRoaXMuX19lbmdpbmUsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzEsIDAsIDAsIDAuODVdKSk7XG4gICAgY29uc3QgeFJpbmdNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgeFJpbmdQcmltaXRpdmUgPSBSb3RhdGlvbkdpem1vLl9fY3JlYXRlUmluZ1ByaW1pdGl2ZSh0aGlzLl9fZW5naW5lLCAneCcsIHhSaW5nTWF0ZXJpYWwpO1xuICAgIHhSaW5nTWVzaC5hZGRQcmltaXRpdmUoeFJpbmdQcmltaXRpdmUpO1xuICAgIHhSaW5nRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHhSaW5nTWVzaCk7XG5cbiAgICAvLyBZIHJpbmdcbiAgICBjb25zdCB5UmluZ0VudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgeVJpbmdFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdSb3RhdGlvbkdpem1vX3lSaW5nJywgdHJ1ZSk7XG4gICAgY29uc3QgeVJpbmdNYXRlcmlhbCA9IFJvdGF0aW9uR2l6bW8uX19jcmVhdGVSaW5nTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSwgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMCwgMSwgMCwgMC44NV0pKTtcbiAgICBjb25zdCB5UmluZ01lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB5UmluZ1ByaW1pdGl2ZSA9IFJvdGF0aW9uR2l6bW8uX19jcmVhdGVSaW5nUHJpbWl0aXZlKHRoaXMuX19lbmdpbmUsICd5JywgeVJpbmdNYXRlcmlhbCk7XG4gICAgeVJpbmdNZXNoLmFkZFByaW1pdGl2ZSh5UmluZ1ByaW1pdGl2ZSk7XG4gICAgeVJpbmdFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeVJpbmdNZXNoKTtcblxuICAgIC8vIFogcmluZ1xuICAgIGNvbnN0IHpSaW5nRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB6UmluZ0VudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1JvdGF0aW9uR2l6bW9felJpbmcnLCB0cnVlKTtcbiAgICBjb25zdCB6UmluZ01hdGVyaWFsID0gUm90YXRpb25HaXptby5fX2NyZWF0ZVJpbmdNYXRlcmlhbCh0aGlzLl9fZW5naW5lLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLCAwLCAxLCAwLjg1XSkpO1xuICAgIGNvbnN0IHpSaW5nTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHpSaW5nUHJpbWl0aXZlID0gUm90YXRpb25HaXptby5fX2NyZWF0ZVJpbmdQcmltaXRpdmUodGhpcy5fX2VuZ2luZSwgJ3onLCB6UmluZ01hdGVyaWFsKTtcbiAgICB6UmluZ01lc2guYWRkUHJpbWl0aXZlKHpSaW5nUHJpbWl0aXZlKTtcbiAgICB6UmluZ0VudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh6UmluZ01lc2gpO1xuXG4gICAgLy8gR3JvdXAgZW50aXR5XG4gICAgY29uc3QgZ3JvdXBFbnRpdHkgPSBjcmVhdGVHcm91cEVudGl0eSh0aGlzLl9fZW5naW5lKTtcblxuICAgIHJldHVybiB7XG4gICAgICBncm91cEVudGl0eSxcbiAgICAgIHhSaW5nRW50aXR5LFxuICAgICAgeVJpbmdFbnRpdHksXG4gICAgICB6UmluZ0VudGl0eSxcbiAgICAgIHhSaW5nTWVzaCxcbiAgICAgIHlSaW5nTWVzaCxcbiAgICAgIHpSaW5nTWVzaCxcbiAgICAgIHhSaW5nTWF0ZXJpYWwsXG4gICAgICB5UmluZ01hdGVyaWFsLFxuICAgICAgelJpbmdNYXRlcmlhbCxcbiAgICAgIHhSaW5nUHJpbWl0aXZlLFxuICAgICAgeVJpbmdQcmltaXRpdmUsXG4gICAgICB6UmluZ1ByaW1pdGl2ZSxcbiAgICB9O1xuICB9XG5cbiAgX3VwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAoIUlzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2cgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKSE7XG4gICAgY29uc3QgYWFiYiA9IHNnLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICAvLyBHaXptbyBlbnRpdGllcyBhcmUgYXR0YWNoZWQgd2l0aCB0b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gdHJ1ZSxcbiAgICAvLyBzbyBsb2NhbCB2YWx1ZXMgYXJlIHdvcmxkIHZhbHVlcyBoZXJlLlxuICAgIGNvbnN0IHdvcmxkUG9zaXRpb24gPSBhYWJiLmlzVmFuaWxsYSgpID8gc2cucG9zaXRpb24gOiBhYWJiLmNlbnRlclBvaW50O1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhO1xuICAgIHRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uID0gd29ybGRQb3NpdGlvbjtcblxuICAgIC8vIEtlZXAgdGhlIGdpem1vIGF0IGEgY29uc3RhbnQgc2l6ZSBvbiBzY3JlZW4gcmVnYXJkbGVzcyBvZiB0aGUgdGFyZ2V0IHNpemUuXG4gICAgY29uc3QgdW5pZm9ybSA9IEdpem1vLl9fY2FsY1NjcmVlblNwYWNlU2NhbGUodGhpcy5fX2VuZ2luZSwgd29ybGRQb3NpdGlvbiwgUm90YXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW8pO1xuICAgIHRyYW5zZm9ybS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTModW5pZm9ybSwgdW5pZm9ybSwgdW5pZm9ybSk7XG4gICAgLy8gUmVmbGVjdCB0aGUgbmV3IHNjYWxlIGluIHRoZSBzYW1lIGZyYW1lLiBUaGUgUmVuZGVyIHN0YWdlIHVwbG9hZHMgdGhlIGluc3RhbmNlIGRhdGFcbiAgICAvLyBiZWZvcmUgdGhlIG1hdHJpY2VzIHdvdWxkIGJlIHJlY2FsY3VsYXRlZCBsYXppbHksIHNvIG1hdGVyaWFsaXplIHRoZW0gbm93LlxuICAgIHRoaXMuX191cGRhdGVXb3JsZE1hdHJpY2VzT2ZTdWJ0cmVlKCk7XG5cbiAgICBpZiAodGhpcy5fX2lzUG9pbnRlckRvd24gJiYgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgIT09ICdub25lJykge1xuICAgICAgaWYgKHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPT09IHRoaXMuX190YXJnZXQpIHtcbiAgICAgICAgdGhpcy5fX3RhcmdldC5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tQ29weVF1YXRlcm5pb24odGhpcy5fX2RlbHRhUXVhdGVybmlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpKSB7XG4gICAgICB0aGlzLl9fdG9wRW50aXR5Ll9kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHJpdmF0ZSBoZWxwZXJzXG4gIC8vL1xuICAvLy9cblxuICBwcml2YXRlIF9fYXR0YWNoU2hhcmVkR3JvdXAoKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIUlzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpIHx8ICFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdG9wU2NlbmVHcmFwaCA9IHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKTtcbiAgICBjb25zdCBncm91cFNjZW5lR3JhcGggPSByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpO1xuICAgIHRvcFNjZW5lR3JhcGguYWRkQ2hpbGQoZ3JvdXBTY2VuZUdyYXBoKTtcbiAgICBncm91cFNjZW5lR3JhcGguYWRkQ2hpbGQocmVzb3VyY2VzLnhSaW5nRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgZ3JvdXBTY2VuZUdyYXBoLmFkZENoaWxkKHJlc291cmNlcy55UmluZ0VudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgIGdyb3VwU2NlbmVHcmFwaC5hZGRDaGlsZChyZXNvdXJjZXMuelJpbmdFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBseVNwYWNlVG9Hcm91cCgpIHtcbiAgICBjb25zdCByZXNvdXJjZXMgPSBSb3RhdGlvbkdpem1vLl9fZ2V0UmVzb3VyY2VzKHRoaXMuX19lbmdpbmUpO1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFJvdGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ2xvY2FsJykge1xuICAgICAgY29uc3QgcXVhdGVybmlvbiA9IFJvdGF0aW9uR2l6bW8uX190bXBRdWF0ZXJuaW9uXzA7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgICBpZiAoSXMuZXhpc3QocGFyZW50KSkge1xuICAgICAgICBwYXJlbnQuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8ocXVhdGVybmlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gICAgICB9XG4gICAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbiA9IHF1YXRlcm5pb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gUm90YXRpb25HaXptby5fX3RtcFF1YXRlcm5pb25fMC5pZGVudGl0eSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19vblBvaW50ZXJEb3duKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgdGhpcy5fX2lzUG9pbnRlckRvd24gPSB0cnVlO1xuICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcG9pbnRlclByZXYuc2V0Q29tcG9uZW50cygwLCAwKTtcbiAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDAsIDApO1xuICAgIHRoaXMuX19kcmFnU2NhbGUgPSAwO1xuICAgIHRoaXMuX19hY2N1bXVsYXRlZEFuZ2xlID0gMDtcbiAgICB0aGlzLl9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbi5zZXRDb21wb25lbnRzKDAsIDAsIDApO1xuXG4gICAgY29uc3QgeyB4UmVzdWx0LCB5UmVzdWx0LCB6UmVzdWx0IH0gPSBSb3RhdGlvbkdpem1vLl9fY2FzdFJheSh0aGlzLl9fZW5naW5lLCBldnQsIHRydWUpO1xuICAgIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gJ25vbmUnO1xuXG4gICAgY29uc3QgcGlja2VkID0gUm90YXRpb25HaXptby5fX3NlbGVjdENsb3Nlc3RBeGlzKFtcbiAgICAgIHsgYXhpczogJ3gnLCByZXN1bHQ6IHhSZXN1bHQgfSxcbiAgICAgIHsgYXhpczogJ3knLCByZXN1bHQ6IHlSZXN1bHQgfSxcbiAgICAgIHsgYXhpczogJ3onLCByZXN1bHQ6IHpSZXN1bHQgfSxcbiAgICBdKTtcblxuICAgIGlmIChwaWNrZWQpIHtcbiAgICAgIGFzc2VydEV4aXN0KHBpY2tlZC5yZXN1bHQuZGF0YSk7XG4gICAgICB0aGlzLl9fc3RhcnRWZWN0b3IgPSBWZWN0b3IzLm5vcm1hbGl6ZShSb3RhdGlvbkdpem1vLl9fcHJvamVjdFRvUGxhbmUocGlja2VkLnJlc3VsdC5kYXRhLnBvc2l0aW9uLCBwaWNrZWQuYXhpcykpO1xuICAgICAgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPSBwaWNrZWQuYXhpcztcbiAgICB9XG5cbiAgICBpZiAoUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPT09ICdub25lJykge1xuICAgICAgdGhpcy5fX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPbmx5IHByZXZlbnQgZGVmYXVsdCBhZnRlciBjb25maXJtaW5nIGFuIGF4aXMgd2FzIHBpY2tlZFxuICAgIC8vIFRoaXMgYWxsb3dzIGNhbWVyYSBjb250cm9sbGVyIHRvIGhhbmRsZSBldmVudHMgd2hlbiBnaXptbyBpcyBub3QgYmVpbmcgdXNlZFxuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuX19kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbik7XG4gICAgdGhpcy5fX2RlbHRhUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCk7XG4gICAgdGhpcy5fX3ByZXBhcmVMaW5lYXJEcmFnTWFwcGluZyhldnQsIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzKTtcbiAgfVxuXG4gIHByaXZhdGUgX19vblBvaW50ZXJNb3ZlKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKElzLmZhbHNlKHRoaXMuX19pc1BvaW50ZXJEb3duKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZUF4aXMgPSBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcztcbiAgICBpZiAoYWN0aXZlQXhpcyA9PT0gJ25vbmUnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX2hhbmRsZUxpbmVhckRyYWcoZXZ0KTtcbiAgfVxuXG4gIHByaXZhdGUgX19vblBvaW50ZXJVcChldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPSAnbm9uZSc7XG4gICAgdGhpcy5fX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCgpO1xuICAgIHRoaXMuX19zdGFydFZlY3RvciA9IFZlY3RvcjMuemVybygpO1xuICAgIHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbik7XG4gICAgdGhpcy5fX2RlbHRhUXVhdGVybmlvbiA9IFF1YXRlcm5pb24uZnJvbUNvcHlRdWF0ZXJuaW9uKHRoaXMuX190YXJnZXRSb3RhdGlvbkJhY2t1cCk7XG4gICAgdGhpcy5fX2FjdGl2ZVBvaW50ZXJFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19wb2ludGVyUHJldi5zZXRDb21wb25lbnRzKDAsIDApO1xuICAgIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnNldENvbXBvbmVudHMoMCwgMCk7XG4gICAgdGhpcy5fX3JvdGF0aW9uQXhpc0ZvclF1YXRlcm5pb24uc2V0Q29tcG9uZW50cygwLCAwLCAwKTtcbiAgICB0aGlzLl9fZHJhZ1NjYWxlID0gMDtcbiAgICB0aGlzLl9fYWNjdW11bGF0ZWRBbmdsZSA9IDA7XG4gIH1cblxuICBwcml2YXRlIF9fcHJlcGFyZUxpbmVhckRyYWdNYXBwaW5nKGV2dDogUG9pbnRlckV2ZW50LCBheGlzOiBBeGlzKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnNldENvbXBvbmVudHMoMCwgMCk7XG5cbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fX3Jlc29sdmVQb2ludGVyRWxlbWVudChldnQpO1xuICAgIGxldCB3aWR0aCA9IDE7XG4gICAgbGV0IGhlaWdodCA9IDE7XG4gICAgbGV0IHBvaW50ZXJYID0gMDtcbiAgICBsZXQgcG9pbnRlclkgPSAwO1xuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBjb25zdCByZWN0ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHdpZHRoID0gcmVjdC53aWR0aCB8fCBlbGVtZW50LmNsaWVudFdpZHRoIHx8IDE7XG4gICAgICBoZWlnaHQgPSByZWN0LmhlaWdodCB8fCBlbGVtZW50LmNsaWVudEhlaWdodCB8fCAxO1xuICAgICAgcG9pbnRlclggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgIHBvaW50ZXJZID0gZXZ0LmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLl9fcG9pbnRlclByZXYuc2V0Q29tcG9uZW50cyhwb2ludGVyWCwgcG9pbnRlclkpO1xuICAgIHRoaXMuX19kcmFnU2NhbGUgPSAoMiAqIE1hdGguUEkpIC8gTWF0aC5tYXgod2lkdGgsIGhlaWdodCwgMSk7XG4gICAgdGhpcy5fX2FjY3VtdWxhdGVkQW5nbGUgPSAwO1xuXG4gICAgY29uc3QgYXhpc0ZvclF1YXQgPSB0aGlzLl9fZ2V0QXhpc0ZvclF1YXRlcm5pb24oYXhpcyk7XG4gICAgVmVjdG9yMy5ub3JtYWxpemVUbyhheGlzRm9yUXVhdCwgdGhpcy5fX3JvdGF0aW9uQXhpc0ZvclF1YXRlcm5pb24pO1xuXG4gICAgY29uc3QgYWN0aXZlQ2FtZXJhID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KHRoaXMuX19lbmdpbmUpXG4gICAgKSBhcyBDYW1lcmFDb21wb25lbnQgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgZ3JvdXBTY2VuZUdyYXBoID0gcmVzb3VyY2VzLmdyb3VwRW50aXR5Py5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCFlbGVtZW50IHx8ICFhY3RpdmVDYW1lcmEgfHwgIWdyb3VwU2NlbmVHcmFwaCkge1xuICAgICAgdGhpcy5fX3NldERlZmF1bHREcmFnRGlyZWN0aW9uKGF4aXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGF4aXNMb2NhbCA9IFJvdGF0aW9uR2l6bW8uX19nZXRBeGlzVmVjdG9yKGF4aXMpO1xuICAgIGNvbnN0IHRhbmdlbnRMb2NhbCA9IFZlY3RvcjMuY3Jvc3NUbyh0aGlzLl9fc3RhcnRWZWN0b3IsIGF4aXNMb2NhbCwgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfOCk7XG4gICAgaWYgKHRhbmdlbnRMb2NhbC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgdGhpcy5fX3NldEZhbGxiYWNrTG9jYWxUYW5nZW50KGF4aXMsIHRhbmdlbnRMb2NhbCk7XG4gICAgfVxuICAgIFZlY3RvcjMubm9ybWFsaXplVG8odGFuZ2VudExvY2FsLCB0YW5nZW50TG9jYWwpO1xuXG4gICAgY29uc3QgdGFuZ2VudFdvcmxkID0gdGhpcy5fX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsKHRhbmdlbnRMb2NhbCwgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfOSk7XG4gICAgaWYgKHRhbmdlbnRXb3JsZC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgdGhpcy5fX3NldEZhbGxiYWNrV29ybGREaXJlY3Rpb24oYXhpc0xvY2FsLCBhY3RpdmVDYW1lcmEsIHRhbmdlbnRXb3JsZCk7XG4gICAgfVxuICAgIGlmICh0YW5nZW50V29ybGQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIHRoaXMuX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbihheGlzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgVmVjdG9yMy5ub3JtYWxpemVUbyh0YW5nZW50V29ybGQsIHRhbmdlbnRXb3JsZCk7XG5cbiAgICBjb25zdCBjZW50ZXJXb3JsZCA9IGdyb3VwU2NlbmVHcmFwaC5tYXRyaXhJbm5lci5nZXRUcmFuc2xhdGVUbyhSb3RhdGlvbkdpem1vLl9fdG1wVmVjdG9yM183KTtcbiAgICBjb25zdCBwdk1hdHJpeCA9IE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKFxuICAgICAgYWN0aXZlQ2FtZXJhLnByb2plY3Rpb25NYXRyaXgsXG4gICAgICBhY3RpdmVDYW1lcmEudmlld01hdHJpeCxcbiAgICAgIFJvdGF0aW9uR2l6bW8uX190bXBNYXRyaXg0NF8yXG4gICAgKTtcblxuICAgIGNvbnN0IGNsaXBDZW50ZXIgPSBwdk1hdHJpeC5tdWx0aXBseVZlY3RvclRvKFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfMC5zZXRDb21wb25lbnRzKGNlbnRlcldvcmxkLngsIGNlbnRlcldvcmxkLnksIGNlbnRlcldvcmxkLnosIDEpLFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfMlxuICAgICk7XG4gICAgY29uc3QgY2xpcFRhbmdlbnQgPSBwdk1hdHJpeC5tdWx0aXBseVZlY3RvclRvKFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfMS5zZXRDb21wb25lbnRzKFxuICAgICAgICBjZW50ZXJXb3JsZC54ICsgdGFuZ2VudFdvcmxkLngsXG4gICAgICAgIGNlbnRlcldvcmxkLnkgKyB0YW5nZW50V29ybGQueSxcbiAgICAgICAgY2VudGVyV29ybGQueiArIHRhbmdlbnRXb3JsZC56LFxuICAgICAgICAxXG4gICAgICApLFxuICAgICAgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjRfM1xuICAgICk7XG5cbiAgICBjb25zdCB3MCA9IGNsaXBDZW50ZXIudztcbiAgICBjb25zdCB3MSA9IGNsaXBUYW5nZW50Lnc7XG4gICAgaWYgKHcwID09PSAwIHx8IHcxID09PSAwKSB7XG4gICAgICB0aGlzLl9fc2V0RGVmYXVsdERyYWdEaXJlY3Rpb24oYXhpcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmRjQ2VudGVyWCA9IGNsaXBDZW50ZXIueCAvIHcwO1xuICAgIGNvbnN0IG5kY0NlbnRlclkgPSBjbGlwQ2VudGVyLnkgLyB3MDtcbiAgICBjb25zdCBuZGNUYW5nZW50WCA9IGNsaXBUYW5nZW50LnggLyB3MTtcbiAgICBjb25zdCBuZGNUYW5nZW50WSA9IGNsaXBUYW5nZW50LnkgLyB3MTtcblxuICAgIGNvbnN0IHNjcmVlblRhbmdlbnRYID0gKG5kY1RhbmdlbnRYIC0gbmRjQ2VudGVyWCkgKiB3aWR0aCAqIDAuNTtcbiAgICBjb25zdCBzY3JlZW5UYW5nZW50WSA9IC0obmRjVGFuZ2VudFkgLSBuZGNDZW50ZXJZKSAqIGhlaWdodCAqIDAuNTtcbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KHNjcmVlblRhbmdlbnRYLCBzY3JlZW5UYW5nZW50WSk7XG4gICAgaWYgKGxlbmd0aCA8IDFlLTUpIHtcbiAgICAgIHRoaXMuX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbihheGlzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKHNjcmVlblRhbmdlbnRYIC8gbGVuZ3RoLCBzY3JlZW5UYW5nZW50WSAvIGxlbmd0aCk7XG4gIH1cblxuICBwcml2YXRlIF9fc2V0RGVmYXVsdERyYWdEaXJlY3Rpb24oYXhpczogQXhpcykge1xuICAgIGlmIChheGlzID09PSAneCcpIHtcbiAgICAgIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnNldENvbXBvbmVudHMoMCwgLTEpO1xuICAgIH0gZWxzZSBpZiAoYXhpcyA9PT0gJ3knKSB7XG4gICAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDEsIDApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDEsIDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19zZXRGYWxsYmFja0xvY2FsVGFuZ2VudChheGlzOiBBeGlzLCBvdXQ6IE11dGFibGVWZWN0b3IzKSB7XG4gICAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMCwgMCwgMSk7XG4gICAgfSBlbHNlIGlmIChheGlzID09PSAneScpIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKDAsIDAsIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQuc2V0Q29tcG9uZW50cygwLCAxLCAwKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fc2V0RmFsbGJhY2tXb3JsZERpcmVjdGlvbihheGlzTG9jYWw6IFZlY3RvcjMsIGNhbWVyYTogQ2FtZXJhQ29tcG9uZW50LCBvdXQ6IE11dGFibGVWZWN0b3IzKSB7XG4gICAgY29uc3QgYXhpc1dvcmxkID0gdGhpcy5fX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsKGF4aXNMb2NhbCwgUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfNik7XG4gICAgaWYgKGF4aXNXb3JsZC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMSwgMCwgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFZlY3RvcjMubm9ybWFsaXplVG8oYXhpc1dvcmxkLCBheGlzV29ybGQpO1xuXG4gICAgVmVjdG9yMy5jcm9zc1RvKGF4aXNXb3JsZCwgY2FtZXJhLmRpcmVjdGlvbklubmVyLCBvdXQpO1xuICAgIGlmIChvdXQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIFZlY3RvcjMuY3Jvc3NUbyhjYW1lcmEudXBJbm5lciwgYXhpc1dvcmxkLCBvdXQpO1xuICAgIH1cbiAgICBpZiAob3V0Lmxlbmd0aFNxdWFyZWQoKSA8IDFlLTEwKSB7XG4gICAgICB0aGlzLl9fY2hvb3NlQW55UGVycGVuZGljdWxhcihheGlzV29ybGQsIG91dCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2Nob29zZUFueVBlcnBlbmRpY3VsYXIoYXhpczogSVZlY3RvcjMsIG91dDogTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBpZiAoTWF0aC5hYnMoYXhpcy54KSA8IDAuOSkge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMCwgLWF4aXMueiwgYXhpcy55KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoLWF4aXMueSwgYXhpcy54LCAwKTtcbiAgICB9XG4gICAgaWYgKG91dC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMSwgMCwgMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2hhbmRsZUxpbmVhckRyYWcoZXZ0OiBQb2ludGVyRXZlbnQpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fX2FjdGl2ZVBvaW50ZXJFbGVtZW50O1xuICAgIGlmICghZWxlbWVudCB8fCB0aGlzLl9fZHJhZ1NjYWxlID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKHJlY3Qud2lkdGggPT09IDAgfHwgcmVjdC5oZWlnaHQgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50WCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IGN1cnJlbnRZID0gZXZ0LmNsaWVudFkgLSByZWN0LnRvcDtcbiAgICBjb25zdCBkZWx0YVggPSBjdXJyZW50WCAtIHRoaXMuX19wb2ludGVyUHJldi54O1xuICAgIGNvbnN0IGRlbHRhWSA9IGN1cnJlbnRZIC0gdGhpcy5fX3BvaW50ZXJQcmV2Lnk7XG4gICAgdGhpcy5fX3BvaW50ZXJQcmV2LnNldENvbXBvbmVudHMoY3VycmVudFgsIGN1cnJlbnRZKTtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShkZWx0YVgpIHx8ICFOdW1iZXIuaXNGaW5pdGUoZGVsdGFZKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZGVsdGFYID09PSAwICYmIGRlbHRhWSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNjYWxhciA9IC1kZWx0YVggKiB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi54IC0gZGVsdGFZICogdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24ueTtcbiAgICBpZiAoc2NhbGFyID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGVsdGFBbmdsZSA9IHNjYWxhciAqIHRoaXMuX19kcmFnU2NhbGU7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZGVsdGFBbmdsZSkgfHwgZGVsdGFBbmdsZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19hY2N1bXVsYXRlZEFuZ2xlICs9IGRlbHRhQW5nbGU7XG4gICAgY29uc3QgZGVsdGFRdWF0ID0gUXVhdGVybmlvbi5mcm9tQXhpc0FuZ2xlKHRoaXMuX19yb3RhdGlvbkF4aXNGb3JRdWF0ZXJuaW9uLCB0aGlzLl9fYWNjdW11bGF0ZWRBbmdsZSk7XG4gICAgdGhpcy5fX2RlbHRhUXVhdGVybmlvbiA9IFF1YXRlcm5pb24ubXVsdGlwbHkoZGVsdGFRdWF0LCB0aGlzLl9fdGFyZ2V0Um90YXRpb25CYWNrdXApO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsKHZlYzogSVZlY3RvcjMsIG91dDogTXV0YWJsZVZlY3RvcjMpOiBNdXRhYmxlVmVjdG9yMyB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCBncm91cFNjZW5lR3JhcGggPSByZXNvdXJjZXM/Lmdyb3VwRW50aXR5Py5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCFncm91cFNjZW5lR3JhcGgpIHtcbiAgICAgIHJldHVybiBvdXQuc2V0Q29tcG9uZW50cyh2ZWMueCwgdmVjLnksIHZlYy56KTtcbiAgICB9XG5cbiAgICBjb25zdCBtYXRyaXggPSBncm91cFNjZW5lR3JhcGgubWF0cml4SW5uZXI7XG4gICAgY29uc3QgeCA9IHZlYy54O1xuICAgIGNvbnN0IHkgPSB2ZWMueTtcbiAgICBjb25zdCB6ID0gdmVjLno7XG5cbiAgICBjb25zdCB3b3JsZFggPSBtYXRyaXgubTAwICogeCArIG1hdHJpeC5tMDEgKiB5ICsgbWF0cml4Lm0wMiAqIHo7XG4gICAgY29uc3Qgd29ybGRZID0gbWF0cml4Lm0xMCAqIHggKyBtYXRyaXgubTExICogeSArIG1hdHJpeC5tMTIgKiB6O1xuICAgIGNvbnN0IHdvcmxkWiA9IG1hdHJpeC5tMjAgKiB4ICsgbWF0cml4Lm0yMSAqIHkgKyBtYXRyaXgubTIyICogejtcblxuICAgIHJldHVybiBvdXQuc2V0Q29tcG9uZW50cyh3b3JsZFgsIHdvcmxkWSwgd29ybGRaKTtcbiAgfVxuXG4gIHByaXZhdGUgX19yZXNvbHZlUG9pbnRlckVsZW1lbnQoZXZ0OiBQb2ludGVyRXZlbnQpOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGVsZW1lbnQgPSBldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoIWVsZW1lbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgZWxlbWVudCA9IHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tID8/IG51bGw7XG4gICAgfVxuICAgIGlmICghZWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHByaXZhdGUgX19kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpIHtcbiAgICBpZiAodGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIElucHV0TWFuYWdlci5kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9fZW5hYmxlQ2FtZXJhQ29udHJvbGxlcklmTmVlZGVkKCkge1xuICAgIGlmICghdGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIElucHV0TWFuYWdlci5lbmFibGVDYW1lcmFDb250cm9sbGVyKCk7XG4gICAgdGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3Byb2plY3RUb1BsYW5lKHBvc2l0aW9uOiBJVmVjdG9yMywgYXhpczogQXhpcyk6IFZlY3RvcjMge1xuICAgIHN3aXRjaCAoYXhpcykge1xuICAgICAgY2FzZSAneCc6XG4gICAgICAgIHJldHVybiBWZWN0b3IzLmZyb21Db3B5MygwLCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KTtcbiAgICAgIGNhc2UgJ3knOlxuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgMCwgcG9zaXRpb24ueik7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2dldEF4aXNGb3JRdWF0ZXJuaW9uKGF4aXM6IEF4aXMpOiBWZWN0b3IzIHtcbiAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgaWYgKFJvdGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ2xvY2FsJyB8fCBJcy5ub3QuZXhpc3QocGFyZW50KSkge1xuICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX19nZXRBeGlzVmVjdG9yKGF4aXMpO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gcGFyZW50Lm1hdHJpeElubmVyLmdldFJvdGF0ZSgpO1xuICAgIGNvbnN0IHJvdE1hdCA9IE1hdHJpeDMzLmZyb21Db3B5OVJvd01ham9yKFxuICAgICAgd29ybGRNYXRyaXgubTAwLFxuICAgICAgd29ybGRNYXRyaXgubTAxLFxuICAgICAgd29ybGRNYXRyaXgubTAyLFxuICAgICAgd29ybGRNYXRyaXgubTEwLFxuICAgICAgd29ybGRNYXRyaXgubTExLFxuICAgICAgd29ybGRNYXRyaXgubTEyLFxuICAgICAgd29ybGRNYXRyaXgubTIwLFxuICAgICAgd29ybGRNYXRyaXgubTIxLFxuICAgICAgd29ybGRNYXRyaXgubTIyXG4gICAgKTtcbiAgICBjb25zdCBpbnZSb3QgPSBNYXRyaXgzMy50cmFuc3Bvc2Uocm90TWF0KSBhcyBNYXRyaXgzMztcbiAgICByZXR1cm4gaW52Um90Lm11bHRpcGx5VmVjdG9yKFJvdGF0aW9uR2l6bW8uX19nZXRBeGlzVmVjdG9yKGF4aXMpKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0QXhpc1ZlY3RvcihheGlzOiBBeGlzKTogVmVjdG9yMyB7XG4gICAgc3dpdGNoIChheGlzKSB7XG4gICAgICBjYXNlICd4JzpcbiAgICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX191bml0WDtcbiAgICAgIGNhc2UgJ3knOlxuICAgICAgICByZXR1cm4gUm90YXRpb25HaXptby5fX3VuaXRZO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX191bml0WjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2Nhc3RSYXkoZW5naW5lOiBFbmdpbmUsIGV2dDogUG9pbnRlckV2ZW50LCBsb2NhbCA9IGZhbHNlKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyhlbmdpbmUpO1xuICAgIGNvbnN0IGVtcHR5OiBSYXljYXN0UmVzdWx0RXgxID0geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgaWYgKCFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybiB7IHhSZXN1bHQ6IGVtcHR5LCB5UmVzdWx0OiBlbXB0eSwgelJlc3VsdDogZW1wdHkgfTtcbiAgICB9XG5cbiAgICBjb25zdCByZWN0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHdpZHRoID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3QgeCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSByZWN0LmhlaWdodCAtIChldnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IFZlY3RvcjQuZnJvbUNvcHk0KDAsIDAsIHdpZHRoLCBoZWlnaHQpIGFzIFZlY3RvcjQ7XG4gICAgY29uc3QgYWN0aXZlQ2FtZXJhID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KENhbWVyYUNvbXBvbmVudCwgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKSkgYXNcbiAgICAgIHwgQ2FtZXJhQ29tcG9uZW50XG4gICAgICB8IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGNhc3RlciA9IGxvY2FsID8gUm90YXRpb25HaXptby5fX2Nhc3RGcm9tRW50aXRpZXNMb2NhbCA6IFJvdGF0aW9uR2l6bW8uX19jYXN0RnJvbUVudGl0aWVzO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoYWN0aXZlQ2FtZXJhKSkge1xuICAgICAgcmV0dXJuIHsgeFJlc3VsdDogZW1wdHksIHlSZXN1bHQ6IGVtcHR5LCB6UmVzdWx0OiBlbXB0eSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHhSZXN1bHQgPSBjYXN0ZXIoeCwgeSwgYWN0aXZlQ2FtZXJhLCB2aWV3cG9ydCwgcmVzb3VyY2VzLnhSaW5nRW50aXR5KTtcbiAgICBjb25zdCB5UmVzdWx0ID0gY2FzdGVyKHgsIHksIGFjdGl2ZUNhbWVyYSwgdmlld3BvcnQsIHJlc291cmNlcy55UmluZ0VudGl0eSk7XG4gICAgY29uc3QgelJlc3VsdCA9IGNhc3Rlcih4LCB5LCBhY3RpdmVDYW1lcmEsIHZpZXdwb3J0LCByZXNvdXJjZXMuelJpbmdFbnRpdHkpO1xuXG4gICAgcmV0dXJuIHsgeFJlc3VsdCwgeVJlc3VsdCwgelJlc3VsdCB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYXN0RnJvbUVudGl0aWVzKFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgY2FtZXJhOiBDYW1lcmFDb21wb25lbnQsXG4gICAgdmlld3BvcnQ6IFZlY3RvcjQsXG4gICAgLi4uZW50aXRpZXM6IEFycmF5PElNZXNoRW50aXR5IHwgdW5kZWZpbmVkPlxuICApOiBSYXljYXN0UmVzdWx0RXgxIHtcbiAgICBsZXQgY2xvc2VzdFJlc3VsdDogUmF5Y2FzdFJlc3VsdEV4MSA9IHsgcmVzdWx0OiBmYWxzZSB9O1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGVudGl0eSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBlbnRpdHkuZ2V0TWVzaCgpLmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBjYW1lcmEsIHZpZXdwb3J0LCAwLjApO1xuICAgICAgaWYgKCFyZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudERpc3RhbmNlID0gcmVzdWx0LmRhdGE/LnQgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgY29uc3QgY2xvc2VzdERpc3RhbmNlID0gY2xvc2VzdFJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGlmICghY2xvc2VzdFJlc3VsdC5yZXN1bHQgfHwgY3VycmVudERpc3RhbmNlIDwgY2xvc2VzdERpc3RhbmNlKSB7XG4gICAgICAgIGNsb3Nlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbG9zZXN0UmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYXN0RnJvbUVudGl0aWVzTG9jYWwoXG4gICAgeDogbnVtYmVyLFxuICAgIHk6IG51bWJlcixcbiAgICBjYW1lcmE6IENhbWVyYUNvbXBvbmVudCxcbiAgICB2aWV3cG9ydDogVmVjdG9yNCxcbiAgICAuLi5lbnRpdGllczogQXJyYXk8SU1lc2hFbnRpdHkgfCB1bmRlZmluZWQ+XG4gICk6IFJheWNhc3RSZXN1bHRFeDEge1xuICAgIGxldCBjbG9zZXN0UmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxID0geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgZm9yIChjb25zdCBlbnRpdHkgb2YgZW50aXRpZXMpIHtcbiAgICAgIGlmIChJcy5ub3QuZXhpc3QoZW50aXR5KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGVudGl0eS5nZXRNZXNoKCkuY2FzdFJheUZyb21TY3JlZW5JbkxvY2FsKHgsIHksIGNhbWVyYSwgdmlld3BvcnQsIDAuMCk7XG4gICAgICBpZiAoIXJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50RGlzdGFuY2UgPSByZXN1bHQuZGF0YT8udCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgICBjb25zdCBjbG9zZXN0RGlzdGFuY2UgPSBjbG9zZXN0UmVzdWx0LmRhdGE/LnQgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgaWYgKCFjbG9zZXN0UmVzdWx0LnJlc3VsdCB8fCBjdXJyZW50RGlzdGFuY2UgPCBjbG9zZXN0RGlzdGFuY2UpIHtcbiAgICAgICAgY2xvc2VzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3RSZXN1bHQ7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVJpbmdQcmltaXRpdmUoZW5naW5lOiBFbmdpbmUsIGF4aXM6IEF4aXMsIG1hdGVyaWFsOiBNYXRlcmlhbCk6IFJpbmcge1xuICAgIGNvbnN0IHJhZGl1cyA9IFJvdGF0aW9uR2l6bW8uX19sZW5ndGg7XG4gICAgY29uc3QgcmluZyA9IG5ldyBSaW5nKGVuZ2luZSk7XG4gICAgcmluZy5nZW5lcmF0ZSh7XG4gICAgICByYWRpdXMsXG4gICAgICB0aGlja25lc3M6IHJhZGl1cyAqIDAuMSxcbiAgICAgIHNlZ21lbnRzOiA2NCxcbiAgICAgIGF4aXMsXG4gICAgICBtYXRlcmlhbCxcbiAgICB9KTtcbiAgICByZXR1cm4gcmluZztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc2VsZWN0Q2xvc2VzdEF4aXMoXG4gICAgY2FuZGlkYXRlczogQXJyYXk8eyBheGlzOiBBeGlzOyByZXN1bHQ6IFJheWNhc3RSZXN1bHRFeDEgfT5cbiAgKTogeyBheGlzOiBBeGlzOyByZXN1bHQ6IFJheWNhc3RSZXN1bHRFeDEgfSB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGNsb3Nlc3Q6IHsgYXhpczogQXhpczsgcmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxIH0gfCB1bmRlZmluZWQ7XG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgICAgaWYgKCFjYW5kaWRhdGUucmVzdWx0LnJlc3VsdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gY2FuZGlkYXRlLnJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGlmICghY2xvc2VzdCB8fCBkaXN0YW5jZSA8IChjbG9zZXN0LnJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkpIHtcbiAgICAgICAgY2xvc2VzdCA9IGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsb3Nlc3Q7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVJpbmdNYXRlcmlhbChlbmdpbmU6IEVuZ2luZSwgY29sb3I6IFZlY3RvcjQpOiBNYXRlcmlhbCB7XG4gICAgY29uc3QgbWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKGVuZ2luZSk7XG4gICAgbWF0ZXJpYWwuYWxwaGFNb2RlID0gQWxwaGFNb2RlLkJsZW5kO1xuICAgIG1hdGVyaWFsLmN1bGxGYWNlID0gZmFsc2U7XG4gICAgbWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBjb2xvcik7XG4gICAgcmV0dXJuIG1hdGVyaWFsO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBhbGwgc3RhdGljIHJlc291cmNlcyBmb3IgYSBzcGVjaWZpYyBFbmdpbmUuXG4gICAqIFRoaXMgcmVtb3ZlcyB0aGUgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgZW5naW5lIGZyb20gdGhlIG1hcC5cbiAgICogQGludGVybmFsIENhbGxlZCBmcm9tIEVuZ2luZS5kZXN0cm95KClcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIFJvdGF0aW9uR2l6bW8uX19yZXNvdXJjZXNNYXAuZGVsZXRlKGVuZ2luZS5vYmplY3RVSUQpO1xuICAgIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gJ25vbmUnO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsWUFBWTtBQUdyQixTQUFTLGlDQUFpQztBQUcxQyxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsVUFBVTtBQUNuQixTQUFTLG1CQUFtQjtBQUU1QixTQUFTLFVBQVUscUNBQXFDLG9CQUFvQjtBQUM1RSxTQUFTLGFBQWE7QUErQmYsSUFBTSxpQkFBTixNQUFNLHVCQUFzQixNQUFNO0FBQUEsRUFBbEM7QUFBQTtBQWdDTCxTQUFRQSxLQUFrQjtBQUMxQixTQUFRQyxLQUFnQixRQUFRLEtBQUs7QUFDckMsU0FBUUMsS0FBb0IsV0FBVyxTQUFTO0FBQ2hELFNBQVFDLEtBQXlCLFdBQVcsU0FBUztBQUVyRCxTQUFRQyxLQUFzQixLQUFLQyxHQUFnQixLQUFLLElBQUk7QUFDNUQsU0FBUUMsS0FBc0IsS0FBS0MsR0FBZ0IsS0FBSyxJQUFJO0FBQzVELFNBQVFDLEtBQW9CLEtBQUtDLEdBQWMsS0FBSyxJQUFJ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LG9CQUFJLElBQUk7QUFGbEUsZUFJSVUsS0FBOEI7QUFKbEMsZUFLSUUsS0FBNkI7QUFMakMsZUFNSVYsS0FBVztBQUFBO0FBTmYsZUFRSUMsS0FBcUI7QUFSekIsZUFTYTBDLEtBQVUsUUFBUSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBVGhELGVBVWFDLEtBQVUsUUFBUSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBVmhELGVBV2FDLEtBQVUsUUFBUSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBWGhELGVBWWFHLEtBQWtCLGdCQUFnQixLQUFLO0FBWnBELGVBYWFDLEtBQWtCLGdCQUFnQixLQUFLO0FBYnBELGVBY2FiLEtBQWtCLGdCQUFnQixLQUFLO0FBZHBELGVBZWFDLEtBQWlCLGVBQWUsS0FBSztBQWZsRCxlQWdCYUUsS0FBaUIsZUFBZSxLQUFLO0FBaEJsRCxlQWlCYUQsS0FBaUIsZUFBZSxLQUFLO0FBakJsRCxlQWtCYUUsS0FBaUIsZUFBZSxLQUFLO0FBbEJsRCxlQW1CYVUsS0FBaUIsZUFBZSxLQUFLO0FBbkJsRCxlQW9CYUMsS0FBaUIsZUFBZSxLQUFLO0FBcEJsRCxlQXFCYUMsS0FBaUIsZUFBZSxLQUFLO0FBckJsRCxlQXNCYUMsS0FBaUIsZUFBZSxLQUFLO0FBdEJsRCxlQXVCYUMsS0FBaUIsZUFBZSxLQUFLO0FBdkJsRCxlQXdCYUMsS0FBaUIsZUFBZSxLQUFLO0FBeEJsRCxlQXlCYWQsS0FBaUIsZUFBZSxLQUFLO0FBekJsRCxlQTBCYU4sS0FBaUIsZUFBZSxLQUFLO0FBMUJsRCxlQTJCYUwsS0FBaUIsZUFBZSxLQUFLO0FBM0JsRCxlQTRCYUcsS0FBaUIsZUFBZSxLQUFLO0FBQUE7QUE1QmxELGVBOEJhaEIsS0FBb0Isa0JBQWtCLFNBQVM7QUE5QmxFLElBQU0sZ0JBQU47IiwKICAibmFtZXMiOiBbIl9faXNQb2ludGVyRG93biIsICJfX3N0YXJ0VmVjdG9yIiwgIl9fZGVsdGFRdWF0ZXJuaW9uIiwgIl9fdGFyZ2V0Um90YXRpb25CYWNrdXAiLCAiX19vblBvaW50ZXJEb3duRnVuYyIsICJfX29uUG9pbnRlckRvd24iLCAiX19vblBvaW50ZXJNb3ZlRnVuYyIsICJfX29uUG9pbnRlck1vdmUiLCAiX19vblBvaW50ZXJVcEZ1bmMiLCAiX19vblBvaW50ZXJVcCIsICJfX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkIiwgIl9fcG9pbnRlclByZXYiLCAiX19kcmFnU2NyZWVuRGlyZWN0aW9uIiwgIl9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbiIsICJfX2RyYWdTY2FsZSIsICJfX2FjY3VtdWxhdGVkQW5nbGUiLCAiX19nZXRSZXNvdXJjZXMiLCAiX19yZXNvdXJjZXNNYXAiLCAiX190b3BFbnRpdHkiLCAiX19sZW5ndGgiLCAiX19zY3JlZW5TcGFjZVJhdGlvIiwgIl9faXNWaXNpYmxlIiwgIl9fZW5naW5lIiwgIl9fbGF0ZXN0VGFyZ2V0RW50aXR5IiwgIl9fdGFyZ2V0IiwgIl9fYXR0YWNoU2hhcmVkR3JvdXAiLCAiX19hcHBseVNwYWNlVG9Hcm91cCIsICJfX2FjdGl2ZUF4aXMiLCAiX19zZXRWaXNpYmxlIiwgIl9fc3BhY2UiLCAiX190b1NraXBTZXR1cCIsICJfX2NyZWF0ZVJlc291cmNlcyIsICJfX2NyZWF0ZVJpbmdNYXRlcmlhbCIsICJfX2NyZWF0ZVJpbmdQcmltaXRpdmUiLCAiX19jYWxjU2NyZWVuU3BhY2VTY2FsZSIsICJfX3VwZGF0ZVdvcmxkTWF0cmljZXNPZlN1YnRyZWUiLCAiX190bXBRdWF0ZXJuaW9uXzAiLCAiX19hY3RpdmVQb2ludGVyRWxlbWVudCIsICJfX2Nhc3RSYXkiLCAiX19zZWxlY3RDbG9zZXN0QXhpcyIsICJfX3Byb2plY3RUb1BsYW5lIiwgIl9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIiLCAiX19wcmVwYXJlTGluZWFyRHJhZ01hcHBpbmciLCAiX19oYW5kbGVMaW5lYXJEcmFnIiwgIl9fZW5hYmxlQ2FtZXJhQ29udHJvbGxlcklmTmVlZGVkIiwgIl9fcmVzb2x2ZVBvaW50ZXJFbGVtZW50IiwgIl9fZ2V0QXhpc0ZvclF1YXRlcm5pb24iLCAiX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbiIsICJfX2dldEF4aXNWZWN0b3IiLCAiX190bXBWZWN0b3IzXzgiLCAiX19zZXRGYWxsYmFja0xvY2FsVGFuZ2VudCIsICJfX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsIiwgIl9fdG1wVmVjdG9yM185IiwgIl9fc2V0RmFsbGJhY2tXb3JsZERpcmVjdGlvbiIsICJfX3RtcFZlY3RvcjNfNyIsICJfX3RtcE1hdHJpeDQ0XzIiLCAiX190bXBWZWN0b3I0XzAiLCAiX190bXBWZWN0b3I0XzIiLCAiX190bXBWZWN0b3I0XzEiLCAiX190bXBWZWN0b3I0XzMiLCAiX190bXBWZWN0b3IzXzYiLCAiX19jaG9vc2VBbnlQZXJwZW5kaWN1bGFyIiwgIl9fdW5pdFgiLCAiX191bml0WSIsICJfX3VuaXRaIiwgIl9fY2FzdEZyb21FbnRpdGllc0xvY2FsIiwgIl9fY2FzdEZyb21FbnRpdGllcyIsICJfX3RtcE1hdHJpeDQ0XzAiLCAiX190bXBNYXRyaXg0NF8xIiwgIl9fdG1wVmVjdG9yM18wIiwgIl9fdG1wVmVjdG9yM18xIiwgIl9fdG1wVmVjdG9yM18yIiwgIl9fdG1wVmVjdG9yM18zIiwgIl9fdG1wVmVjdG9yM180IiwgIl9fdG1wVmVjdG9yM181Il0KfQo=
