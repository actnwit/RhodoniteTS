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
import { INPUT_HANDLING_STATE_GIZMO_SCALE, InputManager, getEvent } from '../system/InputManager';
import { Gizmo } from './Gizmo';

declare let window: any;

/**
 * Scale Gizmo class for handling object scaling operations in 3D space
 * Provides interactive handles for scaling objects along individual axes (X, Y, Z)
 * or within specific planes (XY, YZ, ZX) in both local and world coordinate spaces
 */
export class ScaleGizmo extends Gizmo {
  private static __groupEntity: ISceneGraphEntity;
  private static __xCubeEntity: IMeshEntity;
  private static __yCubeEntity: IMeshEntity;
  private static __zCubeEntity: IMeshEntity;
  private static __xCubeMesh: Mesh;
  private static __yCubeMesh: Mesh;
  private static __zCubeMesh: Mesh;
  private static __xCubePrimitive: Cube;
  private static __yCubePrimitive: Cube;
  private static __zCubePrimitive: Cube;
  private static __xEdgeCubeEntity: IMeshEntity;
  private static __yEdgeCubeEntity: IMeshEntity;
  private static __zEdgeCubeEntity: IMeshEntity;
  private static __xEdgeCubeMesh: Mesh;
  private static __yEdgeCubeMesh: Mesh;
  private static __zEdgeCubeMesh: Mesh;
  private static __xEdgeCubePrimitive: Cube;
  private static __yEdgeCubePrimitive: Cube;
  private static __zEdgeCubePrimitive: Cube;
  private static __xCubeMaterial: Material;
  private static __yCubeMaterial: Material;
  private static __zCubeMaterial: Material;
  private static __xyPlaneEntity: IMeshEntity;
  private static __yzPlaneEntity: IMeshEntity;
  private static __zxPlaneEntity: IMeshEntity;
  private static __xyPlaneMesh: Mesh;
  private static __yzPlaneMesh: Mesh;
  private static __zxPlaneMesh: Mesh;
  private static __xyPlanePrimitive: Plane;
  private static __yzPlanePrimitive: Plane;
  private static __zxPlanePrimitive: Plane;
  private static __xyPlaneMaterial: Material;
  private static __yzPlaneMaterial: Material;
  private static __zxPlaneMaterial: Material;
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
    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(Config.eventTargetDom)) {
        eventTargetDom = Config.eventTargetDom;
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
      this.__topEntity!.getSceneGraph().addChild(ScaleGizmo.__groupEntity.getSceneGraph());
      ScaleGizmo.__latestTargetEntity = this.__target;
      if (ScaleGizmo.__space === 'local') {
        const parent = this.__target.getSceneGraph();
        let quaternion: IQuaternion = Quaternion.identity();
        if (Is.exist(parent)) {
          quaternion = parent.getQuaternionRecursively();
        }
        ScaleGizmo.__groupEntity.getTransform().localRotation = quaternion;
      } else if (ScaleGizmo.__space === 'world') {
        ScaleGizmo.__groupEntity.getTransform().localRotation = Quaternion.fromCopy4(0, 0, 0, 1);
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
    ScaleGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
    ScaleGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
    ScaleGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
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

    // setup the mesh
    // x
    if (Is.not.exist(ScaleGizmo.__xCubeEntity)) {
      this.xMesh();
      this.xEdgeMesh();
    }

    // y
    if (Is.not.exist(ScaleGizmo.__yCubeEntity)) {
      this.yMesh();
      this.yEdgeMesh();
    }

    // z
    if (Is.not.exist(ScaleGizmo.__zCubeEntity)) {
      this.zMesh();
      this.zEdgeMesh();
    }

    // xy Plane
    if (Is.not.exist(ScaleGizmo.__xyPlaneEntity)) {
      this.xyPlane();
    }

    // yz Plane
    if (Is.not.exist(ScaleGizmo.__yzPlaneEntity)) {
      this.yzPlane();
    }

    // zx Plane
    if (Is.not.exist(ScaleGizmo.__zxPlaneEntity)) {
      this.zxPlane();
    }

    if (Is.not.exist(ScaleGizmo.__groupEntity)) {
      ScaleGizmo.__groupEntity = createGroupEntity(this.__engine);
    }

    this.__topEntity!.getSceneGraph().addChild(ScaleGizmo.__groupEntity.getSceneGraph());

    ScaleGizmo.__groupEntity.getSceneGraph().addChild(ScaleGizmo.__xCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity.getSceneGraph().addChild(ScaleGizmo.__yCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity.getSceneGraph().addChild(ScaleGizmo.__zCubeEntity.getSceneGraph());
    // ScaleGizmo.__groupEntity
    //   .getSceneGraph()
    //   .addChild(ScaleGizmo.__xEdgeCubeEntity.getSceneGraph());
    // ScaleGizmo.__groupEntity
    //   .getSceneGraph()
    //   .addChild(ScaleGizmo.__yEdgeCubeEntity.getSceneGraph());
    // ScaleGizmo.__groupEntity
    //   .getSceneGraph()
    //   .addChild(ScaleGizmo.__zEdgeCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity.getSceneGraph().addChild(ScaleGizmo.__xyPlaneEntity.getSceneGraph());
    ScaleGizmo.__groupEntity.getSceneGraph().addChild(ScaleGizmo.__yzPlaneEntity.getSceneGraph());
    ScaleGizmo.__groupEntity.getSceneGraph().addChild(ScaleGizmo.__zxPlaneEntity.getSceneGraph());

    ScaleGizmo.__latestTargetEntity = this.__target;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Scale' });
  }

  /**
   * Creates the ZX plane entity for plane-based scaling operations
   * @private
   */
  private zxPlane() {
    ScaleGizmo.__zxPlaneEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_zxPlane', true);
    ScaleGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
    // TranslationGizmo.__zxPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    // TranslationGizmo.__zxPlaneEntity.getTransform().localEulerAngles =
    // Vector3.fromCopy3(90, 0, 0);
    ScaleGizmo.__zxPlaneMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    ScaleGizmo.__zxPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0.5, 0, 0]));
    ScaleGizmo.__zxPlaneMaterial.alphaMode = AlphaMode.Blend;
    ScaleGizmo.__zxPlaneMesh = new Mesh(this.__engine);
    ScaleGizmo.__zxPlanePrimitive = new Plane(this.__engine);
    ScaleGizmo.__zxPlanePrimitive.generate({
      width: 100000,
      height: 100000,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: ScaleGizmo.__zxPlaneMaterial,
    });
    ScaleGizmo.__zxPlaneMesh.addPrimitive(ScaleGizmo.__zxPlanePrimitive);
    ScaleGizmo.__zxPlaneEntity.getMesh().setMesh(ScaleGizmo.__zxPlaneMesh);
  }

  /**
   * Creates the YZ plane entity for plane-based scaling operations
   * @private
   */
  private yzPlane() {
    ScaleGizmo.__yzPlaneEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_yzPlane', true);
    ScaleGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
    // TranslationGizmo.__yzPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    ScaleGizmo.__yzPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(0, 0, MathUtil.degreeToRadian(90));
    ScaleGizmo.__yzPlaneMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    ScaleGizmo.__yzPlaneMaterial.alphaMode = AlphaMode.Blend;
    ScaleGizmo.__yzPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0.5, 0, 0, 0]));
    ScaleGizmo.__yzPlaneMesh = new Mesh(this.__engine);
    ScaleGizmo.__yzPlanePrimitive = new Plane(this.__engine);
    ScaleGizmo.__yzPlanePrimitive.generate({
      width: 100000,
      height: 100000,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: ScaleGizmo.__yzPlaneMaterial,
    });
    ScaleGizmo.__yzPlaneMesh.addPrimitive(ScaleGizmo.__yzPlanePrimitive);
    ScaleGizmo.__yzPlaneEntity.getMesh().setMesh(ScaleGizmo.__yzPlaneMesh);
  }

  /**
   * Creates the XY plane entity for plane-based scaling operations
   * @private
   */
  private xyPlane() {
    ScaleGizmo.__xyPlaneEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_xyPlane', true);
    ScaleGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
    // TranslationGizmo.__xyPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    ScaleGizmo.__xyPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(MathUtil.degreeToRadian(90), 0, 0);
    ScaleGizmo.__xyPlaneMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    ScaleGizmo.__xyPlaneMaterial.alphaMode = AlphaMode.Blend;
    ScaleGizmo.__xyPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0, 0.5, 0]));
    ScaleGizmo.__xyPlaneMesh = new Mesh(this.__engine);
    ScaleGizmo.__xyPlanePrimitive = new Plane(this.__engine);
    ScaleGizmo.__xyPlanePrimitive.generate({
      width: 100000,
      height: 100000,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: true,
      flipTextureCoordinateY: false,
      material: ScaleGizmo.__xyPlaneMaterial,
    });
    ScaleGizmo.__xyPlaneMesh.addPrimitive(ScaleGizmo.__xyPlanePrimitive);
    ScaleGizmo.__xyPlaneEntity.getMesh().setMesh(ScaleGizmo.__xyPlaneMesh);
  }

  /**
   * Creates the Z-axis scaling handle mesh and entity
   * @private
   */
  private zMesh() {
    ScaleGizmo.__zCubeEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_zCube', true);
    ScaleGizmo.__zCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
    ScaleGizmo.__zCubeMesh = new Mesh(this.__engine);
    ScaleGizmo.__zCubeMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    ScaleGizmo.__zCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0, 1, 1]));
    ScaleGizmo.__zCubePrimitive = new Cube(this.__engine);
    ScaleGizmo.__zCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 0.05, 1),
      material: ScaleGizmo.__zCubeMaterial,
    });
    ScaleGizmo.__zCubeMesh.addPrimitive(ScaleGizmo.__zCubePrimitive);
    ScaleGizmo.__zCubeEntity.getMesh().setMesh(ScaleGizmo.__zCubeMesh);
  }

  /**
   * Creates the Y-axis scaling handle mesh and entity
   * @private
   */
  private yMesh() {
    ScaleGizmo.__yCubeEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_yCube', true);
    ScaleGizmo.__yCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
    ScaleGizmo.__yCubeMesh = new Mesh(this.__engine);
    ScaleGizmo.__yCubeMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    ScaleGizmo.__yCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 1, 0, 1]));
    ScaleGizmo.__yCubePrimitive = new Cube(this.__engine);
    ScaleGizmo.__yCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 1, 0.05),
      material: ScaleGizmo.__yCubeMaterial,
    });
    ScaleGizmo.__yCubeMesh.addPrimitive(ScaleGizmo.__yCubePrimitive);
    ScaleGizmo.__yCubeEntity.getMesh().setMesh(ScaleGizmo.__yCubeMesh);
  }

  /**
   * Creates the X-axis scaling handle mesh and entity
   * @private
   */
  private xMesh() {
    ScaleGizmo.__xCubeEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_xCube', true);
    ScaleGizmo.__xCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
    ScaleGizmo.__xCubeMesh = new Mesh(this.__engine);
    ScaleGizmo.__xCubeMaterial = MaterialHelper.createClassicUberMaterial(this.__engine);
    ScaleGizmo.__xCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([1, 0, 0, 1]));
    ScaleGizmo.__xCubePrimitive = new Cube(this.__engine);
    ScaleGizmo.__xCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(1, 0.05, 0.05),
      material: ScaleGizmo.__xCubeMaterial,
    });
    ScaleGizmo.__xCubeMesh.addPrimitive(ScaleGizmo.__xCubePrimitive);
    ScaleGizmo.__xCubeEntity.getMesh().setMesh(ScaleGizmo.__xCubeMesh);
  }

  /**
   * Creates the X-axis edge cube for enhanced visual feedback
   * @private
   */
  private xEdgeMesh() {
    ScaleGizmo.__xEdgeCubeEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__xEdgeCubeEntity.tryToSetUniqueName('ScaleGizmo_xEdgeCube', true);
    ScaleGizmo.__xEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
    ScaleGizmo.__xEdgeCubeMesh = new Mesh(this.__engine);
    ScaleGizmo.__xEdgeCubePrimitive = new Cube(this.__engine);
    ScaleGizmo.__xEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: ScaleGizmo.__xCubeMaterial,
    });
    ScaleGizmo.__xEdgeCubeMesh.addPrimitive(ScaleGizmo.__xEdgeCubePrimitive);
    ScaleGizmo.__xEdgeCubeEntity.getMesh().setMesh(ScaleGizmo.__xEdgeCubeMesh);

    ScaleGizmo.__xCubeEntity.addChild(ScaleGizmo.__xEdgeCubeEntity.getSceneGraph());
  }

  /**
   * Creates the Y-axis edge cube for enhanced visual feedback
   * @private
   */
  private yEdgeMesh() {
    ScaleGizmo.__yEdgeCubeEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__yEdgeCubeEntity.tryToSetUniqueName('ScaleGizmo_yEdgeCube', true);
    ScaleGizmo.__yEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
    ScaleGizmo.__yEdgeCubeMesh = new Mesh(this.__engine);
    ScaleGizmo.__yEdgeCubePrimitive = new Cube(this.__engine);
    ScaleGizmo.__yEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: ScaleGizmo.__yCubeMaterial,
    });
    ScaleGizmo.__yEdgeCubeMesh.addPrimitive(ScaleGizmo.__yEdgeCubePrimitive);
    ScaleGizmo.__yEdgeCubeEntity.getMesh().setMesh(ScaleGizmo.__yEdgeCubeMesh);

    ScaleGizmo.__yCubeEntity.addChild(ScaleGizmo.__yEdgeCubeEntity.getSceneGraph());
  }

  /**
   * Creates the Z-axis edge cube for enhanced visual feedback
   * @private
   */
  private zEdgeMesh() {
    ScaleGizmo.__zEdgeCubeEntity = createMeshEntity(this.__engine);
    ScaleGizmo.__zEdgeCubeEntity.tryToSetUniqueName('ScaleGizmo_zEdgeCube', true);
    ScaleGizmo.__zEdgeCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
    ScaleGizmo.__zEdgeCubeMesh = new Mesh(this.__engine);
    ScaleGizmo.__zEdgeCubePrimitive = new Cube(this.__engine);
    ScaleGizmo.__zEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.15, 0.15, 0.15),
      material: ScaleGizmo.__zCubeMaterial,
    });
    ScaleGizmo.__zEdgeCubeMesh.addPrimitive(ScaleGizmo.__zEdgeCubePrimitive);
    ScaleGizmo.__zEdgeCubeEntity.getMesh().setMesh(ScaleGizmo.__zEdgeCubeMesh);

    ScaleGizmo.__zCubeEntity.addChild(ScaleGizmo.__zEdgeCubeEntity.getSceneGraph());
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
    evt.preventDefault();
    this.__isPointerDown = true;
    ScaleGizmo.__activeAxis = 'none';
    ScaleGizmo.__originalX = evt.clientX;
    ScaleGizmo.__originalY = evt.clientY;

    // InputManager.enableCameraController();

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
      Logger.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      ScaleGizmo.__activeAxis = 'x';
      axisPicked = true;
    }
    if (yResult.result) {
      assertExist(yResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(yResult.data.position.clone());
      Logger.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      ScaleGizmo.__activeAxis = 'y';
      axisPicked = true;
    }
    if (zResult.result) {
      assertExist(zResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(zResult.data.position.clone());
      Logger.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      ScaleGizmo.__activeAxis = 'z';
      axisPicked = true;
    }

    if (ScaleGizmo.__activeAxis === 'none' || axisPicked === false) {
      this.__isPointerDown = false;
      return;
    }

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
    const scaleVec = Vector3.one(); //this.__target.getSceneGraph().worldMatrix.getScale();
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
      const xResult = ScaleGizmo.__xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (xResult.result) {
        assertExist(xResult.data);
        const position = rotMat.multiplyVector(xResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(position.x, pickInMovingPoint.y, pickInMovingPoint.z);
        // pickInMovingPoint = Vector3.fromCopy3(xResult.data.position.x, pickInMovingPoint.y, pickInMovingPoint.z);
        Logger.debug(`Move:${xResult.data.position.toStringApproximately()}`);
      }
    }
    if (ScaleGizmo.__activeAxis === 'y') {
      const yResult = ScaleGizmo.__xyPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (yResult.result) {
        assertExist(yResult.data);
        const position = rotMat.multiplyVector(yResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, position.y, pickInMovingPoint.z);
        // pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, yResult.data.position.y, pickInMovingPoint.z);
        Logger.debug(`Move:${yResult.data.position.toStringApproximately()}`);
      }
    }
    if (ScaleGizmo.__activeAxis === 'z') {
      const zResult = ScaleGizmo.__yzPlaneEntity.getMesh().castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (zResult.result) {
        assertExist(zResult.data);
        const position = rotMat.multiplyVector(zResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, position.z);
        // pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, zResult.data.position.z);
        Logger.debug(`Move:${zResult.data.position.toStringApproximately()}`);
      }
    }

    const sg = this.__target.getSceneGraph()!;
    const aabb = sg.worldMergedAABBWithSkeletal;
    const deltaVector3 = Vector3.multiply(
      Vector3.subtract(pickInMovingPoint, this.__pickStatedPoint),
      1 / aabb.lengthCenterToCorner
    );

    Logger.debug(`${this.__target.uniqueName}: ${deltaVector3.toStringApproximately()}`);

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

      // const parent = this.__target.getSceneGraph();
      // let worldMatrix = Matrix44.identity();
      // if (Is.exist(parent)) {
      //   worldMatrix = parent.worldMatrix.getRotate();
      // }

      // const scaleVec = Vector3.one();
      // let rotMat = Matrix33.fromCopy9RowMajor(
      //   scaleVec.x * worldMatrix.m00,
      //   scaleVec.x * worldMatrix.m01,
      //   scaleVec.x * worldMatrix.m02,
      //   scaleVec.y * worldMatrix.m10,
      //   scaleVec.y * worldMatrix.m11,
      //   scaleVec.y * worldMatrix.m12,
      //   scaleVec.z * worldMatrix.m20,
      //   scaleVec.z * worldMatrix.m21,
      //   scaleVec.z * worldMatrix.m22
      // );
      // rotMat = Matrix33.transpose(rotMat);
      // const deltaDeltaVector3 = Vector3.add(
      //   this.__targetScaleBackup,
      //   rotMat.multiplyVector(deltaVector3),
      // );
      // this.__deltaPoint = deltaDeltaVector3;
      // this.__deltaPoint = Vector3.fromCopy3(
      //   Math.max(this.__deltaPoint.x, 0.01),
      //   Math.max(this.__deltaPoint.y, 0.01),
      //   Math.max(this.__deltaPoint.z, 0.01)
      // );
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
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(engine)
    ) as CameraComponent | undefined;
    const result = ScaleGizmo.__groupEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0, []);
    return result;
  }

  /**
   * Performs ray casting against individual axis entities to determine interaction
   * @param evt - The pointer event containing screen coordinates
   * @returns Object containing ray casting results for X, Y, and Z axes
   * @private
   */
  private static castRay(engine: Engine, evt: PointerEvent) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(engine)
    ) as CameraComponent | undefined;
    const xResult = ScaleGizmo.__xCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0);
    const yResult = ScaleGizmo.__yCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0);
    const zResult = ScaleGizmo.__zCubeEntity.getSceneGraph().castRayFromScreen(x, y, activeCamera!, viewport, 0.0);
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
}
