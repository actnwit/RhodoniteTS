import AbstractMaterialNode from "./AbstractMaterialNode";
import RenderPass from "../renderer/RenderPass";
export default class ShadowMapping32bitSingleMaterial extends AbstractMaterialNode {
    private static __dummyWhiteTextureUid;
    private static __dummyBlackTextureUid;
    private static __dummyBlueTextureUid;
    private static __dummyBlackCubeTextureUid;
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    constructor(renderPass: RenderPass);
    static initDefaultTextures(): Promise<void>;
}
