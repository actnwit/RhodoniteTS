import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that blends two distance values with a smooth union.
 *
 * The smoothness controls the width of the blend. Values close to zero behave
 * like a hard union.
 */
export declare class OpSmoothUnionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
