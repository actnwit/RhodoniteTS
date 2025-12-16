import { EffekseerComponent, type IEffekseerEntityMethods } from '../../effekseer/EffekseerComponent';
import type { AnimationSampler, AnimationTrackName } from '../../types/AnimationTypes';
import type {
  RnM2,
  RnM2ExtensionRhodoniteMaterialsNode,
  RnM2ExtensionsEffekseerEffect,
  RnM2ExtensionsEffekseerTimeline,
  RnM2ExtensionsEffekseerTimelineItem,
  RnM2Material,
  RnM2TextureUniformValue,
} from '../../types/RnM2';
import type { ShaderNodeJson } from '../../types/ShaderNodeJson';
import {
  AnimationComponent,
  type IAnimationEntityMethods,
  type ISceneGraphEntityMethods,
  type ITransformEntityMethods,
  WellKnownComponentTIDs,
} from '../components';
import type { IEntity } from '../core';
import type { ShaderSemanticsName } from '../definitions';
import { AnimationInterpolation } from '../definitions';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper, type PbrUberMaterialOptions } from '../helpers/MaterialHelper';
import type { Material } from '../materials/core/Material';
import { AnimatedScalar } from '../math/AnimatedScalar';
import { Scalar } from '../math/Scalar';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { DataUtil } from '../misc/DataUtil';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import type { Engine } from '../system/Engine';
import type { Sampler } from '../textures/Sampler';
import type { Texture } from '../textures/Texture';

/**
 * Extension class for importing Rhodonite-specific features from RnM2 format files.
 * Handles billboard and Effekseer effect imports.
 */
export class RhodoniteImportExtension {
  /**
   * Imports billboard configuration from RnM2 format and applies it to scene graph entities.
   * Processes the RHODONITE_billboard extension to enable billboard rendering for specified nodes.
   *
   * @param gltfJson - The RnM2 format JSON data containing billboard extension information
   * @param groups - Array of scene graph entities corresponding to nodes in the RnM2 data
   */
  static importBillboard(gltfJson: RnM2, groups: ISceneGraphEntity[]) {
    const RHODONITE_billboard = 'RHODONITE_billboard';
    if (
      Is.not.exist(gltfJson.extensionsUsed) ||
      gltfJson.extensionsUsed.findIndex(extension => {
        return RHODONITE_billboard === extension;
      }) === -1
    ) {
      return;
    }

    for (const node_i in gltfJson.nodes) {
      const group = groups[node_i];
      const nodeJson = gltfJson.nodes[node_i];
      const sceneGraphComponent = group.getSceneGraph();
      if (nodeJson.extensions !== undefined) {
        if (nodeJson.extensions.RHODONITE_billboard !== undefined) {
          if (nodeJson.extensions.RHODONITE_billboard.isBillboard === true) {
            sceneGraphComponent.isBillboard = true;
          }
        }
      }
    }
  }

  /**
   * Creates a node-based custom material from RHODONITE_materials_node extension data.
   * Uses ShaderGraphResolver to generate shader code from the loaded .rmn JSON,
   * then creates a custom material using MaterialHelper.
   *
   * @param engine - The engine instance
   * @param gltfModel - The glTF model containing textures and samplers
   * @param materialJson - The glTF material JSON containing the extension
   * @param currentMaterial - The current/fallback material to use as base
   * @param rnTextures - Array of loaded Rhodonite textures
   * @param rnSamplers - Array of loaded Rhodonite samplers
   * @returns The created custom material, or the current material if creation fails
   */
  static createNodeBasedMaterial(
    engine: Engine,
    gltfModel: RnM2,
    materialJson: RnM2Material,
    currentMaterial: Material,
    rnTextures: Texture[],
    rnSamplers: Sampler[],
    options: PbrUberMaterialOptions
  ): Material {
    const EXTENSION_NAME = 'RHODONITE_materials_node';
    const extension = materialJson.extensions?.[EXTENSION_NAME] as RnM2ExtensionRhodoniteMaterialsNode | undefined;

    if (!extension?.shaderNodeJson) {
      Logger.default.warn('RHODONITE_materials_node: No shader node JSON loaded for material');
      return currentMaterial;
    }

    // Create custom material using MaterialHelper.createNodeBasedCustomMaterial
    const result = MaterialHelper.createNodeBasedCustomMaterial(
      engine,
      currentMaterial,
      extension.shaderNodeJson as ShaderNodeJson,
      { ...options, maxInstancesNumber: 1 }
    );

    if (!result) {
      Logger.default.error('RHODONITE_materials_node: Failed to create node-based material');
      return currentMaterial;
    }

    const newMaterial = result.material;

    // Apply uniform values if specified (including texture references)
    if (extension.uniforms) {
      this.__applyUniformsToMaterial(newMaterial, extension.uniforms, gltfModel, rnTextures, rnSamplers);
    }

    return newMaterial;
  }

