import MeshComponent from '../components/MeshComponent';
import MeshRendererComponent from '../components/MeshRendererComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import TransformComponent from '../components/TransformComponent';
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

  /**
   * Constructor
   * @param substance
   */
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

    LocatorGizmo.__mesh = new Mesh();
    LocatorGizmo.__mesh.addPrimitive(LocatorGizmo.generatePrimitive());
    meshComponent.setMesh(LocatorGizmo.__mesh);

    this.setGizmoTag();
  }

  private static generatePrimitive() {
    const length = 1;
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      length,
      0,
      0,

      // Y axis
      0,
      0,
      0,
      0,
      length,
      0,

      // Z axis
      0,
      0,
      0,
      0,
      0,
      length,
    ]);

    const primitive = Primitive.createPrimitive({
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
