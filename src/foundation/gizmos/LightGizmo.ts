import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import { Primitive } from '../geometry/Primitive';
import { IMeshEntity, type ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';
import { Gizmo } from './Gizmo';

export class LightGizmo extends Gizmo {
  private static __mesh: Mesh;
  private static __length = 1;

  ///
  ///
  /// Accessors
  ///
  ///

  /**
   * Checks whether the gizmo has been properly initialized and set up.
   * @returns True if the gizmo's top entity exists and setup is complete, false otherwise
   */
  get isSetup(): boolean {
    if (this.__topEntity != null) {
      return true;
    }
    return false;
  }

  ///
  ///
  /// Friends Members
  ///
  ///

  /**
   * Initializes the gizmo entities and visual representation if not already done.
   * Creates a mesh entity with a light gizmo primitive and attaches it to the target entity.
   * @internal
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
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Light' });
  }

  /**
   * Updates the transform properties (position, rotation, scale) of the gizmo to match the target entity.
   * The gizmo's position is set to either the target's position or the center of its bounding box,
   * and its scale is adjusted based on the target's bounding box size.
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
    this.__topEntity.getTransform()!.localRotation = sg.rotation;

    this.__topEntity.getTransform()!.localScale = Vector3.fromCopyArray([
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2),
    ]);
  }

  /**
   * Destroys the gizmo and cleans up its resources.
   * Removes the top entity and all associated components from the scene.
   * @internal
   */
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

  /**
   * Generates the primitive geometry for the light gizmo visualization.
   * Creates a line-based representation showing a directional arrow pointing in the negative Z direction,
   * which is commonly used to represent light direction in 3D graphics.
   * @returns A primitive object containing the line geometry for the light gizmo
   * @private
   */
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
