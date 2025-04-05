import { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import { ISceneGraphEntity } from '../EntityHelper';
export declare class ShadowMap {
    private __shadowMomentFramebuffer;
    private __shadowMomentMaterial;
    constructor();
    getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods): RenderPass[];
    getShadowMomentFramebuffer(): FrameBuffer;
}
