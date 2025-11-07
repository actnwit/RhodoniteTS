import { describe, expect, test } from 'vitest';
import type { Gltf2Ex, Gltf2MaterialEx } from '../../types/glTF2ForOutput';
import type { Material } from '../materials/core/Material';
import {
  __outputBaseMaterialInfo,
  __outputKhrMaterialsEmissiveStrengthInfo,
  __outputKhrMaterialsVolumeInfo,
  __setupMaterialBasicProperties,
} from './Gltf2ExporterOps';

const coerceNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);
const coerceVec3 = (value: unknown) =>
  Array.isArray(value) && value.length === 3 && value.every(component => typeof component === 'number')
    ? (value as [number, number, number])
    : undefined;

const createMaterialStub = (
  params: Record<string, unknown>,
  options: boolean | { isLighting?: boolean; alphaMode?: string; textureParams?: Record<string, unknown> } = true
) => {
  const normalized = typeof options === 'boolean' ? { isLighting: options } : options;
  const { isLighting = true, alphaMode = 'OPAQUE', textureParams = {} } = normalized;
  return {
    isLighting,
    alphaMode: {
      toGltfString: () => alphaMode,
    },
    getParameter: (name: string) => params[name],
    getTextureParameter: (name: string) => textureParams[name],
  } as unknown as Material;
};

const createJsonStub = (): Gltf2Ex =>
  ({
    asset: { version: '2.0', generator: 'test' },
    buffers: [],
    bufferViews: [],
    accessors: [],
    animations: [],
    meshes: [],
    skins: [],
    materials: [],
    textures: [],
    images: [],
    extensions: {},
    cameras: [],
    samplers: [],
    extensionsUsed: [],
    extras: { rnSkins: [], bufferViewByteLengthAccumulatedArray: [] },
  }) as unknown as Gltf2Ex;

describe('__setupMaterialBasicProperties', () => {
  test('marks unlit materials and applies recommended fallback values', () => {
    const json = createJsonStub();
    const rnMaterial = createMaterialStub(
      {
        metallicFactor: 0.9,
        roughnessFactor: 0.1,
        emissiveFactor: { x: 0.1, y: 0.2, z: 0.3 },
      },
      { isLighting: false }
    );
    const material: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };

    __setupMaterialBasicProperties(material, rnMaterial, json);

    expect(material.extensions?.KHR_materials_unlit).toEqual({});
    expect(json.extensionsUsed).toContain('KHR_materials_unlit');
    expect(material.pbrMetallicRoughness.metallicFactor).toBe(0);
    expect(material.pbrMetallicRoughness.roughnessFactor).toBeGreaterThanOrEqual(0.5);
    expect(material.emissiveFactor).toEqual([0, 0, 0]);
  });
});

describe('__outputBaseMaterialInfo', () => {
  test('skips lighting-specific textures when requested', () => {
    const json = createJsonStub();
    const rnMaterial = createMaterialStub(
      {
        metallicFactor: 1,
        roughnessFactor: 1,
      },
      { textureParams: {} }
    );
    const material: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };
    const requested: string[] = [];
    const applyTexture: Parameters<typeof __outputBaseMaterialInfo>[1] = (paramName, options) => {
      requested.push(paramName);
      options.onAssign({ index: 0 });
    };

    __outputBaseMaterialInfo(rnMaterial, applyTexture, material, json, { skipAdditionalTextures: true });

    expect(requested).toEqual(['baseColorTexture', 'diffuseColorTexture']);
  });
});

describe('__outputKhrMaterialsEmissiveStrengthInfo', () => {
  test('writes the extension when emissiveStrength differs from default', () => {
    const ensureLog: string[] = [];
    const ensureExtensionUsed = (name: string) => ensureLog.push(name);
    const rnMaterial = createMaterialStub({ emissiveStrength: 5 }, true);
    const material: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };

    __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed, coerceNumber, rnMaterial, material);

    expect(material.extensions?.KHR_materials_emissive_strength).toEqual({ emissiveStrength: 5 });
    expect(ensureLog).toContain('KHR_materials_emissive_strength');
  });

  test('skips export for unlit materials or default strength', () => {
    const ensureExtensionUsed = () => {
      throw new Error('should not be called');
    };
    const rnMaterial = createMaterialStub({ emissiveStrength: 2 }, true);
    const unlitMaterial: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
      extensions: {
        KHR_materials_unlit: {},
      },
    };

    __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed, coerceNumber, rnMaterial, unlitMaterial);
    expect(unlitMaterial.extensions?.KHR_materials_emissive_strength).toBeUndefined();

    const rnDefaultMaterial = createMaterialStub({ emissiveStrength: 1 }, true);
    const defaultMaterial: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };

    __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed, coerceNumber, rnDefaultMaterial, defaultMaterial);
    expect(defaultMaterial.extensions?.KHR_materials_emissive_strength).toBeUndefined();

    const rnNoLighting = createMaterialStub({ emissiveStrength: 10 }, false);
    const noLightingMaterial: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };

    __outputKhrMaterialsEmissiveStrengthInfo(ensureExtensionUsed, coerceNumber, rnNoLighting, noLightingMaterial);
    expect(noLightingMaterial.extensions?.KHR_materials_emissive_strength).toBeUndefined();
  });
});

describe('__outputKhrMaterialsVolumeInfo', () => {
  const noopApplyTexture: Parameters<typeof __outputKhrMaterialsVolumeInfo>[4] = (_paramName, _options) => {
    /* noop */
  };

  test('omits attenuationDistance when value is not positive', () => {
    const ensureLog: string[] = [];
    const ensureExtensionUsed = (name: string) => ensureLog.push(name);
    const rnMaterial = createMaterialStub({
      thicknessFactor: 0.25,
      attenuationDistance: 0,
    });
    const material: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };

    __outputKhrMaterialsVolumeInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec3,
      rnMaterial,
      noopApplyTexture,
      material
    );

    const volumeExtension = material.extensions?.KHR_materials_volume as Record<string, unknown> | undefined;
    expect(volumeExtension).toBeDefined();
    expect(volumeExtension?.attenuationDistance).toBeUndefined();
    expect(ensureLog).toContain('KHR_materials_volume');
  });

  test('exports attenuationDistance only for positive values', () => {
    const ensureLog: string[] = [];
    const ensureExtensionUsed = (name: string) => ensureLog.push(name);
    const rnMaterial = createMaterialStub({
      attenuationDistance: 5,
    });
    const material: Gltf2MaterialEx = {
      pbrMetallicRoughness: {},
    };

    __outputKhrMaterialsVolumeInfo(
      ensureExtensionUsed,
      coerceNumber,
      coerceVec3,
      rnMaterial,
      noopApplyTexture,
      material
    );

    const volumeExtension = material.extensions?.KHR_materials_volume as Record<string, unknown> | undefined;
    expect(volumeExtension?.attenuationDistance).toBe(5);
    expect(ensureLog).toContain('KHR_materials_volume');
  });
});
