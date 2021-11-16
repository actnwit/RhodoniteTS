import Gizmo from './Gizmo';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {VertexAttribute} from '../definitions/VertexAttribute';
import {CompositionType} from '../definitions/CompositionType';
import Primitive from '../geometry/Primitive';
import RnObject from '../core/RnObject';
import Vector3 from '../math/Vector3';
import Mesh from '../geometry/Mesh';

/**
 * AABB Gizmo class
 */
export default class AABBGizmo extends Gizmo {
  private static __mesh?: Mesh;

  /**
   * Constructor
   * @param substance the object which this gizmo belong to
   */
  constructor(substance: RnObject) {
    super(substance);
  }

  ///
  ///
  /// Public Members
  ///
  ///

  public update(): void {
    if (this.__topEntity == null) {
      return;
    }
    const sg = this.__substance as unknown as SceneGraphComponent;
    const aabb = sg.worldAABB;
    this.__topEntity.getTransform().translate = aabb.centerPoint;
    this.__topEntity.getTransform().scale = Vector3.fromCopyArray([
      aabb.sizeX / 2,
      aabb.sizeY / 2,
      aabb.sizeZ / 2,
    ]);
  }

  public setup(): void {
    if (this.isSetup) {
      return;
    }

    this.__topEntity = this.__entityRepository.createEntity([
      TransformComponent,
      SceneGraphComponent,
      MeshComponent,
      MeshRendererComponent,
    ]);
    const meshComponent = this.__topEntity.getMesh();

    // if (AABBGizmo.__aabbMesh == null) {
    AABBGizmo.__mesh = new Mesh();
    AABBGizmo.__mesh.addPrimitive(AABBGizmo.__generatePrimitive());
    meshComponent.setMesh(AABBGizmo.__mesh);
    // } else {
    //   const mesh = new Mesh();
    //   mesh.setOriginalMesh(AABBGizmo.__aabbMesh);
    //   meshComponent.setMesh(mesh);
    // }

    this.setGizmoTag();
  }

  ///
  ///
  /// Accesssors
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
  /// Private Static Members
  ///
  ///

  private static __generatePrimitive(): Primitive {
    const indices = new Uint32Array([
      0, 1, 2, 3, 4, 5, 6, 7, 3, 0, 4, 7, 2, 1, 5, 6, 3, 2, 6, 7, 0, 1, 5, 4,
    ]);

    const length = 1;
    const positions = new Float32Array([
      -length,
      -length,
      -length,
      length,
      -length,
      -length,
      length,
      length,
      -length,
      -length,
      length,
      -length,

      -length,
      -length,
      length,
      length,
      -length,
      length,
      length,
      length,
      length,
      -length,
      length,
      length,
    ]);

    const primitive = Primitive.createPrimitive({
      indices: indices,
      attributeCompositionTypes: [CompositionType.Vec3],
      attributeSemantics: [VertexAttribute.Position],
      attributes: [positions],
      primitiveMode: PrimitiveMode.LineLoop,
    });

    return primitive;
  }
}
