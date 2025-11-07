import { describe, expect, test } from 'vitest';
import type { Gltf2MaterialEx } from '../../types/glTF2ForOutput';
import type { Material } from '../materials/core/Material';
import { __outputKhrMaterialsEmissiveStrengthInfo } from './Gltf2ExporterOps';

const coerceNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);

const createMaterialStub = (params: Record<string, unknown>, isLighting = true) =>
  ({
    isLighting,
    getParameter: (name: string) => params[name],
  }) as unknown as Material;

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
