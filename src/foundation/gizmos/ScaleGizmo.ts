import { CameraComponent } from '../components/Camera/CameraComponent';
import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { AlphaMode } from '../definitions/AlphaMode';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import { Primitive } from '../geometry/Primitive';
import { Cube } from '../geometry/shapes/Cube';
import { Plane } from '../geometry/shapes/Plane';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import type { Material } from '../materials/core/Material';
import type { IQuaternion } from '../math/IQuaternion';
import { MathUtil } from '../math/MathUtil';
import { Matrix33 } from '../math/Matrix33';
import { MutableMatrix33 } from '../math/MutableMatrix33';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { assertExist } from '../misc/MiscUtil';
import type { Engine } from '../system/Engine';
import { getEvent, INPUT_HANDLING_STATE_GIZMO_SCALE, InputManager } from '../system/InputManager';
import { Gizmo } from './Gizmo';

declare let window: any;

/**
 * Internal resources for ScaleGizmo, managed per-Engine.
 * @internal
 */
interface ScaleGizmoResources {
  groupEntity: ISceneGraphEntity;
  xCubeEntity: IMeshEntity;
  yCubeEntity: IMeshEntity;
  zCubeEntity: IMeshEntity;
  xCubeMesh: Mesh;
  yCubeMesh: Mesh;
  zCubeMesh: Mesh;
  xCubePrimitive: Cube;
  yCubePrimitive: Cube;
  zCubePrimitive: Cube;
  xEdgeCubeEntity: IMeshEntity;
  yEdgeCubeEntity: IMeshEntity;
  zEdgeCubeEntity: IMeshEntity;
  xEdgeCubeMesh: Mesh;
  yEdgeCubeMesh: Mesh;
  zEdgeCubeMesh: Mesh;
  xEdgeCubePrimitive: Cube;
  yEdgeCubePrimitive: Cube;
  zEdgeCubePrimitive: Cube;
  xCubeMaterial: Material;
  yCubeMaterial: Material;
  zCubeMaterial: Material;
  xyPlaneEntity: IMeshEntity;
  yzPlaneEntity: IMeshEntity;
  zxPlaneEntity: IMeshEntity;
  xyPlaneMesh: Mesh;
  yzPlaneMesh: Mesh;
  zxPlaneMesh: Mesh;
  xyPlanePrimitive: Plane;
  yzPlanePrimitive: Plane;
  zxPlanePrimitive: Plane;
  xyPlaneMaterial: Material;
  yzPlaneMaterial: Material;
  zxPlaneMaterial: Material;
}

/**
 * Scale Gizmo class for handling object scaling operations in 3D space
 * Provides interactive handles for scaling objects along individual axes (X, Y, Z)
 * or within specific planes (XY, YZ, ZX) in both local and world coordinate spaces
 */
export class ScaleGizmo extends Gizmo {
  /** Resources managed per-Engine instance */
  private static __resourcesMap: Map<number, ScaleGizmoResources> = new Map();

  private static __originalX = 0;
  private static __originalY = 0;
  private __pickStatedPoint = Vector3.zero();
  private __deltaPoint = Vector3.one();
  private __targetScaleBackup = Vector3.one();
  private __isPointerDown = false;
  private __isCameraControllerDisabled = false;
  private static __activeAxis: 'none' | 'x' | 'y' | 'z' = 'none';
  private static __space: 'local' | 'world' = 'world';
  private static __latestTargetEntity?: ISceneGraphEntity;
  private static __length = 1;
  private __onPointerDownFunc = this.__onPointerDown.bind(this);
  private __onPointerMoveFunc = this.__onPointerMove.bind(this);
  private __onPointerUpFunc = this.__onPointerUp.bind(this);

