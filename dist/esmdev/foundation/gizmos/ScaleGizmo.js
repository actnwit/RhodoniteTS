// src/foundation/gizmos/ScaleGizmo.ts
import { CameraComponent } from "../components/Camera/CameraComponent.js";
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { createGroupEntity } from "../components/SceneGraph/createGroupEntity.js";
import { AlphaMode } from "../definitions/AlphaMode.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Cube } from "../geometry/shapes/Cube.js";
import { Plane } from "../geometry/shapes/Plane.js";
import { createClassicUberMaterial } from "../helpers/materials/createClassicUberMaterial.js";
import { MathUtil } from "../math/MathUtil.js";
import { Matrix33 } from "../math/Matrix33.js";
import { MutableMatrix33 } from "../math/MutableMatrix33.js";
import { MutableQuaternion } from "../math/MutableQuaternion.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector4 } from "../math/Vector4.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { assertExist } from "../misc/MiscUtil.js";
import { getEvent, INPUT_HANDLING_STATE_GIZMO_SCALE, InputManager } from "../system/InputManager.js";
import { Gizmo } from "./Gizmo.js";
var _ScaleGizmo = class _ScaleGizmo extends Gizmo {
  constructor() {
    super(...arguments);
    this.Un = Vector3.zero();
    this.Wn = Vector3.one();
    this.Vn = Vector3.one();
    this.Qm = false;
    this.Xm = false;
    this.xn = this.yn.bind(this);
    this.zn = this.An.bind(this);
    this.hn = this.Bn.bind(this);
  }
  /**
   * Gets the resources for a specific engine, or undefined if not initialized.
   */
  static Pm(engine) {
    return _ScaleGizmo._m.get(engine.objectUID);
  }
  ///
  ///
  /// Accessors
  ///
  ///
  /**
   * Checks if the gizmo has been properly set up and initialized
   * @returns True if the gizmo is set up, false otherwise
   */
  get isSetup() {
    if (this.pm != null) {
      return true;
    }
    return false;
  }
  /**
   * Sets the length of the gizmo handles
   * @param val - The length value to set
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value no longer affects the visual size.
   */
  set length(val) {
    _ScaleGizmo.Lm = val;
  }
  /**
   * Gets the current length of the gizmo handles
   * @returns The current length value
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value no longer affects the visual size.
   */
  get length() {
    return _ScaleGizmo.Lm;
  }
  /**
   * Sets the gizmo size as a fraction of the viewport height.
   * The unit axis length is projected to this fraction of the viewport height.
   * @param val - The ratio of the viewport height (for example, 0.12 for 12%)
   */
  set screenSpaceRatio(val) {
    _ScaleGizmo.an = val;
  }
  /**
   * Gets the gizmo size as a fraction of the viewport height.
   * @returns The ratio of the viewport height occupied by the gizmo's unit axis length
   */
  get screenSpaceRatio() {
    return _ScaleGizmo.an;
  }
  /**
   * Sets the visibility of the gizmo and manages input event registration
   * @param flg - True to show the gizmo, false to hide it
   */
  set isVisible(flg) {
    const resources = _ScaleGizmo.Pm(this.c);
    if (!resources) {
      return;
    }
    if (this.wm === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(this.c.config.eventTargetDom)) {
        eventTargetDom = this.c.config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_SCALE, [
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
      this.pm.getSceneGraph().addChild(resources.groupEntity.getSceneGraph());
      _ScaleGizmo.cn = this.qm;
      if (_ScaleGizmo.$m === "local") {
        const quaternion = _ScaleGizmo.gn;
        const parent = this.qm.getSceneGraph();
        if (Is.exist(parent)) {
          parent.getQuaternionRecursivelyTo(quaternion);
        } else {
          quaternion.identity();
        }
        resources.groupEntity.getTransform().localRotation = quaternion;
      } else if (_ScaleGizmo.$m === "world") {
        resources.groupEntity.getTransform().localRotation = _ScaleGizmo.gn.identity();
      }
    }
    if (this.wm === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_SCALE);
      this.Wn = this.qm.getTransform().localScale;
      this.Un = Vector3.zero();
      this.Qm = false;
      this.Vn = this.qm.getTransform().localScale;
      _ScaleGizmo.Nm = "none";
    }
    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_SCALE, flg);
    this.xm(flg);
    resources.xyPlaneEntity.getSceneGraph().isVisible = false;
    resources.yzPlaneEntity.getSceneGraph().isVisible = false;
    resources.zxPlaneEntity.getSceneGraph().isVisible = false;
  }
  /**
   * Sets the coordinate space for gizmo operations
   * @param space - The coordinate space to use ('local' or 'world')
   */
  setSpace(space) {
    _ScaleGizmo.$m = space;
    if (this.wm) {
      this.isVisible = false;
      this.isVisible = true;
    }
  }
  /**
   * Gets the current visibility state of the gizmo
   * @returns True if the gizmo is visible, false otherwise
   */
  get isVisible() {
    return this.wm;
  }
  ///
  ///
  /// Friends Members
  ///
  ///
  /**
   * @internal
   * Sets up the gizmo entities and their visual components if not already done
   * Creates all necessary meshes, materials, and entity hierarchies for the scale gizmo
   */
  _setup() {
    if (this.rm()) {
      return;
    }
    this.pm = createGroupEntity(this.c);
    this.pm.tryToSetUniqueName(`ScaleGizmo_of_${this.qm.uniqueName}`, true);
    this.pm.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.qm.getSceneGraph()._addGizmoChild(this.pm.getSceneGraph());
    let resources = _ScaleGizmo.Pm(this.c);
    if (!resources) {
      resources = this.Cn();
      _ScaleGizmo._m.set(this.c.objectUID, resources);
    }
    this.pm.getSceneGraph().addChild(resources.groupEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.xCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.xyPlaneEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yzPlaneEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zxPlaneEntity.getSceneGraph());
    _ScaleGizmo.cn = this.qm;
    this.setGizmoTag();
    this.pm.tryToSetTag({ tag: "Gizmo", value: "Scale" });
  }
  /**
   * Creates all resources needed for the gizmo.
   */
  Cn() {
    const xCubeEntity = createMeshEntity(this.c);
    xCubeEntity.tryToSetUniqueName("ScaleGizmo_xCube", true);
    xCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
    const xCubeMesh = new Mesh(this.c);
    const xCubeMaterial = createClassicUberMaterial(this.c);
    xCubeMaterial.setParameter("diffuseColorFactor", Vector4.fromCopyArray4([1, 0, 0, 1]));
    const xCubePrimitive = new Cube(this.c);
    xCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(1, 0.05, 0.05),
      material: xCubeMaterial
    });
    xCubeMesh.addPrimitive(xCubePrimitive);
    xCubeEntity.getMesh().setMesh(xCubeMesh);
    const yCubeEntity = createMeshEntity(this.c);
    yCubeEntity.tryToSetUniqueName("ScaleGizmo_yCube", true);
    yCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
    const yCubeMesh = new Mesh(this.c);
    const yCubeMaterial = createClassicUberMaterial(this.c);
    yCubeMaterial.setParameter("diffuseColorFactor", Vector4.fromCopyArray4([0, 1, 0, 1]));
    const yCubePrimitive = new Cube(this.c);
    yCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 1, 0.05),
      material: yCubeMaterial
    });
    yCubeMesh.addPrimitive(yCubePrimitive);
    yCubeEntity.getMesh().setMesh(yCubeMesh);
    const zCubeEntity = createMeshEntity(this.c);
    zCubeEntity.tryToSetUniqueName("ScaleGizmo_zCube", true);
    zCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
    const zCubeMesh = new Mesh(this.c);
    const zCubeMaterial = createClassicUberMaterial(this.c);
    zCubeMaterial.setParameter("diffuseColorFactor", Vector4.fromCopyArray4([0, 0, 1, 1]));
    const zCubePrimitive = new Cube(this.c);
    zCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 0.05, 1),
      material: zCubeMaterial
    });
    zCubeMesh.addPrimitive(zCubePrimitive);
    zCubeEntity.getMesh().setMesh(zCubeMesh);
    const xEdgeCubeEntity = createMeshEntity(this.c);
    xEdgeCubeEntity.tryToSetUniqueName("ScaleGizmo_xEdgeCube", true);
    xEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
    const xEdgeCubeMesh = new Mesh(this.c);
    const xEdgeCubePrimitive = new Cube(this.c);
    xEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: xCubeMaterial
    });
    xEdgeCubeMesh.addPrimitive(xEdgeCubePrimitive);
    xEdgeCubeEntity.getMesh().setMesh(xEdgeCubeMesh);
    xCubeEntity.addChild(xEdgeCubeEntity.getSceneGraph());
    const yEdgeCubeEntity = createMeshEntity(this.c);
    yEdgeCubeEntity.tryToSetUniqueName("ScaleGizmo_yEdgeCube", true);
    yEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
    const yEdgeCubeMesh = new Mesh(this.c);
    const yEdgeCubePrimitive = new Cube(this.c);
    yEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: yCubeMaterial
    });
    yEdgeCubeMesh.addPrimitive(yEdgeCubePrimitive);
    yEdgeCubeEntity.getMesh().setMesh(yEdgeCubeMesh);
    yCubeEntity.addChild(yEdgeCubeEntity.getSceneGraph());
    const zEdgeCubeEntity = createMeshEntity(this.c);
    zEdgeCubeEntity.tryToSetUniqueName("ScaleGizmo_zEdgeCube", true);
    zEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
    const zEdgeCubeMesh = new Mesh(this.c);
    const zEdgeCubePrimitive = new Cube(this.c);
    zEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: zCubeMaterial
    });
    zEdgeCubeMesh.addPrimitive(zEdgeCubePrimitive);
    zEdgeCubeEntity.getMesh().setMesh(zEdgeCubeMesh);
    zCubeEntity.addChild(zEdgeCubeEntity.getSceneGraph());
    const xyPlaneEntity = createMeshEntity(this.c);
    xyPlaneEntity.tryToSetUniqueName("ScaleGizmo_xyPlane", true);
    xyPlaneEntity.getSceneGraph().isVisible = false;
    xyPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(MathUtil.degreeToRadian(90), 0, 0);
    const xyPlaneMaterial = createClassicUberMaterial(this.c);
    xyPlaneMaterial.alphaMode = AlphaMode.Blend;
    xyPlaneMaterial.setParameter("diffuseColorFactor", Vector4.fromCopyArray4([0, 0, 0.5, 0]));
    const xyPlaneMesh = new Mesh(this.c);
    const xyPlanePrimitive = new Plane(this.c);
    xyPlanePrimitive.generate({
      width: 1e5,
      height: 1e5,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: xyPlaneMaterial
    });
    xyPlaneMesh.addPrimitive(xyPlanePrimitive);
    xyPlaneEntity.getMesh().setMesh(xyPlaneMesh);
    const yzPlaneEntity = createMeshEntity(this.c);
    yzPlaneEntity.tryToSetUniqueName("ScaleGizmo_yzPlane", true);
    yzPlaneEntity.getSceneGraph().isVisible = false;
    yzPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(0, 0, MathUtil.degreeToRadian(90));
    const yzPlaneMaterial = createClassicUberMaterial(this.c);
    yzPlaneMaterial.alphaMode = AlphaMode.Blend;
    yzPlaneMaterial.setParameter("diffuseColorFactor", Vector4.fromCopyArray4([0.5, 0, 0, 0]));
    const yzPlaneMesh = new Mesh(this.c);
    const yzPlanePrimitive = new Plane(this.c);
    yzPlanePrimitive.generate({
      width: 1e5,
      height: 1e5,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: yzPlaneMaterial
    });
    yzPlaneMesh.addPrimitive(yzPlanePrimitive);
    yzPlaneEntity.getMesh().setMesh(yzPlaneMesh);
    const zxPlaneEntity = createMeshEntity(this.c);
    zxPlaneEntity.tryToSetUniqueName("ScaleGizmo_zxPlane", true);
    zxPlaneEntity.getSceneGraph().isVisible = false;
    const zxPlaneMaterial = createClassicUberMaterial(this.c);
    zxPlaneMaterial.setParameter("diffuseColorFactor", Vector4.fromCopyArray4([0, 0.5, 0, 0]));
    zxPlaneMaterial.alphaMode = AlphaMode.Blend;
    const zxPlaneMesh = new Mesh(this.c);
    const zxPlanePrimitive = new Plane(this.c);
    zxPlanePrimitive.generate({
      width: 1e5,
      height: 1e5,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: zxPlaneMaterial
    });
    zxPlaneMesh.addPrimitive(zxPlanePrimitive);
    zxPlaneEntity.getMesh().setMesh(zxPlaneMesh);
    const groupEntity = createGroupEntity(this.c);
    return {
      groupEntity,
      xCubeEntity,
      yCubeEntity,
      zCubeEntity,
      xCubeMesh,
      yCubeMesh,
      zCubeMesh,
      xCubePrimitive,
      yCubePrimitive,
      zCubePrimitive,
      xEdgeCubeEntity,
      yEdgeCubeEntity,
      zEdgeCubeEntity,
      xEdgeCubeMesh,
      yEdgeCubeMesh,
      zEdgeCubeMesh,
      xEdgeCubePrimitive,
      yEdgeCubePrimitive,
      zEdgeCubePrimitive,
      xCubeMaterial,
      yCubeMaterial,
      zCubeMaterial,
      xyPlaneEntity,
      yzPlaneEntity,
      zxPlaneEntity,
      xyPlaneMesh,
      yzPlaneMesh,
      zxPlaneMesh,
      xyPlanePrimitive,
      yzPlanePrimitive,
      zxPlanePrimitive,
      xyPlaneMaterial,
      yzPlaneMaterial,
      zxPlaneMaterial
    };
  }
  /**
   * @internal
   * Updates the gizmo's transform, scale, and position based on the target entity
   * Called each frame to maintain proper gizmo positioning and scaling behavior
   */
  _update() {
    if (this.pm == null) {
      return;
    }
    const sg = this.qm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    const worldPosition = aabb.isVanilla() ? sg.position : aabb.centerPoint;
    const transform = this.pm.getTransform();
    transform.localPosition = worldPosition;
    const scale = Gizmo.zm(this.c, worldPosition, _ScaleGizmo.an);
    transform.localScale = Vector3.fromCopy3(scale, scale, scale);
    this.ym();
    if (this.Qm) {
      if (_ScaleGizmo.cn === this.qm) {
        this.qm.getTransform().localScale = this.Wn;
      }
    }
  }
  ///
  ///
  /// Private Static Members
  ///
  ///
  /**
   * Generates a primitive for line-based gizmo visualization
   * @returns A primitive containing position and color data for axis lines
   * @private
   */
  static Mm(engine) {
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      this.Lm,
      0,
      0,
      // Y axis
      0,
      0,
      0,
      0,
      this.Lm,
      0,
      // Z axis
      0,
      0,
      0,
      0,
      0,
      this.Lm
    ]);
    const color = new Float32Array([
      // X axis as Red
      1,
      0,
      0,
      1,
      0,
      0,
      // Y axis as Green
      0,
      1,
      0,
      0,
      1,
      0,
      // Z axis as Blue
      0,
      0,
      1,
      0,
      0,
      1
    ]);
    const primitive = Primitive.createPrimitive(engine, {
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Color0.XYZ],
      attributes: [positions, color],
      primitiveMode: PrimitiveMode.Lines
    });
    return primitive;
  }
  /**
   * Handles pointer down events for initiating scaling operations
   * @param evt - The pointer event containing input information
   * @private
   */
  yn(evt) {
    this.Qm = true;
    _ScaleGizmo.Nm = "none";
    _ScaleGizmo.S = evt.clientX;
    _ScaleGizmo.T = evt.clientY;
    const worldMatrix = this.qm.getSceneGraph().matrix.getRotate();
    const scaleVec = Vector3.one();
    let rotMat = Matrix33.fromCopy9RowMajor(
      scaleVec.x * worldMatrix.m00,
      scaleVec.x * worldMatrix.m01,
      scaleVec.x * worldMatrix.m02,
      scaleVec.y * worldMatrix.m10,
      scaleVec.y * worldMatrix.m11,
      scaleVec.y * worldMatrix.m12,
      scaleVec.z * worldMatrix.m20,
      scaleVec.z * worldMatrix.m21,
      scaleVec.z * worldMatrix.m22
    );
    if (_ScaleGizmo.$m === "local") {
      rotMat = Matrix33.transpose(rotMat);
    } else if (_ScaleGizmo.$m === "world") {
      rotMat = MutableMatrix33.identity();
    }
    const { xResult, yResult, zResult } = _ScaleGizmo.castRay(this.c, evt);
    let axisPicked = false;
    if (xResult.result) {
      assertExist(xResult.data);
      this.Un = rotMat.multiplyVector(xResult.data.position.clone());
      Logger.default.debug(`Down:${this.Un.toStringApproximately()}`);
      _ScaleGizmo.Nm = "x";
      axisPicked = true;
    }
    if (yResult.result) {
      assertExist(yResult.data);
      this.Un = rotMat.multiplyVector(yResult.data.position.clone());
      Logger.default.debug(`Down:${this.Un.toStringApproximately()}`);
      _ScaleGizmo.Nm = "y";
      axisPicked = true;
    }
    if (zResult.result) {
      assertExist(zResult.data);
      this.Un = rotMat.multiplyVector(zResult.data.position.clone());
      Logger.default.debug(`Down:${this.Un.toStringApproximately()}`);
      _ScaleGizmo.Nm = "z";
      axisPicked = true;
    }
    if (_ScaleGizmo.Nm === "none" || axisPicked === false) {
      this.Qm = false;
      return;
    }
    evt.preventDefault();
    this.Gn();
    if (_ScaleGizmo.cn === this.qm) {
      this.Vn = this.qm.getTransform().localScale;
    }
  }
  /**
   * Handles pointer move events for performing real-time scaling
   * @param evt - The pointer event containing current pointer position
   * @private
   */
  An(evt) {
    evt.preventDefault();
    if (Is.false(this.Qm)) {
      return;
    }
    const resources = _ScaleGizmo.Pm(this.c);
    if (!resources) {
      return;
    }
    const rect = evt.target.getBoundingClientRect();
    const width = evt.target.clientWidth;
    const height = evt.target.clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height);
    const activeCamera = this.c.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.c)
    );
    const worldMatrix = this.qm.getSceneGraph().matrix.getRotate();
    const scaleVec = Vector3.one();
    let rotMat = Matrix33.fromCopy9RowMajor(
      scaleVec.x * worldMatrix.m00,
      scaleVec.x * worldMatrix.m01,
      scaleVec.x * worldMatrix.m02,
      scaleVec.y * worldMatrix.m10,
      scaleVec.y * worldMatrix.m11,
      scaleVec.y * worldMatrix.m12,
      scaleVec.z * worldMatrix.m20,
      scaleVec.z * worldMatrix.m21,
      scaleVec.z * worldMatrix.m22
    );
    if (_ScaleGizmo.$m === "local") {
      rotMat = Matrix33.transpose(rotMat);
    } else if (_ScaleGizmo.$m === "world") {
      rotMat = MutableMatrix33.identity();
    }
    let pickInMovingPoint = this.Un.clone();
    if (_ScaleGizmo.Nm === "x") {
      const xResult = resources.xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera, viewport, 0);
      if (xResult.result) {
        assertExist(xResult.data);
        const position = rotMat.multiplyVector(xResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(position.x, pickInMovingPoint.y, pickInMovingPoint.z);
        Logger.default.debug(`Move:${xResult.data.position.toStringApproximately()}`);
      }
    }
    if (_ScaleGizmo.Nm === "y") {
      const yResult = resources.xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera, viewport, 0);
      if (yResult.result) {
        assertExist(yResult.data);
        const position = rotMat.multiplyVector(yResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, position.y, pickInMovingPoint.z);
        Logger.default.debug(`Move:${yResult.data.position.toStringApproximately()}`);
      }
    }
    if (_ScaleGizmo.Nm === "z") {
      const zResult = resources.yzPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera, viewport, 0);
      if (zResult.result) {
        assertExist(zResult.data);
        const position = rotMat.multiplyVector(zResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, position.z);
        Logger.default.debug(`Move:${zResult.data.position.toStringApproximately()}`);
      }
    }
    const sg = this.qm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    const deltaVector3 = Vector3.multiplyTo(
      Vector3.subtractTo(pickInMovingPoint, this.Un, _ScaleGizmo.Hc),
      1 / aabb.lengthCenterToCorner,
      _ScaleGizmo.Dc
    );
    Logger.default.debug(`${this.qm.uniqueName}: ${deltaVector3.toStringApproximately()}`);
    if (_ScaleGizmo.$m === "local") {
      this.Wn = _ScaleGizmo.Ec.setComponents(
        Math.max(this.Vn.x + deltaVector3.x, 0.01),
        Math.max(this.Vn.y + deltaVector3.y, 0.01),
        Math.max(this.Vn.z + deltaVector3.z, 0.01)
      );
    } else if (_ScaleGizmo.$m === "world") {
      const worldQuaternion = this.qm.getSceneGraph().getQuaternionRecursivelyTo(_ScaleGizmo.gn);
      const worldRotation = Matrix33.fromCopyQuaternion(worldQuaternion);
      const inverseWorldRotation = Matrix33.transpose(worldRotation);
      const deltaLocal = inverseWorldRotation.multiplyVectorTo(deltaVector3, _ScaleGizmo.Ec);
      this.Wn = _ScaleGizmo.Rn.setComponents(
        Math.max(this.Vn.x + deltaLocal.x, 0.01),
        Math.max(this.Vn.y + deltaLocal.y, 0.01),
        Math.max(this.Vn.z + deltaLocal.z, 0.01)
      );
    }
    this._update();
  }
  /**
   * Handles pointer up events for finalizing scaling operations
   * @param evt - The pointer event indicating the end of interaction
   * @private
   */
  Bn(evt) {
    evt.preventDefault();
    this.Qm = false;
    _ScaleGizmo.Nm = "none";
    this.Jn();
    if (_ScaleGizmo.cn === this.qm) {
      this.Vn = this.qm.getTransform().localScale;
    }
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
  /**
   * Performs ray casting against the entire gizmo group entity
   * @param evt - The pointer event containing screen coordinates
   * @returns Ray casting result for the group entity
   * @private
   */
  static castRay2(engine, evt) {
    const resources = _ScaleGizmo.Pm(engine);
    if (!resources) {
      return { result: false };
    }
    const rect = evt.target.getBoundingClientRect();
    const width = evt.target.clientWidth;
    const height = evt.target.clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height);
    const activeCamera = engine.componentRepository.getComponent(CameraComponent, CameraComponent.getCurrent(engine));
    const result = resources.groupEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera, viewport, 0, []);
    return result;
  }
  /**
   * Performs ray casting against individual axis entities to determine interaction
   * @param evt - The pointer event containing screen coordinates
   * @returns Object containing ray casting results for X, Y, and Z axes
   * @private
   */
  static castRay(engine, evt) {
    const resources = _ScaleGizmo.Pm(engine);
    const emptyResult = { result: false };
    if (!resources) {
      return { xResult: emptyResult, yResult: emptyResult, zResult: emptyResult };
    }
    const rect = evt.target.getBoundingClientRect();
    const width = evt.target.clientWidth;
    const height = evt.target.clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height);
    const activeCamera = engine.componentRepository.getComponent(CameraComponent, CameraComponent.getCurrent(engine));
    const xResult = resources.xCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera, viewport, 0);
    const yResult = resources.yCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera, viewport, 0);
    const zResult = resources.zCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera, viewport, 0);
    return { xResult, yResult, zResult };
  }
  /**
   * Destroys the gizmo and cleans up associated resources
   * @internal
   */
  _destroy() {
    this.sm();
  }
  /**
   * Cleans up all static resources for a specific Engine.
   * This removes the resources associated with the engine from the map.
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(engine) {
    _ScaleGizmo._m.delete(engine.objectUID);
    _ScaleGizmo.Nm = "none";
  }
};
/** Resources managed per-Engine instance */
_ScaleGizmo._m = /* @__PURE__ */ new Map();
_ScaleGizmo.S = 0;
_ScaleGizmo.T = 0;
_ScaleGizmo.Nm = "none";
_ScaleGizmo.$m = "world";
_ScaleGizmo.Lm = 1;
/** Gizmo size as a fraction of the viewport height (unit axis length). */
_ScaleGizmo.an = 0.12;
/** Reusable quaternion for world-rotation calculations (avoids per-frame allocations) */
_ScaleGizmo.gn = MutableQuaternion.identity();
/** Reusable vectors for drag calculations (avoids per-frame allocations) */
_ScaleGizmo.Hc = MutableVector3.zero();
_ScaleGizmo.Dc = MutableVector3.zero();
_ScaleGizmo.Ec = MutableVector3.zero();
_ScaleGizmo.Rn = MutableVector3.zero();
var ScaleGizmo = _ScaleGizmo;
export {
  ScaleGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL1NjYWxlR2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVNZXNoRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvY3JlYXRlTWVzaEVudGl0eSc7XG5pbXBvcnQgeyBjcmVhdGVHcm91cEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9jcmVhdGVHcm91cEVudGl0eSc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9nZW9tZXRyeS9NZXNoJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBDdWJlIH0gZnJvbSAnLi4vZ2VvbWV0cnkvc2hhcGVzL0N1YmUnO1xuaW1wb3J0IHsgUGxhbmUgfSBmcm9tICcuLi9nZW9tZXRyeS9zaGFwZXMvUGxhbmUnO1xuaW1wb3J0IHR5cGUgeyBJTWVzaEVudGl0eSwgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsIH0gZnJvbSAnLi4vaGVscGVycy9tYXRlcmlhbHMvY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRoVXRpbCB9IGZyb20gJy4uL21hdGgvTWF0aFV0aWwnO1xuaW1wb3J0IHsgTWF0cml4MzMgfSBmcm9tICcuLi9tYXRoL01hdHJpeDMzJztcbmltcG9ydCB7IE11dGFibGVNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZU1hdHJpeDMzJztcbmltcG9ydCB7IE11dGFibGVRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlUXVhdGVybmlvbic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgeyBhc3NlcnRFeGlzdCB9IGZyb20gJy4uL21pc2MvTWlzY1V0aWwnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IGdldEV2ZW50LCBJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19TQ0FMRSwgSW5wdXRNYW5hZ2VyIH0gZnJvbSAnLi4vc3lzdGVtL0lucHV0TWFuYWdlcic7XG5pbXBvcnQgeyBHaXptbyB9IGZyb20gJy4vR2l6bW8nO1xuXG5kZWNsYXJlIGxldCB3aW5kb3c6IGFueTtcblxuLyoqXG4gKiBJbnRlcm5hbCByZXNvdXJjZXMgZm9yIFNjYWxlR2l6bW8sIG1hbmFnZWQgcGVyLUVuZ2luZS5cbiAqIEBpbnRlcm5hbFxuICovXG5pbnRlcmZhY2UgU2NhbGVHaXptb1Jlc291cmNlcyB7XG4gIGdyb3VwRW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eTtcbiAgeEN1YmVFbnRpdHk6IElNZXNoRW50aXR5O1xuICB5Q3ViZUVudGl0eTogSU1lc2hFbnRpdHk7XG4gIHpDdWJlRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgeEN1YmVNZXNoOiBNZXNoO1xuICB5Q3ViZU1lc2g6IE1lc2g7XG4gIHpDdWJlTWVzaDogTWVzaDtcbiAgeEN1YmVQcmltaXRpdmU6IEN1YmU7XG4gIHlDdWJlUHJpbWl0aXZlOiBDdWJlO1xuICB6Q3ViZVByaW1pdGl2ZTogQ3ViZTtcbiAgeEVkZ2VDdWJlRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgeUVkZ2VDdWJlRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgekVkZ2VDdWJlRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgeEVkZ2VDdWJlTWVzaDogTWVzaDtcbiAgeUVkZ2VDdWJlTWVzaDogTWVzaDtcbiAgekVkZ2VDdWJlTWVzaDogTWVzaDtcbiAgeEVkZ2VDdWJlUHJpbWl0aXZlOiBDdWJlO1xuICB5RWRnZUN1YmVQcmltaXRpdmU6IEN1YmU7XG4gIHpFZGdlQ3ViZVByaW1pdGl2ZTogQ3ViZTtcbiAgeEN1YmVNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHlDdWJlTWF0ZXJpYWw6IE1hdGVyaWFsO1xuICB6Q3ViZU1hdGVyaWFsOiBNYXRlcmlhbDtcbiAgeHlQbGFuZUVudGl0eTogSU1lc2hFbnRpdHk7XG4gIHl6UGxhbmVFbnRpdHk6IElNZXNoRW50aXR5O1xuICB6eFBsYW5lRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgeHlQbGFuZU1lc2g6IE1lc2g7XG4gIHl6UGxhbmVNZXNoOiBNZXNoO1xuICB6eFBsYW5lTWVzaDogTWVzaDtcbiAgeHlQbGFuZVByaW1pdGl2ZTogUGxhbmU7XG4gIHl6UGxhbmVQcmltaXRpdmU6IFBsYW5lO1xuICB6eFBsYW5lUHJpbWl0aXZlOiBQbGFuZTtcbiAgeHlQbGFuZU1hdGVyaWFsOiBNYXRlcmlhbDtcbiAgeXpQbGFuZU1hdGVyaWFsOiBNYXRlcmlhbDtcbiAgenhQbGFuZU1hdGVyaWFsOiBNYXRlcmlhbDtcbn1cblxuLyoqXG4gKiBTY2FsZSBHaXptbyBjbGFzcyBmb3IgaGFuZGxpbmcgb2JqZWN0IHNjYWxpbmcgb3BlcmF0aW9ucyBpbiAzRCBzcGFjZVxuICogUHJvdmlkZXMgaW50ZXJhY3RpdmUgaGFuZGxlcyBmb3Igc2NhbGluZyBvYmplY3RzIGFsb25nIGluZGl2aWR1YWwgYXhlcyAoWCwgWSwgWilcbiAqIG9yIHdpdGhpbiBzcGVjaWZpYyBwbGFuZXMgKFhZLCBZWiwgWlgpIGluIGJvdGggbG9jYWwgYW5kIHdvcmxkIGNvb3JkaW5hdGUgc3BhY2VzXG4gKi9cbmV4cG9ydCBjbGFzcyBTY2FsZUdpem1vIGV4dGVuZHMgR2l6bW8ge1xuICAvKiogUmVzb3VyY2VzIG1hbmFnZWQgcGVyLUVuZ2luZSBpbnN0YW5jZSAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3Jlc291cmNlc01hcDogTWFwPG51bWJlciwgU2NhbGVHaXptb1Jlc291cmNlcz4gPSBuZXcgTWFwKCk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19vcmlnaW5hbFggPSAwO1xuICBwcml2YXRlIHN0YXRpYyBfX29yaWdpbmFsWSA9IDA7XG4gIHByaXZhdGUgX19waWNrU3RhdGVkUG9pbnQgPSBWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2RlbHRhUG9pbnQ6IElWZWN0b3IzID0gVmVjdG9yMy5vbmUoKTtcbiAgcHJpdmF0ZSBfX3RhcmdldFNjYWxlQmFja3VwID0gVmVjdG9yMy5vbmUoKTtcbiAgcHJpdmF0ZSBfX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkID0gZmFsc2U7XG4gIHByaXZhdGUgc3RhdGljIF9fYWN0aXZlQXhpczogJ25vbmUnIHwgJ3gnIHwgJ3knIHwgJ3onID0gJ25vbmUnO1xuICBwcml2YXRlIHN0YXRpYyBfX3NwYWNlOiAnbG9jYWwnIHwgJ3dvcmxkJyA9ICd3b3JsZCc7XG4gIHByaXZhdGUgc3RhdGljIF9fbGF0ZXN0VGFyZ2V0RW50aXR5PzogSVNjZW5lR3JhcGhFbnRpdHk7XG4gIHByaXZhdGUgc3RhdGljIF9fbGVuZ3RoID0gMTtcbiAgLyoqIEdpem1vIHNpemUgYXMgYSBmcmFjdGlvbiBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0ICh1bml0IGF4aXMgbGVuZ3RoKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zY3JlZW5TcGFjZVJhdGlvID0gMC4xMjtcbiAgcHJpdmF0ZSBfX29uUG9pbnRlckRvd25GdW5jID0gdGhpcy5fX29uUG9pbnRlckRvd24uYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX29uUG9pbnRlck1vdmVGdW5jID0gdGhpcy5fX29uUG9pbnRlck1vdmUuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX29uUG9pbnRlclVwRnVuYyA9IHRoaXMuX19vblBvaW50ZXJVcC5iaW5kKHRoaXMpO1xuXG4gIC8qKiBSZXVzYWJsZSBxdWF0ZXJuaW9uIGZvciB3b3JsZC1yb3RhdGlvbiBjYWxjdWxhdGlvbnMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wUXVhdGVybmlvbl8wID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgLyoqIFJldXNhYmxlIHZlY3RvcnMgZm9yIGRyYWcgY2FsY3VsYXRpb25zIChhdm9pZHMgcGVyLWZyYW1lIGFsbG9jYXRpb25zKSAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfMCA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzEgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18yID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgcmVzb3VyY2VzIGZvciBhIHNwZWNpZmljIGVuZ2luZSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBpbml0aWFsaXplZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2V0UmVzb3VyY2VzKGVuZ2luZTogRW5naW5lKTogU2NhbGVHaXptb1Jlc291cmNlcyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIFNjYWxlR2l6bW8uX19yZXNvdXJjZXNNYXAuZ2V0KGVuZ2luZS5vYmplY3RVSUQpO1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gQWNjZXNzb3JzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBnaXptbyBoYXMgYmVlbiBwcm9wZXJseSBzZXQgdXAgYW5kIGluaXRpYWxpemVkXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGdpem1vIGlzIHNldCB1cCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNTZXR1cCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxlbmd0aCBvZiB0aGUgZ2l6bW8gaGFuZGxlc1xuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGxlbmd0aCB2YWx1ZSB0byBzZXRcbiAgICogQGRlcHJlY2F0ZWQgVGhlIGdpem1vIHNpemUgaXMgbm93IGRlcml2ZWQgZnJvbSB0aGUgY2FtZXJhIHNvIHRoYXQgaXQgc3RheXNcbiAgICogY29uc3RhbnQgaW4gc2NyZWVuIHNwYWNlLiBUaGlzIHZhbHVlIG5vIGxvbmdlciBhZmZlY3RzIHRoZSB2aXN1YWwgc2l6ZS5cbiAgICovXG4gIHNldCBsZW5ndGgodmFsOiBudW1iZXIpIHtcbiAgICBTY2FsZUdpem1vLl9fbGVuZ3RoID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgbGVuZ3RoIG9mIHRoZSBnaXptbyBoYW5kbGVzXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IGxlbmd0aCB2YWx1ZVxuICAgKiBAZGVwcmVjYXRlZCBUaGUgZ2l6bW8gc2l6ZSBpcyBub3cgZGVyaXZlZCBmcm9tIHRoZSBjYW1lcmEgc28gdGhhdCBpdCBzdGF5c1xuICAgKiBjb25zdGFudCBpbiBzY3JlZW4gc3BhY2UuIFRoaXMgdmFsdWUgbm8gbG9uZ2VyIGFmZmVjdHMgdGhlIHZpc3VhbCBzaXplLlxuICAgKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiBTY2FsZUdpem1vLl9fbGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGdpem1vIHNpemUgYXMgYSBmcmFjdGlvbiBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0LlxuICAgKiBUaGUgdW5pdCBheGlzIGxlbmd0aCBpcyBwcm9qZWN0ZWQgdG8gdGhpcyBmcmFjdGlvbiBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0LlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgKGZvciBleGFtcGxlLCAwLjEyIGZvciAxMiUpXG4gICAqL1xuICBzZXQgc2NyZWVuU3BhY2VSYXRpbyh2YWw6IG51bWJlcikge1xuICAgIFNjYWxlR2l6bW8uX19zY3JlZW5TcGFjZVJhdGlvID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGdpem1vIHNpemUgYXMgYSBmcmFjdGlvbiBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0LlxuICAgKiBAcmV0dXJucyBUaGUgcmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCBvY2N1cGllZCBieSB0aGUgZ2l6bW8ncyB1bml0IGF4aXMgbGVuZ3RoXG4gICAqL1xuICBnZXQgc2NyZWVuU3BhY2VSYXRpbygpOiBudW1iZXIge1xuICAgIHJldHVybiBTY2FsZUdpem1vLl9fc2NyZWVuU3BhY2VSYXRpbztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBnaXptbyBhbmQgbWFuYWdlcyBpbnB1dCBldmVudCByZWdpc3RyYXRpb25cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgZ2l6bW8sIGZhbHNlIHRvIGhpZGUgaXRcbiAgICovXG4gIHNldCBpc1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gU2NhbGVHaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9faXNWaXNpYmxlID09PSBmYWxzZSAmJiBmbGcgPT09IHRydWUpIHtcbiAgICAgIGxldCBldmVudFRhcmdldERvbSA9IHdpbmRvdztcbiAgICAgIGlmIChJcy5leGlzdCh0aGlzLl9fZW5naW5lLmNvbmZpZy5ldmVudFRhcmdldERvbSkpIHtcbiAgICAgICAgZXZlbnRUYXJnZXREb20gPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5ldmVudFRhcmdldERvbTtcbiAgICAgIH1cbiAgICAgIElucHV0TWFuYWdlci5yZWdpc3RlcihJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19TQ0FMRSwgW1xuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnc3RhcnQnKSxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fb25Qb2ludGVyRG93bkZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge30sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbTogZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6IGdldEV2ZW50KCdtb3ZlJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlck1vdmVGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHt9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb206IGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnZW5kJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tOiBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ3BvaW50ZXJsZWF2ZScsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tOiBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgIF0pO1xuICAgICAgdGhpcy5fX3RvcEVudGl0eSEuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgICAgU2NhbGVHaXptby5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG4gICAgICBpZiAoU2NhbGVHaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICAgIGNvbnN0IHF1YXRlcm5pb24gPSBTY2FsZUdpem1vLl9fdG1wUXVhdGVybmlvbl8wO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKTtcbiAgICAgICAgaWYgKElzLmV4aXN0KHBhcmVudCkpIHtcbiAgICAgICAgICBwYXJlbnQuZ2V0UXVhdGVybmlvblJlY3Vyc2l2ZWx5VG8ocXVhdGVybmlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gcXVhdGVybmlvbjtcbiAgICAgIH0gZWxzZSBpZiAoU2NhbGVHaXptby5fX3NwYWNlID09PSAnd29ybGQnKSB7XG4gICAgICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFJvdGF0aW9uID0gU2NhbGVHaXptby5fX3RtcFF1YXRlcm5pb25fMC5pZGVudGl0eSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9faXNWaXNpYmxlID09PSB0cnVlICYmIGZsZyA9PT0gZmFsc2UpIHtcbiAgICAgIElucHV0TWFuYWdlci51bnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1NDQUxFKTtcbiAgICAgIHRoaXMuX19kZWx0YVBvaW50ID0gdGhpcy5fX3RhcmdldC5nZXRUcmFuc2Zvcm0oKS5sb2NhbFNjYWxlO1xuICAgICAgdGhpcy5fX3BpY2tTdGF0ZWRQb2ludCA9IFZlY3RvcjMuemVybygpO1xuICAgICAgdGhpcy5fX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMuX190YXJnZXRTY2FsZUJhY2t1cCA9IHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxTY2FsZTtcbiAgICAgIFNjYWxlR2l6bW8uX19hY3RpdmVBeGlzID0gJ25vbmUnO1xuICAgIH1cblxuICAgIElucHV0TWFuYWdlci5zZXRBY3RpdmUoSU5QVVRfSEFORExJTkdfU1RBVEVfR0laTU9fU0NBTEUsIGZsZyk7XG5cbiAgICB0aGlzLl9fc2V0VmlzaWJsZShmbGcpO1xuICAgIHJlc291cmNlcy54eVBsYW5lRW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICByZXNvdXJjZXMueXpQbGFuZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgcmVzb3VyY2VzLnp4UGxhbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvb3JkaW5hdGUgc3BhY2UgZm9yIGdpem1vIG9wZXJhdGlvbnNcbiAgICogQHBhcmFtIHNwYWNlIC0gVGhlIGNvb3JkaW5hdGUgc3BhY2UgdG8gdXNlICgnbG9jYWwnIG9yICd3b3JsZCcpXG4gICAqL1xuICBzZXRTcGFjZShzcGFjZTogJ2xvY2FsJyB8ICd3b3JsZCcpIHtcbiAgICBTY2FsZUdpem1vLl9fc3BhY2UgPSBzcGFjZTtcbiAgICBpZiAodGhpcy5fX2lzVmlzaWJsZSkge1xuICAgICAgdGhpcy5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBnaXptb1xuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBnaXptbyBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1Zpc2libGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1Zpc2libGU7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBGcmllbmRzIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogU2V0cyB1cCB0aGUgZ2l6bW8gZW50aXRpZXMgYW5kIHRoZWlyIHZpc3VhbCBjb21wb25lbnRzIGlmIG5vdCBhbHJlYWR5IGRvbmVcbiAgICogQ3JlYXRlcyBhbGwgbmVjZXNzYXJ5IG1lc2hlcywgbWF0ZXJpYWxzLCBhbmQgZW50aXR5IGhpZXJhcmNoaWVzIGZvciB0aGUgc2NhbGUgZ2l6bW9cbiAgICovXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fdG9wRW50aXR5ID0gY3JlYXRlR3JvdXBFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgdGhpcy5fX3RvcEVudGl0eSEudHJ5VG9TZXRVbmlxdWVOYW1lKGBTY2FsZUdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSEudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IHRydWU7XG5cbiAgICAvLyBhZGQgdGhpcyB0b3BFbnRpdHkgdG8gdGhlIHRhcmdldCBhcyBnaXptb1xuICAgIHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSk7XG5cbiAgICAvLyBDaGVjayBpZiByZXNvdXJjZXMgYWxyZWFkeSBleGlzdCBmb3IgdGhpcyBlbmdpbmVcbiAgICBsZXQgcmVzb3VyY2VzID0gU2NhbGVHaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgLy8gQ3JlYXRlIHJlc291cmNlcyBmb3IgdGhpcyBlbmdpbmVcbiAgICAgIHJlc291cmNlcyA9IHRoaXMuX19jcmVhdGVSZXNvdXJjZXMoKTtcbiAgICAgIFNjYWxlR2l6bW8uX19yZXNvdXJjZXNNYXAuc2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlELCByZXNvdXJjZXMpO1xuICAgIH1cblxuICAgIHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcblxuICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQocmVzb3VyY2VzLnhDdWJlRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMueUN1YmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy56Q3ViZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQocmVzb3VyY2VzLnh5UGxhbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy55elBsYW5lRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMuenhQbGFuZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuXG4gICAgU2NhbGVHaXptby5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG5cbiAgICB0aGlzLnNldEdpem1vVGFnKCk7XG4gICAgdGhpcy5fX3RvcEVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogJ0dpem1vJywgdmFsdWU6ICdTY2FsZScgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbGwgcmVzb3VyY2VzIG5lZWRlZCBmb3IgdGhlIGdpem1vLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZVJlc291cmNlcygpOiBTY2FsZUdpem1vUmVzb3VyY2VzIHtcbiAgICAvLyBYIGN1YmVcbiAgICBjb25zdCB4Q3ViZUVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgeEN1YmVFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdTY2FsZUdpem1vX3hDdWJlJywgdHJ1ZSk7XG4gICAgeEN1YmVFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHkzKDAuNSwgMCwgMCk7XG4gICAgY29uc3QgeEN1YmVNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgeEN1YmVNYXRlcmlhbCA9IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSk7XG4gICAgeEN1YmVNYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VDb2xvckZhY3RvcicsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzEsIDAsIDAsIDFdKSk7XG4gICAgY29uc3QgeEN1YmVQcmltaXRpdmUgPSBuZXcgQ3ViZSh0aGlzLl9fZW5naW5lKTtcbiAgICB4Q3ViZVByaW1pdGl2ZS5nZW5lcmF0ZSh7XG4gICAgICB3aWR0aFZlY3RvcjogVmVjdG9yMy5mcm9tQ29weTMoMSwgMC4wNSwgMC4wNSksXG4gICAgICBtYXRlcmlhbDogeEN1YmVNYXRlcmlhbCxcbiAgICB9KTtcbiAgICB4Q3ViZU1lc2guYWRkUHJpbWl0aXZlKHhDdWJlUHJpbWl0aXZlKTtcbiAgICB4Q3ViZUVudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh4Q3ViZU1lc2gpO1xuXG4gICAgLy8gWSBjdWJlXG4gICAgY29uc3QgeUN1YmVFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHlDdWJlRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnU2NhbGVHaXptb195Q3ViZScsIHRydWUpO1xuICAgIHlDdWJlRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLjUsIDApO1xuICAgIGNvbnN0IHlDdWJlTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHlDdWJlTWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKHRoaXMuX19lbmdpbmUpO1xuICAgIHlDdWJlTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLCAxLCAwLCAxXSkpO1xuICAgIGNvbnN0IHlDdWJlUHJpbWl0aXZlID0gbmV3IEN1YmUodGhpcy5fX2VuZ2luZSk7XG4gICAgeUN1YmVQcmltaXRpdmUuZ2VuZXJhdGUoe1xuICAgICAgd2lkdGhWZWN0b3I6IFZlY3RvcjMuZnJvbUNvcHkzKDAuMDUsIDEsIDAuMDUpLFxuICAgICAgbWF0ZXJpYWw6IHlDdWJlTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgeUN1YmVNZXNoLmFkZFByaW1pdGl2ZSh5Q3ViZVByaW1pdGl2ZSk7XG4gICAgeUN1YmVFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeUN1YmVNZXNoKTtcblxuICAgIC8vIFogY3ViZVxuICAgIGNvbnN0IHpDdWJlRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB6Q3ViZUVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1NjYWxlR2l6bW9fekN1YmUnLCB0cnVlKTtcbiAgICB6Q3ViZUVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgMC41KTtcbiAgICBjb25zdCB6Q3ViZU1lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB6Q3ViZU1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCh0aGlzLl9fZW5naW5lKTtcbiAgICB6Q3ViZU1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZUNvbG9yRmFjdG9yJywgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMCwgMCwgMSwgMV0pKTtcbiAgICBjb25zdCB6Q3ViZVByaW1pdGl2ZSA9IG5ldyBDdWJlKHRoaXMuX19lbmdpbmUpO1xuICAgIHpDdWJlUHJpbWl0aXZlLmdlbmVyYXRlKHtcbiAgICAgIHdpZHRoVmVjdG9yOiBWZWN0b3IzLmZyb21Db3B5MygwLjA1LCAwLjA1LCAxKSxcbiAgICAgIG1hdGVyaWFsOiB6Q3ViZU1hdGVyaWFsLFxuICAgIH0pO1xuICAgIHpDdWJlTWVzaC5hZGRQcmltaXRpdmUoekN1YmVQcmltaXRpdmUpO1xuICAgIHpDdWJlRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHpDdWJlTWVzaCk7XG5cbiAgICAvLyBYIGVkZ2UgY3ViZVxuICAgIGNvbnN0IHhFZGdlQ3ViZUVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgeEVkZ2VDdWJlRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnU2NhbGVHaXptb194RWRnZUN1YmUnLCB0cnVlKTtcbiAgICB4RWRnZUN1YmVFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHkzKDAuNSwgMCwgMCk7XG4gICAgY29uc3QgeEVkZ2VDdWJlTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHhFZGdlQ3ViZVByaW1pdGl2ZSA9IG5ldyBDdWJlKHRoaXMuX19lbmdpbmUpO1xuICAgIHhFZGdlQ3ViZVByaW1pdGl2ZS5nZW5lcmF0ZSh7XG4gICAgICB3aWR0aFZlY3RvcjogVmVjdG9yMy5mcm9tQ29weTMoMC4xNSwgMC4xNSwgMC4xNSksXG4gICAgICBtYXRlcmlhbDogeEN1YmVNYXRlcmlhbCxcbiAgICB9KTtcbiAgICB4RWRnZUN1YmVNZXNoLmFkZFByaW1pdGl2ZSh4RWRnZUN1YmVQcmltaXRpdmUpO1xuICAgIHhFZGdlQ3ViZUVudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh4RWRnZUN1YmVNZXNoKTtcbiAgICB4Q3ViZUVudGl0eS5hZGRDaGlsZCh4RWRnZUN1YmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcblxuICAgIC8vIFkgZWRnZSBjdWJlXG4gICAgY29uc3QgeUVkZ2VDdWJlRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB5RWRnZUN1YmVFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdTY2FsZUdpem1vX3lFZGdlQ3ViZScsIHRydWUpO1xuICAgIHlFZGdlQ3ViZUVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMC41LCAwKTtcbiAgICBjb25zdCB5RWRnZUN1YmVNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgeUVkZ2VDdWJlUHJpbWl0aXZlID0gbmV3IEN1YmUodGhpcy5fX2VuZ2luZSk7XG4gICAgeUVkZ2VDdWJlUHJpbWl0aXZlLmdlbmVyYXRlKHtcbiAgICAgIHdpZHRoVmVjdG9yOiBWZWN0b3IzLmZyb21Db3B5MygwLjE1LCAwLjE1LCAwLjE1KSxcbiAgICAgIG1hdGVyaWFsOiB5Q3ViZU1hdGVyaWFsLFxuICAgIH0pO1xuICAgIHlFZGdlQ3ViZU1lc2guYWRkUHJpbWl0aXZlKHlFZGdlQ3ViZVByaW1pdGl2ZSk7XG4gICAgeUVkZ2VDdWJlRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHlFZGdlQ3ViZU1lc2gpO1xuICAgIHlDdWJlRW50aXR5LmFkZENoaWxkKHlFZGdlQ3ViZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuXG4gICAgLy8gWiBlZGdlIGN1YmVcbiAgICBjb25zdCB6RWRnZUN1YmVFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHpFZGdlQ3ViZUVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1NjYWxlR2l6bW9fekVkZ2VDdWJlJywgdHJ1ZSk7XG4gICAgekVkZ2VDdWJlRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAwLjUpO1xuICAgIGNvbnN0IHpFZGdlQ3ViZU1lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB6RWRnZUN1YmVQcmltaXRpdmUgPSBuZXcgQ3ViZSh0aGlzLl9fZW5naW5lKTtcbiAgICB6RWRnZUN1YmVQcmltaXRpdmUuZ2VuZXJhdGUoe1xuICAgICAgd2lkdGhWZWN0b3I6IFZlY3RvcjMuZnJvbUNvcHkzKDAuMTUsIDAuMTUsIDAuMTUpLFxuICAgICAgbWF0ZXJpYWw6IHpDdWJlTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgekVkZ2VDdWJlTWVzaC5hZGRQcmltaXRpdmUoekVkZ2VDdWJlUHJpbWl0aXZlKTtcbiAgICB6RWRnZUN1YmVFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goekVkZ2VDdWJlTWVzaCk7XG4gICAgekN1YmVFbnRpdHkuYWRkQ2hpbGQoekVkZ2VDdWJlRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG5cbiAgICAvLyBYWSBwbGFuZVxuICAgIGNvbnN0IHh5UGxhbmVFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHh5UGxhbmVFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdTY2FsZUdpem1vX3h5UGxhbmUnLCB0cnVlKTtcbiAgICB4eVBsYW5lRW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICB4eVBsYW5lRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsRXVsZXJBbmdsZXMgPSBWZWN0b3IzLmZyb21Db3B5MyhNYXRoVXRpbC5kZWdyZWVUb1JhZGlhbig5MCksIDAsIDApO1xuICAgIGNvbnN0IHh5UGxhbmVNYXRlcmlhbCA9IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSk7XG4gICAgeHlQbGFuZU1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5CbGVuZDtcbiAgICB4eVBsYW5lTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLCAwLCAwLjUsIDBdKSk7XG4gICAgY29uc3QgeHlQbGFuZU1lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB4eVBsYW5lUHJpbWl0aXZlID0gbmV3IFBsYW5lKHRoaXMuX19lbmdpbmUpO1xuICAgIHh5UGxhbmVQcmltaXRpdmUuZ2VuZXJhdGUoe1xuICAgICAgd2lkdGg6IDEwMDAwMCxcbiAgICAgIGhlaWdodDogMTAwMDAwLFxuICAgICAgdVNwYW46IDEsXG4gICAgICB2U3BhbjogMSxcbiAgICAgIGlzVVZSZXBlYXQ6IHRydWUsXG4gICAgICBmbGlwVGV4dHVyZUNvb3JkaW5hdGVZOiBmYWxzZSxcbiAgICAgIG1hdGVyaWFsOiB4eVBsYW5lTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgeHlQbGFuZU1lc2guYWRkUHJpbWl0aXZlKHh5UGxhbmVQcmltaXRpdmUpO1xuICAgIHh5UGxhbmVFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeHlQbGFuZU1lc2gpO1xuXG4gICAgLy8gWVogcGxhbmVcbiAgICBjb25zdCB5elBsYW5lRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB5elBsYW5lRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnU2NhbGVHaXptb195elBsYW5lJywgdHJ1ZSk7XG4gICAgeXpQbGFuZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgeXpQbGFuZUVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbEV1bGVyQW5nbGVzID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oOTApKTtcbiAgICBjb25zdCB5elBsYW5lTWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKHRoaXMuX19lbmdpbmUpO1xuICAgIHl6UGxhbmVNYXRlcmlhbC5hbHBoYU1vZGUgPSBBbHBoYU1vZGUuQmxlbmQ7XG4gICAgeXpQbGFuZU1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZUNvbG9yRmFjdG9yJywgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMC41LCAwLCAwLCAwXSkpO1xuICAgIGNvbnN0IHl6UGxhbmVNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgeXpQbGFuZVByaW1pdGl2ZSA9IG5ldyBQbGFuZSh0aGlzLl9fZW5naW5lKTtcbiAgICB5elBsYW5lUHJpbWl0aXZlLmdlbmVyYXRlKHtcbiAgICAgIHdpZHRoOiAxMDAwMDAsXG4gICAgICBoZWlnaHQ6IDEwMDAwMCxcbiAgICAgIHVTcGFuOiAxLFxuICAgICAgdlNwYW46IDEsXG4gICAgICBpc1VWUmVwZWF0OiB0cnVlLFxuICAgICAgZmxpcFRleHR1cmVDb29yZGluYXRlWTogZmFsc2UsXG4gICAgICBtYXRlcmlhbDogeXpQbGFuZU1hdGVyaWFsLFxuICAgIH0pO1xuICAgIHl6UGxhbmVNZXNoLmFkZFByaW1pdGl2ZSh5elBsYW5lUHJpbWl0aXZlKTtcbiAgICB5elBsYW5lRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHl6UGxhbmVNZXNoKTtcblxuICAgIC8vIFpYIHBsYW5lXG4gICAgY29uc3QgenhQbGFuZUVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgenhQbGFuZUVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1NjYWxlR2l6bW9fenhQbGFuZScsIHRydWUpO1xuICAgIHp4UGxhbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgIGNvbnN0IHp4UGxhbmVNYXRlcmlhbCA9IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSk7XG4gICAgenhQbGFuZU1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZUNvbG9yRmFjdG9yJywgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMCwgMC41LCAwLCAwXSkpO1xuICAgIHp4UGxhbmVNYXRlcmlhbC5hbHBoYU1vZGUgPSBBbHBoYU1vZGUuQmxlbmQ7XG4gICAgY29uc3QgenhQbGFuZU1lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB6eFBsYW5lUHJpbWl0aXZlID0gbmV3IFBsYW5lKHRoaXMuX19lbmdpbmUpO1xuICAgIHp4UGxhbmVQcmltaXRpdmUuZ2VuZXJhdGUoe1xuICAgICAgd2lkdGg6IDEwMDAwMCxcbiAgICAgIGhlaWdodDogMTAwMDAwLFxuICAgICAgdVNwYW46IDEsXG4gICAgICB2U3BhbjogMSxcbiAgICAgIGlzVVZSZXBlYXQ6IHRydWUsXG4gICAgICBmbGlwVGV4dHVyZUNvb3JkaW5hdGVZOiBmYWxzZSxcbiAgICAgIG1hdGVyaWFsOiB6eFBsYW5lTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgenhQbGFuZU1lc2guYWRkUHJpbWl0aXZlKHp4UGxhbmVQcmltaXRpdmUpO1xuICAgIHp4UGxhbmVFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goenhQbGFuZU1lc2gpO1xuXG4gICAgLy8gR3JvdXAgZW50aXR5XG4gICAgY29uc3QgZ3JvdXBFbnRpdHkgPSBjcmVhdGVHcm91cEVudGl0eSh0aGlzLl9fZW5naW5lKTtcblxuICAgIHJldHVybiB7XG4gICAgICBncm91cEVudGl0eSxcbiAgICAgIHhDdWJlRW50aXR5LFxuICAgICAgeUN1YmVFbnRpdHksXG4gICAgICB6Q3ViZUVudGl0eSxcbiAgICAgIHhDdWJlTWVzaCxcbiAgICAgIHlDdWJlTWVzaCxcbiAgICAgIHpDdWJlTWVzaCxcbiAgICAgIHhDdWJlUHJpbWl0aXZlLFxuICAgICAgeUN1YmVQcmltaXRpdmUsXG4gICAgICB6Q3ViZVByaW1pdGl2ZSxcbiAgICAgIHhFZGdlQ3ViZUVudGl0eSxcbiAgICAgIHlFZGdlQ3ViZUVudGl0eSxcbiAgICAgIHpFZGdlQ3ViZUVudGl0eSxcbiAgICAgIHhFZGdlQ3ViZU1lc2gsXG4gICAgICB5RWRnZUN1YmVNZXNoLFxuICAgICAgekVkZ2VDdWJlTWVzaCxcbiAgICAgIHhFZGdlQ3ViZVByaW1pdGl2ZSxcbiAgICAgIHlFZGdlQ3ViZVByaW1pdGl2ZSxcbiAgICAgIHpFZGdlQ3ViZVByaW1pdGl2ZSxcbiAgICAgIHhDdWJlTWF0ZXJpYWwsXG4gICAgICB5Q3ViZU1hdGVyaWFsLFxuICAgICAgekN1YmVNYXRlcmlhbCxcbiAgICAgIHh5UGxhbmVFbnRpdHksXG4gICAgICB5elBsYW5lRW50aXR5LFxuICAgICAgenhQbGFuZUVudGl0eSxcbiAgICAgIHh5UGxhbmVNZXNoLFxuICAgICAgeXpQbGFuZU1lc2gsXG4gICAgICB6eFBsYW5lTWVzaCxcbiAgICAgIHh5UGxhbmVQcmltaXRpdmUsXG4gICAgICB5elBsYW5lUHJpbWl0aXZlLFxuICAgICAgenhQbGFuZVByaW1pdGl2ZSxcbiAgICAgIHh5UGxhbmVNYXRlcmlhbCxcbiAgICAgIHl6UGxhbmVNYXRlcmlhbCxcbiAgICAgIHp4UGxhbmVNYXRlcmlhbCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBVcGRhdGVzIHRoZSBnaXptbydzIHRyYW5zZm9ybSwgc2NhbGUsIGFuZCBwb3NpdGlvbiBiYXNlZCBvbiB0aGUgdGFyZ2V0IGVudGl0eVxuICAgKiBDYWxsZWQgZWFjaCBmcmFtZSB0byBtYWludGFpbiBwcm9wZXIgZ2l6bW8gcG9zaXRpb25pbmcgYW5kIHNjYWxpbmcgYmVoYXZpb3JcbiAgICovXG4gIF91cGRhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX190b3BFbnRpdHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZyA9IHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpITtcbiAgICBjb25zdCBhYWJiID0gc2cud29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsO1xuICAgIC8vIEdpem1vIGVudGl0aWVzIGFyZSBhdHRhY2hlZCB3aXRoIHRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggPSB0cnVlLFxuICAgIC8vIHNvIGxvY2FsIHZhbHVlcyBhcmUgd29ybGQgdmFsdWVzIGhlcmUuXG4gICAgY29uc3Qgd29ybGRQb3NpdGlvbiA9IGFhYmIuaXNWYW5pbGxhKCkgPyBzZy5wb3NpdGlvbiA6IGFhYmIuY2VudGVyUG9pbnQ7XG4gICAgY29uc3QgdHJhbnNmb3JtID0gdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSE7XG4gICAgdHJhbnNmb3JtLmxvY2FsUG9zaXRpb24gPSB3b3JsZFBvc2l0aW9uO1xuXG4gICAgLy8gS2VlcCB0aGUgZ2l6bW8gYXQgYSBjb25zdGFudCBzaXplIG9uIHNjcmVlbiByZWdhcmRsZXNzIG9mIHRoZSB0YXJnZXQgc2l6ZS5cbiAgICBjb25zdCBzY2FsZSA9IEdpem1vLl9fY2FsY1NjcmVlblNwYWNlU2NhbGUodGhpcy5fX2VuZ2luZSwgd29ybGRQb3NpdGlvbiwgU2NhbGVHaXptby5fX3NjcmVlblNwYWNlUmF0aW8pO1xuICAgIHRyYW5zZm9ybS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weTMoc2NhbGUsIHNjYWxlLCBzY2FsZSk7XG4gICAgLy8gUmVmbGVjdCB0aGUgbmV3IHNjYWxlIGluIHRoZSBzYW1lIGZyYW1lLiBUaGUgUmVuZGVyIHN0YWdlIHVwbG9hZHMgdGhlIGluc3RhbmNlIGRhdGFcbiAgICAvLyBiZWZvcmUgdGhlIG1hdHJpY2VzIHdvdWxkIGJlIHJlY2FsY3VsYXRlZCBsYXppbHksIHNvIG1hdGVyaWFsaXplIHRoZW0gbm93LlxuICAgIHRoaXMuX191cGRhdGVXb3JsZE1hdHJpY2VzT2ZTdWJ0cmVlKCk7XG5cbiAgICBpZiAodGhpcy5fX2lzUG9pbnRlckRvd24pIHtcbiAgICAgIGlmIChTY2FsZUdpem1vLl9fbGF0ZXN0VGFyZ2V0RW50aXR5ID09PSB0aGlzLl9fdGFyZ2V0KSB7XG4gICAgICAgIHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxTY2FsZSA9IHRoaXMuX19kZWx0YVBvaW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIFByaXZhdGUgU3RhdGljIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBwcmltaXRpdmUgZm9yIGxpbmUtYmFzZWQgZ2l6bW8gdmlzdWFsaXphdGlvblxuICAgKiBAcmV0dXJucyBBIHByaW1pdGl2ZSBjb250YWluaW5nIHBvc2l0aW9uIGFuZCBjb2xvciBkYXRhIGZvciBheGlzIGxpbmVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lKTogUHJpbWl0aXZlIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIC8vIFggYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgdGhpcy5fX2xlbmd0aCxcbiAgICAgIDAsXG4gICAgICAwLFxuXG4gICAgICAvLyBZIGF4aXNcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICB0aGlzLl9fbGVuZ3RoLFxuICAgICAgMCxcblxuICAgICAgLy8gWiBheGlzXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHRoaXMuX19sZW5ndGgsXG4gICAgXSk7XG5cbiAgICBjb25zdCBjb2xvciA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgLy8gWCBheGlzIGFzIFJlZFxuICAgICAgMSwgMCwgMCwgMSwgMCwgMCxcblxuICAgICAgLy8gWSBheGlzIGFzIEdyZWVuXG4gICAgICAwLCAxLCAwLCAwLCAxLCAwLFxuXG4gICAgICAvLyBaIGF4aXMgYXMgQmx1ZVxuICAgICAgMCwgMCwgMSwgMCwgMCwgMSxcbiAgICBdKTtcblxuICAgIGNvbnN0IHByaW1pdGl2ZSA9IFByaW1pdGl2ZS5jcmVhdGVQcmltaXRpdmUoZW5naW5lLCB7XG4gICAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IFtWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaLCBWZXJ0ZXhBdHRyaWJ1dGUuQ29sb3IwLlhZWl0sXG4gICAgICBhdHRyaWJ1dGVzOiBbcG9zaXRpb25zLCBjb2xvcl0sXG4gICAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlLkxpbmVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHBvaW50ZXIgZG93biBldmVudHMgZm9yIGluaXRpYXRpbmcgc2NhbGluZyBvcGVyYXRpb25zXG4gICAqIEBwYXJhbSBldnQgLSBUaGUgcG9pbnRlciBldmVudCBjb250YWluaW5nIGlucHV0IGluZm9ybWF0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bihldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gdHJ1ZTtcbiAgICBTY2FsZUdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICBTY2FsZUdpem1vLl9fb3JpZ2luYWxYID0gZXZ0LmNsaWVudFg7XG4gICAgU2NhbGVHaXptby5fX29yaWdpbmFsWSA9IGV2dC5jbGllbnRZO1xuXG4gICAgY29uc3Qgd29ybGRNYXRyaXggPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5tYXRyaXguZ2V0Um90YXRlKCk7XG4gICAgY29uc3Qgc2NhbGVWZWMgPSBWZWN0b3IzLm9uZSgpO1xuICAgIGxldCByb3RNYXQgPSBNYXRyaXgzMy5mcm9tQ29weTlSb3dNYWpvcihcbiAgICAgIHNjYWxlVmVjLnggKiB3b3JsZE1hdHJpeC5tMDAsXG4gICAgICBzY2FsZVZlYy54ICogd29ybGRNYXRyaXgubTAxLFxuICAgICAgc2NhbGVWZWMueCAqIHdvcmxkTWF0cml4Lm0wMixcbiAgICAgIHNjYWxlVmVjLnkgKiB3b3JsZE1hdHJpeC5tMTAsXG4gICAgICBzY2FsZVZlYy55ICogd29ybGRNYXRyaXgubTExLFxuICAgICAgc2NhbGVWZWMueSAqIHdvcmxkTWF0cml4Lm0xMixcbiAgICAgIHNjYWxlVmVjLnogKiB3b3JsZE1hdHJpeC5tMjAsXG4gICAgICBzY2FsZVZlYy56ICogd29ybGRNYXRyaXgubTIxLFxuICAgICAgc2NhbGVWZWMueiAqIHdvcmxkTWF0cml4Lm0yMlxuICAgICk7XG5cbiAgICBpZiAoU2NhbGVHaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICByb3RNYXQgPSBNYXRyaXgzMy50cmFuc3Bvc2Uocm90TWF0KSBhcyBNYXRyaXgzMztcbiAgICB9IGVsc2UgaWYgKFNjYWxlR2l6bW8uX19zcGFjZSA9PT0gJ3dvcmxkJykge1xuICAgICAgcm90TWF0ID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gICAgfVxuXG4gICAgY29uc3QgeyB4UmVzdWx0LCB5UmVzdWx0LCB6UmVzdWx0IH0gPSBTY2FsZUdpem1vLmNhc3RSYXkodGhpcy5fX2VuZ2luZSwgZXZ0KTtcbiAgICBsZXQgYXhpc1BpY2tlZCA9IGZhbHNlO1xuICAgIGlmICh4UmVzdWx0LnJlc3VsdCkge1xuICAgICAgYXNzZXJ0RXhpc3QoeFJlc3VsdC5kYXRhKTtcbiAgICAgIHRoaXMuX19waWNrU3RhdGVkUG9pbnQgPSByb3RNYXQubXVsdGlwbHlWZWN0b3IoeFJlc3VsdC5kYXRhLnBvc2l0aW9uLmNsb25lKCkpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZGVidWcoYERvd246JHt0aGlzLl9fcGlja1N0YXRlZFBvaW50LnRvU3RyaW5nQXBwcm94aW1hdGVseSgpfWApO1xuICAgICAgU2NhbGVHaXptby5fX2FjdGl2ZUF4aXMgPSAneCc7XG4gICAgICBheGlzUGlja2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHlSZXN1bHQucmVzdWx0KSB7XG4gICAgICBhc3NlcnRFeGlzdCh5UmVzdWx0LmRhdGEpO1xuICAgICAgdGhpcy5fX3BpY2tTdGF0ZWRQb2ludCA9IHJvdE1hdC5tdWx0aXBseVZlY3Rvcih5UmVzdWx0LmRhdGEucG9zaXRpb24uY2xvbmUoKSk7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZyhgRG93bjoke3RoaXMuX19waWNrU3RhdGVkUG9pbnQudG9TdHJpbmdBcHByb3hpbWF0ZWx5KCl9YCk7XG4gICAgICBTY2FsZUdpem1vLl9fYWN0aXZlQXhpcyA9ICd5JztcbiAgICAgIGF4aXNQaWNrZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoelJlc3VsdC5yZXN1bHQpIHtcbiAgICAgIGFzc2VydEV4aXN0KHpSZXN1bHQuZGF0YSk7XG4gICAgICB0aGlzLl9fcGlja1N0YXRlZFBvaW50ID0gcm90TWF0Lm11bHRpcGx5VmVjdG9yKHpSZXN1bHQuZGF0YS5wb3NpdGlvbi5jbG9uZSgpKTtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmRlYnVnKGBEb3duOiR7dGhpcy5fX3BpY2tTdGF0ZWRQb2ludC50b1N0cmluZ0FwcHJveGltYXRlbHkoKX1gKTtcbiAgICAgIFNjYWxlR2l6bW8uX19hY3RpdmVBeGlzID0gJ3onO1xuICAgICAgYXhpc1BpY2tlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKFNjYWxlR2l6bW8uX19hY3RpdmVBeGlzID09PSAnbm9uZScgfHwgYXhpc1BpY2tlZCA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gT25seSBwcmV2ZW50IGRlZmF1bHQgYWZ0ZXIgY29uZmlybWluZyBhbiBheGlzIHdhcyBwaWNrZWRcbiAgICAvLyBUaGlzIGFsbG93cyBjYW1lcmEgY29udHJvbGxlciB0byBoYW5kbGUgZXZlbnRzIHdoZW4gZ2l6bW8gaXMgbm90IGJlaW5nIHVzZWRcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLl9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKTtcblxuICAgIGlmIChTY2FsZUdpem1vLl9fbGF0ZXN0VGFyZ2V0RW50aXR5ID09PSB0aGlzLl9fdGFyZ2V0KSB7XG4gICAgICB0aGlzLl9fdGFyZ2V0U2NhbGVCYWNrdXAgPSB0aGlzLl9fdGFyZ2V0LmdldFRyYW5zZm9ybSgpLmxvY2FsU2NhbGU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgcG9pbnRlciBtb3ZlIGV2ZW50cyBmb3IgcGVyZm9ybWluZyByZWFsLXRpbWUgc2NhbGluZ1xuICAgKiBAcGFyYW0gZXZ0IC0gVGhlIHBvaW50ZXIgZXZlbnQgY29udGFpbmluZyBjdXJyZW50IHBvaW50ZXIgcG9zaXRpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19vblBvaW50ZXJNb3ZlKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKElzLmZhbHNlKHRoaXMuX19pc1BvaW50ZXJEb3duKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc291cmNlcyA9IFNjYWxlR2l6bW8uX19nZXRSZXNvdXJjZXModGhpcy5fX2VuZ2luZSk7XG4gICAgaWYgKCFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZWN0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHdpZHRoID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3QgeCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSByZWN0LmhlaWdodCAtIChldnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IFZlY3RvcjQuZnJvbUNvcHk0KDAsIDAsIHdpZHRoLCBoZWlnaHQpIGFzIFZlY3RvcjQ7XG4gICAgY29uc3QgYWN0aXZlQ2FtZXJhID0gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KHRoaXMuX19lbmdpbmUpXG4gICAgKSBhcyBDYW1lcmFDb21wb25lbnQgfCB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeC5nZXRSb3RhdGUoKTtcbiAgICBjb25zdCBzY2FsZVZlYyA9IFZlY3RvcjMub25lKCk7XG4gICAgbGV0IHJvdE1hdCA9IE1hdHJpeDMzLmZyb21Db3B5OVJvd01ham9yKFxuICAgICAgc2NhbGVWZWMueCAqIHdvcmxkTWF0cml4Lm0wMCxcbiAgICAgIHNjYWxlVmVjLnggKiB3b3JsZE1hdHJpeC5tMDEsXG4gICAgICBzY2FsZVZlYy54ICogd29ybGRNYXRyaXgubTAyLFxuICAgICAgc2NhbGVWZWMueSAqIHdvcmxkTWF0cml4Lm0xMCxcbiAgICAgIHNjYWxlVmVjLnkgKiB3b3JsZE1hdHJpeC5tMTEsXG4gICAgICBzY2FsZVZlYy55ICogd29ybGRNYXRyaXgubTEyLFxuICAgICAgc2NhbGVWZWMueiAqIHdvcmxkTWF0cml4Lm0yMCxcbiAgICAgIHNjYWxlVmVjLnogKiB3b3JsZE1hdHJpeC5tMjEsXG4gICAgICBzY2FsZVZlYy56ICogd29ybGRNYXRyaXgubTIyXG4gICAgKTtcbiAgICBpZiAoU2NhbGVHaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICByb3RNYXQgPSBNYXRyaXgzMy50cmFuc3Bvc2Uocm90TWF0KSBhcyBNYXRyaXgzMztcbiAgICB9IGVsc2UgaWYgKFNjYWxlR2l6bW8uX19zcGFjZSA9PT0gJ3dvcmxkJykge1xuICAgICAgcm90TWF0ID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gICAgfVxuICAgIGxldCBwaWNrSW5Nb3ZpbmdQb2ludDogVmVjdG9yMyA9IHRoaXMuX19waWNrU3RhdGVkUG9pbnQuY2xvbmUoKTtcbiAgICBpZiAoU2NhbGVHaXptby5fX2FjdGl2ZUF4aXMgPT09ICd4Jykge1xuICAgICAgY29uc3QgeFJlc3VsdCA9IHJlc291cmNlcy54eVBsYW5lRW50aXR5LmdldE1lc2goKS5jYXN0UmF5RnJvbVNjcmVlbkluV29ybGQoeCwgeSwgYWN0aXZlQ2FtZXJhISwgdmlld3BvcnQsIDAuMCk7XG4gICAgICBpZiAoeFJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgYXNzZXJ0RXhpc3QoeFJlc3VsdC5kYXRhKTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSByb3RNYXQubXVsdGlwbHlWZWN0b3IoeFJlc3VsdC5kYXRhLnBvc2l0aW9uKTtcbiAgICAgICAgcGlja0luTW92aW5nUG9pbnQgPSBWZWN0b3IzLmZyb21Db3B5Myhwb3NpdGlvbi54LCBwaWNrSW5Nb3ZpbmdQb2ludC55LCBwaWNrSW5Nb3ZpbmdQb2ludC56KTtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZGVidWcoYE1vdmU6JHt4UmVzdWx0LmRhdGEucG9zaXRpb24udG9TdHJpbmdBcHByb3hpbWF0ZWx5KCl9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChTY2FsZUdpem1vLl9fYWN0aXZlQXhpcyA9PT0gJ3knKSB7XG4gICAgICBjb25zdCB5UmVzdWx0ID0gcmVzb3VyY2VzLnh5UGxhbmVFbnRpdHkuZ2V0TWVzaCgpLmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBhY3RpdmVDYW1lcmEhLCB2aWV3cG9ydCwgMC4wKTtcbiAgICAgIGlmICh5UmVzdWx0LnJlc3VsdCkge1xuICAgICAgICBhc3NlcnRFeGlzdCh5UmVzdWx0LmRhdGEpO1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHJvdE1hdC5tdWx0aXBseVZlY3Rvcih5UmVzdWx0LmRhdGEucG9zaXRpb24pO1xuICAgICAgICBwaWNrSW5Nb3ZpbmdQb2ludCA9IFZlY3RvcjMuZnJvbUNvcHkzKHBpY2tJbk1vdmluZ1BvaW50LngsIHBvc2l0aW9uLnksIHBpY2tJbk1vdmluZ1BvaW50LnopO1xuICAgICAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZyhgTW92ZToke3lSZXN1bHQuZGF0YS5wb3NpdGlvbi50b1N0cmluZ0FwcHJveGltYXRlbHkoKX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKFNjYWxlR2l6bW8uX19hY3RpdmVBeGlzID09PSAneicpIHtcbiAgICAgIGNvbnN0IHpSZXN1bHQgPSByZXNvdXJjZXMueXpQbGFuZUVudGl0eS5nZXRNZXNoKCkuY2FzdFJheUZyb21TY3JlZW5JbldvcmxkKHgsIHksIGFjdGl2ZUNhbWVyYSEsIHZpZXdwb3J0LCAwLjApO1xuICAgICAgaWYgKHpSZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGFzc2VydEV4aXN0KHpSZXN1bHQuZGF0YSk7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gcm90TWF0Lm11bHRpcGx5VmVjdG9yKHpSZXN1bHQuZGF0YS5wb3NpdGlvbik7XG4gICAgICAgIHBpY2tJbk1vdmluZ1BvaW50ID0gVmVjdG9yMy5mcm9tQ29weTMocGlja0luTW92aW5nUG9pbnQueCwgcGlja0luTW92aW5nUG9pbnQueSwgcG9zaXRpb24ueik7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0LmRlYnVnKGBNb3ZlOiR7elJlc3VsdC5kYXRhLnBvc2l0aW9uLnRvU3RyaW5nQXBwcm94aW1hdGVseSgpfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNnID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkhO1xuICAgIGNvbnN0IGFhYmIgPSBzZy53b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWw7XG4gICAgY29uc3QgZGVsdGFWZWN0b3IzID0gVmVjdG9yMy5tdWx0aXBseVRvKFxuICAgICAgVmVjdG9yMy5zdWJ0cmFjdFRvKHBpY2tJbk1vdmluZ1BvaW50LCB0aGlzLl9fcGlja1N0YXRlZFBvaW50LCBTY2FsZUdpem1vLl9fdG1wVmVjdG9yM18wKSxcbiAgICAgIDEgLyBhYWJiLmxlbmd0aENlbnRlclRvQ29ybmVyLFxuICAgICAgU2NhbGVHaXptby5fX3RtcFZlY3RvcjNfMVxuICAgICk7XG5cbiAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZyhgJHt0aGlzLl9fdGFyZ2V0LnVuaXF1ZU5hbWV9OiAke2RlbHRhVmVjdG9yMy50b1N0cmluZ0FwcHJveGltYXRlbHkoKX1gKTtcblxuICAgIGlmIChTY2FsZUdpem1vLl9fc3BhY2UgPT09ICdsb2NhbCcpIHtcbiAgICAgIHRoaXMuX19kZWx0YVBvaW50ID0gU2NhbGVHaXptby5fX3RtcFZlY3RvcjNfMi5zZXRDb21wb25lbnRzKFxuICAgICAgICBNYXRoLm1heCh0aGlzLl9fdGFyZ2V0U2NhbGVCYWNrdXAueCArIGRlbHRhVmVjdG9yMy54LCAwLjAxKSxcbiAgICAgICAgTWF0aC5tYXgodGhpcy5fX3RhcmdldFNjYWxlQmFja3VwLnkgKyBkZWx0YVZlY3RvcjMueSwgMC4wMSksXG4gICAgICAgIE1hdGgubWF4KHRoaXMuX190YXJnZXRTY2FsZUJhY2t1cC56ICsgZGVsdGFWZWN0b3IzLnosIDAuMDEpXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoU2NhbGVHaXptby5fX3NwYWNlID09PSAnd29ybGQnKSB7XG4gICAgICBjb25zdCB3b3JsZFF1YXRlcm5pb24gPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5nZXRRdWF0ZXJuaW9uUmVjdXJzaXZlbHlUbyhTY2FsZUdpem1vLl9fdG1wUXVhdGVybmlvbl8wKTtcbiAgICAgIGNvbnN0IHdvcmxkUm90YXRpb24gPSBNYXRyaXgzMy5mcm9tQ29weVF1YXRlcm5pb24od29ybGRRdWF0ZXJuaW9uKTtcbiAgICAgIGNvbnN0IGludmVyc2VXb3JsZFJvdGF0aW9uID0gTWF0cml4MzMudHJhbnNwb3NlKHdvcmxkUm90YXRpb24pIGFzIE1hdHJpeDMzO1xuICAgICAgY29uc3QgZGVsdGFMb2NhbCA9IGludmVyc2VXb3JsZFJvdGF0aW9uLm11bHRpcGx5VmVjdG9yVG8oZGVsdGFWZWN0b3IzLCBTY2FsZUdpem1vLl9fdG1wVmVjdG9yM18yKTtcbiAgICAgIHRoaXMuX19kZWx0YVBvaW50ID0gU2NhbGVHaXptby5fX3RtcFZlY3RvcjNfMy5zZXRDb21wb25lbnRzKFxuICAgICAgICBNYXRoLm1heCh0aGlzLl9fdGFyZ2V0U2NhbGVCYWNrdXAueCArIGRlbHRhTG9jYWwueCwgMC4wMSksXG4gICAgICAgIE1hdGgubWF4KHRoaXMuX190YXJnZXRTY2FsZUJhY2t1cC55ICsgZGVsdGFMb2NhbC55LCAwLjAxKSxcbiAgICAgICAgTWF0aC5tYXgodGhpcy5fX3RhcmdldFNjYWxlQmFja3VwLnogKyBkZWx0YUxvY2FsLnosIDAuMDEpXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgcG9pbnRlciB1cCBldmVudHMgZm9yIGZpbmFsaXppbmcgc2NhbGluZyBvcGVyYXRpb25zXG4gICAqIEBwYXJhbSBldnQgLSBUaGUgcG9pbnRlciBldmVudCBpbmRpY2F0aW5nIHRoZSBlbmQgb2YgaW50ZXJhY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX19vblBvaW50ZXJVcChldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgU2NhbGVHaXptby5fX2FjdGl2ZUF4aXMgPSAnbm9uZSc7XG4gICAgdGhpcy5fX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCgpO1xuXG4gICAgaWYgKFNjYWxlR2l6bW8uX19sYXRlc3RUYXJnZXRFbnRpdHkgPT09IHRoaXMuX190YXJnZXQpIHtcbiAgICAgIHRoaXMuX190YXJnZXRTY2FsZUJhY2t1cCA9IHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxTY2FsZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKSB7XG4gICAgaWYgKHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBJbnB1dE1hbmFnZXIuZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKTtcbiAgICB0aGlzLl9faXNDYW1lcmFDb250cm9sbGVyRGlzYWJsZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCgpIHtcbiAgICBpZiAoIXRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBJbnB1dE1hbmFnZXIuZW5hYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHJheSBjYXN0aW5nIGFnYWluc3QgdGhlIGVudGlyZSBnaXptbyBncm91cCBlbnRpdHlcbiAgICogQHBhcmFtIGV2dCAtIFRoZSBwb2ludGVyIGV2ZW50IGNvbnRhaW5pbmcgc2NyZWVuIGNvb3JkaW5hdGVzXG4gICAqIEByZXR1cm5zIFJheSBjYXN0aW5nIHJlc3VsdCBmb3IgdGhlIGdyb3VwIGVudGl0eVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY2FzdFJheTIoZW5naW5lOiBFbmdpbmUsIGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gU2NhbGVHaXptby5fX2dldFJlc291cmNlcyhlbmdpbmUpO1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm4geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgfVxuICAgIGNvbnN0IHJlY3QgPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qgd2lkdGggPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xpZW50V2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCB4ID0gZXZ0LmNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IHJlY3QuaGVpZ2h0IC0gKGV2dC5jbGllbnRZIC0gcmVjdC50b3ApO1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gVmVjdG9yNC5mcm9tQ29weTQoMCwgMCwgd2lkdGgsIGhlaWdodCkgYXMgVmVjdG9yNDtcbiAgICBjb25zdCBhY3RpdmVDYW1lcmEgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoQ2FtZXJhQ29tcG9uZW50LCBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpKSBhc1xuICAgICAgfCBDYW1lcmFDb21wb25lbnRcbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHJlc3VsdCA9IHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkuY2FzdFJheUZyb21TY3JlZW4oeCwgeSwgYWN0aXZlQ2FtZXJhISwgdmlld3BvcnQsIDAuMCwgW10pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgYWdhaW5zdCBpbmRpdmlkdWFsIGF4aXMgZW50aXRpZXMgdG8gZGV0ZXJtaW5lIGludGVyYWN0aW9uXG4gICAqIEBwYXJhbSBldnQgLSBUaGUgcG9pbnRlciBldmVudCBjb250YWluaW5nIHNjcmVlbiBjb29yZGluYXRlc1xuICAgKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyByYXkgY2FzdGluZyByZXN1bHRzIGZvciBYLCBZLCBhbmQgWiBheGVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBjYXN0UmF5KGVuZ2luZTogRW5naW5lLCBldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIGNvbnN0IHJlc291cmNlcyA9IFNjYWxlR2l6bW8uX19nZXRSZXNvdXJjZXMoZW5naW5lKTtcbiAgICBjb25zdCBlbXB0eVJlc3VsdCA9IHsgcmVzdWx0OiBmYWxzZSBhcyBjb25zdCB9O1xuICAgIGlmICghcmVzb3VyY2VzKSB7XG4gICAgICByZXR1cm4geyB4UmVzdWx0OiBlbXB0eVJlc3VsdCwgeVJlc3VsdDogZW1wdHlSZXN1bHQsIHpSZXN1bHQ6IGVtcHR5UmVzdWx0IH07XG4gICAgfVxuICAgIGNvbnN0IHJlY3QgPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qgd2lkdGggPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xpZW50V2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCB4ID0gZXZ0LmNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IHJlY3QuaGVpZ2h0IC0gKGV2dC5jbGllbnRZIC0gcmVjdC50b3ApO1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gVmVjdG9yNC5mcm9tQ29weTQoMCwgMCwgd2lkdGgsIGhlaWdodCkgYXMgVmVjdG9yNDtcbiAgICBjb25zdCBhY3RpdmVDYW1lcmEgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoQ2FtZXJhQ29tcG9uZW50LCBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpKSBhc1xuICAgICAgfCBDYW1lcmFDb21wb25lbnRcbiAgICAgIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IHhSZXN1bHQgPSByZXNvdXJjZXMueEN1YmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmNhc3RSYXlGcm9tU2NyZWVuKHgsIHksIGFjdGl2ZUNhbWVyYSEsIHZpZXdwb3J0LCAwLjApO1xuICAgIGNvbnN0IHlSZXN1bHQgPSByZXNvdXJjZXMueUN1YmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmNhc3RSYXlGcm9tU2NyZWVuKHgsIHksIGFjdGl2ZUNhbWVyYSEsIHZpZXdwb3J0LCAwLjApO1xuICAgIGNvbnN0IHpSZXN1bHQgPSByZXNvdXJjZXMuekN1YmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmNhc3RSYXlGcm9tU2NyZWVuKHgsIHksIGFjdGl2ZUNhbWVyYSEsIHZpZXdwb3J0LCAwLjApO1xuICAgIHJldHVybiB7IHhSZXN1bHQsIHlSZXN1bHQsIHpSZXN1bHQgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZ2l6bW8gYW5kIGNsZWFucyB1cCBhc3NvY2lhdGVkIHJlc291cmNlc1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX19kZXN0cm95VG9wRW50aXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIGFsbCBzdGF0aWMgcmVzb3VyY2VzIGZvciBhIHNwZWNpZmljIEVuZ2luZS5cbiAgICogVGhpcyByZW1vdmVzIHRoZSByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBlbmdpbmUgZnJvbSB0aGUgbWFwLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gRW5naW5lLmRlc3Ryb3koKVxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgU2NhbGVHaXptby5fX3Jlc291cmNlc01hcC5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgU2NhbGVHaXptby5fX2FjdGl2ZUF4aXMgPSAnbm9uZSc7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLHlCQUF5QjtBQUNsQyxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLFlBQVk7QUFDckIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsYUFBYTtBQUV0QixTQUFTLGlDQUFpQztBQUcxQyxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGdCQUFnQjtBQUN6QixTQUFT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QUEsRUFNQSxXQUFpQjtBQUNmLFNBQUswQixHQUFtQjtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxrQkFBa0IsUUFBc0I7QUFDN0MsZ0JBQVd6QixHQUFlLE9BQU8sT0FBTyxTQUFTO0FBQ2pELGdCQUFXVSxLQUFlO0FBQUEsRUFDNUI7QUFDRjtBQUFBO0FBM3hCYSxZQUVJVixLQUFtRCxvQkFBSSxJQUFJO0FBRi9ELFlBSUlpQixJQUFjO0FBSmxCLFlBS0lDLElBQWM7QUFMbEIsWUFXSVIsS0FBeUM7QUFYN0MsWUFZSUYsS0FBNkI7QUFaakMsWUFjSU4sS0FBVztBQUFBO0FBZGYsWUFnQklDLEtBQXFCO0FBQUE7QUFoQnpCLFlBc0JhTSxLQUFvQixrQkFBa0IsU0FBUztBQUFBO0FBdEI1RCxZQXdCYVcsS0FBaUIsZUFBZSxLQUFLO0FBeEJsRCxZQXlCYUMsS0FBaUIsZUFBZSxLQUFLO0FBekJsRCxZQTBCYUMsS0FBaUIsZUFBZSxLQUFLO0FBMUJsRCxZQTJCYUMsS0FBaUIsZUFBZSxLQUFLO0FBM0J4RCxJQUFNLGFBQU47IiwKICAibmFtZXMiOiBbIl9fcGlja1N0YXRlZFBvaW50IiwgIl9fZGVsdGFQb2ludCIsICJfX3RhcmdldFNjYWxlQmFja3VwIiwgIl9faXNQb2ludGVyRG93biIsICJfX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkIiwgIl9fb25Qb2ludGVyRG93bkZ1bmMiLCAiX19vblBvaW50ZXJEb3duIiwgIl9fb25Qb2ludGVyTW92ZUZ1bmMiLCAiX19vblBvaW50ZXJNb3ZlIiwgIl9fb25Qb2ludGVyVXBGdW5jIiwgIl9fb25Qb2ludGVyVXAiLCAiX19nZXRSZXNvdXJjZXMiLCAiX19yZXNvdXJjZXNNYXAiLCAiX190b3BFbnRpdHkiLCAiX19sZW5ndGgiLCAiX19zY3JlZW5TcGFjZVJhdGlvIiwgIl9fZW5naW5lIiwgIl9faXNWaXNpYmxlIiwgIl9fbGF0ZXN0VGFyZ2V0RW50aXR5IiwgIl9fdGFyZ2V0IiwgIl9fc3BhY2UiLCAiX190bXBRdWF0ZXJuaW9uXzAiLCAiX19hY3RpdmVBeGlzIiwgIl9fc2V0VmlzaWJsZSIsICJfX3RvU2tpcFNldHVwIiwgIl9fY3JlYXRlUmVzb3VyY2VzIiwgIl9fY2FsY1NjcmVlblNwYWNlU2NhbGUiLCAiX191cGRhdGVXb3JsZE1hdHJpY2VzT2ZTdWJ0cmVlIiwgIl9fZ2VuZXJhdGVQcmltaXRpdmUiLCAiX19vcmlnaW5hbFgiLCAiX19vcmlnaW5hbFkiLCAiX19kaXNhYmxlQ2FtZXJhQ29udHJvbGxlciIsICJfX3RtcFZlY3RvcjNfMCIsICJfX3RtcFZlY3RvcjNfMSIsICJfX3RtcFZlY3RvcjNfMiIsICJfX3RtcFZlY3RvcjNfMyIsICJfX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCIsICJfX2Rlc3Ryb3lUb3BFbnRpdHkiXQp9Cg==
