import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { Engine } from '../../system/Engine';
import { EventPubSub, type EventSubscriberIndex } from '../../system/EventPubSub';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export type TriggerEventType = 'enter' | 'stay' | 'exit';

export interface TriggerEvent {
  type: TriggerEventType;
  triggerComponent: TriggerComponent;
  triggerEntity: IEntity;
  otherEntity: IEntity;
  sensorBindingId: number;
  otherBindingId?: number;
}

type OverlapPair = {
  sensorEntityUid: EntityUID;
  sensorBindingId: number;
  otherBindingId?: number;
  otherColliderHandle?: number;
};

type ActiveOverlap = {
  otherEntity: IEntity;
  pairs: Map<string, OverlapPair>;
  rebuildingPairs: Map<string, OverlapPair & { suspendedAtStep: number }>;
  enteredThisStep: boolean;
};

/** Groups one or more physics sensors into a logical trigger volume. */
export class TriggerComponent extends Component {
  private static __sensorOwners = new WeakMap<Engine, Map<string, TriggerComponent>>();
  private static __components = new Set<TriggerComponent>();
  private static __physicsStep = 0;
  private __pubsub = new EventPubSub();
  private __sensorKeys = new Set<string>();
  private __activeOverlaps = new Map<IEntity, ActiveOverlap>();

  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.moveStageTo(ProcessStage.Logic);
    TriggerComponent.__components.add(this);
  }

  static get componentTID() {
    return WellKnownComponentTIDs.TriggerComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.TriggerComponentTID;
  }

  subscribe(type: TriggerEventType, handler: (event: TriggerEvent) => void): EventSubscriberIndex {
    return this.__pubsub.subscribe(type, handler as (event: unknown) => void);
  }

  unsubscribe(type: TriggerEventType, index: EventSubscriberIndex): void {
    this.__pubsub.unsubscribe(type, index);
  }

  get activeOverlapCount(): number {
    return this.__activeOverlaps.size;
  }

  /** @internal Associates a PhysicsComponent binding with this logical trigger. */
  _registerSensorBinding(physicsEntityUid: EntityUID, bindingId: number): void {
    const key = TriggerComponent.__sensorKey(physicsEntityUid, bindingId);
    let owners = TriggerComponent.__sensorOwners.get(this.__engine);
    if (owners == null) {
      owners = new Map();
      TriggerComponent.__sensorOwners.set(this.__engine, owners);
    }
    const existing = owners.get(key);
    if (existing != null && existing !== this) {
      throw new Error(`Physics sensor binding ${key} is already owned by another TriggerComponent.`);
    }
    owners.set(key, this);
    this.__sensorKeys.add(key);
  }

  /** @internal Removes ownership when a sensor binding is permanently deleted. */
  static _unregisterSensorBinding(engine: Engine, physicsEntityUid: EntityUID, sensorBindingId: number): void {
    const key = this.__sensorKey(physicsEntityUid, sensorBindingId);
    const owners = this.__sensorOwners.get(engine);
    if (owners == null) {
      return;
    }
    const trigger = owners.get(key);
    if (trigger == null) {
      return;
    }
    this._deactivateSensorBinding(engine, physicsEntityUid, sensorBindingId);
    owners.delete(key);
    if (owners.size === 0) {
      this.__sensorOwners.delete(engine);
    }
    trigger.__sensorKeys.delete(key);
  }

  /** @internal Called by the Rapier event bridge. */
  static _processOverlap(
    engine: Engine,
    sensorEntityUid: EntityUID,
    sensorBindingId: number,
    otherEntity: IEntity,
    otherBindingId: number | undefined,
    started: boolean,
    otherColliderHandle?: number
  ): void {
    const owners = this.__sensorOwners.get(engine);
    const trigger = owners?.get(this.__sensorKey(sensorEntityUid, sensorBindingId));
    if (
      trigger == null ||
      otherEntity === trigger.entity ||
      (otherBindingId != null &&
        otherEntity.engine === engine &&
        owners?.get(this.__sensorKey(otherEntity.entityUID, otherBindingId)) === trigger)
    ) {
      return;
    }
    const otherKey =
      otherColliderHandle == null ? `binding:${otherBindingId ?? 'external'}` : `collider:${otherColliderHandle}`;
    const pairKey = `${sensorEntityUid}:${sensorBindingId}:${otherKey}`;
    let overlap = trigger.__activeOverlaps.get(otherEntity);
    if (started) {
      if (overlap == null) {
        overlap = { otherEntity, pairs: new Map(), rebuildingPairs: new Map(), enteredThisStep: true };
        trigger.__activeOverlaps.set(otherEntity, overlap);
      }
      const wasEmpty = overlap.pairs.size === 0 && overlap.rebuildingPairs.size === 0;
      overlap.pairs.set(pairKey, { sensorEntityUid, sensorBindingId, otherBindingId, otherColliderHandle });
      overlap.rebuildingPairs.clear();
      if (wasEmpty) {
        trigger.__publish('enter', overlap.otherEntity, sensorBindingId, otherBindingId);
      }
    } else if (overlap != null) {
      overlap.pairs.delete(pairKey);
      if (overlap.pairs.size === 0 && overlap.rebuildingPairs.size === 0) {
        trigger.__activeOverlaps.delete(otherEntity);
        trigger.__publish('exit', overlap.otherEntity, sensorBindingId, otherBindingId);
      }
    }
  }

  /** @internal Starts reconciliation of collider pairs suspended before this physics step. */
  static _beginPhysicsStep(): void {
    this.__physicsStep++;
  }

  /** @internal Ends suspended overlaps that were not restored by the current physics step. */
  static _finalizeRebuiltOverlaps(): void {
    for (const trigger of this.__components) {
      for (const [otherEntity, overlap] of [...trigger.__activeOverlaps]) {
        const expired = [...overlap.rebuildingPairs.entries()].filter(
          ([, pair]) => pair.suspendedAtStep < this.__physicsStep
        );
        for (const [pairKey] of expired) {
          overlap.rebuildingPairs.delete(pairKey);
        }
        if (expired.length > 0 && overlap.pairs.size === 0 && overlap.rebuildingPairs.size === 0) {
          trigger.__activeOverlaps.delete(otherEntity);
          const pair = expired[0][1];
          trigger.__publish('exit', overlap.otherEntity, pair.sensorBindingId, pair.otherBindingId);
        }
      }
    }
  }

  /** @internal Emits one Stay event per active logical overlap after each physics step. */
  static _publishStayEvents(engine?: Engine): void {
    for (const trigger of this.__components) {
      if (engine != null && trigger.entity.engine !== engine) {
        continue;
      }
      for (const overlap of trigger.__activeOverlaps.values()) {
        if (overlap.enteredThisStep) {
          overlap.enteredThisStep = false;
          continue;
        }
        const pair = overlap.pairs.values().next().value;
        if (pair != null) {
          trigger.__publish('stay', overlap.otherEntity, pair.sensorBindingId, pair.otherBindingId);
        }
      }
    }
  }

  /** @internal Temporarily suspends overlaps owned by a sensor collider that is being rebuilt. */
  static _suspendSensorBinding(engine: Engine, physicsEntityUid: EntityUID, sensorBindingId: number): void {
    const trigger = this.__sensorOwners.get(engine)?.get(this.__sensorKey(physicsEntityUid, sensorBindingId));
    if (trigger == null) return;
    for (const overlap of trigger.__activeOverlaps.values()) {
      const suspended = [...overlap.pairs.entries()].filter(
        ([, pair]) => pair.sensorEntityUid === physicsEntityUid && pair.sensorBindingId === sensorBindingId
      );
      for (const [pairKey, pair] of suspended) {
        overlap.pairs.delete(pairKey);
        overlap.rebuildingPairs.set(pairKey, { ...pair, suspendedAtStep: this.__physicsStep });
      }
    }
  }

  /** @internal Temporarily suspends overlaps in which a collider being rebuilt is the non-owning side. */
  static _suspendOtherBinding(
    otherEntity: IEntity,
    otherBindingId: number | undefined,
    otherColliderHandle?: number
  ): void {
    for (const trigger of this.__components) {
      const overlap = trigger.__activeOverlaps.get(otherEntity);
      if (overlap == null) {
        continue;
      }
      const suspended = [...overlap.pairs.entries()].filter(([, pair]) =>
        this.__matchesOtherBinding(pair, otherBindingId, otherColliderHandle)
      );
      for (const [pairKey, pair] of suspended) {
        overlap.pairs.delete(pairKey);
        overlap.rebuildingPairs.set(pairKey, { ...pair, suspendedAtStep: this.__physicsStep });
      }
    }
  }

  /** @internal Ends overlaps owned by a sensor collider that is being permanently removed. */
  static _deactivateSensorBinding(engine: Engine, physicsEntityUid: EntityUID, sensorBindingId: number): void {
    const trigger = this.__sensorOwners.get(engine)?.get(this.__sensorKey(physicsEntityUid, sensorBindingId));
    if (trigger == null) return;
    for (const [otherEntity, overlap] of [...trigger.__activeOverlaps]) {
      const matches = ([, pair]: [string, OverlapPair]) =>
        pair.sensorEntityUid === physicsEntityUid && pair.sensorBindingId === sensorBindingId;
      const removed = [...overlap.pairs.entries()].filter(matches);
      const removedRebuilding = [...overlap.rebuildingPairs.entries()].filter(matches);
      for (const [pairKey] of removed) overlap.pairs.delete(pairKey);
      for (const [pairKey] of removedRebuilding) overlap.rebuildingPairs.delete(pairKey);
      if (
        removed.length + removedRebuilding.length > 0 &&
        overlap.pairs.size === 0 &&
        overlap.rebuildingPairs.size === 0
      ) {
        trigger.__activeOverlaps.delete(otherEntity);
        const pair = (removed[0] ?? removedRebuilding[0])[1];
        trigger.__publish('exit', overlap.otherEntity, pair.sensorBindingId, pair.otherBindingId);
      }
    }
  }

  /** @internal Ends overlaps in which a collider being removed is the non-owning side. */
  static _deactivateOtherBinding(
    otherEntity: IEntity,
    otherBindingId: number | undefined,
    otherColliderHandle?: number
  ): void {
    for (const trigger of this.__components) {
      const overlap = trigger.__activeOverlaps.get(otherEntity);
      if (overlap == null) {
        continue;
      }
      const matches = ([, pair]: [string, OverlapPair]) =>
        this.__matchesOtherBinding(pair, otherBindingId, otherColliderHandle);
      const removed = [...overlap.pairs.entries()].filter(matches);
      const removedRebuilding = [...overlap.rebuildingPairs.entries()].filter(matches);
      for (const [pairKey] of removed) {
        overlap.pairs.delete(pairKey);
      }
      for (const [pairKey] of removedRebuilding) {
        overlap.rebuildingPairs.delete(pairKey);
      }
      if (
        removed.length + removedRebuilding.length > 0 &&
        overlap.pairs.size === 0 &&
        overlap.rebuildingPairs.size === 0
      ) {
        trigger.__activeOverlaps.delete(otherEntity);
        const pair = (removed[0] ?? removedRebuilding[0])[1];
        trigger.__publish('exit', overlap.otherEntity, pair.sensorBindingId, pair.otherBindingId);
      }
    }
  }

  private __publish(type: TriggerEventType, otherEntity: IEntity, sensorBindingId: number, otherBindingId?: number) {
    this.__pubsub.publishSync(type, {
      type,
      triggerComponent: this,
      triggerEntity: this.entity,
      otherEntity,
      sensorBindingId,
      otherBindingId,
    } satisfies TriggerEvent);
  }

  private static __sensorKey(entityUid: EntityUID, bindingId: number): string {
    return `${entityUid}:${bindingId}`;
  }

  private static __matchesOtherBinding(
    pair: OverlapPair,
    otherBindingId: number | undefined,
    otherColliderHandle: number | undefined
  ): boolean {
    if (otherBindingId != null) {
      return pair.otherBindingId === otherBindingId;
    }
    return otherColliderHandle == null ? pair.otherBindingId == null : pair.otherColliderHandle === otherColliderHandle;
  }

  _destroy(): void {
    const owners = TriggerComponent.__sensorOwners.get(this.__engine);
    for (const key of this.__sensorKeys) {
      owners?.delete(key);
    }
    if (owners?.size === 0) {
      TriggerComponent.__sensorOwners.delete(this.__engine);
    }
    this.__sensorKeys.clear();
    this.__activeOverlaps.clear();
    TriggerComponent.__components.delete(this);
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class TriggerEntity extends (base.constructor as any) {
      getTrigger() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.TriggerComponentTID) as TriggerComponent;
      }
    }
    applyMixins(base, TriggerEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