  /**
   * Gets the resources for a specific engine, or undefined if not initialized.
   */
  private static __getResources(engine: Engine): ScaleGizmoResources | undefined {
    return ScaleGizmo.__resourcesMap.get(engine.objectUID);
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
  get isSetup(): boolean {
    if (this.__topEntity != null) {
      return true;
    }
    return false;
  }

  /**
   * Sets the length of the gizmo handles
   * @param val - The length value to set
   */
  set length(val: number) {
    ScaleGizmo.__length = val;
  }

  /**
   * Gets the current length of the gizmo handles
   * @returns The current length value
   */
  get length(): number {
    return ScaleGizmo.__length;
  }

  /**
   * Sets the visibility of the gizmo and manages input event registration
   * @param flg - True to show the gizmo, false to hide it
   */
  set isVisible(flg: boolean) {
    const resources = ScaleGizmo.__getResources(this.__engine);
    if (!resources) {
      return;
    }

    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(this.__engine.config.eventTargetDom)) {
        eventTargetDom = this.__engine.config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_SCALE, [
        {
          eventName: getEvent('start'),
          handler: this.__onPointerDownFunc,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
        {
          eventName: getEvent('move'),
          handler: this.__onPointerMoveFunc,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
        {
          eventName: getEvent('end'),
          handler: this.__onPointerUpFunc,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
        {
          eventName: 'pointerleave',
          handler: this.__onPointerUpFunc,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
      ]);
      this.__topEntity!.getSceneGraph().addChild(resources.groupEntity.getSceneGraph());
      ScaleGizmo.__latestTargetEntity = this.__target;
      if (ScaleGizmo.__space === 'local') {
        const parent = this.__target.getSceneGraph();
        let quaternion: IQuaternion = Quaternion.identity();
        if (Is.exist(parent)) {
          quaternion = parent.getQuaternionRecursively();
        }
        resources.groupEntity.getTransform().localRotation = quaternion;
      } else if (ScaleGizmo.__space === 'world') {
        resources.groupEntity.getTransform().localRotation = Quaternion.fromCopy4(0, 0, 0, 1);
      }
    }

    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_SCALE);
      this.__deltaPoint = this.__target.getTransform().localScale;
      this.__pickStatedPoint = Vector3.zero();
      this.__isPointerDown = false;
      this.__targetScaleBackup = this.__target.getTransform().localScale;
      ScaleGizmo.__activeAxis = 'none';
    }

    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_SCALE, flg);

    this.__setVisible(flg);
    resources.xyPlaneEntity.getSceneGraph().isVisible = false;
    resources.yzPlaneEntity.getSceneGraph().isVisible = false;
    resources.zxPlaneEntity.getSceneGraph().isVisible = false;
  }

  /**
   * Sets the coordinate space for gizmo operations
   * @param space - The coordinate space to use ('local' or 'world')
   */
  setSpace(space: 'local' | 'world') {
    ScaleGizmo.__space = space;
    if (this.__isVisible) {
      this.isVisible = false;
      this.isVisible = true;
    }
  }

