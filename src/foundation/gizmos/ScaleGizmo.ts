import {CameraComponent} from '../components/Camera/CameraComponent';
import {ComponentRepository} from '../core/ComponentRepository';
import {Config} from '../core/Config';
import {AlphaMode} from '../definitions/AlphaMode';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import {VertexAttribute} from '../definitions/VertexAttribute';
import {Mesh} from '../geometry/Mesh';
import {Primitive} from '../geometry/Primitive';
import {Cube} from '../geometry/shapes/Cube';
import {Plane} from '../geometry/shapes/Plane';
import {
  EntityHelper,
  IMeshEntity,
  ISceneGraphEntity,
} from '../helpers/EntityHelper';
import {MaterialHelper} from '../helpers/MaterialHelper';
import {Material} from '../materials/core/Material';
import {MathUtil} from '../math/MathUtil';
import {Matrix33} from '../math/Matrix33';
import {Matrix44} from '../math/Matrix44';
import {MutableMatrix33} from '../math/MutableMatrix33';
import {Quaternion} from '../math/Quaternion';
import {Vector3} from '../math/Vector3';
import {Vector4} from '../math/Vector4';
import {Is} from '../misc/Is';
import {assertExist} from '../misc/MiscUtil';
import {
  getEvent,
  InputManager,
  INPUT_HANDLING_STATE_GIZMO_SCALE,
} from '../system/InputManager';
import {Gizmo} from './Gizmo';

declare let window: any;

