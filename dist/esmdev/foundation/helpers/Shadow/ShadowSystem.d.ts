import { Expression } from '../../renderer/Expression';
import { ISceneGraphEntity } from '../EntityHelper';
export declare class ShadowSystem {
    private __shadowMap;
    private __pointShadowMap;
    private __gaussianBlur;
    private __shadowMapArrayFramebuffer;
    private __pointShadowMapArrayFramebuffer;
    private __lightTypes;
    private __lightEnables;
    private __lightCastShadows;
    constructor(shadowMapSize: number);
    getExpressions(entities: ISceneGraphEntity[]): Expression[];
    private __setBlurredShadowMap;
    private __setParaboloidBlurredShadowMap;
    private __setDepthTextureIndexList;
    setDepthBiasPV(entities: ISceneGraphEntity[]): void;
    isLightChanged(): boolean;
}
