import Rn from '../../../../dist/esm';

describe('TriggerComponent logical overlaps', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });

  test('aggregates physical pairs and emits enter, stay, and exit once per logical overlap', () => {
    const triggerEntity = engine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(engine)
    );
    const otherEntity = Rn.createGroupEntity(engine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('stay', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(triggerEntity.entityUID, 10);
    trigger._registerSensorBinding(triggerEntity.entityUID, 11);

    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 10, otherEntity, 20, true);
    Rn.TriggerComponent._publishStayEvents();
    expect(events.map(event => event.type)).toEqual(['enter']);
    expect(trigger.activeOverlapCount).toBe(1);

    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 11, otherEntity, 21, true);
    Rn.TriggerComponent._publishStayEvents();
    expect(events.map(event => event.type)).toEqual(['enter', 'stay']);

    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 10, otherEntity, 20, false);
    expect(trigger.activeOverlapCount).toBe(1);
    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 11, otherEntity, 21, false);
    expect(events.map(event => event.type)).toEqual(['enter', 'stay', 'exit']);
    expect(trigger.activeOverlapCount).toBe(0);

    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 10, otherEntity, 20, true);
    Rn.TriggerComponent._deactivateSensorBinding(engine, triggerEntity.entityUID, 10);
    expect(events.map(event => event.type)).toEqual(['enter', 'stay', 'exit', 'enter', 'exit']);
    expect(trigger.activeOverlapCount).toBe(0);
  });

  test('keeps a logical overlap active while its sensor collider is rebuilt', async () => {
    const rebuildEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const triggerEntity = rebuildEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(rebuildEngine)
    );
    const otherEntity = Rn.createGroupEntity(rebuildEngine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('stay', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(triggerEntity.entityUID, 10);

    Rn.TriggerComponent._processOverlap(rebuildEngine, triggerEntity.entityUID, 10, otherEntity, 20, true, 100);
    Rn.TriggerComponent._publishStayEvents(rebuildEngine);
    Rn.TriggerComponent._suspendSensorBinding(rebuildEngine, triggerEntity.entityUID, 10);
    expect(events.map(event => event.type)).toEqual(['enter']);
    expect(trigger.activeOverlapCount).toBe(1);

    const unrelatedEngine = {} as Rn.Engine;
    Rn.TriggerComponent._beginPhysicsStep(unrelatedEngine);
    Rn.TriggerComponent._finalizeRebuiltOverlaps(unrelatedEngine);
    expect(events.map(event => event.type)).toEqual(['enter']);
    expect(trigger.activeOverlapCount).toBe(1);

    Rn.TriggerComponent._beginPhysicsStep(rebuildEngine);
    Rn.TriggerComponent._processOverlap(rebuildEngine, triggerEntity.entityUID, 10, otherEntity, 20, true, 100);
    Rn.TriggerComponent._finalizeRebuiltOverlaps(rebuildEngine);
    Rn.TriggerComponent._publishStayEvents(rebuildEngine);
    expect(events.map(event => event.type)).toEqual(['enter', 'stay']);

    Rn.TriggerComponent._suspendSensorBinding(rebuildEngine, triggerEntity.entityUID, 10);
    Rn.TriggerComponent._beginPhysicsStep(rebuildEngine);
    Rn.TriggerComponent._finalizeRebuiltOverlaps(rebuildEngine);
    expect(events.map(event => event.type)).toEqual(['enter', 'stay', 'exit']);
    expect(trigger.activeOverlapCount).toBe(0);

    Rn.TriggerComponent._processOverlap(rebuildEngine, triggerEntity.entityUID, 10, otherEntity, 20, true, 101);
    Rn.TriggerComponent._suspendSensorBinding(rebuildEngine, triggerEntity.entityUID, 10);
    Rn.TriggerComponent._deactivateSensorBinding(rebuildEngine, triggerEntity.entityUID, 10);
    expect(events.map(event => event.type)).toEqual(['enter', 'stay', 'exit', 'enter', 'exit']);
    expect(trigger.activeOverlapCount).toBe(0);
    rebuildEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, triggerEntity);
  });

  test('keeps identical binding ids from compound trigger children distinct', () => {
    const triggerEntity = engine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(engine)
    );
    const firstSensorEntity = Rn.createGroupEntity(engine);
    const secondSensorEntity = Rn.createGroupEntity(engine);
    const otherEntity = Rn.createGroupEntity(engine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(firstSensorEntity.entityUID, 0);
    trigger._registerSensorBinding(secondSensorEntity.entityUID, 0);

    Rn.TriggerComponent._processOverlap(engine, firstSensorEntity.entityUID, 0, otherEntity, 0, true);
    Rn.TriggerComponent._processOverlap(engine, secondSensorEntity.entityUID, 0, otherEntity, 0, true);
    expect(events.map(event => event.type)).toEqual(['enter']);

    Rn.TriggerComponent._deactivateSensorBinding(engine, firstSensorEntity.entityUID, 0);
    expect(trigger.activeOverlapCount).toBe(1);
    expect(events.map(event => event.type)).toEqual(['enter']);

    Rn.TriggerComponent._processOverlap(engine, secondSensorEntity.entityUID, 0, otherEntity, 0, false);
    expect(trigger.activeOverlapCount).toBe(0);
    expect(events.map(event => event.type)).toEqual(['enter', 'exit']);
  });

  test('ignores collisions between sensors owned by the same compound trigger', async () => {
    const compoundEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const triggerEntity = compoundEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(compoundEngine)
    );
    const firstSensorEntity = Rn.createGroupEntity(compoundEngine);
    const secondSensorEntity = Rn.createGroupEntity(compoundEngine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('stay', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(firstSensorEntity.entityUID, 0);
    trigger._registerSensorBinding(secondSensorEntity.entityUID, 0);

    Rn.TriggerComponent._processOverlap(
      compoundEngine,
      firstSensorEntity.entityUID,
      0,
      secondSensorEntity,
      0,
      true,
      101
    );
    Rn.TriggerComponent._processOverlap(
      compoundEngine,
      secondSensorEntity.entityUID,
      0,
      firstSensorEntity,
      0,
      true,
      100
    );
    Rn.TriggerComponent._publishStayEvents(compoundEngine);

    expect(trigger.activeOverlapCount).toBe(0);
    expect(events).toHaveLength(0);
    compoundEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, triggerEntity);
  });

  test('ends overlap pairs when a non-sensor collider binding is removed', () => {
    const triggerEntity = engine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(engine)
    );
    const otherEntity = Rn.createGroupEntity(engine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(triggerEntity.entityUID, 12);

    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 12, otherEntity, 20, true);
    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 12, otherEntity, 21, true);
    Rn.TriggerComponent._deactivateOtherBinding(otherEntity, 20);

    expect(trigger.activeOverlapCount).toBe(1);
    expect(events.map(event => event.type)).toEqual(['enter']);

    Rn.TriggerComponent._deactivateOtherBinding(otherEntity, 21);
    expect(trigger.activeOverlapCount).toBe(0);
    expect(events.map(event => event.type)).toEqual(['enter', 'exit']);
    Rn.TriggerComponent._publishStayEvents();
    expect(events.map(event => event.type)).toEqual(['enter', 'exit']);
    engine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, triggerEntity);
  });

  test('tracks bindingless colliders by their Rapier handles', () => {
    const triggerEntity = engine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(engine)
    );
    const otherEntity = Rn.createGroupEntity(engine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(triggerEntity.entityUID, 13);

    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 13, otherEntity, undefined, true, 100);
    Rn.TriggerComponent._processOverlap(engine, triggerEntity.entityUID, 13, otherEntity, undefined, true, 101);
    Rn.TriggerComponent._deactivateOtherBinding(otherEntity, undefined, 100);

    expect(trigger.activeOverlapCount).toBe(1);
    expect(events.map(event => event.type)).toEqual(['enter']);

    Rn.TriggerComponent._deactivateOtherBinding(otherEntity, undefined, 101);
    expect(trigger.activeOverlapCount).toBe(0);
    expect(events.map(event => event.type)).toEqual(['enter', 'exit']);
    engine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, triggerEntity);
  });

  test('isolates identical sensor ownership keys across engines', async () => {
    const firstEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const secondEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const firstTriggerEntity = firstEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(firstEngine)
    );
    const secondTriggerEntity = secondEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(secondEngine)
    );
    const firstOther = Rn.createGroupEntity(firstEngine);
    const secondOther = Rn.createGroupEntity(secondEngine);
    const firstTrigger = firstTriggerEntity.getTrigger();
    const secondTrigger = secondTriggerEntity.getTrigger();
    const firstEvents: Rn.TriggerEvent[] = [];
    const secondEvents: Rn.TriggerEvent[] = [];
    firstTrigger.subscribe('enter', event => firstEvents.push(event));
    secondTrigger.subscribe('enter', event => secondEvents.push(event));

    expect(firstTriggerEntity.entityUID).toBe(secondTriggerEntity.entityUID);
    firstTrigger._registerSensorBinding(firstTriggerEntity.entityUID, 0);
    expect(() => secondTrigger._registerSensorBinding(secondTriggerEntity.entityUID, 0)).not.toThrow();

    Rn.TriggerComponent._processOverlap(firstEngine, firstTriggerEntity.entityUID, 0, firstOther, 0, true);
    Rn.TriggerComponent._processOverlap(secondEngine, secondTriggerEntity.entityUID, 0, secondOther, 0, true);

    expect(firstEvents).toHaveLength(1);
    expect(secondEvents).toHaveLength(1);
    expect(firstEvents[0].otherEntity).toBe(firstOther);
    expect(secondEvents[0].otherEntity).toBe(secondOther);

    Rn.TriggerComponent._deactivateSensorBinding(firstEngine, firstTriggerEntity.entityUID, 0);
    expect(firstTrigger.activeOverlapCount).toBe(0);
    expect(secondTrigger.activeOverlapCount).toBe(1);
    Rn.TriggerComponent._deactivateSensorBinding(secondEngine, secondTriggerEntity.entityUID, 0);
    firstEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, firstTriggerEntity);
    secondEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, secondTriggerEntity);
  });

  test('publishes stay events only for the processed engine', async () => {
    const firstEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const secondEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const firstTriggerEntity = firstEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(firstEngine)
    );
    const secondTriggerEntity = secondEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(secondEngine)
    );
    const firstOther = Rn.createGroupEntity(firstEngine);
    const secondOther = Rn.createGroupEntity(secondEngine);
    const firstTrigger = firstTriggerEntity.getTrigger();
    const secondTrigger = secondTriggerEntity.getTrigger();
    const firstStayEvents: Rn.TriggerEvent[] = [];
    const secondStayEvents: Rn.TriggerEvent[] = [];
    firstTrigger.subscribe('stay', event => firstStayEvents.push(event));
    secondTrigger.subscribe('stay', event => secondStayEvents.push(event));
    firstTrigger._registerSensorBinding(firstTriggerEntity.entityUID, 0);
    secondTrigger._registerSensorBinding(secondTriggerEntity.entityUID, 0);
    Rn.TriggerComponent._processOverlap(firstEngine, firstTriggerEntity.entityUID, 0, firstOther, 0, true);
    Rn.TriggerComponent._processOverlap(secondEngine, secondTriggerEntity.entityUID, 0, secondOther, 0, true);

    Rn.TriggerComponent._publishStayEvents(firstEngine);
    Rn.TriggerComponent._publishStayEvents(firstEngine);
    expect(firstStayEvents).toHaveLength(1);
    expect(secondStayEvents).toHaveLength(0);

    Rn.TriggerComponent._publishStayEvents(secondEngine);
    Rn.TriggerComponent._publishStayEvents(secondEngine);
    expect(firstStayEvents).toHaveLength(1);
    expect(secondStayEvents).toHaveLength(1);

    Rn.TriggerComponent._deactivateSensorBinding(firstEngine, firstTriggerEntity.entityUID, 0);
    Rn.TriggerComponent._deactivateSensorBinding(secondEngine, secondTriggerEntity.entityUID, 0);
    firstEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, firstTriggerEntity);
    secondEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, secondTriggerEntity);
  });

  test('distinguishes overlapping entities with identical UIDs across engines', async () => {
    const firstEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const secondEngine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });
    const triggerEntity = firstEngine.entityRepository.addComponentToEntity(
      Rn.TriggerComponent,
      Rn.createGroupEntity(firstEngine)
    );
    const sameUidAsTrigger = Rn.createGroupEntity(secondEngine);
    const firstOther = Rn.createGroupEntity(firstEngine);
    const secondOther = Rn.createGroupEntity(secondEngine);
    const trigger = triggerEntity.getTrigger();
    const events: Rn.TriggerEvent[] = [];
    trigger.subscribe('enter', event => events.push(event));
    trigger.subscribe('exit', event => events.push(event));
    trigger._registerSensorBinding(triggerEntity.entityUID, 0);

    expect(sameUidAsTrigger.entityUID).toBe(triggerEntity.entityUID);
    expect(secondOther.entityUID).toBe(firstOther.entityUID);

    Rn.TriggerComponent._processOverlap(firstEngine, triggerEntity.entityUID, 0, sameUidAsTrigger, 0, true);
    Rn.TriggerComponent._processOverlap(firstEngine, triggerEntity.entityUID, 0, firstOther, 1, true);
    Rn.TriggerComponent._processOverlap(firstEngine, triggerEntity.entityUID, 0, secondOther, 1, true);

    expect(trigger.activeOverlapCount).toBe(3);
    expect(events.filter(event => event.type === 'enter').map(event => event.otherEntity)).toEqual([
      sameUidAsTrigger,
      firstOther,
      secondOther,
    ]);

    Rn.TriggerComponent._processOverlap(firstEngine, triggerEntity.entityUID, 0, firstOther, 1, false);
    expect(trigger.activeOverlapCount).toBe(2);
    Rn.TriggerComponent._deactivateSensorBinding(firstEngine, triggerEntity.entityUID, 0);
    expect(trigger.activeOverlapCount).toBe(0);
    expect(events.filter(event => event.type === 'exit')).toHaveLength(3);
    firstEngine.entityRepository.removeComponentFromEntity(Rn.TriggerComponent, triggerEntity);
  });
});
