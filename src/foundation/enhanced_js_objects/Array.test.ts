import Rn from '../../../dist/esm';
import type {ArrayAsRn} from '../../../dist/esm';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Array<T> extends ArrayAsRn<T> {}
}

function generateEntity() {
  const repo = Rn.EntityRepository.getInstance();
  const entity = repo.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.MeshComponent,
  ]);
  return entity;
}

test('array[GetComponentFromEntities]', () => {
  Rn.enhanceArray();
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  const entities = [];
  entities.push(generateEntity());
  entities.push(generateEntity());

  // console.log('getComponentFromEntities: ' +  entities.Rn.getComponentFromEntities)

  const components = entities.Rn.getComponentFromEntities(Rn.MeshComponent);
  expect(components[0]).toBeInstanceOf(Rn.MeshComponent);
});
