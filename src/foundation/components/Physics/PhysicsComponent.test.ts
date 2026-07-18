import Rn from '../../../../dist/esm';
import { RapierPhysicsStrategy } from '../../physics/Rapier/RapierPhysicsStrategy';
import type { Engine } from '../../system/Engine';
import { AnimationStateRepository } from '../Animation/AnimationStateRepository';
import { CharacterControllerComponent } from '../CharacterController/CharacterControllerComponent';
import { PhysicsComponent } from './PhysicsComponent';

describe('PhysicsComponent shape bindings', async () => {
  const engine = await Rn.Engine.init({ approach: Rn.ProcessApproach.None });

  function createFixture(multiple = true) {
    const shapeEntity = Rn.createShapeEntity(engine);
    const shape = shapeEntity.getShape();
    shape.addShape({ type: 'box', size: Rn.Vector3.one() });
    shape.addShape({ type: 'sphere', radius: 0.5 });
    const entity = engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, shapeEntity);
    const calls: Array<readonly Rn.PhysicsShapeInstanceBinding[]> = [];
    const motionCalls: Array<Rn.PhysicsMotionProperty | undefined> = [];
    let clearCount = 0;
    const strategy = {
      update: () => {},
      setShapeInstances: multiple
        ? (bindings: readonly Rn.PhysicsShapeInstanceBinding[], _entity, _scale, motion) => {
            calls.push(bindings);
            motionCalls.push(motion);
          }
        : undefined,
      setShapeInstance: () => {},
      clearShapeInstances: () => {
        clearCount++;
      },
    };
    entity.getPhysics().setStrategy(strategy);
    return {
      entity,
      shape,
      calls,
      motionCalls,
      get clearCount() {
        return clearCount;
      },
    };
  }

  const collider = { friction: 0.5, restitution: 0.1 };

  test('uses a unique process-frame token for Rapier step deduplication', () => {
    const frameEngine = {} as Engine;
    const updateSpy = vi.spyOn(RapierPhysicsStrategy, 'update').mockImplementation(() => {});
    try {
      const firstToken = AnimationStateRepository.beginProcessFrame(frameEngine);
      PhysicsComponent.common_$logic({ engine: frameEngine });
      CharacterControllerComponent.common_$logic({ engine: frameEngine });
      const secondToken = AnimationStateRepository.beginProcessFrame(frameEngine);
      PhysicsComponent.common_$logic({ engine: frameEngine });
      CharacterControllerComponent.common_$logic({ engine: frameEngine });

      expect(secondToken).not.toBe(firstToken);
      expect(updateSpy.mock.calls.map(call => call[0])).toEqual([firstToken, firstToken, secondToken, secondToken]);
    } finally {
      updateSpy.mockRestore();
      AnimationStateRepository._cleanupForEngine(frameEngine);
    }
  });

  test('synchronizes descendant physics when an ancestor transform changes', () => {
    const root = Rn.createGroupEntity(engine);
    const intermediate = Rn.createGroupEntity(engine);
    const child = engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, Rn.createGroupEntity(engine));
    child.localPosition = Rn.Vector3.fromCopy3(1, 0, 0);
    root.addChild(intermediate.getSceneGraph());
    intermediate.addChild(child.getSceneGraph());

    const setPosition = vi.fn();
    const setRotation = vi.fn();
    const setScale = vi.fn();
    child.getPhysics().setStrategy({
      update: () => {},
      setPosition,
      setRotation,
      setScale,
    });

    root.localPosition = Rn.Vector3.fromCopy3(2, 0, 0);
    expect(setPosition.mock.calls.at(-1)?.[0].x).toBeCloseTo(3);
    expect(setPosition.mock.calls.at(-1)?.[0].y).toBeCloseTo(0);
    expect(setRotation).not.toHaveBeenCalled();
    expect(setScale).not.toHaveBeenCalled();

    setPosition.mockClear();
    const rotation = Rn.Quaternion.fromAxisAngle(Rn.Vector3.fromCopy3(0, 0, 1), Math.PI / 2);
    root.localRotation = rotation;
    expect(setPosition.mock.calls.at(-1)?.[0].x).toBeCloseTo(2);
    expect(setPosition.mock.calls.at(-1)?.[0].y).toBeCloseTo(1);
    expect(setRotation.mock.calls.at(-1)?.[0].z).toBeCloseTo(rotation.z);
    expect(setRotation.mock.calls.at(-1)?.[0].w).toBeCloseTo(rotation.w);
    expect(setScale).not.toHaveBeenCalled();

    setPosition.mockClear();
    setRotation.mockClear();
    root.localScale = Rn.Vector3.fromCopy3(2, 3, 1);
    expect(setPosition.mock.calls.at(-1)?.[0].x).toBeCloseTo(2);
    expect(setPosition.mock.calls.at(-1)?.[0].y).toBeCloseTo(2);
    expect(setRotation).toHaveBeenCalledOnce();
    expect(setScale.mock.calls.at(-1)?.[0].x).toBeCloseTo(2);
    expect(setScale.mock.calls.at(-1)?.[0].y).toBeCloseTo(3);
  });

  test('manages stable binding IDs and rebuilds the complete collider set', () => {
    const fixture = createFixture();
    const physics = fixture.entity.getPhysics();
    const first = physics.bindShape({
      shapeComponent: fixture.shape,
      shapeIndex: 0,
      body: { move: false, density: 1 },
      collider,
    });
    const second = physics.bindShape({
      shapeComponent: fixture.shape,
      shapeIndex: 1,
      body: { move: false, density: 2 },
      collider,
    });

    expect([first, second]).toEqual([0, 1]);
    expect(physics.shapeBindingCount).toBe(2);
    expect(fixture.calls.at(-1)).toHaveLength(2);
    physics.updateShapeBinding(second, {
      shapeComponent: fixture.shape,
      shapeIndex: 0,
      body: { move: false, density: 3 },
      collider,
    });
    expect(fixture.calls.at(-1)?.[1].body.density).toBe(3);
    expect(physics.removeShapeBinding(first)).toBe(true);
    expect(physics.removeShapeBinding(999)).toBe(false);
    expect(physics.shapeBindingCount).toBe(1);
    physics.rebuildShapeBindings();
    expect(fixture.calls.at(-1)).toHaveLength(1);
    physics.clearShapeBindings();
    expect(physics.shapeBindingCount).toBe(0);
    expect(fixture.clearCount).toBe(1);
  });

  test('keeps shape references stable when an earlier shape is removed', () => {
    const fixture = createFixture();
    const physics = fixture.entity.getPhysics();
    physics.bindShape({
      shapeComponent: fixture.shape,
      shapeIndex: 1,
      body: { move: false, density: 1 },
      collider,
    });

    expect(fixture.shape.removeShape(0)).toBe(true);
    physics.rebuildShapeBindings();

    expect(fixture.calls.at(-1)?.[0].shape.shape.type).toBe('sphere');
  });

  test('unregisters sensor ownership when bindings are removed or destroyed', () => {
    const firstTrigger = engine.entityRepository
      .addComponentToEntity(Rn.TriggerComponent, Rn.createGroupEntity(engine))
      .getTrigger();
    const secondTrigger = engine.entityRepository
      .addComponentToEntity(Rn.TriggerComponent, Rn.createGroupEntity(engine))
      .getTrigger();
    const fixture = createFixture();
    const physics = fixture.entity.getPhysics();
    const bindingId = physics.bindShape({
      shapeComponent: fixture.shape,
      shapeIndex: 0,
      body: { move: false, density: 1 },
      collider: { ...collider, isSensor: true },
    });
    firstTrigger._registerSensorBinding(fixture.entity.entityUID, bindingId);

    expect(physics.removeShapeBinding(bindingId)).toBe(true);
    expect(() => secondTrigger._registerSensorBinding(fixture.entity.entityUID, bindingId)).not.toThrow();
    Rn.TriggerComponent._unregisterSensorBinding(engine, fixture.entity.entityUID, bindingId);

    const destroyedFixture = createFixture();
    const destroyedPhysics = destroyedFixture.entity.getPhysics();
    const destroyedBindingId = destroyedPhysics.bindShape({
      shapeComponent: destroyedFixture.shape,
      shapeIndex: 0,
      body: { move: false, density: 1 },
      collider: { ...collider, isSensor: true },
    });
    firstTrigger._registerSensorBinding(destroyedFixture.entity.entityUID, destroyedBindingId);

    engine.entityRepository.removeComponentFromEntity(Rn.PhysicsComponent, destroyedFixture.entity);
    expect(() =>
      secondTrigger._registerSensorBinding(destroyedFixture.entity.entityUID, destroyedBindingId)
    ).not.toThrow();
    Rn.TriggerComponent._unregisterSensorBinding(engine, destroyedFixture.entity.entityUID, destroyedBindingId);
  });

  test('rejects incompatible changes without committing them', () => {
    const fixture = createFixture();
    const physics = fixture.entity.getPhysics();
    physics.bindShape({
      shapeComponent: fixture.shape,
      shapeIndex: 0,
      body: { move: false, density: 1 },
      collider,
    });
    const callCount = fixture.calls.length;

    expect(() =>
      physics.bindShape({
        shapeComponent: fixture.shape,
        shapeIndex: 1,
        body: { move: true, density: 1 },
        collider,
      })
    ).toThrow('same body.move');
    expect(physics.shapeBindingCount).toBe(1);
    expect(fixture.calls).toHaveLength(callCount);
    expect(() =>
      physics.updateShapeBinding(0, {
        shapeComponent: fixture.shape,
        shapeIndex: 99,
        body: { move: false, density: 1 },
        collider,
      })
    ).toThrow('shape index 99');
    expect(physics.shapeBindingCount).toBe(1);
  });

  test('restores the previous backend state when applying a binding throws', () => {
    const shapeEntity = Rn.createShapeEntity(engine);
    const shape = shapeEntity.getShape();
    shape.addShape({ type: 'box', size: Rn.Vector3.one() });
    shape.addShape({ type: 'sphere', radius: 0.5 });
    const entity = engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, shapeEntity);
    const physics = entity.getPhysics();
    let backendBindingIds: Array<number | undefined> = [];
    let clearCount = 0;
    physics.setStrategy({
      update: () => {},
      setShapeInstances: bindings => {
        backendBindingIds = bindings.map(binding => binding.bindingId);
        if (bindings.some(binding => binding.collider.isSensor)) {
          throw new Error('The backend does not support sensor collision events.');
        }
      },
      clearShapeInstances: () => {
        backendBindingIds = [];
        clearCount++;
      },
    });

    expect(() =>
      physics.bindShape({
        shapeComponent: shape,
        shapeIndex: 0,
        body: { move: false, density: 1 },
        collider: { ...collider, isSensor: true },
      })
    ).toThrow('does not support sensor');
    expect(physics.shapeBindingCount).toBe(0);
    expect(backendBindingIds).toEqual([]);
    expect(clearCount).toBe(1);

    expect(
      physics.bindShape({
        shapeComponent: shape,
        shapeIndex: 0,
        body: { move: false, density: 1 },
        collider,
      })
    ).toBe(0);
    expect(() =>
      physics.bindShape({
        shapeComponent: shape,
        shapeIndex: 1,
        body: { move: false, density: 1 },
        collider: { ...collider, isSensor: true },
      })
    ).toThrow('does not support sensor');
    expect(physics.shapeBindingCount).toBe(1);
    expect(backendBindingIds).toEqual([0]);
  });

  test('keeps single-shape strategies compatible and rejects a second binding', () => {
    const fixture = createFixture(false);
    const physics = fixture.entity.getPhysics();
    physics.bindShape({
      shapeComponent: fixture.shape,
      body: { move: false, density: 1 },
      collider,
    });
    expect(() =>
      physics.bindShape({
        shapeComponent: fixture.shape,
        shapeIndex: 1,
        body: { move: false, density: 1 },
        collider,
      })
    ).toThrow('does not support multiple');
    expect(physics.shapeBindingCount).toBe(1);
  });

  test('stores body-level motion once and rebuilds existing bindings when it changes', () => {
    const fixture = createFixture();
    const physics = fixture.entity.getPhysics();
    physics.setMotionProperty({ move: true, mass: 5, gravityFactor: 0 });
    physics.bindShape({
      shapeComponent: fixture.shape,
      body: { move: true, density: 1 },
      collider,
    });
    expect(fixture.motionCalls.at(-1)?.mass).toBe(5);

    const centerOfMass = Rn.MutableVector3.fromCopy3(1, 2, 3);
    const inertiaDiagonal = Rn.MutableVector3.fromCopy3(4, 5, 6);
    const inertiaOrientation = Rn.MutableQuaternion.identity();
    physics.setMotionProperty({
      move: true,
      mass: 8,
      gravityFactor: -1,
      centerOfMass,
      inertiaDiagonal,
      inertiaOrientation,
    });
    expect(fixture.calls.at(-1)).toHaveLength(1);
    expect(fixture.motionCalls.at(-1)?.mass).toBe(8);
    expect(physics.motionProperty?.gravityFactor).toBe(-1);
    centerOfMass.x = 99;
    inertiaDiagonal.y = 99;
    inertiaOrientation.z = 1;
    expect(physics.motionProperty?.centerOfMass?.x).toBe(1);
    expect(physics.motionProperty?.inertiaDiagonal?.y).toBe(5);
    expect(physics.motionProperty?.inertiaOrientation?.z).toBe(0);
  });

  test('rejects body mode mismatches between motion and shape bindings', () => {
    const fixture = createFixture();
    const physics = fixture.entity.getPhysics();
    physics.bindShape({
      shapeComponent: fixture.shape,
      body: { move: true, density: 1 },
      collider,
    });
    const callCount = fixture.calls.length;

    expect(() => physics.setMotionProperty({ move: false })).toThrow('motion.move must match body.move');
    expect(() => physics.setMotionProperty({ move: true, isKinematic: true })).toThrow(
      'motion.isKinematic must match body.isKinematic'
    );
    expect(physics.motionProperty).toBeUndefined();
    expect(fixture.calls).toHaveLength(callCount);
  });
});
