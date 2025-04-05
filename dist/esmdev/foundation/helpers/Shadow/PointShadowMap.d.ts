import { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import { ISceneGraphEntity } from '../EntityHelper';
export declare class PointShadowMap {
    private __shadowMomentFramebuffer;
    private __shadowMomentFrontMaterials;
    private __shadowMomentBackMaterials;
    constructor();
    getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods): RenderPass[];
    getShadowMomentFramebuffer(): FrameBuffer;
}