  /**
   * Checks if a material has the RHODONITE_materials_node extension.
   *
   * @param materialJson - The glTF material JSON to check
   * @returns True if the extension is present, false otherwise
   */
  static hasNodeBasedMaterialExtension(materialJson?: RnM2Material): boolean {
    if (!materialJson) return false;
    const EXTENSION_NAME = 'RHODONITE_materials_node';
    const extension = materialJson.extensions?.[EXTENSION_NAME] as RnM2ExtensionRhodoniteMaterialsNode | undefined;
    return Is.exist(extension) && Is.exist(extension.shaderNodeJson);
  }

  /**
   * Checks if a value is a texture uniform reference (has 'index' property).
   *
   * @param value - The value to check
   * @returns True if the value is a texture uniform reference
   */
  private static __isTextureUniform(value: unknown): value is RnM2TextureUniformValue {
    return (
      typeof value === 'object' &&
      value !== null &&
      'index' in value &&
      typeof (value as RnM2TextureUniformValue).index === 'number'
    );
  }

  /**
   * Applies uniform values from the extension to the material.
   *
   * @param material - The material to apply uniforms to
   * @param uniforms - The uniforms object from the extension
   * @param gltfModel - The glTF model containing texture references
   * @param rnTextures - Array of loaded Rhodonite textures
   * @param rnSamplers - Array of loaded Rhodonite samplers
   */
  private static __applyUniformsToMaterial(
    material: Material,
    uniforms: { [name: string]: number | number[] | RnM2TextureUniformValue },
    gltfModel: RnM2,
    rnTextures: Texture[],
    rnSamplers: Sampler[]
  ) {
    for (const [name, value] of Object.entries(uniforms)) {
      try {
        if (this.__isTextureUniform(value)) {
          // Texture reference - get texture and sampler from glTF indices
          const textureIndex = value.index;
          const gltfTexture = gltfModel.textures?.[textureIndex];
          if (gltfTexture != null) {
            const sourceIndex = gltfTexture.source;
            const samplerIndex = gltfTexture.sampler;
            const rnTexture = sourceIndex != null ? rnTextures[sourceIndex] : undefined;
            const rnSampler = samplerIndex != null ? rnSamplers[samplerIndex] : undefined;
            if (rnTexture) {
              material.setTextureParameter(name as ShaderSemanticsName, rnTexture, rnSampler);
            }
          }
        } else if (typeof value === 'number') {
          // Scalar value
          material.setParameter(name, Scalar.fromCopyNumber(value));
        } else if (Array.isArray(value)) {
          // Vector value
          switch (value.length) {
            case 2:
              material.setParameter(name, Vector2.fromCopyArray2(value as [number, number]));
              break;
            case 3:
              material.setParameter(name, Vector3.fromCopyArray3(value as [number, number, number]));
              break;
            case 4:
              material.setParameter(name, Vector4.fromCopyArray4(value as [number, number, number, number]));
              break;
            default:
              Logger.default.warn(
                `RHODONITE_materials_node: Unsupported uniform array length ${value.length} for '${name}'`
              );
          }
        }
      } catch (e) {
        Logger.default.warn(`RHODONITE_materials_node: Failed to set uniform '${name}': ${e}`);
      }
    }
  }

