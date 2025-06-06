import type { RnM2Material, RnM2Texture } from './RnM2';

export type Vrm1_Materials_MToon = {
  // Meta
  specVersion: string;

  // Rendering
  transparentWithZWrite: boolean; // Whether write to depth buffer or not when alphaMode is BLEND
  renderQueueOffsetNumber: number; // Offset value to the rendering order

  // Lighting
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

  // Global Illumination
  giEqualizationFactor: number;

  // Rim Lighting
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

  // Outline
  outlineColorFactor: [number, number, number];
  outlineLightingMixFactor: number;
  outlineWidthFactor: number;
  outlineWidthMode: 'none' | 'worldCoordinates' | 'screenCoordinates';
  outlineWidthMultiplyTexture: {
    index: number;
    texture?: RnM2Texture;
  };

  // UV Animation
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
