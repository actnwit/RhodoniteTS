import { expect, test } from 'vitest';
import type { RnM2 } from '../../types';
import { LightType } from '../definitions/LightType';
import { ProcessApproach } from '../definitions/ProcessApproach';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Engine } from '../system/Engine';
import { Gltf2Importer } from './Gltf2Importer';
import { ModelConverter } from './ModelConverter';

type PunctualLightType = 'spot' | 'directional' | 'point';

function createLightGltf(lightType: PunctualLightType, castShadow = false): RnM2 {
  const light: Record<string, unknown> = {
    type: lightType,
    color: [1, 1, 1],
    intensity: 1,
  };
  if (lightType === 'spot') {
    light.spot = { innerConeAngle: 0.2, outerConeAngle: 0.4 };
  }
  if (castShadow) {
    light.extras = { rhodonite: { castShadow: true } };
  }
  return {
    asset: { version: '2.0', extras: {} },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Light', extensions: { KHR_lights_punctual: { light: 0 } } }],
    extensions: { KHR_lights_punctual: { lights: [light] } },
    extensionsUsed: ['KHR_lights_punctual'],
  } as unknown as RnM2;
}

async function importLightEntity(lightType: PunctualLightType, castShadow = false) {
  const gltfModel = createLightGltf(lightType, castShadow);
  await Gltf2Importer._loadInner(gltfModel, {}, {});
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
  ModelConverter.convertToRhodoniteObjectSimple(engine, gltfModel);
  const rnEntities = (gltfModel.asset.extras as { rnEntities: unknown[] }).rnEntities;
  return rnEntities[0] as ISceneGraphEntity;
}

test('attaches a synchronized shadow camera to an imported spot light node that casts shadows', async () => {
  const entity = await importLightEntity('spot', true);
  const lightComponent = entity.tryToGetLight();
  expect(lightComponent?.type).toBe(LightType.Spot);
  expect(lightComponent?.castShadow).toBe(true);
  const cameraComponent = entity.tryToGetCamera();
  expect(cameraComponent).toBeDefined();
  expect(cameraComponent!.isSyncToLight).toBe(true);
});

test('attaches a synchronized shadow camera to an imported directional light node that casts shadows', async () => {
  const entity = await importLightEntity('directional', true);
  const lightComponent = entity.tryToGetLight();
  expect(lightComponent?.type).toBe(LightType.Directional);
  expect(lightComponent?.castShadow).toBe(true);
  const cameraComponent = entity.tryToGetCamera();
  expect(cameraComponent).toBeDefined();
  expect(cameraComponent!.isSyncToLight).toBe(true);
});

test('does not attach a camera to an imported light node that does not cast shadows', async () => {
  // Every camera component adds an entry to the offset tables of the generated shaders, so imported lights that do
  // not cast shadows must not carry a shadow camera (ShadowSystem attaches it when one starts casting shadows).
  const spotEntity = await importLightEntity('spot');
  expect(spotEntity.tryToGetLight()?.castShadow).toBe(false);
  expect(spotEntity.tryToGetCamera()).toBeUndefined();

  const directionalEntity = await importLightEntity('directional');
  expect(directionalEntity.tryToGetCamera()).toBeUndefined();
});

test('does not attach a camera to an imported point light node', async () => {
  const entity = await importLightEntity('point', true);
  const lightComponent = entity.tryToGetLight();
  expect(lightComponent?.type).toBe(LightType.Point);
  expect(entity.tryToGetCamera()).toBeUndefined();
});
