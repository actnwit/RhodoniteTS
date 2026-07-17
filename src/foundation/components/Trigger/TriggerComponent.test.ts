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

    Rn.TriggerComponent._processOverlap(triggerEntity.entityUID, 10, otherEntity, 20, true);
    Rn.TriggerComponent._publishStayEvents();
    expect(events.map(event => event.type)).toEqual(['enter']);
    expect(trigger.activeOverlapCount).toBe(1);

    Rn.TriggerComponent._processOverlap(triggerEntity.entityUID, 11, otherEntity, 21, true);
    Rn.TriggerComponent._publishStayEvents();
    expect(events.map(event => event.type)).toEqual(['enter', 'stay']);

    Rn.TriggerComponent._processOverlap(triggerEntity.entityUID, 10, otherEntity, 20, false);
    expect(trigger.activeOverlapCount).toBe(1);
    Rn.TriggerComponent._processOverlap(triggerEntity.entityUID, 11, otherEntity, 21, false);
    expect(events.map(event => event.type)).toEqual(['enter', 'stay', 'exit']);
    expect(trigger.activeOverlapCount).toBe(0);

    Rn.TriggerComponent._processOverlap(triggerEntity.entityUID, 10, otherEntity, 20, true);
    Rn.TriggerComponent._deactivateSensorBinding(triggerEntity.entityUID, 10);
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

    Rn.TriggerComponent._processOverlap(firstSensorEntity.entityUID, 0, otherEntity, 0, true);
    Rn.TriggerComponent._processOverlap(secondSensorEntity.entityUID, 0, otherEntity, 0, true);
    expect(events.map(event => event.type)).toEqual(['enter']);

    Rn.TriggerComponent._deactivateSensorBinding(firstSensorEntity.entityUID, 0);
    expect(trigger.activeOverlapCount).toBe(1);
    expect(events.map(event => event.type)).toEqual(['enter']);

    Rn.TriggerComponent._processOverlap(secondSensorEntity.entityUID, 0, otherEntity, 0, false);
    expect(trigger.activeOverlapCount).toBe(0);
    expect(events.map(event => event.type)).toEqual(['enter', 'exit']);
  });
});
