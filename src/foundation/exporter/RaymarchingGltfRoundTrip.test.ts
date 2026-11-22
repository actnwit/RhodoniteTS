import { expect, test } from 'vitest';
import type { RnM2 } from '../../types';
import type { NodeJSON } from '../../types/NodeJSON';
import { createRaymarchingEntity } from '../components/Raymarching/createRaymarchingEntity';
import { CompositionType } from '../definitions/CompositionType';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { SdfShapeType } from '../definitions/SdfShapeType';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { Gltf2Importer } from '../importer/Gltf2Importer';
import { ModelConverter } from '../importer/ModelConverter';
import type { Material } from '../materials/core/Material';
import { Vector3 } from '../math/Vector3';
import { Engine } from '../system/Engine';
import { GLTF2_EXPORT_NO_DOWNLOAD, Gltf2Exporter } from './Gltf2Exporter';

function createSphereGraph(): NodeJSON {
  return {
    nodes: [
      {
        id: 'init',
        name: 'InitialPosition',
        outputs: { outPosition: { id: 'init_out', label: 'OutPosition', socket: { name: 'Vector3<float>' } } },
        inputs: {},
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'sphere',
        name: 'SdSphere',
        outputs: { outDistance: { id: 'sphere_out', label: 'OutDistance', socket: { name: 'Scalar<float>' } } },
        inputs: {
          position: { id: 'sphere_pos', label: 'Position', socket: { name: 'Vector3<float>' } },
          radius: { id: 'sphere_radius', label: 'Radius', socket: { name: 'Scalar<float>' } },
        },
        controls: {},
        position: { x: 0, y: 0 },
      },
      {
        id: 'radius',
        name: 'ConstantScalarFloat',
        outputs: { out1: { id: 'radius_out', label: 'Scalar<float>Out', socket: { name: 'Scalar<float>' } } },
        inputs: {},
        controls: {
          shaderStage: null,
          in1: { __type: 'NumberInputControl', id: 'radius_ctrl', value: 1, step: 0.1 },
        },
        position: { x: 0, y: 0 },
      },
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'InScalar<float>', socket: { name: 'Scalar<float>' } } },
        controls: { shaderStage: null },
        position: { x: 0, y: 0 },
      },
    ],
    connections: [
      { id: 'c1', from: { id: 'init', portName: 'outPosition' }, to: { id: 'sphere', portName: 'position' } },
      { id: 'c2', from: { id: 'radius', portName: 'out1' }, to: { id: 'sphere', portName: 'radius' } },
      { id: 'c3', from: { id: 'sphere', portName: 'outDistance' }, to: { id: 'out', portName: 'in1' } },
    ],
  } as NodeJSON;
}

function parseGlbJson(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const jsonLength = view.getUint32(12, true);
  return JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
}

async function createExportEngine() {
  return Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
}

async function exportEntity(engine: Engine, entity: ISceneGraphEntity, name: string) {
  return Gltf2Exporter.export(engine, name, {
    entities: [entity],
    type: GLTF2_EXPORT_NO_DOWNLOAD,
  });
}

/**
 * Imports the JSON chunk of an exported GLB through the same conversion path the importer uses.
 * This keeps the test free of the WebGL-only parts of the importer while still exercising the
 * RHODONITE_raymarching node extension handling.
 */
async function importGltfJson(gltfModel: RnM2) {
  gltfModel.asset.extras ??= {};
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
    notToDisplayRnInfoAtInit: true,
  });
  await Gltf2Importer._loadInner(gltfModel, {}, {});
  ModelConverter.convertToRhodoniteObjectSimple(engine, gltfModel);
  const rnEntities = (gltfModel.asset.extras as { rnEntities: ISceneGraphEntity[] }).rnEntities;
  return { engine, rnEntities };
}

/**
 * A stand-in for the shared raymarching material. The exporter only needs the field list and the
 * texture parameters, so the texture is represented by a canvas whose toBlob returns a tiny PNG.
 */
function createMockRaymarchingMaterial(): Material {
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const fakeCanvas = {
    toBlob(callback: (blob: Blob | null) => void) {
      callback(new Blob([pngBytes], { type: 'image/png' }));
    },
  };
  const fakeSampler = {
    magFilter: { index: 9729 },
    minFilter: { index: 9987 },
    wrapS: { index: 10497 },
    wrapT: { index: 10497 },
  };
  const fakeTexture = {
    textureUID: 42,
    name: 'TestTexture',
    isTextureReady: true,
    isDummyTexture: false,
    width: 1,
    height: 1,
    htmlCanvasElement: fakeCanvas,
  };
  return {
    shaderNodeJson: {
      nodes: [{ name: 'Texture2D', controls: { name: { value: 'u_testTexture' } } }],
      connections: [],
    },
    fieldsInfoArray: [
      { semantic: 'u_testTexture', compositionType: CompositionType.Texture2D },
      { semantic: 'diffuseEnvTexture', compositionType: CompositionType.Texture2D },
      { semantic: 'sheenLutTexture', compositionType: CompositionType.Texture2D },
      { semantic: 'depthTexture', compositionType: CompositionType.Texture2DArray },
    ],
    getTextureParameter: () => [0, fakeTexture, fakeSampler],
  } as unknown as Material;
}

