import ComponentRepository from '../../core/ComponentRepository';
import Component from '../../core/Component';
import EntityRepository, { applyMixins } from '../../core/EntityRepository';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {ProcessStage} from '../../definitions/ProcessStage';
import Vector3 from '../../math/Vector3';
import CameraComponent from '../Camera/CameraComponent';
import Vector4 from '../../math/Vector4';
import Mesh from '../../geometry/Mesh';
import Entity, {IEntity} from '../../core/Entity';
import {
  ComponentTID,
  EntityUID,
  ComponentSID,
} from '../../../types/CommonTypes';
import SceneGraphComponent from '../SceneGraph/SceneGraphComponent';
import Matrix44 from '../../math/Matrix44';
import MutableMatrix44 from '../../math/MutableMatrix44';
import MathClassUtil from '../../math/MathClassUtil';
import MutableVector3 from '../../math/MutableVector3';
import {ProcessApproachEnum} from '../../definitions/ProcessApproach';
import {Is} from '../../misc/Is';
import {IMeshEntity} from '../../helpers/EntityHelper';
import BlendShapeComponent from '../BlendShape/BlendShapeComponent';
import {ComponentToComponentMethods} from '../ComponentTypes';

export default class MeshComponent extends Component {
  private __viewDepth = -Number.MAX_VALUE;
  private __mesh?: Mesh;
  private __blendShapeComponent?: BlendShapeComponent;
  private __sceneGraphComponent?: SceneGraphComponent;
  public isPickable = true;

  private static __tmpVector3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_2: MutableVector3 = MutableVector3.zero();
  private static __returnVector3: MutableVector3 = MutableVector3.zero();

