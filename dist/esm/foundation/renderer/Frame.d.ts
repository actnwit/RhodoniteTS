import { RequireOne } from '../../types/TypeGenerators';
import { RnObject } from '../core/RnObject';
import { IVector4 } from '../math/IVector';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { Expression } from './Expression';
import { FrameBuffer } from './FrameBuffer';
import { RenderPass } from './RenderPass';
type ColorAttachmentIndex = number;
type InputRenderPassIndex = number;
type RenderPassIndex = number;
/**
 * Frame manages expressions and input/output dependencies between them
 */
export declare class Frame extends RnObject {
    private __expressions;
    static readonly FrameBuffer = "FrameBuffer";
    static readonly ResolveFrameBuffer = "ResolveFrameBuffer";
    static readonly ResolveFrameBuffer2 = "ResolveFrameBuffer2";
    private __expressionQueries;
    constructor();
    /**
     * Add render passes to the end of this expression.
     */
    addExpression(expression: Expression, { inputRenderPasses, outputs, }?: {
        inputRenderPasses?: RenderPass[];
        outputs?: {
            renderPass: RequireOne<{
                index?: RenderPassIndex;
                uniqueName?: string;
                instance?: RenderPass;
            }>;
            frameBuffer: FrameBuffer;
        }[];
    }): void;
    /**
     * Get ColorAttachment RenderBuffer from input render pass of the expression
     * @param inputFrom input Expression
     * @param {inputIndex: number, colorAttachmentIndex: number} input RenderPass Index and ColorAttachmen tIndex
     * @returns {Promise<RenderTargetTexture>}
     */
    getColorAttachmentFromInputOf(inputFrom: Expression, renderPassArg?: {
        renderPass: RequireOne<{
            index?: InputRenderPassIndex;
            uniqueName?: string;
            instance?: RenderPass;
        }>;
        colorAttachmentIndex: ColorAttachmentIndex;
        framebufferType: 'FrameBuffer' | 'ResolveFrameBuffer' | 'ResolveFrameBuffer2';
    }): Promise<RenderTargetTexture>;
    /**
     *
     */
    resolve(): void;
    /**
     * Clear render passes of this expression.
     */
    clearExpressions(): void;
    /**
     * Get expressions
     */
    get expressions(): Expression[];
    setViewport(viewport: IVector4): void;
}
export {};
