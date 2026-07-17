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
});
