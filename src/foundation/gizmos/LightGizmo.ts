import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import { Primitive } from '../geometry/Primitive';
import { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';
import { Gizmo } from './Gizmo';

export class LightGizmo extends Gizmo {
  private static __mesh: Mesh;
  private static __length = 1;

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

  get isSetup(): boolean {
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
    this.__topEntity.tryToSetUniqueName(`LightGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.__target.getSceneGraph()._addGizmoChild(this.__topEntity!.getSceneGraph());

    const meshComponent = this.__topEntity!.tryToGetMesh()!;
    LightGizmo.__mesh = new Mesh();
    LightGizmo.__mesh.addPrimitive(LightGizmo.__generatePrimitive());
    meshComponent.setMesh(LightGizmo.__mesh);

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
    const aabb = sg.worldMergedAABBWithSkeletal;
    if (aabb.isVanilla()) {
      this.__topEntity.getTransform()!.localPosition = sg.position;
    } else {
      this.__topEntity.getTransform()!.localPosition = aabb.centerPoint;
    }
    this.__topEntity.getTransform()!.localRotation = sg.rotation;

    this.__topEntity.getTransform()!.localScale = Vector3.fromCopyArray([
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2),
    ]);
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }

  ///
  ///
  /// Private Static Members
  ///
  ///

  private static __generatePrimitive(): Primitive {
    const positions = new Float32Array([
      // Z axis
      0,
      0,
      0,
      0,
      0,
      -this.__length,

      // Arrow
      0,
      0,
      -this.__length,
      -0.1,
      0,
      -this.__length + 0.2,

      // Arrow end
      -0.1,
      0,
      -this.__length + 0.2,
      0,
      0,
      -this.__length + 0.2,
    ]);

    const primitive = Primitive.createPrimitive({
      attributeSemantics: [VertexAttribute.Position.XYZ],
      attributes: [positions],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
  }
}
