import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
export declare class OutPositionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketInput(): Socket<string, import("../../definitions/CompositionType").CompositionTypeEnum, import("../../definitions/ComponentType").ComponentTypeEnum>;
}
