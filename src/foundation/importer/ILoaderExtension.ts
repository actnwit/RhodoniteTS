import Material from '../materials/core/Material';
import {glTF2, Gltf2Material, Gltf2Sampler} from '../../types/glTF';
import Entity from '../core/Entity';

export default interface ILoaderExtension {
  generateMaterial?(materialJson: Gltf2Material): Material;
  isNeededToUseThisMaterial?(gltfJson: glTF2): boolean;
  setTextures?(gltfJson: glTF2, materialJson: Gltf2Material): void;
  setupMaterial?(
    gltfJson: glTF2,
    materialJson: Gltf2Material,
    material: Material
  ): void;
  setUVTransformToTexture?(material: Material, samplerJson: Gltf2Sampler): void;
  loadExtensionInfoAndSetToRootGroup?(rootGroup: Entity, json: glTF2): void;
}
