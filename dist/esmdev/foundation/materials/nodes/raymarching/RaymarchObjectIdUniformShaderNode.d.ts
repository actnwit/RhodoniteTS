import { AbstractShaderNode } from '../../core/AbstractShaderNode';
/**
 * Internal node injected for each raymarching component: outputs the component's
 * object id uniform. OutUnion records this value when the component's SDF wins.
 *
 * The public RaymarchObjectId node (shading section) reads the recorded hit id.
 */
export declare class RaymarchObjectIdUniformShaderNode extends AbstractShaderNode {
    constructor();
    /**
     * Sets the shader semantic name of the per-component object id uniform.
     */
    setUniformDataName(value: any): void;
}
