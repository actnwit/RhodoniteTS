import System from './System';
import EntityRepository from '../core/EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import MeshComponent from '../components/MeshComponent';

function generateEntity() {
  const repo = EntityRepository.getInstance();
  const entity = repo.createEntity([TransformComponent.componentTID, SceneGraphComponent.componentTID, MeshComponent.componentTID]);
  return entity;
}

test('The system does processes', () => {
  const firstEntity = generateEntity();

  const system = System.getInstance();

  system.process();

  //expect(is.defined(null)).toBe(true);
});
