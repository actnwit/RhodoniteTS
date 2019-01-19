import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';

export default class CameraComponent extends Component {
  private _direction: Vector3 = Vector3.dummy();
  private _up: Vector3 = Vector3.dummy();
  private _corner: Vector4 = Vector4.dummy();

  // x: zNear, y: zFar,
  // if perspective, z: fovy, w: aspect
  // if ortho, z: xmag, w: ymag
  private _parameters: Vector4 = Vector4.dummy();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraComponentTID;
  }

}
ComponentRepository.registerComponentClass(CameraComponent.componentTID, CameraComponent);
