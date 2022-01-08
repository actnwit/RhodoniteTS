import Material from '../materials/core/Material';
import {RnM2, Gltf2Material, Gltf2TextureSampler} from '../../types/glTF';
import Entity from '../core/Entity';

export default interface ILoaderExtension {
  generateMaterial?(materialJson: Gltf2Material): Material;
  isNeededToUseThisMaterial?(gltfJson: RnM2): boolean;
  setTextures?(gltfJson: RnM2, materialJson: Gltf2Material): void;
  setupMaterial?(
    gltfJson: RnM2,
    materialJson: Gltf2Material,
    material: Material
  ): void;
  setUVTransformToTexture?(
    material: Material,
    samplerJson: Gltf2TextureSampler
  ): void;
  loadExtensionInfoAndSetToRootGroup?(rootGroup: Entity, json: RnM2): void;
}
