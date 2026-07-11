import Rn from '../../../../dist/esm';

describe('ShapeComponent', async () => {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  test('stores multiple shapes and copies mutable input values', () => {
    const entity = Rn.createShapeEntity(engine);
    const component = entity.getShape();
    const size = Rn.MutableVector3.fromCopy3(2, 4, 6);
    const localPosition = Rn.MutableVector3.fromCopy3(1, 2, 3);

    component.addShape({ type: 'box', size }, { position: localPosition });
    component.addShape({ type: 'sphere', radius: 0.5 });
    size.x = 100;
    localPosition.y = 100;

    expect(component.shapeCount).toBe(2);
    const firstShape = component.getShape(0)?.shape;
    expect(firstShape?.type).toBe('box');
    if (firstShape?.type !== 'box') {
      throw new Error('Expected a box shape.');
    }
    expect(firstShape.size.x).toBe(2);
    expect(component.getShape(0)?.localPosition.y).toBe(2);
    expect(component.removeShape(0)).toBe(true);
    expect(component.shapeCount).toBe(1);
    component.clearShapes();
    expect(component.shapeCount).toBe(0);
  });

  test('shares normalized descriptors across entities', () => {
    const descriptor = Rn.normalizeShapeDescriptor({ type: 'box', size: Rn.Vector3.one() });
    const first = Rn.createShapeEntity(engine).getShape();
    const second = Rn.createShapeEntity(engine).getShape();
    first.addShape(descriptor);
    second.addShape(descriptor);

    expect(first.getShape(0)?.shape).toBe(second.getShape(0)?.shape);
  });

  test('normalizes cylinder and capsule descriptors', () => {
    const component = Rn.createShapeEntity(engine).getShape();
    component.addShape({ type: 'cylinder', height: 2, radiusBottom: 0, radiusTop: 1 });
    component.addShape({ type: 'capsule', height: 1, radiusBottom: 0.25, radiusTop: 0.5 });

    expect(component.getShape(0)?.shape).toEqual({
      type: 'cylinder',
      height: 2,
      radiusBottom: 0,
      radiusTop: 1,
    });
    expect(component.getShape(1)?.shape).toEqual({
      type: 'capsule',
      height: 1,
      radiusBottom: 0.25,
      radiusTop: 0.5,
    });
    expect(() => component.addShape({ type: 'capsule', height: 1, radiusBottom: 0, radiusTop: 0 })).toThrow();
  });

  test('fits a capsule to an AABB with a height-relative radius limit', () => {
    const aabb = new Rn.AABB();
    aabb.addPosition(Rn.Vector3.fromCopy3(-2, 1, -0.5));
    aabb.addPosition(Rn.Vector3.fromCopy3(2, 11, 0.5));
    const component = Rn.createShapeEntity(engine).getShape();
    const index = component.addCapsuleFromAabb(aabb, {
      origin: Rn.Vector3.fromCopy3(0, 1, 0),
    });

    expect(component.getShape(index)?.shape).toEqual({
      type: 'capsule',
      height: 6,
      radiusBottom: 2,
      radiusTop: 2,
    });
    expect(component.getShape(index)?.localPosition.isEqual(Rn.Vector3.fromCopy3(0, 5, 0))).toBe(true);
  });

  test('supports capsule fitting options and rejects invalid AABBs', () => {
    const aabb = new Rn.AABB();
    aabb.addPosition(Rn.Vector3.fromCopy3(-1, 0, -0.5));
    aabb.addPosition(Rn.Vector3.fromCopy3(1, 10, 0.5));
    const component = Rn.createShapeEntity(engine).getShape();
    const index = component.addCapsuleFromAabb(aabb, {
      radiusScale: 0.5,
      maxRadiusToHeightRatio: 0.1,
    });

    expect(component.getShape(index)?.shape).toEqual({
      type: 'capsule',
      height: 9,
      radiusBottom: 0.5,
      radiusTop: 0.5,
    });
    expect(() => component.addCapsuleFromAabb(new Rn.AABB())).toThrow('uninitialized AABB');
    expect(() => component.addCapsuleFromAabb(aabb, { maxRadiusToHeightRatio: 0.5 })).toThrow('between 0 and 0.5');
  });

  test('creates and toggles an empty shape gizmo without a rendering backend', () => {
    const entity = Rn.createShapeEntity(engine);
    const component = entity.getShape();
    component.isShapeGizmoVisible = true;
    expect(component.isShapeGizmoVisible).toBe(true);
    entity.position = Rn.Vector3.fromCopy3(1, 2, 3);
    component.$logic();
    expect(component.shapeGizmo?.topEntity?.getTransform().localMatrixInner.translateX).toBeCloseTo(1);
    expect(component.shapeGizmo?.topEntity?.getTransform().localMatrixInner.translateY).toBeCloseTo(2);
    expect(component.shapeGizmo?.topEntity?.getTransform().localMatrixInner.translateZ).toBeCloseTo(3);
    component.isShapeGizmoVisible = false;
    expect(component.isShapeGizmoVisible).toBe(false);
  });

  test('MeshHelper creates generic shapes without enabling physics', () => {
    const cubes = Rn.MeshHelper.createCubes(engine, 2, { widthVector: Rn.Vector3.fromCopy3(2, 3, 4) });
    expect(cubes[0].tryToGetPhysics()).toBeUndefined();
    expect(cubes[0].tryToGetShape()?.getShape(0)?.shape.type).toBe('box');
    expect(cubes[0].tryToGetShape()?.getShape(0)?.shape).toBe(cubes[1].tryToGetShape()?.getShape(0)?.shape);
  });

  test('CharacterController creates a compatible capsule for legacy radius and height options', () => {
    const entity = Rn.createCharacterControllerEntity(engine);
    let receivedShape: unknown;
    const strategy = {
      setup: (_entity: unknown, shape: unknown) => {
        receivedShape = shape;
      },
      setDesiredHorizontalVelocity: () => {},
      requestJump: () => {},
      teleport: () => {},
      isGrounded: false,
      computedMovement: Rn.Vector3.zero(),
      isRecovering: false,
      motionState: {
        state: 'falling',
        velocity: Rn.Vector3.zero(),
        horizontalSpeed: 0,
        verticalSpeed: 0,
        groundedDuration: 0,
        airborneDuration: 0,
        stateElapsedTime: 0,
        landingImpactSpeed: 0,
      },
      enabled: true,
      destroy: () => {},
    };

    entity.getCharacterController().setup(strategy as never, { radius: 0.3, height: 1.6 });

    expect(entity.getShape().getShape(0)?.shape).toEqual({
      type: 'capsule',
      height: 1,
      radiusBottom: 0.3,
      radiusTop: 0.3,
    });
    expect(entity.getShape().getShape(0)?.localPosition.y).toBeCloseTo(0.8);
    expect(receivedShape).toBe(entity.getShape().getShape(0));
  });

  test('CharacterController publishes state changes and landing once', () => {
    const entity = Rn.createCharacterControllerEntity(engine);
    const falling = {
      state: 'falling' as const,
      velocity: Rn.Vector3.zero(),
      horizontalSpeed: 0,
      verticalSpeed: -1,
      groundedDuration: 0,
      airborneDuration: 0.1,
      stateElapsedTime: 0.1,
      landingImpactSpeed: 0,
    };
    const strategy = {
      setup: () => {},
      setDesiredHorizontalVelocity: () => {},
      requestJump: () => {},
      teleport: () => {},
      isGrounded: false,
      computedMovement: Rn.Vector3.zero(),
      groundContact: undefined,
      isRecovering: false,
      motionState: falling as Rn.CharacterMotionState,
      enabled: true,
      destroy: () => {},
    };
    const component = entity.getCharacterController();
    component.setup(strategy, { radius: 0.3, height: 1.6 });
    const states: string[] = [];
    const impacts: number[] = [];
    component.subscribe('stateChanged', event => states.push(`${event.previous.state}>${event.current.state}`));
    component.subscribe('landed', event => impacts.push(event.impactSpeed));

    strategy.motionState = {
      ...falling,
      state: 'landing',
      verticalSpeed: 0,
      landingImpactSpeed: 3.5,
    };
    component.$logic();
    component.$logic();
    strategy.motionState = { ...strategy.motionState, state: 'grounded' };
    component.$logic();

    expect(states).toEqual(['falling>landing', 'landing>grounded']);
    expect(impacts).toEqual([3.5]);
  });

  test('CharacterController rejects an explicitly selected non-capsule shape', () => {
    const entity = Rn.createCharacterControllerEntity(engine);
    const shapeIndex = entity.getShape().addShape({ type: 'sphere', radius: 0.5 });

    expect(() => entity.getCharacterController().setup({} as never, { shapeIndex })).toThrow(
      'requires a capsule ShapeInstance'
    );
  });
});
