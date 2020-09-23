import AbstractMaterialNode from "../core/AbstractMaterialNode";
import Material from "../core/Material";
import { ShaderSemanticsClass } from "../../definitions/ShaderSemantics";
export default class DepthEncodeSingleMaterialNode extends AbstractMaterialNode {
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    private static __lastZNear;
    private static __lastZFar;
    constructor({ isSkinning }: {
        isSkinning: boolean;
    });
    setParametersForGPU({ material, shaderProgram, firstTime, args }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args?: any;
    }): void;
}
