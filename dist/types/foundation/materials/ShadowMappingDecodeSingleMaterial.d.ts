import AbstractMaterialNode from "./AbstractMaterialNode";
import RenderPass from "../renderer/RenderPass";
import { ShadowMappingEnum } from "../definitions/ShadowMapping";
export default class ShadowMappingDecodeSingleMaterial extends AbstractMaterialNode {
    private static __dummyWhiteTextureUid;
    private static __dummyBlackTextureUid;
    private static __dummyBlueTextureUid;
    private static __dummyBlackCubeTextureUid;
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    constructor(renderPassEncodingDepth: RenderPass[], mode: ShadowMappingEnum);
    static initDefaultTextures(): Promise<void>;
}
