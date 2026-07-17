import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import type { ShapeComponent } from '../components/Shape/ShapeComponent';
import type { ShapeInstance } from '../geometry/Shape';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { MeshHelper } from '../helpers/MeshHelper';
import type { Material } from '../materials/core/Material';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';

/** Displays every analytic shape stored in a ShapeComponent. */
export class ShapeGizmo extends Gizmo {
  protected declare __topEntity?: ISceneGraphEntity;
  private readonly __shapeComponent: ShapeComponent;
  private __material?: Material;
  private __shapeEntities: ISceneGraphEntity[] = [];

  constructor(engine: Engine, shapeComponent: ShapeComponent) {
    super(engine, shapeComponent.entity as ISceneGraphEntity);
    this.__shapeComponent = shapeComponent;
  }

  get isSetup(): boolean {
    return Is.exist(this.__topEntity);
  }

  /** Root entity to register in a dedicated or existing gizmo render pass. */
  get topEntity(): ISceneGraphEntity | undefined {
    return this.__topEntity;
  }

  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }
    this.__topEntity = createGroupEntity(this.__engine);
    this.__topEntity.tryToSetUniqueName(`ShapeGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.__target.getSceneGraph()._addGizmoChild(this.__topEntity.getSceneGraph());

    this.__material = MaterialHelper.createPbrUberMaterial(this.__engine, {
      isLighting: false,
      isSkinning: false,
      isMorphing: false,
      maxInstancesNumber: 1,
    });
    this.__material.addShaderDefine('RN_USE_WIREFRAME');
    this.__material.setParameter('wireframe', Vector3.fromCopy3(1, 0, 1));
    this.__material.setParameter('baseColorFactor', Vector4.fromCopy4(0, 1, 0, 1));
    this.__populateShapes();
    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'Shape' });
    this._update();
    this.__setVisible(this.isVisible);
  }

  _update(): void {
    if (this.__topEntity == null) {
      return;
    }
    const targetSceneGraph = this.__target.getSceneGraph();
    this.__target.getTransform().$logic();
    targetSceneGraph.logicForce();
    this.__topEntity.getTransform().localMatrixWithoutPhysics = targetSceneGraph.matrixInner;
  }

  rebuild(): void {
    if (!this.isSetup || this.__material == null) {
      return;
    }
    for (const entity of this.__shapeEntities) {
      this.__engine.entityRepository.deleteEntityRecursively(entity.entityUID);
    }
    this.__shapeEntities.length = 0;
    this.__populateShapes();
    this.__setVisible(this.isVisible);
  }

  _destroy(): void {
    if (this.__topEntity != null) {
      this.__engine.entityRepository.deleteEntityRecursively(this.__topEntity.entityUID);
    }
    this.__topEntity = undefined;
    this.__shapeEntities.length = 0;
    this.__material = undefined;
  }

  private __populateShapes(): void {
    for (const [index, instance] of this.__shapeComponent._getShapeEntries()) {
      this.__addShape(instance, index, this.__material!);
    }
  }

  private __addShape(
    instance: ShapeInstance,
    index: number,
    material: ReturnType<typeof MaterialHelper.createPbrUberMaterial>
  ) {
    const group = createGroupEntity(this.__engine);
    group.tryToSetUniqueName(`ShapeGizmo_${index}_of_${this.__target.uniqueName}`, true);
    group.localPosition = instance.localPosition;
    group.localRotation = instance.localRotation;
    this.__topEntity!.addChild(group.getSceneGraph());
    this.__shapeEntities.push(group);

    const shape = instance.shape;
    if (shape.type === 'box') {
      this.__addMesh(group, MeshHelper.createCube(this.__engine, { widthVector: shape.size, material }));
    } else if (shape.type === 'sphere') {
      this.__addMesh(group, MeshHelper.createSphere(this.__engine, { radius: shape.radius, material }));
    } else if (shape.type === 'cylinder') {
      this.__addMesh(
        group,
        MeshHelper.createCylinder(this.__engine, {
          height: shape.height,
          radiusBottom: shape.radiusBottom,
          radiusTop: shape.radiusTop,
          material,
        })
      );
    } else if (shape.radiusBottom === shape.radiusTop) {
      this.__addMesh(
        group,
        MeshHelper.createCapsule(this.__engine, {
          height: shape.height,
          radius: shape.radiusBottom,
          material,
        })
      );
    } else {
      this.__addMesh(
        group,
        MeshHelper.createCylinder(this.__engine, {
          height: shape.height,
          radiusBottom: shape.radiusBottom,
          radiusTop: shape.radiusTop,
          material,
        })
      );
      const bottom = MeshHelper.createSphere(this.__engine, { radius: shape.radiusBottom, material });
      bottom.localPosition = Vector3.fromCopy3(0, -shape.height / 2, 0);
      this.__addMesh(group, bottom);
      const top = MeshHelper.createSphere(this.__engine, { radius: shape.radiusTop, material });
      top.localPosition = Vector3.fromCopy3(0, shape.height / 2, 0);
      this.__addMesh(group, top);
    }
  }

  private __addMesh(parent: ISceneGraphEntity, mesh: IMeshEntity): void {
    mesh.getMesh().calcBaryCentricCoord();
    mesh.tryToSetTag({ tag: 'Gizmo', value: 'Shape' });
    parent.addChild(mesh.getSceneGraph());
  }
}
