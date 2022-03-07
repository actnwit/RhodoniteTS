import OrbitCameraController from '../cameras/OrbitCameraController';
import Config from '../core/Config';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import {VertexAttribute} from '../definitions/VertexAttribute';
import Mesh from '../geometry/Mesh';
import {Primitive} from '../geometry/Primitive';
import {Cube} from '../geometry/shapes/Cube';
import EntityHelper, {IMeshEntity} from '../helpers/EntityHelper';
import MaterialHelper from '../helpers/MaterialHelper';
import Material from '../materials/core/Material';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import {Is} from '../misc/Is';
import { getEvent, InputManager, INPUT_HANDLING_STATE_GIZMO_TRNSLATION } from '../system/InputManager';
import Gizmo from './Gizmo';

declare let window: any;

/**
 * Translation Gizmo class
 */
export default class TranslationGizmo extends Gizmo {
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
  private static __isPointerDown = false;
  private static __originalX = 0;
  private static __originalY = 0;

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
      TranslationGizmo.__xCubeEntity.getTransform().translate =
        Vector3.fromCopy3(0.95, 0, 0);
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
      TranslationGizmo.__yCubeEntity.getTransform().translate =
        Vector3.fromCopy3(0, 0.95, 0);
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
      TranslationGizmo.__zCubeEntity.getTransform().translate =
        Vector3.fromCopy3(0, 0, 0.95);
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

    this.__topEntity!.getSceneGraph().addChild(
      TranslationGizmo.__xCubeEntity.getSceneGraph()
    );
    this.__topEntity!.getSceneGraph().addChild(
      TranslationGizmo.__yCubeEntity.getSceneGraph()
    );
    this.__topEntity!.getSceneGraph().addChild(
      TranslationGizmo.__zCubeEntity.getSceneGraph()
    );
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
    this.__topEntity.getTransform()!.scale = Vector3.fromCopyArray([
      Math.min(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.min(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.min(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2),
    ]);
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

  set isVisible(flg: boolean) {
    if (this.__isVisible === false && flg === true) {
      let eventTargetDom = window;
      if (Is.exist(Config.eventTargetDom)) {
        eventTargetDom = Config.eventTargetDom;
      }
      InputManager.register(INPUT_HANDLING_STATE_GIZMO_TRNSLATION, [
        {
          eventName: getEvent('start'),
          handler: TranslationGizmo.__onPointerDown,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
        {
          eventName: getEvent('move'),
          handler: TranslationGizmo.__onPointerMove,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
        {
          eventName: getEvent('end'),
          handler: TranslationGizmo.__onPointerUp,
          options: {},
          classInstance: this,
          eventTargetDom: eventTargetDom,
        },
      ]);
    }

    if (this.__isVisible === true && flg === false) {
      InputManager.unregister(INPUT_HANDLING_STATE_GIZMO_TRNSLATION);
    }

    InputManager.setActive(INPUT_HANDLING_STATE_GIZMO_TRNSLATION, flg);

    this.__setVisible(flg);
  }

  private static __onPointerDown(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = true;
    this.__originalX = evt.clientX;
    this.__originalY = evt.clientY;
  }

  private static __onPointerMove(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = true;
    if (Is.false(this.__isPointerDown)) {
      return;
    }
    const deltaX = evt.clientX;
    const deltaY = evt.clientY;
    console.log(deltaX, deltaY);
  }

  private static __onPointerUp(evt: PointerEvent) {
    evt.preventDefault();
    this.__isPointerDown = false;
  }
}
