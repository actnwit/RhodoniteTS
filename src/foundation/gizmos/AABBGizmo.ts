import Gizmo from './Gizmo';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import {VertexAttribute} from '../definitions/VertexAttribute';
import {CompositionType} from '../definitions/CompositionType';
import Primitive from '../geometry/Primitive';
import AABB from '../math/AABB';
import RnObject from '../core/RnObject';
import Vector3 from '../math/Vector3';
import Mesh from '../geometry/Mesh';

export default class AABBGizmo extends Gizmo {
  private static __aabbMesh?: Mesh;
  constructor(substance: RnObject) {
    super(substance);
  }

  get isSetup() {
    if (this.__topEntity != null) {
      return true;
    } else {
      return false;
    }
  }

  setup(): void {
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
    AABBGizmo.__aabbMesh = new Mesh();
    AABBGizmo.__aabbMesh.addPrimitive(AABBGizmo.generatePrimitive());
    meshComponent.setMesh(AABBGizmo.__aabbMesh);
    // } else {
    //   const mesh = new Mesh();
    //   mesh.setOriginalMesh(AABBGizmo.__aabbMesh);
    //   meshComponent.setMesh(mesh);
    // }

    this.setGizmoTag();
  }

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
      attributeCompositionTypes: [CompositionType.Vec3],
      attributeSemantics: [VertexAttribute.Position],
      attributes: [positions],
      primitiveMode: PrimitiveMode.Lines,
    });

    return primitive;
  }

  update(): void {
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
}
