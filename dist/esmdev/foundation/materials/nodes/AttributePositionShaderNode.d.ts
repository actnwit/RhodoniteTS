import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
export declare class AttributePositionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../definitions/CompositionType").CompositionTypeEnum, import("../../definitions/ComponentType").ComponentTypeEnum>;
}