/**
 * Translation Gizmo class
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
  private static __pickStatedPoint = Vector3.zero();
  private static __deltaPoint = Vector3.one();
  private static __targetScaleBackup = Vector3.one();
  private static __isPointerDown = false;
  private static __activeAxis: 'none' | 'x' | 'y' | 'z' = 'none';
  private static __space: 'local' | 'world' = 'world';
  private static __latestTargetEntity?: ISceneGraphEntity;
  private static __length = 1;
  private __onPointerDownFunc = this.__onPointerDown.bind(this);
  private __onPointerMoveFunc = this.__onPointerMove.bind(this);
  private __onPointerUpFunc = this.__onPointerUp.bind(this);

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
    ScaleGizmo.__length = val;
  }

  get length(): number {
    return ScaleGizmo.__length;
  }

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
      this.__topEntity!.getSceneGraph().addChild(
        ScaleGizmo.__groupEntity.getSceneGraph()
      );
      ScaleGizmo.__latestTargetEntity = this.__target;
      if (ScaleGizmo.__space === 'local') {
        ScaleGizmo.__groupEntity.getTransform().quaternion =
          this.__target.getTransform().quaternion;
      } else if (ScaleGizmo.__space === 'world') {
        ScaleGizmo.__groupEntity.getTransform().quaternion =
          Quaternion.fromCopy4(0, 0, 0, 1);
      }
    }

    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_SCALE);
      ScaleGizmo.__deltaPoint = this.__target.getTransform().scale;
      ScaleGizmo.__pickStatedPoint = Vector3.zero();
      ScaleGizmo.__isPointerDown = false;
      ScaleGizmo.__targetScaleBackup = this.__target.getTransform().scale;
      ScaleGizmo.__activeAxis = 'none';
    }

    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_SCALE, flg);

    this.__setVisible(flg);
    ScaleGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
    ScaleGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
    ScaleGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
  }

  setSpace(space: 'local' | 'world') {
    ScaleGizmo.__space = space;
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

    this.__topEntity = EntityHelper.createGroupEntity();
    this.__topEntity!.tryToSetUniqueName(
      `ScaleGizmo_of_${this.__target.uniqueName}`,
      true
    );
    this.__topEntity!.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix =
      true;

    // add this topEntity to the target as gizmo
    this.__target
      .getSceneGraph()
      ._addGizmoChild(this.__topEntity!.getSceneGraph());

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
      ScaleGizmo.__groupEntity = EntityHelper.createGroupEntity();
    }

    this.__topEntity!.getSceneGraph().addChild(
      ScaleGizmo.__groupEntity.getSceneGraph()
    );

    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__xCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__yCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__zCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__xEdgeCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__yEdgeCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__zEdgeCubeEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__xyPlaneEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__yzPlaneEntity.getSceneGraph());
    ScaleGizmo.__groupEntity
      .getSceneGraph()
      .addChild(ScaleGizmo.__zxPlaneEntity.getSceneGraph());

    ScaleGizmo.__latestTargetEntity = this.__target;

    this.setGizmoTag();
  }

  private zxPlane() {
    ScaleGizmo.__zxPlaneEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_zxPlane', true);
    ScaleGizmo.__zxPlaneEntity.getSceneGraph().isVisible = false;
    // TranslationGizmo.__zxPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    // TranslationGizmo.__zxPlaneEntity.getTransform().rotate =
    // Vector3.fromCopy3(90, 0, 0);
    ScaleGizmo.__zxPlaneMaterial = MaterialHelper.createClassicUberMaterial();
    ScaleGizmo.__zxPlaneMaterial.setParameter(
      ShaderSemantics.DiffuseColorFactor,
      Vector4.fromCopyArray4([0, 0.5, 0, 0])
    );
    ScaleGizmo.__zxPlaneMaterial.alphaMode = AlphaMode.Translucent;
    ScaleGizmo.__zxPlaneMesh = new Mesh();
    ScaleGizmo.__zxPlanePrimitive = new Plane();
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

  private yzPlane() {
    ScaleGizmo.__yzPlaneEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_yzPlane', true);
    ScaleGizmo.__yzPlaneEntity.getSceneGraph().isVisible = false;
    // TranslationGizmo.__yzPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    ScaleGizmo.__yzPlaneEntity.getTransform().rotate = Vector3.fromCopy3(
      0,
      0,
      MathUtil.degreeToRadian(90)
    );
    ScaleGizmo.__yzPlaneMaterial = MaterialHelper.createClassicUberMaterial();
    ScaleGizmo.__yzPlaneMaterial.alphaMode = AlphaMode.Translucent;
    ScaleGizmo.__yzPlaneMaterial.setParameter(
      ShaderSemantics.DiffuseColorFactor,
      Vector4.fromCopyArray4([0.5, 0, 0, 0])
    );
    ScaleGizmo.__yzPlaneMesh = new Mesh();
    ScaleGizmo.__yzPlanePrimitive = new Plane();
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

  private xyPlane() {
    ScaleGizmo.__xyPlaneEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_xyPlane', true);
    ScaleGizmo.__xyPlaneEntity.getSceneGraph().isVisible = false;
    // TranslationGizmo.__xyPlaneEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    ScaleGizmo.__xyPlaneEntity.getTransform().rotate = Vector3.fromCopy3(
      MathUtil.degreeToRadian(90),
      0,
      0
    );
    ScaleGizmo.__xyPlaneMaterial = MaterialHelper.createClassicUberMaterial();
    ScaleGizmo.__xyPlaneMaterial.alphaMode = AlphaMode.Translucent;
    ScaleGizmo.__xyPlaneMaterial.setParameter(
      ShaderSemantics.DiffuseColorFactor,
      Vector4.fromCopyArray4([0, 0, 0.5, 0])
    );
    ScaleGizmo.__xyPlaneMesh = new Mesh();
    ScaleGizmo.__xyPlanePrimitive = new Plane();
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

  private zMesh() {
    ScaleGizmo.__zCubeEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_zCube', true);
    ScaleGizmo.__zCubeEntity.getTransform().translate = Vector3.fromCopy3(
      0,
      0,
      1
    );
    ScaleGizmo.__zCubeMesh = new Mesh();
    ScaleGizmo.__zCubeMaterial = MaterialHelper.createClassicUberMaterial();
    ScaleGizmo.__zCubeMaterial.setParameter(
      ShaderSemantics.DiffuseColorFactor,
      Vector4.fromCopyArray4([0, 0, 1, 1])
    );
    ScaleGizmo.__zCubePrimitive = new Cube();
    ScaleGizmo.__zCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 0.05, 1),
      material: ScaleGizmo.__zCubeMaterial,
    });
    ScaleGizmo.__zCubeMesh.addPrimitive(ScaleGizmo.__zCubePrimitive);
    ScaleGizmo.__zCubeEntity.getMesh().setMesh(ScaleGizmo.__zCubeMesh);
  }

  private yMesh() {
    ScaleGizmo.__yCubeEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_yCube', true);
    ScaleGizmo.__yCubeEntity.getTransform().translate = Vector3.fromCopy3(
      0,
      1,
      0
    );
    ScaleGizmo.__yCubeMesh = new Mesh();
    ScaleGizmo.__yCubeMaterial = MaterialHelper.createClassicUberMaterial();
    ScaleGizmo.__yCubeMaterial.setParameter(
      ShaderSemantics.DiffuseColorFactor,
      Vector4.fromCopyArray4([0, 1, 0, 1])
    );
    ScaleGizmo.__yCubePrimitive = new Cube();
    ScaleGizmo.__yCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.05, 1, 0.05),
      material: ScaleGizmo.__yCubeMaterial,
    });
    ScaleGizmo.__yCubeMesh.addPrimitive(ScaleGizmo.__yCubePrimitive);
    ScaleGizmo.__yCubeEntity.getMesh().setMesh(ScaleGizmo.__yCubeMesh);
  }

  private xMesh() {
    ScaleGizmo.__xCubeEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xCubeEntity.tryToSetUniqueName('ScaleGizmo_xCube', true);
    ScaleGizmo.__xCubeEntity.getTransform().translate = Vector3.fromCopy3(
      1,
      0,
      0
    );
    ScaleGizmo.__xCubeMesh = new Mesh();
    ScaleGizmo.__xCubeMaterial = MaterialHelper.createClassicUberMaterial();
    ScaleGizmo.__xCubeMaterial.setParameter(
      ShaderSemantics.DiffuseColorFactor,
      Vector4.fromCopyArray4([1, 0, 0, 1])
    );
    ScaleGizmo.__xCubePrimitive = new Cube();
    ScaleGizmo.__xCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(1, 0.05, 0.05),
      material: ScaleGizmo.__xCubeMaterial,
    });
    ScaleGizmo.__xCubeMesh.addPrimitive(ScaleGizmo.__xCubePrimitive);
    ScaleGizmo.__xCubeEntity.getMesh().setMesh(ScaleGizmo.__xCubeMesh);
  }

  private xEdgeMesh() {
    ScaleGizmo.__xEdgeCubeEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__xEdgeCubeEntity.tryToSetUniqueName(
      'ScaleGizmo_xEdgeCube',
      true
    );
    ScaleGizmo.__xEdgeCubeEntity.getTransform().translate = Vector3.fromCopy3(
      2,
      0,
      0
    );
    ScaleGizmo.__xEdgeCubeMesh = new Mesh();
    ScaleGizmo.__xEdgeCubePrimitive = new Cube();
    ScaleGizmo.__xEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.1, 0.1, 0.1),
      material: ScaleGizmo.__xCubeMaterial,
    });
    ScaleGizmo.__xEdgeCubeMesh.addPrimitive(ScaleGizmo.__xEdgeCubePrimitive);
    ScaleGizmo.__xEdgeCubeEntity.getMesh().setMesh(ScaleGizmo.__xEdgeCubeMesh);
  }

  private yEdgeMesh() {
    ScaleGizmo.__yEdgeCubeEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__yEdgeCubeEntity.tryToSetUniqueName(
      'ScaleGizmo_yEdgeCube',
      true
    );
    ScaleGizmo.__yEdgeCubeEntity.getTransform().translate = Vector3.fromCopy3(
      0,
      2,
      0
    );
    ScaleGizmo.__yEdgeCubeMesh = new Mesh();
    ScaleGizmo.__yEdgeCubePrimitive = new Cube();
    ScaleGizmo.__yEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.1, 0.1, 0.1),
      material: ScaleGizmo.__yCubeMaterial,
    });
    ScaleGizmo.__yEdgeCubeMesh.addPrimitive(ScaleGizmo.__yEdgeCubePrimitive);
    ScaleGizmo.__yEdgeCubeEntity.getMesh().setMesh(ScaleGizmo.__yEdgeCubeMesh);
  }

  private zEdgeMesh() {
    ScaleGizmo.__zEdgeCubeEntity = EntityHelper.createMeshEntity();
    ScaleGizmo.__zEdgeCubeEntity.tryToSetUniqueName(
      'ScaleGizmo_zEdgeCube',
      true
    );
    ScaleGizmo.__zEdgeCubeEntity.getTransform().translate = Vector3.fromCopy3(
      0,
      0,
      2
    );
    ScaleGizmo.__zEdgeCubeMesh = new Mesh();
    ScaleGizmo.__zEdgeCubePrimitive = new Cube();
    ScaleGizmo.__zEdgeCubePrimitive.generate({
      widthVector: Vector3.fromCopy3(0.1, 0.1, 0.1),
      material: ScaleGizmo.__zCubeMaterial,
    });
    ScaleGizmo.__zEdgeCubeMesh.addPrimitive(ScaleGizmo.__zEdgeCubePrimitive);
    ScaleGizmo.__zEdgeCubeEntity.getMesh().setMesh(ScaleGizmo.__zEdgeCubeMesh);
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

    if (ScaleGizmo.__isPointerDown) {
      if (ScaleGizmo.__latestTargetEntity === this.__target) {
        this.__target.getTransform().scale = ScaleGizmo.__deltaPoint.clone();
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
    ScaleGizmo.__isPointerDown = true;
    ScaleGizmo.__originalX = evt.clientX;
    ScaleGizmo.__originalY = evt.clientY;

    const worldMatrix = this.__target.getSceneGraph().worldMatrix.getRotate();
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
      rotMat = Matrix33.transpose(rotMat);
    } else if (ScaleGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }

    const {xResult, yResult, zResult} = ScaleGizmo.castRay(evt);
    if (xResult.result) {
      assertExist(xResult.data);
      ScaleGizmo.__pickStatedPoint = rotMat.multiplyVector(
        xResult.data.position.clone()
      );
      console.log(
        'Down:' + ScaleGizmo.__pickStatedPoint.toStringApproximately()
      );
      ScaleGizmo.__activeAxis = 'x';
    }
    if (yResult.result) {
      assertExist(yResult.data);
      ScaleGizmo.__pickStatedPoint = rotMat.multiplyVector(
        yResult.data.position.clone()
      );
      console.log(
        'Down:' + ScaleGizmo.__pickStatedPoint.toStringApproximately()
      );
      ScaleGizmo.__activeAxis = 'y';
    }
    if (zResult.result) {
      assertExist(zResult.data);
      ScaleGizmo.__pickStatedPoint = rotMat.multiplyVector(
        zResult.data.position.clone()
      );
      console.log(
        'Down:' + ScaleGizmo.__pickStatedPoint.toStringApproximately()
      );
      ScaleGizmo.__activeAxis = 'z';
    }

    if (ScaleGizmo.__latestTargetEntity === this.__target) {
      ScaleGizmo.__targetScaleBackup = this.__target.getTransform().scale;
    }
  }

  private __onPointerMove(evt: PointerEvent) {
    evt.preventDefault();
    if (Is.false(ScaleGizmo.__isPointerDown)) {
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
      CameraComponent.current
    ) as CameraComponent | undefined;

    const worldMatrix = this.__target.getSceneGraph().worldMatrix.getRotate();
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
      rotMat = Matrix33.transpose(rotMat);
    } else if (ScaleGizmo.__space === 'world') {
      rotMat = MutableMatrix33.identity();
    }
    let pickInMovingPoint: Vector3 = ScaleGizmo.__pickStatedPoint.clone();
    if (ScaleGizmo.__activeAxis === 'x') {
      const xResult = ScaleGizmo.__xyPlaneEntity
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
        // pickInMovingPoint = Vector3.fromCopy3(xResult.data.position.x, pickInMovingPoint.y, pickInMovingPoint.z);
        console.log('Move:' + xResult.data.position.toStringApproximately());
      }
    }
    if (ScaleGizmo.__activeAxis === 'y') {
      const yResult = ScaleGizmo.__xyPlaneEntity
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
        // pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, yResult.data.position.y, pickInMovingPoint.z);
        console.log('Move:' + yResult.data.position.toStringApproximately());
      }
    }
    if (ScaleGizmo.__activeAxis === 'z') {
      const zResult = ScaleGizmo.__yzPlaneEntity
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
        // pickInMovingPoint = Vector3.fromCopy3(pickInMovingPoint.x, pickInMovingPoint.y, zResult.data.position.z);
        console.log('Move:' + zResult.data.position.toStringApproximately());
      }
    }

    const sg = this.__target.getSceneGraph()!;
    const aabb = sg.worldAABB;
    const deltaVector3 = Vector3.multiply(
      Vector3.subtract(pickInMovingPoint, ScaleGizmo.__pickStatedPoint),
      1 / aabb.lengthCenterToCorner
    );
    if (ScaleGizmo.__space === 'local') {
      ScaleGizmo.__deltaPoint = Vector3.add(
        ScaleGizmo.__targetScaleBackup,
        deltaVector3
      );
    } else if (ScaleGizmo.__space === 'world') {
      const worldMat = this.__target.getSceneGraph().worldMatrix;
      const existedScale = Matrix44.multiply(
        worldMat,
        Matrix44.scale(ScaleGizmo.__targetScaleBackup)
      ).getScale();
      ScaleGizmo.__deltaPoint = Matrix44.multiply(
        Matrix44.invert(worldMat),
        Matrix44.scale(Vector4.add(deltaVector3, existedScale))
      ).getScale();
    }
  }

  private __onPointerUp(evt: PointerEvent) {
    evt.preventDefault();
    ScaleGizmo.__isPointerDown = false;
    ScaleGizmo.__activeAxis = 'none';

    if (ScaleGizmo.__latestTargetEntity === this.__target) {
      ScaleGizmo.__targetScaleBackup = this.__target.getTransform().scale;
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
      CameraComponent.current
    ) as CameraComponent | undefined;
    const result = ScaleGizmo.__groupEntity
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
      CameraComponent.current
    ) as CameraComponent | undefined;
    const xResult = ScaleGizmo.__xCubeEntity
      .getMesh()
      .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
    const yResult = ScaleGizmo.__yCubeEntity
      .getMesh()
      .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
    const zResult = ScaleGizmo.__zCubeEntity
      .getMesh()
      .castRayFromScreenInWorld(x, y, activeCamera!, viewport, 0.0);
    return {xResult, yResult, zResult};
  }
}
