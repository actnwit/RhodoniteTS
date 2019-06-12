import AbstractMaterialNode from "./AbstractMaterialNode";
import RenderPass from "../renderer/RenderPass";
export default class EncodedDepthGaussianBlurNode extends AbstractMaterialNode {
    private static __dummyWhiteTextureUid;
    private static __dummyBlackTextureUid;
    private static __dummyBlackCubeTextureUid;
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    constructor(renderPassEncodingDepth: RenderPass, isHorizontal: boolean, parameters: {
        gaussianKernelCenterCoordX: Count;
        gaussianVariance: number;
    });
    static initDefaultTextures(): Promise<void>;
}
