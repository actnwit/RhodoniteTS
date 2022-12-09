import { Entity } from '../core/Entity';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {VertexAttribute} from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import {Primitive} from '../geometry/Primitive';
import {EntityHelper, IMeshEntity} from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Gizmo } from './Gizmo';

/**
 * Locator Gizmo class
 */
export class LocatorGizmo extends Gizmo {
  private static __mesh: Mesh;
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
    LocatorGizmo.__length = val;
  }

  get length(): number {
    return LocatorGizmo.__length;
  }

  ///
  ///
  /// Friends Members
  ///
  ///

  /**
   * @internal
   * setup entities of Gizmo if not done yet
   */
  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    this.__topEntity = EntityHelper.createMeshEntity();
    this.__topEntity!.tryToSetUniqueName(
      `LocatorGizmo_of_${this.__target.uniqueName}`,
      true
    );
    this.__topEntity!.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix =
      true;
    this.__target
      .getSceneGraph()!
      ._addGizmoChild(this.__topEntity!.getSceneGraph());

    const sceneGraphComponent = this.__topEntity!.tryToGetMesh()!;
    LocatorGizmo.__mesh = new Mesh();
    LocatorGizmo.__mesh.addPrimitive(LocatorGizmo.__generatePrimitive());
    sceneGraphComponent.setMesh(LocatorGizmo.__mesh);

    this.setGizmoTag();
  }

  /**
   * @internal
   * update the transform and etc of the gizmo
   */
  _update(): void {
    if (this.__topEntity == null) {
      return;
    }
    const sg = this.__target.getSceneGraph()!;
    const aabb = sg.worldAABB;
    if (aabb.isVanilla()) {
      this.__topEntity.getTransform()!.translate = sg.translate;
    } else {
      this.__topEntity.getTransform()!.translate = aabb.centerPoint;
    }
    this.__topEntity.getTransform()!.scale = Vector3.fromCopyArray([
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2),
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
}
