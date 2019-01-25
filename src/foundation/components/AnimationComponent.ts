import Component from "../core/Component";
import ComponentRepository from "../core/ComponentRepository";
import EntityRepository from "../core/EntityRepository";
import { WellKnownComponentTIDs } from "./WellKnownComponentTIDs";
import { AnimationEnum } from "../definitions/Animation";
import { ComponentTypeEnum } from "../main";


type AnimationLine = {
  [s:string]: {
    input: number[]
    output: any[],
    outputAttribute: string,
    outputComponentN: ComponentTypeEnum,
    interpolationMethod: AnimationEnum
  }
}

export default class AnimationComponent extends Component {
  private __animationLine: AnimationLine = {};

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.AnimationComponentTID;
  }

  setAnimation(animationAttributeName: string, animationInputArray: number[], animationOutputArray: any[]) {

  }

}
ComponentRepository.registerComponentClass(AnimationComponent.componentTID, AnimationComponent);
