import type { NodeJSON, NodeJSONConnection, NodeJSONNode } from '../../../types/NodeJSON';
import { Matrix44 } from '../../math/Matrix44';
import { Vector3 } from '../../math/Vector3';
import { RaymarchingSdfEvaluator } from './RaymarchingSdfEvaluator';

let nodeIdCounter = 0;

function createNode(name: string, controls: Record<string, any> = {}): NodeJSONNode {
  nodeIdCounter++;
  return {
    id: `${name}_${nodeIdCounter}`,
    name,
    outputs: {},
    inputs: {},
    controls,
    position: { x: 0, y: 0 },
  };
}

function connect(from: NodeJSONNode, fromPort: string, to: NodeJSONNode, toPort: string): NodeJSONConnection {
  return {
    id: `${from.id}_to_${to.id}`,
    from: { id: from.id, portName: fromPort },
    to: { id: to.id, portName: toPort },
  };
}

function scalar(value: number) {
  return { in1: { value } };
}

function vec3(x: number, y: number, z: number) {
  return { in1: { value: x }, in2: { value: y }, in3: { value: z } };
}

function sphereGraph(radius = 1): NodeJSON {
  const initial = createNode('InitialPosition');
  const radiusNode = createNode('ConstantScalarFloat', scalar(radius));
  const sphere = createNode('SdSphere');
  const out = createNode('OutUnion');

  return {
    nodes: [initial, radiusNode, sphere, out],
    connections: [
      connect(initial, 'outPosition', sphere, 'position'),
      connect(radiusNode, 'out1', sphere, 'radius'),
      connect(sphere, 'outDistance', out, 'in1'),
    ],
  };
}

function expectBounds(bounds: ReturnType<RaymarchingSdfEvaluator['calcBounds']>, min: number[], max: number[]) {
  expect(bounds).not.toBeNull();
  if (bounds == null) {
    return;
  }
  expect(bounds.minPoint.x).toBeCloseTo(min[0]);
  expect(bounds.minPoint.y).toBeCloseTo(min[1]);
  expect(bounds.minPoint.z).toBeCloseTo(min[2]);
  expect(bounds.maxPoint.x).toBeCloseTo(max[0]);
  expect(bounds.maxPoint.y).toBeCloseTo(max[1]);
  expect(bounds.maxPoint.z).toBeCloseTo(max[2]);
}

