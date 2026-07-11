import Rn from '../../../../dist/esm';

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
});
