import { AbstractMaterialContent } from '../core/AbstractMaterialContent';
import { RenderingArgWebGL, RenderingArgWebGpu } from '../../../webgl/types/CommonTypes';
import { Material } from '../core/Material';
import { Vrm1_Material } from '../../../types/VRM1';
export declare class MToon1MaterialContent extends AbstractMaterialContent {
    private static __diffuseIblCubeMapSampler;
    private static __specularIblCubeMapSampler;
    constructor(materialName: string, isMorphing: boolean, isSkinning: boolean, isLighting: boolean, isOutline: boolean);
    setMaterialParameters(material: Material, isOutline: boolean, materialJson: Vrm1_Material): void;
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    _setInternalSettingParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    private static __setupHdriParameters;
}
