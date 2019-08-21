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

export default class MeshComponent extends Component {
  private __viewDepth = -Number.MAX_VALUE;
  private __mesh?: Mesh;
  private __blendShapeComponent?: BlendShapeComponent;

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

    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    if (this.__mesh == null) {
      return;
    }
    //    this.__mesh!.makeVerticesSepareted();
    this.__mesh.__calcTangents();
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
}

ComponentRepository.registerComponentClass(MeshComponent);
