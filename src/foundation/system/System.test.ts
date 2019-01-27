import System from './System';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';
import WebGLResourceRepository from '../../webgl/WebGLResourceRepository';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent, SceneGraphComponent, MeshComponent]);
  return entity;
}

test('The system does processes', () => {
  const firstEntity = generateEntity();

  const system = System.getInstance();

  const repo: WebGLResourceRepository = WebGLResourceRepository.getInstance();

  var width   = 64
  var height  = 64
  var gl = require('gl')(width, height)

  repo.addWebGLContext(gl, true);


  //system.process();

  //expect(is.defined(null)).toBe(true);
});
