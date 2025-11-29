import type { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { AlphaMode } from '../../definitions/AlphaMode';
import type { IMeshEntity } from '../../helpers/EntityHelper';
import { MaterialHelper } from '../../helpers/MaterialHelper';
import { MeshHelper } from '../../helpers/MeshHelper';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';

/**
 * A sphere collider used for VRM spring bone physics simulation.
 * This collider represents a spherical collision volume that can interact with bones
 * to prevent them from penetrating through solid objects.
 */
export class SphereCollider {
  /** The local position of the sphere collider relative to its base scene graph node */
  private __position = Vector3.zero();

  /** The radius of the sphere collider */
  private __radius = 0;

  /** The base scene graph component that defines the transform space for this collider */
  private __baseSceneGraph: SceneGraphComponent;

  private __worldPosition = MutableVector3.zero();

  /** The mesh entity used to visualize this collider */
  private __visualizationEntity?: IMeshEntity;

  /** Whether the visualization is currently visible */
  private __isVisualizationVisible = false;

  private static __tmp_vec3_1 = MutableVector3.zero();

  constructor(position: Vector3, radius: number, baseSceneGraph: SceneGraphComponent) {
    this.__position = position;
    this.__radius = radius;
    this.__baseSceneGraph = baseSceneGraph;
  }

  /**
   * Updates the cached world position of the collider.
   * Should be called once per frame before collision checks.
   */
  updateWorldState() {
    const baseMatrix = this.__baseSceneGraph.matrixInner;
    baseMatrix.multiplyVector3To(this.__position, this.__worldPosition);
  }

  /**
   * Calculates collision information between this sphere collider and a bone.
   *
   * @param bonePosition - The world position of the bone
   * @param boneRadius - The radius of the bone for collision detection
   * @returns An object containing the collision direction and penetration distance
   *   - direction: The normalized vector pointing from the sphere center to the bone
   *   - distance: The penetration distance (negative if penetrating, positive if separated)
   */
  collision(bonePosition: Vector3, boneRadius: number) {
    const delta = Vector3.subtractTo(
      bonePosition,
      this.__worldPosition,
      SphereCollider.__tmp_vec3_1
    );
    const length = delta.length();
    const radius = this.__radius + boneRadius;
    const distance = length - radius;

    return { distance, delta: delta, length };
  }

  /**
   * Creates a visualization sphere mesh for this collider.
   * The visualization is a semi-transparent green sphere that shows the collider's bounds.
   * The sphere is attached as a child of the base scene graph node.
   */
  createVisualization(): void {
    if (this.__visualizationEntity != null) {
      return; // Visualization already exists
    }

    // Create a sphere mesh with the same radius as the collider
    const sphereEntity = MeshHelper.createSphere({
      radius: this.__radius,
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
      material.setParameter('baseColorFactor', Vector4.fromCopy4(0.0, 1.0, 0.0, 0.3));
      material.alphaMode = AlphaMode.Blend;
      primitive.material = material;
    }

    // Set local position relative to the base scene graph
    sphereEntity.localPosition = this.__position;

    // Add as a child of the base scene graph
    const baseEntity = this.__baseSceneGraph.entity;
    baseEntity.getSceneGraph().addChild(sphereEntity.getSceneGraph());

    this.__visualizationEntity = sphereEntity;

    // Set initial visibility
    sphereEntity.getSceneGraph().isVisible = this.__isVisualizationVisible;
  }

  /**
   * Sets the visibility of the visualization sphere.
   * @param visible - Whether the visualization should be visible
   */
  setVisualizationVisible(visible: boolean): void {
    this.__isVisualizationVisible = visible;
    if (this.__visualizationEntity != null) {
      this.__visualizationEntity.getSceneGraph().isVisible = visible;
    }
  }

  /**
   * Gets whether the visualization is currently visible.
   * @returns True if the visualization is visible
   */
  get isVisualizationVisible(): boolean {
    return this.__isVisualizationVisible;
  }

  /**
   * Destroys the visualization sphere mesh.
   * Call this when the collider is no longer needed to free resources.
   */
  destroyVisualization(): void {
    if (this.__visualizationEntity != null) {
      const sg = this.__visualizationEntity.getSceneGraph();
      const parent = sg.parent;
      if (parent != null) {
        parent.removeChild(sg);
      }
      this.__visualizationEntity = undefined;
    }
  }

  /**
   * Gets the local position of the collider.
   * @returns The local position vector
   */
  get position(): Vector3 {
    return this.__position;
  }

  /**
   * Gets the radius of the collider.
   * @returns The radius value
   */
  get radius(): number {
    return this.__radius;
  }

  /**
   * Gets the base scene graph component.
   * @returns The base scene graph component
   */
  get baseSceneGraph(): SceneGraphComponent {
    return this.__baseSceneGraph;
  }
}
