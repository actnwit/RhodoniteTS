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
    expect(component.getShape(1)?.shape.type).toBe('sphere');
    expect(component.addShape({ type: 'box', size: Rn.Vector3.one() })).toBe(2);
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

  test('preserves stable shape indices when shallow copying an entity', () => {
    const entity = Rn.createShapeEntity(engine);
    const component = entity.getShape();
    component.addShape({ type: 'box', size: Rn.Vector3.one() });
    component.addShape(
      { type: 'sphere', radius: 0.5 },
      {
        position: Rn.Vector3.fromCopy3(1, 2, 3),
        rotation: Rn.Quaternion.fromAxisAngle(Rn.Vector3.fromCopy3(0, 1, 0), Math.PI / 4),
      }
    );
    component.removeShape(0);

    const copiedEntity = engine.entityRepository.shallowCopyEntity(entity) as typeof entity;
    const copied = copiedEntity.getShape();

    expect(copied.shapeCount).toBe(1);
    expect(copied.getShape(0)).toBeUndefined();
    expect(copied.getShape(1)).toBe(component.getShape(1));
    expect(copied.addShape({ type: 'box', size: Rn.Vector3.one() })).toBe(2);
    copied.removeShape(1);
    expect(component.getShape(1)?.shape.type).toBe('sphere');
  });

  test('validates and normalizes local shape transforms', () => {
    const component = Rn.createShapeEntity(engine).getShape();
    const descriptor = { type: 'sphere' as const, radius: 0.5 };

    expect(() => component.addShape(descriptor, { position: Rn.Vector3.fromCopy3(Number.NaN, 0, 0) })).toThrow(
      'position components must be finite'
    );
    expect(() =>
      component.addShape(descriptor, { rotation: Rn.Quaternion.fromCopy4(0, Number.POSITIVE_INFINITY, 0, 1) })
    ).toThrow('rotation components must be finite');
    expect(() => component.addShape(descriptor, { rotation: Rn.Quaternion.fromCopy4(0, 0, 0, 0) })).toThrow(
      'non-zero quaternion'
    );

    const shapeIndex = component.addShape(descriptor, { rotation: Rn.Quaternion.fromCopy4(0, 0, 0, 2) });
    const rotation = component.getShape(shapeIndex)?.localRotation;
    expect(rotation?.x).toBe(0);
    expect(rotation?.y).toBe(0);
    expect(rotation?.z).toBe(0);
    expect(rotation?.w).toBe(1);
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

  test('removes rebuilt and destroyed shape gizmo entities from the repository', () => {
    const barycentricSpy = vi.spyOn(Rn.MeshComponent.prototype, 'calcBaryCentricCoord').mockImplementation(() => {});
    try {
      const entity = Rn.createShapeEntity(engine);
      const component = entity.getShape();
      component.addShape({ type: 'sphere', radius: 0.5 });
      component.isShapeGizmoVisible = true;
      const topEntity = component.shapeGizmo!.topEntity!;
      const firstGroup = topEntity.getSceneGraph().children[0];
      const firstGroupEntity = firstGroup.entity;
      const firstMeshEntity = firstGroup.children[0].entity;

      component.addShape({ type: 'box', size: Rn.Vector3.one() });

      expect(firstGroupEntity._isAlive).toBe(false);
      expect(firstMeshEntity._isAlive).toBe(false);
      expect(engine.entityRepository.getEntity(firstGroupEntity.entityUID)).not.toBe(firstGroupEntity);
      expect(engine.entityRepository.getEntity(firstMeshEntity.entityUID)).not.toBe(firstMeshEntity);

      const rebuiltGroup = topEntity.getSceneGraph().children[0];
      const rebuiltGroupUid = rebuiltGroup.entity.entityUID;
      const rebuiltMeshUid = rebuiltGroup.children[0].entity.entityUID;
      engine.entityRepository.removeComponentFromEntity(Rn.ShapeComponent, entity);

      expect(engine.entityRepository.getEntity(topEntity.entityUID)).toBeUndefined();
      expect(engine.entityRepository.getEntity(rebuiltGroupUid)).toBeUndefined();
      expect(engine.entityRepository.getEntity(rebuiltMeshUid)).toBeUndefined();
    } finally {
      barycentricSpy.mockRestore();
    }
  });

  test('MeshHelper creates generic shapes without enabling physics', () => {
    const cubes = Rn.MeshHelper.createCubes(engine, 2, { widthVector: Rn.Vector3.fromCopy3(2, 3, 4) });
    expect(cubes[0].tryToGetPhysics()).toBeUndefined();
    expect(cubes[0].tryToGetShape()?.getShape(0)?.shape.type).toBe('box');
    expect(cubes[0].tryToGetShape()?.getShape(0)?.shape).toBe(cubes[1].tryToGetShape()?.getShape(0)?.shape);
  });

  test('MeshHelper preserves mesh-only cubes with a degenerate dimension', () => {
    const widthVector = Rn.Vector3.fromCopy3(1, 0, 1);
    const cube = Rn.MeshHelper.createCube(engine, { widthVector });
    const cubes = Rn.MeshHelper.createCubes(engine, 2, { widthVector });

    expect(cube.getMesh()).toBeDefined();
    expect(cube.tryToGetShape()).toBeUndefined();
    expect(cube.tryToGetPhysics()).toBeUndefined();
    for (const meshOnlyCube of cubes) {
      expect(meshOnlyCube.getMesh()).toBeDefined();
      expect(meshOnlyCube.tryToGetShape()).toBeUndefined();
      expect(meshOnlyCube.tryToGetPhysics()).toBeUndefined();
    }
  });

  test('MeshHelper rejects degenerate cube shapes when physics is enabled', () => {
    const descriptor = {
      widthVector: Rn.Vector3.fromCopy3(1, 0, 1),
      physics: { use: true, move: false, density: 1, friction: 0.5, restitution: 0 },
    };

    expect(() => Rn.MeshHelper.createCube(engine, descriptor)).toThrow('Box shape size');
    expect(() => Rn.MeshHelper.createCubes(engine, 2, descriptor)).toThrow('Box shape size');
  });

  test('MeshHelper registers the effective radius for zero-radius spheres', () => {
    const sphere = Rn.MeshHelper.createSphere(engine, { radius: 0 });
    const spheres = Rn.MeshHelper.createSpheres(engine, 2, { radius: 0 });

    expect(sphere.getShape().getShape(0)?.shape).toEqual({ type: 'sphere', radius: 0.001 });
    expect(spheres[0].getShape().getShape(0)?.shape).toEqual({ type: 'sphere', radius: 0.001 });
    expect(spheres[0].getShape().getShape(0)?.shape).toBe(spheres[1].getShape().getShape(0)?.shape);
  });

  test('MeshHelper registers the absolute radius for inward-facing sphere meshes', () => {
    const sphere = Rn.MeshHelper.createSphere(engine, { radius: -2 });
    const spheres = Rn.MeshHelper.createSpheres(engine, 2, { radius: -3 });

    expect(sphere.getShape().getShape(0)?.shape).toEqual({ type: 'sphere', radius: 2 });
    expect(spheres[0].getShape().getShape(0)?.shape).toEqual({ type: 'sphere', radius: 3 });
    expect(spheres[0].getShape().getShape(0)?.shape).toBe(spheres[1].getShape().getShape(0)?.shape);
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

    expect(entity.getCharacterController().desiredHorizontalSpeed).toBeUndefined();
    entity.getCharacterController().setDesiredHorizontalVelocity(Rn.Vector3.fromCopy3(3, 99, 4));
    expect(entity.getCharacterController().desiredHorizontalSpeed).toBe(5);

    expect(entity.getShape().getShape(0)?.shape).toEqual({
      type: 'capsule',
      height: 1,
      radiusBottom: 0.3,
      radiusTop: 0.3,
    });
    expect(entity.getShape().getShape(0)?.localPosition.y).toBeCloseTo(0.8);
    expect(receivedShape).toBe(entity.getShape().getShape(0));
  });

  test('CharacterController cleans up an internally generated capsule and ShapeComponent on removal', () => {
    const entity = engine.entityRepository.addComponentToEntity(
      Rn.CharacterControllerComponent,
      Rn.createGroupEntity(engine)
    );
    const motionState = {
      state: 'falling' as const,
      velocity: Rn.Vector3.zero(),
      horizontalSpeed: 0,
      verticalSpeed: 0,
      groundedDuration: 0,
      airborneDuration: 0,
      stateElapsedTime: 0,
      landingImpactSpeed: 0,
    };
    const firstDestroy = vi.fn();
    entity.getCharacterController().setup(
      {
        setup: () => {},
        motionState,
        destroy: firstDestroy,
      } as never,
      { radius: 0.3, height: 1.6 }
    );
    expect(entity.tryToGetShape()?.getShape(0)?.shape).toMatchObject({ radiusBottom: 0.3, radiusTop: 0.3 });

    engine.entityRepository.removeComponentFromEntity(Rn.CharacterControllerComponent, entity);

    expect(firstDestroy).toHaveBeenCalledOnce();
    expect(entity.tryToGetShape()).toBeUndefined();

    const recreatedEntity = engine.entityRepository.addComponentToEntity(Rn.CharacterControllerComponent, entity);
    let recreatedShape: Rn.ShapeInstance | undefined;
    recreatedEntity.getCharacterController().setup(
      {
        setup: (_entity: unknown, shape: Rn.ShapeInstance) => {
          recreatedShape = shape;
        },
        motionState,
        destroy: () => {},
      } as never,
      { radius: 0.5, height: 2 }
    );

    expect(recreatedShape?.shape).toEqual({
      type: 'capsule',
      height: 1,
      radiusBottom: 0.5,
      radiusTop: 0.5,
    });
  });

  test('CharacterController rolls back a generated legacy capsule after setup failure', () => {
    const entity = Rn.createCharacterControllerEntity(engine);
    const component = entity.getCharacterController();
    expect(() =>
      component.setup(
        {
          setup: () => {
            throw new Error('setup failed');
          },
        } as never,
        { radius: 0.3, height: 1.6 }
      )
    ).toThrow('setup failed');
    expect(entity.getShape().shapeCount).toBe(0);

    let receivedShape: Rn.ShapeInstance | undefined;
    component.setup(
      {
        setup: (_entity: unknown, shape: Rn.ShapeInstance) => {
          receivedShape = shape;
        },
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
      } as never,
      { radius: 0.4, height: 2 }
    );

    expect(receivedShape?.shape).toEqual({
      type: 'capsule',
      height: 1.2,
      radiusBottom: 0.4,
      radiusTop: 0.4,
    });
    expect(receivedShape?.localPosition.y).toBeCloseTo(1);
  });

  test('CharacterController removes an automatically added ShapeComponent after setup failure', () => {
    const entity = engine.entityRepository.addComponentToEntity(
      Rn.CharacterControllerComponent,
      Rn.createGroupEntity(engine)
    );
    expect(entity.tryToGetShape()).toBeUndefined();

    expect(() =>
      entity.getCharacterController().setup(
        {
          setup: () => {
            throw new Error('setup failed');
          },
        } as never,
        { radius: 0.3, height: 1.6 }
      )
    ).toThrow('setup failed');
    expect(entity.tryToGetShape()).toBeUndefined();
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
