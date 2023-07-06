import { Material } from '../materials/core/Material';
import { RenderPass } from '../renderer/RenderPass';
/**
 * Creates a RenderPass for Screen rendering.
 *
 * @note Don't forget to set 'noUseCameraTransform' property to the material
 *
 * @param material
 * @returns
 */
declare function createScreenDrawRenderPass(material: Material): RenderPass;
export declare const RenderPassHelper: Readonly<{
    createScreenDrawRenderPass: typeof createScreenDrawRenderPass;
}>;
export {};
