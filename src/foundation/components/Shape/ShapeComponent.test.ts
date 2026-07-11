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

  test('MeshHelper creates generic shapes without enabling physics', () => {
    const cubes = Rn.MeshHelper.createCubes(engine, 2, { widthVector: Rn.Vector3.fromCopy3(2, 3, 4) });
    expect(cubes[0].tryToGetPhysics()).toBeUndefined();
    expect(cubes[0].tryToGetShape()?.getShape(0)?.shape.type).toBe('box');
    expect(cubes[0].tryToGetShape()?.getShape(0)?.shape).toBe(cubes[1].tryToGetShape()?.getShape(0)?.shape);
  });
});
