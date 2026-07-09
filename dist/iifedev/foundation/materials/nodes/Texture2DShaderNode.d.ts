import { AbstractShaderNode } from '../core/AbstractShaderNode';
/**
 * A shader node that provides texture input functionality.
 * This node wraps TextureShader to provide a standardized interface
 * for passing textures to shader programs.
 */
export declare class Texture2DShaderNode extends AbstractShaderNode {
    constructor();
    /**
     * Sets sRGB flag for the texture
     *
     * @param sRGB - The sRGB flag
     */
    setSrgbFlag(sRGB: boolean): void;
    /**
     * Sets the texture variable name in the shader.
     * This name will be used to reference the texture variable in the generated shader code.
     *
     * @param value - The variable name to use for the texture in the shader
     */
    setTextureName(value: any): void;
}