  /**
   * Gets the current visibility state of the gizmo
   * @returns True if the gizmo is visible, false otherwise
   */
  get isVisible(): boolean {
    return this.__isVisible;
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
  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    this.__topEntity = createGroupEntity(this.__engine);
    this.__topEntity!.tryToSetUniqueName(`ScaleGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity!.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;

    // add this topEntity to the target as gizmo
    this.__target.getSceneGraph()._addGizmoChild(this.__topEntity!.getSceneGraph());

    // Check if resources already exist for this engine
    let resources = ScaleGizmo.__getResources(this.__engine);
    if (!resources) {
      // Create resources for this engine
      resources = this.__createResources();
      ScaleGizmo.__resourcesMap.set(this.__engine.objectUID, resources);
    }

    this.__topEntity!.getSceneGraph().addChild(resources.groupEntity.getSceneGraph());

    resources.groupEntity.getSceneGraph().addChild(resources.xCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zCubeEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.xyPlaneEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.yzPlaneEntity.getSceneGraph());
    resources.groupEntity.getSceneGraph().addChild(resources.zxPlaneEntity.getSceneGraph());

    ScaleGizmo.__latestTargetEntity = this.__target;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Scale' });
  }

  /**
   * Creates all resources needed for the gizmo.
   */
  private __createResources(): ScaleGizmoResources {
    // X cube
    const xCubeEntity = createMeshEntity(this.__engine);
    xCubeEntity.tryToSetUniqueName('ScaleGizmo_xCube', true);
    xCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
    const xCubeMesh = new Mesh(this.__engine);
    const xCubeMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    xCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([1, 0, 0, 1]));
    const xCubePrimitive = new Cube(this.__engine);
    xCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(1, 0.05, 0.05),
      material: xCubeMaterial,
    });
    xCubeMesh.addPrimitive(xCubePrimitive);
    xCubeEntity.getMesh().setMesh(xCubeMesh);

    // Y cube
    const yCubeEntity = createMeshEntity(this.__engine);
    yCubeEntity.tryToSetUniqueName('ScaleGizmo_yCube', true);
    yCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
    const yCubeMesh = new Mesh(this.__engine);
    const yCubeMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    yCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 1, 0, 1]));
    const yCubePrimitive = new Cube(this.__engine);
    yCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 1, 0.05),
      material: yCubeMaterial,
    });
    yCubeMesh.addPrimitive(yCubePrimitive);
    yCubeEntity.getMesh().setMesh(yCubeMesh);

    // Z cube
    const zCubeEntity = createMeshEntity(this.__engine);
    zCubeEntity.tryToSetUniqueName('ScaleGizmo_zCube', true);
    zCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
    const zCubeMesh = new Mesh(this.__engine);
    const zCubeMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    zCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0, 1, 1]));
    const zCubePrimitive = new Cube(this.__engine);
    zCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 0.05, 1),
      material: zCubeMaterial,
    });
    zCubeMesh.addPrimitive(zCubePrimitive);
    zCubeEntity.getMesh().setMesh(zCubeMesh);

    // X edge cube
    const xEdgeCubeEntity = createMeshEntity(this.__engine);
    xEdgeCubeEntity.tryToSetUniqueName('ScaleGizmo_xEdgeCube', true);
    xEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
    const xEdgeCubeMesh = new Mesh(this.__engine);
    const xEdgeCubePrimitive = new Cube(this.__engine);
    xEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: xCubeMaterial,
    });
    xEdgeCubeMesh.addPrimitive(xEdgeCubePrimitive);
    xEdgeCubeEntity.getMesh().setMesh(xEdgeCubeMesh);
    xCubeEntity.addChild(xEdgeCubeEntity.getSceneGraph());

    // Y edge cube
    const yEdgeCubeEntity = createMeshEntity(this.__engine);
    yEdgeCubeEntity.tryToSetUniqueName('ScaleGizmo_yEdgeCube', true);
    yEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
    const yEdgeCubeMesh = new Mesh(this.__engine);
    const yEdgeCubePrimitive = new Cube(this.__engine);
    yEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: yCubeMaterial,
    });
    yEdgeCubeMesh.addPrimitive(yEdgeCubePrimitive);
    yEdgeCubeEntity.getMesh().setMesh(yEdgeCubeMesh);
    yCubeEntity.addChild(yEdgeCubeEntity.getSceneGraph());

    // Z edge cube
    const zEdgeCubeEntity = createMeshEntity(this.__engine);
    zEdgeCubeEntity.tryToSetUniqueName('ScaleGizmo_zEdgeCube', true);
    zEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
    const zEdgeCubeMesh = new Mesh(this.__engine);
    const zEdgeCubePrimitive = new Cube(this.__engine);
    zEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: zCubeMaterial,
    });
    zEdgeCubeMesh.addPrimitive(zEdgeCubePrimitive);
    zEdgeCubeEntity.getMesh().setMesh(zEdgeCubeMesh);
    zCubeEntity.addChild(zEdgeCubeEntity.getSceneGraph());

    // XY plane
    const xyPlaneEntity = createMeshEntity(this.__engine);
    xyPlaneEntity.tryToSetUniqueName('ScaleGizmo_xyPlane', true);
    xyPlaneEntity.getSceneGraph().isVisible = false;
    xyPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(MathUtil.degreeToRadian(90), 0, 0);
    const xyPlaneMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    xyPlaneMaterial.alphaMode = AlphaMode.Blend;
    xyPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0, 0.5, 0]));
    const xyPlaneMesh = new Mesh(this.__engine);
    const xyPlanePrimitive = new Plane(this.__engine);
    xyPlanePrimitive.generate({
      width: 100000,
      height: 100000,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: xyPlaneMaterial,
    });
    xyPlaneMesh.addPrimitive(xyPlanePrimitive);
    xyPlaneEntity.getMesh().setMesh(xyPlaneMesh);

    // YZ plane
    const yzPlaneEntity = createMeshEntity(this.__engine);
    yzPlaneEntity.tryToSetUniqueName('ScaleGizmo_yzPlane', true);
    yzPlaneEntity.getSceneGraph().isVisible = false;
    yzPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(0, 0, MathUtil.degreeToRadian(90));
    const yzPlaneMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    yzPlaneMaterial.alphaMode = AlphaMode.Blend;
    yzPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0.5, 0, 0, 0]));
    const yzPlaneMesh = new Mesh(this.__engine);
    const yzPlanePrimitive = new Plane(this.__engine);
    yzPlanePrimitive.generate({
      width: 100000,
      height: 100000,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: yzPlaneMaterial,
    });
    yzPlaneMesh.addPrimitive(yzPlanePrimitive);
    yzPlaneEntity.getMesh().setMesh(yzPlaneMesh);

    // ZX plane
    const zxPlaneEntity = createMeshEntity(this.__engine);
    zxPlaneEntity.tryToSetUniqueName('ScaleGizmo_zxPlane', true);
    zxPlaneEntity.getSceneGraph().isVisible = false;
    const zxPlaneMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    zxPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0.5, 0, 0]));
    zxPlaneMaterial.alphaMode = AlphaMode.Blend;
    const zxPlaneMesh = new Mesh(this.__engine);
    const zxPlanePrimitive = new Plane(this.__engine);
    zxPlanePrimitive.generate({
      width: 100000,
      height: 100000,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: zxPlaneMaterial,
    });
    zxPlaneMesh.addPrimitive(zxPlanePrimitive);
    zxPlaneEntity.getMesh().setMesh(zxPlaneMesh);

    // Group entity
    const groupEntity = createGroupEntity(this.__engine);

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
      zxPlaneMaterial,
    };
  }

  /**
   * @internal
   * Updates the gizmo's transform, scale, and position based on the target entity
   * Called each frame to maintain proper gizmo positioning and scaling behavior
   */
  _update(): void {
    if (this.__topEntity == null) {
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
    this.__topEntity.getTransform()!.localScale = Vector3.fromCopyArray([
      Math.min(1, aabb.isVanilla() ? 1 : max / 2),
      Math.min(1, aabb.isVanilla() ? 1 : max / 2),
      Math.min(1, aabb.isVanilla() ? 1 : max / 2),
    ]);

    if (this.__isPointerDown) {
      if (ScaleGizmo.__latestTargetEntity === this.__target) {
        this.__target.getTransform().localScale = this.__deltaPoint.clone();
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
  private static __generatePrimitive(engine: Engine): Primitive {
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      this.__length,
      0,
      0,

      // Y axis
      0,
      0,
      0,
      0,
      this.__length,
      0,

      // Z axis
      0,
      0,
      0,
      0,
      0,
      this.__length,
    ]);

    const color = new Float32Array([
      // X axis as Red
      1, 0, 0, 1, 0, 0,

      // Y axis as Green
      0, 1, 0, 0, 1, 0,

      // Z axis as Blue
      0, 0, 1, 0, 0, 1,
    ]);

    const primitive = Primitive.createPrimitive(engine, {
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Color0.XYZ],
      attributes: [positions, color],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
  }

  /**
   * Handles pointer down events for initiating scaling operations
   * @param evt - The pointer event containing input information
   * @private
   */
  private __onPointerDown(evt: PointerEvent) {
    this.__isPointerDown = true;
    ScaleGizmo.__activeAxis = 'none';
    ScaleGizmo.__originalX = evt.clientX;
    ScaleGizmo.__originalY = evt.clientY;

    const worldMatrix = this.__target.getSceneGraph().matrix.getRotate();
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

    if (ScaleGizmo.__space === 'local') {
      rotMat = Matrix33.transpose(rotMat) as Matrix33;
    } else if (ScaleGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }

    const { xResult, yResult, zResult } = ScaleGizmo.castRay(this.__engine, evt);
    let axisPicked = false;
    if (xResult.result) {
      assertExist(xResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(xResult.data.position.clone());
      Logger.default.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      ScaleGizmo.__activeAxis = 'x';
      axisPicked = true;
    }
    if (yResult.result) {
      assertExist(yResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(yResult.data.position.clone());
      Logger.default.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      ScaleGizmo.__activeAxis = 'y';
      axisPicked = true;
    }
    if (zResult.result) {
      assertExist(zResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(zResult.data.position.clone());
      Logger.default.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      ScaleGizmo.__activeAxis = 'z';
      axisPicked = true;
    }

    if (ScaleGizmo.__activeAxis === 'none' || axisPicked === false) {
      this.__isPointerDown = false;
      return;
    }

    // Only prevent default after confirming an axis was picked
    // This allows camera controller to handle events when gizmo is not being used
    evt.preventDefault();
    this.__disableCameraController();

    if (ScaleGizmo.__latestTargetEntity === this.__target) {
      this.__targetScaleBackup = this.__target.getTransform().localScale;
    }
  }

  /**
   * Handles pointer move events for performing real-time scaling
   * @param evt - The pointer event containing current pointer position
   * @private
   */
  private __onPointerMove(evt: PointerEvent) {
    evt.preventDefault();
    if (Is.false(this.__isPointerDown)) {
      return;
    }

    const resources = ScaleGizmo.__getResources(this.__engine);
    if (!resources) {
      return;
    }

    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    ) as CameraComponent | undefined;

    const worldMatrix = this.__target.getSceneGraph().matrix.getRotate();
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
    if (ScaleGizmo.__space === 'local') {
      rotMat = Matrix33.transpose(rotMat) as Matrix33;
    } else if (ScaleGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }
    let pickInMovingPoint: Vector3 = this.__pickStatedPoint.clone();
    if (ScaleGizmo.__activeAxis === 'x') {
      const xResult = resources.xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (xResult.result) {
        assertExist(xResult.data);
        const position = rotMat.multiplyVector(xResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(position.x, pickInMovingPoint.y, pickInMovingPoint.z);
        Logger.default.debug(`Move:${xResult.data.position.toStringApproximately()}`);
      }
    }
    if (ScaleGizmo.__activeAxis === 'y') {
      const yResult = resources.xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (yResult.result) {
        assertExist(yResult.data);
        const position = rotMat.multiplyVector(yResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, position.y, pickInMovingPoint.z);
        Logger.default.debug(`Move:${yResult.data.position.toStringApproximately()}`);
      }
    }
    if (ScaleGizmo.__activeAxis === 'z') {
      const zResult = resources.yzPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (zResult.result) {
        assertExist(zResult.data);
        const position = rotMat.multiplyVector(zResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, position.z);
        Logger.default.debug(`Move:${zResult.data.position.toStringApproximately()}`);
      }
    }

    const sg = this.__target.getSceneGraph()!;
    const aabb = sg.worldMergedAABBWithSkeletal;
    const deltaVector3 = Vector3.multiply(
      Vector3.subtract(pickInMovingPoint, this.__pickStatedPoint),
      1 / aabb.lengthCenterToCorner
    );

    Logger.default.debug(`${this.__target.uniqueName}: ${deltaVector3.toStringApproximately()}`);

    if (ScaleGizmo.__space === 'local') {
      this.__deltaPoint = Vector3.add(this.__targetScaleBackup, deltaVector3);
      this.__deltaPoint = Vector3.fromCopy3(
        Math.max(this.__deltaPoint.x, 0.01),
        Math.max(this.__deltaPoint.y, 0.01),
        Math.max(this.__deltaPoint.z, 0.01)
      );
    } else if (ScaleGizmo.__space === 'world') {
      const worldQuaternion = Quaternion.fromCopyQuaternion(this.__target.getSceneGraph().getQuaternionRecursively());
      const worldRotation = Matrix33.fromCopyQuaternion(worldQuaternion);
      const inverseWorldRotation = Matrix33.transpose(worldRotation) as Matrix33;
      const deltaLocal = inverseWorldRotation.multiplyVector(deltaVector3);
      const unclampedScale = Vector3.add(this.__targetScaleBackup, deltaLocal);
      this.__deltaPoint = Vector3.fromCopy3(
        Math.max(unclampedScale.x, 0.01),
        Math.max(unclampedScale.y, 0.01),
        Math.max(unclampedScale.z, 0.01)
      );
    }

    this._update();
  }

  /**
   * Handles pointer up events for finalizing scaling operations
   * @param evt - The pointer event indicating the end of interaction
   * @private
   */
  private __onPointerUp(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = false;
    ScaleGizmo.__activeAxis = 'none';
    this.__enableCameraControllerIfNeeded();

    if (ScaleGizmo.__latestTargetEntity === this.__target) {
      this.__targetScaleBackup = this.__target.getTransform().localScale;
    }
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

  /**
   * Performs ray casting against the entire gizmo group entity
   * @param evt - The pointer event containing screen coordinates
   * @returns Ray casting result for the group entity
   * @private
   */
  private static castRay2(engine: Engine, evt: PointerEvent) {
    const resources = ScaleGizmo.__getResources(engine);
    if (!resources) {
      return { result: false };
    }
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = engine.componentRepository.getComponent(CameraComponent, CameraComponent.getCurrent(engine)) as
      | CameraComponent
      | undefined;
    const result = resources.groupEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0, []);
    return result;
  }

  /**
   * Performs ray casting against individual axis entities to determine interaction
   * @param evt - The pointer event containing screen coordinates
   * @returns Object containing ray casting results for X, Y, and Z axes
   * @private
   */
  private static castRay(engine: Engine, evt: PointerEvent) {
    const resources = ScaleGizmo.__getResources(engine);
    const emptyResult = { result: false as const };
    if (!resources) {
      return { xResult: emptyResult, yResult: emptyResult, zResult: emptyResult };
    }
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = engine.componentRepository.getComponent(CameraComponent, CameraComponent.getCurrent(engine)) as
      | CameraComponent
      | undefined;
    const xResult = resources.xCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0);
    const yResult = resources.yCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0);
    const zResult = resources.zCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0);
    return { xResult, yResult, zResult };
  }

  /**
   * Destroys the gizmo and cleans up associated resources
   * @internal
   */
  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }

  /**
   * Cleans up all static resources for a specific Engine.
   * This removes the resources associated with the engine from the map.
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(engine: Engine): void {
    ScaleGizmo.__resourcesMap.delete(engine.objectUID);
    ScaleGizmo.__activeAxis = 'none';
  }
}
