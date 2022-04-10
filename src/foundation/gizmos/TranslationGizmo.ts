import OrbitCameraController from '../cameras/OrbitCameraController';
import CameraComponent from '../components/Camera/CameraComponent';
import { ComponentRepository } from '../core/ComponentRepository';
import Config from '../core/Config';
import {AlphaMode} from '../definitions/AlphaMode';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import {VertexAttribute} from '../definitions/VertexAttribute';
import Mesh from '../geometry/Mesh';
import {Primitive} from '../geometry/Primitive';
import {Cube} from '../geometry/shapes/Cube';
import {Plane} from '../geometry/shapes/Plane';
import EntityHelper, {
  IMeshEntity,
  ISceneGraphEntity,
} from '../helpers/EntityHelper';
import MaterialHelper from '../helpers/MaterialHelper';
import Material from '../materials/core/Material';
import {MathUtil} from '../math/MathUtil';
import Matrix33 from '../math/Matrix33';
import Matrix44 from '../math/Matrix44';
import MutableMatrix33 from '../math/MutableMatrix33';
import Quaternion from '../math/Quaternion';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import {Is} from '../misc/Is';
import {assertExist, MiscUtil} from '../misc/MiscUtil';
import {
  getEvent,
  InputManager,
  INPUT_HANDLING_STATE_GIZMO_TRNSLATION,
} from '../system/InputManager';
import Gizmo from './Gizmo';

declare let window: any;

/**
 * Translation Gizmo class
 */
export default class TranslationGizmo extends Gizmo {
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
  private static __pickStatedPoint = Vector3.zero();
  private static __deltaPoint = Vector3.zero();
  private static __targetPointBackup = Vector3.zero();
  private static __isPointerDown = false;
  private static __activeAxis: 'none' | 'x' | 'y' | 'z' = 'none';
  private static __space: 'local' | 'world' = 'world';
  private static __latestTargetEntity?: ISceneGraphEntity;
  private __onPointerDownFunc = this.__onPointerDown.bind(this);
  private __onPointerMoveFunc = this.__onPointerMove.bind(this);
  private __onPointerUpFunc = this.__onPointerUp.bind(this);

  private static __length = 1;
  /**
   * Constructor
   * @param target the object which this gizmo belong to
   */
  constructor(target: IMeshEntity) {
    super(target);
  }

  ///
  ///
  /// Accessors
  ///
  ///

  get isSetup(): boolean {
    if (this.__topEntity != null) {
      return true;
    } else {
      return false;
    }
  }

  set length(val: number) {
    TranslationGizmo.__length = val;
  }

  get length(): number {
    return TranslationGizmo.__length;
  }

