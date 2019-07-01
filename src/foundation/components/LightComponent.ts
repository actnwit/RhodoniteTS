import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { LightType } from '../definitions/LightType';
import Vector3 from '../math/Vector3';
import SceneGraphComponent from './SceneGraphComponent';
import { ProcessStage } from '../definitions/ProcessStage';
import Config from '../core/Config';

export default class LightComponent extends Component {
  public type = LightType.Point;
  public intensity = new Vector3(1, 1, 1);
  private readonly __initialdirection = new Vector3(0, 1, 0);
  private __direction = new Vector3(0, 1, 0);
  public spotExponent = 1.0;
  public spotCutoff = 30; // in degree
  public range = -1;
  private __sceneGraphComponent?: SceneGraphComponent;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.maxNumberOfComponent = Math.max(10, Math.floor(Config.maxEntityNumber/100));

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.LightComponentTID;
  }

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    this.__direction = this.__sceneGraphComponent!.normalMatrixInner.multiplyVector(this.__initialdirection);
  }

  get direction() {
    return this.__direction;
  }

}
ComponentRepository.registerComponentClass(LightComponent);
