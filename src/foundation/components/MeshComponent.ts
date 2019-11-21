import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { VertexAttribute } from '../definitions/VertexAttribute';
import { ProcessStage } from '../definitions/ProcessStage';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import Vector3 from '../math/Vector3';
import Vector2 from '../math/Vector2';
import MemoryManager from '../core/MemoryManager';
import { BufferUse } from '../definitions/BufferUse';
import { CompositionType } from '../definitions/CompositionType';
import { ComponentType } from '../definitions/ComponentType';
import Accessor from '../memory/Accessor';
import AABB from '../math/AABB';
import CameraComponent from './CameraComponent';
import Vector4 from '../math/Vector4';
import Mesh from '../geometry/Mesh';
import Entity from '../core/Entity';
import { ComponentTID, EntityUID, ComponentSID } from '../../types/CommonTypes';
import BlendShapeComponent from './BlendShapeComponent';
import SceneGraphComponent from './SceneGraphComponent';
import Matrix44 from '../math/Matrix44';
import MutableMatrix44 from '../math/MutableMatrix44';
import MathClassUtil from '../math/MathClassUtil';
import MutableVector3 from '../math/MutableVector3';

export default class MeshComponent extends Component {
  private __viewDepth = -Number.MAX_VALUE;
  private __mesh?: Mesh;
  private __blendShapeComponent?: BlendShapeComponent;
  private __sceneGraphComponent?: SceneGraphComponent;
  public isPickable = true;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.moveStageTo(ProcessStage.Create);
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshComponentTID;
  }

  setMesh(mesh: Mesh) {
    this.__mesh = mesh;
    mesh._attatchedEntityUID = this.entityUID;
  }

  unsetMesh() {
    if (this.__mesh == null) {
      return false;
    }
    this.__mesh._attatchedEntityUID = Entity.invalidEntityUID;
    this.__mesh = void 0;

    return true;
  }

  get mesh() {
    return this.__mesh;
  }

  $create() {
    this.__blendShapeComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, BlendShapeComponent) as BlendShapeComponent;
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;

    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    if (this.__mesh == null) {
      return;
    }
    //    this.__mesh!.makeVerticesSepareted();
    this.__mesh.__calcTangents();
    this.__mesh._calcArenbergInverseMatrices();
    // this.__mesh.__initMorphPrimitives();
    // this.__mesh!.__calcFaceNormals();
    if (this.__blendShapeComponent && this.__blendShapeComponent.weights.length > 0) {
      this.__mesh!.__calcBaryCentricCoord();
    }
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    if (this.__mesh == null) {
      return;
    }
    // this.__mesh.__calcMorphPrimitives();
  }

  set weights(value: number[]) {
    if (this.__mesh == null) {
      return;
    }
    //    this.__mesh!.makeVerticesSepareted();
    this.__mesh.weights = value;
  }

  calcViewDepth(cameraComponent: CameraComponent) {
    const viewMatrix = cameraComponent.viewMatrix;
    const centerPosition_inLocal = new Vector4(this.__mesh!.AABB.centerPoint);
    const centerPosition_inView = viewMatrix.multiplyVector(centerPosition_inLocal);
    this.__viewDepth = centerPosition_inView.z;

    return this.__viewDepth;
  }

  get viewDepth() {
    return this.__viewDepth;
  }

  static alertNoMeshSet(meshComponent: MeshComponent) {
    console.debug('No mesh is set on this MeshComponent:' + meshComponent.componentSID);
  }

  castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold: number = 0) {
    if (this.__mesh) {
      let srcPointInLocal = srcPointInWorld;
      let directionInLocal = directionInWorld;
      if (this.__sceneGraphComponent) {
        const invWorldMatrix = Matrix44.invert(this.__sceneGraphComponent.worldMatrixInner);
        srcPointInLocal = new Vector3(
          invWorldMatrix.multiplyVector(new Vector4(srcPointInWorld))
        );
        const distVecInWorld = Vector3.add(srcPointInWorld, directionInWorld);
        const distVecInLocal = new Vector3(
          invWorldMatrix.multiplyVector(new Vector4(distVecInWorld))
        );
        directionInLocal = Vector3.normalize(Vector3.subtract(
          distVecInLocal,
          srcPointInLocal
        ));

        const {t, intersectedPosition} = this.__mesh.castRay(srcPointInLocal, directionInLocal, dotThreshold);
        let intersectPositionInWorld = null;
        if (t >= 0) {
          intersectPositionInWorld = new Vector3(this.__sceneGraphComponent.worldMatrixInner.multiplyVector(new Vector4(intersectedPosition!)));
        }

        return {t, intersectedPositionInWorld: intersectPositionInWorld};
      }
    }

    return {t: -1, intersectedPositionInWorld: undefined};
  }

  castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold: number = 0) {
    if (this.__mesh) {
      if (this.__sceneGraphComponent) {
        const invPVW = MutableMatrix44.multiply(
          camera.projectionMatrix,
          Matrix44.multiply(camera.viewMatrix, this.__sceneGraphComponent.worldMatrixInner)
        ).invert();
        const srcPointInLocal = MathClassUtil.unProject(
          new Vector3(x, y, 0),
          invPVW,
          viewport
        );
        const distVecInLocal = MathClassUtil.unProject(
          new Vector3(x, y, 1),
          invPVW,
          viewport
        );
        const directionInLocal = Vector3.normalize(Vector3.subtract(
          distVecInLocal,
          srcPointInLocal
        ));

        const {t, intersectedPosition} = this.__mesh.castRay(srcPointInLocal, directionInLocal, dotThreshold);
        let intersectPositionInWorld = null;
        if (t >= 0) {
          intersectPositionInWorld = new Vector3(this.__sceneGraphComponent.worldMatrixInner.multiplyVector(new Vector4(intersectedPosition!)));
        }

        return {t, intersectedPositionInWorld: intersectPositionInWorld};
      }
    }

    return {t: -1, intersectedPositionInWorld: undefined};
  }
}

ComponentRepository.registerComponentClass(MeshComponent);
