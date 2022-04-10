import { ComponentRepository } from '../../core/ComponentRepository';
import Component from '../../core/Component';
import Matrix44 from '../../math/Matrix44';
import {applyMixins, EntityRepository} from '../../core/EntityRepository';
import {ComponentType} from '../../definitions/ComponentType';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {BufferUse} from '../../definitions/BufferUse';
import {ProcessStage} from '../../definitions/ProcessStage';
import MutableMatrix44 from '../../math/MutableMatrix44';
import MutableMatrix33 from '../../math/MutableMatrix33';
import { Vector3 } from '../../math/Vector3';
import AABB from '../../math/AABB';
import MutableVector3 from '../../math/MutableVector3';
import { MeshComponent } from '../Mesh/MeshComponent';
import {
  ComponentTID,
  ComponentSID,
  EntityUID,
} from '../../../types/CommonTypes';
import CameraComponent from '../Camera/CameraComponent';
import { Vector4 } from '../../math/Vector4';
import AABBGizmo from '../../gizmos/AABBGizmo';
import LocatorGizmo from '../../gizmos/LocatorGizmo';
import {Is} from '../../misc/Is';
import {
  ISceneGraphEntity,
  IMeshEntity,
  ITransformEntity,
} from '../../helpers/EntityHelper';
import {IEntity} from '../../core/Entity';
import {ComponentToComponentMethods} from '../ComponentTypes';
import {RaycastResultEx2} from '../../geometry/types/GeometryTypes';
import TranslationGizmo from '../../gizmos/TranslationGizmo';
import ScaleGizmo from '../../gizmos/ScaleGizmo';
import {IMatrix44} from '../../math/IMatrix';

