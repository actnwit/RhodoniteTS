import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { AlphaMode } from '../definitions/AlphaMode';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { MeshHelper } from '../helpers/MeshHelper';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import type { SphereCollider } from '../physics/VRMSpring/SphereCollider';
import { Gizmo } from './Gizmo';

/**
 * SphereColliderGizmo renders a sphere collider visualization for debugging purposes.
 * The visualization is a semi-transparent green sphere that shows the collider's bounds.
 */
export class SphereColliderGizmo extends Gizmo {
  protected declare __topEntity?: ISceneGraphEntity;

  private __sphereCollider: SphereCollider;
  private __sphereEntity?: IMeshEntity;

  /**
   * Creates a new SphereColliderGizmo instance
   * @param sphereCollider - The sphere collider to visualize
   */
  constructor(sphereCollider: SphereCollider) {
    super(sphereCollider.baseSceneGraph.entity as ISceneGraphEntity);
    this.__sphereCollider = sphereCollider;
  }

  get isSetup(): boolean {
    return Is.exist(this.__topEntity);
  }

  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    const targetSceneGraph = this.__target.getSceneGraph();
    if (!targetSceneGraph) {
      return;
    }

    this.__topEntity = createGroupEntity();
    this.__topEntity.tryToSetUniqueName(`SphereColliderGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.__topEntity.getSceneGraph()!);

    // Create a sphere mesh with the same radius as the collider
    const sphereEntity = MeshHelper.createSphere({
      radius: this.__sphereCollider.radius,
      widthSegments: 16,
      heightSegments: 12,
    });

    // Set up a semi-transparent material for visualization
    const meshComponent = sphereEntity.getMesh();
    const mesh = meshComponent.mesh;
    if (mesh != null) {
      const primitive = mesh.getPrimitiveAt(0);
      const material = MaterialHelper.createFlatMaterial({
        isSkinning: false,
        isMorphing: false,
      });
      // Set semi-transparent green color
      material.setParameter('baseColorFactor', Vector4.fromCopy4(0.0, 1.0, 0.0, 1.0));
      // material.alphaMode = AlphaMode.Blend;
      primitive.material = material;
    }

    // Set local position relative to the base scene graph
    sphereEntity.localPosition = this.__sphereCollider.position;

    // Add as a child of the top entity
    this.__topEntity.getSceneGraph()!.addChild(sphereEntity.getSceneGraph());

    this.__sphereEntity = sphereEntity;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'SphereCollider' });
  }

  _update(): void {
    if (!Is.exist(this.__topEntity) || !Is.exist(this.__sphereEntity)) {
      return;
    }

    // Update the sphere position to match the collider's local position
    this.__sphereEntity.localPosition = this.__sphereCollider.position;
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
    this.__sphereEntity = undefined;
  }

  /**
   * Gets the sphere collider being visualized.
   * @returns The sphere collider instance
   */
  get sphereCollider(): SphereCollider {
    return this.__sphereCollider;
  }
}
