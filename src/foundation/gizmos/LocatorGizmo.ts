import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { Mesh } from '../geometry/Mesh';
import { Primitive } from '../geometry/Primitive';
import type { IMeshEntity } from '../helpers/EntityHelper';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';
import { Gizmo } from './Gizmo';

/**
 * Locator Gizmo class that provides visual coordinate axes for 3D objects.
 * Displays X (red), Y (green), and Z (blue) axis lines to help visualize object orientation and position.
 */
export class LocatorGizmo extends Gizmo {
  private static __mesh: Mesh;
  private static __length = 1;

  ///
  ///
  /// Accessors
  ///
  ///

  /**
   * Gets whether the gizmo has been properly set up and initialized.
   * @returns True if the gizmo is set up, false otherwise
   */
  get isSetup(): boolean {
    if (this.__topEntity != null) {
      return true;
    }
    return false;
  }

  /**
   * Sets the length of the axis lines displayed by the gizmo.
   * @param val - The length value for the axis lines
   */
  set length(val: number) {
    LocatorGizmo.__length = val;
  }

  /**
   * Gets the current length of the axis lines displayed by the gizmo.
   * @returns The current axis line length
   */
  get length(): number {
    return LocatorGizmo.__length;
  }

  ///
  ///
  /// Friends Members
  ///
  ///

  /**
   * Sets up the gizmo entities and mesh if not already done.
   * Creates the coordinate axis visualization with colored lines representing X, Y, and Z axes.
   * @internal
   */
  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    this.__topEntity = createMeshEntity(this.__engine);
    this.__topEntity!.tryToSetUniqueName(`LocatorGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity!.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.__target.getSceneGraph()._addGizmoChild(this.__topEntity!.getSceneGraph());

    const sceneGraphComponent = this.__topEntity!.tryToGetMesh()!;
    LocatorGizmo.__mesh = new Mesh();
    LocatorGizmo.__mesh.addPrimitive(LocatorGizmo.__generatePrimitive());
    sceneGraphComponent.setMesh(LocatorGizmo.__mesh);

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Locator' });
  }

  /**
   * Updates the gizmo's transform properties to match the target object.
   * Positions the gizmo at the target's center point and scales it based on the target's bounding box.
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
    this.__topEntity.getTransform()!.localScale = Vector3.fromCopyArray([
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

  /**
   * Generates the primitive geometry for the coordinate axes visualization.
   * Creates three colored lines: red for X-axis, green for Y-axis, and blue for Z-axis.
   * @returns The primitive object containing the axis line geometry and colors
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
   * Destroys the gizmo and cleans up its resources.
   * Removes the gizmo entity and frees associated memory.
   */
  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
  }
}
