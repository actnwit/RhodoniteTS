import { EntityRepository } from '../../core/EntityRepository';
import { ITransformEntity } from '../../helpers/EntityHelper';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export function createTransformEntity(): ITransformEntity {
  const entity = EntityRepository.createEntity();
  const entity1 = EntityRepository.tryToAddComponentToEntityByTID(
    WellKnownComponentTIDs.TransformComponentTID,
    entity
  ) as ITransformEntity;
  return entity1;
}
