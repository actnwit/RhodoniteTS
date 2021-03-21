import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import {WellKnownComponentTIDs} from './WellKnownComponentTIDs';
import {LightType} from '../definitions/LightType';
import Vector3 from '../math/Vector3';
import SceneGraphComponent from './SceneGraphComponent';
import {ProcessStage} from '../definitions/ProcessStage';
import Config from '../core/Config';
import {
  ComponentTID,
  EntityUID,
  ComponentSID,
} from '../../types/CommonTypes';
import GlobalDataRepository from '../core/GlobalDataRepository';
import {ShaderSemantics} from '../definitions/ShaderSemantics';
import MutableVector4 from '../math/MutableVector4';
import VectorN from '../math/VectorN';

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
  private static __lightPositions = new VectorN(new Float32Array(0));
  private static __lightDirections = new VectorN(new Float32Array(0));
  private static __lightIntensities = new VectorN(new Float32Array(0));

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);

    this.maxNumberOfComponent = Math.max(
      10,
      Math.floor(Config.maxEntityNumber / 100)
    );
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.LightComponentTID;
  }

  get direction() {
    return this.__direction;
  }

  set intensity(value: Vector3) {
    this.__intensity = value;
  }

  get intensity(): Vector3 {
    return this.__intensity;
  }

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      SceneGraphComponent
    ) as SceneGraphComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  $load() {
    const lightComponents = LightComponent.__componentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];
    const currentComponentSIDs = LightComponent.__globalDataRepository.getValue(
      ShaderSemantics.CurrentComponentSIDs,
      0
    );
    currentComponentSIDs!._v[WellKnownComponentTIDs.LightComponentTID] =
      lightComponents.length;

    LightComponent.__lightPositions = LightComponent.__globalDataRepository.getValue(
      ShaderSemantics.LightPosition,
      0
    );
    LightComponent.__lightDirections = LightComponent.__globalDataRepository.getValue(
      ShaderSemantics.LightDirection,
      0
    );
    LightComponent.__lightIntensities = LightComponent.__globalDataRepository.getValue(
      ShaderSemantics.LightIntensity,
      0
    );

    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    this.__direction = this.__sceneGraphComponent!.normalMatrixInner.multiplyVector(
      this.__initialdirection
    );

    LightComponent.__lightDirections._v[
      4 * this.componentSID + 0
    ] = this.__direction.x;
    LightComponent.__lightDirections._v[
      4 * this.componentSID + 1
    ] = this.__direction.y;
    LightComponent.__lightDirections._v[
      4 * this.componentSID + 2
    ] = this.__direction.z;
    LightComponent.__lightDirections._v[4 * this.componentSID + 3] = 0;

    const lightPosition = this.__sceneGraphComponent!.worldPosition;
    LightComponent.__lightPositions._v[4 * this.componentSID + 0] =
      lightPosition.x;
    LightComponent.__lightPositions._v[4 * this.componentSID + 1] =
      lightPosition.y;
    LightComponent.__lightPositions._v[4 * this.componentSID + 2] =
      lightPosition.z;
    LightComponent.__lightPositions._v[
      4 * this.componentSID + 3
    ] = this.type.index;

    LightComponent.__lightIntensities._v[
      4 * this.componentSID + 0
    ] = this.__intensity.x;
    LightComponent.__lightIntensities._v[
      4 * this.componentSID + 1
    ] = this.__intensity.y;
    LightComponent.__lightIntensities._v[
      4 * this.componentSID + 2
    ] = this.__intensity.z;
    LightComponent.__lightIntensities._v[4 * this.componentSID + 3] = 0;
  }
}
ComponentRepository.registerComponentClass(LightComponent);
