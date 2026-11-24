import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';
/**
 * OutUnionShader generates the terminal function of a raymarching component that
 * records the component's distance (and object id) when it wins the union.
 *
 * The distance in the graph is computed in the space produced by the SDF position
 * chain, which for `SdApplyWorldMatrix` is the component's local space. Scaling an
 * entity below 1 makes a local-space distance larger than the matching world-space
 * distance, so marching by it overshoots the surface (the shape loses parts). The
 * function therefore multiplies the distance by `rnRaymarchDistanceScale(worldMatrix)`,
 * a conservative local-to-world scale of the component's world matrix, so the value
 * becomes a valid world-space ray marching step. The matrix is an existing
 * per-component material uniform, so no extra parameters are needed.
 *
 * `SdApplyTransform` nodes inside the graph are handled by their per-node scale
 * globals, which are multiplied in as well (see {@link SdApplyTransformShader}).
 */
export declare class OutUnionShader extends RaymarchingShaderPart {
    private __shaderFunctionName;
    private __distanceCorrectionUniformNames;
    private __distanceScaleGlobalNames;
    /**
     * @param shaderFunctionName - Unique function name of the terminal node
     * @param distanceCorrectionUniformNames - Per-component world matrix uniforms
     * used to convert the local-space distance to a conservative world-space distance
     * @param distanceScaleGlobalNames - Per-`SdApplyTransform` globals that hold the
     * smallest axis scale of the transform node in the terminal's subtree
     */
    constructor(shaderFunctionName: string, distanceCorrectionUniformNames?: readonly string[], distanceScaleGlobalNames?: readonly string[]);
    getVertexShaderDefinitions(_engine: Engine): string;
    get vertexShaderBody(): string;
    getPixelShaderDefinitions(engine: Engine): string;
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
