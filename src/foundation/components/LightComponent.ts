import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import { LightType } from '../definitions/LightType';
import Vector3 from '../math/Vector3';

export default class LightComponent extends Component {
  public type = LightType.Point;
  public intensity = new Vector3(1, 1, 1);
  public direction = new Vector3(0, -1, 0);
  public spotExponent = 1.0;
  public spotCutoff = 30; // in degree

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.LightComponentTID;
  }

}
ComponentRepository.registerComponentClass(LightComponent);
