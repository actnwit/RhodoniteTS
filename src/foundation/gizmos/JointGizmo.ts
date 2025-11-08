import { createMeshEntity } from '../components/MeshRenderer/createMeshEntity';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import { AlphaMode } from '../definitions/AlphaMode';
import { Mesh } from '../geometry/Mesh';
import { Joint } from '../geometry/shapes/Joint';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { MutableQuaternion } from '../math/MutableQuaternion';
import { MutableVector3 } from '../math/MutableVector3';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';
import { Is } from '../misc/Is';
import { Gizmo } from './Gizmo';

type JointVisual = {
  parent: SceneGraphComponent;
  child: SceneGraphComponent;
  primitive: Joint;
  entity: IMeshEntity;
  localPosition: MutableVector3;
  localScale: MutableVector3;
  localRotation: MutableQuaternion;
};

/**
 * JointGizmo renders skeleton joints and their connections for debugging purposes.
 * Each joint pair is visualized using the Joint primitive to highlight skeletal hierarchies.
 */
export class JointGizmo extends Gizmo {
  protected declare __topEntity?: ISceneGraphEntity;

  private __jointVisuals: JointVisual[] = [];

  private static readonly __unitY = Vector3.fromCopyArray3([0, 1, 0]);
  private static readonly __origin = Vector3.fromCopyArray3([0, 0, 0]);
  private static readonly __tmpJointPosition = MutableVector3.zero();
  private static readonly __tmpParentPosition = MutableVector3.zero();
  private static readonly __tmpDirection = MutableVector3.zero();
  private static readonly __tmpScale = MutableVector3.one();
  private static readonly __tmpQuaternion = MutableQuaternion.identity();

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
    this.__topEntity.tryToSetUniqueName(`JointGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.__topEntity.getSceneGraph()!);

    const jointPairs = this.__collectJointPairs(targetSceneGraph);
    for (const pair of jointPairs) {
      const visual = this.__createJointVisual(pair.parent, pair.child);
      if (visual) {
        this.__jointVisuals.push(visual);
      }
    }

    this.setGizmoTag();
    this._update();
  }

  _update(): void {
    if (!Is.exist(this.__topEntity) || this.__jointVisuals.length === 0) {
      return;
    }

    for (const visual of this.__jointVisuals) {
      const parent = visual.parent;
      const child = visual.child;
      if (!child.isJoint() || !parent.isJoint()) {
        visual.entity.getSceneGraph()!.isVisible = false;
        continue;
      }

      const childPos = child.getPositionTo(JointGizmo.__tmpJointPosition);
      const parentPos = parent.getPositionTo(JointGizmo.__tmpParentPosition);
      const direction = JointGizmo.__tmpDirection.copyComponents(parentPos).subtract(childPos);
      const length = direction.length();
      if (length < Number.EPSILON) {
        visual.entity.getSceneGraph()!.isVisible = false;
        continue;
      }
      visual.entity.getSceneGraph()!.isVisible = true;

      direction.divide(length);
      Quaternion.fromToRotationTo(JointGizmo.__unitY, direction, JointGizmo.__tmpQuaternion);

      const width = Math.max(length * 0.15, 0.002);
      const scale = JointGizmo.__tmpScale.setComponents(width, length, width);

      const transform = visual.entity.getTransform()!;
      const position = visual.localPosition.copyComponents(childPos);
      const rotation = visual.localRotation.copyComponents(JointGizmo.__tmpQuaternion);
      const scaled = visual.localScale.copyComponents(scale);
      transform.localPosition = position;
      transform.localRotation = rotation;
      transform.localScale = scaled;
    }
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
    this.__jointVisuals = [];
  }

  private __collectJointPairs(
    sceneGraph: SceneGraphComponent
  ): Array<{ parent: SceneGraphComponent; child: SceneGraphComponent }> {
    const pairs: Array<{ parent: SceneGraphComponent; child: SceneGraphComponent }> = [];

    if (!sceneGraph.isJoint()) {
      return pairs;
    }

    for (const child of sceneGraph.children) {
      if (child.isJoint()) {
        pairs.push({ parent: sceneGraph, child });
      }
    }

    return pairs;
  }

  private __createJointVisual(parent: SceneGraphComponent, child: SceneGraphComponent): JointVisual | undefined {
    if (!Is.exist(this.__topEntity)) {
      return undefined;
    }

    const meshEntity = createMeshEntity();
    meshEntity.tryToSetUniqueName(`JointGizmo_segment_${parent.entity.uniqueName}_${child.entity.uniqueName}`, true);
    meshEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;

    const meshComponent = meshEntity.getMesh();
    const mesh = new Mesh();
    const primitive = new Joint();
    primitive.generate({});
    primitive.setWorldPositions(JointGizmo.__origin, JointGizmo.__unitY, 1);
    primitive.setRenderQueue(7);
    const gizmoMaterial = MaterialHelper.createClassicUberMaterial({ additionalName: 'JointGizmo' });
    gizmoMaterial.alphaMode = AlphaMode.Blend;
    gizmoMaterial.zWriteWhenBlend = false;
    gizmoMaterial.cullFace = false;
    primitive.material = gizmoMaterial;
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);

    this.__topEntity.getSceneGraph()!.addChild(meshEntity.getSceneGraph());

    return {
      entity: meshEntity,
      parent,
      child,
      primitive,
      localPosition: MutableVector3.zero(),
      localScale: MutableVector3.one(),
      localRotation: MutableQuaternion.identity(),
    };
  }
}
