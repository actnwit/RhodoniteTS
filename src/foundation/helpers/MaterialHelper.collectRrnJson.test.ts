import { expect, test } from 'vitest';
import { createRaymarchingEntity } from '../components/Raymarching/createRaymarchingEntity';
import { CompositionType } from '../definitions/CompositionType';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { SdfShapeType } from '../definitions/SdfShapeType';
import { Vector3 } from '../math/Vector3';
import { Engine } from '../system/Engine';
import { MaterialHelper } from './MaterialHelper';

function createUnionOnlyGraph(): any {
  return {
    nodes: [
      {
        id: 'out',
        name: 'OutUnion',
        outputs: {},
        inputs: { in1: { id: 'out_in', label: 'In Scalar<float>', socket: { name: 'Scalar<float>' } } },
        controls: {},
        position: { x: 0, y: 0 },
      },
    ],
    connections: [],
  };
}

function getObjectIdNodes(collected: any) {
  return collected.nodes.filter((node: any) => node.name === 'RaymarchObjectIdUniform');
}

test('collectRrnJson assigns a stable component SID based object id', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entityA = createRaymarchingEntity(engine);
  const entityB = createRaymarchingEntity(engine);
  entityA.getRaymarching().rrnJson = createUnionOnlyGraph();
  entityB.getRaymarching().rrnJson = createUnionOnlyGraph();

  const collected = MaterialHelper.collectRrnJson(engine) as any;
  const objectIdNodes = getObjectIdNodes(collected);
  expect(objectIdNodes).toHaveLength(2);
  expect(new Set(objectIdNodes.map((node: any) => node.controls.name.value)).size).toBe(2);

  const unions = collected.nodes.filter((node: any) => node.name === 'OutUnion');
  expect(unions).toHaveLength(2);
  for (const union of unions) {
    const connection = collected.connections.find(
      (conn: any) => conn.to.id === union.id && conn.to.portName === 'objectId'
    );
    expect(connection).toBeDefined();
    const source = objectIdNodes.find((node: any) => node.id === connection.from.id);
    expect(source).toBeDefined();
    // The id node of a component feeds only that component's unions and its id is
    // derived from the component SID, which is also the node id prefix.
    const sid = Number.parseInt(source.controls.name.value.replace('raymarchObjectId_', ''), 10);
    expect(source.id.startsWith(`comp${sid}_`)).toBe(true);
    expect(union.id.startsWith(`comp${sid}_`)).toBe(true);
  }

  // The ids do not change when another component is removed.
  const survivor = objectIdNodes[1];
  engine.entityRepository.deleteEntityRecursively(entityA.entityUID);
  const collectedAfterDelete = MaterialHelper.collectRrnJson(engine) as any;
  const remainingNodes = getObjectIdNodes(collectedAfterDelete);
  expect(remainingNodes).toHaveLength(1);
  expect(remainingNodes[0].controls.name.value).toBe(survivor.controls.name.value);
  expect(remainingNodes[0].id).toBe(survivor.id);
});

test('collectRrnJson passes the component world matrix to the SDF terminals for distance scaling', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entity = createRaymarchingEntity(engine);
  const raymarchingComponent = entity.getRaymarching();
  raymarchingComponent.sdfShapeType = SdfShapeType.Box;

  const collected = MaterialHelper.collectRrnJson(engine) as any;
  const union = collected.nodes.find((node: any) => node.name === 'OutUnion');
  expect(union).toBeDefined();
  // The terminal scales its local-space distance by the smallest axis scale of this
  // matrix, so a scaled entity no longer loses parts when it is ray marched.
  expect(union.controls.distanceCorrectionMatrices.value).toEqual([`worldMatrix_${raymarchingComponent.componentSID}`]);

  // The component's authored graph is not modified by the merged copy.
  const authoredUnion = raymarchingComponent.rrnJson.nodes.find(node => node.name === 'OutUnion');
  expect(authoredUnion?.controls?.distanceCorrectionMatrices).toBeUndefined();
});

test('creates a per-component raymarching material with its own world matrix semantic', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entity = createRaymarchingEntity(engine);
  const raymarchingComponent = entity.getRaymarching();
  raymarchingComponent.sdfShapeType = SdfShapeType.Box;

  const result = MaterialHelper.createNodeBasedRaymarchingComponentMaterial(engine, raymarchingComponent);
  expect(result).toBeDefined();
  const material = result!.material;

  // The component's graph is cloned and normalized for its own material: the world
  // matrix is one fixed semantic, and the distance terminals read it for correction.
  const graph = material.shaderNodeJson as any;
  const worldMatrixNode = graph.nodes.find((node: any) => node.name === 'SdApplyWorldMatrix');
  expect(worldMatrixNode.controls.name.value).toBe('raymarchingWorldMatrix');
  const terminal = graph.nodes.find((node: any) => node.name === 'OutUnion');
  expect(terminal.controls.distanceCorrectionMatrices.value).toEqual(['raymarchingWorldMatrix']);

  const semantics = material.fieldsInfoArray.map(info => info.semantic);
  expect(semantics).toContain('raymarchingWorldMatrix');
  expect(semantics).toContain('raymarchAabbMin');
  expect(semantics).toContain('raymarchAabbMax');

  // The authored graph is not mutated by the material preparation.
  const authoredWorldMatrixNode = raymarchingComponent.rrnJson.nodes.find(node => node.name === 'SdApplyWorldMatrix');
  expect(authoredWorldMatrixNode?.controls?.name?.value).toBe(`worldMatrix_${raymarchingComponent.componentSID}`);
});