test('exports a RaymarchingComponent graph as a glTF node extension', async () => {
  const exportEngine = await createExportEngine();
  const entity = createRaymarchingEntity(exportEngine);
  entity.position = Vector3.fromCopy3(1, 2, 3);
  entity.tryToSetUniqueName('Test Raymarching', true);
  entity.getRaymarching().rrnJson = createSphereGraph();
  entity.getRaymarching().isPickable = false;

  const buffer = await exportEntity(exportEngine, entity, 'RaymarchingExport');
  const json = parseGlbJson(buffer);
  const extension = json.nodes[0].extensions.RHODONITE_raymarching;
  expect(json.extensionsUsed).toContain('RHODONITE_raymarching');
  expect(extension.graph.nodes).toHaveLength(4);
  expect(extension.isPickable).toBe(false);
  expect(json.nodes[0].translation).toEqual([1, 2, 3]);
  expect(json.extensions?.RHODONITE_raymarching_materials).toBeUndefined();
});

test('imports a RHODONITE_raymarching node and rebuilds the material from its graph', async () => {
  const exportEngine = await createExportEngine();
  const entity = createRaymarchingEntity(exportEngine);
  entity.getTransform().localPosition = Vector3.fromCopy3(0.5, 0, 0);
  entity.getRaymarching().rrnJson = createSphereGraph();
  entity.getRaymarching().isPickable = false;

  const buffer = await exportEntity(exportEngine, entity, 'RaymarchingImport');
  const gltfModel = parseGlbJson(buffer) as RnM2;
  const { engine, rnEntities } = await importGltfJson(gltfModel);

  const imported = rnEntities.find(rnEntity => rnEntity.tryToGetRaymarching() != null);
  const raymarching = imported!.tryToGetRaymarching()!;
  expect(raymarching.rrnJson.nodes).toHaveLength(4);
  expect(raymarching.rrnJson.connections).toHaveLength(3);
  expect(raymarching.isPickable).toBe(false);
  expect(imported!.getTransform().localPosition._v[0]).toBeCloseTo(0.5, 5);

  // The application (the editor's node editor) rebuilds the shared material from the graph.
  const result = MaterialHelper.createNodeBasedRaymarchingCustomMaterial(engine, raymarching.rrnJson as any);
  expect(result).toBeDefined();
  expect(result!.material.getShaderDefines()).toContain('RN_USE_PBR');
});

test('imports the sdfShapeType when the node extension has no graph', async () => {
  const exportEngine = await createExportEngine();
  const entity = createRaymarchingEntity(exportEngine);
  entity.getRaymarching().sdfShapeType = SdfShapeType.Sphere;

  const buffer = await exportEntity(exportEngine, entity, 'RaymarchingShapeOnly');
  const gltfModel = parseGlbJson(buffer) as RnM2;
  const extension = (gltfModel.nodes![0].extensions as Record<string, any>).RHODONITE_raymarching;
  // The graph is optional: assets that only use the built-in SDF shape store no graph.
  extension.graph = undefined;
  extension.sdfShapeType = SdfShapeType.Box.index;

  const { rnEntities } = await importGltfJson(gltfModel);
  const imported = rnEntities.find(rnEntity => rnEntity.tryToGetRaymarching() != null);
  expect(imported!.tryToGetRaymarching()!.sdfShapeType.index).toBe(SdfShapeType.Box.index);
});

test('exports the shared raymarching material textures as a root extension', async () => {
  const exportEngine = await createExportEngine();
  const entity = createRaymarchingEntity(exportEngine);
  entity.getRaymarching().rrnJson = createSphereGraph();

  const buffer = await Gltf2Exporter.export(exportEngine, 'RaymarchingMaterialExport', {
    entities: [entity],
    type: GLTF2_EXPORT_NO_DOWNLOAD,
    raymarchingMaterial: createMockRaymarchingMaterial(),
  });
  const json = parseGlbJson(buffer);

  expect(json.extensionsUsed).toContain('RHODONITE_raymarching_materials');
  // Engine-managed semantics (the sheen LUT and shadow maps) must not be exported.
  expect(json.extensions.RHODONITE_raymarching_materials).toEqual({
    textures: { u_testTexture: { index: 0 } },
  });
  expect(json.textures).toHaveLength(1);
  expect(json.textures[0].source).toBe(0);
  expect(json.samplers).toHaveLength(1);
  expect(json.images).toHaveLength(1);
  expect(json.images[0].mimeType).toBe('image/png');
  expect(json.images[0].bufferView).toBeDefined();
});

test('parses the raymarching material texture assignments from the root extension', () => {
  const gltfModel = {
    asset: { version: '2.0', extras: {} },
    extensions: {
      RHODONITE_raymarching_materials: {
        textures: {
          u_texture: { index: 0 },
          u_outOfRange: { index: 5 },
          u_withoutIndex: {},
        },
      },
    },
    images: [{ bufferView: 0, mimeType: 'image/png' }],
    textures: [{ sampler: 1, source: 0 }],
    samplers: [{}, {}],
  } as unknown as RnM2;

  expect(ModelConverter.getRaymarchingMaterialTextureAssignments(gltfModel)).toEqual([
    { semantic: 'u_texture', textureIndex: 0, samplerIndex: 1 },
  ]);
  expect(
    ModelConverter.getRaymarchingMaterialTextureAssignments({ asset: { version: '2.0' } } as unknown as RnM2)
  ).toEqual([]);
});
