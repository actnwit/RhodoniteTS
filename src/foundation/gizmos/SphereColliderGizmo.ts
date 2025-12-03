import type { ObjectUID } from '../../types/CommonTypes';
import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { Mesh } from '../geometry/Mesh';
import { Sphere } from '../geometry/shapes/Sphere';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import type { SphereCollider } from '../physics/VRMSpring/SphereCollider';
import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';

/**
 * SphereColliderGizmo renders a sphere collider visualization for debugging purposes.
 * The visualization is a semi-transparent green sphere that shows the collider's bounds.
 * Uses instanced rendering for efficient drawing of multiple sphere colliders.
 */
export class SphereColliderGizmo extends Gizmo {
  protected declare __topEntity?: ISceneGraphEntity;

  private __sphereCollider: SphereCollider;
  private __sphereEntity?: IMeshEntity;

  /** Shared mesh per Engine for instanced rendering */
  private static __sharedMeshMap: Map<ObjectUID, Mesh> = new Map();

  /**
   * Creates a new SphereColliderGizmo instance
   * @param engine - The engine instance
   * @param sphereCollider - The sphere collider to visualize
   */
  constructor(engine: Engine, sphereCollider: SphereCollider) {
    super(engine, sphereCollider.baseSceneGraph.entity as ISceneGraphEntity);
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

    this.__topEntity = createGroupEntity(this.__engine);
    this.__topEntity.tryToSetUniqueName(`SphereColliderGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.__topEntity.getSceneGraph()!);

    // Get or create shared mesh for instanced rendering (per Engine)
    const sharedMesh = SphereColliderGizmo.__getOrCreateSharedMesh(this.__engine);

    // Create sphere entity using shared mesh
    const sphereEntity = createMeshEntity(this.__engine);
    sphereEntity.tryToSetUniqueName(`SphereColliderGizmo_sphere_${this.__target.uniqueName}`, true);
    sphereEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;

    const meshComponent = sphereEntity.getMesh();
    meshComponent.setMesh(sharedMesh);

    // Set 'Gizmo: SphereCollider' tag to prevent being added to BasicGizmos RenderPass
    // (which would cause double rendering with JointAndColliderGizmos RenderPass)
    sphereEntity.tryToSetTag({ tag: 'Gizmo', value: 'SphereCollider' });

    // Add as a child of the top entity
    this.__topEntity.getSceneGraph()!.addChild(sphereEntity.getSceneGraph());

    this.__sphereEntity = sphereEntity;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'SphereCollider' });

    // Initial update to set position and scale
    this._update();
  }

  _update(): void {
    if (!Is.exist(this.__topEntity) || !Is.exist(this.__sphereEntity)) {
      return;
    }

    // Update the sphere position to match the collider's world position
    this.__sphereEntity.position = this.__sphereCollider.worldPosition;

    // Update scale based on collider radius (shared mesh uses unit radius of 1)
    const radius = this.__sphereCollider.radius;
    this.__sphereEntity.localScale = Vector3.fromCopy3(radius, radius, radius);
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
    this.__sphereEntity = undefined;
  }

  /**
   * Gets existing shared mesh for the engine or creates a new one.
   * This enables instanced rendering by sharing the same mesh across all SphereColliderGizmo instances.
   */
  private static __getOrCreateSharedMesh(engine: Engine): Mesh {
    const engineUID = engine.objectUID;
    let sharedMesh = SphereColliderGizmo.__sharedMeshMap.get(engineUID);
    if (!sharedMesh) {
      // Create material for wireframe visualization
      const material = MaterialHelper.createPbrUberMaterial(engine, {
        isLighting: false,
        isSkinning: false,
        isMorphing: false,
      });
      material.addShaderDefine('RN_USE_WIREFRAME');
      material.setParameter('wireframe', Vector3.fromCopy3(1, 0, 1));
      // Set semi-transparent green color
      material.setParameter('baseColorFactor', Vector4.fromCopy4(0.0, 1.0, 0.0, 1.0));

      // Create unit sphere (radius = 1) for instanced rendering
      sharedMesh = new Mesh(engine);
      const primitive = new Sphere(engine);
      primitive.generate({
        radius: 1,
        widthSegments: 16,
        heightSegments: 12,
        material: material,
      });
      sharedMesh.addPrimitive(primitive);
      sharedMesh._calcBaryCentricCoord();
      SphereColliderGizmo.__sharedMeshMap.set(engineUID, sharedMesh);
    }
    return sharedMesh;
  }

  /**
   * Gets the sphere collider being visualized.
   * @returns The sphere collider instance
   */
  get sphereCollider(): SphereCollider {
    return this.__sphereCollider;
  }
}