  /**
   * Imports Effekseer effects from RnM2 format and creates corresponding Effekseer components.
   * Processes the RHODONITE_effekseer extension to load particle effects with their configurations.
   *
   * @param gltfJson - The RnM2 format JSON data containing Effekseer extension information
   * @param rootGroup - The root scene graph entity that contains all imported entities
   */
  static importEffect(engine: Engine, gltfJson: RnM2, rootGroup: ISceneGraphEntity) {
    const RHODONITE_effekseer = 'RHODONITE_effekseer';
    if (
      Is.not.exist(gltfJson.extensions) ||
      Is.not.exist(gltfJson.extensions.RHODONITE_effekseer) ||
      gltfJson.extensionsUsed.findIndex(extension => {
        return RHODONITE_effekseer === extension;
      }) === -1
    ) {
      return;
    }
    const entities = rootGroup.getTagValue('rnEntities') as ISceneGraphEntity[];
    const effects = gltfJson.extensions.RHODONITE_effekseer.effects as RnM2ExtensionsEffekseerEffect[];

    for (const effect of effects) {
      const entity = entities[effect.node];
      const effekseerEntity = engine.entityRepository.addComponentToEntity(EffekseerComponent, entity);
      const effekseerComponent = effekseerEntity.getEffekseer();
      effekseerComponent.playJustAfterLoaded = true;
      // effekseerComponent.randomSeed = 1;
      effekseerComponent.isLoop = true;
      if (Is.exist(effect.bufferView)) {
        const rnm2Buffer = gltfJson.buffers[0];
        rnm2Buffer.bufferPromise!.then((arrayBufferOfBuffer: ArrayBuffer) => {
          const imageUint8Array = DataUtil.createUint8ArrayFromBufferViewInfo(
            gltfJson,
            effect.bufferView!,
            arrayBufferOfBuffer
          );
          effekseerComponent.arrayBuffer = (imageUint8Array.buffer as ArrayBuffer).slice(
            imageUint8Array.byteOffset,
            imageUint8Array.byteOffset + imageUint8Array.byteLength
          );
          effekseerComponent.type = 'efkpkg';
        });
      } else if (Is.exist(effect.uri)) {
        effekseerComponent.uri = effect.uri;
        effekseerComponent.type = 'efk';
      } else {
        Logger.default.error('No real effect data.');
      }

      createEffekseerAnimation(engine, effekseerEntity, effect);
    }
  }
}

/**
 * Creates animation data for Effekseer effects based on timeline information.
 * Processes timeline events to control effect playback timing and creates animation components.
 *
 * @param entity - The entity with Effekseer component to add animation to
 * @param effect - The effect data containing timeline information
 */
function createEffekseerAnimation(
  engine: Engine,
  entity: IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods,
  effect: RnM2ExtensionsEffekseerEffect
) {
  const effekseerComponent = entity.getComponentByComponentTID(
    WellKnownComponentTIDs.EffekseerComponentTID
  ) as EffekseerComponent;
  if (Is.exist(effekseerComponent)) {
    effekseerComponent.playJustAfterLoaded = true;
    effekseerComponent.isLoop = true;

    if (Is.exist(effect.timelines)) {
      const timelines = effect.timelines as RnM2ExtensionsEffekseerTimeline[];
      for (const timeline of timelines) {
        const values = timeline.values as RnM2ExtensionsEffekseerTimelineItem[];
        const timelineName = timeline.name;
        const timelineValues = values.map(value => {
          return {
            input: value.input,
            event: value.event,
          };
        });
        let animationComponent = entity.tryToGetAnimation();
        let animationEntity:
          | (IEntity &
              ITransformEntityMethods &
              ISceneGraphEntityMethods &
              IEffekseerEntityMethods &
              IAnimationEntityMethods)
          | undefined;
        if (Is.not.exist(animationComponent)) {
          animationEntity = engine.entityRepository.addComponentToEntity(AnimationComponent, entity);
        }
        animationComponent = animationEntity!.getAnimation();
        const animationSamplers = new Map<AnimationTrackName, AnimationSampler>();
        const trackName = Is.exist(timelineName) ? timelineName : 'Default';
        animationSamplers.set(trackName, {
          input: new Float32Array(timelineValues.map(value => value.input)),
          output: new Float32Array(timelineValues.map(value => (value.event === 'play' ? 1 : 0))),
          outputComponentN: 1,
          interpolationMethod: AnimationInterpolation.Step,
        });
        const newAnimatedValue = new AnimatedScalar(animationSamplers, trackName);
        animationComponent.setAnimation('effekseer', newAnimatedValue);
      }
    }
  }
}