test('creates per-component SDF shadow caster materials with the normalized world matrix', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entity = createRaymarchingEntity(engine);
  const raymarchingComponent = entity.getRaymarching();
  raymarchingComponent.sdfShapeType = SdfShapeType.Box;

  const regular = MaterialHelper.createNodeBasedRaymarchingComponentShadowMaterial(
    engine,
    raymarchingComponent,
    'regular'
  );
  expect(regular).toBeDefined();
  const regularSemantics = regular!.fieldsInfoArray.map(info => info.semantic);
  expect(regularSemantics).toContain('raymarchingWorldMatrix');
  // The caster march is clipped to the world AABB of the SDF.
  expect(regularSemantics).toContain('raymarchAabbMin');
  expect(regularSemantics).toContain('raymarchAabbMax');
  const graph = regular!.shaderNodeJson as any;
  const terminal = graph.nodes.find((node: any) => node.name === 'OutUnion');
  expect(terminal.controls.distanceCorrectionMatrices.value).toEqual(['raymarchingWorldMatrix']);

  // Point light casters need the per-slot light index and far plane parameters.
  const paraboloid = MaterialHelper.createNodeBasedRaymarchingComponentShadowMaterial(
    engine,
    raymarchingComponent,
    'paraboloidFront'
  );
  expect(paraboloid).toBeDefined();
  const paraboloidSemantics = paraboloid!.fieldsInfoArray.map(info => info.semantic);
  expect(paraboloidSemantics).toContain('lightIndex');
  expect(paraboloidSemantics).toContain('shadowFarPlane');
});

test('declares Uniform node semantics on a per-component raymarching material', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: document.createElement('canvas'),
  });
  const entity = createRaymarchingEntity(engine);
  const raymarchingComponent = entity.getRaymarching();
  raymarchingComponent.sdfShapeType = SdfShapeType.Box;

  // Connect a UniformVector3Float to the box size, like the editor's uniform controls.
  const json = JSON.parse(JSON.stringify(raymarchingComponent.rrnJson));
  const boxNode = json.nodes.find((node: any) => node.name === 'SdBox');
  json.nodes.push({
    id: 'size_uniform',
    name: 'UniformVector3Float',
    outputs: { out1: { id: 'size_uniform_out', label: 'Out', socket: { name: 'Vector3<float>' } } },
    inputs: {},
    controls: {
      name: { value: 'sizeUniform' },
      initialX: { value: 1 },
      initialY: { value: 0.5 },
      initialZ: { value: 2 },
    },
    position: { x: 0, y: 0 },
  });
  json.connections.push({
    id: 'size_uniform_connection',
    from: { id: 'size_uniform', portName: 'out1' },
    to: { id: boxNode.id, portName: 'size' },
  });
  raymarchingComponent.rrnJson = json;

  const result = MaterialHelper.createNodeBasedRaymarchingComponentMaterial(engine, raymarchingComponent);
  expect(result).toBeDefined();
  const material = result!.material;
  const info = material.fieldsInfoArray.find(fieldInfo => fieldInfo.semantic === 'sizeUniform');
  expect(info).toBeDefined();
  expect(info!.compositionType).toBe(CompositionType.Vec3);
  const code: string = (material as any)._materialContent.pixelShaderityObject.code;
  expect(code).toContain('get_sizeUniform(');

  // The shader reflects the same uniform from its "#param" declaration and the
  // material factory declares it explicitly. The material must keep one
  // definition per semantic: duplicates leave the JS-side field pointing at
  // another parameter's memory, so setParameter() updates a slot the shader
  // does not read (the editor's uniform sliders appeared to revert).
  const semantics = material.fieldsInfoArray.map(fieldInfo => fieldInfo.semantic);
  expect(semantics.filter(semantic => semantic === 'sizeUniform')).toHaveLength(1);
  expect(new Set(semantics).size).toBe(semantics.length);

  // Every declared parameter must own a distinct region of the material buffer.
  const byteOffsetToSemantic = new Map<number, string>();
  for (const fieldInfo of material.fieldsInfoArray) {
    const value = material.getParameter(fieldInfo.semantic as any);
    const byteOffset = value?._v?.byteOffset;
    if (byteOffset == null) {
      continue;
    }
    expect(byteOffsetToSemantic.get(byteOffset) ?? fieldInfo.semantic).toBe(fieldInfo.semantic);
    byteOffsetToSemantic.set(byteOffset, fieldInfo.semantic);
  }

  // A runtime update goes to the value the shader reads, not to raymarchAabbMin.
  material.setParameter('sizeUniform', Vector3.fromCopy3(3, 3, 3));
  const sizeUniformValue = material.getParameter('sizeUniform');
  expect([sizeUniformValue._v[0], sizeUniformValue._v[1], sizeUniformValue._v[2]]).toEqual([3, 3, 3]);
  const aabbMinValue = material.getParameter('raymarchAabbMin');
  expect(aabbMinValue._v[0]).not.toBe(3);
});
