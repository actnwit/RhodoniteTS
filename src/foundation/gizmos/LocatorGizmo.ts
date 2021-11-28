import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import TransformComponent from '../components/TransformComponent';
import Entity from '../core/Entity';
import RnObject from '../core/RnObject';
import {CompositionType} from '../definitions/CompositionType';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {VertexAttribute} from '../definitions/VertexAttribute';
import Mesh from '../geometry/Mesh';
import Primitive from '../geometry/Primitive';
import Vector3 from '../math/Vector3';
import Gizmo from './Gizmo';

/**
 * Locator Gizmo class
 */
export default class LocatorGizmo extends Gizmo {
  private static __mesh: Mesh;
  private static __length = 1;
  /**
   * Constructor
   * @param target the object which this gizmo belong to
   */
  constructor(target: Entity) {
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
   * @private
   * setup entities of Gizmo if not done yet
   */
  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    this.__topEntity = this.__entityRepository.createEntity([
      TransformComponent,
      SceneGraphComponent,
      MeshComponent,
      MeshRendererComponent,
    ]);
    this.__topEntity.tryToSetUniqueName(`LocatorGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.__target.getSceneGraph()._addGizmoChild(this.__topEntity.getSceneGraph());

    const meshComponent = this.__topEntity.getMesh();
    LocatorGizmo.__mesh = new Mesh();
    LocatorGizmo.__mesh.addPrimitive(LocatorGizmo.__generatePrimitive());
    meshComponent.setMesh(LocatorGizmo.__mesh);

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
    const sg = this.__target.getSceneGraph();
    const aabb = sg.worldAABB;
    this.__topEntity.getTransform().translate = aabb.centerPoint;
    this.__topEntity.getTransform().scale = Vector3.fromCopyArray([
      Math.min(1, aabb.isVanilla() ? 1 : (aabb.sizeX / 2)),
      Math.min(1, aabb.isVanilla() ? 1 : (aabb.sizeY / 2)),
      Math.min(1, aabb.isVanilla() ? 1 : (aabb.sizeZ / 2)),
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
      attributeCompositionTypes: [CompositionType.Vec3, CompositionType.Vec3],
      attributeSemantics: [VertexAttribute.Position, VertexAttribute.Color0],
      attributes: [positions, color],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
  }
}
