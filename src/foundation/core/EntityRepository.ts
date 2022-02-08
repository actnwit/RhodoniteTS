import Entity, {IEntity} from './Entity';
import Component from './Component';
import ComponentRepository from './ComponentRepository';
import {RnTags, EntityUID, ComponentTID} from '../../types/CommonTypes';
import {Is} from '../misc/Is';
import {valueWithCompensation} from '../misc/MiscUtil';
import { ComponentType } from '../definitions/ComponentType';
/**
 * The class that generates and manages entities.
 */
export default class EntityRepository {
  private __entity_uid_count: number;
  private __entities: Array<IEntity>;
  private static __instance: EntityRepository;
  private __componentRepository: ComponentRepository;
  _components: Array<Map<ComponentTID, Component>>; // index is EntityUID

  private constructor() {
    this.__entity_uid_count = Entity.invalidEntityUID;

    this.__entities = [];
    this._components = [];
    this.__componentRepository = ComponentRepository.getInstance();
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new EntityRepository();
    }
    return this.__instance;
  }

  /**
   * Creates an entity
   */
  createEntity(): IEntity {
    const entity = new Entity(++this.__entity_uid_count, true);
    this.__entities[this.__entity_uid_count] = entity;

    return entity;
  }

  // /**
  //  * Creates an entity which has the given types of the components
  //  * @param componentClasses The class objects of the components.
  //  * @param entityClass a custom entity class
  //  */
  // createCustomEntity<DerivedEntity extends typeof Entity>(
  //   componentClasses: Array<typeof Component>,
  //   entityClass: DerivedEntity
  // ): IEntity[] {
  //   const entity = new entityClass(++this.__entity_uid_count, true);
  //   this.__entities[this.__entity_uid_count] = entity;

  //   return componentClasses.flatMap(componentClass =>
  //     this.addComponentToEntity(componentClass, entity.entityUID)
  //   );
  // }

  // /**
  //  * Add components to the entity.
  //  * @param componentClasses The class objects to set to the entity.
  //  * @param entityUid The entityUID of the entity.
  //  */
  // addComponentsToEntity(
  //   componentClasses: Array<typeof Component>,
  //   entityUid: EntityUID
  // ): IEntity {
  //   const entity: IEntity = this.getEntity(entityUid);

  //   let latestEntity: IEntity;
  //   for (let i = 0; i < componentClasses.length; i++) {
  //     const componentClass = componentClasses[i];
  //     const component = this.__componentRepository.createComponent(
  //       componentClass.componentTID,
  //       entityUid,
  //       this
  //     );

  //     if (Is.exist(component)) {
  //       const map = valueWithCompensation({
  //         value: this._components[entity.entityUID],
  //         compensation: () => {
  //           const map = new Map();
  //           this._components[entity.entityUID] = map;
  //           return map;
  //         },
  //       });
  //       map.set(componentClass.componentTID, component);
  //       entity._setComponent(component);
  //     }
  //     latestEntity = this.addComponentToEntity(componentClasses[i], entityUid);
  //   }

  //   return latestEntity;
  // }

  addComponentToEntity<
    ComponentType extends typeof Component,
    EntityType extends IEntity
  >(componentClass: ComponentType, entity: EntityType) {
    // Create Component
    const component = this.__componentRepository.createComponent(
      componentClass.componentTID,
      entity.entityUID,
      this
    );

    // this._components[entityUID] = map<componentTID, component> <-- component
    const map = valueWithCompensation({
      value: this._components[entity.entityUID],
      compensation: () => {
        const map = new Map();
        this._components[entity.entityUID] = map;
        return map;
      },
    });
    map.set(componentClass.componentTID, component);

    // add this component to the entity
    const entityClass = component.addThisComponentToEntity(
      entity,
      componentClass
    );
    entity._setComponent(componentClass, component);

    // create the new Entity using existed entity
    const newEntity = new (entityClass as unknown as typeof Entity)(
      entity.entityUID,
      true,
      entity._getComponentsInner()
    );
    return newEntity as unknown as typeof entityClass;
  }

  /**
   * Remove components from the entity.
   * @param componentClasses The class object of the components to remove.
   * @param entityUid The entityUID of the entity.
   */
  removeComponentsFromEntity(
    componentClasses: Array<typeof Component>,
    entityUid: EntityUID
  ) {
    const entity = this.getEntity(entityUid);

    for (const componentClass of componentClasses) {
      let map = this._components[entity.entityUID];
      if (map == null) {
        map = new Map();
        this._components[entity.entityUID] = map;
      }
      map.delete(componentClass.componentTID);
    }

    return entity;
  }

  /**
   * Gets the entity corresponding to the entityUID.
   * @param entityUid The entityUID of the entity.
   */
  getEntity(entityUid: EntityUID): IEntity {
    return this.__entities[entityUid];
  }

  /**
   * Gets the specified component from the entity.
   * @param entityUid The entity to get the component from.
   * @param componentType The class object of the component to get.
   */
  getComponentOfEntity(
    entityUid: EntityUID,
    componentType: typeof Component
  ): Component | null {
    const entity = this._components[entityUid];
    let component = null;
    if (entity != null) {
      component = entity.get(componentType.componentTID);
      if (component != null) {
        return component;
      } else {
        return null;
      }
    }
    return component;
  }

  /**
   * Search entities by the given tags.
   * @param tags The tags to search
   */
  searchByTags(tags: RnTags) {
    const matchEntities = [];
    for (const entity of this.__entities) {
      if (entity.matchTags(tags)) {
        matchEntities.push(entity);
      }
    }
    return matchEntities;
  }

  /**
   * Gets entity by the unique name.
   * @param uniqueName The unique name of the entity.
   */
  getEntityByUniqueName(uniqueName: string): IEntity | undefined {
    for (const entity of this.__entities) {
      if (entity.uniqueName === uniqueName) {
        return entity;
      }
    }
    return void 0;
  }

  /**
   * @private
   * Gets all entities.
   */
  _getEntities(): IEntity[] {
    return this.__entities.concat();
  }

  /**
   * Gets the number of all entities.
   */
  getEntitiesNumber(): number {
    return this.__entities.length;
  }
}
