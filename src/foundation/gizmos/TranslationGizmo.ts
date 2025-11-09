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
import type { RaycastResultEx1 } from '../geometry/types/GeometryTypes';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { MeshHelper } from '../helpers/MeshHelper';
import type { Material } from '../materials/core/Material';
import type { IMatrix44 } from '../math/IMatrix';
import type { IQuaternion } from '../math/IQuaternion';
import { MathUtil } from '../math/MathUtil';
import { Matrix33 } from '../math/Matrix33';
import { Matrix44 } from '../math/Matrix44';
import { MutableMatrix33 } from '../math/MutableMatrix33';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { assertExist } from '../misc/MiscUtil';
import { INPUT_HANDLING_STATE_GIZMO_TRANSLATION, InputManager, getEvent } from '../system/InputManager';
import { Gizmo } from './Gizmo';

declare let window: any;

/**
 * Translation Gizmo class
 * Provides an interactive 3D translation gizmo for manipulating object positions in 3D space.
 * The gizmo displays colored axes (red for X, green for Y, blue for Z) that can be dragged
 * to translate objects along specific axes or planes.
 */
export class TranslationGizmo extends Gizmo {
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
  private static __xCubeMaterial: Material;
  private static __yCubeMaterial: Material;
  private static __zCubeMaterial: Material;
  private static __xConeEntity: IMeshEntity;
  private static __yConeEntity: IMeshEntity;
  private static __zConeEntity: IMeshEntity;
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
  private __deltaPoint = Vector3.zero();
  private __targetPointBackup = Vector3.zero();
  private __isPointerDown = false;
  private static __activeAxis: 'none' | 'x' | 'y' | 'z' = 'none';
  private static __space: 'local' | 'world' = 'world';
  private __latestTargetEntity?: ISceneGraphEntity;
  private __onPointerDownFunc = this.__onPointerDown.bind(this);
  private __onPointerMoveFunc = this.__onPointerMove.bind(this);
  private __onPointerUpFunc = this.__onPointerUp.bind(this);
  private __isCameraControllerDisabled = false;

  private static __length = 1;

  ///
  ///
  /// Accessors
  ///
  ///

  /**
   * Indicates whether the gizmo has been properly set up and initialized.
   * @returns True if the gizmo is set up and ready to use, false otherwise
   */
  get isSetup(): boolean {
    if (this.__topEntity != null) {
      return true;
    }
    return false;
  }

  /**
   * Sets the length/scale of the gizmo axes.
   * @param val - The length value for the gizmo axes
   */
  set length(val: number) {
    TranslationGizmo.__length = val;
  }

  /**
   * Gets the current length/scale of the gizmo axes.
   * @returns The current length value of the gizmo axes
   */
  get length(): number {
    return TranslationGizmo.__length;
  }

