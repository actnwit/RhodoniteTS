import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import { Primitive } from '../geometry/Primitive';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';
import { Gizmo } from './Gizmo';

/**
 * AABB Gizmo class that visualizes the Axis-Aligned Bounding Box of a target entity.
 * This gizmo renders a wireframe box around the target entity showing its spatial boundaries.
 */
export class AABBGizmo extends Gizmo {
  private static __mesh?: Mesh;

  ///
  ///
  /// Accessors
  ///
  ///

  /**
   * Checks if the gizmo has been properly set up and initialized.
   * @returns True if the gizmo is set up and ready to render, false otherwise
   */
  get isSetup() {
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
   * Initializes the gizmo entities and mesh components if not already done.
   * Creates the wireframe mesh entity, sets up the primitive geometry,
   * and attaches it to the target entity's scene graph.
   * @internal
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

    this._update();
  }

  /**
   * Generates the wireframe primitive geometry for the AABB visualization.
   * Creates a unit cube with line primitives that form the edges of the bounding box.
   * The cube vertices are arranged from -1 to +1 in each axis and will be scaled
   * appropriately during rendering.
   * @returns A primitive object containing the wireframe geometry for the AABB
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
   * Updates the gizmo's transform to match the target entity's current AABB.
   * Repositions and rescales the wireframe to accurately represent the target's
   * world-space bounding box including skeletal deformations.
   * @internal
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

  /**
   * Destroys the gizmo and cleans up all associated resources.
   * Removes the gizmo entity from the scene graph and frees memory.
   * @internal
   */
  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }
}