describe('RaymarchingSdfEvaluator', () => {
  test('calculates sphere bounds in world space', () => {
    const evaluator = new RaymarchingSdfEvaluator(sphereGraph(1), Matrix44.identity());

    expectBounds(evaluator.calcBounds(), [-1, -1, -1], [1, 1, 1]);
  });

  test('applies SdApplyTransform translation', () => {
    const initial = createNode('InitialPosition');
    const translation = createNode('ConstantVector3Float', vec3(1, 0, 0));
    const transform = createNode('SdApplyTransform');
    const sphere = createNode('SdSphere');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, translation, transform, sphere, out],
      connections: [
        connect(initial, 'outPosition', transform, 'position'),
        connect(translation, 'out1', transform, 'translation'),
        connect(transform, 'outTransformedPosition', sphere, 'position'),
        connect(sphere, 'outDistance', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expectBounds(evaluator.calcBounds(), [0, -1, -1], [2, 1, 1]);
  });

  test('applies SdApplyTransform rotation with the shader convention', () => {
    const initial = createNode('InitialPosition');
    const size = createNode('ConstantVector3Float', vec3(2, 1, 1));
    const euler = createNode('ConstantVector3Float', vec3(0, 0, Math.PI / 2));
    const transform = createNode('SdApplyTransform');
    const box = createNode('SdBox');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, size, euler, transform, box, out],
      connections: [
        connect(initial, 'outPosition', transform, 'position'),
        connect(euler, 'out1', transform, 'xyzEulerAngles'),
        connect(transform, 'outTransformedPosition', box, 'position'),
        connect(size, 'out1', box, 'size'),
        connect(box, 'outDistance', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expectBounds(evaluator.calcBounds(), [-1, -2, -1], [1, 2, 1]);
  });

  test('matches the shader rotation direction for a translated sphere', () => {
    const initial = createNode('InitialPosition');
    const euler = createNode('ConstantVector3Float', vec3(0, 0, Math.PI / 2));
    const rotation = createNode('SdApplyTransform');
    const translation = createNode('ConstantVector3Float', vec3(1, 0, 0));
    const translate = createNode('SdApplyTransform');
    const sphere = createNode('SdSphere');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, euler, rotation, translation, translate, sphere, out],
      connections: [
        connect(initial, 'outPosition', rotation, 'position'),
        connect(euler, 'out1', rotation, 'xyzEulerAngles'),
        connect(rotation, 'outTransformedPosition', translate, 'position'),
        connect(translation, 'out1', translate, 'translation'),
        connect(translate, 'outTransformedPosition', sphere, 'position'),
        connect(sphere, 'outDistance', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    // The shader applies the transpose of the standard rotation, so +90 degrees
    // around Z maps the local +X offset to world -Y.
    expectBounds(evaluator.calcBounds(), [-1, -2, -1], [1, 0, 1]);
  });

  test('applies SdApplyWorldMatrix', () => {
    const initial = createNode('InitialPosition');
    const worldMatrix = createNode('SdApplyWorldMatrix');
    const sphere = createNode('SdSphere');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, worldMatrix, sphere, out],
      connections: [
        connect(initial, 'outPosition', worldMatrix, 'position'),
        connect(worldMatrix, 'outTransformedPosition', sphere, 'position'),
        connect(sphere, 'outDistance', out, 'in1'),
      ],
    };

    const world = Matrix44.translate(Vector3.fromCopy3(0, 2, 0));
    const evaluator = new RaymarchingSdfEvaluator(graph, world);

    expectBounds(evaluator.calcBounds(), [-1, 1, -1], [1, 3, 1]);
  });

  test('merges the bounds of a union', () => {
    const initial = createNode('InitialPosition');
    const translation = createNode('ConstantVector3Float', vec3(2, 0, 0));
    const transform = createNode('SdApplyTransform');
    const sphereA = createNode('SdSphere');
    const sphereB = createNode('SdSphere');
    const union = createNode('OpUnion');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, translation, transform, sphereA, sphereB, union, out],
      connections: [
        connect(initial, 'outPosition', sphereA, 'position'),
        connect(initial, 'outPosition', transform, 'position'),
        connect(translation, 'out1', transform, 'translation'),
        connect(transform, 'outTransformedPosition', sphereB, 'position'),
        connect(sphereA, 'outDistance', union, 'lhs'),
        connect(sphereB, 'outDistance', union, 'rhs'),
        connect(union, 'outValue', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expectBounds(evaluator.calcBounds(), [-1, -1, -1], [3, 1, 1]);
  });

  test('uses only the base bounds for a subtraction', () => {
    const initial = createNode('InitialPosition');
    const radiusNode = createNode('ConstantScalarFloat', scalar(2));
    const translation = createNode('ConstantVector3Float', vec3(1, 0, 0));
    const transform = createNode('SdApplyTransform');
    const base = createNode('SdSphere');
    const subtractor = createNode('SdSphere');
    const subtraction = createNode('OpSubtraction');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, radiusNode, translation, transform, base, subtractor, subtraction, out],
      connections: [
        connect(initial, 'outPosition', base, 'position'),
        connect(radiusNode, 'out1', base, 'radius'),
        connect(initial, 'outPosition', transform, 'position'),
        connect(translation, 'out1', transform, 'translation'),
        connect(transform, 'outTransformedPosition', subtractor, 'position'),
        connect(base, 'outDistance', subtraction, 'base'),
        connect(subtractor, 'outDistance', subtraction, 'subtractor'),
        connect(subtraction, 'outValue', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expectBounds(evaluator.calcBounds(), [-2, -2, -2], [2, 2, 2]);
  });

  test('returns null bounds for an infinite tube', () => {
    const initial = createNode('InitialPosition');
    const tube = createNode('SdTubeX');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, tube, out],
      connections: [connect(initial, 'outPosition', tube, 'position'), connect(tube, 'outDistance', out, 'in1')],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expect(evaluator.calcBounds()).toBeNull();
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(5, 2, 0))).toBeCloseTo(1);
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(-5, 0, 0.5))).toBeCloseTo(-0.5);
  });

  test('evaluates repeated positions', () => {
    const initial = createNode('InitialPosition');
    const repeat = createNode('SdRepeat');
    const interval = createNode('ConstantScalarFloat', scalar(2));
    const sphere = createNode('SdSphere');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, repeat, interval, sphere, out],
      connections: [
        connect(initial, 'outPosition', repeat, 'position'),
        connect(interval, 'out1', repeat, 'interval'),
        connect(repeat, 'outPosition', sphere, 'position'),
        connect(sphere, 'outDistance', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expect(evaluator.calcBounds()).toBeNull();
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(3, 1, 0))).toBeCloseTo(0);
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(3, 0, 1))).toBeCloseTo(0);
  });

  test('uses uniform values from the provider', () => {
    const initial = createNode('InitialPosition');
    const uniform = createNode('UniformScalarFloat', {
      name: { value: 'radius' },
      initialValue: { value: 1 },
    });
    const sphere = createNode('SdSphere');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, uniform, sphere, out],
      connections: [
        connect(initial, 'outPosition', sphere, 'position'),
        connect(uniform, 'out1', sphere, 'radius'),
        connect(sphere, 'outDistance', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity(), name =>
      name === 'radius' ? 3 : undefined
    );

    expectBounds(evaluator.calcBounds(), [-3, -3, -3], [3, 3, 3]);
  });

  test('marches a ray to the sphere surface', () => {
    const evaluator = new RaymarchingSdfEvaluator(sphereGraph(1), Matrix44.identity());

    const hit = evaluator.marchRay(Vector3.fromCopy3(0, 0, 5), Vector3.fromCopy3(0, 0, -1));
    expect(hit).not.toBeNull();
    expect(hit?.t).toBeCloseTo(4);
    expect(hit?.position.z).toBeCloseTo(1);

    const miss = evaluator.marchRay(Vector3.fromCopy3(2, 0, 5), Vector3.fromCopy3(0, 0, -1));
    expect(miss).toBeNull();
  });

  test('returns undefined for unsupported nodes', () => {
    const initial = createNode('InitialPosition');
    const unknown = createNode('SomeFutureNode');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, unknown, out],
      connections: [connect(initial, 'outPosition', unknown, 'position'), connect(unknown, 'outDistance', out, 'in1')],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expect(evaluator.marchRay(Vector3.fromCopy3(0, 0, 5), Vector3.fromCopy3(0, 0, -1))).toBeUndefined();
  });
});
