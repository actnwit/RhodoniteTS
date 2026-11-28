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
    this.Qm = false;
    this.bn = Vector3.zero();
    this.Wm = Quaternion.identity();
    this.Sm = Quaternion.identity();
    this.xn = this.yn.bind(this);
    this.zn = this.An.bind(this);
    this.hn = this.Bn.bind(this);
    this.Xm = false;
    this.Rm = MutableVector2.zero();
    this.Om = MutableVector2.zero();
    this.Ym = MutableVector3.zero();
    this.Tm = 0;
    this.Um = 0;
  }
  /**
   * Gets the resources for a specific engine, or undefined if not initialized.
   */
  static Pm(engine) {
    return _RotationGizmo._m.get(engine.objectUID);
  }
  ///
  ///
  /// Accessors
  ///
  ///
  get isSetup() {
    return Is.exist(this.pm);
  }
  /**
   * Sets the ring radius of the gizmo.
   * @param val - The ring radius value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value only affects the geometry generated
   * before the gizmo resources are created.
   */
  set length(val) {
    _RotationGizmo.Lm = val;
  }
  /**
   * Gets the ring radius of the gizmo.
   * @returns The ring radius value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value only affects the geometry generated
   * before the gizmo resources are created.
   */
  get length() {
    return _RotationGizmo.Lm;
  }
  /**
   * Sets the gizmo size as a fraction of the viewport height.
   * The unit ring radius is projected to this fraction of the viewport height.
   * @param val - The ratio of the viewport height (for example, 0.08 for 8%)
   */
  set screenSpaceRatio(val) {
    _RotationGizmo.an = val;
  }
  /**
   * Gets the gizmo size as a fraction of the viewport height.
   * @returns The ratio of the viewport height occupied by the gizmo's unit ring radius
   */
  get screenSpaceRatio() {
    return _RotationGizmo.an;
  }
  get isVisible() {
    return this.wm;
  }
  set isVisible(flg) {
    const resources = _RotationGizmo.Pm(this.c);
    if (!resources) {
      return;
    }
    if (this.wm === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(this.c.config.eventTargetDom)) {
        eventTargetDom = this.c.config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_ROTATION, [
        {
          eventName: getEvent("start"),
          handler: this.xn,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: getEvent("move"),
          handler: this.zn,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: getEvent("end"),
          handler: this.hn,
          options: {},
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "pointerleave",
          handler: this.hn,
          options: {},
          classInstance: this,
          eventTargetDom
        }
      ]);
      this.cn = this.qm;
      this.jn();
      this.kn();
    }
    if (this.wm === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_ROTATION);
      this.Qm = false;
      _RotationGizmo.Nm = "none";
    }
    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_ROTATION, flg);
    this.xm(flg);
  }
  setSpace(space) {
    _RotationGizmo.$m = space;
    if (this.wm) {
      this.kn();
    }
  }
  ///
  ///
  /// Public Methods
  ///
  ///
  _setup() {
    if (this.rm()) {
      return;
    }
    const targetSceneGraph = this.qm.getSceneGraph();
    if (!targetSceneGraph) {
      return;
    }
    this.pm = createGroupEntity(this.c);
    this.pm.tryToSetUniqueName(`RotationGizmo_of_${this.qm.uniqueName}`, true);
    this.pm.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.pm.getSceneGraph());
    let resources = _RotationGizmo.Pm(this.c);
    if (!resources) {
      resources = this.Cn();
      _RotationGizmo._m.set(this.c.objectUID, resources);
    }
    this.jn();
    this.cn = this.qm;
    this.setGizmoTag();
    this.pm.tryToSetTag({ tag: "Gizmo", value: "Rotation" });
    this._update();
  }
  /**
   * Creates all resources needed for the gizmo.
   */
  Cn() {
    const xRingEntity = createMeshEntity(this.c);
    xRingEntity.tryToSetUniqueName("RotationGizmo_xRing", true);
    const xRingMaterial = _RotationGizmo.dn(this.c, Vector4.fromCopyArray4([1, 0, 0, 0.85]));
    const xRingMesh = new Mesh(this.c);
    const xRingPrimitive = _RotationGizmo.en(this.c, "x", xRingMaterial);
    xRingMesh.addPrimitive(xRingPrimitive);
    xRingEntity.getMesh().setMesh(xRingMesh);
    const yRingEntity = createMeshEntity(this.c);
    yRingEntity.tryToSetUniqueName("RotationGizmo_yRing", true);
    const yRingMaterial = _RotationGizmo.dn(this.c, Vector4.fromCopyArray4([0, 1, 0, 0.85]));
    const yRingMesh = new Mesh(this.c);
    const yRingPrimitive = _RotationGizmo.en(this.c, "y", yRingMaterial);
    yRingMesh.addPrimitive(yRingPrimitive);
    yRingEntity.getMesh().setMesh(yRingMesh);
    const zRingEntity = createMeshEntity(this.c);
    zRingEntity.tryToSetUniqueName("RotationGizmo_zRing", true);
    const zRingMaterial = _RotationGizmo.dn(this.c, Vector4.fromCopyArray4([0, 0, 1, 0.85]));
    const zRingMesh = new Mesh(this.c);
    const zRingPrimitive = _RotationGizmo.en(this.c, "z", zRingMaterial);
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
    if (!Is.exist(this.pm)) {
      return;
    }
    const sg = this.qm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    const worldPosition = aabb.isVanilla() ? sg.position : aabb.centerPoint;
    const transform = this.pm.getTransform();
    transform.localPosition = worldPosition;
    const uniform = Gizmo.zm(this.c, worldPosition, _RotationGizmo.an);
    transform.localScale = Vector3.fromCopy3(uniform, uniform, uniform);
    this.ym();
    if (this.Qm && _RotationGizmo.Nm !== "none") {
      if (this.cn === this.qm) {
        this.qm.getTransform().localRotation = Quaternion.fromCopyQuaternion(this.Wm);
      }
    }
  }
  _destroy() {
    this.sm();
  }
  ///
  ///
  /// Private helpers
  ///
  ///
  jn() {
    const resources = _RotationGizmo.Pm(this.c);
    if (!Is.exist(this.pm) || !resources) {
      return;
    }
    const topSceneGraph = this.pm.getSceneGraph();
    const groupSceneGraph = resources.groupEntity.getSceneGraph();
    topSceneGraph.addChild(groupSceneGraph);
    groupSceneGraph.addChild(resources.xRingEntity.getSceneGraph());
    groupSceneGraph.addChild(resources.yRingEntity.getSceneGraph());
    groupSceneGraph.addChild(resources.zRingEntity.getSceneGraph());
  }
  kn() {
    const resources = _RotationGizmo.Pm(this.c);
    if (!resources) {
      return;
    }
    if (_RotationGizmo.$m === "local") {
      const quaternion = _RotationGizmo.gn;
      const parent = this.qm.getSceneGraph().parent;
      if (Is.exist(parent)) {
        parent.getQuaternionRecursivelyTo(quaternion);
      } else {
        quaternion.identity();
      }
      resources.groupEntity.getTransform().localRotation = quaternion;
    } else {
      resources.groupEntity.getTransform().localRotation = _RotationGizmo.gn.identity();
    }
  }
  yn(evt) {
    this.Qm = true;
    this.Vm = void 0;
    this.Rm.setComponents(0, 0);
    this.Om.setComponents(0, 0);
    this.Tm = 0;
    this.Um = 0;
    this.Ym.setComponents(0, 0, 0);
    const { xResult, yResult, zResult } = _RotationGizmo.Dn(this.c, evt, true);
    _RotationGizmo.Nm = "none";
    const picked = _RotationGizmo.En([
      { axis: "x", result: xResult },
      { axis: "y", result: yResult },
      { axis: "z", result: zResult }
    ]);
    if (picked) {
      assertExist(picked.result.data);
      this.bn = Vector3.normalize(_RotationGizmo.Fn(picked.result.data.position, picked.axis));
      _RotationGizmo.Nm = picked.axis;
    }
    if (_RotationGizmo.Nm === "none") {
      this.Qm = false;
      return;
    }
    evt.preventDefault();
    this.Gn();
    this.Sm = Quaternion.fromCopyQuaternion(this.qm.getTransform().localRotation);
    this.Wm = Quaternion.fromCopyQuaternion(this.Sm);
    this.Hn(evt, _RotationGizmo.Nm);
  }
  An(evt) {
    evt.preventDefault();
    if (Is.false(this.Qm)) {
      return;
    }
    const activeAxis = _RotationGizmo.Nm;
    if (activeAxis === "none") {
      return;
    }
    this.In(evt);
  }
  Bn(evt) {
    evt.preventDefault();
    this.Qm = false;
    _RotationGizmo.Nm = "none";
    this.Jn();
    this.bn = Vector3.zero();
    this.Sm = Quaternion.fromCopyQuaternion(this.qm.getTransform().localRotation);
    this.Wm = Quaternion.fromCopyQuaternion(this.Sm);
    this.Vm = void 0;
    this.Rm.setComponents(0, 0);
    this.Om.setComponents(0, 0);
    this.Ym.setComponents(0, 0, 0);
    this.Tm = 0;
    this.Um = 0;
  }
  Hn(evt, axis) {
    var _a;
    const resources = _RotationGizmo.Pm(this.c);
    if (!resources) {
      return;
    }
    this.Om.setComponents(0, 0);
    const element = this.Kn(evt);
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
      this.Vm = element;
    } else {
      this.Vm = void 0;
    }
    this.Rm.setComponents(pointerX, pointerY);
    this.Tm = 2 * Math.PI / Math.max(width, height, 1);
    this.Um = 0;
    const axisForQuat = this.Ln(axis);
    Vector3.normalizeTo(axisForQuat, this.Ym);
    const activeCamera = this.c.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.c)
    );
    const groupSceneGraph = (_a = resources.groupEntity) == null ? void 0 : _a.getSceneGraph();
    if (!element || !activeCamera || !groupSceneGraph) {
      this.Zm(axis);
      return;
    }
    const axisLocal = _RotationGizmo.fn(axis);
    const tangentLocal = Vector3.crossTo(this.bn, axisLocal, _RotationGizmo.vn);
    if (tangentLocal.lengthSquared() < 1e-10) {
      this.Mn(axis, tangentLocal);
    }
    Vector3.normalizeTo(tangentLocal, tangentLocal);
    const tangentWorld = this.ln(tangentLocal, _RotationGizmo.wn);
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.Nn(axisLocal, activeCamera, tangentWorld);
    }
    if (tangentWorld.lengthSquared() < 1e-10) {
      this.Zm(axis);
      return;
    }
    Vector3.normalizeTo(tangentWorld, tangentWorld);
    const centerWorld = groupSceneGraph.matrixInner.getTranslateTo(_RotationGizmo.un);
    const pvMatrix = MutableMatrix44.multiplyTo(
      activeCamera.projectionMatrix,
      activeCamera.viewMatrix,
      _RotationGizmo.on
    );
    const clipCenter = pvMatrix.multiplyVectorTo(
      _RotationGizmo.pn.setComponents(centerWorld.x, centerWorld.y, centerWorld.z, 1),
      _RotationGizmo.rn
    );
    const clipTangent = pvMatrix.multiplyVectorTo(
      _RotationGizmo.qn.setComponents(
        centerWorld.x + tangentWorld.x,
        centerWorld.y + tangentWorld.y,
        centerWorld.z + tangentWorld.z,
        1
      ),
      _RotationGizmo.sn
    );
    const w0 = clipCenter.w;
    const w1 = clipTangent.w;
    if (w0 === 0 || w1 === 0) {
      this.Zm(axis);
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
      this.Zm(axis);
      return;
    }
    this.Om.setComponents(screenTangentX / length, screenTangentY / length);
  }
  Zm(axis) {
    if (axis === "x") {
      this.Om.setComponents(0, -1);
    } else if (axis === "y") {
      this.Om.setComponents(1, 0);
    } else {
      this.Om.setComponents(1, 0);
    }
  }
  Mn(axis, out) {
    if (axis === "x") {
      out.setComponents(0, 0, 1);
    } else if (axis === "y") {
      out.setComponents(0, 0, 1);
    } else {
      out.setComponents(0, 1, 0);
    }
  }
  Nn(axisLocal, camera, out) {
    const axisWorld = this.ln(axisLocal, _RotationGizmo.tn);
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
      this.On(axisWorld, out);
    }
  }
  On(axis, out) {
    if (Math.abs(axis.x) < 0.9) {
      out.setComponents(0, -axis.z, axis.y);
    } else {
      out.setComponents(-axis.y, axis.x, 0);
    }
    if (out.lengthSquared() < 1e-10) {
      out.setComponents(1, 0, 0);
    }
  }
  In(evt) {
    const element = this.Vm;
    if (!element || this.Tm === 0) {
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const currentX = evt.clientX - rect.left;
    const currentY = evt.clientY - rect.top;
    const deltaX = currentX - this.Rm.x;
    const deltaY = currentY - this.Rm.y;
    this.Rm.setComponents(currentX, currentY);
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      return;
    }
    if (deltaX === 0 && deltaY === 0) {
      return;
    }
    const scalar = -deltaX * this.Om.x - deltaY * this.Om.y;
    if (scalar === 0) {
      return;
    }
    const deltaAngle = scalar * this.Tm;
    if (!Number.isFinite(deltaAngle) || deltaAngle === 0) {
      return;
    }
    this.Um += deltaAngle;
    const deltaQuat = Quaternion.fromAxisAngle(this.Ym, this.Um);
    this.Wm = Quaternion.multiply(deltaQuat, this.Sm);
    this._update();
  }
  ln(vec, out) {
    var _a;
    const resources = _RotationGizmo.Pm(this.c);
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
  Kn(evt) {
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
  Gn() {
    if (this.Xm) {
      return;
    }
    InputManager.disableCameraController();
    this.Xm = true;
  }
  Jn() {
    if (!this.Xm) {
      return;
    }
    InputManager.enableCameraController();
    this.Xm = false;
  }
  static Fn(position, axis) {
    switch (axis) {
      case "x":
        return Vector3.fromCopy3(0, position.y, position.z);
      case "y":
        return Vector3.fromCopy3(position.x, 0, position.z);
      default:
        return Vector3.fromCopy3(position.x, position.y, 0);
    }
  }
  Ln(axis) {
    const parent = this.qm.getSceneGraph().parent;
    if (_RotationGizmo.$m === "local" || Is.not.exist(parent)) {
      return _RotationGizmo.fn(axis);
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
    return invRot.multiplyVector(_RotationGizmo.fn(axis));
  }
  static fn(axis) {
    switch (axis) {
      case "x":
        return _RotationGizmo.mn;
      case "y":
        return _RotationGizmo.Cm;
      default:
        return _RotationGizmo.nn;
    }
  }
  static Dn(engine, evt, local = false) {
    const resources = _RotationGizmo.Pm(engine);
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
    const caster = local ? _RotationGizmo.Pn : _RotationGizmo.Qn;
    if (Is.not.exist(activeCamera)) {
      return { xResult: empty, yResult: empty, zResult: empty };
    }
    const xResult = caster(x, y, activeCamera, viewport, resources.xRingEntity);
    const yResult = caster(x, y, activeCamera, viewport, resources.yRingEntity);
    const zResult = caster(x, y, activeCamera, viewport, resources.zRingEntity);
    return { xResult, yResult, zResult };
  }
  static Qn(x, y, camera, viewport, ...entities) {
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
  static Pn(x, y, camera, viewport, ...entities) {
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
  static en(engine, axis, material) {
    const radius = _RotationGizmo.Lm;
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
  static En(candidates) {
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
  static dn(engine, color) {
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
    _RotationGizmo._m.delete(engine.objectUID);
    _RotationGizmo.Nm = "none";
  }
};
/** Resources managed per-Engine instance */
_RotationGizmo._m = /* @__PURE__ */ new Map();
_RotationGizmo.Nm = "none";
_RotationGizmo.$m = "world";
_RotationGizmo.Lm = 1;
/** Gizmo size as a fraction of the viewport height (ring radius). */
_RotationGizmo.an = 0.08;
_RotationGizmo.mn = Vector3.fromCopy3(1, 0, 0);
_RotationGizmo.Cm = Vector3.fromCopy3(0, 1, 0);
_RotationGizmo.nn = Vector3.fromCopy3(0, 0, 1);
_RotationGizmo.zc = MutableMatrix44.zero();
_RotationGizmo.Ic = MutableMatrix44.zero();
_RotationGizmo.on = MutableMatrix44.zero();
_RotationGizmo.pn = MutableVector4.zero();
_RotationGizmo.qn = MutableVector4.zero();
_RotationGizmo.rn = MutableVector4.zero();
_RotationGizmo.sn = MutableVector4.zero();
_RotationGizmo.Hc = MutableVector3.zero();
_RotationGizmo.Dc = MutableVector3.zero();
_RotationGizmo.Ec = MutableVector3.zero();
_RotationGizmo.Rn = MutableVector3.zero();
_RotationGizmo.Sn = MutableVector3.zero();
_RotationGizmo.Tn = MutableVector3.zero();
_RotationGizmo.tn = MutableVector3.zero();
_RotationGizmo.un = MutableVector3.zero();
_RotationGizmo.vn = MutableVector3.zero();
_RotationGizmo.wn = MutableVector3.zero();
/** Reusable quaternion for world-rotation calculations (avoids per-frame allocations) */
_RotationGizmo.gn = MutableQuaternion.identity();
var RotationGizmo = _RotationGizmo;
export {
  RotationGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL1JvdGF0aW9uR2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVNZXNoRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvY3JlYXRlTWVzaEVudGl0eSc7XG5pbXBvcnQgeyBjcmVhdGVHcm91cEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9jcmVhdGVHcm91cEVudGl0eSc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gJy4uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHsgUmluZyB9IGZyb20gJy4uL2dlb21ldHJ5L3NoYXBlcy9SaW5nJztcbmltcG9ydCB0eXBlIHsgUmF5Y2FzdFJlc3VsdEV4MSB9IGZyb20gJy4uL2dlb21ldHJ5L3R5cGVzL0dlb21ldHJ5VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBJTWVzaEVudGl0eSwgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsIH0gZnJvbSAnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTWF0cml4MzMnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL1F1YXRlcm5pb24nO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBhc3NlcnRFeGlzdCB9IGZyb20gJy4uL21pc2MvTWlzY1V0aWwnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IGdldEV2ZW50LCBJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19ST1RBVElPTiwgSW5wdXRNYW5hZ2VyIH0gZnJvbSAnLi4vc3lzdGVtL0lucHV0TWFuYWdlcic7XG5pbXBvcnQgeyBHaXptbyB9IGZyb20gJy4vR2l6bW8nO1xuXG5kZWNsYXJlIGxldCB3aW5kb3c6IGFueTtcblxudHlwZSBBeGlzID0gJ3gnIHwgJ3knIHwgJ3onO1xuXG4vKipcbiAqIEludGVybmFsIHJlc291cmNlcyBmb3IgUm90YXRpb25HaXptbywgbWFuYWdlZCBwZXItRW5naW5lLlxuICogQGludGVybmFsXG4gKi9cbmludGVyZmFjZSBSb3RhdGlvbkdpem1vUmVzb3VyY2VzIHtcbiAgZ3JvdXBFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5O1xuICB4UmluZ0VudGl0eTogSU1lc2hFbnRpdHk7XG4gIHlSaW5nRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgelJpbmdFbnRpdHk6IElNZXNoRW50aXR5O1xuICB4UmluZ01lc2g6IE1lc2g7XG4gIHlSaW5nTWVzaDogTWVzaDtcbiAgelJpbmdNZXNoOiBNZXNoO1xuICB4UmluZ01hdGVyaWFsOiBNYXRlcmlhbDtcbiAgeVJpbmdNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHpSaW5nTWF0ZXJpYWw6IE1hdGVyaWFsO1xuICB4UmluZ1ByaW1pdGl2ZTogUmluZztcbiAgeVJpbmdQcmltaXRpdmU6IFJpbmc7XG4gIHpSaW5nUHJpbWl0aXZlOiBSaW5nO1xufVxuXG4vKipcbiAqIFJvdGF0aW9uR2l6bW8gcHJvdmlkZXMgaW50ZXJhY3RpdmUgcm90YXRpb24gcmluZ3MgZm9yIG1hbmlwdWxhdGluZyBlbnRpdHkgb3JpZW50YXRpb24uXG4gKiBJdCBvZmZlcnMgdGhyZWUgY29sb3ItY29kZWQgcmluZ3MgKFg6IHJlZCwgWTogZ3JlZW4sIFo6IGJsdWUpIHRoYXQgcmVzcG9uZCB0byBwb2ludGVyXG4gKiBkcmFnIG9wZXJhdGlvbnMgYm90aCBpbiB3b3JsZCBzcGFjZSBhbmQgaW4gbG9jYWwgc3BhY2UgYWxpZ25lZCB0byB0aGUgdGFyZ2V0IGhpZXJhcmNoeS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdGF0aW9uR2l6bW8gZXh0ZW5kcyBHaXptbyB7XG4gIC8qKiBSZXNvdXJjZXMgbWFuYWdlZCBwZXItRW5naW5lIGluc3RhbmNlICovXG4gIHByaXZhdGUgc3RhdGljIF9fcmVzb3VyY2VzTWFwOiBNYXA8bnVtYmVyLCBSb3RhdGlvbkdpem1vUmVzb3VyY2VzPiA9IG5ldyBNYXAoKTtcblxuICBwcml2YXRlIHN0YXRpYyBfX2FjdGl2ZUF4aXM6IEF4aXMgfCAnbm9uZScgPSAnbm9uZSc7XG4gIHByaXZhdGUgc3RhdGljIF9fc3BhY2U6ICdsb2NhbCcgfCAnd29ybGQnID0gJ3dvcmxkJztcbiAgcHJpdmF0ZSBzdGF0aWMgX19sZW5ndGggPSAxO1xuICAvKiogR2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgKHJpbmcgcmFkaXVzKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zY3JlZW5TcGFjZVJhdGlvID0gMC4wODtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX191bml0WCA9IFZlY3RvcjMuZnJvbUNvcHkzKDEsIDAsIDApO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3VuaXRZID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdW5pdFogPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAxKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8wID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8xID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBNYXRyaXg0NF8yID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3I0XzAgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yNF8xID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjRfMiA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3I0XzMgPSBNdXRhYmxlVmVjdG9yNC56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18wID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfMSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzIgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18zID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfNCA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzUgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM182ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfNyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzggPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM185ID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAvKiogUmV1c2FibGUgcXVhdGVybmlvbiBmb3Igd29ybGQtcm90YXRpb24gY2FsY3VsYXRpb25zIChhdm9pZHMgcGVyLWZyYW1lIGFsbG9jYXRpb25zKSAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFF1YXRlcm5pb25fMCA9IE11dGFibGVRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG5cbiAgcHJpdmF0ZSBfX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3N0YXJ0VmVjdG9yID0gVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19kZWx0YVF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX190YXJnZXRSb3RhdGlvbkJhY2t1cCA9IFF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBfX2xhdGVzdFRhcmdldEVudGl0eT86IElTY2VuZUdyYXBoRW50aXR5O1xuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bkZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyRG93bi5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyTW92ZUZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyTW92ZS5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyVXBGdW5jID0gdGhpcy5fX29uUG9pbnRlclVwLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcG9pbnRlclByZXYgPSBNdXRhYmxlVmVjdG9yMi56ZXJvKCk7XG4gIHByaXZhdGUgX19kcmFnU2NyZWVuRGlyZWN0aW9uID0gTXV0YWJsZVZlY3RvcjIuemVybygpO1xuICBwcml2YXRlIF9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbiA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2RyYWdTY2FsZSA9IDA7XG4gIHByaXZhdGUgX19hY2N1bXVsYXRlZEFuZ2xlID0gMDtcbiAgcHJpdmF0ZSBfX2FjdGl2ZVBvaW50ZXJFbGVtZW50PzogSFRNTEVsZW1lbnQ7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlc291cmNlcyBmb3IgYSBzcGVjaWZpYyBlbmdpbmUsIG9yIHVuZGVmaW5lZCBpZiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJlc291cmNlcyhlbmdpbmU6IEVuZ2luZSk6IFJvdGF0aW9uR2l6bW9SZXNvdXJjZXMgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBSb3RhdGlvbkdpem1vLl9fcmVzb3VyY2VzTWFwLmdldChlbmdpbmUub2JqZWN0VUlEKTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgZ2V0IGlzU2V0dXAoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIElzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJpbmcgcmFkaXVzIG9mIHRoZSBnaXptby5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSByaW5nIHJhZGl1cyB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgb25seSBhZmZlY3RzIHRoZSBnZW9tZXRyeSBnZW5lcmF0ZWRcbiAgICogYmVmb3JlIHRoZSBnaXptbyByZXNvdXJjZXMgYXJlIGNyZWF0ZWQuXG4gICAqL1xuICBzZXQgbGVuZ3RoKHZhbDogbnVtYmVyKSB7XG4gICAgUm90YXRpb25HaXptby5fX2xlbmd0aCA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByaW5nIHJhZGl1cyBvZiB0aGUgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRoZSByaW5nIHJhZGl1cyB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgb25seSBhZmZlY3RzIHRoZSBnZW9tZXRyeSBnZW5lcmF0ZWRcbiAgICogYmVmb3JlIHRoZSBnaXptbyByZXNvdXJjZXMgYXJlIGNyZWF0ZWQuXG4gICAqL1xuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX19sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZ2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIFRoZSB1bml0IHJpbmcgcmFkaXVzIGlzIHByb2plY3RlZCB0byB0aGlzIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgcmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCAoZm9yIGV4YW1wbGUsIDAuMDggZm9yIDglKVxuICAgKi9cbiAgc2V0IHNjcmVlblNwYWNlUmF0aW8odmFsOiBudW1iZXIpIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fc2NyZWVuU3BhY2VSYXRpbyA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnaXptbyBzaXplIGFzIGEgZnJhY3Rpb24gb2YgdGhlIHZpZXdwb3J0IGhlaWdodC5cbiAgICogQHJldHVybnMgVGhlIHJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgb2NjdXBpZWQgYnkgdGhlIGdpem1vJ3MgdW5pdCByaW5nIHJhZGl1c1xuICAgKi9cbiAgZ2V0IHNjcmVlblNwYWNlUmF0aW8oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUm90YXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW87XG4gIH1cblxuICBnZXQgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNWaXNpYmxlO1xuICB9XG5cbiAgc2V0IGlzVmlzaWJsZShmbGc6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXNvdXJjZXMgPSBSb3RhdGlvbkdpem1vLl9fZ2V0UmVzb3VyY2VzKHRoaXMuX19lbmdpbmUpO1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX19pc1Zpc2libGUgPT09IGZhbHNlICYmIGZsZyA9PT0gdHJ1ZSkge1xuICAgICAgbGV0IGV2ZW50VGFyZ2V0RG9tID0gd2luZG93O1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tKSkge1xuICAgICAgICBldmVudFRhcmdldERvbSA9IHRoaXMuX19lbmdpbmUuY29uZmlnLmV2ZW50VGFyZ2V0RG9tO1xuICAgICAgfVxuICAgICAgSW5wdXRNYW5hZ2VyLnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OLCBbXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6IGdldEV2ZW50KCdzdGFydCcpLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19vblBvaW50ZXJEb3duRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnbW92ZScpLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19vblBvaW50ZXJNb3ZlRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnZW5kJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAncG9pbnRlcmxlYXZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fb25Qb2ludGVyVXBGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHt9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICBdKTtcblxuICAgICAgdGhpcy5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG4gICAgICB0aGlzLl9fYXR0YWNoU2hhcmVkR3JvdXAoKTtcbiAgICAgIHRoaXMuX19hcHBseVNwYWNlVG9Hcm91cCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9faXNWaXNpYmxlID09PSB0cnVlICYmIGZsZyA9PT0gZmFsc2UpIHtcbiAgICAgIElucHV0TWFuYWdlci51bnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OKTtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICB9XG5cbiAgICBJbnB1dE1hbmFnZXIuc2V0QWN0aXZlKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1JPVEFUSU9OLCBmbGcpO1xuICAgIHRoaXMuX19zZXRWaXNpYmxlKGZsZyk7XG4gIH1cblxuICBzZXRTcGFjZShzcGFjZTogJ2xvY2FsJyB8ICd3b3JsZCcpIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fc3BhY2UgPSBzcGFjZTtcbiAgICBpZiAodGhpcy5fX2lzVmlzaWJsZSkge1xuICAgICAgdGhpcy5fX2FwcGx5U3BhY2VUb0dyb3VwKCk7XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHVibGljIE1ldGhvZHNcbiAgLy8vXG4gIC8vL1xuXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXJnZXRTY2VuZUdyYXBoID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCk7XG4gICAgaWYgKCF0YXJnZXRTY2VuZUdyYXBoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX3RvcEVudGl0eSA9IGNyZWF0ZUdyb3VwRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKGBSb3RhdGlvbkdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpIS50b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gdHJ1ZTtcbiAgICB0YXJnZXRTY2VuZUdyYXBoLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpISk7XG5cbiAgICAvLyBDaGVjayBpZiByZXNvdXJjZXMgYWxyZWFkeSBleGlzdCBmb3IgdGhpcyBlbmdpbmVcbiAgICBsZXQgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgLy8gQ3JlYXRlIHJlc291cmNlcyBmb3IgdGhpcyBlbmdpbmVcbiAgICAgIHJlc291cmNlcyA9IHRoaXMuX19jcmVhdGVSZXNvdXJjZXMoKTtcbiAgICAgIFJvdGF0aW9uR2l6bW8uX19yZXNvdXJjZXNNYXAuc2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlELCByZXNvdXJjZXMpO1xuICAgIH1cblxuICAgIHRoaXMuX19hdHRhY2hTaGFyZWRHcm91cCgpO1xuICAgIHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPSB0aGlzLl9fdGFyZ2V0O1xuXG4gICAgdGhpcy5zZXRHaXptb1RhZygpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6ICdHaXptbycsIHZhbHVlOiAnUm90YXRpb24nIH0pO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYWxsIHJlc291cmNlcyBuZWVkZWQgZm9yIHRoZSBnaXptby5cbiAgICovXG4gIHByaXZhdGUgX19jcmVhdGVSZXNvdXJjZXMoKTogUm90YXRpb25HaXptb1Jlc291cmNlcyB7XG4gICAgLy8gWCByaW5nXG4gICAgY29uc3QgeFJpbmdFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHhSaW5nRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnUm90YXRpb25HaXptb194UmluZycsIHRydWUpO1xuICAgIGNvbnN0IHhSaW5nTWF0ZXJpYWwgPSBSb3RhdGlvbkdpem1vLl9fY3JlYXRlUmluZ01hdGVyaWFsKHRoaXMuX19lbmdpbmUsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzEsIDAsIDAsIDAuODVdKSk7XG4gICAgY29uc3QgeFJpbmdNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgeFJpbmdQcmltaXRpdmUgPSBSb3RhdGlvbkdpem1vLl9fY3JlYXRlUmluZ1ByaW1pdGl2ZSh0aGlzLl9fZW5naW5lLCAneCcsIHhSaW5nTWF0ZXJpYWwpO1xuICAgIHhSaW5nTWVzaC5hZGRQcmltaXRpdmUoeFJpbmdQcmltaXRpdmUpO1xuICAgIHhSaW5nRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHhSaW5nTWVzaCk7XG5cbiAgICAvLyBZIHJpbmdcbiAgICBjb25zdCB5UmluZ0VudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgeVJpbmdFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdSb3RhdGlvbkdpem1vX3lSaW5nJywgdHJ1ZSk7XG4gICAgY29uc3QgeVJpbmdNYXRlcmlhbCA9IFJvdGF0aW9uR2l6bW8uX19jcmVhdGVSaW5nTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSwgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMCwgMSwgMCwgMC44NV0pKTtcbiAgICBjb25zdCB5UmluZ01lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB5UmluZ1ByaW1pdGl2ZSA9IFJvdGF0aW9uR2l6bW8uX19jcmVhdGVSaW5nUHJpbWl0aXZlKHRoaXMuX19lbmdpbmUsICd5JywgeVJpbmdNYXRlcmlhbCk7XG4gICAgeVJpbmdNZXNoLmFkZFByaW1pdGl2ZSh5UmluZ1ByaW1pdGl2ZSk7XG4gICAgeVJpbmdFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeVJpbmdNZXNoKTtcblxuICAgIC8vIFogcmluZ1xuICAgIGNvbnN0IHpSaW5nRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB6UmluZ0VudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1JvdGF0aW9uR2l6bW9felJpbmcnLCB0cnVlKTtcbiAgICBjb25zdCB6UmluZ01hdGVyaWFsID0gUm90YXRpb25HaXptby5fX2NyZWF0ZVJpbmdNYXRlcmlhbCh0aGlzLl9fZW5naW5lLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLCAwLCAxLCAwLjg1XSkpO1xuICAgIGNvbnN0IHpSaW5nTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHpSaW5nUHJpbWl0aXZlID0gUm90YXRpb25HaXptby5fX2NyZWF0ZVJpbmdQcmltaXRpdmUodGhpcy5fX2VuZ2luZSwgJ3onLCB6UmluZ01hdGVyaWFsKTtcbiAgICB6UmluZ01lc2guYWRkUHJpbWl0aXZlKHpSaW5nUHJpbWl0aXZlKTtcbiAgICB6UmluZ0VudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh6UmluZ01lc2gpO1xuXG4gICAgLy8gR3JvdXAgZW50aXR5XG4gICAgY29uc3QgZ3JvdXBFbnRpdHkgPSBjcmVhdGVHcm91cEVudGl0eSh0aGlzLl9fZW5naW5lKTtcblxuICAgIHJldHVybiB7XG4gICAgICBncm91cEVudGl0eSxcbiAgICAgIHhSaW5nRW50aXR5LFxuICAgICAgeVJpbmdFbnRpdHksXG4gICAgICB6UmluZ0VudGl0eSxcbiAgICAgIHhSaW5nTWVzaCxcbiAgICAgIHlSaW5nTWVzaCxcbiAgICAgIHpSaW5nTWVzaCxcbiAgICAgIHhSaW5nTWF0ZXJpYWwsXG4gICAgICB5UmluZ01hdGVyaWFsLFxuICAgICAgelJpbmdNYXRlcmlhbCxcbiAgICAgIHhSaW5nUHJpbWl0aXZlLFxuICAgICAgeVJpbmdQcmltaXRpdmUsXG4gICAgICB6UmluZ1ByaW1pdGl2ZSxcbiAgICB9O1xuICB9XG5cbiAgX3VwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAoIUlzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2cgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKSE7XG4gICAgY29uc3QgYWFiYiA9IHNnLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICAvLyBHaXptbyBlbnRpdGllcyBhcmUgYXR0YWNoZWQgd2l0aCB0b01ha2VXb3JsZE1hdHJpeFRoZVNhbWVBc0xvY2FsTWF0cml4ID0gdHJ1ZSxcbiAgICAvLyBzbyBsb2NhbCB2YWx1ZXMgYXJlIHdvcmxkIHZhbHVlcyBoZXJlLlxuICAgIGNvbnN0IHdvcmxkUG9zaXRpb24gPSBhYWJiLmlzVmFuaWxsYSgpID8gc2cucG9zaXRpb24gOiBhYWJiLmNlbnRlclBvaW50O1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhO1xuICAgIHRyYW5zZm9ybS5sb2NhbFBvc2l0aW9uID0gd29ybGRQb3NpdGlvbjtcblxuICAgIC8vIEtlZXAgdGhlIGdpem1vIGF0IGEgY29uc3RhbnQgc2l6ZSBvbiBzY3JlZW4gcmVnYXJkbGVzcyBvZiB0aGUgdGFyZ2V0IHNpemUuXG4gICAgY29uc3QgdW5pZm9ybSA9IEdpem1vLl9fY2FsY1NjcmVlblNwYWNlU2NhbGUodGhpcy5fX2VuZ2luZSwgd29ybGRQb3NpdGlvbiwgUm90YXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW8pO1xuICAgIHRyYW5zZm9ybS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTModW5pZm9ybSwgdW5pZm9ybSwgdW5pZm9ybSk7XG4gICAgLy8gUmVmbGVjdCB0aGUgbmV3IHNjYWxlIGluIHRoZSBzYW1lIGZyYW1lLiBUaGUgUmVuZGVyIHN0YWdlIHVwbG9hZHMgdGhlIGluc3RhbmNlIGRhdGFcbiAgICAvLyBiZWZvcmUgdGhlIG1hdHJpY2VzIHdvdWxkIGJlIHJlY2FsY3VsYXRlZCBsYXppbHksIHNvIG1hdGVyaWFsaXplIHRoZW0gbm93LlxuICAgIHRoaXMuX191cGRhdGVXb3JsZE1hdHJpY2VzT2ZTdWJ0cmVlKCk7XG5cbiAgICBpZiAodGhpcy5fX2lzUG9pbnRlckRvd24gJiYgUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXMgIT09ICdub25lJykge1xuICAgICAgaWYgKHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPT09IHRoaXMuX190YXJnZXQpIHtcbiAgICAgICAgdGhpcy5fX3RhcmdldC5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gUXVhdGVybmlvbi5mcm9tQ29weVF1YXRlcm5pb24odGhpcy5fX2RlbHRhUXVhdGVybmlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5fX2Rlc3Ryb3lUb3BFbnRpdHkoKTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIFByaXZhdGUgaGVscGVyc1xuICAvLy9cbiAgLy8vXG5cbiAgcHJpdmF0ZSBfX2F0dGFjaFNoYXJlZEdyb3VwKCkge1xuICAgIGNvbnN0IHJlc291cmNlcyA9IFJvdGF0aW9uR2l6bW8uX19nZXRSZXNvdXJjZXModGhpcy5fX2VuZ2luZSk7XG4gICAgaWYgKCFJcy5leGlzdCh0aGlzLl9fdG9wRW50aXR5KSB8fCAhcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRvcFNjZW5lR3JhcGggPSB0aGlzLl9fdG9wRW50aXR5IS5nZXRTY2VuZUdyYXBoKCk7XG4gICAgY29uc3QgZ3JvdXBTY2VuZUdyYXBoID0gcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFNjZW5lR3JhcGgoKTtcbiAgICB0b3BTY2VuZUdyYXBoLmFkZENoaWxkKGdyb3VwU2NlbmVHcmFwaCk7XG4gICAgZ3JvdXBTY2VuZUdyYXBoLmFkZENoaWxkKHJlc291cmNlcy54UmluZ0VudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgIGdyb3VwU2NlbmVHcmFwaC5hZGRDaGlsZChyZXNvdXJjZXMueVJpbmdFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICBncm91cFNjZW5lR3JhcGguYWRkQ2hpbGQocmVzb3VyY2VzLnpSaW5nRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gIH1cblxuICBwcml2YXRlIF9fYXBwbHlTcGFjZVRvR3JvdXAoKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gUm90YXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChSb3RhdGlvbkdpem1vLl9fc3BhY2UgPT09ICdsb2NhbCcpIHtcbiAgICAgIGNvbnN0IHF1YXRlcm5pb24gPSBSb3RhdGlvbkdpem1vLl9fdG1wUXVhdGVybmlvbl8wO1xuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkucGFyZW50O1xuICAgICAgaWYgKElzLmV4aXN0KHBhcmVudCkpIHtcbiAgICAgICAgcGFyZW50LmdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKHF1YXRlcm5pb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICAgICAgfVxuICAgICAgcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb24gPSBxdWF0ZXJuaW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbiA9IFJvdGF0aW9uR2l6bW8uX190bXBRdWF0ZXJuaW9uXzAuaWRlbnRpdHkoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bihldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gdHJ1ZTtcbiAgICB0aGlzLl9fYWN0aXZlUG9pbnRlckVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3BvaW50ZXJQcmV2LnNldENvbXBvbmVudHMoMCwgMCk7XG4gICAgdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24uc2V0Q29tcG9uZW50cygwLCAwKTtcbiAgICB0aGlzLl9fZHJhZ1NjYWxlID0gMDtcbiAgICB0aGlzLl9fYWNjdW11bGF0ZWRBbmdsZSA9IDA7XG4gICAgdGhpcy5fX3JvdGF0aW9uQXhpc0ZvclF1YXRlcm5pb24uc2V0Q29tcG9uZW50cygwLCAwLCAwKTtcblxuICAgIGNvbnN0IHsgeFJlc3VsdCwgeVJlc3VsdCwgelJlc3VsdCB9ID0gUm90YXRpb25HaXptby5fX2Nhc3RSYXkodGhpcy5fX2VuZ2luZSwgZXZ0LCB0cnVlKTtcbiAgICBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcblxuICAgIGNvbnN0IHBpY2tlZCA9IFJvdGF0aW9uR2l6bW8uX19zZWxlY3RDbG9zZXN0QXhpcyhbXG4gICAgICB7IGF4aXM6ICd4JywgcmVzdWx0OiB4UmVzdWx0IH0sXG4gICAgICB7IGF4aXM6ICd5JywgcmVzdWx0OiB5UmVzdWx0IH0sXG4gICAgICB7IGF4aXM6ICd6JywgcmVzdWx0OiB6UmVzdWx0IH0sXG4gICAgXSk7XG5cbiAgICBpZiAocGlja2VkKSB7XG4gICAgICBhc3NlcnRFeGlzdChwaWNrZWQucmVzdWx0LmRhdGEpO1xuICAgICAgdGhpcy5fX3N0YXJ0VmVjdG9yID0gVmVjdG9yMy5ub3JtYWxpemUoUm90YXRpb25HaXptby5fX3Byb2plY3RUb1BsYW5lKHBpY2tlZC5yZXN1bHQuZGF0YS5wb3NpdGlvbiwgcGlja2VkLmF4aXMpKTtcbiAgICAgIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gcGlja2VkLmF4aXM7XG4gICAgfVxuXG4gICAgaWYgKFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID09PSAnbm9uZScpIHtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gT25seSBwcmV2ZW50IGRlZmF1bHQgYWZ0ZXIgY29uZmlybWluZyBhbiBheGlzIHdhcyBwaWNrZWRcbiAgICAvLyBUaGlzIGFsbG93cyBjYW1lcmEgY29udHJvbGxlciB0byBoYW5kbGUgZXZlbnRzIHdoZW4gZ2l6bW8gaXMgbm90IGJlaW5nIHVzZWRcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLl9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKTtcbiAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb25CYWNrdXAgPSBRdWF0ZXJuaW9uLmZyb21Db3B5UXVhdGVybmlvbih0aGlzLl9fdGFyZ2V0LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb24pO1xuICAgIHRoaXMuX19kZWx0YVF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLmZyb21Db3B5UXVhdGVybmlvbih0aGlzLl9fdGFyZ2V0Um90YXRpb25CYWNrdXApO1xuICAgIHRoaXMuX19wcmVwYXJlTGluZWFyRHJhZ01hcHBpbmcoZXZ0LCBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyk7XG4gIH1cblxuICBwcml2YXRlIF9fb25Qb2ludGVyTW92ZShldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChJcy5mYWxzZSh0aGlzLl9faXNQb2ludGVyRG93bikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhY3RpdmVBeGlzID0gUm90YXRpb25HaXptby5fX2FjdGl2ZUF4aXM7XG4gICAgaWYgKGFjdGl2ZUF4aXMgPT09ICdub25lJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19oYW5kbGVMaW5lYXJEcmFnKGV2dCk7XG4gIH1cblxuICBwcml2YXRlIF9fb25Qb2ludGVyVXAoZXZ0OiBQb2ludGVyRXZlbnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLl9faXNQb2ludGVyRG93biA9IGZhbHNlO1xuICAgIFJvdGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gJ25vbmUnO1xuICAgIHRoaXMuX19lbmFibGVDYW1lcmFDb250cm9sbGVySWZOZWVkZWQoKTtcbiAgICB0aGlzLl9fc3RhcnRWZWN0b3IgPSBWZWN0b3IzLnplcm8oKTtcbiAgICB0aGlzLl9fdGFyZ2V0Um90YXRpb25CYWNrdXAgPSBRdWF0ZXJuaW9uLmZyb21Db3B5UXVhdGVybmlvbih0aGlzLl9fdGFyZ2V0LmdldFRyYW5zZm9ybSgpLmxvY2FsUm90YXRpb24pO1xuICAgIHRoaXMuX19kZWx0YVF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLmZyb21Db3B5UXVhdGVybmlvbih0aGlzLl9fdGFyZ2V0Um90YXRpb25CYWNrdXApO1xuICAgIHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcG9pbnRlclByZXYuc2V0Q29tcG9uZW50cygwLCAwKTtcbiAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDAsIDApO1xuICAgIHRoaXMuX19yb3RhdGlvbkF4aXNGb3JRdWF0ZXJuaW9uLnNldENvbXBvbmVudHMoMCwgMCwgMCk7XG4gICAgdGhpcy5fX2RyYWdTY2FsZSA9IDA7XG4gICAgdGhpcy5fX2FjY3VtdWxhdGVkQW5nbGUgPSAwO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3ByZXBhcmVMaW5lYXJEcmFnTWFwcGluZyhldnQ6IFBvaW50ZXJFdmVudCwgYXhpczogQXhpcykge1xuICAgIGNvbnN0IHJlc291cmNlcyA9IFJvdGF0aW9uR2l6bW8uX19nZXRSZXNvdXJjZXModGhpcy5fX2VuZ2luZSk7XG4gICAgaWYgKCFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDAsIDApO1xuXG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX19yZXNvbHZlUG9pbnRlckVsZW1lbnQoZXZ0KTtcbiAgICBsZXQgd2lkdGggPSAxO1xuICAgIGxldCBoZWlnaHQgPSAxO1xuICAgIGxldCBwb2ludGVyWCA9IDA7XG4gICAgbGV0IHBvaW50ZXJZID0gMDtcbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgY29uc3QgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB3aWR0aCA9IHJlY3Qud2lkdGggfHwgZWxlbWVudC5jbGllbnRXaWR0aCB8fCAxO1xuICAgICAgaGVpZ2h0ID0gcmVjdC5oZWlnaHQgfHwgZWxlbWVudC5jbGllbnRIZWlnaHQgfHwgMTtcbiAgICAgIHBvaW50ZXJYID0gZXZ0LmNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgICBwb2ludGVyWSA9IGV2dC5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgICB0aGlzLl9fYWN0aXZlUG9pbnRlckVsZW1lbnQgPSBlbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fYWN0aXZlUG9pbnRlckVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy5fX3BvaW50ZXJQcmV2LnNldENvbXBvbmVudHMocG9pbnRlclgsIHBvaW50ZXJZKTtcbiAgICB0aGlzLl9fZHJhZ1NjYWxlID0gKDIgKiBNYXRoLlBJKSAvIE1hdGgubWF4KHdpZHRoLCBoZWlnaHQsIDEpO1xuICAgIHRoaXMuX19hY2N1bXVsYXRlZEFuZ2xlID0gMDtcblxuICAgIGNvbnN0IGF4aXNGb3JRdWF0ID0gdGhpcy5fX2dldEF4aXNGb3JRdWF0ZXJuaW9uKGF4aXMpO1xuICAgIFZlY3RvcjMubm9ybWFsaXplVG8oYXhpc0ZvclF1YXQsIHRoaXMuX19yb3RhdGlvbkF4aXNGb3JRdWF0ZXJuaW9uKTtcblxuICAgIGNvbnN0IGFjdGl2ZUNhbWVyYSA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50IHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGdyb3VwU2NlbmVHcmFwaCA9IHJlc291cmNlcy5ncm91cEVudGl0eT8uZ2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmICghZWxlbWVudCB8fCAhYWN0aXZlQ2FtZXJhIHx8ICFncm91cFNjZW5lR3JhcGgpIHtcbiAgICAgIHRoaXMuX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbihheGlzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBheGlzTG9jYWwgPSBSb3RhdGlvbkdpem1vLl9fZ2V0QXhpc1ZlY3RvcihheGlzKTtcbiAgICBjb25zdCB0YW5nZW50TG9jYWwgPSBWZWN0b3IzLmNyb3NzVG8odGhpcy5fX3N0YXJ0VmVjdG9yLCBheGlzTG9jYWwsIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3IzXzgpO1xuICAgIGlmICh0YW5nZW50TG9jYWwubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIHRoaXMuX19zZXRGYWxsYmFja0xvY2FsVGFuZ2VudChheGlzLCB0YW5nZW50TG9jYWwpO1xuICAgIH1cbiAgICBWZWN0b3IzLm5vcm1hbGl6ZVRvKHRhbmdlbnRMb2NhbCwgdGFuZ2VudExvY2FsKTtcblxuICAgIGNvbnN0IHRhbmdlbnRXb3JsZCA9IHRoaXMuX190cmFuc2Zvcm1EaXJlY3Rpb25Gcm9tR3JvdXBMb2NhbCh0YW5nZW50TG9jYWwsIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3IzXzkpO1xuICAgIGlmICh0YW5nZW50V29ybGQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIHRoaXMuX19zZXRGYWxsYmFja1dvcmxkRGlyZWN0aW9uKGF4aXNMb2NhbCwgYWN0aXZlQ2FtZXJhLCB0YW5nZW50V29ybGQpO1xuICAgIH1cbiAgICBpZiAodGFuZ2VudFdvcmxkLmxlbmd0aFNxdWFyZWQoKSA8IDFlLTEwKSB7XG4gICAgICB0aGlzLl9fc2V0RGVmYXVsdERyYWdEaXJlY3Rpb24oYXhpcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFZlY3RvcjMubm9ybWFsaXplVG8odGFuZ2VudFdvcmxkLCB0YW5nZW50V29ybGQpO1xuXG4gICAgY29uc3QgY2VudGVyV29ybGQgPSBncm91cFNjZW5lR3JhcGgubWF0cml4SW5uZXIuZ2V0VHJhbnNsYXRlVG8oUm90YXRpb25HaXptby5fX3RtcFZlY3RvcjNfNyk7XG4gICAgY29uc3QgcHZNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyhcbiAgICAgIGFjdGl2ZUNhbWVyYS5wcm9qZWN0aW9uTWF0cml4LFxuICAgICAgYWN0aXZlQ2FtZXJhLnZpZXdNYXRyaXgsXG4gICAgICBSb3RhdGlvbkdpem1vLl9fdG1wTWF0cml4NDRfMlxuICAgICk7XG5cbiAgICBjb25zdCBjbGlwQ2VudGVyID0gcHZNYXRyaXgubXVsdGlwbHlWZWN0b3JUbyhcbiAgICAgIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3I0XzAuc2V0Q29tcG9uZW50cyhjZW50ZXJXb3JsZC54LCBjZW50ZXJXb3JsZC55LCBjZW50ZXJXb3JsZC56LCAxKSxcbiAgICAgIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3I0XzJcbiAgICApO1xuICAgIGNvbnN0IGNsaXBUYW5nZW50ID0gcHZNYXRyaXgubXVsdGlwbHlWZWN0b3JUbyhcbiAgICAgIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3I0XzEuc2V0Q29tcG9uZW50cyhcbiAgICAgICAgY2VudGVyV29ybGQueCArIHRhbmdlbnRXb3JsZC54LFxuICAgICAgICBjZW50ZXJXb3JsZC55ICsgdGFuZ2VudFdvcmxkLnksXG4gICAgICAgIGNlbnRlcldvcmxkLnogKyB0YW5nZW50V29ybGQueixcbiAgICAgICAgMVxuICAgICAgKSxcbiAgICAgIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3I0XzNcbiAgICApO1xuXG4gICAgY29uc3QgdzAgPSBjbGlwQ2VudGVyLnc7XG4gICAgY29uc3QgdzEgPSBjbGlwVGFuZ2VudC53O1xuICAgIGlmICh3MCA9PT0gMCB8fCB3MSA9PT0gMCkge1xuICAgICAgdGhpcy5fX3NldERlZmF1bHREcmFnRGlyZWN0aW9uKGF4aXMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG5kY0NlbnRlclggPSBjbGlwQ2VudGVyLnggLyB3MDtcbiAgICBjb25zdCBuZGNDZW50ZXJZID0gY2xpcENlbnRlci55IC8gdzA7XG4gICAgY29uc3QgbmRjVGFuZ2VudFggPSBjbGlwVGFuZ2VudC54IC8gdzE7XG4gICAgY29uc3QgbmRjVGFuZ2VudFkgPSBjbGlwVGFuZ2VudC55IC8gdzE7XG5cbiAgICBjb25zdCBzY3JlZW5UYW5nZW50WCA9IChuZGNUYW5nZW50WCAtIG5kY0NlbnRlclgpICogd2lkdGggKiAwLjU7XG4gICAgY29uc3Qgc2NyZWVuVGFuZ2VudFkgPSAtKG5kY1RhbmdlbnRZIC0gbmRjQ2VudGVyWSkgKiBoZWlnaHQgKiAwLjU7XG4gICAgY29uc3QgbGVuZ3RoID0gTWF0aC5oeXBvdChzY3JlZW5UYW5nZW50WCwgc2NyZWVuVGFuZ2VudFkpO1xuICAgIGlmIChsZW5ndGggPCAxZS01KSB7XG4gICAgICB0aGlzLl9fc2V0RGVmYXVsdERyYWdEaXJlY3Rpb24oYXhpcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24uc2V0Q29tcG9uZW50cyhzY3JlZW5UYW5nZW50WCAvIGxlbmd0aCwgc2NyZWVuVGFuZ2VudFkgLyBsZW5ndGgpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3NldERlZmF1bHREcmFnRGlyZWN0aW9uKGF4aXM6IEF4aXMpIHtcbiAgICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgICB0aGlzLl9fZHJhZ1NjcmVlbkRpcmVjdGlvbi5zZXRDb21wb25lbnRzKDAsIC0xKTtcbiAgICB9IGVsc2UgaWYgKGF4aXMgPT09ICd5Jykge1xuICAgICAgdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24uc2V0Q29tcG9uZW50cygxLCAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24uc2V0Q29tcG9uZW50cygxLCAwKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fc2V0RmFsbGJhY2tMb2NhbFRhbmdlbnQoYXhpczogQXhpcywgb3V0OiBNdXRhYmxlVmVjdG9yMykge1xuICAgIGlmIChheGlzID09PSAneCcpIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKDAsIDAsIDEpO1xuICAgIH0gZWxzZSBpZiAoYXhpcyA9PT0gJ3knKSB7XG4gICAgICBvdXQuc2V0Q29tcG9uZW50cygwLCAwLCAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnNldENvbXBvbmVudHMoMCwgMSwgMCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3NldEZhbGxiYWNrV29ybGREaXJlY3Rpb24oYXhpc0xvY2FsOiBWZWN0b3IzLCBjYW1lcmE6IENhbWVyYUNvbXBvbmVudCwgb3V0OiBNdXRhYmxlVmVjdG9yMykge1xuICAgIGNvbnN0IGF4aXNXb3JsZCA9IHRoaXMuX190cmFuc2Zvcm1EaXJlY3Rpb25Gcm9tR3JvdXBMb2NhbChheGlzTG9jYWwsIFJvdGF0aW9uR2l6bW8uX190bXBWZWN0b3IzXzYpO1xuICAgIGlmIChheGlzV29ybGQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKDEsIDAsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBWZWN0b3IzLm5vcm1hbGl6ZVRvKGF4aXNXb3JsZCwgYXhpc1dvcmxkKTtcblxuICAgIFZlY3RvcjMuY3Jvc3NUbyhheGlzV29ybGQsIGNhbWVyYS5kaXJlY3Rpb25Jbm5lciwgb3V0KTtcbiAgICBpZiAob3V0Lmxlbmd0aFNxdWFyZWQoKSA8IDFlLTEwKSB7XG4gICAgICBWZWN0b3IzLmNyb3NzVG8oY2FtZXJhLnVwSW5uZXIsIGF4aXNXb3JsZCwgb3V0KTtcbiAgICB9XG4gICAgaWYgKG91dC5sZW5ndGhTcXVhcmVkKCkgPCAxZS0xMCkge1xuICAgICAgdGhpcy5fX2Nob29zZUFueVBlcnBlbmRpY3VsYXIoYXhpc1dvcmxkLCBvdXQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19jaG9vc2VBbnlQZXJwZW5kaWN1bGFyKGF4aXM6IElWZWN0b3IzLCBvdXQ6IE11dGFibGVWZWN0b3IzKSB7XG4gICAgaWYgKE1hdGguYWJzKGF4aXMueCkgPCAwLjkpIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKDAsIC1heGlzLnosIGF4aXMueSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKC1heGlzLnksIGF4aXMueCwgMCk7XG4gICAgfVxuICAgIGlmIChvdXQubGVuZ3RoU3F1YXJlZCgpIDwgMWUtMTApIHtcbiAgICAgIG91dC5zZXRDb21wb25lbnRzKDEsIDAsIDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19oYW5kbGVMaW5lYXJEcmFnKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX19hY3RpdmVQb2ludGVyRWxlbWVudDtcbiAgICBpZiAoIWVsZW1lbnQgfHwgdGhpcy5fX2RyYWdTY2FsZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChyZWN0LndpZHRoID09PSAwIHx8IHJlY3QuaGVpZ2h0ID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCBjdXJyZW50WSA9IGV2dC5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgY29uc3QgZGVsdGFYID0gY3VycmVudFggLSB0aGlzLl9fcG9pbnRlclByZXYueDtcbiAgICBjb25zdCBkZWx0YVkgPSBjdXJyZW50WSAtIHRoaXMuX19wb2ludGVyUHJldi55O1xuICAgIHRoaXMuX19wb2ludGVyUHJldi5zZXRDb21wb25lbnRzKGN1cnJlbnRYLCBjdXJyZW50WSk7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZGVsdGFYKSB8fCAhTnVtYmVyLmlzRmluaXRlKGRlbHRhWSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGRlbHRhWCA9PT0gMCAmJiBkZWx0YVkgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzY2FsYXIgPSAtZGVsdGFYICogdGhpcy5fX2RyYWdTY3JlZW5EaXJlY3Rpb24ueCAtIGRlbHRhWSAqIHRoaXMuX19kcmFnU2NyZWVuRGlyZWN0aW9uLnk7XG4gICAgaWYgKHNjYWxhciA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRlbHRhQW5nbGUgPSBzY2FsYXIgKiB0aGlzLl9fZHJhZ1NjYWxlO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGRlbHRhQW5nbGUpIHx8IGRlbHRhQW5nbGUgPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fYWNjdW11bGF0ZWRBbmdsZSArPSBkZWx0YUFuZ2xlO1xuICAgIGNvbnN0IGRlbHRhUXVhdCA9IFF1YXRlcm5pb24uZnJvbUF4aXNBbmdsZSh0aGlzLl9fcm90YXRpb25BeGlzRm9yUXVhdGVybmlvbiwgdGhpcy5fX2FjY3VtdWxhdGVkQW5nbGUpO1xuICAgIHRoaXMuX19kZWx0YVF1YXRlcm5pb24gPSBRdWF0ZXJuaW9uLm11bHRpcGx5KGRlbHRhUXVhdCwgdGhpcy5fX3RhcmdldFJvdGF0aW9uQmFja3VwKTtcbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX190cmFuc2Zvcm1EaXJlY3Rpb25Gcm9tR3JvdXBMb2NhbCh2ZWM6IElWZWN0b3IzLCBvdXQ6IE11dGFibGVWZWN0b3IzKTogTXV0YWJsZVZlY3RvcjMge1xuICAgIGNvbnN0IHJlc291cmNlcyA9IFJvdGF0aW9uR2l6bW8uX19nZXRSZXNvdXJjZXModGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgZ3JvdXBTY2VuZUdyYXBoID0gcmVzb3VyY2VzPy5ncm91cEVudGl0eT8uZ2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmICghZ3JvdXBTY2VuZUdyYXBoKSB7XG4gICAgICByZXR1cm4gb3V0LnNldENvbXBvbmVudHModmVjLngsIHZlYy55LCB2ZWMueik7XG4gICAgfVxuXG4gICAgY29uc3QgbWF0cml4ID0gZ3JvdXBTY2VuZUdyYXBoLm1hdHJpeElubmVyO1xuICAgIGNvbnN0IHggPSB2ZWMueDtcbiAgICBjb25zdCB5ID0gdmVjLnk7XG4gICAgY29uc3QgeiA9IHZlYy56O1xuXG4gICAgY29uc3Qgd29ybGRYID0gbWF0cml4Lm0wMCAqIHggKyBtYXRyaXgubTAxICogeSArIG1hdHJpeC5tMDIgKiB6O1xuICAgIGNvbnN0IHdvcmxkWSA9IG1hdHJpeC5tMTAgKiB4ICsgbWF0cml4Lm0xMSAqIHkgKyBtYXRyaXgubTEyICogejtcbiAgICBjb25zdCB3b3JsZFogPSBtYXRyaXgubTIwICogeCArIG1hdHJpeC5tMjEgKiB5ICsgbWF0cml4Lm0yMiAqIHo7XG5cbiAgICByZXR1cm4gb3V0LnNldENvbXBvbmVudHMod29ybGRYLCB3b3JsZFksIHdvcmxkWik7XG4gIH1cblxuICBwcml2YXRlIF9fcmVzb2x2ZVBvaW50ZXJFbGVtZW50KGV2dDogUG9pbnRlckV2ZW50KTogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIGxldCBlbGVtZW50ID0gZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgaWYgKCFlbGVtZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAgIGVsZW1lbnQgPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5ldmVudFRhcmdldERvbSA/PyBudWxsO1xuICAgIH1cbiAgICBpZiAoIWVsZW1lbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICBwcml2YXRlIF9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKSB7XG4gICAgaWYgKHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBJbnB1dE1hbmFnZXIuZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKTtcbiAgICB0aGlzLl9faXNDYW1lcmFDb250cm9sbGVyRGlzYWJsZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCgpIHtcbiAgICBpZiAoIXRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBJbnB1dE1hbmFnZXIuZW5hYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19wcm9qZWN0VG9QbGFuZShwb3NpdGlvbjogSVZlY3RvcjMsIGF4aXM6IEF4aXMpOiBWZWN0b3IzIHtcbiAgICBzd2l0Y2ggKGF4aXMpIHtcbiAgICAgIGNhc2UgJ3gnOlxuICAgICAgICByZXR1cm4gVmVjdG9yMy5mcm9tQ29weTMoMCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueik7XG4gICAgICBjYXNlICd5JzpcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKHBvc2l0aW9uLngsIDAsIHBvc2l0aW9uLnopO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFZlY3RvcjMuZnJvbUNvcHkzKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIDApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19nZXRBeGlzRm9yUXVhdGVybmlvbihheGlzOiBBeGlzKTogVmVjdG9yMyB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkucGFyZW50O1xuICAgIGlmIChSb3RhdGlvbkdpem1vLl9fc3BhY2UgPT09ICdsb2NhbCcgfHwgSXMubm90LmV4aXN0KHBhcmVudCkpIHtcbiAgICAgIHJldHVybiBSb3RhdGlvbkdpem1vLl9fZ2V0QXhpc1ZlY3RvcihheGlzKTtcbiAgICB9XG5cbiAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHBhcmVudC5tYXRyaXhJbm5lci5nZXRSb3RhdGUoKTtcbiAgICBjb25zdCByb3RNYXQgPSBNYXRyaXgzMy5mcm9tQ29weTlSb3dNYWpvcihcbiAgICAgIHdvcmxkTWF0cml4Lm0wMCxcbiAgICAgIHdvcmxkTWF0cml4Lm0wMSxcbiAgICAgIHdvcmxkTWF0cml4Lm0wMixcbiAgICAgIHdvcmxkTWF0cml4Lm0xMCxcbiAgICAgIHdvcmxkTWF0cml4Lm0xMSxcbiAgICAgIHdvcmxkTWF0cml4Lm0xMixcbiAgICAgIHdvcmxkTWF0cml4Lm0yMCxcbiAgICAgIHdvcmxkTWF0cml4Lm0yMSxcbiAgICAgIHdvcmxkTWF0cml4Lm0yMlxuICAgICk7XG4gICAgY29uc3QgaW52Um90ID0gTWF0cml4MzMudHJhbnNwb3NlKHJvdE1hdCkgYXMgTWF0cml4MzM7XG4gICAgcmV0dXJuIGludlJvdC5tdWx0aXBseVZlY3RvcihSb3RhdGlvbkdpem1vLl9fZ2V0QXhpc1ZlY3RvcihheGlzKSk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldEF4aXNWZWN0b3IoYXhpczogQXhpcyk6IFZlY3RvcjMge1xuICAgIHN3aXRjaCAoYXhpcykge1xuICAgICAgY2FzZSAneCc6XG4gICAgICAgIHJldHVybiBSb3RhdGlvbkdpem1vLl9fdW5pdFg7XG4gICAgICBjYXNlICd5JzpcbiAgICAgICAgcmV0dXJuIFJvdGF0aW9uR2l6bW8uX191bml0WTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBSb3RhdGlvbkdpem1vLl9fdW5pdFo7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYXN0UmF5KGVuZ2luZTogRW5naW5lLCBldnQ6IFBvaW50ZXJFdmVudCwgbG9jYWwgPSBmYWxzZSkge1xuICAgIGNvbnN0IHJlc291cmNlcyA9IFJvdGF0aW9uR2l6bW8uX19nZXRSZXNvdXJjZXMoZW5naW5lKTtcbiAgICBjb25zdCBlbXB0eTogUmF5Y2FzdFJlc3VsdEV4MSA9IHsgcmVzdWx0OiBmYWxzZSB9O1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm4geyB4UmVzdWx0OiBlbXB0eSwgeVJlc3VsdDogZW1wdHksIHpSZXN1bHQ6IGVtcHR5IH07XG4gICAgfVxuXG4gICAgY29uc3QgcmVjdCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCB3aWR0aCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGllbnRXaWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xpZW50SGVpZ2h0O1xuICAgIGNvbnN0IHggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gcmVjdC5oZWlnaHQgLSAoZXZ0LmNsaWVudFkgLSByZWN0LnRvcCk7XG4gICAgY29uc3Qgdmlld3BvcnQgPSBWZWN0b3I0LmZyb21Db3B5NCgwLCAwLCB3aWR0aCwgaGVpZ2h0KSBhcyBWZWN0b3I0O1xuICAgIGNvbnN0IGFjdGl2ZUNhbWVyYSA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChDYW1lcmFDb21wb25lbnQsIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSkpIGFzXG4gICAgICB8IENhbWVyYUNvbXBvbmVudFxuICAgICAgfCB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBjYXN0ZXIgPSBsb2NhbCA/IFJvdGF0aW9uR2l6bW8uX19jYXN0RnJvbUVudGl0aWVzTG9jYWwgOiBSb3RhdGlvbkdpem1vLl9fY2FzdEZyb21FbnRpdGllcztcbiAgICBpZiAoSXMubm90LmV4aXN0KGFjdGl2ZUNhbWVyYSkpIHtcbiAgICAgIHJldHVybiB7IHhSZXN1bHQ6IGVtcHR5LCB5UmVzdWx0OiBlbXB0eSwgelJlc3VsdDogZW1wdHkgfTtcbiAgICB9XG5cbiAgICBjb25zdCB4UmVzdWx0ID0gY2FzdGVyKHgsIHksIGFjdGl2ZUNhbWVyYSwgdmlld3BvcnQsIHJlc291cmNlcy54UmluZ0VudGl0eSk7XG4gICAgY29uc3QgeVJlc3VsdCA9IGNhc3Rlcih4LCB5LCBhY3RpdmVDYW1lcmEsIHZpZXdwb3J0LCByZXNvdXJjZXMueVJpbmdFbnRpdHkpO1xuICAgIGNvbnN0IHpSZXN1bHQgPSBjYXN0ZXIoeCwgeSwgYWN0aXZlQ2FtZXJhLCB2aWV3cG9ydCwgcmVzb3VyY2VzLnpSaW5nRW50aXR5KTtcblxuICAgIHJldHVybiB7IHhSZXN1bHQsIHlSZXN1bHQsIHpSZXN1bHQgfTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fY2FzdEZyb21FbnRpdGllcyhcbiAgICB4OiBudW1iZXIsXG4gICAgeTogbnVtYmVyLFxuICAgIGNhbWVyYTogQ2FtZXJhQ29tcG9uZW50LFxuICAgIHZpZXdwb3J0OiBWZWN0b3I0LFxuICAgIC4uLmVudGl0aWVzOiBBcnJheTxJTWVzaEVudGl0eSB8IHVuZGVmaW5lZD5cbiAgKTogUmF5Y2FzdFJlc3VsdEV4MSB7XG4gICAgbGV0IGNsb3Nlc3RSZXN1bHQ6IFJheWNhc3RSZXN1bHRFeDEgPSB7IHJlc3VsdDogZmFsc2UgfTtcbiAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiBlbnRpdGllcykge1xuICAgICAgaWYgKElzLm5vdC5leGlzdChlbnRpdHkpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzdWx0ID0gZW50aXR5LmdldE1lc2goKS5jYXN0UmF5RnJvbVNjcmVlbkluV29ybGQoeCwgeSwgY2FtZXJhLCB2aWV3cG9ydCwgMC4wKTtcbiAgICAgIGlmICghcmVzdWx0LnJlc3VsdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnREaXN0YW5jZSA9IHJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGNvbnN0IGNsb3Nlc3REaXN0YW5jZSA9IGNsb3Nlc3RSZXN1bHQuZGF0YT8udCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgICBpZiAoIWNsb3Nlc3RSZXN1bHQucmVzdWx0IHx8IGN1cnJlbnREaXN0YW5jZSA8IGNsb3Nlc3REaXN0YW5jZSkge1xuICAgICAgICBjbG9zZXN0UmVzdWx0ID0gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xvc2VzdFJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fY2FzdEZyb21FbnRpdGllc0xvY2FsKFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgY2FtZXJhOiBDYW1lcmFDb21wb25lbnQsXG4gICAgdmlld3BvcnQ6IFZlY3RvcjQsXG4gICAgLi4uZW50aXRpZXM6IEFycmF5PElNZXNoRW50aXR5IHwgdW5kZWZpbmVkPlxuICApOiBSYXljYXN0UmVzdWx0RXgxIHtcbiAgICBsZXQgY2xvc2VzdFJlc3VsdDogUmF5Y2FzdFJlc3VsdEV4MSA9IHsgcmVzdWx0OiBmYWxzZSB9O1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGVudGl0eSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBlbnRpdHkuZ2V0TWVzaCgpLmNhc3RSYXlGcm9tU2NyZWVuSW5Mb2NhbCh4LCB5LCBjYW1lcmEsIHZpZXdwb3J0LCAwLjApO1xuICAgICAgaWYgKCFyZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudERpc3RhbmNlID0gcmVzdWx0LmRhdGE/LnQgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgY29uc3QgY2xvc2VzdERpc3RhbmNlID0gY2xvc2VzdFJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGlmICghY2xvc2VzdFJlc3VsdC5yZXN1bHQgfHwgY3VycmVudERpc3RhbmNlIDwgY2xvc2VzdERpc3RhbmNlKSB7XG4gICAgICAgIGNsb3Nlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbG9zZXN0UmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVSaW5nUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lLCBheGlzOiBBeGlzLCBtYXRlcmlhbDogTWF0ZXJpYWwpOiBSaW5nIHtcbiAgICBjb25zdCByYWRpdXMgPSBSb3RhdGlvbkdpem1vLl9fbGVuZ3RoO1xuICAgIGNvbnN0IHJpbmcgPSBuZXcgUmluZyhlbmdpbmUpO1xuICAgIHJpbmcuZ2VuZXJhdGUoe1xuICAgICAgcmFkaXVzLFxuICAgICAgdGhpY2tuZXNzOiByYWRpdXMgKiAwLjEsXG4gICAgICBzZWdtZW50czogNjQsXG4gICAgICBheGlzLFxuICAgICAgbWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgcmV0dXJuIHJpbmc7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX3NlbGVjdENsb3Nlc3RBeGlzKFxuICAgIGNhbmRpZGF0ZXM6IEFycmF5PHsgYXhpczogQXhpczsgcmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxIH0+XG4gICk6IHsgYXhpczogQXhpczsgcmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxIH0gfCB1bmRlZmluZWQge1xuICAgIGxldCBjbG9zZXN0OiB7IGF4aXM6IEF4aXM7IHJlc3VsdDogUmF5Y2FzdFJlc3VsdEV4MSB9IHwgdW5kZWZpbmVkO1xuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgIGlmICghY2FuZGlkYXRlLnJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBkaXN0YW5jZSA9IGNhbmRpZGF0ZS5yZXN1bHQuZGF0YT8udCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgICBpZiAoIWNsb3Nlc3QgfHwgZGlzdGFuY2UgPCAoY2xvc2VzdC5yZXN1bHQuZGF0YT8udCA/PyBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpKSB7XG4gICAgICAgIGNsb3Nlc3QgPSBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbG9zZXN0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jcmVhdGVSaW5nTWF0ZXJpYWwoZW5naW5lOiBFbmdpbmUsIGNvbG9yOiBWZWN0b3I0KTogTWF0ZXJpYWwge1xuICAgIGNvbnN0IG1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbChlbmdpbmUpO1xuICAgIG1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5CbGVuZDtcbiAgICBtYXRlcmlhbC5jdWxsRmFjZSA9IGZhbHNlO1xuICAgIG1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZUNvbG9yRmFjdG9yJywgY29sb3IpO1xuICAgIHJldHVybiBtYXRlcmlhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgYWxsIHN0YXRpYyByZXNvdXJjZXMgZm9yIGEgc3BlY2lmaWMgRW5naW5lLlxuICAgKiBUaGlzIHJlbW92ZXMgdGhlIHJlc291cmNlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGVuZ2luZSBmcm9tIHRoZSBtYXAuXG4gICAqIEBpbnRlcm5hbCBDYWxsZWQgZnJvbSBFbmdpbmUuZGVzdHJveSgpXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBSb3RhdGlvbkdpem1vLl9fcmVzb3VyY2VzTWFwLmRlbGV0ZShlbmdpbmUub2JqZWN0VUlEKTtcbiAgICBSb3RhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsWUFBWTtBQUNyQixTQUFTLFlBQVk7QUFHckIsU0FBUyxpQ0FBaUM7QUFHMUMsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyx5QkFBeUI7QUFDbEMsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsZUFBZTtBQUN4QixTQUFTLFVBQVU7QUFDbkIsU0FBUyxtQkFBbUI7QUFFNUIsU0FBUyxVQUFVLHFDQUFxQyxvQkFBb0I7QUFDNUUsU0FBUyxhQUFhO0FBK0JmLElBQU0saUJBQU4sTUFBTSx1QkFBc0IsTUFBTTtBQUFBLEVBQWxDO0FBQUE7QUFnQ0wsU0FBUUEsS0FBa0I7QUFDMUIsU0FBUUMsS0FBZ0IsUUFBUSxLQUFLO0FBQ3JDLFNBQVFDLEtBQW9CLFdBQVcsU0FBUztBQUNoRCxTQUFRQyxLQUF5QixXQUFXLFNBQVM7QUFFckQsU0FBUUMsS0FBc0IsS0FBS0MsR0FBZ0IsS0FBSyxJQUFJO0FBQzVELFNBQVFDLEtBQXNCLEtBQUtDLEdBQWdCLEtBQUssSUFBSTtBQUM1RCxTQUFRQyxLQUFvQixLQUFLQyxHQUFjLEtBQUssSUFBSTtBQUN4RCxTQUFRQyxLQUErQjtBQUN2QyxTQUFRQyxLQUFnQixlQUFlLEtBQUs7QUFDNUMsU0FBUUMsS0FBd0IsZUFBZSxLQUFLO0FBQ3BELFNBQVFDLEtBQThCLGVBQWUsS0FBSztBQUMxRCxTQUFRQyxLQUFjO0FBQ3RCLFNBQVFDLEtBQXFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU03QixPQUFlQyxHQUFlLFFBQW9EO0FBQ2hGLFdBQU8sZUFBY0MsR0FBZSxJQUFJLE9BQU8sU0FBUztBQUFBLEVBQzFEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxVQUFtQjtBQUNyQixXQUFPLEdBQUcsTUFBTSxLQUFLQyxFQUFXO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsSUFBSSxPQUFPLEtBQWE7QUFDdEIsbUJBQWNDLEtBQVc7QUFBQSxFQUMzQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxJQUFJLFNBQWlCO0FBQ25CLFdBQU8sZUFBY0E7QUFBQSxFQUN2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQUksaUJBQWlCLEtBQWE7QUFDaEMsbUJBQWNDLEtBQXFCO0FBQUEsRUFDckM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxtQkFBMkI7QUFDN0IsV0FBTyxlQUFjQTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxJQUFJLFlBQXFCO0FBQ3ZCLFdBQU8sS0FBS0M7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFJLFVBQVUsS0FBYztBQUMxQixVQUFNLFlBQVksZUFBY0wsR0FBZSxLQUFLTSxDQUFRO0FBQzVELFFBQUksQ0FBQyxXQUFXO0FBQ2Q7QUFBQSxJQUNGO0FBRUEsUUFBSSxLQUFLRCxPQUFnQixTQUFTLFFBQVEsTUFBTTtBQUM5QyxVQUFJLGlCQUFpQjtBQUNyQixVQUFJLEdBQUcsTUFBTSxLQUFLQyxFQUFTLE9BQU8sY0FBYyxHQUFHO0FBQ2pELHlCQUFpQixLQUFLQSxFQUFTLE9BQU87QUFBQSxNQUN4QztBQUNBLG1CQUFhLFNBQVMscUNBQXFDO0FBQUEsUUFDekQ7QUFBQSxVQUNFLFdBQVcsU0FBUyxPQUFPO0FBQUEsVUFDM0IsU0FBUyxLQUFLbEI7QUFBQSxVQUNkLFNBQVMsQ0FBQztBQUFBLFVBQ1YsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVyxTQUFTLE1BQU07QUFBQSxVQUMxQixTQUFTLEtBQUtFO0FBQUEsVUFDZCxTQUFTLENBQUM7QUFBQSxVQUNWLGVBQWU7QUFBQSxVQUNmO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxVQUNFLFdBQVcsU0FBUyxLQUFLO0FBQUEsVUFDekIsU0FBUyxLQUFLRTtBQUFBLFVBQ2QsU0FBUyxDQUFDO0FBQUEsVUFDVixlQUFlO0FBQUEsVUFDZjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxXQUFXO0FBQUEsVUFDWCxTQUFTLEtBQUtBO0FBQUEsVUFDZCxTQUFTLENBQUM7QUFBQSxVQUNWLGVBQWU7QUFBQSxVQUNmO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUVELFdBQUtlLEtBQXVCLEtBQUtDO0FBQ2pDLFdBQUtDLEdBQW9CO0FBQ3pCLFdBQUtDLEdBQW9CO0FBQUEsSUFDM0I7QUFFQSxRQUFJLEtBQUtMLE9BQWdCLFFBQVEsUUFBUSxPQUFPO0FBQzlDLG1CQUFhLFdBQVcsbUNBQW1DO0FBQzNELFdBQUtyQixLQUFrQjtBQUN2QixxQkFBYzJCLEtBQWU7QUFBQSxJQUMvQjtBQUVBLGlCQUFhLFVBQVUscUNBQXFDLEdBQUc7QUFDL0QsU0FBS0MsR0FBYSxHQUFHO0FBQUEsRUFDdkI7QUFBQSxFQUVBLFNBQVMsT0FBMEI7QUFDakMsbUJBQWNDLEtBQVU7QUFDeEIsUUFBSSxLQUFLUixJQUFhO0FBQ3BCLFdBQUtLLEdBQW9CO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsU0FBZTtBQUNiLFFBQUksS0FBS0ksR0FBYyxHQUFHO0FBQ3hCO0FBQUEsSUFDRjtBQUVBLFVBQU0sbUJBQW1CLEtBQUtOLEdBQVMsY0FBYztBQUNyRCxRQUFJLENBQUMsa0JBQWtCO0FBQ3JCO0FBQUEsSUFDRjtBQUVBLFNBQUtOLEtBQWMsa0JBQWtCLEtBQUtJLENBQVE7QUFDbEQsU0FBS0osR0FBWSxtQkFBbUIsb0JBQW9CLEtBQUtNLEdBQVMsVUFBVSxJQUFJLElBQUk7QUFDeEYsU0FBS04sR0FBWSxjQUFjLEVBQUcsd0NBQXdDO0FBQzFFLHFCQUFpQixlQUFlLEtBQUtBLEdBQVksY0FBYyxDQUFFO0FBR2pFLFFBQUksWUFBWSxlQUFjRixHQUFlLEtBQUtNLENBQVE7QUFDMUQsUUFBSSxDQUFDLFdBQVc7QUFFZCxrQkFBWSxLQUFLUyxHQUFrQjtBQUNuQyxxQkFBY2QsR0FBZSxJQUFJLEtBQUtLLEVBQVMsV0FBVyxTQUFTO0FBQUEsSUFDckU7QUFFQSxTQUFLRyxHQUFvQjtBQUN6QixTQUFLRixLQUF1QixLQUFLQztBQUVqQyxTQUFLLFlBQVk7QUFDakIsU0FBS04sR0FBWSxZQUFZLEVBQUUsS0FBSyxTQUFTLE9BQU8sV0FBVyxDQUFDO0FBQ2hFLFNBQUssUUFBUTtBQUFBLEVBQ2Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRYSxLQUE0QztBQUVsRCxVQUFNLGNBQWMsaUJBQWlCLEtBQUtULENBQVE7QUFDbEQsZ0JBQVksbUJBQW1CLHVCQUF1QixJQUFJO0FBQzFELFVBQU0sZ0JBQWdCLGVBQWNVLEdBQXFCLEtBQUtWLEdBQVUsUUFBUSxlQUFlLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0csVUFBTSxZQUFZLElBQUksS0FBSyxLQUFLQSxDQUFRO0FBQ3hDLFVBQU0saUJBQWlCLGVBQWNXLEdBQXNCLEtBQUtYLEdBQVUsS0FBSyxhQUFhO0FBQzVGLGNBQVUsYUFBYSxjQUFjO0FBQ3JDLGdCQUFZLFFBQVEsRUFBRSxRQUFRLFNBQVM7QUFHdkMsVUFBTSxjQUFjLGlCQUFpQixLQUFLQSxDQUFRO0FBQ2xELGdCQUFZLG1CQUFtQix1QkFBdUIsSUFBSTtBQUMxRCxVQUFNLGdCQUFnQixlQUFjVSxHQUFxQixLQUFLVixHQUFVLFFBQVEsZUFBZSxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQy9HLFVBQU0sWUFBWSxJQUFJLEtBQUssS0FBS0EsQ0FBUTtBQUN4QyxVQUFNLGlCQUFpQixlQUFjVyxHQUFzQixLQUFLWCxHQUFVLEtBQUssYUFBYTtBQUM1RixjQUFVLGFBQWEsY0FBYztBQUNyQyxnQkFBWSxRQUFRLEVBQUUsUUFBUSxTQUFTO0FBR3ZDLFVBQU0sY0FBYyxpQkFBaUIsS0FBS0EsQ0FBUTtBQUNsRCxnQkFBWSxtQkFBbUIsdUJBQXVCLElBQUk7QUFDMUQsVUFBTSxnQkFBZ0IsZUFBY1UsR0FBcUIsS0FBS1YsR0FBVSxRQUFRLGVBQWUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUMvRyxVQUFNLFlBQVksSUFBSSxLQUFLLEtBQUtBLENBQVE7QUFDeEMsVUFBTSxpQkFBaUIsZUFBY1csR0FBc0IsS0FBS1gsR0FBVSxLQUFLLGFBQWE7QUFDNUYsY0FBVSxhQUFhLGNBQWM7QUFDckMsZ0JBQVksUUFBUSxFQUFFLFFBQVEsU0FBUztBQUd2QyxVQUFNLGNBQWMsa0JBQWtCLEtBQUtBLENBQVE7QUFFbkQsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsVUFBZ0I7QUFDZCxRQUFJLENBQUMsR0FBRyxNQUFNLEtBQUtKLEVBQVcsR0FBRztBQUMvQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLEtBQUssS0FBS00sR0FBUyxjQUFjO0FBQ3ZDLFVBQU0sT0FBTyxHQUFHO0FBR2hCLFVBQU0sZ0JBQWdCLEtBQUssVUFBVSxJQUFJLEdBQUcsV0FBVyxLQUFLO0FBQzVELFVBQU0sWUFBWSxLQUFLTixHQUFZLGFBQWE7QUFDaEQsY0FBVSxnQkFBZ0I7QUFHMUIsVUFBTSxVQUFVLE1BQU1nQixHQUF1QixLQUFLWixHQUFVLGVBQWUsZUFBY0YsRUFBa0I7QUFDM0csY0FBVSxhQUFhLFFBQVEsVUFBVSxTQUFTLFNBQVMsT0FBTztBQUdsRSxTQUFLZSxHQUErQjtBQUVwQyxRQUFJLEtBQUtuQyxNQUFtQixlQUFjMkIsT0FBaUIsUUFBUTtBQUNqRSxVQUFJLEtBQUtKLE9BQXlCLEtBQUtDLElBQVU7QUFDL0MsYUFBS0EsR0FBUyxhQUFhLEVBQUUsZ0JBQWdCLFdBQVcsbUJBQW1CLEtBQUt0QixFQUFpQjtBQUFBLE1BQ25HO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFdBQWlCO0FBQ2YsU0FBS2tDLEdBQW1CO0FBQUEsRUFDMUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRUVgsS0FBc0I7QUFDNUIsVUFBTSxZQUFZLGVBQWNULEdBQWUsS0FBS00sQ0FBUTtBQUM1RCxRQUFJLENBQUMsR0FBRyxNQUFNLEtBQUtKLEVBQVcsS0FBSyxDQUFDLFdBQVc7QUFDN0M7QUFBQSxJQUNGO0FBQ0EsVUFBTSxnQkFBZ0IsS0FBS0EsR0FBYSxjQUFjO0FBQ3RELFVBQU0sa0JBQWtCLFVBQVUsWUFBWSxjQUFjO0FBQzVELGtCQUFjLFNBQVMsZUFBZTtBQUN0QyxvQkFBZ0IsU0FBUyxVQUFVLFlBQVksY0FBYyxDQUFDO0FBQzlELG9CQUFnQixTQUFTLFVBQVUsWUFBWSxjQUFjLENBQUM7QUFDOUQsb0JBQWdCLFNBQVMsVUFBVSxZQUFZLGNBQWMsQ0FBQztBQUFBLEVBQ2hFO0FBQUEsRUFFUVEsS0FBc0I7QUFDNUIsVUFBTSxZQUFZLGVBQWNWLEdBQWUsS0FBS00sQ0FBUTtBQUM1RCxRQUFJLENBQUMsV0FBVztBQUNkO0FBQUEsSUFDRjtBQUVBLFFBQUksZUFBY08sT0FBWSxTQUFTO0FBQ3JDLFlBQU0sYUFBYSxlQUFjUTtBQUNqQyxZQUFNLFNBQVMsS0FBS2IsR0FBUyxjQUFjLEVBQUU7QUFDN0MsVUFBSSxHQUFHLE1BQU0sTUFBTSxHQUFHO0FBQ3BCLGVBQU8sMkJBQTJCLFVBQVU7QUFBQSxNQUM5QyxPQUFPO0FBQ0wsbUJBQVcsU0FBUztBQUFBLE1BQ3RCO0FBQ0EsZ0JBQVUsWUFBWSxhQUFhLEVBQUUsZ0JBQWdCO0FBQUEsSUFDdkQsT0FBTztBQUNMLGdCQUFVLFlBQVksYUFBYSxFQUFFLGdCQUFnQixlQUFjYSxHQUFrQixTQUFTO0FBQUEsSUFDaEc7QUFBQSxFQUNGO0FBQUEsRUFFUWhDLEdBQWdCLEtBQW1CO0FBQ3pDLFNBQUtMLEtBQWtCO0FBQ3ZCLFNBQUtzQyxLQUF5QjtBQUM5QixTQUFLM0IsR0FBYyxjQUFjLEdBQUcsQ0FBQztBQUNyQyxTQUFLQyxHQUFzQixjQUFjLEdBQUcsQ0FBQztBQUM3QyxTQUFLRSxLQUFjO0FBQ25CLFNBQUtDLEtBQXFCO0FBQzFCLFNBQUtGLEdBQTRCLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFFdEQsVUFBTSxFQUFFLFNBQVMsU0FBUyxRQUFRLElBQUksZUFBYzBCLEdBQVUsS0FBS2pCLEdBQVUsS0FBSyxJQUFJO0FBQ3RGLG1CQUFjSyxLQUFlO0FBRTdCLFVBQU0sU0FBUyxlQUFjYSxHQUFvQjtBQUFBLE1BQy9DLEVBQUUsTUFBTSxLQUFLLFFBQVEsUUFBUTtBQUFBLE1BQzdCLEVBQUUsTUFBTSxLQUFLLFFBQVEsUUFBUTtBQUFBLE1BQzdCLEVBQUUsTUFBTSxLQUFLLFFBQVEsUUFBUTtBQUFBLElBQy9CLENBQUM7QUFFRCxRQUFJLFFBQVE7QUFDVixrQkFBWSxPQUFPLE9BQU8sSUFBSTtBQUM5QixXQUFLdkMsS0FBZ0IsUUFBUSxVQUFVLGVBQWN3QyxHQUFpQixPQUFPLE9BQU8sS0FBSyxVQUFVLE9BQU8sSUFBSSxDQUFDO0FBQy9HLHFCQUFjZCxLQUFlLE9BQU87QUFBQSxJQUN0QztBQUVBLFFBQUksZUFBY0EsT0FBaUIsUUFBUTtBQUN6QyxXQUFLM0IsS0FBa0I7QUFDdkI7QUFBQSxJQUNGO0FBSUEsUUFBSSxlQUFlO0FBQ25CLFNBQUswQyxHQUEwQjtBQUMvQixTQUFLdkMsS0FBeUIsV0FBVyxtQkFBbUIsS0FBS3FCLEdBQVMsYUFBYSxFQUFFLGFBQWE7QUFDdEcsU0FBS3RCLEtBQW9CLFdBQVcsbUJBQW1CLEtBQUtDLEVBQXNCO0FBQ2xGLFNBQUt3QyxHQUEyQixLQUFLLGVBQWNoQixFQUFZO0FBQUEsRUFDakU7QUFBQSxFQUVRcEIsR0FBZ0IsS0FBbUI7QUFDekMsUUFBSSxlQUFlO0FBQ25CLFFBQUksR0FBRyxNQUFNLEtBQUtQLEVBQWUsR0FBRztBQUNsQztBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWEsZUFBYzJCO0FBQ2pDLFFBQUksZUFBZSxRQUFRO0FBQ3pCO0FBQUEsSUFDRjtBQUVBLFNBQUtpQixHQUFtQixHQUFHO0FBQUEsRUFDN0I7QUFBQSxFQUVRbkMsR0FBYyxLQUFtQjtBQUN2QyxRQUFJLGVBQWU7QUFDbkIsU0FBS1QsS0FBa0I7QUFDdkIsbUJBQWMyQixLQUFlO0FBQzdCLFNBQUtrQixHQUFpQztBQUN0QyxTQUFLNUMsS0FBZ0IsUUFBUSxLQUFLO0FBQ2xDLFNBQUtFLEtBQXlCLFdBQVcsbUJBQW1CLEtBQUtxQixHQUFTLGFBQWEsRUFBRSxhQUFhO0FBQ3RHLFNBQUt0QixLQUFvQixXQUFXLG1CQUFtQixLQUFLQyxFQUFzQjtBQUNsRixTQUFLbUMsS0FBeUI7QUFDOUIsU0FBSzNCLEdBQWMsY0FBYyxHQUFHLENBQUM7QUFDckMsU0FBS0MsR0FBc0IsY0FBYyxHQUFHLENBQUM7QUFDN0MsU0FBS0MsR0FBNEIsY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUN0RCxTQUFLQyxLQUFjO0FBQ25CLFNBQUtDLEtBQXFCO0FBQUEsRUFDNUI7QUFBQSxFQUVRNEIsR0FBMkIsS0FBbUIsTUFBWTtBQXJjcEU7QUFzY0ksVUFBTSxZQUFZLGVBQWMzQixHQUFlLEtBQUtNLENBQVE7QUFDNUQsUUFBSSxDQUFDLFdBQVc7QUFDZDtBQUFBLElBQ0Y7QUFFQSxTQUFLVixHQUFzQixjQUFjLEdBQUcsQ0FBQztBQUU3QyxVQUFNLFVBQVUsS0FBS2tDLEdBQXdCLEdBQUc7QUFDaEQsUUFBSSxRQUFRO0FBQ1osUUFBSSxTQUFTO0FBQ2IsUUFBSSxXQUFXO0FBQ2YsUUFBSSxXQUFXO0FBQ2YsUUFBSSxTQUFTO0FBQ1gsWUFBTSxPQUFPLFFBQVEsc0JBQXNCO0FBQzNDLGNBQVEsS0FBSyxTQUFTLFFBQVEsZUFBZTtBQUM3QyxlQUFTLEtBQUssVUFBVSxRQUFRLGdCQUFnQjtBQUNoRCxpQkFBVyxJQUFJLFVBQVUsS0FBSztBQUM5QixpQkFBVyxJQUFJLFVBQVUsS0FBSztBQUM5QixXQUFLUixLQUF5QjtBQUFBLElBQ2hDLE9BQU87QUFDTCxXQUFLQSxLQUF5QjtBQUFBLElBQ2hDO0FBRUEsU0FBSzNCLEdBQWMsY0FBYyxVQUFVLFFBQVE7QUFDbkQsU0FBS0csS0FBZSxJQUFJLEtBQUssS0FBTSxLQUFLLElBQUksT0FBTyxRQUFRLENBQUM7QUFDNUQsU0FBS0MsS0FBcUI7QUFFMUIsVUFBTSxjQUFjLEtBQUtnQyxHQUF1QixJQUFJO0FBQ3BELFlBQVEsWUFBWSxhQUFhLEtBQUtsQyxFQUEyQjtBQUVqRSxVQUFNLGVBQWUsS0FBS1MsRUFBUyxvQkFBb0I7QUFBQSxNQUNyRDtBQUFBLE1BQ0EsZ0JBQWdCLFdBQVcsS0FBS0EsQ0FBUTtBQUFBLElBQzFDO0FBQ0EsVUFBTSxtQkFBa0IsZUFBVSxnQkFBVixtQkFBdUI7QUFDL0MsUUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUI7QUFDakQsV0FBSzBCLEdBQTBCLElBQUk7QUFDbkM7QUFBQSxJQUNGO0FBRUEsVUFBTSxZQUFZLGVBQWNDLEdBQWdCLElBQUk7QUFDcEQsVUFBTSxlQUFlLFFBQVEsUUFBUSxLQUFLaEQsSUFBZSxXQUFXLGVBQWNpRCxFQUFjO0FBQ2hHLFFBQUksYUFBYSxjQUFjLElBQUksT0FBTztBQUN4QyxXQUFLQyxHQUEwQixNQUFNLFlBQVk7QUFBQSxJQUNuRDtBQUNBLFlBQVEsWUFBWSxjQUFjLFlBQVk7QUFFOUMsVUFBTSxlQUFlLEtBQUtDLEdBQW1DLGNBQWMsZUFBY0MsRUFBYztBQUN2RyxRQUFJLGFBQWEsY0FBYyxJQUFJLE9BQU87QUFDeEMsV0FBS0MsR0FBNEIsV0FBVyxjQUFjLFlBQVk7QUFBQSxJQUN4RTtBQUNBLFFBQUksYUFBYSxjQUFjLElBQUksT0FBTztBQUN4QyxXQUFLTixHQUEwQixJQUFJO0FBQ25DO0FBQUEsSUFDRjtBQUNBLFlBQVEsWUFBWSxjQUFjLFlBQVk7QUFFOUMsVUFBTSxjQUFjLGdCQUFnQixZQUFZLGVBQWUsZUFBY08sRUFBYztBQUMzRixVQUFNLFdBQVcsZ0JBQWdCO0FBQUEsTUFDL0IsYUFBYTtBQUFBLE1BQ2IsYUFBYTtBQUFBLE1BQ2IsZUFBY0M7QUFBQSxJQUNoQjtBQUVBLFVBQU0sYUFBYSxTQUFTO0FBQUEsTUFDMUIsZUFBY0MsR0FBZSxjQUFjLFlBQVksR0FBRyxZQUFZLEdBQUcsWUFBWSxHQUFHLENBQUM7QUFBQSxNQUN6RixlQUFjQztBQUFBLElBQ2hCO0FBQ0EsVUFBTSxjQUFjLFNBQVM7QUFBQSxNQUMzQixlQUFjQyxHQUFlO0FBQUEsUUFDM0IsWUFBWSxJQUFJLGFBQWE7QUFBQSxRQUM3QixZQUFZLElBQUksYUFBYTtBQUFBLFFBQzdCLFlBQVksSUFBSSxhQUFhO0FBQUEsUUFDN0I7QUFBQSxNQUNGO0FBQUEsTUFDQSxlQUFjQztBQUFBLElBQ2hCO0FBRUEsVUFBTSxLQUFLLFdBQVc7QUFDdEIsVUFBTSxLQUFLLFlBQVk7QUFDdkIsUUFBSSxPQUFPLEtBQUssT0FBTyxHQUFHO0FBQ3hCLFdBQUtaLEdBQTBCLElBQUk7QUFDbkM7QUFBQSxJQUNGO0FBRUEsVUFBTSxhQUFhLFdBQVcsSUFBSTtBQUNsQyxVQUFNLGFBQWEsV0FBVyxJQUFJO0FBQ2xDLFVBQU0sY0FBYyxZQUFZLElBQUk7QUFDcEMsVUFBTSxjQUFjLFlBQVksSUFBSTtBQUVwQyxVQUFNLGtCQUFrQixjQUFjLGNBQWMsUUFBUTtBQUM1RCxVQUFNLGlCQUFpQixFQUFFLGNBQWMsY0FBYyxTQUFTO0FBQzlELFVBQU0sU0FBUyxLQUFLLE1BQU0sZ0JBQWdCLGNBQWM7QUFDeEQsUUFBSSxTQUFTLE1BQU07QUFDakIsV0FBS0EsR0FBMEIsSUFBSTtBQUNuQztBQUFBLElBQ0Y7QUFFQSxTQUFLcEMsR0FBc0IsY0FBYyxpQkFBaUIsUUFBUSxpQkFBaUIsTUFBTTtBQUFBLEVBQzNGO0FBQUEsRUFFUW9DLEdBQTBCLE1BQVk7QUFDNUMsUUFBSSxTQUFTLEtBQUs7QUFDaEIsV0FBS3BDLEdBQXNCLGNBQWMsR0FBRyxFQUFFO0FBQUEsSUFDaEQsV0FBVyxTQUFTLEtBQUs7QUFDdkIsV0FBS0EsR0FBc0IsY0FBYyxHQUFHLENBQUM7QUFBQSxJQUMvQyxPQUFPO0FBQ0wsV0FBS0EsR0FBc0IsY0FBYyxHQUFHLENBQUM7QUFBQSxJQUMvQztBQUFBLEVBQ0Y7QUFBQSxFQUVRdUMsR0FBMEIsTUFBWSxLQUFxQjtBQUNqRSxRQUFJLFNBQVMsS0FBSztBQUNoQixVQUFJLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUMzQixXQUFXLFNBQVMsS0FBSztBQUN2QixVQUFJLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUMzQixPQUFPO0FBQ0wsVUFBSSxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFFUUcsR0FBNEIsV0FBb0IsUUFBeUIsS0FBcUI7QUFDcEcsVUFBTSxZQUFZLEtBQUtGLEdBQW1DLFdBQVcsZUFBY1MsRUFBYztBQUNqRyxRQUFJLFVBQVUsY0FBYyxJQUFJLE9BQU87QUFDckMsVUFBSSxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBQ3pCO0FBQUEsSUFDRjtBQUNBLFlBQVEsWUFBWSxXQUFXLFNBQVM7QUFFeEMsWUFBUSxRQUFRLFdBQVcsT0FBTyxnQkFBZ0IsR0FBRztBQUNyRCxRQUFJLElBQUksY0FBYyxJQUFJLE9BQU87QUFDL0IsY0FBUSxRQUFRLE9BQU8sU0FBUyxXQUFXLEdBQUc7QUFBQSxJQUNoRDtBQUNBLFFBQUksSUFBSSxjQUFjLElBQUksT0FBTztBQUMvQixXQUFLQyxHQUF5QixXQUFXLEdBQUc7QUFBQSxJQUM5QztBQUFBLEVBQ0Y7QUFBQSxFQUVRQSxHQUF5QixNQUFnQixLQUFxQjtBQUNwRSxRQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLO0FBQzFCLFVBQUksY0FBYyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUFBLElBQ3RDLE9BQU87QUFDTCxVQUFJLGNBQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUM7QUFBQSxJQUN0QztBQUNBLFFBQUksSUFBSSxjQUFjLElBQUksT0FBTztBQUMvQixVQUFJLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFBQSxFQUVRbEIsR0FBbUIsS0FBbUI7QUFDNUMsVUFBTSxVQUFVLEtBQUtOO0FBQ3JCLFFBQUksQ0FBQyxXQUFXLEtBQUt4QixPQUFnQixHQUFHO0FBQ3RDO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxRQUFRLHNCQUFzQjtBQUMzQyxRQUFJLEtBQUssVUFBVSxLQUFLLEtBQUssV0FBVyxHQUFHO0FBQ3pDO0FBQUEsSUFDRjtBQUVBLFVBQU0sV0FBVyxJQUFJLFVBQVUsS0FBSztBQUNwQyxVQUFNLFdBQVcsSUFBSSxVQUFVLEtBQUs7QUFDcEMsVUFBTSxTQUFTLFdBQVcsS0FBS0gsR0FBYztBQUM3QyxVQUFNLFNBQVMsV0FBVyxLQUFLQSxHQUFjO0FBQzdDLFNBQUtBLEdBQWMsY0FBYyxVQUFVLFFBQVE7QUFDbkQsUUFBSSxDQUFDLE9BQU8sU0FBUyxNQUFNLEtBQUssQ0FBQyxPQUFPLFNBQVMsTUFBTSxHQUFHO0FBQ3hEO0FBQUEsSUFDRjtBQUNBLFFBQUksV0FBVyxLQUFLLFdBQVcsR0FBRztBQUNoQztBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQVMsQ0FBQyxTQUFTLEtBQUtDLEdBQXNCLElBQUksU0FBUyxLQUFLQSxHQUFzQjtBQUM1RixRQUFJLFdBQVcsR0FBRztBQUNoQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWEsU0FBUyxLQUFLRTtBQUNqQyxRQUFJLENBQUMsT0FBTyxTQUFTLFVBQVUsS0FBSyxlQUFlLEdBQUc7QUFDcEQ7QUFBQSxJQUNGO0FBRUEsU0FBS0MsTUFBc0I7QUFDM0IsVUFBTSxZQUFZLFdBQVcsY0FBYyxLQUFLRixJQUE2QixLQUFLRSxFQUFrQjtBQUNwRyxTQUFLYixLQUFvQixXQUFXLFNBQVMsV0FBVyxLQUFLQyxFQUFzQjtBQUNuRixTQUFLLFFBQVE7QUFBQSxFQUNmO0FBQUEsRUFFUWlELEdBQW1DLEtBQWUsS0FBcUM7QUFsb0JqRztBQW1vQkksVUFBTSxZQUFZLGVBQWNwQyxHQUFlLEtBQUtNLENBQVE7QUFDNUQsVUFBTSxtQkFBa0IsNENBQVcsZ0JBQVgsbUJBQXdCO0FBQ2hELFFBQUksQ0FBQyxpQkFBaUI7QUFDcEIsYUFBTyxJQUFJLGNBQWMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFBQSxJQUM5QztBQUVBLFVBQU0sU0FBUyxnQkFBZ0I7QUFDL0IsVUFBTSxJQUFJLElBQUk7QUFDZCxVQUFNLElBQUksSUFBSTtBQUNkLFVBQU0sSUFBSSxJQUFJO0FBRWQsVUFBTSxTQUFTLE9BQU8sTUFBTSxJQUFJLE9BQU8sTUFBTSxJQUFJLE9BQU8sTUFBTTtBQUM5RCxVQUFNLFNBQVMsT0FBTyxNQUFNLElBQUksT0FBTyxNQUFNLElBQUksT0FBTyxNQUFNO0FBQzlELFVBQU0sU0FBUyxPQUFPLE1BQU0sSUFBSSxPQUFPLE1BQU0sSUFBSSxPQUFPLE1BQU07QUFFOUQsV0FBTyxJQUFJLGNBQWMsUUFBUSxRQUFRLE1BQU07QUFBQSxFQUNqRDtBQUFBLEVBRVF3QixHQUF3QixLQUE0QztBQXJwQjlFO0FBc3BCSSxRQUFJLFVBQVUsSUFBSTtBQUNsQixRQUFJLEVBQUMsbUNBQVMsd0JBQXVCO0FBQ25DLGlCQUFVLFVBQUt4QixFQUFTLE9BQU8sbUJBQXJCLFlBQXVDO0FBQUEsSUFDbkQ7QUFDQSxRQUFJLEVBQUMsbUNBQVMsd0JBQXVCO0FBQ25DLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRb0IsS0FBNEI7QUFDbEMsUUFBSSxLQUFLaEMsSUFBOEI7QUFDckM7QUFBQSxJQUNGO0FBQ0EsaUJBQWEsd0JBQXdCO0FBQ3JDLFNBQUtBLEtBQStCO0FBQUEsRUFDdEM7QUFBQSxFQUVRbUMsS0FBbUM7QUFDekMsUUFBSSxDQUFDLEtBQUtuQyxJQUE4QjtBQUN0QztBQUFBLElBQ0Y7QUFDQSxpQkFBYSx1QkFBdUI7QUFDcEMsU0FBS0EsS0FBK0I7QUFBQSxFQUN0QztBQUFBLEVBRUEsT0FBZStCLEdBQWlCLFVBQW9CLE1BQXFCO0FBQ3ZFLFlBQVEsTUFBTTtBQUFBLE1BQ1osS0FBSztBQUNILGVBQU8sUUFBUSxVQUFVLEdBQUcsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUFBLE1BQ3BELEtBQUs7QUFDSCxlQUFPLFFBQVEsVUFBVSxTQUFTLEdBQUcsR0FBRyxTQUFTLENBQUM7QUFBQSxNQUNwRDtBQUNFLGVBQU8sUUFBUSxVQUFVLFNBQVMsR0FBRyxTQUFTLEdBQUcsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBRVFNLEdBQXVCLE1BQXFCO0FBQ2xELFVBQU0sU0FBUyxLQUFLdkIsR0FBUyxjQUFjLEVBQUU7QUFDN0MsUUFBSSxlQUFjSyxPQUFZLFdBQVcsR0FBRyxJQUFJLE1BQU0sTUFBTSxHQUFHO0FBQzdELGFBQU8sZUFBY29CLEdBQWdCLElBQUk7QUFBQSxJQUMzQztBQUVBLFVBQU0sY0FBYyxPQUFPLFlBQVksVUFBVTtBQUNqRCxVQUFNLFNBQVMsU0FBUztBQUFBLE1BQ3RCLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxJQUNkO0FBQ0EsVUFBTSxTQUFTLFNBQVMsVUFBVSxNQUFNO0FBQ3hDLFdBQU8sT0FBTyxlQUFlLGVBQWNBLEdBQWdCLElBQUksQ0FBQztBQUFBLEVBQ2xFO0FBQUEsRUFFQSxPQUFlQSxHQUFnQixNQUFxQjtBQUNsRCxZQUFRLE1BQU07QUFBQSxNQUNaLEtBQUs7QUFDSCxlQUFPLGVBQWNjO0FBQUEsTUFDdkIsS0FBSztBQUNILGVBQU8sZUFBY0M7QUFBQSxNQUN2QjtBQUNFLGVBQU8sZUFBY0M7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE9BQWUxQixHQUFVLFFBQWdCLEtBQW1CLFFBQVEsT0FBTztBQUN6RSxVQUFNLFlBQVksZUFBY3ZCLEdBQWUsTUFBTTtBQUNyRCxVQUFNLFFBQTBCLEVBQUUsUUFBUSxNQUFNO0FBQ2hELFFBQUksQ0FBQyxXQUFXO0FBQ2QsYUFBTyxFQUFFLFNBQVMsT0FBTyxTQUFTLE9BQU8sU0FBUyxNQUFNO0FBQUEsSUFDMUQ7QUFFQSxVQUFNLE9BQVEsSUFBSSxPQUF1QixzQkFBc0I7QUFDL0QsVUFBTSxRQUFTLElBQUksT0FBdUI7QUFDMUMsVUFBTSxTQUFVLElBQUksT0FBdUI7QUFDM0MsVUFBTSxJQUFJLElBQUksVUFBVSxLQUFLO0FBQzdCLFVBQU0sSUFBSSxLQUFLLFVBQVUsSUFBSSxVQUFVLEtBQUs7QUFDNUMsVUFBTSxXQUFXLFFBQVEsVUFBVSxHQUFHLEdBQUcsT0FBTyxNQUFNO0FBQ3RELFVBQU0sZUFBZSxPQUFPLG9CQUFvQixhQUFhLGlCQUFpQixnQkFBZ0IsV0FBVyxNQUFNLENBQUM7QUFJaEgsVUFBTSxTQUFTLFFBQVEsZUFBY2tELEtBQTBCLGVBQWNDO0FBQzdFLFFBQUksR0FBRyxJQUFJLE1BQU0sWUFBWSxHQUFHO0FBQzlCLGFBQU8sRUFBRSxTQUFTLE9BQU8sU0FBUyxPQUFPLFNBQVMsTUFBTTtBQUFBLElBQzFEO0FBRUEsVUFBTSxVQUFVLE9BQU8sR0FBRyxHQUFHLGNBQWMsVUFBVSxVQUFVLFdBQVc7QUFDMUUsVUFBTSxVQUFVLE9BQU8sR0FBRyxHQUFHLGNBQWMsVUFBVSxVQUFVLFdBQVc7QUFDMUUsVUFBTSxVQUFVLE9BQU8sR0FBRyxHQUFHLGNBQWMsVUFBVSxVQUFVLFdBQVc7QUFFMUUsV0FBTyxFQUFFLFNBQVMsU0FBUyxRQUFRO0FBQUEsRUFDckM7QUFBQSxFQUVBLE9BQWVBLEdBQ2IsR0FDQSxHQUNBLFFBQ0EsYUFDRyxVQUNlO0FBL3ZCdEI7QUFnd0JJLFFBQUksZ0JBQWtDLEVBQUUsUUFBUSxNQUFNO0FBQ3RELGVBQVcsVUFBVSxVQUFVO0FBQzdCLFVBQUksR0FBRyxJQUFJLE1BQU0sTUFBTSxHQUFHO0FBQ3hCO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBUyxPQUFPLFFBQVEsRUFBRSx5QkFBeUIsR0FBRyxHQUFHLFFBQVEsVUFBVSxDQUFHO0FBQ3BGLFVBQUksQ0FBQyxPQUFPLFFBQVE7QUFDbEI7QUFBQSxNQUNGO0FBQ0EsWUFBTSxtQkFBa0Isa0JBQU8sU0FBUCxtQkFBYSxNQUFiLFlBQWtCLE9BQU87QUFDakQsWUFBTSxtQkFBa0IseUJBQWMsU0FBZCxtQkFBb0IsTUFBcEIsWUFBeUIsT0FBTztBQUN4RCxVQUFJLENBQUMsY0FBYyxVQUFVLGtCQUFrQixpQkFBaUI7QUFDOUQsd0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQWVELEdBQ2IsR0FDQSxHQUNBLFFBQ0EsYUFDRyxVQUNlO0FBeHhCdEI7QUF5eEJJLFFBQUksZ0JBQWtDLEVBQUUsUUFBUSxNQUFNO0FBQ3RELGVBQVcsVUFBVSxVQUFVO0FBQzdCLFVBQUksR0FBRyxJQUFJLE1BQU0sTUFBTSxHQUFHO0FBQ3hCO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBUyxPQUFPLFFBQVEsRUFBRSx5QkFBeUIsR0FBRyxHQUFHLFFBQVEsVUFBVSxDQUFHO0FBQ3BGLFVBQUksQ0FBQyxPQUFPLFFBQVE7QUFDbEI7QUFBQSxNQUNGO0FBQ0EsWUFBTSxtQkFBa0Isa0JBQU8sU0FBUCxtQkFBYSxNQUFiLFlBQWtCLE9BQU87QUFDakQsWUFBTSxtQkFBa0IseUJBQWMsU0FBZCxtQkFBb0IsTUFBcEIsWUFBeUIsT0FBTztBQUN4RCxVQUFJLENBQUMsY0FBYyxVQUFVLGtCQUFrQixpQkFBaUI7QUFDOUQsd0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQWVqQyxHQUFzQixRQUFnQixNQUFZLFVBQTBCO0FBQ3pGLFVBQU0sU0FBUyxlQUFjZDtBQUM3QixVQUFNLE9BQU8sSUFBSSxLQUFLLE1BQU07QUFDNUIsU0FBSyxTQUFTO0FBQUEsTUFDWjtBQUFBLE1BQ0EsV0FBVyxTQUFTO0FBQUEsTUFDcEIsVUFBVTtBQUFBLE1BQ1Y7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQWVxQixHQUNiLFlBQ3NEO0FBMXpCMUQ7QUEyekJJLFFBQUk7QUFDSixlQUFXLGFBQWEsWUFBWTtBQUNsQyxVQUFJLENBQUMsVUFBVSxPQUFPLFFBQVE7QUFDNUI7QUFBQSxNQUNGO0FBQ0EsWUFBTSxZQUFXLHFCQUFVLE9BQU8sU0FBakIsbUJBQXVCLE1BQXZCLFlBQTRCLE9BQU87QUFDcEQsVUFBSSxDQUFDLFdBQVcsYUFBWSxtQkFBUSxPQUFPLFNBQWYsbUJBQXFCLE1BQXJCLFlBQTBCLE9BQU8sb0JBQW9CO0FBQy9FLGtCQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsT0FBZVIsR0FBcUIsUUFBZ0IsT0FBMEI7QUFDNUUsVUFBTSxXQUFXLDBCQUEwQixNQUFNO0FBQ2pELGFBQVMsWUFBWSxVQUFVO0FBQy9CLGFBQVMsV0FBVztBQUNwQixhQUFTLGFBQWEsc0JBQXNCLEtBQUs7QUFDakQsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGtCQUFrQixRQUFzQjtBQUM3QyxtQkFBY2YsR0FBZSxPQUFPLE9BQU8sU0FBUztBQUNwRCxtQkFBY1UsS0FBZTtBQUFBLEVBQy9CO0FBQ0Y7QUFBQTtBQWx5QmEsZUFFSVYsS0FBc0Qsb0JBQUksSUFBSTtBQUZsRSxlQUlJVSxLQUE4QjtBQUpsQyxlQUtJRSxLQUE2QjtBQUxqQyxlQU1JVixLQUFXO0FBQUE7QUFOZixlQVFJQyxLQUFxQjtBQVJ6QixlQVNhMkMsS0FBVSxRQUFRLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFUaEQsZUFVYUMsS0FBVSxRQUFRLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFWaEQsZUFXYUMsS0FBVSxRQUFRLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFYaEQsZUFZYUcsS0FBa0IsZ0JBQWdCLEtBQUs7QUFacEQsZUFhYUMsS0FBa0IsZ0JBQWdCLEtBQUs7QUFicEQsZUFjYWIsS0FBa0IsZ0JBQWdCLEtBQUs7QUFkcEQsZUFlYUMsS0FBaUIsZUFBZSxLQUFLO0FBZmxELGVBZ0JhRSxLQUFpQixlQUFlLEtBQUs7QUFoQmxELGVBaUJhRCxLQUFpQixlQUFlLEtBQUs7QUFqQmxELGVBa0JhRSxLQUFpQixlQUFlLEtBQUs7QUFsQmxELGVBbUJhVSxLQUFpQixlQUFlLEtBQUs7QUFuQmxELGVBb0JhQyxLQUFpQixlQUFlLEtBQUs7QUFwQmxELGVBcUJhQyxLQUFpQixlQUFlLEtBQUs7QUFyQmxELGVBc0JhQyxLQUFpQixlQUFlLEtBQUs7QUF0QmxELGVBdUJhQyxLQUFpQixlQUFlLEtBQUs7QUF2QmxELGVBd0JhQyxLQUFpQixlQUFlLEtBQUs7QUF4QmxELGVBeUJhZCxLQUFpQixlQUFlLEtBQUs7QUF6QmxELGVBMEJhTixLQUFpQixlQUFlLEtBQUs7QUExQmxELGVBMkJhTCxLQUFpQixlQUFlLEtBQUs7QUEzQmxELGVBNEJhRyxLQUFpQixlQUFlLEtBQUs7QUFBQTtBQTVCbEQsZUE4QmFoQixLQUFvQixrQkFBa0IsU0FBUztBQTlCbEUsSUFBTSxnQkFBTjsiLAogICJuYW1lcyI6IFsiX19pc1BvaW50ZXJEb3duIiwgIl9fc3RhcnRWZWN0b3IiLCAiX19kZWx0YVF1YXRlcm5pb24iLCAiX190YXJnZXRSb3RhdGlvbkJhY2t1cCIsICJfX29uUG9pbnRlckRvd25GdW5jIiwgIl9fb25Qb2ludGVyRG93biIsICJfX29uUG9pbnRlck1vdmVGdW5jIiwgIl9fb25Qb2ludGVyTW92ZSIsICJfX29uUG9pbnRlclVwRnVuYyIsICJfX29uUG9pbnRlclVwIiwgIl9faXNDYW1lcmFDb250cm9sbGVyRGlzYWJsZWQiLCAiX19wb2ludGVyUHJldiIsICJfX2RyYWdTY3JlZW5EaXJlY3Rpb24iLCAiX19yb3RhdGlvbkF4aXNGb3JRdWF0ZXJuaW9uIiwgIl9fZHJhZ1NjYWxlIiwgIl9fYWNjdW11bGF0ZWRBbmdsZSIsICJfX2dldFJlc291cmNlcyIsICJfX3Jlc291cmNlc01hcCIsICJfX3RvcEVudGl0eSIsICJfX2xlbmd0aCIsICJfX3NjcmVlblNwYWNlUmF0aW8iLCAiX19pc1Zpc2libGUiLCAiX19lbmdpbmUiLCAiX19sYXRlc3RUYXJnZXRFbnRpdHkiLCAiX190YXJnZXQiLCAiX19hdHRhY2hTaGFyZWRHcm91cCIsICJfX2FwcGx5U3BhY2VUb0dyb3VwIiwgIl9fYWN0aXZlQXhpcyIsICJfX3NldFZpc2libGUiLCAiX19zcGFjZSIsICJfX3RvU2tpcFNldHVwIiwgIl9fY3JlYXRlUmVzb3VyY2VzIiwgIl9fY3JlYXRlUmluZ01hdGVyaWFsIiwgIl9fY3JlYXRlUmluZ1ByaW1pdGl2ZSIsICJfX2NhbGNTY3JlZW5TcGFjZVNjYWxlIiwgIl9fdXBkYXRlV29ybGRNYXRyaWNlc09mU3VidHJlZSIsICJfX2Rlc3Ryb3lUb3BFbnRpdHkiLCAiX190bXBRdWF0ZXJuaW9uXzAiLCAiX19hY3RpdmVQb2ludGVyRWxlbWVudCIsICJfX2Nhc3RSYXkiLCAiX19zZWxlY3RDbG9zZXN0QXhpcyIsICJfX3Byb2plY3RUb1BsYW5lIiwgIl9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIiLCAiX19wcmVwYXJlTGluZWFyRHJhZ01hcHBpbmciLCAiX19oYW5kbGVMaW5lYXJEcmFnIiwgIl9fZW5hYmxlQ2FtZXJhQ29udHJvbGxlcklmTmVlZGVkIiwgIl9fcmVzb2x2ZVBvaW50ZXJFbGVtZW50IiwgIl9fZ2V0QXhpc0ZvclF1YXRlcm5pb24iLCAiX19zZXREZWZhdWx0RHJhZ0RpcmVjdGlvbiIsICJfX2dldEF4aXNWZWN0b3IiLCAiX190bXBWZWN0b3IzXzgiLCAiX19zZXRGYWxsYmFja0xvY2FsVGFuZ2VudCIsICJfX3RyYW5zZm9ybURpcmVjdGlvbkZyb21Hcm91cExvY2FsIiwgIl9fdG1wVmVjdG9yM185IiwgIl9fc2V0RmFsbGJhY2tXb3JsZERpcmVjdGlvbiIsICJfX3RtcFZlY3RvcjNfNyIsICJfX3RtcE1hdHJpeDQ0XzIiLCAiX190bXBWZWN0b3I0XzAiLCAiX190bXBWZWN0b3I0XzIiLCAiX190bXBWZWN0b3I0XzEiLCAiX190bXBWZWN0b3I0XzMiLCAiX190bXBWZWN0b3IzXzYiLCAiX19jaG9vc2VBbnlQZXJwZW5kaWN1bGFyIiwgIl9fdW5pdFgiLCAiX191bml0WSIsICJfX3VuaXRaIiwgIl9fY2FzdEZyb21FbnRpdGllc0xvY2FsIiwgIl9fY2FzdEZyb21FbnRpdGllcyIsICJfX3RtcE1hdHJpeDQ0XzAiLCAiX190bXBNYXRyaXg0NF8xIiwgIl9fdG1wVmVjdG9yM18wIiwgIl9fdG1wVmVjdG9yM18xIiwgIl9fdG1wVmVjdG9yM18yIiwgIl9fdG1wVmVjdG9yM18zIiwgIl9fdG1wVmVjdG9yM180IiwgIl9fdG1wVmVjdG9yM181Il0KfQo=