  set isVisible(flg: boolean) {
    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(Config.eventTargetDom)) {
        eventTargetDom = Config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_TRNSLATION, [
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
      this.__topEntity!.getSceneGraph().addChild(
        TranslationGizmo.__groupEntity.getSceneGraph()
      );
      TranslationGizmo.__latestTargetEntity = this.__target;
      if (TranslationGizmo.__space === 'local') {
        TranslationGizmo.__groupEntity.getTransform().quaternion =
          this.__target.getTransform().quaternion;
      } else if (TranslationGizmo.__space === 'world') {
        TranslationGizmo.__groupEntity.getTransform().quaternion =
          new Quaternion(0, 0, 0, 1);
      }
    }

    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_TRNSLATION);
      TranslationGizmo.__deltaPoint = this.__target.getTransform().translate;
      TranslationGizmo.__pickStatedPoint = Vector3.zero();
      TranslationGizmo.__isPointerDown = false;
      TranslationGizmo.__targetPointBackup =
        this.__target.getTransform().translate;
      TranslationGizmo.__activeAxis = 'none';
    }

    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_TRNSLATION, flg);

    this.__setVisible(flg);
    TranslationGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
    TranslationGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
    TranslationGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
  }

  setSpace(space: 'local' | 'world') {
    TranslationGizmo.__space = space;
    if (this.__isVisible) {
      this.isVisible = false;
      this.isVisible = true;
    }
  }

  get isVisible(): boolean {
    return this.__isVisible;
  }

  ///
  ///
  /// Friends Members
  ///
  ///

  /**
   * @private
   * setup entities of Gizmo if not done yet
   */
  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    this.__topEntity = EntityHelper.createMeshEntity();
    this.__topEntity.tryToSetUniqueName(
      `TranslationGizmo_of_${this.__target.uniqueName}`,
      true
    );
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix =
      true;

    // add this topEntity to the target as gizmo
    this.__target
      .getSceneGraph()
      ._addGizmoChild(this.__topEntity.getSceneGraph());

    // setup the mesh
    // x
    if (Is.not.exist(TranslationGizmo.__xCubeEntity)) {
      TranslationGizmo.__xCubeEntity = EntityHelper.createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName(
        'TranslationGizmo_xCube',
        true
      );
      TranslationGizmo.__xCubeEntity.getTransform().translate =
        Vector3.fromCopy3(1, 0, 0);
      TranslationGizmo.__xCubeMesh = new Mesh();
      TranslationGizmo.__xCubeMaterial =
        MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__xCubeMaterial.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4([1, 0, 0, 1])
      );
      TranslationGizmo.__xCubePrimitive = new Cube();
      TranslationGizmo.__xCubePrimitive.generate({
        widthVector: Vector3.fromCopy3(1, 0.05, 0.05),
        material: TranslationGizmo.__xCubeMaterial,
      });
      TranslationGizmo.__xCubeMesh.addPrimitive(
        TranslationGizmo.__xCubePrimitive
      );
      TranslationGizmo.__xCubeEntity
        .getMesh()
        .setMesh(TranslationGizmo.__xCubeMesh);
    }

    // y
    if (Is.not.exist(TranslationGizmo.__yCubeEntity)) {
      TranslationGizmo.__yCubeEntity = EntityHelper.createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName(
        'TranslationGizmo_yCube',
        true
      );
      TranslationGizmo.__yCubeEntity.getTransform().translate =
        Vector3.fromCopy3(0, 1, 0);
      TranslationGizmo.__yCubeMesh = new Mesh();
      TranslationGizmo.__yCubeMaterial =
        MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__yCubeMaterial.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4([0, 1, 0, 1])
      );
      TranslationGizmo.__yCubePrimitive = new Cube();
      TranslationGizmo.__yCubePrimitive.generate({
        widthVector: Vector3.fromCopy3(0.05, 1, 0.05),
        material: TranslationGizmo.__yCubeMaterial,
      });
      TranslationGizmo.__yCubeMesh.addPrimitive(
        TranslationGizmo.__yCubePrimitive
      );
      TranslationGizmo.__yCubeEntity
        .getMesh()
        .setMesh(TranslationGizmo.__yCubeMesh);
    }

    // z
    if (Is.not.exist(TranslationGizmo.__zCubeEntity)) {
      TranslationGizmo.__zCubeEntity = EntityHelper.createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName(
        'TranslationGizmo_zCube',
        true
      );
      TranslationGizmo.__zCubeEntity.getTransform().translate =
        Vector3.fromCopy3(0, 0, 1);
      TranslationGizmo.__zCubeMesh = new Mesh();
      TranslationGizmo.__zCubeMaterial =
        MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__zCubeMaterial.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4([0, 0, 1, 1])
      );
      TranslationGizmo.__zCubePrimitive = new Cube();
      TranslationGizmo.__zCubePrimitive.generate({
        widthVector: Vector3.fromCopy3(0.05, 0.05, 1),
        material: TranslationGizmo.__zCubeMaterial,
      });
      TranslationGizmo.__zCubeMesh.addPrimitive(
        TranslationGizmo.__zCubePrimitive
      );
      TranslationGizmo.__zCubeEntity
        .getMesh()
        .setMesh(TranslationGizmo.__zCubeMesh);
    }

    // xy Plane
    if (Is.not.exist(TranslationGizmo.__xyPlaneEntity)) {
      TranslationGizmo.__xyPlaneEntity = EntityHelper.createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName(
        'TranslationGizmo_xyPlane',
        true
      );
      TranslationGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
      // TranslationGizmo.__xyPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
      TranslationGizmo.__xyPlaneEntity.getTransform().rotate =
        Vector3.fromCopy3(MathUtil.degreeToRadian(90), 0, 0);
      TranslationGizmo.__xyPlaneMaterial =
        MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__xyPlaneMaterial.alphaMode = AlphaMode.Translucent;
      TranslationGizmo.__xyPlaneMaterial.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4([0, 0, 0.5, 0])
      );
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
      TranslationGizmo.__xyPlaneMesh.addPrimitive(
        TranslationGizmo.__xyPlanePrimitive
      );
      TranslationGizmo.__xyPlaneEntity
        .getMesh()
        .setMesh(TranslationGizmo.__xyPlaneMesh);
    }

    // yz Plane
    if (Is.not.exist(TranslationGizmo.__yzPlaneEntity)) {
      TranslationGizmo.__yzPlaneEntity = EntityHelper.createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName(
        'TranslationGizmo_yzPlane',
        true
      );
      TranslationGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
      // TranslationGizmo.__yzPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
      TranslationGizmo.__yzPlaneEntity.getTransform().rotate =
        Vector3.fromCopy3(0, 0, MathUtil.degreeToRadian(90));
      TranslationGizmo.__yzPlaneMaterial =
        MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__yzPlaneMaterial.alphaMode = AlphaMode.Translucent;
      TranslationGizmo.__yzPlaneMaterial.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4([0.5, 0, 0, 0])
      );
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
      TranslationGizmo.__yzPlaneMesh.addPrimitive(
        TranslationGizmo.__yzPlanePrimitive
      );
      TranslationGizmo.__yzPlaneEntity
        .getMesh()
        .setMesh(TranslationGizmo.__yzPlaneMesh);
    }

    // zx Plane
    if (Is.not.exist(TranslationGizmo.__zxPlaneEntity)) {
      TranslationGizmo.__zxPlaneEntity = EntityHelper.createMeshEntity();
      TranslationGizmo.__xCubeEntity.tryToSetUniqueName(
        'TranslationGizmo_zxPlane',
        true
      );
      TranslationGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
      // TranslationGizmo.__zxPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
      // TranslationGizmo.__zxPlaneEntity.getTransform().rotate =
      // Vector3.fromCopy3(90, 0, 0);
      TranslationGizmo.__zxPlaneMaterial =
        MaterialHelper.createClassicUberMaterial();
      TranslationGizmo.__zxPlaneMaterial.setParameter(
        ShaderSemantics.DiffuseColorFactor,
        Vector4.fromCopyArray4([0, 0.5, 0, 0])
      );
      TranslationGizmo.__zxPlaneMaterial.alphaMode = AlphaMode.Translucent;
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
      TranslationGizmo.__zxPlaneMesh.addPrimitive(
        TranslationGizmo.__zxPlanePrimitive
      );
      TranslationGizmo.__zxPlaneEntity
        .getMesh()
        .setMesh(TranslationGizmo.__zxPlaneMesh);
    }

    if (Is.not.exist(TranslationGizmo.__groupEntity)) {
      TranslationGizmo.__groupEntity = EntityHelper.createGroupEntity();
    }

    this.__topEntity!.getSceneGraph().addChild(
      TranslationGizmo.__groupEntity.getSceneGraph()
    );

    TranslationGizmo.__groupEntity
      .getSceneGraph()
      .addChild(TranslationGizmo.__xCubeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity
      .getSceneGraph()
      .addChild(TranslationGizmo.__yCubeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity
      .getSceneGraph()
      .addChild(TranslationGizmo.__zCubeEntity.getSceneGraph());
    TranslationGizmo.__groupEntity
      .getSceneGraph()
      .addChild(TranslationGizmo.__xyPlaneEntity.getSceneGraph());
    TranslationGizmo.__groupEntity
      .getSceneGraph()
      .addChild(TranslationGizmo.__yzPlaneEntity.getSceneGraph());
    TranslationGizmo.__groupEntity
      .getSceneGraph()
      .addChild(TranslationGizmo.__zxPlaneEntity.getSceneGraph());

    TranslationGizmo.__latestTargetEntity = this.__target;

    this.setGizmoTag();
  }

  /**
   * @private
   * update the transform and etc of the gizmo
   */
  _update(): void {
    if (this.__topEntity == null) {
      return;
    }
    const sg = this.__target.getSceneGraph()!;
    const aabb = sg.worldAABB;
    this.__topEntity.getTransform()!.translate = aabb.centerPoint;
    const max = Math.max(aabb.sizeX, aabb.sizeY, aabb.sizeZ);
    this.__topEntity.getTransform()!.scale = Vector3.fromCopyArray([
      Math.min(1, aabb.isVanilla() ? 1 : max / 2),
      Math.min(1, aabb.isVanilla() ? 1 : max / 2),
      Math.min(1, aabb.isVanilla() ? 1 : max / 2),
    ]);

    if (TranslationGizmo.__isPointerDown) {
      if (TranslationGizmo.__latestTargetEntity === this.__target) {
        this.__target.getTransform().translate =
          TranslationGizmo.__deltaPoint.clone();
      }
    }
  }

  ///
  ///
  /// Private Static Members
  ///
  ///

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
      attributeSemantics: [
        VertexAttribute.Position.XYZ,
        VertexAttribute.Color0.XYZ,
      ],
      attributes: [positions, color],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
  }

  private __onPointerDown(evt: PointerEvent) {
    evt.preventDefault();
    TranslationGizmo.__isPointerDown = true;
    TranslationGizmo.__originalX = evt.clientX;
    TranslationGizmo.__originalY = evt.clientY;

    const worldMatrix = this.__target.getSceneGraph().worldMatrix.getRotate();
    const scaleVec = Vector3.one(); //this.__target.getSceneGraph().worldMatrix.getScale();
    let rotMat = new Matrix33(
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
      rotMat = Matrix33.transpose(rotMat);
    } else if (TranslationGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }

    const {xResult, yResult, zResult} = TranslationGizmo.castRay(evt);
    if (xResult.result) {
      assertExist(xResult.data);
      TranslationGizmo.__pickStatedPoint = rotMat.multiplyVector(
        xResult.data.position.clone()
      );
      console.log(
        'Down:' + TranslationGizmo.__pickStatedPoint.toStringApproximately()
      );
      TranslationGizmo.__activeAxis = 'x';
    }
    if (yResult.result) {
      assertExist(yResult.data);
      TranslationGizmo.__pickStatedPoint = rotMat.multiplyVector(
        yResult.data.position.clone()
      );
      console.log(
        'Down:' + TranslationGizmo.__pickStatedPoint.toStringApproximately()
      );
      TranslationGizmo.__activeAxis = 'y';
    }
    if (zResult.result) {
      assertExist(zResult.data);
      TranslationGizmo.__pickStatedPoint = rotMat.multiplyVector(
        zResult.data.position.clone()
      );
      console.log(
        'Down:' + TranslationGizmo.__pickStatedPoint.toStringApproximately()
      );
      TranslationGizmo.__activeAxis = 'z';
    }

    if (TranslationGizmo.__latestTargetEntity === this.__target) {
      TranslationGizmo.__targetPointBackup =
        this.__target.getTransform().translate;
    }
  }

  private __onPointerMove(evt: PointerEvent) {
    evt.preventDefault();
    if (Is.false(TranslationGizmo.__isPointerDown)) {
      return;
    }

    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(
      CameraComponent,
      CameraComponent.main
    ) as CameraComponent | undefined;

    const worldMatrix = this.__target.getSceneGraph().worldMatrix.getRotate();
    const scaleVec = Vector3.one(); //this.__target.getSceneGraph().worldMatrix.getScale();
    let rotMat = new Matrix33(
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
      rotMat = Matrix33.transpose(rotMat);
    } else if (TranslationGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }
    let pickInMovingPoint: Vector3 = TranslationGizmo.__pickStatedPoint.clone();
    if (TranslationGizmo.__activeAxis === 'x') {
      const xResult = TranslationGizmo.__xyPlaneEntity
        .getMesh()
        .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (xResult.result) {
        assertExist(xResult.data);
        const position = rotMat.multiplyVector(xResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(
          position.x,
          pickInMovingPoint.y,
          pickInMovingPoint.z
        );
        console.log('Move:' + xResult.data.position.toStringApproximately());
      }
    }
    if (TranslationGizmo.__activeAxis === 'y') {
      const yResult = TranslationGizmo.__xyPlaneEntity
        .getMesh()
        .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (yResult.result) {
        assertExist(yResult.data);
        const position = rotMat.multiplyVector(yResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(
          pickInMovingPoint.x,
          position.y,
          pickInMovingPoint.z
        );
        console.log('Move:' + yResult.data.position.toStringApproximately());
      }
    }
    if (TranslationGizmo.__activeAxis === 'z') {
      const zResult = TranslationGizmo.__yzPlaneEntity
        .getMesh()
        .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
      if (zResult.result) {
        assertExist(zResult.data);
        const position = rotMat.multiplyVector(zResult.data.position);
        pickInMovingPoint = Vector3.fromCopy3(
          pickInMovingPoint.x,
          pickInMovingPoint.y,
          position.z
        );
        console.log('Move:' + zResult.data.position.toStringApproximately());
      }
    }

    const deltaVector3 = Vector3.subtract(
      pickInMovingPoint,
      TranslationGizmo.__pickStatedPoint
    );
    if (TranslationGizmo.__space === 'local') {
      const worldMatrix = this.__target.getSceneGraph().worldMatrix.getRotate();
      const scaleVec = Vector3.one(); //this.__target.getSceneGraph().worldMatrix.getScale();
      const rotMat = new Matrix33(
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
      TranslationGizmo.__deltaPoint = Vector3.add(
        rotMat.multiplyVector(deltaVector3),
        TranslationGizmo.__targetPointBackup
      );
    } else if (TranslationGizmo.__space === 'world') {
      const deltaDeltaVector3 = Vector3.add(
        TranslationGizmo.__targetPointBackup,
        deltaVector3
      );
      TranslationGizmo.__deltaPoint = deltaDeltaVector3;
    }
  }

  private __onPointerUp(evt: PointerEvent) {
    evt.preventDefault();
    TranslationGizmo.__isPointerDown = false;
    TranslationGizmo.__activeAxis = 'none';

    if (TranslationGizmo.__latestTargetEntity === this.__target) {
      TranslationGizmo.__targetPointBackup =
        this.__target.getTransform().translate;
    }
  }

  private static castRay2(evt: PointerEvent) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(
      CameraComponent,
      CameraComponent.main
    ) as CameraComponent | undefined;
    const result = TranslationGizmo.__groupEntity
      .getSceneGraph()
      .castRayFromScreen(x, y, activeCamera!, viewport, 0.0, []);
    return result;
  }

  private static castRay(evt: PointerEvent) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    const width = (evt.target as HTMLElement).clientWidth;
    const height = (evt.target as HTMLElement).clientHeight;
    const x = evt.clientX - rect.left;
    const y = rect.height - (evt.clientY - rect.top);
    const viewport = Vector4.fromCopy4(0, 0, width, height) as Vector4;
    const activeCamera = ComponentRepository.getComponent(
      CameraComponent,
      CameraComponent.main
    ) as CameraComponent | undefined;
    const xResult = TranslationGizmo.__xCubeEntity
      .getMesh()
      .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
    const yResult = TranslationGizmo.__yCubeEntity
      .getMesh()
      .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
    const zResult = TranslationGizmo.__zCubeEntity
      .getMesh()
      .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
    return {xResult, yResult, zResult};
  }
}
