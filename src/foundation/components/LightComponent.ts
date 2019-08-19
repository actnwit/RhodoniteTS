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
import { ComponentTID, EntityUID, ComponentSID } from '../../types/CommonTypes';
import GlobalDataRepository from '../core/GlobalDataRepository';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import MutableVector4 from '../math/MutableVector4';

export default class LightComponent extends Component {
  public type = LightType.Point;
  private __intensity = new Vector3(1, 1, 1);
  private readonly __initialdirection = new Vector3(0, 1, 0);
  private __direction = new Vector3(0, 1, 0);
  public spotExponent = 1.0;
  public spotCutoff = 30; // in degree
  public range = -1;
  private __sceneGraphComponent?: SceneGraphComponent;
  private static __componentRepository = ComponentRepository.getInstance();
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tmp_vec4 = MutableVector4.zero();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.maxNumberOfComponent = Math.max(10, Math.floor(Config.maxEntityNumber/100));
    LightComponent.__globalDataRepository.takeOne(ShaderSemantics.LightDirection);
    LightComponent.__globalDataRepository.takeOne(ShaderSemantics.LightIntensity);
    LightComponent.__globalDataRepository.takeOne(ShaderSemantics.LightPosition);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.LightComponentTID;
  }

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    const lightComponents = LightComponent.__componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
    const currentComponentSIDs =  LightComponent.__globalDataRepository.getValue(ShaderSemantics.CurrentComponentSIDs, 0);
    currentComponentSIDs!.v[WellKnownComponentTIDs.LightComponentTID] = lightComponents.length;

    this.moveStageTo(ProcessStage.Logic)
  }

  $logic() {
    this.__direction = this.__sceneGraphComponent!.normalMatrixInner.multiplyVector(this.__initialdirection);
    LightComponent.__tmp_vec4.x = this.__direction.x;
    LightComponent.__tmp_vec4.y = this.__direction.y;
    LightComponent.__tmp_vec4.z = this.__direction.z;
    LightComponent.__tmp_vec4.w = 0;
    LightComponent.__globalDataRepository.setValue(ShaderSemantics.LightDirection, this.componentSID, LightComponent.__tmp_vec4);
    const lightPosition = this.__sceneGraphComponent!.worldPosition;
    LightComponent.__tmp_vec4.x = lightPosition.x;
    LightComponent.__tmp_vec4.y = lightPosition.y;
    LightComponent.__tmp_vec4.z = lightPosition.z;
    LightComponent.__tmp_vec4.w = this.type.index;
    LightComponent.__globalDataRepository.setValue(ShaderSemantics.LightPosition, this.componentSID, LightComponent.__tmp_vec4);
  }

  get direction() {
    return this.__direction;
  }

  set intensity(value: Vector3) {
    this.__intensity = value;
    LightComponent.__tmp_vec4.x = value.x;
    LightComponent.__tmp_vec4.y = value.y;
    LightComponent.__tmp_vec4.z = value.z;
    LightComponent.__tmp_vec4.w = 0;
    LightComponent.__globalDataRepository.setValue(ShaderSemantics.LightIntensity, this.componentSID, LightComponent.__tmp_vec4);
  }

  get intensity(): Vector3 {
    return this.__intensity;
  }

}
ComponentRepository.registerComponentClass(LightComponent);