  private static __tmpMatrix44_0: MutableMatrix44 = MutableMatrix44.zero();

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);

    this.moveStageTo(ProcessStage.Create);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshComponentTID;
  }

  setMesh(mesh: Mesh) {
    this.__mesh = mesh;
    mesh._attachedEntityUID = this.entityUID;
  }

  unsetMesh() {
    if (this.__mesh == null) {
      return false;
    }
    this.__mesh._attachedEntityUID = Entity.invalidEntityUID;
    this.__mesh = void 0;

    return true;
  }

  get mesh() {
    return this.__mesh;
  }

  set weights(value: number[]) {
    if (this.__mesh == null) {
      return;
    }
    //    this.__mesh!.makeVerticesSeparated();
    this.__mesh.weights = value;
  }

  calcViewDepth(cameraComponent: CameraComponent) {
    const centerPosition_inLocal = this.__mesh!.AABB.centerPoint;
    const skeletal = this.entity.tryToGetSkeletal();
    if (Is.exist(skeletal) && Is.exist(skeletal._bindShapeMatrix)) {
      skeletal._bindShapeMatrix.multiplyVector3To(
        this.__mesh!.AABB.centerPoint,
        centerPosition_inLocal
      );
    }

    const worldMatrixInner = this.entity.getSceneGraph()!.worldMatrixInner;
    const centerPosition_inWorld = worldMatrixInner.multiplyVector3To(
      centerPosition_inLocal,
      MeshComponent.__tmpVector3_0
    );

    const viewMatrix = cameraComponent.viewMatrix;
    const centerPosition_inView = viewMatrix.multiplyVector3To(
      centerPosition_inWorld,
      MeshComponent.__tmpVector3_1
    );
    this.__viewDepth = centerPosition_inView.z;

    return this.__viewDepth;
  }

  get viewDepth() {
    return this.__viewDepth;
  }

  static alertNoMeshSet(meshComponent: MeshComponent) {
    console.debug(
      'No mesh is set on this MeshComponent:' + meshComponent.componentSID
    );
  }

  castRay(
    srcPointInWorld: Vector3,
    directionInWorld: Vector3,
    dotThreshold = 0
  ) {
    if (this.__mesh) {
      let srcPointInLocal = srcPointInWorld;
      let directionInLocal = directionInWorld;
      if (this.__sceneGraphComponent) {
        const invWorldMatrix = Matrix44.invert(
          this.__sceneGraphComponent.worldMatrixInner
        );
        srcPointInLocal = Vector3.fromCopyVector4(
          invWorldMatrix.multiplyVector(
            Vector4.fromCopyVector3(srcPointInWorld)
          )
        );
        const distVecInWorld = Vector3.add(srcPointInWorld, directionInWorld);
        const distVecInLocal = Vector3.fromCopyVector4(
          invWorldMatrix.multiplyVector(Vector4.fromCopyVector3(distVecInWorld))
        );
        directionInLocal = Vector3.normalize(
          Vector3.subtract(distVecInLocal, srcPointInLocal)
        );

        const {t, intersectedPosition} = this.__mesh.castRay(
          srcPointInLocal,
          directionInLocal,
          dotThreshold
        );
        let intersectPositionInWorld = null;
        if (t >= 0) {
          intersectPositionInWorld = Vector3.fromCopyVector4(
            this.__sceneGraphComponent.worldMatrixInner.multiplyVector(
              Vector4.fromCopyVector3(intersectedPosition!)
            )
          );
        }

        return {t, intersectedPositionInWorld: intersectPositionInWorld};
      }
    }

    return {t: -1, intersectedPositionInWorld: undefined};
  }

  castRayFromScreen(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    dotThreshold = 0
  ) {
    if (this.__mesh) {
      if (this.__sceneGraphComponent) {
        const invPVW = MutableMatrix44.multiplyTo(
          camera.projectionMatrix,
          camera.viewMatrix,
          MeshComponent.__tmpMatrix44_0
        )
          .multiply(this.__sceneGraphComponent.worldMatrixInner)
          .invert();

        const srcPointInLocal = MathClassUtil.unProjectTo(
          x,
          y,
          0,
          invPVW,
          viewport,
          MeshComponent.__tmpVector3_0
        );
        const distVecInLocal = MathClassUtil.unProjectTo(
          x,
          y,
          1,
          invPVW,
          viewport,
          MeshComponent.__tmpVector3_1
        );

        const directionInLocal = MutableVector3.subtractTo(
          distVecInLocal,
          srcPointInLocal,
          MeshComponent.__tmpVector3_2
        ).normalize();

        const {t, intersectedPosition} = this.__mesh.castRay(
          srcPointInLocal,
          directionInLocal,
          dotThreshold
        );
        let intersectedPositionInWorld = null;
        if (intersectedPosition != null && t >= 0) {
          intersectedPositionInWorld =
            this.__sceneGraphComponent.worldMatrixInner.multiplyVector3To(
              intersectedPosition,
              MeshComponent.__returnVector3
            );
        }

        return {t, intersectedPositionInWorld};
      }
    }

    return {t: -1, intersectedPositionInWorld: undefined};
  }

  $create() {
    this.__blendShapeComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      BlendShapeComponent
    ) as BlendShapeComponent;
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      SceneGraphComponent
    ) as SceneGraphComponent;

    this.moveStageTo(ProcessStage.Load);
  }

  static common_$load({
    processApproach,
  }: {
    processApproach: ProcessApproachEnum;
  }) {
    // check for the need to update VBO
    const componentRepository = ComponentRepository.getInstance();
    const meshComponents = componentRepository.getComponentsWithType(
      MeshComponent
    ) as MeshComponent[];
    for (const meshComponent of meshComponents) {
      const mesh = meshComponent.mesh as Mesh;
      if (!Is.exist(mesh)) {
        continue;
      }

      const primitiveNum = mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        if (primitive.isPositionAccessorUpdated) {
          const meshRendererComponent =
            meshComponent.entity.tryToGetMeshRenderer();
          meshRendererComponent?.moveStageTo(ProcessStage.Load);
        }
      }
    }
  }

  $load() {
    if (this.__mesh == null) {
      return;
    }
    //    this.__mesh!.makeVerticesSeparated();
    this.__mesh._calcTangents();
    this.__mesh._calcArenbergInverseMatrices();
    // this.__mesh.__initMorphPrimitives();
    this.__mesh!._calcFaceNormalsIfNonNormal();
    if (
      this.__blendShapeComponent &&
      this.__blendShapeComponent.weights.length > 0
    ) {
      this.__mesh!._calcBaryCentricCoord();
    }
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {}

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): IMeshEntity {
    return this.__entityRepository.getEntity(
      this.__entityUid
    ) as unknown as IMeshEntity;
  }

  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class MeshEntity extends (base.constructor as any) {
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getMesh() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.MeshComponentTID
        ) as MeshComponent;
      }
    }
    applyMixins(base, MeshEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}

ComponentRepository.registerComponentClass(MeshComponent);