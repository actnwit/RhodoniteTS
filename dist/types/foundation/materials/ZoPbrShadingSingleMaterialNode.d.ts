import { ShaderSemanticsEnum } from "../definitions/ShaderSemantics";
import AbstractMaterialNode from "./AbstractMaterialNode";
export default class ZoPbrShadingSingleMaterialNode extends AbstractMaterialNode {
    private static __dummyWhiteTextureUid;
    private static __dummyBlueTextureUid;
    private static __dummyBlackTextureUid;
    private static __dummyBlackCubeTextureUid;
    private static __pbrCookTorranceBrdfLutDataUrlUid;
    constructor();
    static initDefaultTextures(): Promise<void>;
    convertValue(shaderSemantic: ShaderSemanticsEnum, value: any): void;
}
