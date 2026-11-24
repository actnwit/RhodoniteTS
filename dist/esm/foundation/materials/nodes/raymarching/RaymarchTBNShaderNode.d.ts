import { AbstractShaderNode } from '../../core/AbstractShaderNode';
import { Socket } from '../../core/Socket';
/**
 * A shader node that outputs a tangent-bitangent-normal matrix built from the hit
 * normal. It has no UV parameterization; the frame is an orthonormal basis that can
 * be fed into the PBR shader's TBN input (e.g. for anisotropy).
 *
 * Only meaningful in the raymarching shading section.
 */
export declare class RaymarchTBNShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, import("../../..").CompositionTypeEnum, import("../../..").ComponentTypeEnum, import("../../core/Socket").SocketDefaultValue>;
}
