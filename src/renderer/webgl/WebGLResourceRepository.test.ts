import WebGLResourceRepository from './WebGLResourceRepository';
import EntityRepository from '../../core/EntityRepository';
import TransformComponent from '../../components/TransformComponent';
import SceneGraphComponent from '../../components/SceneGraphComponent';
import MeshComponent from '../../components/MeshComponent';
import Primitive from '../../geometry/Primitive';
import { CompositionType } from '../../definitions/CompositionType';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import GLSLShader from './GLSLShader';

const puppeteer = require('puppeteer')

const timeout = 5000;

//let browser;
let page: any;
beforeAll(async () => {
}, timeout)

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID, MeshComponent.componentTID]);
  return entity;
}

function readyBasicVerticesData() {
  const indices = new Float32Array([
    0, 1, 3, 3, 1, 2
  ]);

  const positions = new Float32Array([
    -1.5, -0.5, 0.0,
    -0.5, -0.5, 0.0,
    -0.5, 0.5, 0.0,
    -1.5, 0.5, 0.0
  ]);

  const colors = new Float32Array([
    0.0, 1.0, 1.0,
    1.0, 1.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 0.0, 1.0
  ]);

  const primitive = Primitive.createPrimitive({
    indices: indices,
    attributeCompositionTypes: [CompositionType.Mat3, CompositionType.Mat3],
    attributeSemantics: [VertexAttribute.Position, VertexAttribute.Color0],
    attributes: [positions, colors],
    material: 0,
    primitiveMode: PrimitiveMode.Triangles
  });

  return primitive;
}

test('Create WebGL resources.', async () => {
  const repo: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  var width   = 64
  var height  = 64
  var gl = require('gl')(width, height)

  repo.addWebGLContext(gl, true);

  const firstEntity = generateEntity();

  const primitive = readyBasicVerticesData();
  const meshComponent = firstEntity.getComponent(MeshComponent.componentTID) as MeshComponent;
  meshComponent.addPrimitive(primitive);


  const ib_uid = repo.createIndexBuffer(primitive.indicesAccessor!);
  const ib_handle = repo.getWebGLResource(ib_uid);

  const vb_pos_uid = repo.createIndexBuffer(primitive.attributeAccessors[0]!);
  const vb_pos_handle = repo.getWebGLResource(vb_pos_uid);
  const vb_col_uid = repo.createIndexBuffer(primitive.attributeAccessors[1]!);
  const vb_col_handle = repo.getWebGLResource(vb_col_uid);

  expect(ib_handle).not.toBe(undefined);
  expect(ib_handle).not.toBe(-1);
  expect(vb_pos_handle).not.toBe(undefined);
  expect(vb_pos_handle).not.toBe(-1);
  expect(vb_col_handle).not.toBe(undefined);
  expect(vb_col_handle).not.toBe(-1);

});

test('Create WebGL resources. 2', async () => {
  const repo: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  var width   = 64
  var height  = 64
  var gl = require('gl')(width, height)

  repo.addWebGLContext(gl, true);

  const firstEntity = generateEntity();

  const primitive = readyBasicVerticesData();
  const meshComponent = firstEntity.getComponent(MeshComponent.componentTID) as MeshComponent;
  meshComponent.addPrimitive(primitive);

  // const vertexUids = repo.createVertexDataResources(primitive);

  // const shaderProgramUid = repo.createShaderProgram(
  //   GLSLShader.vertexShader,
  //   GLSLShader.fragmentShader,
  //   GLSLShader.attributeNanes,
  //   GLSLShader.attributeSemantics);

  // repo.setVertexDataToShaderProgram(vertexUids, shaderProgramUid, primitive);


});

afterAll(() => {
})