export class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent;
  private static __sceneGraphs: SceneGraphComponent[] = [];
  public isAbleToBeParent: boolean;
  private __children: Array<SceneGraphComponent> = [];
  private __gizmoChildren: Array<SceneGraphComponent> = [];
  private _worldMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate = false;
  private __isNormalMatrixUpToDate = false;
  private __tmpMatrix = MutableMatrix44.identity();
  private __worldAABB = new AABB();
  private __isWorldAABBDirty = true;
  private static readonly __originVector3 = Vector3.zero();
  private static returnVector3 = MutableVector3.zero();
  public isVisible = true;
  private __aabbGizmo?: AABBGizmo;
  private __locatorGizmo?: LocatorGizmo;
  private __translationGizmo?: TranslationGizmo;
  private __scaleGizmo?: ScaleGizmo;
  private __transformGizmoSpace: 'local' | 'world' = 'world';
  private static isJointAABBShouldBeCalculated = false;
  public toMakeWorldMatrixTheSameAsLocalMatrix = false;
  private __latestPrimitivePositionAccessorVersion = 0;

  // Skeletal
  public isRootJoint = false;
  public jointIndex = -1;

  private static invertedMatrix44 = new MutableMatrix44([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);

    SceneGraphComponent.__sceneGraphs.push(this);

    this.isAbleToBeParent = false;
    this.beAbleToBeParent(true);
    this.registerMember(
      BufferUse.GPUInstanceData,
      'worldMatrix',
      MutableMatrix44,
      ComponentType.Float,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    this.registerMember(
      BufferUse.GPUInstanceData,
      'normalMatrix',
      MutableMatrix33,
      ComponentType.Float,
      [1, 0, 0, 0, 1, 0, 0, 0, 1]
    );

    this.submitToAllocation(this.maxNumberOfComponent);
  }

  set isAABBGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__aabbGizmo)) {
        this.__aabbGizmo = new AABBGizmo(this.entity);
        this.__aabbGizmo._setup();
      }
      this.__aabbGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__aabbGizmo)) {
        this.__aabbGizmo.isVisible = false;
      }
    }
  }

  get isAABBGizmoVisible() {
    if (Is.exist(this.__aabbGizmo)) {
      return this.__aabbGizmo.isVisible;
    } else {
      return false;
    }
  }

  set isLocatorGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__locatorGizmo)) {
        this.__locatorGizmo = new LocatorGizmo(this.entity as IMeshEntity);
        this.__locatorGizmo._setup();
      }
      this.__locatorGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__locatorGizmo)) {
        this.__locatorGizmo.isVisible = false;
      }
    }
  }

  get isLocatorGizmoVisible() {
    if (Is.exist(this.__locatorGizmo)) {
      return this.__locatorGizmo.isVisible;
    } else {
      return false;
    }
  }

  set isTranslationGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__translationGizmo)) {
        this.__translationGizmo = new TranslationGizmo(
          this.entity as IMeshEntity
        );
        this.__translationGizmo._setup();
      }
      this.__translationGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__translationGizmo)) {
        this.__translationGizmo.isVisible = false;
      }
    }
  }

  get isTranslationGizmoVisible() {
    if (Is.exist(this.__translationGizmo)) {
      return this.__translationGizmo.isVisible;
    } else {
      return false;
    }
  }

  set isScaleGizmoVisible(flg: boolean) {
    if (flg) {
      if (Is.not.defined(this.__scaleGizmo)) {
        this.__scaleGizmo = new ScaleGizmo(this.entity as IMeshEntity);
        this.__scaleGizmo._setup();
      }
      this.__scaleGizmo.isVisible = true;
    } else {
      if (Is.exist(this.__scaleGizmo)) {
        this.__scaleGizmo.isVisible = false;
      }
    }
  }

  get isScaleGizmoVisible() {
    if (Is.exist(this.__scaleGizmo)) {
      return this.__scaleGizmo.isVisible;
    } else {
      return false;
    }
  }

  static getTopLevelComponents(): SceneGraphComponent[] {
    return SceneGraphComponent.__sceneGraphs.filter(
      (sg: SceneGraphComponent) => {
        return sg.isTopLevel;
      }
    );
  }

  isJoint() {
    if (this.jointIndex >= 0) {
      return true;
    } else {
      return false;
    }
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  beAbleToBeParent(flag: boolean) {
    this.isAbleToBeParent = flag;
  }

  setWorldMatrixDirty() {
    this.setWorldMatrixDirtyRecursively();
    this.parent?.setWorldAABBDirtyParentRecursively();
  }

  setWorldMatrixDirtyRecursively() {
    this.__isWorldMatrixUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__isWorldAABBDirty = true;

    this.children.forEach(child => {
      child.setWorldMatrixDirtyRecursively();
    });
  }

  setWorldAABBDirtyParentRecursively() {
    this.__isWorldAABBDirty = true;
    this.parent?.setWorldAABBDirtyParentRecursively();
  }

  /**
   * add a SceneGraph component as a child of this
   * @param sg a SceneGraph component
   */
  public addChild(sg: SceneGraphComponent): void {
    if (Is.exist(sg.__parent)) {
      sg.__parent.removeChild(sg);
    }
    sg.__parent = this;
    this.__children.push(sg);
  }

  /**
   * remove the child SceneGraph component from this
   * @param sg a SceneGraph component
   */
  public removeChild(sg: SceneGraphComponent): void {
    const index = this.__children.indexOf(sg);
    if (index >= 0) {
      this.__children.splice(index, 1);
    }
    sg.__parent = undefined;
  }

  /**
   * add a SceneGraph component as a child of this (But Gizmo only)
   * @param sg a SceneGraph component of Gizmo
   */
  _addGizmoChild(sg: SceneGraphComponent): void {
    sg.__parent = this;
    this.__gizmoChildren.push(sg);
  }

  get isTopLevel() {
    return this.__parent == null;
  }

  get children() {
    return this.__children;
  }

  get parent() {
    return this.__parent;
  }

  get worldMatrixInner() {
    if (!this.__isWorldMatrixUpToDate) {
      this._worldMatrix.copyComponents(this.__calcWorldMatrixRecursively());
      this.__isWorldMatrixUpToDate = true;
    }

    return this._worldMatrix;
  }

  get worldMatrix() {
    return this.worldMatrixInner.clone();
  }

  get normalMatrixInner() {
    if (!this.__isNormalMatrixUpToDate) {
      Matrix44.invertTo(
        this.worldMatrixInner,
        SceneGraphComponent.invertedMatrix44
      );
      this._normalMatrix.copyComponents(
        SceneGraphComponent.invertedMatrix44.transpose()
      );
      this.__isNormalMatrixUpToDate = true;
    }
    return this._normalMatrix;
  }

  get entityWorldMatrix(): MutableMatrix44 {
    return this.entityWorldMatrixInner.clone();
  }

  get entityWorldMatrixInner(): MutableMatrix44 {
    const skeletalComponent = this.entity.tryToGetSkeletal();
    if (Is.exist(skeletalComponent) && skeletalComponent.isWorldMatrixUpdated) {
      return skeletalComponent.worldMatrixInner;
    } else {
      const sceneGraphComponent = this.entity.getSceneGraph();
      return sceneGraphComponent.worldMatrixInner;
    }
  }

  get normalMatrix() {
    return this.normalMatrixInner.clone();
  }

  isWorldMatrixUpToDateRecursively(): boolean {
    if (this.__isWorldMatrixUpToDate) {
      if (this.__parent) {
        const result = this.__parent.isWorldMatrixUpToDateRecursively();
        return result;
      } else {
        return true;
      }
    }
    return false;
  }

  private __calcWorldMatrixRecursively(): MutableMatrix44 {
    if (this.__isWorldMatrixUpToDate) {
      return this._worldMatrix;
    }

    const entity = EntityRepository.getEntity(
      this.__entityUid
    ) as ITransformEntity;
    const transform = entity.getTransform()!;

    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      return transform.matrixInner;
    }

    const matrixFromAncestorToParent =
      this.__parent.__calcWorldMatrixRecursively();
    return MutableMatrix44.multiplyTo(
      matrixFromAncestorToParent,
      transform.matrixInner,
      this.__tmpMatrix
    );
  }

  /**
   * Collects children and itself from specified sceneGraphComponent.
   * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
   * @param isJointMode collects joints only
   */
  static flattenHierarchy(
    sceneGraphComponent: SceneGraphComponent,
    isJointMode: Boolean
  ): SceneGraphComponent[] {
    const results: SceneGraphComponent[] = [];
    if (!isJointMode || sceneGraphComponent.isJoint()) {
      results.push(sceneGraphComponent);
    }
    if (sceneGraphComponent.isAbleToBeParent) {
      const children = sceneGraphComponent.children!;
      for (let i = 0; i < children.length; i++) {
        const hitChildren = this.flattenHierarchy(children[i], isJointMode);
        Array.prototype.push.apply(results, hitChildren);
      }
    }

    return results;
  }

  get worldPosition(): Vector3 {
    const zeroVector = SceneGraphComponent.__originVector3;
    this.worldMatrixInner.multiplyVector3To(
      zeroVector,
      SceneGraphComponent.returnVector3
    );
    return SceneGraphComponent.returnVector3 as Vector3;
  }

  getWorldPositionOf(localPosition: Vector3) {
    return this.worldMatrixInner.multiplyVector3(localPosition);
  }

  getLocalPositionOf(worldPosition: Vector3): Vector3 {
    return Matrix44.invert(this.worldMatrixInner).multiplyVector3(
      worldPosition
    );
  }

  calcWorldAABB() {
    this.__worldAABB.initialize();
    const aabb = (function mergeAABBRecursively(
      elem: SceneGraphComponent
    ): AABB {
      const meshComponent = elem.entity.tryToGetMesh();
      if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
        AABB.multiplyMatrixTo(
          elem.entityWorldMatrixInner,
          meshComponent.mesh.AABB,
          elem.__worldAABB
        );
      }

      const children = elem.children;
      for (let i = 0; i < children.length; i++) {
        const aabb = mergeAABBRecursively(children[i]);
        elem.__worldAABB.mergeAABB(aabb);
      }

      return elem.__worldAABB;
    })(this);

    return aabb;
  }

  private get __shouldJointWorldAabbBeCalculated() {
    return !SceneGraphComponent.isJointAABBShouldBeCalculated && this.isJoint();
  }

  get worldAABB() {
    if (this.__shouldJointWorldAabbBeCalculated) {
      return this.__worldAABB;
    }

    if (this.__isWorldAABBDirty) {
      this.calcWorldAABB();
      this.__isWorldAABBDirty = false;
    } else {
      // console.count('skipped')
    }
    return this.__worldAABB;
  }

  setVisibilityRecursively(flag: boolean) {
    this.isVisible = flag;
    for (const child of this.__children) {
      child.setVisibilityRecursively(flag);
    }
  }

  /**
   * castRay Methods
   *
   * @param srcPointInWorld a source position in world space
   * @param directionInWorld a direction vector in world space
   * @param dotThreshold threshold of the intersected triangle and the ray
   * @param ignoreMeshComponents mesh components to ignore
   * @returns information of intersection in world space
   */
  public castRay(
    srcPointInWorld: Vector3,
    directionInWorld: Vector3,
    dotThreshold = 0,
    ignoreMeshComponents: MeshComponent[] = []
  ): RaycastResultEx2 {
    const collectedSgComponents = SceneGraphComponent.flattenHierarchy(
      this,
      false
    );
    const meshComponents: MeshComponent[] = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.tryToGetMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }

    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition = undefined;
    let selectedMeshComponent = undefined;
    let u = 0;
    let v = 0;
    for (const meshComponent of meshComponents) {
      if (!meshComponent.entity.getSceneGraph()!.isVisible) {
        continue;
      }
      if (!meshComponent.isPickable) {
        continue;
      }
      if (ignoreMeshComponents.indexOf(meshComponent) !== -1) {
        continue;
      }
      const result = meshComponent.castRay(
        srcPointInWorld,
        directionInWorld,
        dotThreshold
      );
      if (Is.defined(result.data) && result.data.t < rayDistance) {
        rayDistance = result.data.t;
        intersectedPosition = result.data.position;
        selectedMeshComponent = meshComponent;
        u = result.data.u;
        v = result.data.v;
      }
    }

    if (Is.exist(selectedMeshComponent) && Is.exist(intersectedPosition)) {
      return {
        result: true,
        data: {
          t: rayDistance,
          u,
          v,
          position: intersectedPosition,
          selectedMeshComponent,
        },
      };
    } else {
      return {
        result: false,
      };
    }
  }

  /**
   * castRayFromScreen Methods
   *
   * @param x x position of screen
   * @param y y position of screen
   * @param camera a camera component
   * @param viewport a viewport vector4
   * @param dotThreshold threshold of the intersected triangle and the ray
   * @param ignoreMeshComponents mesh components to ignore
   * @returns information of intersection in world space
   */
  castRayFromScreen(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    dotThreshold = 0,
    ignoreMeshComponents: MeshComponent[] = []
  ): RaycastResultEx2 {
    const collectedSgComponents = SceneGraphComponent.flattenHierarchy(
      this,
      false
    );
    const meshComponents: MeshComponent[] = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.tryToGetMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }

    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition = undefined;
    let selectedMeshComponent = undefined;
    let u = 0;
    let v = 0;
    for (const meshComponent of meshComponents) {
      if (!meshComponent.entity.getSceneGraph().isVisible) {
        continue;
      }
      if (!meshComponent.isPickable) {
        continue;
      }
      if (ignoreMeshComponents.indexOf(meshComponent) !== -1) {
        continue;
      }
      const result = meshComponent.castRayFromScreenInWorld(
        x,
        y,
        camera,
        viewport,
        dotThreshold
      );
      if (Is.defined(result.data) && result.data.t < rayDistance) {
        rayDistance = result.data.t;
        intersectedPosition = result.data.position;
        selectedMeshComponent = meshComponent;
        u = result.data.u;
        v = result.data.v;
      }
    }

    if (Is.exist(selectedMeshComponent) && Is.exist(intersectedPosition)) {
      return {
        result: true,
        data: {
          t: rayDistance,
          u,
          v,
          position: intersectedPosition,
          selectedMeshComponent,
        },
      };
    } else {
      return {
        result: false,
      };
    }
  }

  $create() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    this._worldMatrix.copyComponents(this.__calcWorldMatrixRecursively());

    this.__updateGizmos();

    const meshComponent = this.entity.tryToGetMesh();
    if (Is.exist(meshComponent)) {
      const mesh = meshComponent.mesh;
      if (Is.exist(mesh)) {
        const primitiveNum = mesh.getPrimitiveNumber();
        for (let i = 0; i < primitiveNum; i++) {
          const primitive = mesh!.getPrimitiveAt(i);
          if (
            primitive.positionAccessorVersion !==
            this.__latestPrimitivePositionAccessorVersion
          ) {
            this.setWorldAABBDirtyParentRecursively();
            this.__latestPrimitivePositionAccessorVersion =
              primitive.positionAccessorVersion!;
            break;
          }
        }
      }
    }
  }

  private __updateGizmos() {
    if (
      Is.exist(this.__aabbGizmo) &&
      this.__aabbGizmo.isSetup &&
      this.__aabbGizmo.isVisible
    ) {
      this.__aabbGizmo._update();
    }
    if (
      Is.exist(this.__locatorGizmo) &&
      this.__locatorGizmo.isSetup &&
      this.__locatorGizmo.isVisible
    ) {
      this.__locatorGizmo._update();
    }
    if (
      Is.exist(this.__translationGizmo) &&
      this.__translationGizmo.isSetup &&
      this.__translationGizmo.isVisible
    ) {
      this.__translationGizmo._update();
    }
    if (
      Is.exist(this.__scaleGizmo) &&
      this.__scaleGizmo.isSetup &&
      this.__scaleGizmo.isVisible
    ) {
      this.__scaleGizmo._update();
    }
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): ISceneGraphEntity {
    return EntityRepository.getEntity(
      this.__entityUid
    ) as unknown as ISceneGraphEntity;
  }

  setTransformGizmoSpace(space: 'local' | 'world') {
    this.__transformGizmoSpace = space;
    this.__translationGizmo?.setSpace(space);
    this.__scaleGizmo?.setSpace(space);
  }

  destroy() {
    // this.__aabbGizmo?.destroy();
    // this.__locatorGizmo?.destroy();
    // this.__translationGizmo?.destroy();
    // this.__scaleGizmo?.destroy();
    // this.__entityRepository.removeEntity(this.__entityUid);
    this.parent?.removeChild(this);
    this.children.forEach(child => child.parent?.removeChild(child));
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<
    EntityBase extends IEntity,
    SomeComponentClass extends typeof Component
  >(base: EntityBase, _componentClass: SomeComponentClass) {
    class SceneGraphEntity extends (base.constructor as any) {
      private __sceneGraphcomponent?: SceneGraphComponent;
      constructor(
        entityUID: EntityUID,
        isAlive: Boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getSceneGraph() {
        if (this.__sceneGraphComponent === undefined) {
          this.__sceneGraphComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.SceneGraphComponentTID
          ) as SceneGraphComponent;
        }
        return this.__sceneGraphComponent;
      }
      get worldMatrx(): IMatrix44 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.worldMatrix;
      }
      get worldMatrxInner(): IMatrix44 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.worldMatrixInner;
      }
      addChild(sg: SceneGraphComponent): void {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.addChild(sg);
      }
      get children(): SceneGraphComponent[] {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.children;
      }
      removeChild(sg: SceneGraphComponent): void {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.removeChild(sg);
      }
    }
    applyMixins(base, SceneGraphEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> &
      EntityBase;
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent);
