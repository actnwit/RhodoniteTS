import RnObj, { RnType } from "../../dist/rhodonite";
import WebGLResourceRepository from "../../dist/webgl/WebGLResourceRepository";

const Rn: RnType = RnObj as any;

const puppeteer = require('puppeteer')

const timeout = 5000;

//let browser;
let page: any;
// beforeAll(async () => {
// }, timeout)

// function generateEntity() {
//   const repo = Rn.EntityRepository.getInstance();
//   const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent]);
//   return entity;
// }

// function readyBasicVerticesData() {
//   const indices = new Float32Array([
//     0, 1, 3, 3, 1, 2
//   ]);

//   const positions = new Float32Array([
//     -1.5, -0.5, 0.0,
//     -0.5, -0.5, 0.0,
//     -0.5, 0.5, 0.0,
//     -1.5, 0.5, 0.0
//   ]);

//   const colors = new Float32Array([
//     0.0, 1.0, 1.0,
//     1.0, 1.0, 0.0,
//     1.0, 0.0, 0.0,
//     0.0, 0.0, 1.0
//   ]);

//   const primitive = Rn.Primitive.createPrimitive({
//     indices: indices,
//     attributeCompositionTypes: [Rn.CompositionType.Vec3, Rn.CompositionType.Vec3],
//     attributeSemantics: [Rn.VertexAttribute.Position, Rn.VertexAttribute.Color0],
//     attributes: [positions, colors],
//     material: void 0,
//     primitiveMode: Rn.PrimitiveMode.Triangles
//   });

//   return primitive;
// }

// test('Create WebGL resources.', async () => {
//   // console.log(Rn)
//   Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);
//   const RnWebGL = await Rn.ModuleManager.getInstance().loadModule('webgl');

//   const repo: WebGLResourceRepository = RnWebGL.WebGLResourceRepository.getInstance();

//   var width   = 64
//   var height  = 64
//   var gl = require('gl')(width, height)

//   repo.addWebGLContext(gl, {width, height} as HTMLCanvasElement, true, false);

//   const firstEntity = generateEntity();

//   const primitive = readyBasicVerticesData();
//   const meshComponent = firstEntity.getMesh();
//   const mesh = new Rn.Mesh();
//   mesh.addPrimitive(primitive);
//   meshComponent.setMesh(mesh);

//   const ib_uid = repo.createIndexBuffer(primitive.indicesAccessor!);
//   const ib_handle = repo.getWebGLResource(ib_uid);

//   const vb_pos_uid = repo.createIndexBuffer(primitive.attributeAccessors[0]!);
//   const vb_pos_handle = repo.getWebGLResource(vb_pos_uid);
//   const vb_col_uid = repo.createIndexBuffer(primitive.attributeAccessors[1]!);
//   const vb_col_handle = repo.getWebGLResource(vb_col_uid);

//   expect(ib_handle).not.toBe(undefined);
//   expect(ib_handle).not.toBe(-1);
//   expect(vb_pos_handle).not.toBe(undefined);
//   expect(vb_pos_handle).not.toBe(-1);
//   expect(vb_col_handle).not.toBe(undefined);
//   expect(vb_col_handle).not.toBe(-1);

// });

// test('Create WebGL resources. 2', async () => {
//   const RnWebGL = await Rn.ModuleManager.getInstance().loadModule('webgl')
//   const repo: WebGLResourceRepository = RnWebGL.WebGLResourceRepository.getInstance();

//   var width   = 64
//   var height  = 64
//   var gl = require('gl')(width, height)

//   repo.addWebGLContext(gl, {width, height} as HTMLCanvasElement, true, false);

//   const firstEntity = generateEntity();

//   const primitive = readyBasicVerticesData();
//   const meshComponent = firstEntity.getMesh();
//   const mesh = new Rn.Mesh();

//   mesh.addPrimitive(primitive);
//   meshComponent.setMesh(mesh);

// });

// afterAll(() => {
// })


test('dummy', async () => {
  expect(true).toBe(true);
});
