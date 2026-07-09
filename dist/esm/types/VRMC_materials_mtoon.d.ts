import type { RnM2Material, RnM2Texture } from './RnM2';
export type Vrm1_Materials_MToon = {
    specVersion: string;
    transparentWithZWrite: boolean;
    renderQueueOffsetNumber: number;
    shadeColorFactor: [number, number, number];
    shadeMultiplyTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    shadingShiftFactor: number;
    shadingShiftTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    shadingToonyFactor: number;
    giEqualizationFactor: number;
    matcapFactor: [number, number, number];
    matcapTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    parametricRimColorFactor: [number, number, number];
    parametricRimFresnelPowerFactor: number;
    parametricRimLiftFactor: number;
    rimMultiplyTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    rimLightingMixFactor: number;
    outlineColorFactor: [number, number, number];
    outlineLightingMixFactor: number;
    outlineWidthFactor: number;
    outlineWidthMode: 'none' | 'worldCoordinates' | 'screenCoordinates';
    outlineWidthMultiplyTexture: {
        index: number;
        texture?: RnM2Texture;
    };
    uvAnimationMaskTexture: {
        index: number;
        texCoord?: number;
        texture?: RnM2Texture;
    };
    uvAnimationRotationSpeedFactor: number;
    uvAnimationScrollXSpeedFactor: number;
    uvAnimationScrollYSpeedFactor: number;
};
export interface Vrm1_Material extends RnM2Material {
    extensions: {
        VRMC_materials_mtoon: Vrm1_Materials_MToon;
    };
}
