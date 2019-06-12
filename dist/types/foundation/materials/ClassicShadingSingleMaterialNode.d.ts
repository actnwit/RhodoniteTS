import AbstractMaterialNode from "./AbstractMaterialNode";
export default class ClassicShadingSingleMaterialNode extends AbstractMaterialNode {
    private static __dummyWhiteTextureUid;
    private static __dummyBlueTextureUid;
    private static __dummyBlackTextureUid;
    private static __dummyBlackCubeTextureUid;
    constructor();
    static initDefaultTextures(): Promise<void>;
}
