import { Gizmo } from './Gizmo';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Primitive } from '../geometry/Primitive';
import { Vector3 } from '../math/Vector3';
import { Mesh } from '../geometry/Mesh';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Is } from '../misc/Is';
import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';

/**
 * AABB Gizmo class
 */
export class AABBGizmo extends Gizmo {
  private static __mesh?: Mesh;

  /**
   * Constructor
   * @param target the object which this gizmo belong to
   */
  constructor(target: ISceneGraphEntity) {
    super(target);
  }

  ///
  ///
  /// Accessors
  ///
  ///

  get isSetup() {
    if (this.__topEntity != null) {
      return true;
    } else {
      return false;
    }
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

    this.__topEntity = createMeshEntity();
    this.__topEntity!.tryToSetUniqueName(`AABBGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity!.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.__target.getSceneGraph()!._addGizmoChild(this.__topEntity!.getSceneGraph()!);

    const meshComponent = this.__topEntity!.tryToGetMesh()!;
    AABBGizmo.__mesh = new Mesh();
    AABBGizmo.__mesh.addPrimitive(AABBGizmo.generatePrimitive());
    meshComponent.setMesh(AABBGizmo.__mesh);

    this.setGizmoTag();
  }

  /**
   * generate the primitive of the gizmo
   * @returns a primitive of the gizmo
   */
  private static generatePrimitive() {
    const indices = new Uint32Array([
      // XY Plane on -Z
      0, 1, 1, 2, 2, 3, 3, 0,

      // XY Plane on +Z
      4, 5, 5, 6, 6, 7, 7, 4,

      // YZ Plane on -X
      0, 3, 3, 7, 7, 4, 4, 0,

      // YZ Plane on +X
      1, 2, 2, 6, 6, 5, 5, 1,

      // XZ Plane on -Y
      0, 1, 1, 5, 5, 4, 4, 0,

      // XZ Plane on +Y
      3, 2, 2, 6, 6, 7, 7, 3,
    ]);

    const length = 1;
    const positions = new Float32Array([
      /// -Z
      // 0
      -length,
      -length,
      -length,

      // 1
      length,
      -length,
      -length,

      // 2
      length,
      length,
      -length,

      // 3
      -length,
      length,
      -length,

      /// +Z
      // 4
      -length,
      -length,
      length,

      // 5
      length,
      -length,
      length,

      // 6
      length,
      length,
      length,

      // 7
      -length,
      length,
      length,
    ]);

    const primitive = Primitive.createPrimitive({
      indices: indices,
      attributeSemantics: [VertexAttribute.Position.XYZ],
      attributes: [positions],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
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
    const aabb = sg.worldMergedAABBWithSkeletal;
    this.__topEntity.getTransform()!.localPosition = aabb.centerPoint;
    this.__topEntity.getTransform()!.localScale = Vector3.fromCopyArray([
      aabb.sizeX / 2,
      aabb.sizeY / 2,
      aabb.sizeZ / 2,
    ]);
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }
}
