import { Material } from '../materials';
import { RenderPass } from '../renderer';
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
