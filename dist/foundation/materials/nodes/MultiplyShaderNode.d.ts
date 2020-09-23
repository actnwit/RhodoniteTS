import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";
import AbstractShaderNode from "../core/AbstractShaderNode";
export default class MultiplyShaderNode extends AbstractShaderNode {
    constructor(lhsCompositionType: CompositionTypeEnum, lhsComponentType: ComponentTypeEnum, rhsCompositionType: CompositionTypeEnum, rhsComponentType: ComponentTypeEnum);
}
