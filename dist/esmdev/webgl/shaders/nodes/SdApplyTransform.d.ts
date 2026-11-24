import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';
/**
 * SdApplyTransformShader generates the position transform function of one
 * `SdApplyTransform` node and records the node's local-to-parent scale.
 *
 * The transform is `T * R * S`, so its smallest singular value is exactly the
 * smallest axis scale. The value is stored in a per-node global instead of being
 * returned, because the node only has a position output socket. A raymarching
 * terminal node (`OutUnion` / `OutDistance`) multiplies the distances that flow
 * through this transform by that global (see {@link OutUnionShader}), so a shape
 * scaled below 1 inside the graph stays a valid world-space ray marching step.
 *
 * The global is initialized to 1 and written on every `map()` evaluation before the
 * terminal that reads it (transform nodes are ancestors of the terminals in the SDF
 * graph, so the generated calls are topologically ordered).
 */
export declare class SdApplyTransformShader extends RaymarchingShaderPart {
    private __shaderFunctionName;
    private __scaleGlobalName;
    /**
     * @param shaderFunctionName - Unique function name of the transform node
     * @param scaleGlobalName - Unique global that receives the node's smallest axis scale
     */
    constructor(shaderFunctionName: string, scaleGlobalName: string);
    /** Name of the global that holds this node's smallest axis scale. */
    get scaleGlobalName(): string;
    getVertexShaderDefinitions(_engine: Engine): string;
    get vertexShaderBody(): string;
    getPixelShaderDefinitions(engine: Engine): string;
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
