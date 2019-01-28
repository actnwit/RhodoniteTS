import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';

export default class SkeletalComponent extends Component {
  private __jointIndices: Index[] = [];
  private __inverseBindMatrices: Matrix44[] = [];
  public jointsHierarchy?: SceneGraphComponent;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.SkeletalComponentTID;
  }

  $load() {
    
  }

  $logic() {

  }

}
ComponentRepository.registerComponentClass(SkeletalComponent);
