import AbstractMaterialNode from "./AbstractMaterialNode";
export default class DepthEncodingSingleMaterialNode extends AbstractMaterialNode {
    private static __dummyWhiteTextureUid;
    private static __dummyBlackTextureUid;
    private static __dummyBlackCubeTextureUid;
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    constructor(depthPow: number);
    static initDefaultTextures(): Promise<void>;
}
