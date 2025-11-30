import { EntityRepository } from '../../core/EntityRepository';
import type { ITransformEntity } from '../../helpers/EntityHelper';
import type { Engine } from '../../system/Engine';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createTransformEntity(engine: Engine): ITransformEntity {
  const entity = engine.entityRepository.createEntity();
  const entity1 = engine.entityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.TransformComponentTID,
    entity
  ) as ITransformEntity;
  return entity1;
}
