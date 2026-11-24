// src/foundation/gizmos/TranslationGizmo.ts
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
import { MeshHelper } from "../helpers/MeshHelperObject.js";
import { createClassicUberMaterial } from "../helpers/materials/createClassicUberMaterial.js";
import { MathUtil } from "../math/MathUtil.js";
import { Matrix33 } from "../math/Matrix33.js";
import { Matrix44 } from "../math/Matrix44.js";
import { MutableMatrix33 } from "../math/MutableMatrix33.js";
import { MutableQuaternion } from "../math/MutableQuaternion.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Quaternion } from "../math/Quaternion.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector4 } from "../math/Vector4.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { assertExist } from "../misc/MiscUtil.js";
import { getEvent, INPUT_HANDLING_STATE_GIZMO_TRANSLATION, InputManager } from "../system/InputManager.js";
import { Gizmo } from "./Gizmo.js";
var _TranslationGizmo = class _TranslationGizmo extends Gizmo {
  constructor() {
    super(...arguments);
    this.Mn = Vector3.zero();
    this.On = Vector3.zero();
    this.Wn = Vector3.zero();
    this.Im = false;
    this.pn = this.qn.bind(this);
    this.rn = this.sn.bind(this);
    this.$m = this.tn.bind(this);
    this.Pm = false;
  }
  /**
   * Gets the resources for a specific engine, or undefined if not initialized.
   */
  static Hm(engine) {
    return _TranslationGizmo.Sm.get(engine.objectUID);
  }
  ///
  ///
  /// Accessors
  ///
  ///
  /**
   * Indicates whether the gizmo has been properly set up and initialized.
   * @returns True if the gizmo is set up and ready to use, false otherwise
   */
  get isSetup() {
    if (this.im != null) {
      return true;
    }
    return false;
  }
  /**
   * Sets the length/scale of the gizmo axes.
   * @param val - The length value for the gizmo axes
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value no longer affects the visual size.
   */
  set length(val) {
    _TranslationGizmo.Dm = val;
  }
  /**
   * Gets the current length/scale of the gizmo axes.
   * @returns The current length value of the gizmo axes
   * @deprecated The gizmo size is now derived from the camera so that it stays
   * constant in screen space. This value no longer affects the visual size.
   */
  get length() {
    return _TranslationGizmo.Dm;
  }
  /**
   * Sets the gizmo size as a fraction of the viewport height.
   * The unit axis length is projected to this fraction of the viewport height.
   * @param val - The ratio of the viewport height (for example, 0.12 for 12%)
   */
  set screenSpaceRatio(val) {
    _TranslationGizmo.Um = val;
  }
  /**
   * Gets the gizmo size as a fraction of the viewport height.
   * @returns The ratio of the viewport height occupied by the gizmo's unit axis length
   */
  get screenSpaceRatio() {
    return _TranslationGizmo.Um;
  }
  /**
   * Sets the visibility of the gizmo and manages input event registration.
   * When set to visible, registers pointer event handlers and adds the gizmo to the scene.
   * When set to invisible, unregisters events and resets gizmo state.
   * @param flg - True to show the gizmo, false to hide it
   */
  set isVisible(flg) {
    const resources = _TranslationGizmo.Hm(this.c);
    if (!resources) {
      return;
    }
    if (this.om === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(this.c.config.eventTargetDom)) {
        eventTargetDom = this.c.config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_TRANSLATION, [
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
      this.im.getSceneGraph().addChild(resources.groupEntity.getSceneGraph());
      this.Wm = this.jm;
      if (_TranslationGizmo.Tm === "local") {
        const quaternion = _TranslationGizmo._m;
        const parent = this.jm.getSceneGraph().parent;
        if (Is.exist(parent)) {
          parent.getQuaternionRecursivelyTo(quaternion);
        } else {
          quaternion.identity();
        }
        resources.groupEntity.getTransform().localRotation = quaternion;
      } else if (_TranslationGizmo.Tm === "world") {
        resources.groupEntity.getTransform().localRotation = _TranslationGizmo._m.identity();
      }
    }
    if (this.om === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_TRANSLATION);
      this.On = this.jm.getTransform().localPosition;
      this.Mn = Vector3.zero();
      this.Im = false;
      this.Wn = this.jm.getTransform().localPosition;
      _TranslationGizmo.Fm = "none";
    }
    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_TRANSLATION, flg);
    this.pm(flg);
    resources.xyPlaneEntity.getSceneGraph().isVisible = false;
    resources.yzPlaneEntity.getSceneGraph().isVisible = false;
    resources.zxPlaneEntity.getSceneGraph().isVisible = false;
  }
  /**
   * Sets the coordinate space for gizmo operations.
   * @param space - Either 'local' for object-relative coordinates or 'world' for global coordinates
   */
  setSpace(space) {
    _TranslationGizmo.Tm = space;
    if (this.om) {
      this.isVisible = false;
      this.isVisible = true;
    }
  }
  /**
   * Gets the current visibility state of the gizmo.
   * @returns True if the gizmo is currently visible, false otherwise
   */
  get isVisible() {
    return this.om;
  }
  ///
  ///
  /// Friends Members
  ///
  ///
  /**
   * Sets up the gizmo entities and geometry if not already initialized.
   * Creates the visual components (cubes for axes, planes for multi-axis movement)
   * and configures their materials, positioning, and hierarchy.
   * @internal
   */
  _setup() {
    if (this.km()) {
      return;
    }
    this.im = createGroupEntity(this.c);
    this.im.tryToSetUniqueName(`TranslationGizmo_of_${this.jm.uniqueName}`, true);
    this.im.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.jm.getSceneGraph()._addGizmoChild(this.im.getSceneGraph());
    let resources = _TranslationGizmo.Hm(this.c);
    if (!resources) {
      resources = this.un();
      _TranslationGizmo.Sm.set(this.c.objectUID, resources);
    }
    this.im.getSceneGraph().addChild(resources.groupEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.xCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.xConeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yConeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zConeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.xyPlaneEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yzPlaneEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zxPlaneEntity.getSceneGraph());
    this.Wm = this.jm;
    this.setGizmoTag();
    this.im.tryToSetTag({ tag: "Gizmo", value: "Translation" });
  }
  /**
   * Creates all resources needed for the gizmo.
   */
  un() {
    const coneRadius = 0.08;
    const coneHeight = 0.3;
    const coneSegments = 16;
    const xCubeEntity = createMeshEntity(this.c);
    xCubeEntity.tryToSetUniqueName("TranslationGizmo_xCube", true);
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
    yCubeEntity.tryToSetUniqueName("TranslationGizmo_yCube", true);
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
    zCubeEntity.tryToSetUniqueName("TranslationGizmo_zCube", true);
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
    const xConeEntity = MeshHelper.createCone(this.c, {
      radius: coneRadius,
      height: coneHeight,
      radialSegments: coneSegments,
      material: xCubeMaterial
    });
    xConeEntity.tryToSetUniqueName("TranslationGizmo_xCone", true);
    xConeEntity.getTransform().localPosition = Vector3.fromCopy3(1, 0, 0);
    xConeEntity.getTransform().localEulerAngles = Vector3.fromCopy3(0, 0, -MathUtil.degreeToRadian(90));
    const yConeEntity = MeshHelper.createCone(this.c, {
      radius: coneRadius,
      height: coneHeight,
      radialSegments: coneSegments,
      material: yCubeMaterial
    });
    yConeEntity.tryToSetUniqueName("TranslationGizmo_yCone", true);
    yConeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 1, 0);
    const zConeEntity = MeshHelper.createCone(this.c, {
      radius: coneRadius,
      height: coneHeight,
      radialSegments: coneSegments,
      material: zCubeMaterial
    });
    zConeEntity.tryToSetUniqueName("TranslationGizmo_zCone", true);
    zConeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 1);
    zConeEntity.getTransform().localEulerAngles = Vector3.fromCopy3(MathUtil.degreeToRadian(90), 0, 0);
    const xyPlaneEntity = createMeshEntity(this.c);
    xyPlaneEntity.tryToSetUniqueName("TranslationGizmo_xyPlane", true);
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
    yzPlaneEntity.tryToSetUniqueName("TranslationGizmo_yzPlane", true);
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
    zxPlaneEntity.tryToSetUniqueName("TranslationGizmo_zxPlane", true);
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
      xCubeMaterial,
      yCubeMaterial,
      zCubeMaterial,
      xConeEntity,
      yConeEntity,
      zConeEntity,
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
   * Updates the gizmo's transform and visual state each frame.
   * Positions the gizmo at the target's location, scales it appropriately,
   * and applies any ongoing translation operations.
   * @internal
   */
  _update() {
    if (this.im == null) {
      return;
    }
    const sg = this.jm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    const worldPosition = aabb.isVanilla() ? sg.position : aabb.centerPoint;
    const transform = this.im.getTransform();
    transform.localPosition = worldPosition;
    const scale = Gizmo.rm(this.c, worldPosition, _TranslationGizmo.Um);
    transform.localScale = Vector3.fromCopy3(scale, scale, scale);
    this.qm();
    if (this.Im) {
      if (this.Wm === this.jm) {
        this.jm.getTransform().localPosition = this.On;
      }
    }
  }
  ///
  ///
  /// Private Static Members
  ///
  ///
  /**
   * Generates a primitive for line-based gizmo visualization.
   * Creates geometry for X, Y, and Z axis lines with appropriate colors.
   * @returns A primitive containing the line geometry for the gizmo axes
   */
  static Em(engine) {
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      this.Dm,
      0,
      0,
      // Y axis
      0,
      0,
      0,
      0,
      this.Dm,
      0,
      // Z axis
      0,
      0,
      0,
      0,
      0,
      this.Dm
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
   * Handles pointer down events for starting gizmo interaction.
   * Determines which axis was clicked, sets up the initial state for dragging,
   * and configures the coordinate space transformation matrices.
   * @param evt - The pointer event containing click information
   */
  qn(evt) {
    this.Im = true;
    _TranslationGizmo.Fm = "none";
    _TranslationGizmo.S = evt.clientX;
    _TranslationGizmo.T = evt.clientY;
    const parent = this.jm.getSceneGraph().parent;
    let worldMatrix = Matrix44.identity();
    if (Is.exist(parent)) {
      worldMatrix = parent.matrixInner.getRotate();
    }
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
    if (_TranslationGizmo.Tm === "local") {
      rotMat = Matrix33.transpose(rotMat);
    } else if (_TranslationGizmo.Tm === "world") {
      rotMat = MutableMatrix33.identity();
    }
    const { xResult, yResult, zResult } = _TranslationGizmo.castRay(this.c, evt);
    let axisPicked = false;
    if (xResult.result) {
      assertExist(xResult.data);
      this.Mn = rotMat.multiplyVector(xResult.data.position.clone());
      Logger.default.debug(`Down:${this.Mn.toStringApproximately()}`);
      _TranslationGizmo.Fm = "x";
      axisPicked = true;
    }
    if (yResult.result) {
      assertExist(yResult.data);
      this.Mn = rotMat.multiplyVector(yResult.data.position.clone());
      Logger.default.debug(`Down:${this.Mn.toStringApproximately()}`);
      _TranslationGizmo.Fm = "y";
      axisPicked = true;
    }
    if (zResult.result) {
      assertExist(zResult.data);
      this.Mn = rotMat.multiplyVector(zResult.data.position.clone());
      Logger.default.debug(`Down:${this.Mn.toStringApproximately()}`);
      _TranslationGizmo.Fm = "z";
      axisPicked = true;
    }
    if (_TranslationGizmo.Fm === "none" || axisPicked === false) {
      this.Im = false;
      return;
    }
    evt.preventDefault();
    this.yn();
    if (this.Wm === this.jm) {
      this.Wn = this.jm.getTransform().localPosition;
    }
  }
  /**
   * Handles pointer move events during gizmo interaction.
   * Calculates the translation delta based on mouse movement and the active axis,
   * performs coordinate space transformations, and updates the target object's position.
   * @param evt - The pointer event containing movement information
   */
  sn(evt) {
    evt.preventDefault();
    if (Is.false(this.Im)) {
      return;
    }
    const resources = _TranslationGizmo.Hm(this.c);
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
    const parent = this.jm.getSceneGraph().parent;
    let worldMatrix = Matrix44.identity();
    if (Is.exist(parent)) {
      worldMatrix = parent.matrixInner.getRotate();
    }
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
    if (_TranslationGizmo.Tm === "local") {
      rotMat = Matrix33.transpose(rotMat);
    } else if (_TranslationGizmo.Tm === "world") {
      rotMat = MutableMatrix33.identity();
    }
    let pickInMovingPoint = this.Mn.clone();
    if (_TranslationGizmo.Fm === "x") {
      const xResult = resources.xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera, viewport, 0);
      if (xResult.result) {
        assertExist(xResult.data);
        const position = rotMat.multiplyVector(xResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(position.x, pickInMovingPoint.y, pickInMovingPoint.z);
      }
    }
    if (_TranslationGizmo.Fm === "y") {
      const yResult = resources.xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera, viewport, 0);
      if (yResult.result) {
        assertExist(yResult.data);
        const position = rotMat.multiplyVector(yResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, position.y, pickInMovingPoint.z);
      }
    }
    if (_TranslationGizmo.Fm === "z") {
      const zResult = resources.yzPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera, viewport, 0);
      if (zResult.result) {
        assertExist(zResult.data);
        const position = rotMat.multiplyVector(zResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, position.z);
      }
    }
    const deltaVector3 = Vector3.subtractTo(pickInMovingPoint, this.Mn, _TranslationGizmo.Dc);
    if (deltaVector3.length() === 0) {
      return;
    }
    Logger.default.debug(`${this.jm.uniqueName}: ${deltaVector3.toStringApproximately()}`);
    if (_TranslationGizmo.Tm === "local") {
      this.On = Vector3.addTo(deltaVector3, this.Wn, _TranslationGizmo.Ac);
    } else if (_TranslationGizmo.Tm === "world") {
      const parent2 = this.jm.getSceneGraph().parent;
      let deltaInLocal = deltaVector3;
      if (Is.exist(parent2)) {
        const parentRotation = parent2.getQuaternionRecursivelyTo(_TranslationGizmo._m);
        const inverseParentRotation = Quaternion.invertTo(parentRotation, _TranslationGizmo.Xn);
        deltaInLocal = inverseParentRotation.transformVector3To(deltaVector3, _TranslationGizmo.Bc);
      }
      this.On = Vector3.addTo(this.Wn, deltaInLocal, _TranslationGizmo.Ac);
    }
    this._update();
  }
  /**
   * Handles pointer up events to end gizmo interaction.
   * Resets the gizmo state, re-enables camera controls, and finalizes
   * the translation operation.
   * @param evt - The pointer event containing release information
   */
  tn(evt) {
    evt.preventDefault();
    this.Im = false;
    _TranslationGizmo.Fm = "none";
    this.Bn();
    if (this.Wm === this.jm) {
      this.Wn = this.jm.getTransform().localPosition;
    }
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
  /**
   * Performs ray casting against the entire gizmo group entity.
   * Used for general intersection testing with the gizmo.
   * @param evt - The pointer event to cast a ray from
   * @returns Ray casting result containing intersection information
   */
  static castRay2(engine, evt) {
    const resources = _TranslationGizmo.Hm(engine);
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
  /**
   * Performs ray casting against individual gizmo axis entities.
   * Tests intersection with X, Y, and Z axis cubes separately to determine
   * which axis was clicked for translation.
   * @param evt - The pointer event to cast a ray from
   * @returns Object containing ray casting results for each axis (xResult, yResult, zResult)
   */
  static castRay(engine, evt) {
    const resources = _TranslationGizmo.Hm(engine);
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
    const xResult = _TranslationGizmo.In(
      x,
      y,
      activeCamera,
      viewport,
      resources.xCubeEntity,
      resources.xConeEntity
    );
    const yResult = _TranslationGizmo.In(
      x,
      y,
      activeCamera,
      viewport,
      resources.yCubeEntity,
      resources.yConeEntity
    );
    const zResult = _TranslationGizmo.In(
      x,
      y,
      activeCamera,
      viewport,
      resources.zCubeEntity,
      resources.zConeEntity
    );
    return { xResult, yResult, zResult };
  }
  /**
   * Destroys the gizmo and cleans up its resources.
   * Removes the gizmo from the scene and frees associated memory.
   * @internal
   */
  _destroy() {
    if (Is.exist(this.im)) {
      this.im._destroy();
    }
  }
  /**
   * Cleans up all static resources for a specific Engine.
   * This removes the resources associated with the engine from the map.
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(engine) {
    _TranslationGizmo.Sm.delete(engine.objectUID);
    _TranslationGizmo.Fm = "none";
  }
};
/** Resources managed per-Engine instance */
_TranslationGizmo.Sm = /* @__PURE__ */ new Map();
_TranslationGizmo.S = 0;
_TranslationGizmo.T = 0;
_TranslationGizmo.Fm = "none";
_TranslationGizmo.Tm = "world";
_TranslationGizmo.Dm = 1;
/** Gizmo size as a fraction of the viewport height (unit axis length). */
_TranslationGizmo.Um = 0.12;
/** Reusable quaternions for world-rotation calculations (avoids per-frame allocations) */
_TranslationGizmo._m = MutableQuaternion.identity();
_TranslationGizmo.Xn = MutableQuaternion.identity();
/** Reusable vectors for drag calculations (avoids per-frame allocations) */
_TranslationGizmo.Dc = MutableVector3.zero();
_TranslationGizmo.Ac = MutableVector3.zero();
_TranslationGizmo.Bc = MutableVector3.zero();
var TranslationGizmo = _TranslationGizmo;
export {
  TranslationGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL1RyYW5zbGF0aW9uR2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVNZXNoRW50aXR5IH0gZnJvbSAnLi4vY29tcG9uZW50cy9NZXNoUmVuZGVyZXIvY3JlYXRlTWVzaEVudGl0eSc7XG5pbXBvcnQgeyBjcmVhdGVHcm91cEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9jcmVhdGVHcm91cEVudGl0eSc7XG5pbXBvcnQgeyBBbHBoYU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9BbHBoYU1vZGUnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9nZW9tZXRyeS9NZXNoJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBDdWJlIH0gZnJvbSAnLi4vZ2VvbWV0cnkvc2hhcGVzL0N1YmUnO1xuaW1wb3J0IHsgUGxhbmUgfSBmcm9tICcuLi9nZW9tZXRyeS9zaGFwZXMvUGxhbmUnO1xuaW1wb3J0IHR5cGUgeyBSYXljYXN0UmVzdWx0RXgxIH0gZnJvbSAnLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IElNZXNoRW50aXR5LCBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IE1lc2hIZWxwZXIgfSBmcm9tICcuLi9oZWxwZXJzL01lc2hIZWxwZXJPYmplY3QnO1xuaW1wb3J0IHsgY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCB9IGZyb20gJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL21hdGVyaWFscy9jb3JlL01hdGVyaWFsJztcbmltcG9ydCB0eXBlIHsgSU1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9JTWF0cml4JztcbmltcG9ydCB0eXBlIHsgSVZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL0lWZWN0b3InO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDMzIH0gZnJvbSAnLi4vbWF0aC9NYXRyaXgzMyc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDMzIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4MzMnO1xuaW1wb3J0IHsgTXV0YWJsZVF1YXRlcm5pb24gfSBmcm9tICcuLi9tYXRoL011dGFibGVRdWF0ZXJuaW9uJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBRdWF0ZXJuaW9uIH0gZnJvbSAnLi4vbWF0aC9RdWF0ZXJuaW9uJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgYXNzZXJ0RXhpc3QgfSBmcm9tICcuLi9taXNjL01pc2NVdGlsJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBnZXRFdmVudCwgSU5QVVRfSEFORExJTkdfU1RBVEVfR0laTU9fVFJBTlNMQVRJT04sIElucHV0TWFuYWdlciB9IGZyb20gJy4uL3N5c3RlbS9JbnB1dE1hbmFnZXInO1xuaW1wb3J0IHsgR2l6bW8gfSBmcm9tICcuL0dpem1vJztcblxuZGVjbGFyZSBsZXQgd2luZG93OiBhbnk7XG5cbi8qKlxuICogSW50ZXJuYWwgcmVzb3VyY2VzIGZvciBUcmFuc2xhdGlvbkdpem1vLCBtYW5hZ2VkIHBlci1FbmdpbmUuXG4gKiBAaW50ZXJuYWxcbiAqL1xuaW50ZXJmYWNlIFRyYW5zbGF0aW9uR2l6bW9SZXNvdXJjZXMge1xuICBncm91cEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHk7XG4gIHhDdWJlRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgeUN1YmVFbnRpdHk6IElNZXNoRW50aXR5O1xuICB6Q3ViZUVudGl0eTogSU1lc2hFbnRpdHk7XG4gIHhDdWJlTWVzaDogTWVzaDtcbiAgeUN1YmVNZXNoOiBNZXNoO1xuICB6Q3ViZU1lc2g6IE1lc2g7XG4gIHhDdWJlUHJpbWl0aXZlOiBDdWJlO1xuICB5Q3ViZVByaW1pdGl2ZTogQ3ViZTtcbiAgekN1YmVQcmltaXRpdmU6IEN1YmU7XG4gIHhDdWJlTWF0ZXJpYWw6IE1hdGVyaWFsO1xuICB5Q3ViZU1hdGVyaWFsOiBNYXRlcmlhbDtcbiAgekN1YmVNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHhDb25lRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgeUNvbmVFbnRpdHk6IElNZXNoRW50aXR5O1xuICB6Q29uZUVudGl0eTogSU1lc2hFbnRpdHk7XG4gIHh5UGxhbmVFbnRpdHk6IElNZXNoRW50aXR5O1xuICB5elBsYW5lRW50aXR5OiBJTWVzaEVudGl0eTtcbiAgenhQbGFuZUVudGl0eTogSU1lc2hFbnRpdHk7XG4gIHh5UGxhbmVNZXNoOiBNZXNoO1xuICB5elBsYW5lTWVzaDogTWVzaDtcbiAgenhQbGFuZU1lc2g6IE1lc2g7XG4gIHh5UGxhbmVQcmltaXRpdmU6IFBsYW5lO1xuICB5elBsYW5lUHJpbWl0aXZlOiBQbGFuZTtcbiAgenhQbGFuZVByaW1pdGl2ZTogUGxhbmU7XG4gIHh5UGxhbmVNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHl6UGxhbmVNYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHp4UGxhbmVNYXRlcmlhbDogTWF0ZXJpYWw7XG59XG5cbi8qKlxuICogVHJhbnNsYXRpb24gR2l6bW8gY2xhc3NcbiAqIFByb3ZpZGVzIGFuIGludGVyYWN0aXZlIDNEIHRyYW5zbGF0aW9uIGdpem1vIGZvciBtYW5pcHVsYXRpbmcgb2JqZWN0IHBvc2l0aW9ucyBpbiAzRCBzcGFjZS5cbiAqIFRoZSBnaXptbyBkaXNwbGF5cyBjb2xvcmVkIGF4ZXMgKHJlZCBmb3IgWCwgZ3JlZW4gZm9yIFksIGJsdWUgZm9yIFopIHRoYXQgY2FuIGJlIGRyYWdnZWRcbiAqIHRvIHRyYW5zbGF0ZSBvYmplY3RzIGFsb25nIHNwZWNpZmljIGF4ZXMgb3IgcGxhbmVzLlxuICovXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRpb25HaXptbyBleHRlbmRzIEdpem1vIHtcbiAgLyoqIFJlc291cmNlcyBtYW5hZ2VkIHBlci1FbmdpbmUgaW5zdGFuY2UgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19yZXNvdXJjZXNNYXA6IE1hcDxudW1iZXIsIFRyYW5zbGF0aW9uR2l6bW9SZXNvdXJjZXM+ID0gbmV3IE1hcCgpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fb3JpZ2luYWxYID0gMDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19vcmlnaW5hbFkgPSAwO1xuICBwcml2YXRlIF9fcGlja1N0YXRlZFBvaW50ID0gVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19kZWx0YVBvaW50OiBJVmVjdG9yMyA9IFZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fdGFyZ2V0UG9pbnRCYWNrdXAgPSBWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19hY3RpdmVBeGlzOiAnbm9uZScgfCAneCcgfCAneScgfCAneicgPSAnbm9uZSc7XG4gIHByaXZhdGUgc3RhdGljIF9fc3BhY2U6ICdsb2NhbCcgfCAnd29ybGQnID0gJ3dvcmxkJztcbiAgcHJpdmF0ZSBfX2xhdGVzdFRhcmdldEVudGl0eT86IElTY2VuZUdyYXBoRW50aXR5O1xuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bkZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyRG93bi5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyTW92ZUZ1bmMgPSB0aGlzLl9fb25Qb2ludGVyTW92ZS5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fb25Qb2ludGVyVXBGdW5jID0gdGhpcy5fX29uUG9pbnRlclVwLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fbGVuZ3RoID0gMTtcbiAgLyoqIEdpem1vIHNpemUgYXMgYSBmcmFjdGlvbiBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0ICh1bml0IGF4aXMgbGVuZ3RoKS4gKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19zY3JlZW5TcGFjZVJhdGlvID0gMC4xMjtcbiAgLyoqIFJldXNhYmxlIHF1YXRlcm5pb25zIGZvciB3b3JsZC1yb3RhdGlvbiBjYWxjdWxhdGlvbnMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wUXVhdGVybmlvbl8wID0gTXV0YWJsZVF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBRdWF0ZXJuaW9uXzEgPSBNdXRhYmxlUXVhdGVybmlvbi5pZGVudGl0eSgpO1xuICAvKiogUmV1c2FibGUgdmVjdG9ycyBmb3IgZHJhZyBjYWxjdWxhdGlvbnMgKGF2b2lkcyBwZXItZnJhbWUgYWxsb2NhdGlvbnMpICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9fdG1wVmVjdG9yM18wID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcFZlY3RvcjNfMSA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX190bXBWZWN0b3IzXzIgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJlc291cmNlcyBmb3IgYSBzcGVjaWZpYyBlbmdpbmUsIG9yIHVuZGVmaW5lZCBpZiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dldFJlc291cmNlcyhlbmdpbmU6IEVuZ2luZSk6IFRyYW5zbGF0aW9uR2l6bW9SZXNvdXJjZXMgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiBUcmFuc2xhdGlvbkdpem1vLl9fcmVzb3VyY2VzTWFwLmdldChlbmdpbmUub2JqZWN0VUlEKTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBnaXptbyBoYXMgYmVlbiBwcm9wZXJseSBzZXQgdXAgYW5kIGluaXRpYWxpemVkLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBnaXptbyBpcyBzZXQgdXAgYW5kIHJlYWR5IHRvIHVzZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNTZXR1cCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxlbmd0aC9zY2FsZSBvZiB0aGUgZ2l6bW8gYXhlcy5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSBsZW5ndGggdmFsdWUgZm9yIHRoZSBnaXptbyBheGVzXG4gICAqIEBkZXByZWNhdGVkIFRoZSBnaXptbyBzaXplIGlzIG5vdyBkZXJpdmVkIGZyb20gdGhlIGNhbWVyYSBzbyB0aGF0IGl0IHN0YXlzXG4gICAqIGNvbnN0YW50IGluIHNjcmVlbiBzcGFjZS4gVGhpcyB2YWx1ZSBubyBsb25nZXIgYWZmZWN0cyB0aGUgdmlzdWFsIHNpemUuXG4gICAqL1xuICBzZXQgbGVuZ3RoKHZhbDogbnVtYmVyKSB7XG4gICAgVHJhbnNsYXRpb25HaXptby5fX2xlbmd0aCA9IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGxlbmd0aC9zY2FsZSBvZiB0aGUgZ2l6bW8gYXhlcy5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgbGVuZ3RoIHZhbHVlIG9mIHRoZSBnaXptbyBheGVzXG4gICAqIEBkZXByZWNhdGVkIFRoZSBnaXptbyBzaXplIGlzIG5vdyBkZXJpdmVkIGZyb20gdGhlIGNhbWVyYSBzbyB0aGF0IGl0IHN0YXlzXG4gICAqIGNvbnN0YW50IGluIHNjcmVlbiBzcGFjZS4gVGhpcyB2YWx1ZSBubyBsb25nZXIgYWZmZWN0cyB0aGUgdmlzdWFsIHNpemUuXG4gICAqL1xuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFRyYW5zbGF0aW9uR2l6bW8uX19sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZ2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIFRoZSB1bml0IGF4aXMgbGVuZ3RoIGlzIHByb2plY3RlZCB0byB0aGlzIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgcmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCAoZm9yIGV4YW1wbGUsIDAuMTIgZm9yIDEyJSlcbiAgICovXG4gIHNldCBzY3JlZW5TcGFjZVJhdGlvKHZhbDogbnVtYmVyKSB7XG4gICAgVHJhbnNsYXRpb25HaXptby5fX3NjcmVlblNwYWNlUmF0aW8gPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZ2l6bW8gc2l6ZSBhcyBhIGZyYWN0aW9uIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQuXG4gICAqIEByZXR1cm5zIFRoZSByYXRpbyBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0IG9jY3VwaWVkIGJ5IHRoZSBnaXptbydzIHVuaXQgYXhpcyBsZW5ndGhcbiAgICovXG4gIGdldCBzY3JlZW5TcGFjZVJhdGlvKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFRyYW5zbGF0aW9uR2l6bW8uX19zY3JlZW5TcGFjZVJhdGlvO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGdpem1vIGFuZCBtYW5hZ2VzIGlucHV0IGV2ZW50IHJlZ2lzdHJhdGlvbi5cbiAgICogV2hlbiBzZXQgdG8gdmlzaWJsZSwgcmVnaXN0ZXJzIHBvaW50ZXIgZXZlbnQgaGFuZGxlcnMgYW5kIGFkZHMgdGhlIGdpem1vIHRvIHRoZSBzY2VuZS5cbiAgICogV2hlbiBzZXQgdG8gaW52aXNpYmxlLCB1bnJlZ2lzdGVycyBldmVudHMgYW5kIHJlc2V0cyBnaXptbyBzdGF0ZS5cbiAgICogQHBhcmFtIGZsZyAtIFRydWUgdG8gc2hvdyB0aGUgZ2l6bW8sIGZhbHNlIHRvIGhpZGUgaXRcbiAgICovXG4gIHNldCBpc1Zpc2libGUoZmxnOiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gVHJhbnNsYXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9faXNWaXNpYmxlID09PSBmYWxzZSAmJiBmbGcgPT09IHRydWUpIHtcbiAgICAgIGxldCBldmVudFRhcmdldERvbSA9IHdpbmRvdztcbiAgICAgIGlmIChJcy5leGlzdCh0aGlzLl9fZW5naW5lLmNvbmZpZy5ldmVudFRhcmdldERvbSkpIHtcbiAgICAgICAgZXZlbnRUYXJnZXREb20gPSB0aGlzLl9fZW5naW5lLmNvbmZpZy5ldmVudFRhcmdldERvbTtcbiAgICAgIH1cbiAgICAgIElucHV0TWFuYWdlci5yZWdpc3RlcihJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19UUkFOU0xBVElPTiwgW1xuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnc3RhcnQnKSxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fb25Qb2ludGVyRG93bkZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge30sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbTogZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6IGdldEV2ZW50KCdtb3ZlJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlck1vdmVGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHt9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb206IGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiBnZXRFdmVudCgnZW5kJyksXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tOiBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ3BvaW50ZXJsZWF2ZScsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX29uUG9pbnRlclVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7fSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tOiBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgIF0pO1xuICAgICAgdGhpcy5fX3RvcEVudGl0eSEuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgICAgdGhpcy5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG4gICAgICBpZiAoVHJhbnNsYXRpb25HaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICAgIGNvbnN0IHF1YXRlcm5pb24gPSBUcmFuc2xhdGlvbkdpem1vLl9fdG1wUXVhdGVybmlvbl8wO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgICAgIGlmIChJcy5leGlzdChwYXJlbnQpKSB7XG4gICAgICAgICAgcGFyZW50LmdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKHF1YXRlcm5pb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1YXRlcm5pb24uaWRlbnRpdHkoKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbiA9IHF1YXRlcm5pb247XG4gICAgICB9IGVsc2UgaWYgKFRyYW5zbGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ3dvcmxkJykge1xuICAgICAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxSb3RhdGlvbiA9IFRyYW5zbGF0aW9uR2l6bW8uX190bXBRdWF0ZXJuaW9uXzAuaWRlbnRpdHkoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2lzVmlzaWJsZSA9PT0gdHJ1ZSAmJiBmbGcgPT09IGZhbHNlKSB7XG4gICAgICBJbnB1dE1hbmFnZXIudW5yZWdpc3RlcihJTlBVVF9IQU5ETElOR19TVEFURV9HSVpNT19UUkFOU0xBVElPTik7XG4gICAgICB0aGlzLl9fZGVsdGFQb2ludCA9IHRoaXMuX190YXJnZXQuZ2V0VHJhbnNmb3JtKCkubG9jYWxQb3NpdGlvbjtcbiAgICAgIHRoaXMuX19waWNrU3RhdGVkUG9pbnQgPSBWZWN0b3IzLnplcm8oKTtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLl9fdGFyZ2V0UG9pbnRCYWNrdXAgPSB0aGlzLl9fdGFyZ2V0LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb247XG4gICAgICBUcmFuc2xhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICB9XG5cbiAgICBJbnB1dE1hbmFnZXIuc2V0QWN0aXZlKElOUFVUX0hBTkRMSU5HX1NUQVRFX0dJWk1PX1RSQU5TTEFUSU9OLCBmbGcpO1xuXG4gICAgdGhpcy5fX3NldFZpc2libGUoZmxnKTtcbiAgICByZXNvdXJjZXMueHlQbGFuZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgcmVzb3VyY2VzLnl6UGxhbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgIHJlc291cmNlcy56eFBsYW5lRW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb29yZGluYXRlIHNwYWNlIGZvciBnaXptbyBvcGVyYXRpb25zLlxuICAgKiBAcGFyYW0gc3BhY2UgLSBFaXRoZXIgJ2xvY2FsJyBmb3Igb2JqZWN0LXJlbGF0aXZlIGNvb3JkaW5hdGVzIG9yICd3b3JsZCcgZm9yIGdsb2JhbCBjb29yZGluYXRlc1xuICAgKi9cbiAgc2V0U3BhY2Uoc3BhY2U6ICdsb2NhbCcgfCAnd29ybGQnKSB7XG4gICAgVHJhbnNsYXRpb25HaXptby5fX3NwYWNlID0gc3BhY2U7XG4gICAgaWYgKHRoaXMuX19pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICB0aGlzLmlzVmlzaWJsZSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGdpem1vIGlzIGN1cnJlbnRseSB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1Zpc2libGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19pc1Zpc2libGU7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBGcmllbmRzIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBnaXptbyBlbnRpdGllcyBhbmQgZ2VvbWV0cnkgaWYgbm90IGFscmVhZHkgaW5pdGlhbGl6ZWQuXG4gICAqIENyZWF0ZXMgdGhlIHZpc3VhbCBjb21wb25lbnRzIChjdWJlcyBmb3IgYXhlcywgcGxhbmVzIGZvciBtdWx0aS1heGlzIG1vdmVtZW50KVxuICAgKiBhbmQgY29uZmlndXJlcyB0aGVpciBtYXRlcmlhbHMsIHBvc2l0aW9uaW5nLCBhbmQgaGllcmFyY2h5LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fdG9wRW50aXR5ID0gY3JlYXRlR3JvdXBFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgdGhpcy5fX3RvcEVudGl0eSEudHJ5VG9TZXRVbmlxdWVOYW1lKGBUcmFuc2xhdGlvbkdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSEudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IHRydWU7XG5cbiAgICAvLyBhZGQgdGhpcyB0b3BFbnRpdHkgdG8gdGhlIHRhcmdldCBhcyBnaXptb1xuICAgIHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSk7XG5cbiAgICAvLyBDaGVjayBpZiByZXNvdXJjZXMgYWxyZWFkeSBleGlzdCBmb3IgdGhpcyBlbmdpbmVcbiAgICBsZXQgcmVzb3VyY2VzID0gVHJhbnNsYXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgLy8gQ3JlYXRlIHJlc291cmNlcyBmb3IgdGhpcyBlbmdpbmVcbiAgICAgIHJlc291cmNlcyA9IHRoaXMuX19jcmVhdGVSZXNvdXJjZXMoKTtcbiAgICAgIFRyYW5zbGF0aW9uR2l6bW8uX19yZXNvdXJjZXNNYXAuc2V0KHRoaXMuX19lbmdpbmUub2JqZWN0VUlELCByZXNvdXJjZXMpO1xuICAgIH1cblxuICAgIHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcblxuICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQocmVzb3VyY2VzLnhDdWJlRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMueUN1YmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy56Q3ViZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQocmVzb3VyY2VzLnhDb25lRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMueUNvbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy56Q29uZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuICAgIHJlc291cmNlcy5ncm91cEVudGl0eS5nZXRTY2VuZUdyYXBoKCkuYWRkQ2hpbGQocmVzb3VyY2VzLnh5UGxhbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpKTtcbiAgICByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmFkZENoaWxkKHJlc291cmNlcy55elBsYW5lRW50aXR5LmdldFNjZW5lR3JhcGgoKSk7XG4gICAgcmVzb3VyY2VzLmdyb3VwRW50aXR5LmdldFNjZW5lR3JhcGgoKS5hZGRDaGlsZChyZXNvdXJjZXMuenhQbGFuZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkpO1xuXG4gICAgdGhpcy5fX2xhdGVzdFRhcmdldEVudGl0eSA9IHRoaXMuX190YXJnZXQ7XG5cbiAgICB0aGlzLnNldEdpem1vVGFnKCk7XG4gICAgdGhpcy5fX3RvcEVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogJ0dpem1vJywgdmFsdWU6ICdUcmFuc2xhdGlvbicgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbGwgcmVzb3VyY2VzIG5lZWRlZCBmb3IgdGhlIGdpem1vLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZVJlc291cmNlcygpOiBUcmFuc2xhdGlvbkdpem1vUmVzb3VyY2VzIHtcbiAgICBjb25zdCBjb25lUmFkaXVzID0gMC4wODtcbiAgICBjb25zdCBjb25lSGVpZ2h0ID0gMC4zO1xuICAgIGNvbnN0IGNvbmVTZWdtZW50cyA9IDE2O1xuXG4gICAgLy8gWCBjdWJlXG4gICAgY29uc3QgeEN1YmVFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHhDdWJlRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnVHJhbnNsYXRpb25HaXptb194Q3ViZScsIHRydWUpO1xuICAgIHhDdWJlRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MygwLjUsIDAsIDApO1xuICAgIGNvbnN0IHhDdWJlTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHhDdWJlTWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKHRoaXMuX19lbmdpbmUpO1xuICAgIHhDdWJlTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFsxLCAwLCAwLCAxXSkpO1xuICAgIGNvbnN0IHhDdWJlUHJpbWl0aXZlID0gbmV3IEN1YmUodGhpcy5fX2VuZ2luZSk7XG4gICAgeEN1YmVQcmltaXRpdmUuZ2VuZXJhdGUoe1xuICAgICAgd2lkdGhWZWN0b3I6IFZlY3RvcjMuZnJvbUNvcHkzKDEsIDAuMDUsIDAuMDUpLFxuICAgICAgbWF0ZXJpYWw6IHhDdWJlTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgeEN1YmVNZXNoLmFkZFByaW1pdGl2ZSh4Q3ViZVByaW1pdGl2ZSk7XG4gICAgeEN1YmVFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeEN1YmVNZXNoKTtcblxuICAgIC8vIFkgY3ViZVxuICAgIGNvbnN0IHlDdWJlRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB5Q3ViZUVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1RyYW5zbGF0aW9uR2l6bW9feUN1YmUnLCB0cnVlKTtcbiAgICB5Q3ViZUVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbFBvc2l0aW9uID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMC41LCAwKTtcbiAgICBjb25zdCB5Q3ViZU1lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB5Q3ViZU1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCh0aGlzLl9fZW5naW5lKTtcbiAgICB5Q3ViZU1hdGVyaWFsLnNldFBhcmFtZXRlcignZGlmZnVzZUNvbG9yRmFjdG9yJywgVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMCwgMSwgMCwgMV0pKTtcbiAgICBjb25zdCB5Q3ViZVByaW1pdGl2ZSA9IG5ldyBDdWJlKHRoaXMuX19lbmdpbmUpO1xuICAgIHlDdWJlUHJpbWl0aXZlLmdlbmVyYXRlKHtcbiAgICAgIHdpZHRoVmVjdG9yOiBWZWN0b3IzLmZyb21Db3B5MygwLjA1LCAxLCAwLjA1KSxcbiAgICAgIG1hdGVyaWFsOiB5Q3ViZU1hdGVyaWFsLFxuICAgIH0pO1xuICAgIHlDdWJlTWVzaC5hZGRQcmltaXRpdmUoeUN1YmVQcmltaXRpdmUpO1xuICAgIHlDdWJlRW50aXR5LmdldE1lc2goKS5zZXRNZXNoKHlDdWJlTWVzaCk7XG5cbiAgICAvLyBaIGN1YmVcbiAgICBjb25zdCB6Q3ViZUVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgekN1YmVFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdUcmFuc2xhdGlvbkdpem1vX3pDdWJlJywgdHJ1ZSk7XG4gICAgekN1YmVFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHkzKDAsIDAsIDAuNSk7XG4gICAgY29uc3QgekN1YmVNZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgY29uc3QgekN1YmVNYXRlcmlhbCA9IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSk7XG4gICAgekN1YmVNYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VDb2xvckZhY3RvcicsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzAsIDAsIDEsIDFdKSk7XG4gICAgY29uc3QgekN1YmVQcmltaXRpdmUgPSBuZXcgQ3ViZSh0aGlzLl9fZW5naW5lKTtcbiAgICB6Q3ViZVByaW1pdGl2ZS5nZW5lcmF0ZSh7XG4gICAgICB3aWR0aFZlY3RvcjogVmVjdG9yMy5mcm9tQ29weTMoMC4wNSwgMC4wNSwgMSksXG4gICAgICBtYXRlcmlhbDogekN1YmVNYXRlcmlhbCxcbiAgICB9KTtcbiAgICB6Q3ViZU1lc2guYWRkUHJpbWl0aXZlKHpDdWJlUHJpbWl0aXZlKTtcbiAgICB6Q3ViZUVudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh6Q3ViZU1lc2gpO1xuXG4gICAgLy8gWCBjb25lXG4gICAgY29uc3QgeENvbmVFbnRpdHkgPSBNZXNoSGVscGVyLmNyZWF0ZUNvbmUodGhpcy5fX2VuZ2luZSwge1xuICAgICAgcmFkaXVzOiBjb25lUmFkaXVzLFxuICAgICAgaGVpZ2h0OiBjb25lSGVpZ2h0LFxuICAgICAgcmFkaWFsU2VnbWVudHM6IGNvbmVTZWdtZW50cyxcbiAgICAgIG1hdGVyaWFsOiB4Q3ViZU1hdGVyaWFsLFxuICAgIH0pO1xuICAgIHhDb25lRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnVHJhbnNsYXRpb25HaXptb194Q29uZScsIHRydWUpO1xuICAgIHhDb25lRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MygxLCAwLCAwKTtcbiAgICB4Q29uZUVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbEV1bGVyQW5nbGVzID0gVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgLU1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKDkwKSk7XG5cbiAgICAvLyBZIGNvbmVcbiAgICBjb25zdCB5Q29uZUVudGl0eSA9IE1lc2hIZWxwZXIuY3JlYXRlQ29uZSh0aGlzLl9fZW5naW5lLCB7XG4gICAgICByYWRpdXM6IGNvbmVSYWRpdXMsXG4gICAgICBoZWlnaHQ6IGNvbmVIZWlnaHQsXG4gICAgICByYWRpYWxTZWdtZW50czogY29uZVNlZ21lbnRzLFxuICAgICAgbWF0ZXJpYWw6IHlDdWJlTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgeUNvbmVFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdUcmFuc2xhdGlvbkdpem1vX3lDb25lJywgdHJ1ZSk7XG4gICAgeUNvbmVFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApO1xuXG4gICAgLy8gWiBjb25lXG4gICAgY29uc3QgekNvbmVFbnRpdHkgPSBNZXNoSGVscGVyLmNyZWF0ZUNvbmUodGhpcy5fX2VuZ2luZSwge1xuICAgICAgcmFkaXVzOiBjb25lUmFkaXVzLFxuICAgICAgaGVpZ2h0OiBjb25lSGVpZ2h0LFxuICAgICAgcmFkaWFsU2VnbWVudHM6IGNvbmVTZWdtZW50cyxcbiAgICAgIG1hdGVyaWFsOiB6Q3ViZU1hdGVyaWFsLFxuICAgIH0pO1xuICAgIHpDb25lRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnVHJhbnNsYXRpb25HaXptb196Q29uZScsIHRydWUpO1xuICAgIHpDb25lRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAxKTtcbiAgICB6Q29uZUVudGl0eS5nZXRUcmFuc2Zvcm0oKS5sb2NhbEV1bGVyQW5nbGVzID0gVmVjdG9yMy5mcm9tQ29weTMoTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oOTApLCAwLCAwKTtcblxuICAgIC8vIFhZIHBsYW5lXG4gICAgY29uc3QgeHlQbGFuZUVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgeHlQbGFuZUVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoJ1RyYW5zbGF0aW9uR2l6bW9feHlQbGFuZScsIHRydWUpO1xuICAgIHh5UGxhbmVFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgIHh5UGxhbmVFbnRpdHkuZ2V0VHJhbnNmb3JtKCkubG9jYWxFdWxlckFuZ2xlcyA9IFZlY3RvcjMuZnJvbUNvcHkzKE1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKDkwKSwgMCwgMCk7XG4gICAgY29uc3QgeHlQbGFuZU1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCh0aGlzLl9fZW5naW5lKTtcbiAgICB4eVBsYW5lTWF0ZXJpYWwuYWxwaGFNb2RlID0gQWxwaGFNb2RlLkJsZW5kO1xuICAgIHh5UGxhbmVNYXRlcmlhbC5zZXRQYXJhbWV0ZXIoJ2RpZmZ1c2VDb2xvckZhY3RvcicsIFZlY3RvcjQuZnJvbUNvcHlBcnJheTQoWzAsIDAsIDAuNSwgMF0pKTtcbiAgICBjb25zdCB4eVBsYW5lTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHh5UGxhbmVQcmltaXRpdmUgPSBuZXcgUGxhbmUodGhpcy5fX2VuZ2luZSk7XG4gICAgeHlQbGFuZVByaW1pdGl2ZS5nZW5lcmF0ZSh7XG4gICAgICB3aWR0aDogMTAwMDAwLFxuICAgICAgaGVpZ2h0OiAxMDAwMDAsXG4gICAgICB1U3BhbjogMSxcbiAgICAgIHZTcGFuOiAxLFxuICAgICAgaXNVVlJlcGVhdDogdHJ1ZSxcbiAgICAgIGZsaXBUZXh0dXJlQ29vcmRpbmF0ZVk6IGZhbHNlLFxuICAgICAgbWF0ZXJpYWw6IHh5UGxhbmVNYXRlcmlhbCxcbiAgICB9KTtcbiAgICB4eVBsYW5lTWVzaC5hZGRQcmltaXRpdmUoeHlQbGFuZVByaW1pdGl2ZSk7XG4gICAgeHlQbGFuZUVudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh4eVBsYW5lTWVzaCk7XG5cbiAgICAvLyBZWiBwbGFuZVxuICAgIGNvbnN0IHl6UGxhbmVFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHl6UGxhbmVFbnRpdHkudHJ5VG9TZXRVbmlxdWVOYW1lKCdUcmFuc2xhdGlvbkdpem1vX3l6UGxhbmUnLCB0cnVlKTtcbiAgICB5elBsYW5lRW50aXR5LmdldFNjZW5lR3JhcGgoKS5pc1Zpc2libGUgPSBmYWxzZTtcbiAgICB5elBsYW5lRW50aXR5LmdldFRyYW5zZm9ybSgpLmxvY2FsRXVsZXJBbmdsZXMgPSBWZWN0b3IzLmZyb21Db3B5MygwLCAwLCBNYXRoVXRpbC5kZWdyZWVUb1JhZGlhbig5MCkpO1xuICAgIGNvbnN0IHl6UGxhbmVNYXRlcmlhbCA9IGNyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwodGhpcy5fX2VuZ2luZSk7XG4gICAgeXpQbGFuZU1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5CbGVuZDtcbiAgICB5elBsYW5lTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLjUsIDAsIDAsIDBdKSk7XG4gICAgY29uc3QgeXpQbGFuZU1lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBjb25zdCB5elBsYW5lUHJpbWl0aXZlID0gbmV3IFBsYW5lKHRoaXMuX19lbmdpbmUpO1xuICAgIHl6UGxhbmVQcmltaXRpdmUuZ2VuZXJhdGUoe1xuICAgICAgd2lkdGg6IDEwMDAwMCxcbiAgICAgIGhlaWdodDogMTAwMDAwLFxuICAgICAgdVNwYW46IDEsXG4gICAgICB2U3BhbjogMSxcbiAgICAgIGlzVVZSZXBlYXQ6IHRydWUsXG4gICAgICBmbGlwVGV4dHVyZUNvb3JkaW5hdGVZOiBmYWxzZSxcbiAgICAgIG1hdGVyaWFsOiB5elBsYW5lTWF0ZXJpYWwsXG4gICAgfSk7XG4gICAgeXpQbGFuZU1lc2guYWRkUHJpbWl0aXZlKHl6UGxhbmVQcmltaXRpdmUpO1xuICAgIHl6UGxhbmVFbnRpdHkuZ2V0TWVzaCgpLnNldE1lc2goeXpQbGFuZU1lc2gpO1xuXG4gICAgLy8gWlggcGxhbmVcbiAgICBjb25zdCB6eFBsYW5lRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB6eFBsYW5lRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZSgnVHJhbnNsYXRpb25HaXptb196eFBsYW5lJywgdHJ1ZSk7XG4gICAgenhQbGFuZUVudGl0eS5nZXRTY2VuZUdyYXBoKCkuaXNWaXNpYmxlID0gZmFsc2U7XG4gICAgY29uc3QgenhQbGFuZU1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCh0aGlzLl9fZW5naW5lKTtcbiAgICB6eFBsYW5lTWF0ZXJpYWwuc2V0UGFyYW1ldGVyKCdkaWZmdXNlQ29sb3JGYWN0b3InLCBWZWN0b3I0LmZyb21Db3B5QXJyYXk0KFswLCAwLjUsIDAsIDBdKSk7XG4gICAgenhQbGFuZU1hdGVyaWFsLmFscGhhTW9kZSA9IEFscGhhTW9kZS5CbGVuZDtcbiAgICBjb25zdCB6eFBsYW5lTWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIGNvbnN0IHp4UGxhbmVQcmltaXRpdmUgPSBuZXcgUGxhbmUodGhpcy5fX2VuZ2luZSk7XG4gICAgenhQbGFuZVByaW1pdGl2ZS5nZW5lcmF0ZSh7XG4gICAgICB3aWR0aDogMTAwMDAwLFxuICAgICAgaGVpZ2h0OiAxMDAwMDAsXG4gICAgICB1U3BhbjogMSxcbiAgICAgIHZTcGFuOiAxLFxuICAgICAgaXNVVlJlcGVhdDogdHJ1ZSxcbiAgICAgIGZsaXBUZXh0dXJlQ29vcmRpbmF0ZVk6IGZhbHNlLFxuICAgICAgbWF0ZXJpYWw6IHp4UGxhbmVNYXRlcmlhbCxcbiAgICB9KTtcbiAgICB6eFBsYW5lTWVzaC5hZGRQcmltaXRpdmUoenhQbGFuZVByaW1pdGl2ZSk7XG4gICAgenhQbGFuZUVudGl0eS5nZXRNZXNoKCkuc2V0TWVzaCh6eFBsYW5lTWVzaCk7XG5cbiAgICAvLyBHcm91cCBlbnRpdHlcbiAgICBjb25zdCBncm91cEVudGl0eSA9IGNyZWF0ZUdyb3VwRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGdyb3VwRW50aXR5LFxuICAgICAgeEN1YmVFbnRpdHksXG4gICAgICB5Q3ViZUVudGl0eSxcbiAgICAgIHpDdWJlRW50aXR5LFxuICAgICAgeEN1YmVNZXNoLFxuICAgICAgeUN1YmVNZXNoLFxuICAgICAgekN1YmVNZXNoLFxuICAgICAgeEN1YmVQcmltaXRpdmUsXG4gICAgICB5Q3ViZVByaW1pdGl2ZSxcbiAgICAgIHpDdWJlUHJpbWl0aXZlLFxuICAgICAgeEN1YmVNYXRlcmlhbCxcbiAgICAgIHlDdWJlTWF0ZXJpYWwsXG4gICAgICB6Q3ViZU1hdGVyaWFsLFxuICAgICAgeENvbmVFbnRpdHksXG4gICAgICB5Q29uZUVudGl0eSxcbiAgICAgIHpDb25lRW50aXR5LFxuICAgICAgeHlQbGFuZUVudGl0eSxcbiAgICAgIHl6UGxhbmVFbnRpdHksXG4gICAgICB6eFBsYW5lRW50aXR5LFxuICAgICAgeHlQbGFuZU1lc2gsXG4gICAgICB5elBsYW5lTWVzaCxcbiAgICAgIHp4UGxhbmVNZXNoLFxuICAgICAgeHlQbGFuZVByaW1pdGl2ZSxcbiAgICAgIHl6UGxhbmVQcmltaXRpdmUsXG4gICAgICB6eFBsYW5lUHJpbWl0aXZlLFxuICAgICAgeHlQbGFuZU1hdGVyaWFsLFxuICAgICAgeXpQbGFuZU1hdGVyaWFsLFxuICAgICAgenhQbGFuZU1hdGVyaWFsLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZ2l6bW8ncyB0cmFuc2Zvcm0gYW5kIHZpc3VhbCBzdGF0ZSBlYWNoIGZyYW1lLlxuICAgKiBQb3NpdGlvbnMgdGhlIGdpem1vIGF0IHRoZSB0YXJnZXQncyBsb2NhdGlvbiwgc2NhbGVzIGl0IGFwcHJvcHJpYXRlbHksXG4gICAqIGFuZCBhcHBsaWVzIGFueSBvbmdvaW5nIHRyYW5zbGF0aW9uIG9wZXJhdGlvbnMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3VwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNnID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkhO1xuICAgIGNvbnN0IGFhYmIgPSBzZy53b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWw7XG4gICAgLy8gR2l6bW8gZW50aXRpZXMgYXJlIGF0dGFjaGVkIHdpdGggdG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IHRydWUsXG4gICAgLy8gc28gbG9jYWwgdmFsdWVzIGFyZSB3b3JsZCB2YWx1ZXMgaGVyZS5cbiAgICBjb25zdCB3b3JsZFBvc2l0aW9uID0gYWFiYi5pc1ZhbmlsbGEoKSA/IHNnLnBvc2l0aW9uIDogYWFiYi5jZW50ZXJQb2ludDtcbiAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLl9fdG9wRW50aXR5LmdldFRyYW5zZm9ybSgpITtcbiAgICB0cmFuc2Zvcm0ubG9jYWxQb3NpdGlvbiA9IHdvcmxkUG9zaXRpb247XG5cbiAgICAvLyBLZWVwIHRoZSBnaXptbyBhdCBhIGNvbnN0YW50IHNpemUgb24gc2NyZWVuIHJlZ2FyZGxlc3Mgb2YgdGhlIHRhcmdldCBzaXplLlxuICAgIGNvbnN0IHNjYWxlID0gR2l6bW8uX19jYWxjU2NyZWVuU3BhY2VTY2FsZSh0aGlzLl9fZW5naW5lLCB3b3JsZFBvc2l0aW9uLCBUcmFuc2xhdGlvbkdpem1vLl9fc2NyZWVuU3BhY2VSYXRpbyk7XG4gICAgdHJhbnNmb3JtLmxvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5MyhzY2FsZSwgc2NhbGUsIHNjYWxlKTtcbiAgICAvLyBSZWZsZWN0IHRoZSBuZXcgc2NhbGUgaW4gdGhlIHNhbWUgZnJhbWUuIFRoZSBSZW5kZXIgc3RhZ2UgdXBsb2FkcyB0aGUgaW5zdGFuY2UgZGF0YVxuICAgIC8vIGJlZm9yZSB0aGUgbWF0cmljZXMgd291bGQgYmUgcmVjYWxjdWxhdGVkIGxhemlseSwgc28gbWF0ZXJpYWxpemUgdGhlbSBub3cuXG4gICAgdGhpcy5fX3VwZGF0ZVdvcmxkTWF0cmljZXNPZlN1YnRyZWUoKTtcblxuICAgIGlmICh0aGlzLl9faXNQb2ludGVyRG93bikge1xuICAgICAgaWYgKHRoaXMuX19sYXRlc3RUYXJnZXRFbnRpdHkgPT09IHRoaXMuX190YXJnZXQpIHtcbiAgICAgICAgdGhpcy5fX3RhcmdldC5nZXRUcmFuc2Zvcm0oKS5sb2NhbFBvc2l0aW9uID0gdGhpcy5fX2RlbHRhUG9pbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHJpdmF0ZSBTdGF0aWMgTWVtYmVyc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHByaW1pdGl2ZSBmb3IgbGluZS1iYXNlZCBnaXptbyB2aXN1YWxpemF0aW9uLlxuICAgKiBDcmVhdGVzIGdlb21ldHJ5IGZvciBYLCBZLCBhbmQgWiBheGlzIGxpbmVzIHdpdGggYXBwcm9wcmlhdGUgY29sb3JzLlxuICAgKiBAcmV0dXJucyBBIHByaW1pdGl2ZSBjb250YWluaW5nIHRoZSBsaW5lIGdlb21ldHJ5IGZvciB0aGUgZ2l6bW8gYXhlc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZVByaW1pdGl2ZShlbmdpbmU6IEVuZ2luZSk6IFByaW1pdGl2ZSB7XG4gICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAvLyBYIGF4aXNcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHRoaXMuX19sZW5ndGgsXG4gICAgICAwLFxuICAgICAgMCxcblxuICAgICAgLy8gWSBheGlzXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgdGhpcy5fX2xlbmd0aCxcbiAgICAgIDAsXG5cbiAgICAgIC8vIFogYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICB0aGlzLl9fbGVuZ3RoLFxuICAgIF0pO1xuXG4gICAgY29uc3QgY29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIC8vIFggYXhpcyBhcyBSZWRcbiAgICAgIDEsIDAsIDAsIDEsIDAsIDAsXG5cbiAgICAgIC8vIFkgYXhpcyBhcyBHcmVlblxuICAgICAgMCwgMSwgMCwgMCwgMSwgMCxcblxuICAgICAgLy8gWiBheGlzIGFzIEJsdWVcbiAgICAgIDAsIDAsIDEsIDAsIDAsIDEsXG4gICAgXSk7XG5cbiAgICBjb25zdCBwcmltaXRpdmUgPSBQcmltaXRpdmUuY3JlYXRlUHJpbWl0aXZlKGVuZ2luZSwge1xuICAgICAgYXR0cmlidXRlU2VtYW50aWNzOiBbVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWiwgVmVydGV4QXR0cmlidXRlLkNvbG9yMC5YWVpdLFxuICAgICAgYXR0cmlidXRlczogW3Bvc2l0aW9ucywgY29sb3JdLFxuICAgICAgcHJpbWl0aXZlTW9kZTogUHJpbWl0aXZlTW9kZS5MaW5lcyxcbiAgICB9KTtcblxuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBwb2ludGVyIGRvd24gZXZlbnRzIGZvciBzdGFydGluZyBnaXptbyBpbnRlcmFjdGlvbi5cbiAgICogRGV0ZXJtaW5lcyB3aGljaCBheGlzIHdhcyBjbGlja2VkLCBzZXRzIHVwIHRoZSBpbml0aWFsIHN0YXRlIGZvciBkcmFnZ2luZyxcbiAgICogYW5kIGNvbmZpZ3VyZXMgdGhlIGNvb3JkaW5hdGUgc3BhY2UgdHJhbnNmb3JtYXRpb24gbWF0cmljZXMuXG4gICAqIEBwYXJhbSBldnQgLSBUaGUgcG9pbnRlciBldmVudCBjb250YWluaW5nIGNsaWNrIGluZm9ybWF0aW9uXG4gICAqL1xuICBwcml2YXRlIF9fb25Qb2ludGVyRG93bihldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gdHJ1ZTtcbiAgICBUcmFuc2xhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICBUcmFuc2xhdGlvbkdpem1vLl9fb3JpZ2luYWxYID0gZXZ0LmNsaWVudFg7XG4gICAgVHJhbnNsYXRpb25HaXptby5fX29yaWdpbmFsWSA9IGV2dC5jbGllbnRZO1xuXG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkucGFyZW50O1xuICAgIGxldCB3b3JsZE1hdHJpeDogSU1hdHJpeDQ0ID0gTWF0cml4NDQuaWRlbnRpdHkoKTtcbiAgICBpZiAoSXMuZXhpc3QocGFyZW50KSkge1xuICAgICAgd29ybGRNYXRyaXggPSBwYXJlbnQubWF0cml4SW5uZXIuZ2V0Um90YXRlKCk7XG4gICAgfVxuICAgIGNvbnN0IHNjYWxlVmVjID0gVmVjdG9yMy5vbmUoKTsgLy90aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS53b3JsZE1hdHJpeC5nZXRTY2FsZSgpO1xuICAgIGxldCByb3RNYXQgPSBNYXRyaXgzMy5mcm9tQ29weTlSb3dNYWpvcihcbiAgICAgIHNjYWxlVmVjLnggKiB3b3JsZE1hdHJpeC5tMDAsXG4gICAgICBzY2FsZVZlYy54ICogd29ybGRNYXRyaXgubTAxLFxuICAgICAgc2NhbGVWZWMueCAqIHdvcmxkTWF0cml4Lm0wMixcbiAgICAgIHNjYWxlVmVjLnkgKiB3b3JsZE1hdHJpeC5tMTAsXG4gICAgICBzY2FsZVZlYy55ICogd29ybGRNYXRyaXgubTExLFxuICAgICAgc2NhbGVWZWMueSAqIHdvcmxkTWF0cml4Lm0xMixcbiAgICAgIHNjYWxlVmVjLnogKiB3b3JsZE1hdHJpeC5tMjAsXG4gICAgICBzY2FsZVZlYy56ICogd29ybGRNYXRyaXgubTIxLFxuICAgICAgc2NhbGVWZWMueiAqIHdvcmxkTWF0cml4Lm0yMlxuICAgICk7XG5cbiAgICBpZiAoVHJhbnNsYXRpb25HaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICByb3RNYXQgPSBNYXRyaXgzMy50cmFuc3Bvc2Uocm90TWF0KSBhcyBNYXRyaXgzMztcbiAgICB9IGVsc2UgaWYgKFRyYW5zbGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ3dvcmxkJykge1xuICAgICAgcm90TWF0ID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gICAgfVxuXG4gICAgY29uc3QgeyB4UmVzdWx0LCB5UmVzdWx0LCB6UmVzdWx0IH0gPSBUcmFuc2xhdGlvbkdpem1vLmNhc3RSYXkodGhpcy5fX2VuZ2luZSwgZXZ0KTtcbiAgICBsZXQgYXhpc1BpY2tlZCA9IGZhbHNlO1xuICAgIGlmICh4UmVzdWx0LnJlc3VsdCkge1xuICAgICAgYXNzZXJ0RXhpc3QoeFJlc3VsdC5kYXRhKTtcbiAgICAgIHRoaXMuX19waWNrU3RhdGVkUG9pbnQgPSByb3RNYXQubXVsdGlwbHlWZWN0b3IoeFJlc3VsdC5kYXRhLnBvc2l0aW9uLmNsb25lKCkpO1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZGVidWcoYERvd246JHt0aGlzLl9fcGlja1N0YXRlZFBvaW50LnRvU3RyaW5nQXBwcm94aW1hdGVseSgpfWApO1xuICAgICAgVHJhbnNsYXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPSAneCc7XG4gICAgICBheGlzUGlja2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHlSZXN1bHQucmVzdWx0KSB7XG4gICAgICBhc3NlcnRFeGlzdCh5UmVzdWx0LmRhdGEpO1xuICAgICAgdGhpcy5fX3BpY2tTdGF0ZWRQb2ludCA9IHJvdE1hdC5tdWx0aXBseVZlY3Rvcih5UmVzdWx0LmRhdGEucG9zaXRpb24uY2xvbmUoKSk7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5kZWJ1ZyhgRG93bjoke3RoaXMuX19waWNrU3RhdGVkUG9pbnQudG9TdHJpbmdBcHByb3hpbWF0ZWx5KCl9YCk7XG4gICAgICBUcmFuc2xhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICd5JztcbiAgICAgIGF4aXNQaWNrZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoelJlc3VsdC5yZXN1bHQpIHtcbiAgICAgIGFzc2VydEV4aXN0KHpSZXN1bHQuZGF0YSk7XG4gICAgICB0aGlzLl9fcGlja1N0YXRlZFBvaW50ID0gcm90TWF0Lm11bHRpcGx5VmVjdG9yKHpSZXN1bHQuZGF0YS5wb3NpdGlvbi5jbG9uZSgpKTtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmRlYnVnKGBEb3duOiR7dGhpcy5fX3BpY2tTdGF0ZWRQb2ludC50b1N0cmluZ0FwcHJveGltYXRlbHkoKX1gKTtcbiAgICAgIFRyYW5zbGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID0gJ3onO1xuICAgICAgYXhpc1BpY2tlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKFRyYW5zbGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID09PSAnbm9uZScgfHwgYXhpc1BpY2tlZCA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuX19pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gT25seSBwcmV2ZW50IGRlZmF1bHQgYWZ0ZXIgY29uZmlybWluZyBhbiBheGlzIHdhcyBwaWNrZWRcbiAgICAvLyBUaGlzIGFsbG93cyBjYW1lcmEgY29udHJvbGxlciB0byBoYW5kbGUgZXZlbnRzIHdoZW4gZ2l6bW8gaXMgbm90IGJlaW5nIHVzZWRcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLl9fZGlzYWJsZUNhbWVyYUNvbnRyb2xsZXIoKTtcblxuICAgIGlmICh0aGlzLl9fbGF0ZXN0VGFyZ2V0RW50aXR5ID09PSB0aGlzLl9fdGFyZ2V0KSB7XG4gICAgICB0aGlzLl9fdGFyZ2V0UG9pbnRCYWNrdXAgPSB0aGlzLl9fdGFyZ2V0LmdldFRyYW5zZm9ybSgpLmxvY2FsUG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgcG9pbnRlciBtb3ZlIGV2ZW50cyBkdXJpbmcgZ2l6bW8gaW50ZXJhY3Rpb24uXG4gICAqIENhbGN1bGF0ZXMgdGhlIHRyYW5zbGF0aW9uIGRlbHRhIGJhc2VkIG9uIG1vdXNlIG1vdmVtZW50IGFuZCB0aGUgYWN0aXZlIGF4aXMsXG4gICAqIHBlcmZvcm1zIGNvb3JkaW5hdGUgc3BhY2UgdHJhbnNmb3JtYXRpb25zLCBhbmQgdXBkYXRlcyB0aGUgdGFyZ2V0IG9iamVjdCdzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gZXZ0IC0gVGhlIHBvaW50ZXIgZXZlbnQgY29udGFpbmluZyBtb3ZlbWVudCBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBfX29uUG9pbnRlck1vdmUoZXZ0OiBQb2ludGVyRXZlbnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoSXMuZmFsc2UodGhpcy5fX2lzUG9pbnRlckRvd24pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzb3VyY2VzID0gVHJhbnNsYXRpb25HaXptby5fX2dldFJlc291cmNlcyh0aGlzLl9fZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY3QgPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qgd2lkdGggPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xpZW50V2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudEhlaWdodDtcbiAgICBjb25zdCB4ID0gZXZ0LmNsaWVudFggLSByZWN0LmxlZnQ7XG4gICAgY29uc3QgeSA9IHJlY3QuaGVpZ2h0IC0gKGV2dC5jbGllbnRZIC0gcmVjdC50b3ApO1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gVmVjdG9yNC5mcm9tQ29weTQoMCwgMCwgd2lkdGgsIGhlaWdodCkgYXMgVmVjdG9yNDtcbiAgICBjb25zdCBhY3RpdmVDYW1lcmEgPSB0aGlzLl9fZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KFxuICAgICAgQ2FtZXJhQ29tcG9uZW50LFxuICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQodGhpcy5fX2VuZ2luZSlcbiAgICApIGFzIENhbWVyYUNvbXBvbmVudCB8IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpLnBhcmVudDtcbiAgICBsZXQgd29ybGRNYXRyaXg6IElNYXRyaXg0NCA9IE1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gICAgaWYgKElzLmV4aXN0KHBhcmVudCkpIHtcbiAgICAgIHdvcmxkTWF0cml4ID0gcGFyZW50Lm1hdHJpeElubmVyLmdldFJvdGF0ZSgpO1xuICAgIH1cbiAgICBjb25zdCBzY2FsZVZlYyA9IFZlY3RvcjMub25lKCk7XG4gICAgbGV0IHJvdE1hdCA9IE1hdHJpeDMzLmZyb21Db3B5OVJvd01ham9yKFxuICAgICAgc2NhbGVWZWMueCAqIHdvcmxkTWF0cml4Lm0wMCxcbiAgICAgIHNjYWxlVmVjLnggKiB3b3JsZE1hdHJpeC5tMDEsXG4gICAgICBzY2FsZVZlYy54ICogd29ybGRNYXRyaXgubTAyLFxuICAgICAgc2NhbGVWZWMueSAqIHdvcmxkTWF0cml4Lm0xMCxcbiAgICAgIHNjYWxlVmVjLnkgKiB3b3JsZE1hdHJpeC5tMTEsXG4gICAgICBzY2FsZVZlYy55ICogd29ybGRNYXRyaXgubTEyLFxuICAgICAgc2NhbGVWZWMueiAqIHdvcmxkTWF0cml4Lm0yMCxcbiAgICAgIHNjYWxlVmVjLnogKiB3b3JsZE1hdHJpeC5tMjEsXG4gICAgICBzY2FsZVZlYy56ICogd29ybGRNYXRyaXgubTIyXG4gICAgKTtcbiAgICBpZiAoVHJhbnNsYXRpb25HaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICByb3RNYXQgPSBNYXRyaXgzMy50cmFuc3Bvc2Uocm90TWF0KSBhcyBNYXRyaXgzMztcbiAgICB9IGVsc2UgaWYgKFRyYW5zbGF0aW9uR2l6bW8uX19zcGFjZSA9PT0gJ3dvcmxkJykge1xuICAgICAgcm90TWF0ID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gICAgfVxuICAgIGxldCBwaWNrSW5Nb3ZpbmdQb2ludDogVmVjdG9yMyA9IHRoaXMuX19waWNrU3RhdGVkUG9pbnQuY2xvbmUoKTtcbiAgICBpZiAoVHJhbnNsYXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPT09ICd4Jykge1xuICAgICAgY29uc3QgeFJlc3VsdCA9IHJlc291cmNlcy54eVBsYW5lRW50aXR5LmdldE1lc2goKS5jYXN0UmF5RnJvbVNjcmVlbkluV29ybGQoeCwgeSwgYWN0aXZlQ2FtZXJhISwgdmlld3BvcnQsIDAuMCk7XG4gICAgICBpZiAoeFJlc3VsdC5yZXN1bHQpIHtcbiAgICAgICAgYXNzZXJ0RXhpc3QoeFJlc3VsdC5kYXRhKTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSByb3RNYXQubXVsdGlwbHlWZWN0b3IoeFJlc3VsdC5kYXRhLnBvc2l0aW9uKTtcbiAgICAgICAgcGlja0luTW92aW5nUG9pbnQgPSBWZWN0b3IzLmZyb21Db3B5Myhwb3NpdGlvbi54LCBwaWNrSW5Nb3ZpbmdQb2ludC55LCBwaWNrSW5Nb3ZpbmdQb2ludC56KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ01vdmU6JyArIHhSZXN1bHQuZGF0YS5wb3NpdGlvbi50b1N0cmluZ0FwcHJveGltYXRlbHkoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChUcmFuc2xhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9PT0gJ3knKSB7XG4gICAgICBjb25zdCB5UmVzdWx0ID0gcmVzb3VyY2VzLnh5UGxhbmVFbnRpdHkuZ2V0TWVzaCgpLmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBhY3RpdmVDYW1lcmEhLCB2aWV3cG9ydCwgMC4wKTtcbiAgICAgIGlmICh5UmVzdWx0LnJlc3VsdCkge1xuICAgICAgICBhc3NlcnRFeGlzdCh5UmVzdWx0LmRhdGEpO1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHJvdE1hdC5tdWx0aXBseVZlY3Rvcih5UmVzdWx0LmRhdGEucG9zaXRpb24pO1xuICAgICAgICBwaWNrSW5Nb3ZpbmdQb2ludCA9IFZlY3RvcjMuZnJvbUNvcHkzKHBpY2tJbk1vdmluZ1BvaW50LngsIHBvc2l0aW9uLnksIHBpY2tJbk1vdmluZ1BvaW50LnopO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnTW92ZTonICsgeVJlc3VsdC5kYXRhLnBvc2l0aW9uLnRvU3RyaW5nQXBwcm94aW1hdGVseSgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKFRyYW5zbGF0aW9uR2l6bW8uX19hY3RpdmVBeGlzID09PSAneicpIHtcbiAgICAgIGNvbnN0IHpSZXN1bHQgPSByZXNvdXJjZXMueXpQbGFuZUVudGl0eS5nZXRNZXNoKCkuY2FzdFJheUZyb21TY3JlZW5JbldvcmxkKHgsIHksIGFjdGl2ZUNhbWVyYSEsIHZpZXdwb3J0LCAwLjApO1xuICAgICAgaWYgKHpSZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGFzc2VydEV4aXN0KHpSZXN1bHQuZGF0YSk7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gcm90TWF0Lm11bHRpcGx5VmVjdG9yKHpSZXN1bHQuZGF0YS5wb3NpdGlvbik7XG4gICAgICAgIHBpY2tJbk1vdmluZ1BvaW50ID0gVmVjdG9yMy5mcm9tQ29weTMocGlja0luTW92aW5nUG9pbnQueCwgcGlja0luTW92aW5nUG9pbnQueSwgcG9zaXRpb24ueik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdNb3ZlOicgKyB6UmVzdWx0LmRhdGEucG9zaXRpb24udG9TdHJpbmdBcHByb3hpbWF0ZWx5KCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGRlbHRhVmVjdG9yMyA9IFZlY3RvcjMuc3VidHJhY3RUbyhwaWNrSW5Nb3ZpbmdQb2ludCwgdGhpcy5fX3BpY2tTdGF0ZWRQb2ludCwgVHJhbnNsYXRpb25HaXptby5fX3RtcFZlY3RvcjNfMCk7XG5cbiAgICBpZiAoZGVsdGFWZWN0b3IzLmxlbmd0aCgpID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgTG9nZ2VyLmRlZmF1bHQuZGVidWcoYCR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfTogJHtkZWx0YVZlY3RvcjMudG9TdHJpbmdBcHByb3hpbWF0ZWx5KCl9YCk7XG5cbiAgICBpZiAoVHJhbnNsYXRpb25HaXptby5fX3NwYWNlID09PSAnbG9jYWwnKSB7XG4gICAgICB0aGlzLl9fZGVsdGFQb2ludCA9IFZlY3RvcjMuYWRkVG8oZGVsdGFWZWN0b3IzLCB0aGlzLl9fdGFyZ2V0UG9pbnRCYWNrdXAsIFRyYW5zbGF0aW9uR2l6bW8uX190bXBWZWN0b3IzXzEpO1xuICAgIH0gZWxzZSBpZiAoVHJhbnNsYXRpb25HaXptby5fX3NwYWNlID09PSAnd29ybGQnKSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKS5wYXJlbnQ7XG4gICAgICBsZXQgZGVsdGFJbkxvY2FsOiBJVmVjdG9yMyA9IGRlbHRhVmVjdG9yMztcbiAgICAgIGlmIChJcy5leGlzdChwYXJlbnQpKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudFJvdGF0aW9uID0gcGFyZW50LmdldFF1YXRlcm5pb25SZWN1cnNpdmVseVRvKFRyYW5zbGF0aW9uR2l6bW8uX190bXBRdWF0ZXJuaW9uXzApO1xuICAgICAgICBjb25zdCBpbnZlcnNlUGFyZW50Um90YXRpb24gPSBRdWF0ZXJuaW9uLmludmVydFRvKHBhcmVudFJvdGF0aW9uLCBUcmFuc2xhdGlvbkdpem1vLl9fdG1wUXVhdGVybmlvbl8xKTtcbiAgICAgICAgZGVsdGFJbkxvY2FsID0gaW52ZXJzZVBhcmVudFJvdGF0aW9uLnRyYW5zZm9ybVZlY3RvcjNUbyhkZWx0YVZlY3RvcjMsIFRyYW5zbGF0aW9uR2l6bW8uX190bXBWZWN0b3IzXzIpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2RlbHRhUG9pbnQgPSBWZWN0b3IzLmFkZFRvKHRoaXMuX190YXJnZXRQb2ludEJhY2t1cCwgZGVsdGFJbkxvY2FsLCBUcmFuc2xhdGlvbkdpem1vLl9fdG1wVmVjdG9yM18xKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHBvaW50ZXIgdXAgZXZlbnRzIHRvIGVuZCBnaXptbyBpbnRlcmFjdGlvbi5cbiAgICogUmVzZXRzIHRoZSBnaXptbyBzdGF0ZSwgcmUtZW5hYmxlcyBjYW1lcmEgY29udHJvbHMsIGFuZCBmaW5hbGl6ZXNcbiAgICogdGhlIHRyYW5zbGF0aW9uIG9wZXJhdGlvbi5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBwb2ludGVyIGV2ZW50IGNvbnRhaW5pbmcgcmVsZWFzZSBpbmZvcm1hdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBfX29uUG9pbnRlclVwKGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5fX2lzUG9pbnRlckRvd24gPSBmYWxzZTtcbiAgICBUcmFuc2xhdGlvbkdpem1vLl9fYWN0aXZlQXhpcyA9ICdub25lJztcbiAgICB0aGlzLl9fZW5hYmxlQ2FtZXJhQ29udHJvbGxlcklmTmVlZGVkKCk7XG5cbiAgICBpZiAodGhpcy5fX2xhdGVzdFRhcmdldEVudGl0eSA9PT0gdGhpcy5fX3RhcmdldCkge1xuICAgICAgdGhpcy5fX3RhcmdldFBvaW50QmFja3VwID0gdGhpcy5fX3RhcmdldC5nZXRUcmFuc2Zvcm0oKS5sb2NhbFBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpIHtcbiAgICBpZiAodGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIElucHV0TWFuYWdlci5kaXNhYmxlQ2FtZXJhQ29udHJvbGxlcigpO1xuICAgIHRoaXMuX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9fZW5hYmxlQ2FtZXJhQ29udHJvbGxlcklmTmVlZGVkKCkge1xuICAgIGlmICghdGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIElucHV0TWFuYWdlci5lbmFibGVDYW1lcmFDb250cm9sbGVyKCk7XG4gICAgdGhpcy5fX2lzQ2FtZXJhQ29udHJvbGxlckRpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgYWdhaW5zdCB0aGUgZW50aXJlIGdpem1vIGdyb3VwIGVudGl0eS5cbiAgICogVXNlZCBmb3IgZ2VuZXJhbCBpbnRlcnNlY3Rpb24gdGVzdGluZyB3aXRoIHRoZSBnaXptby5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBwb2ludGVyIGV2ZW50IHRvIGNhc3QgYSByYXkgZnJvbVxuICAgKiBAcmV0dXJucyBSYXkgY2FzdGluZyByZXN1bHQgY29udGFpbmluZyBpbnRlcnNlY3Rpb24gaW5mb3JtYXRpb25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGNhc3RSYXkyKGVuZ2luZTogRW5naW5lLCBldnQ6IFBvaW50ZXJFdmVudCkge1xuICAgIGNvbnN0IHJlc291cmNlcyA9IFRyYW5zbGF0aW9uR2l6bW8uX19nZXRSZXNvdXJjZXMoZW5naW5lKTtcbiAgICBpZiAoIXJlc291cmNlcykge1xuICAgICAgcmV0dXJuIHsgcmVzdWx0OiBmYWxzZSB9O1xuICAgIH1cbiAgICBjb25zdCByZWN0ID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHdpZHRoID0gKGV2dC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsaWVudFdpZHRoO1xuICAgIGNvbnN0IGhlaWdodCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGllbnRIZWlnaHQ7XG4gICAgY29uc3QgeCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIGNvbnN0IHkgPSByZWN0LmhlaWdodCAtIChldnQuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IFZlY3RvcjQuZnJvbUNvcHk0KDAsIDAsIHdpZHRoLCBoZWlnaHQpIGFzIFZlY3RvcjQ7XG4gICAgY29uc3QgYWN0aXZlQ2FtZXJhID0gZW5naW5lLmNvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50KENhbWVyYUNvbXBvbmVudCwgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKSkgYXNcbiAgICAgIHwgQ2FtZXJhQ29tcG9uZW50XG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCByZXN1bHQgPSByZXNvdXJjZXMuZ3JvdXBFbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLmNhc3RSYXlGcm9tU2NyZWVuKHgsIHksIGFjdGl2ZUNhbWVyYSEsIHZpZXdwb3J0LCAwLjAsIFtdKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19jYXN0RnJvbUVudGl0aWVzKFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgY2FtZXJhOiBDYW1lcmFDb21wb25lbnQsXG4gICAgdmlld3BvcnQ6IFZlY3RvcjQsXG4gICAgLi4uZW50aXRpZXM6IEFycmF5PElNZXNoRW50aXR5IHwgdW5kZWZpbmVkPlxuICApOiBSYXljYXN0UmVzdWx0RXgxIHtcbiAgICBsZXQgY2xvc2VzdFJlc3VsdDogUmF5Y2FzdFJlc3VsdEV4MSA9IHsgcmVzdWx0OiBmYWxzZSB9O1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGVudGl0eSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSBlbnRpdHkuZ2V0TWVzaCgpLmNhc3RSYXlGcm9tU2NyZWVuSW5Xb3JsZCh4LCB5LCBjYW1lcmEsIHZpZXdwb3J0LCAwLjApO1xuICAgICAgaWYgKCFyZXN1bHQucmVzdWx0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudERpc3RhbmNlID0gcmVzdWx0LmRhdGE/LnQgPz8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgICAgY29uc3QgY2xvc2VzdERpc3RhbmNlID0gY2xvc2VzdFJlc3VsdC5kYXRhPy50ID8/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgIGlmICghY2xvc2VzdFJlc3VsdC5yZXN1bHQgfHwgY3VycmVudERpc3RhbmNlIDwgY2xvc2VzdERpc3RhbmNlKSB7XG4gICAgICAgIGNsb3Nlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbG9zZXN0UmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHJheSBjYXN0aW5nIGFnYWluc3QgaW5kaXZpZHVhbCBnaXptbyBheGlzIGVudGl0aWVzLlxuICAgKiBUZXN0cyBpbnRlcnNlY3Rpb24gd2l0aCBYLCBZLCBhbmQgWiBheGlzIGN1YmVzIHNlcGFyYXRlbHkgdG8gZGV0ZXJtaW5lXG4gICAqIHdoaWNoIGF4aXMgd2FzIGNsaWNrZWQgZm9yIHRyYW5zbGF0aW9uLlxuICAgKiBAcGFyYW0gZXZ0IC0gVGhlIHBvaW50ZXIgZXZlbnQgdG8gY2FzdCBhIHJheSBmcm9tXG4gICAqIEByZXR1cm5zIE9iamVjdCBjb250YWluaW5nIHJheSBjYXN0aW5nIHJlc3VsdHMgZm9yIGVhY2ggYXhpcyAoeFJlc3VsdCwgeVJlc3VsdCwgelJlc3VsdClcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGNhc3RSYXkoZW5naW5lOiBFbmdpbmUsIGV2dDogUG9pbnRlckV2ZW50KSB7XG4gICAgY29uc3QgcmVzb3VyY2VzID0gVHJhbnNsYXRpb25HaXptby5fX2dldFJlc291cmNlcyhlbmdpbmUpO1xuICAgIGNvbnN0IGVtcHR5UmVzdWx0OiBSYXljYXN0UmVzdWx0RXgxID0geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgaWYgKCFyZXNvdXJjZXMpIHtcbiAgICAgIHJldHVybiB7IHhSZXN1bHQ6IGVtcHR5UmVzdWx0LCB5UmVzdWx0OiBlbXB0eVJlc3VsdCwgelJlc3VsdDogZW1wdHlSZXN1bHQgfTtcbiAgICB9XG4gICAgY29uc3QgcmVjdCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCB3aWR0aCA9IChldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGllbnRXaWR0aDtcbiAgICBjb25zdCBoZWlnaHQgPSAoZXZ0LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuY2xpZW50SGVpZ2h0O1xuICAgIGNvbnN0IHggPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICBjb25zdCB5ID0gcmVjdC5oZWlnaHQgLSAoZXZ0LmNsaWVudFkgLSByZWN0LnRvcCk7XG4gICAgY29uc3Qgdmlld3BvcnQgPSBWZWN0b3I0LmZyb21Db3B5NCgwLCAwLCB3aWR0aCwgaGVpZ2h0KSBhcyBWZWN0b3I0O1xuICAgIGNvbnN0IGFjdGl2ZUNhbWVyYSA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChDYW1lcmFDb21wb25lbnQsIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSkpIGFzXG4gICAgICB8IENhbWVyYUNvbXBvbmVudFxuICAgICAgfCB1bmRlZmluZWQ7XG4gICAgY29uc3QgeFJlc3VsdCA9IFRyYW5zbGF0aW9uR2l6bW8uX19jYXN0RnJvbUVudGl0aWVzKFxuICAgICAgeCxcbiAgICAgIHksXG4gICAgICBhY3RpdmVDYW1lcmEhLFxuICAgICAgdmlld3BvcnQsXG4gICAgICByZXNvdXJjZXMueEN1YmVFbnRpdHksXG4gICAgICByZXNvdXJjZXMueENvbmVFbnRpdHlcbiAgICApO1xuICAgIGNvbnN0IHlSZXN1bHQgPSBUcmFuc2xhdGlvbkdpem1vLl9fY2FzdEZyb21FbnRpdGllcyhcbiAgICAgIHgsXG4gICAgICB5LFxuICAgICAgYWN0aXZlQ2FtZXJhISxcbiAgICAgIHZpZXdwb3J0LFxuICAgICAgcmVzb3VyY2VzLnlDdWJlRW50aXR5LFxuICAgICAgcmVzb3VyY2VzLnlDb25lRW50aXR5XG4gICAgKTtcbiAgICBjb25zdCB6UmVzdWx0ID0gVHJhbnNsYXRpb25HaXptby5fX2Nhc3RGcm9tRW50aXRpZXMoXG4gICAgICB4LFxuICAgICAgeSxcbiAgICAgIGFjdGl2ZUNhbWVyYSEsXG4gICAgICB2aWV3cG9ydCxcbiAgICAgIHJlc291cmNlcy56Q3ViZUVudGl0eSxcbiAgICAgIHJlc291cmNlcy56Q29uZUVudGl0eVxuICAgICk7XG4gICAgcmV0dXJuIHsgeFJlc3VsdCwgeVJlc3VsdCwgelJlc3VsdCB9O1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBnaXptbyBhbmQgY2xlYW5zIHVwIGl0cyByZXNvdXJjZXMuXG4gICAqIFJlbW92ZXMgdGhlIGdpem1vIGZyb20gdGhlIHNjZW5lIGFuZCBmcmVlcyBhc3NvY2lhdGVkIG1lbW9yeS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3RvcEVudGl0eSkpIHtcbiAgICAgIHRoaXMuX190b3BFbnRpdHkuX2Rlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIGFsbCBzdGF0aWMgcmVzb3VyY2VzIGZvciBhIHNwZWNpZmljIEVuZ2luZS5cbiAgICogVGhpcyByZW1vdmVzIHRoZSByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBlbmdpbmUgZnJvbSB0aGUgbWFwLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gRW5naW5lLmRlc3Ryb3koKVxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgVHJhbnNsYXRpb25HaXptby5fX3Jlc291cmNlc01hcC5kZWxldGUoZW5naW5lLm9iamVjdFVJRCk7XG4gICAgVHJhbnNsYXRpb25HaXptby5fX2FjdGl2ZUF4aXMgPSAnbm9uZSc7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFT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QmxELGtCQTBCYUMsS0FBaUIsZUFBZSxLQUFLO0FBMUJsRCxrQkEyQmFHLEtBQWlCLGVBQWUsS0FBSztBQTNCeEQsSUFBTSxtQkFBTjsiLAogICJuYW1lcyI6IFsiX19waWNrU3RhdGVkUG9pbnQiLCAiX19kZWx0YVBvaW50IiwgIl9fdGFyZ2V0UG9pbnRCYWNrdXAiLCAiX19pc1BvaW50ZXJEb3duIiwgIl9fb25Qb2ludGVyRG93bkZ1bmMiLCAiX19vblBvaW50ZXJEb3duIiwgIl9fb25Qb2ludGVyTW92ZUZ1bmMiLCAiX19vblBvaW50ZXJNb3ZlIiwgIl9fb25Qb2ludGVyVXBGdW5jIiwgIl9fb25Qb2ludGVyVXAiLCAiX19pc0NhbWVyYUNvbnRyb2xsZXJEaXNhYmxlZCIsICJfX2dldFJlc291cmNlcyIsICJfX3Jlc291cmNlc01hcCIsICJfX3RvcEVudGl0eSIsICJfX2xlbmd0aCIsICJfX3NjcmVlblNwYWNlUmF0aW8iLCAiX19lbmdpbmUiLCAiX19pc1Zpc2libGUiLCAiX19sYXRlc3RUYXJnZXRFbnRpdHkiLCAiX190YXJnZXQiLCAiX19zcGFjZSIsICJfX3RtcFF1YXRlcm5pb25fMCIsICJfX2FjdGl2ZUF4aXMiLCAiX19zZXRWaXNpYmxlIiwgIl9fdG9Ta2lwU2V0dXAiLCAiX19jcmVhdGVSZXNvdXJjZXMiLCAiX19jYWxjU2NyZWVuU3BhY2VTY2FsZSIsICJfX3VwZGF0ZVdvcmxkTWF0cmljZXNPZlN1YnRyZWUiLCAiX19nZW5lcmF0ZVByaW1pdGl2ZSIsICJfX29yaWdpbmFsWCIsICJfX29yaWdpbmFsWSIsICJfX2Rpc2FibGVDYW1lcmFDb250cm9sbGVyIiwgIl9fdG1wVmVjdG9yM18wIiwgIl9fdG1wVmVjdG9yM18xIiwgInBhcmVudCIsICJfX3RtcFF1YXRlcm5pb25fMSIsICJfX3RtcFZlY3RvcjNfMiIsICJfX2VuYWJsZUNhbWVyYUNvbnRyb2xsZXJJZk5lZWRlZCIsICJfX2Nhc3RGcm9tRW50aXRpZXMiXQp9Cg==
