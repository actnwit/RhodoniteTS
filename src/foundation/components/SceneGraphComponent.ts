import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import EntityRepository from '../core/EntityRepository';
import {ComponentType} from '../definitions/ComponentType';
import {WellKnownComponentTIDs} from './WellKnownComponentTIDs';
import {BufferUse} from '../definitions/BufferUse';
import {ProcessStage} from '../definitions/ProcessStage';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableMatrix33 from '../math/MutableMatrix33';
import Vector3 from '../math/Vector3';
import AABB from '../math/AABB';
import MutableVector3 from '../math/MutableVector3';
import MeshComponent from './MeshComponent';
import AnimationComponent from './AnimationComponent';
import {ComponentTID, ComponentSID, EntityUID} from '../../types/CommonTypes';
import CameraComponent from './CameraComponent';
import Vector4 from '../math/Vector4';
import AABBGizmo from '../gizmos/AABBGizmo';
import LocatorGizmo from '../gizmos/LocatorGizmo';

export default class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent;
  private static __sceneGraphs: SceneGraphComponent[] = [];
  public isAbleToBeParent: boolean;
  private __children: Array<SceneGraphComponent> = [];
  private _worldMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate = false;
  private __isNormalMatrixUpToDate = false;
  private __tmpMatrix = MutableMatrix44.identity();
  private static _isAllUpdate = false;
  private __worldAABB = new AABB();
  private __isWorldAABBDirty = true;
  private static readonly __originVector3 = Vector3.zero();
  private static returnVector3 = MutableVector3.zero();
  public isVisible = true;
  private __animationComponent?: AnimationComponent;
  private __aabbGizmo = new AABBGizmo(this);
  private __locatorGizmo = new LocatorGizmo(this);
  private static isJointAABBShouldBeCalculated = false;

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
      this.__aabbGizmo.setup();
    }
    this.__aabbGizmo.isVisible = flg;
  }

  get isAABBGizmoVisible() {
    return this.__aabbGizmo.isVisible;
  }

  set isLocatorGizmoVisible(flg: boolean) {
    if (flg) {
      this.__locatorGizmo.setup();
    }
    this.__locatorGizmo.isVisible = flg;
  }

  get isLocatorGizmoVisible() {
    return this.__locatorGizmo.isVisible;
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

  addChild(sg: SceneGraphComponent) {
    if (this.__children != null) {
      sg.__parent = this;
      this.__children.push(sg);
    } else {
      console.error('This is not allowed to have children.');
    }
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
      this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively(false)); //this.isJoint()));
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

  get entityWorldMatrix() {
    return this.entity.worldMatrix as MutableMatrix44;
  }

  get entityWorldMatrixInner() {
    return this.entity.worldMatrixInner as MutableMatrix44;
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

  calcWorldMatrixRecursively(isJointMode: boolean): MutableMatrix44 {
    if (this.__isWorldMatrixUpToDate) {
      return this._worldMatrix;
    }

    const entity = this.__entityRepository.getEntity(this.__entityUid);
    const transform = entity.getTransform();

    if (this.__parent == null || (isJointMode && this.__parent?.isJoint())) {
      return transform.matrixInner;
    }

    const matrixFromAncestorToParent =
      this.__parent.calcWorldMatrixRecursively(isJointMode);
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
      const meshComponent = elem.entity.getMesh();

      if (meshComponent?.mesh != null) {
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
  ) {
    const collectedSgComponents = SceneGraphComponent.flattenHierarchy(
      this,
      false
    );
    const meshComponents: MeshComponent[] = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.getMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }

    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition = null;
    let selectedMeshComponent = null;
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
      const {t, intersectedPositionInWorld} = meshComponent.castRay(
        srcPointInWorld,
        directionInWorld,
        dotThreshold
      );
      if (t < rayDistance) {
        rayDistance = t;
        intersectedPosition = intersectedPositionInWorld;
        selectedMeshComponent = meshComponent;
      }
    }

    if (rayDistance === Number.MAX_VALUE) {
      rayDistance = -1;
    }

    return {intersectedPosition, rayDistance, selectedMeshComponent};
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
  ) {
    const collectedSgComponents = SceneGraphComponent.flattenHierarchy(
      this,
      false
    );
    const meshComponents: MeshComponent[] = [];
    for (const sg of collectedSgComponents) {
      const mesh = sg.entity.getMesh();
      if (mesh) {
        meshComponents.push(mesh);
      }
    }

    let rayDistance = Number.MAX_VALUE;
    let intersectedPosition = null;
    let selectedMeshComponent = null;
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
      const {t, intersectedPositionInWorld} = meshComponent.castRayFromScreen(
        x,
        y,
        camera,
        viewport,
        dotThreshold
      );
      if (t < rayDistance) {
        rayDistance = t;
        intersectedPosition = intersectedPositionInWorld;
        selectedMeshComponent = meshComponent;
      }
    }

    if (rayDistance === Number.MAX_VALUE) {
      rayDistance = -1;
    }

    return {intersectedPosition, rayDistance, selectedMeshComponent};
  }

  $create() {
    this.__animationComponent = this.entity.getComponent(
      AnimationComponent
    ) as AnimationComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    this._worldMatrix.copyComponents(this.calcWorldMatrixRecursively(false));

    this.__updateGizmos();

    const mesh = this.entity.getMesh()?.mesh;
    if (mesh) {
      const primitiveNum = mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        if (primitive.isPositionAccessorUpdated) {
          this.setWorldAABBDirtyParentRecursively();
          break;
        }
      }
    }
  }

  private __updateGizmos() {
    if (this.__aabbGizmo.isSetup && this.__aabbGizmo.isVisible) {
      this.__aabbGizmo.update();
    }
    if (this.__locatorGizmo.isSetup && this.__locatorGizmo.isVisible) {
      this.__locatorGizmo.update();
    }
  }
}
ComponentRepository.registerComponentClass(SceneGraphComponent);
