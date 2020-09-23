import Material from "../foundation/materials/core/Material";
import RenderPass from "../foundation/renderer/RenderPass";
import MeshComponent from "../foundation/components/MeshComponent";
declare function setCullAndBlendSettings(material: Material, renderPass: RenderPass, gl: WebGLRenderingContext): void;
declare function startDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass): void;
declare function endDepthMasking(idx: number, gl: WebGLRenderingContext, renderPass: RenderPass): void;
declare function isMeshSetup(meshComponent: MeshComponent): boolean;
declare function isMaterialsSetup(meshComponent: MeshComponent): boolean;
declare const _default: Readonly<{
    setCullAndBlendSettings: typeof setCullAndBlendSettings;
    startDepthMasking: typeof startDepthMasking;
    endDepthMasking: typeof endDepthMasking;
    isMeshSetup: typeof isMeshSetup;
    isMaterialsSetup: typeof isMaterialsSetup;
}>;
export default _default;
