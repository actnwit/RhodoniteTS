import { Component } from '../../core/Component';
import { Matrix44 } from '../../math/Matrix44';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { ComponentType } from '../../definitions/ComponentType';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { BufferUse } from '../../definitions/BufferUse';
import { ProcessStage } from '../../definitions/ProcessStage';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableMatrix33 } from '../../math/MutableMatrix33';
import { Vector3 } from '../../math/Vector3';
import { AABB } from '../../math/AABB';
import { MutableVector3 } from '../../math/MutableVector3';
import { MeshComponent } from '../Mesh/MeshComponent';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { CameraComponent } from '../Camera/CameraComponent';
import { Vector4 } from '../../math/Vector4';
import { AABBGizmo } from '../../gizmos/AABBGizmo';
import { LocatorGizmo } from '../../gizmos/LocatorGizmo';
import { Is } from '../../misc/Is';
import { ISceneGraphEntity, IMeshEntity, ITransformEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { RaycastResultEx2 } from '../../geometry/types/GeometryTypes';
import { TranslationGizmo } from '../../gizmos/TranslationGizmo';
import { ScaleGizmo } from '../../gizmos/ScaleGizmo';
import { IMatrix44 } from '../../math/IMatrix';
import { IQuaternion, IVector3, MutableScalar, Quaternion } from '../../math';
import { OimoPhysicsStrategy } from '../../physics/Oimo/OimoPhysicsStrategy';
import { TransformComponent } from '../Transform/TransformComponent';
import { flattenHierarchy } from './SceneGraphOps';

export class SceneGraphComponent extends Component {
  private __parent?: SceneGraphComponent;
  private __children: SceneGraphComponent[] = [];
  private __gizmoChildren: SceneGraphComponent[] = [];
  private _worldMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _worldMatrixRest: MutableMatrix44 = MutableMatrix44.identity();
  private _normalMatrix: MutableMatrix33 = MutableMatrix33.dummy();
  private __isWorldMatrixUpToDate = false;
  private __isWorldMatrixRestUpToDate = false;
  private __isNormalMatrixUpToDate = false;
  private __worldMergedAABBWithSkeletal = new AABB();
  private __worldMergedAABB = new AABB();
  private __isWorldAABBDirty = true;
  private _isVisible: MutableScalar = MutableScalar.dummy();
  private _isBillboard: MutableScalar = MutableScalar.dummy();
  private __aabbGizmo?: AABBGizmo;
  private __locatorGizmo?: LocatorGizmo;
  private __translationGizmo?: TranslationGizmo;
  private __scaleGizmo?: ScaleGizmo;
  private __transformGizmoSpace: 'local' | 'world' = 'world';
  private __latestPrimitivePositionAccessorVersion = 0;
  public toMakeWorldMatrixTheSameAsLocalMatrix = false;
  // Skeletal
  public isRootJoint = false;
  public jointIndex = -1;
  _isCulled = false;
  private static readonly __originVector3 = Vector3.zero();
  private static returnVector3 = MutableVector3.zero();
  private static __sceneGraphs: WeakRef<SceneGraphComponent>[] = [];
  private static isJointAABBShouldBeCalculated = false;
  private static invertedMatrix44 = MutableMatrix44.fromCopyArray16ColumnMajor([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  private static __tmp_mat4 = MutableMatrix44.identity();
  private static __tmp_mat4_2 = MutableMatrix44.identity();
  private static __tmp_mat4_3 = MutableMatrix44.identity();

  private static __updateCount = -1;

  private static __tmpAABB = new AABB();

  private __lastTransformComponentsUpdateCount = -1;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(entityUid, componentSid, entityRepository, isReUse);

    SceneGraphComponent.__sceneGraphs.push(new WeakRef(this));

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
    this.registerMember(
      BufferUse.GPUInstanceData,
      'isVisible',
      MutableScalar,
      ComponentType.Float,
      [1]
    );
    this.registerMember(
      BufferUse.GPUInstanceData,
      'isBillboard',
      MutableScalar,
      ComponentType.Float,
      [0]
    );

    this.submitToAllocation(this.maxNumberOfComponent, isReUse);
  }

  set isVisible(flg: boolean) {
    this._isVisible.setValue(flg ? 1 : 0);
    SceneGraphComponent.__updateCount++;
  }

  get isVisible() {
    return this._isVisible.getValue() === 1 ? true : false;
  }

  static get updateCount() {
    return SceneGraphComponent.__updateCount;
  }

  setVisibilityRecursively(flag: boolean) {
    this.isVisible = flag;
    for (const child of this.__children) {
      child.setVisibilityRecursively(flag);
    }
  }

  set isBillboard(flg: boolean) {
    this._isBillboard.setValue(flg ? 1 : 0);
  }

  get isBillboard() {
    return this._isBillboard.getValue() === 1 ? true : false;
  }

  setIsBillboardRecursively(flg: boolean) {
    this._isBillboard.setValue(flg ? 1 : 0);
    for (const child of this.__children) {
      child.isBillboard = flg;
    }
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
        this.__translationGizmo = new TranslationGizmo(this.entity as IMeshEntity);
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
    return SceneGraphComponent.__sceneGraphs
      .map((sgRef) => sgRef.deref())
      .filter((sg: SceneGraphComponent | undefined) => {
        if (sg !== undefined) {
          return sg.isTopLevel;
        } else {
          return false;
        }
      })
      .filter((sg) => sg !== undefined);
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

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SceneGraphComponentTID;
  }

  setWorldMatrixRestDirty() {
    this.matrixRestInner;
    this.setWorldMatrixRestDirtyRecursively();
  }

  setWorldMatrixRestDirtyRecursively() {
    this.__isWorldMatrixRestUpToDate = false;
    this.children.forEach((child) => {
      child.setWorldMatrixRestDirtyRecursively();
    });
  }

  setWorldMatrixDirty() {
    this.setWorldMatrixDirtyRecursively();
    this.parent?.setWorldAABBDirtyParentRecursively();
  }

  setWorldMatrixDirtyRecursively() {
    this.__isWorldMatrixUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__isWorldAABBDirty = true;

    this.children.forEach((child) => {
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

  get matrixInner() {
    if (!this.__isWorldMatrixUpToDate) {
      this._worldMatrix.copyComponents(this.__calcWorldMatrixRecursively());
      this.__isWorldMatrixUpToDate = true;
    }

    return this._worldMatrix;
  }

  get matrix() {
    return this.matrixInner.clone();
  }

  get matrixRestInner() {
    if (!this.__isWorldMatrixRestUpToDate) {
      this._worldMatrixRest.copyComponents(this.__calcWorldMatrixRestRecursively());
      this.__isWorldMatrixRestUpToDate = true;
    }

    return this._worldMatrixRest;
  }

  get matrixRest() {
    return this.matrixRestInner.clone();
  }

  get normalMatrixInner() {
    if (!this.__isNormalMatrixUpToDate) {
      Matrix44.invertTo(this.matrixInner, SceneGraphComponent.invertedMatrix44);
      this._normalMatrix.copyComponents(SceneGraphComponent.invertedMatrix44.transpose());
      this.__isNormalMatrixUpToDate = true;
    }
    return this._normalMatrix;
  }

  get entityWorldWithSkeletalMatrix(): MutableMatrix44 {
    return this.entityWorldMatrixWithSkeletalInner.clone();
  }

  get entityWorldMatrixWithSkeletalInner(): MutableMatrix44 {
    const skeletalComponent = this.entity.tryToGetSkeletal();
    if (Is.exist(skeletalComponent) && skeletalComponent.isWorldMatrixUpdated) {
      return skeletalComponent.worldMatrixInner;
    } else {
      const sceneGraphComponent = this.entity.getSceneGraph();
      return sceneGraphComponent.matrixInner;
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

    const transform = this.entity.getTransform()!;

    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_2);
      return SceneGraphComponent.__tmp_mat4_2;
    }

    const matrixFromAncestorToParent = this.__parent.__calcWorldMatrixRecursively();
    transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_3);
    return MutableMatrix44.multiplyTo(
      matrixFromAncestorToParent,
      SceneGraphComponent.__tmp_mat4_3,
      SceneGraphComponent.__tmp_mat4
    );
  }

  private __calcWorldMatrixRestRecursively(): MutableMatrix44 {
    if (this.__isWorldMatrixRestUpToDate) {
      return this._worldMatrixRest;
    }

    const transform = this.entity.getTransform()!;

    if (this.__parent == null || this.toMakeWorldMatrixTheSameAsLocalMatrix) {
      transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_2);
      return SceneGraphComponent.__tmp_mat4_2;
    }

    const matrixFromAncestorToParent = this.__parent.__calcWorldMatrixRestRecursively();
    transform.getLocalMatrixInnerTo(SceneGraphComponent.__tmp_mat4_3);
    return MutableMatrix44.multiplyTo(
      matrixFromAncestorToParent,
      SceneGraphComponent.__tmp_mat4_3,
      SceneGraphComponent.__tmp_mat4
    );
  }

  getQuaternionRecursively(): IQuaternion {
    if (Is.not.exist(this.parent)) {
      return this.entity.getTransform().localRotation;
    }

    const matrixFromAncestorToParent = this.parent.getQuaternionRecursively();
    return Quaternion.multiply(
      matrixFromAncestorToParent,
      this.entity.getTransform().localRotation
    );
  }

  get worldPosition(): Vector3 {
    const zeroVector = SceneGraphComponent.__originVector3;
    this.matrixInner.multiplyVector3To(zeroVector, SceneGraphComponent.returnVector3);
    return SceneGraphComponent.returnVector3 as Vector3;
  }

  getWorldPositionOf(localPosition: Vector3) {
    return this.matrixInner.multiplyVector3(localPosition);
  }

  getWorldPositionOfTo(localPosition: Vector3, out: MutableVector3) {
    return this.matrixInner.multiplyVector3To(localPosition, out);
  }

  getLocalPositionOf(worldPosition: Vector3): Vector3 {
    return Matrix44.invert(this.matrixInner).multiplyVector3(worldPosition);
  }

  getLocalPositionOfTo(worldPosition: Vector3, out: MutableVector3): Vector3 {
    return Matrix44.invertTo(this.matrixInner, SceneGraphComponent.__tmp_mat4).multiplyVector3To(
      worldPosition,
      out
    );
  }

  getWorldAABB() {
    const aabb = new AABB();
    const meshComponent = this.entity.tryToGetMesh();
    if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
      aabb.mergeAABB(meshComponent.mesh.AABB);

      AABB.multiplyMatrixTo(
        this.entity.getSceneGraph().matrixInner,
        aabb,
        SceneGraphComponent.__tmpAABB
      );
    } else {
      SceneGraphComponent.__tmpAABB.initialize();
    }

    return SceneGraphComponent.__tmpAABB;
  }

  calcWorldMergedAABB() {
    const aabb = this.getWorldAABB().clone();
    for (const child of this.children) {
      const childAABB = child.calcWorldMergedAABB();
      aabb.mergeAABB(childAABB);
    }
    this.__worldMergedAABB = aabb;

    return aabb;
  }

  get worldMergedAABB() {
    if (this.__isWorldAABBDirty) {
      this.calcWorldMergedAABB();
      this.__isWorldAABBDirty = false;
    }
    return this.__worldMergedAABB;
  }

  getWorldAABBWithSkeletal() {
    const aabb = new AABB();
    const meshComponent = this.entity.tryToGetMesh();
    if (Is.exist(meshComponent) && Is.exist(meshComponent.mesh)) {
      aabb.mergeAABB(meshComponent.mesh.AABB);

      AABB.multiplyMatrixTo(
        this.entity.getSceneGraph().entityWorldMatrixWithSkeletalInner,
        aabb,
        SceneGraphComponent.__tmpAABB
      );
    } else {
      SceneGraphComponent.__tmpAABB.initialize();
    }

    return SceneGraphComponent.__tmpAABB;
  }

  calcWorldMergedAABBWithSkeletal() {
    const aabb = this.getWorldAABBWithSkeletal().clone();
    for (const child of this.children) {
      const childAABB = child.calcWorldMergedAABBWithSkeletal();
      aabb.mergeAABB(childAABB);
    }
    this.__worldMergedAABBWithSkeletal = aabb;

    return aabb;
  }

  get worldMergedAABBWithSkeletal() {
    if (this.__isWorldAABBDirty) {
      this.calcWorldMergedAABBWithSkeletal();
      this.__isWorldAABBDirty = false;
    }
    return this.__worldMergedAABBWithSkeletal;
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
    const collectedSgComponents = flattenHierarchy(this, false);
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
      const result = meshComponent.castRay(srcPointInWorld, directionInWorld, dotThreshold);
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
    const collectedSgComponents = flattenHierarchy(this, false);
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
      const result = meshComponent.castRayFromScreenInWorld(x, y, camera, viewport, dotThreshold);
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

  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (this.__lastTransformComponentsUpdateCount === TransformComponent.updateCount) {
      return;
    }

    this.matrixInner;
    this.normalMatrixInner;

    this.__updateGizmos();

    // const meshComponent = this.entity.tryToGetMesh();
    // if (meshComponent != null) {
    //   const mesh = meshComponent.mesh;
    //   if (mesh != null) {
    //     const primitiveNum = mesh.getPrimitiveNumber();
    //     for (let i = 0; i < primitiveNum; i++) {
    //       const primitive = mesh.getPrimitiveAt(i);
    //       if (primitive.positionAccessorVersion !== this.__latestPrimitivePositionAccessorVersion) {
    //         this.setWorldAABBDirtyParentRecursively();
    //         this.__latestPrimitivePositionAccessorVersion = primitive.positionAccessorVersion!;
    //         break;
    //       }
    //     }
    //   }
    // }

    this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
  }

  private __updateGizmos() {
    if (Is.exist(this.__aabbGizmo) && this.__aabbGizmo.isSetup && this.__aabbGizmo.isVisible) {
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
    if (Is.exist(this.__scaleGizmo) && this.__scaleGizmo.isSetup && this.__scaleGizmo.isVisible) {
      this.__scaleGizmo._update();
    }
  }

  setPositionWithoutPhysics(vec: IVector3) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localPosition = vec;
    } else {
      MutableMatrix44.invertTo(
        this.__parent.entity.getSceneGraph().matrixInner,
        SceneGraphComponent.__tmp_mat4
      );
      this.entity.getTransform().localPosition =
        SceneGraphComponent.__tmp_mat4.multiplyVector3(vec);
    }
  }

  set position(vec: IVector3) {
    this.setPositionWithoutPhysics(vec);

    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setPosition(vec);
          }
        }
      }
    }
  }

  get position(): MutableVector3 {
    return this.matrixInner.getTranslate();
  }

  get positionRest(): MutableVector3 {
    return this.matrixRestInner.getTranslate();
  }

  set eulerAngles(vec: IVector3) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localEulerAngles = vec;
    } else {
      const quat = Quaternion.fromMatrix(this.__parent.entity.getSceneGraph().matrixInner);
      const invQuat = Quaternion.invert(quat);
      const rotation = Quaternion.fromMatrix(Matrix44.rotate(vec));
      const result = Quaternion.multiply(rotation, invQuat);
      this.entity.getTransform().localEulerAngles = result.toEulerAngles();
    }

    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setEulerAngle(vec);
          }
        }
      }
    }
  }

  get eulerAngles(): Vector3 {
    return this.matrixInner.toEulerAngles();
  }

  setRotationWithoutPhysics(quat: IQuaternion) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localRotation = quat;
    } else {
      const quatInner = this.__parent.entity.getSceneGraph().rotation;
      const invQuat = Quaternion.invert(quatInner);
      this.entity.getTransform().localRotation = Quaternion.multiply(quat, invQuat);
    }
  }

  set rotation(quat: IQuaternion) {
    this.setRotationWithoutPhysics(quat);

    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setEulerAngle(quat.toEulerAngles());
          }
        }
      }
    }
  }

  get rotation(): Quaternion {
    const parent = this.parent;
    if (parent != null) {
      return Quaternion.multiply(parent.rotation, this.entity.getTransform().localRotationInner);
    }
    return this.entity.getTransform().localRotationInner;
  }

  get rotationRest(): Quaternion {
    const parent = this.parent;
    if (parent != null) {
      return Quaternion.multiply(
        parent.rotationRest,
        this.entity.getTransform().localRotationRestInner
      );
    }
    return this.entity.getTransform().localRotationRestInner;
  }

  getRotationRest(endFn: (sg: SceneGraphComponent) => boolean): Quaternion {
    const parent = this.parent;
    const IsEnd = endFn(this);
    if (parent != null && !IsEnd) {
      return Quaternion.multiply(
        parent.getRotationRest(endFn),
        this.entity.getTransform().localRotationRestInner
      );
    }
    return this.entity.getTransform().localRotationRestInner;
  }

  set scale(vec: IVector3) {
    if (Is.not.exist(this.__parent)) {
      this.entity.getTransform().localScale = vec;
    } else {
      const mat = this.__parent.entity.getSceneGraph().matrix;
      mat._v[12] = 0;
      mat._v[13] = 0;
      mat._v[14] = 0;
      const invMat = MutableMatrix44.invert(mat);
      this.entity.getTransform().localScale = invMat.multiplyVector3(vec);
    }

    const physicsComponent = this.entity.tryToGetPhysics();
    if (physicsComponent !== undefined) {
      if (physicsComponent.strategy !== undefined) {
        if (physicsComponent.strategy instanceof OimoPhysicsStrategy) {
          const sceneGraphComponent = this.entity.tryToGetSceneGraph();
          if (sceneGraphComponent !== undefined) {
            physicsComponent.strategy.setScale(vec);
          }
        }
      }
    }
  }

  get scale(): MutableVector3 {
    return this.matrixInner.getScale();
  }

  private __copyChild(child: SceneGraphComponent): ISceneGraphEntity {
    const newChild = EntityRepository._shallowCopyEntityInner(child.entity) as ISceneGraphEntity;
    newChild.getSceneGraph().__parent = this;
    return newChild;
  }

  _shallowCopyFrom(component_: Component): void {
    const component = component_ as SceneGraphComponent;

    this.__parent = component.__parent;
    this.__children = [];
    for (let i = 0; i < component.__children.length; i++) {
      const copyChild = this.__copyChild(component.__children[i]).getSceneGraph();
      this.__children.push(copyChild);
    }

    this.__gizmoChildren = component.__gizmoChildren.concat();
    this._worldMatrix.copyComponents(component._worldMatrix);
    this._worldMatrixRest.copyComponents(component._worldMatrixRest);
    this._normalMatrix.copyComponents(component._normalMatrix);
    this.__isWorldMatrixUpToDate = false;
    this.__isWorldMatrixRestUpToDate = false;
    this.__isNormalMatrixUpToDate = false;
    this.__worldMergedAABBWithSkeletal = component.__worldMergedAABBWithSkeletal.clone();
    this.__isWorldAABBDirty = true;
    this._isVisible.copyComponents(component._isVisible);
    this._isBillboard.copyComponents(component._isBillboard);
    // this.__aabbGizmo = component.__aabbGizmo;
    // this.__locatorGizmo = component.__locatorGizmo;
    // this.__translationGizmo = component.__translationGizmo;
    // this.__scaleGizmo = component.__scaleGizmo;
    this.__transformGizmoSpace = component.__transformGizmoSpace;
    this.__latestPrimitivePositionAccessorVersion =
      component.__latestPrimitivePositionAccessorVersion;
    this.toMakeWorldMatrixTheSameAsLocalMatrix = component.toMakeWorldMatrixTheSameAsLocalMatrix;
    this.isRootJoint = component.isRootJoint;
    this.jointIndex = component.jointIndex;
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): ISceneGraphEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as ISceneGraphEntity;
  }

  setTransformGizmoSpace(space: 'local' | 'world') {
    this.__transformGizmoSpace = space;
    this.__translationGizmo?.setSpace(space);
    this.__scaleGizmo?.setSpace(space);
  }

  _destroy() {
    super._destroy();
    this.__aabbGizmo?._destroy();
    this.__locatorGizmo?._destroy();
    this.__translationGizmo?._destroy();
    this.__scaleGizmo?._destroy();
    // this.__entityRepository.removeEntity(this.__entityUid);
    this.parent?.removeChild(this);
    this.children.forEach((child) => child.parent?.removeChild(child));
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class SceneGraphEntity extends (base.constructor as any) {
      private __sceneGraphcomponent?: SceneGraphComponent;
      constructor(
        entityUID: EntityUID,
        isAlive: boolean,
        components?: Map<ComponentTID, Component>
      ) {
        super(entityUID, isAlive, components);
      }

      getSceneGraph(): SceneGraphComponent {
        if (this.__sceneGraphComponent === undefined) {
          this.__sceneGraphComponent = this.getComponentByComponentTID(
            WellKnownComponentTIDs.SceneGraphComponentTID
          ) as SceneGraphComponent;
        }
        return this.__sceneGraphComponent;
      }

      get parent(): SceneGraphComponent | undefined {
        return this.getSceneGraph().parent;
      }

      get matrix(): IMatrix44 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.matrix;
      }
      get matrixInner(): IMatrix44 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.matrixInner;
      }

      get position(): MutableVector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.position;
      }

      set position(vec: IVector3) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.position = vec;
      }

      get positionRest(): MutableVector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.positionRest;
      }

      get scale(): MutableVector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.scale;
      }

      set scale(vec: IVector3) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.scale = vec;
      }

      get eulerAngles(): Vector3 {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.eulerAngles;
      }

      set eulerAngles(vec: IVector3) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.eulerAngles = vec;
      }

      get rotation(): Quaternion {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.rotation;
      }

      set rotation(quat: IQuaternion) {
        const sceneGraph = this.getSceneGraph();
        sceneGraph.rotation = quat;
      }

      get rotationRest(): Quaternion {
        const sceneGraph = this.getSceneGraph();
        return sceneGraph.rotationRest;
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
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
