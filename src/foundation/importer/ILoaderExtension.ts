import type { RnM2, RnM2Material, RnM2TextureSampler } from '../../types/RnM2';
import { Entity } from '../core/Entity';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Material } from '../materials/core/Material';

export interface ILoaderExtension {
  generateMaterial?(materialJson: RnM2Material): Material;
  isNeededToUseThisMaterial?(gltfJson: RnM2): boolean;
  setTextures?(gltfJson: RnM2, materialJson: RnM2Material): void;
  setupMaterial?(gltfJson: RnM2, materialJson: RnM2Material, material: Material): void;
  setUVTransformToTexture?(material: Material, samplerJson: RnM2TextureSampler): void;
  loadExtensionInfoAndSetToRootGroup?(rootGroup: ISceneGraphEntity, json: RnM2): void;
}
