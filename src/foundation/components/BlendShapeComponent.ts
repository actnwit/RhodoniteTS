import Vector3 from '../math/Vector3';
import Quaternion from '../math/Quaternion';
import Matrix33 from '../math/Matrix33';
import Matrix44 from '../math/Matrix44';
import Component from '../core/Component';
import ComponentRepository from '../core/ComponentRepository';
import { ComponentType } from '../definitions/ComponentType';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { BufferUse, BufferUseEnum } from '../definitions/BufferUse';
import SceneGraphComponent from './SceneGraphComponent';
import MutableMatrix44 from '../math/MutableMatrix44';
import MutableQuaternion from '../math/MutableQuaternion';
import { ProcessStage } from '../definitions/ProcessStage';
import MutableMatrix33 from '../math/MutableMatrix33';
import MutableVector3 from '../math/MutableVector3';
import { ComponentTID, ComponentSID, EntityUID } from '../../commontypes/CommonTypes';
import MeshComponent from './MeshComponent';

// import AnimationComponent from './AnimationComponent';

export default class BlendShapeComponent extends Component {
  private __weights: number[] = [];
  private __targetNames: string[] = [];

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);

    this.moveStageTo(ProcessStage.Create);
  }


  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.BlendShapeComponentTID;
  }

  $create() {
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {

  }

  set weights(weights: number[]) {
    this.__weights = weights;
  }

  get weights() {
    return this.__weights;
  }

  set targetNames(names: string[]) {
    this.__targetNames = names;
  }

  get targetNames() {
    return this.__targetNames;
  }
}

ComponentRepository.registerComponentClass(BlendShapeComponent);