  /**
   * Sets the visibility of the gizmo and manages input event registration.
   * When set to visible, registers pointer event handlers and adds the gizmo to the scene.
   * When set to invisible, unregisters events and resets gizmo state.
   * @param flg - True to show the gizmo, false to hide it
   */
  set isVisible(flg: boolean) {
    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(Config.eventTargetDom)) {
        eventTargetDom = Config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_TRANSLATION, [
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
      this.__topEntity!.getSceneGraph().addChild(TranslationGizmo.__groupEntity.getSceneGraph());
      this.__latestTargetEntity = this.__target;
      if (TranslationGizmo.__space === 'local') {
        const parent = this.__target.getSceneGraph().parent;
        let quaternion: IQuaternion = Quaternion.identity();
        if (Is.exist(parent)) {
          quaternion = parent.getQuaternionRecursively();
        }
        TranslationGizmo.__groupEntity.getTransform().localRotation = quaternion;
      } else if (TranslationGizmo.__space === 'world') {
        TranslationGizmo.__groupEntity.getTransform().localRotation = Quaternion.fromCopy4(0, 0, 0, 1);
      }
    }

    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_TRANSLATION);
      this.__deltaPoint = this.__target.getTransform().localPosition;
      this.__pickStatedPoint = Vector3.zero();
      this.__isPointerDown = false;
      this.__targetPointBackup = this.__target.getTransform().localPosition;
      TranslationGizmo.__activeAxis = 'none';
    }

    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_TRANSLATION, flg);

    this.__setVisible(flg);
    TranslationGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
    TranslationGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
    TranslationGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
  }

  /**
   * Sets the coordinate space for gizmo operations.
   * @param space - Either 'local' for object-relative coordinates or 'world' for global coordinates
   */
  setSpace(space: 'local' | 'world') {
    TranslationGizmo.__space = space;
    if (this.__isVisible) {
      this.isVisible = false;
      this.isVisible = true;
    }
  }

  /**
   * Gets the current visibility state of the gizmo.
   * @returns True if the gizmo is currently visible, false otherwise
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
   * Sets up the gizmo entities and geometry if not already initialized.
   * Creates the visual components (cubes for axes, planes for multi-axis movement)
   * and configures their materials, positioning, and hierarchy.
   * @internal
   */
  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    this.__topEntity = createGroupEntity();
    this.__topEntity!.tryToSetUniqueName(`TranslationGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity!.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;

    // add this topEntity to the target as gizmo
    this.__target.getSceneGraph()._addGizmoChild(this.__topEntity!.getSceneGraph());

    // setup the mesh
    const coneRadius = 0.08;
    const coneHeight = 0.3;
    const coneSegments = 16;
    // x
    if (Is.not.exist(TranslationGizmo.__xCubeEntity)) {
      TranslationGizmo.__xCubeEntity = createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName('TranslationGizmo_xCube', true);
      TranslationGizmo.__xCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
      TranslationGizmo.__xCubeMesh = new Mesh();
      TranslationGizmo.__xCubeMaterial = MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__xCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([1, 0, 0, 1]));
      TranslationGizmo.__xCubePrimitive = new Cube();
      TranslationGizmo.__xCubePrimitive.generate({
        widthVector: Vector3.fromCopy3(1, 0.05, 0.05),
        material: TranslationGizmo.__xCubeMaterial,
      });
      TranslationGizmo.__xCubeMesh.addPrimitive(TranslationGizmo.__xCubePrimitive);
      TranslationGizmo.__xCubeEntity.getMesh().setMesh(TranslationGizmo.__xCubeMesh);
    }

    // y
    if (Is.not.exist(TranslationGizmo.__yCubeEntity)) {
      TranslationGizmo.__yCubeEntity = createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName('TranslationGizmo_yCube', true);
      TranslationGizmo.__yCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0.5, 0);
      TranslationGizmo.__yCubeMesh = new Mesh();
      TranslationGizmo.__yCubeMaterial = MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__yCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 1, 0, 1]));
      TranslationGizmo.__yCubePrimitive = new Cube();
      TranslationGizmo.__yCubePrimitive.generate({
        widthVector: Vector3.fromCopy3(0.05, 1, 0.05),
        material: TranslationGizmo.__yCubeMaterial,
      });
      TranslationGizmo.__yCubeMesh.addPrimitive(TranslationGizmo.__yCubePrimitive);
      TranslationGizmo.__yCubeEntity.getMesh().setMesh(TranslationGizmo.__yCubeMesh);
    }

    // z
    if (Is.not.exist(TranslationGizmo.__zCubeEntity)) {
      TranslationGizmo.__zCubeEntity = createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName('TranslationGizmo_zCube', true);
      TranslationGizmo.__zCubeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 0.5);
      TranslationGizmo.__zCubeMesh = new Mesh();
      TranslationGizmo.__zCubeMaterial = MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__zCubeMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0, 1, 1]));
      TranslationGizmo.__zCubePrimitive = new Cube();
      TranslationGizmo.__zCubePrimitive.generate({
        widthVector: Vector3.fromCopy3(0.05, 0.05, 1),
        material: TranslationGizmo.__zCubeMaterial,
      });
      TranslationGizmo.__zCubeMesh.addPrimitive(TranslationGizmo.__zCubePrimitive);
      TranslationGizmo.__zCubeEntity.getMesh().setMesh(TranslationGizmo.__zCubeMesh);
    }

    // x Cone
    if (Is.not.exist(TranslationGizmo.__xConeEntity)) {
      TranslationGizmo.__xConeEntity = MeshHelper.createCone({
        radius: coneRadius,
        height: coneHeight,
        radialSegments: coneSegments,
        material: TranslationGizmo.__xCubeMaterial,
      });
      TranslationGizmo.__xConeEntity.tryToSetUniqueName('TranslationGizmo_xCone', true);
      TranslationGizmo.__xConeEntity.getTransform().localPosition = Vector3.fromCopy3(1, 0, 0);
      TranslationGizmo.__xConeEntity.getTransform().localEulerAngles = Vector3.fromCopy3(
        0,
        0,
        -MathUtil.degreeToRadian(90)
      );
    }

    // y Cone
    if (Is.not.exist(TranslationGizmo.__yConeEntity)) {
      TranslationGizmo.__yConeEntity = MeshHelper.createCone({
        radius: coneRadius,
        height: coneHeight,
        radialSegments: coneSegments,
        material: TranslationGizmo.__yCubeMaterial,
      });
      TranslationGizmo.__yConeEntity.tryToSetUniqueName('TranslationGizmo_yCone', true);
      TranslationGizmo.__yConeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 1, 0);
    }

    // z Cone
    if (Is.not.exist(TranslationGizmo.__zConeEntity)) {
      TranslationGizmo.__zConeEntity = MeshHelper.createCone({
        radius: coneRadius,
        height: coneHeight,
        radialSegments: coneSegments,
        material: TranslationGizmo.__zCubeMaterial,
      });
      TranslationGizmo.__zConeEntity.tryToSetUniqueName('TranslationGizmo_zCone', true);
      TranslationGizmo.__zConeEntity.getTransform().localPosition = Vector3.fromCopy3(0, 0, 1);
      TranslationGizmo.__zConeEntity.getTransform().localEulerAngles = Vector3.fromCopy3(
        MathUtil.degreeToRadian(90),
        0,
        0
      );
    }

    // xy Plane
    if (Is.not.exist(TranslationGizmo.__xyPlaneEntity)) {
      TranslationGizmo.__xyPlaneEntity = createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName('TranslationGizmo_xyPlane', true);
      TranslationGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
      // TranslationGizmo.__xyPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
      TranslationGizmo.__xyPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(
        MathUtil.degreeToRadian(90),
        0,
        0
      );
      TranslationGizmo.__xyPlaneMaterial = MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__xyPlaneMaterial.alphaMode = AlphaMode.Blend;
      TranslationGizmo.__xyPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0, 0.5, 0]));
      TranslationGizmo.__xyPlaneMesh = new Mesh();
      TranslationGizmo.__xyPlanePrimitive = new Plane();
      TranslationGizmo.__xyPlanePrimitive.generate({
        width: 100000,
        height: 100000,
        uSpan: 1,
        vSpan: 1,
        isUVRepeat: true,
        flipTextureCoordinateY: false,
        material: TranslationGizmo.__xyPlaneMaterial,
      });
      TranslationGizmo.__xyPlaneMesh.addPrimitive(TranslationGizmo.__xyPlanePrimitive);
      TranslationGizmo.__xyPlaneEntity.getMesh().setMesh(TranslationGizmo.__xyPlaneMesh);
    }

    // yz Plane
    if (Is.not.exist(TranslationGizmo.__yzPlaneEntity)) {
      TranslationGizmo.__yzPlaneEntity = createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName('TranslationGizmo_yzPlane', true);
      TranslationGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
      // TranslationGizmo.__yzPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
      TranslationGizmo.__yzPlaneEntity.getTransform().localEulerAngles = Vector3.fromCopy3(
        0,
        0,
        MathUtil.degreeToRadian(90)
      );
      TranslationGizmo.__yzPlaneMaterial = MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__yzPlaneMaterial.alphaMode = AlphaMode.Blend;
      TranslationGizmo.__yzPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0.5, 0, 0, 0]));
      TranslationGizmo.__yzPlaneMesh = new Mesh();
      TranslationGizmo.__yzPlanePrimitive = new Plane();
      TranslationGizmo.__yzPlanePrimitive.generate({
        width: 100000,
        height: 100000,
        uSpan: 1,
        vSpan: 1,
        isUVRepeat: true,
        flipTextureCoordinateY: false,
        material: TranslationGizmo.__yzPlaneMaterial,
      });
      TranslationGizmo.__yzPlaneMesh.addPrimitive(TranslationGizmo.__yzPlanePrimitive);
      TranslationGizmo.__yzPlaneEntity.getMesh().setMesh(TranslationGizmo.__yzPlaneMesh);
    }

    // zx Plane
    if (Is.not.exist(TranslationGizmo.__zxPlaneEntity)) {
      TranslationGizmo.__zxPlaneEntity = createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName('TranslationGizmo_zxPlane', true);
      TranslationGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
      // Vector3.fromCopy3(90, 0, 0);
      TranslationGizmo.__zxPlaneMaterial = MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__zxPlaneMaterial.setParameter('diffuseColorFactor', Vector4.fromCopyArray4([0, 0.5, 0, 0]));
      TranslationGizmo.__zxPlaneMaterial.alphaMode = AlphaMode.Blend;
      TranslationGizmo.__zxPlaneMesh = new Mesh();
      TranslationGizmo.__zxPlanePrimitive = new Plane();
      TranslationGizmo.__zxPlanePrimitive.generate({
        width: 100000,
        height: 100000,
        uSpan: 1,
        vSpan: 1,
        isUVRepeat: true,
        flipTextureCoordinateY: false,
        material: TranslationGizmo.__zxPlaneMaterial,
      });
      TranslationGizmo.__zxPlaneMesh.addPrimitive(TranslationGizmo.__zxPlanePrimitive);
      TranslationGizmo.__zxPlaneEntity.getMesh().setMesh(TranslationGizmo.__zxPlaneMesh);
    }

    if (Is.not.exist(TranslationGizmo.__groupEntity)) {
      TranslationGizmo.__groupEntity = createGroupEntity();
    }

    this.__topEntity!.getSceneGraph().addChild(TranslationGizmo.__groupEntity.getSceneGraph());

    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__xCubeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__yCubeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__zCubeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__xConeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__yConeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__zConeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__xyPlaneEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__yzPlaneEntity.getSceneGraph());
    TranslationGizmo.__groupEntity.getSceneGraph().addChild(TranslationGizmo.__zxPlaneEntity.getSceneGraph());

    this.__latestTargetEntity = this.__target;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Translation' });
  }

  /**
   * Updates the gizmo's transform and visual state each frame.
   * Positions the gizmo at the target's location, scales it appropriately,
   * and applies any ongoing translation operations.
   * @internal
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
      if (this.__latestTargetEntity === this.__target) {
        this.__target.getTransform().localPosition = this.__deltaPoint.clone();
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
  private static __generatePrimitive(): Primitive {
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

    const primitive = Primitive.createPrimitive({
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Color0.XYZ],
      attributes: [positions, color],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
  }

  /**
   * Handles pointer down events for starting gizmo interaction.
   * Determines which axis was clicked, sets up the initial state for dragging,
   * and configures the coordinate space transformation matrices.
   * @param evt - The pointer event containing click information
   */
  private __onPointerDown(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = true;
    TranslationGizmo.__activeAxis = 'none';
    TranslationGizmo.__originalX = evt.clientX;
    TranslationGizmo.__originalY = evt.clientY;

    const parent = this.__target.getSceneGraph().parent;
    let worldMatrix: IMatrix44 = Matrix44.identity();
    if (Is.exist(parent)) {
      worldMatrix = parent.matrixInner.getRotate();
    }
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

    if (TranslationGizmo.__space === 'local') {
      rotMat = Matrix33.transpose(rotMat) as Matrix33;
    } else if (TranslationGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }

    const { xResult, yResult, zResult } = TranslationGizmo.castRay(evt);
    let axisPicked = false;
    if (xResult.result) {
      assertExist(xResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(xResult.data.position.clone());
      Logger.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      TranslationGizmo.__activeAxis = 'x';
      axisPicked = true;
    }
    if (yResult.result) {
      assertExist(yResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(yResult.data.position.clone());
      Logger.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      TranslationGizmo.__activeAxis = 'y';
      axisPicked = true;
    }
    if (zResult.result) {
      assertExist(zResult.data);
      this.__pickStatedPoint = rotMat.multiplyVector(zResult.data.position.clone());
      Logger.debug(`Down:${this.__pickStatedPoint.toStringApproximately()}`);
      TranslationGizmo.__activeAxis = 'z';
      axisPicked = true;
    }

    if (TranslationGizmo.__activeAxis === 'none' || axisPicked === false) {
      this.__isPointerDown = false;
      return;
    }

    this.__disableCameraController();

    if (this.__latestTargetEntity === this.__target) {
      this.__targetPointBackup = this.__target.getTransform().localPosition;
    }
  }

  /**
   * Handles pointer move events during gizmo interaction.
   * Calculates the translation delta based on mouse movement and the active axis,
   * performs coordinate space transformations, and updates the target object's position.
   * @param evt - The pointer event containing movement information
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
    const activeCamera = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as
      | CameraComponent
      | undefined;

    const parent = this.__target.getSceneGraph().parent;
    let worldMatrix: IMatrix44 = Matrix44.identity();
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
    if (TranslationGizmo.__space === 'local') {
      rotMat = Matrix33.transpose(rotMat) as Matrix33;
    } else if (TranslationGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }
    let pickInMovingPoint: Vector3 = this.__pickStatedPoint.clone();
    if (TranslationGizmo.__activeAxis === 'x') {
      const xResult = TranslationGizmo.__xyPlaneEntity
        .getMesh()
        .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (xResult.result) {
        assertExist(xResult.data);
        const position = rotMat.multiplyVector(xResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(position.x, pickInMovingPoint.y, pickInMovingPoint.z);
        // console.log('Move:' + xResult.data.position.toStringApproximately());
      }
    }
    if (TranslationGizmo.__activeAxis === 'y') {
      const yResult = TranslationGizmo.__xyPlaneEntity
        .getMesh()
        .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (yResult.result) {
        assertExist(yResult.data);
        const position = rotMat.multiplyVector(yResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, position.y, pickInMovingPoint.z);
        // console.log('Move:' + yResult.data.position.toStringApproximately());
      }
    }
    if (TranslationGizmo.__activeAxis === 'z') {
      const zResult = TranslationGizmo.__yzPlaneEntity
        .getMesh()
        .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (zResult.result) {
        assertExist(zResult.data);
        const position = rotMat.multiplyVector(zResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, position.z);
        // console.log('Move:' + zResult.data.position.toStringApproximately());
      }
    }

    const deltaVector3 = Vector3.subtract(pickInMovingPoint, this.__pickStatedPoint);

    if (deltaVector3.length() === 0) {
      return;
    }

    Logger.debug(`${this.__target.uniqueName}: ${deltaVector3.toStringApproximately()}`);

    if (TranslationGizmo.__space === 'local') {
      this.__deltaPoint = Vector3.add(deltaVector3, this.__targetPointBackup);
    } else if (TranslationGizmo.__space === 'world') {
      const parent = this.__target.getSceneGraph().parent;
      let deltaInLocal = deltaVector3;
      if (Is.exist(parent)) {
        const parentRotation = parent.getQuaternionRecursively();
        const inverseParentRotation = Quaternion.invert(parentRotation);
        deltaInLocal = inverseParentRotation.transformVector3(deltaVector3);
      }
      this.__deltaPoint = Vector3.add(this.__targetPointBackup, deltaInLocal);
    }

    this._update();
  }

  /**
   * Handles pointer up events to end gizmo interaction.
   * Resets the gizmo state, re-enables camera controls, and finalizes
   * the translation operation.
   * @param evt - The pointer event containing release information
   */
  private __onPointerUp(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = false;
    TranslationGizmo.__activeAxis = 'none';
    this.__enableCameraControllerIfNeeded();

    if (this.__latestTargetEntity === this.__target) {
      this.__targetPointBackup = this.__target.getTransform().localPosition;
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
   * Performs ray casting against the entire gizmo group entity.
   * Used for general intersection testing with the gizmo.
   * @param evt - The pointer event to cast a ray from
   * @returns Ray casting result containing intersection information
   */
  private static castRay2(evt: PointerEvent) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as
      | CameraComponent
      | undefined;
    const result = TranslationGizmo.__groupEntity
      .getSceneGraph()
      .castRayFromScreen(x, y, activeCamera!, viewport, 0.0, []);
    return result;
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

  /**
   * Performs ray casting against individual gizmo axis entities.
   * Tests intersection with X, Y, and Z axis cubes separately to determine
   * which axis was clicked for translation.
   * @param evt - The pointer event to cast a ray from
   * @returns Object containing ray casting results for each axis (xResult, yResult, zResult)
   */
  private static castRay(evt: PointerEvent) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(CameraComponent, CameraComponent.current) as
      | CameraComponent
      | undefined;
    const xResult = TranslationGizmo.__castFromEntities(
      x,
      y,
      activeCamera!,
      viewport,
      TranslationGizmo.__xCubeEntity,
      TranslationGizmo.__xConeEntity
    );
    const yResult = TranslationGizmo.__castFromEntities(
      x,
      y,
      activeCamera!,
      viewport,
      TranslationGizmo.__yCubeEntity,
      TranslationGizmo.__yConeEntity
    );
    const zResult = TranslationGizmo.__castFromEntities(
      x,
      y,
      activeCamera!,
      viewport,
      TranslationGizmo.__zCubeEntity,
      TranslationGizmo.__zConeEntity
    );
    return { xResult, yResult, zResult };
  }

  /**
   * Destroys the gizmo and cleans up its resources.
   * Removes the gizmo from the scene and frees associated memory.
   * @internal
   */
  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }
}
