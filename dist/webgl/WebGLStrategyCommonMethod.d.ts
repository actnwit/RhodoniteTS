import Material from "../foundation/materials/core/Material";
import RenderPass from "../foundation/renderer/RenderPass";
declare function setCullAndBlendSettings(material: Material, renderPass: RenderPass, gl: WebGLRenderingContext): void;
declare function startDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass): void;
declare function endDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass): void;
declare const _default: Readonly<{
    setCullAndBlendSettings: typeof setCullAndBlendSettings;
    startDepthMasking: typeof startDepthMasking;
    endDepthMasking: typeof endDepthMasking;
}>;
export default _default;
