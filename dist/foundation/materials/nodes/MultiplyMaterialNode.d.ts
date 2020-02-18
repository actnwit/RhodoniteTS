import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";
export default class MultiplyMaterialNode extends AbstractMaterialNode {
    constructor(lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum, rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum);
}
