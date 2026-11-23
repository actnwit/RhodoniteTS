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

  test('evaluates the torus, capsule and round box primitives', () => {
    const singlePrimitiveGraph = (primitive: NodeJSONNode, inputs: Array<[NodeJSONNode, string]>): NodeJSON => {
      const initial = createNode('InitialPosition');
      const out = createNode('OutUnion');
      return {
        nodes: [initial, ...inputs.map(([inputNode]) => inputNode), primitive, out],
        connections: [
          connect(initial, 'outPosition', primitive, 'position'),
          ...inputs.map(([inputNode, port]) => connect(inputNode, 'out1', primitive, port)),
          connect(primitive, 'outDistance', out, 'in1'),
        ],
      };
    };

    const torusRadius = createNode('ConstantScalarFloat', scalar(1));
    const torusTubeRadius = createNode('ConstantScalarFloat', scalar(0.25));
    const torus = createNode('SdTorus');
    const torusEvaluator = new RaymarchingSdfEvaluator(
      singlePrimitiveGraph(torus, [
        [torusRadius, 'radius'],
        [torusTubeRadius, 'tubeRadius'],
      ]),
      Matrix44.identity()
    );
    expectBounds(torusEvaluator.calcBounds(), [-1.25, -0.25, -1.25], [1.25, 0.25, 1.25]);
    expect(torusEvaluator.evalDistanceAt(Vector3.fromCopy3(1, 0, 0))).toBeCloseTo(-0.25);
    expect(torusEvaluator.evalDistanceAt(Vector3.fromCopy3(1.25, 0, 0))).toBeCloseTo(0);
    expect(torusEvaluator.evalDistanceAt(Vector3.fromCopy3(1, 0.25, 0))).toBeCloseTo(0);
    expect(torusEvaluator.evalDistanceAt(Vector3.fromCopy3(0, 0, 0))).toBeCloseTo(0.75);

    const capsulePointA = createNode('ConstantVector3Float', vec3(0, -1, 0));
    const capsulePointB = createNode('ConstantVector3Float', vec3(0, 1, 0));
    const capsuleRadius = createNode('ConstantScalarFloat', scalar(0.5));
    const capsule = createNode('SdCapsule');
    const capsuleEvaluator = new RaymarchingSdfEvaluator(
      singlePrimitiveGraph(capsule, [
        [capsulePointA, 'pointA'],
        [capsulePointB, 'pointB'],
        [capsuleRadius, 'radius'],
      ]),
      Matrix44.identity()
    );
    expectBounds(capsuleEvaluator.calcBounds(), [-0.5, -1.5, -0.5], [0.5, 1.5, 0.5]);
    expect(capsuleEvaluator.evalDistanceAt(Vector3.fromCopy3(0, 0, 0.5))).toBeCloseTo(0);
    expect(capsuleEvaluator.evalDistanceAt(Vector3.fromCopy3(0, 2, 0))).toBeCloseTo(0.5);
    expect(capsuleEvaluator.evalDistanceAt(Vector3.fromCopy3(0, -2, 0))).toBeCloseTo(0.5);
    expect(capsuleEvaluator.evalDistanceAt(Vector3.fromCopy3(0, 0, 0))).toBeCloseTo(-0.5);

    const roundBoxSize = createNode('ConstantVector3Float', vec3(0.2, 0.2, 0.2));
    const roundBoxRadius = createNode('ConstantScalarFloat', scalar(0.1));
    const roundBox = createNode('SdRoundBox');
    const roundBoxEvaluator = new RaymarchingSdfEvaluator(
      singlePrimitiveGraph(roundBox, [
        [roundBoxSize, 'size'],
        [roundBoxRadius, 'radius'],
      ]),
      Matrix44.identity()
    );
    expectBounds(roundBoxEvaluator.calcBounds(), [-0.3, -0.3, -0.3], [0.3, 0.3, 0.3]);
    expect(roundBoxEvaluator.evalDistanceAt(Vector3.fromCopy3(0, 0, 0))).toBeCloseTo(-0.1);
    expect(roundBoxEvaluator.evalDistanceAt(Vector3.fromCopy3(0.3, 0, 0))).toBeCloseTo(0);
    expect(roundBoxEvaluator.evalDistanceAt(Vector3.fromCopy3(0.4, 0, 0))).toBeCloseTo(0.1);
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

  test('extracts a single sphere primitive', () => {
    const evaluator = new RaymarchingSdfEvaluator(sphereGraph(2), Matrix44.identity());

    const sphere = evaluator.calcSphere();
    expect(sphere).not.toBeNull();
    expect(sphere?.center.isEqual(Vector3.zero())).toBe(true);
    expect(sphere?.radius).toBeCloseTo(2);
    expect(sphere?.usesWorldMatrix).toBe(false);
  });

  test('marks a sphere under SdApplyWorldMatrix', () => {
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

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());
    const primitive = evaluator.calcSphere();

    expect(primitive?.usesWorldMatrix).toBe(true);
    expect(primitive?.center.isEqual(Vector3.zero())).toBe(true);
    expect(primitive?.radius).toBeCloseTo(1);
  });

  test('folds transforms into the sphere primitive', () => {
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
    const primitive = evaluator.calcSphere();

    expect(primitive?.center.x).toBeCloseTo(0);
    expect(primitive?.center.y).toBeCloseTo(-1);
    expect(primitive?.center.z).toBeCloseTo(0);
    expect(primitive?.radius).toBeCloseTo(1);
  });

  test('uses the largest axis scale for a non-uniform sphere', () => {
    const initial = createNode('InitialPosition');
    const scale = createNode('ConstantVector3Float', vec3(2, 1, 1));
    const transform = createNode('SdApplyTransform');
    const sphere = createNode('SdSphere');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, scale, transform, sphere, out],
      connections: [
        connect(initial, 'outPosition', transform, 'position'),
        connect(scale, 'out1', transform, 'scale'),
        connect(transform, 'outTransformedPosition', sphere, 'position'),
        connect(sphere, 'outDistance', out, 'in1'),
      ],
    };

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expect(evaluator.calcSphere()?.radius).toBeCloseTo(2);
  });

  test('does not extract a sphere from a union or a box', () => {
    const initial = createNode('InitialPosition');
    const sphereA = createNode('SdSphere');
    const sphereB = createNode('SdSphere');
    const union = createNode('OpUnion');
    const out = createNode('OutUnion');

    const unionGraph: NodeJSON = {
      nodes: [initial, sphereA, sphereB, union, out],
      connections: [
        connect(initial, 'outPosition', sphereA, 'position'),
        connect(initial, 'outPosition', sphereB, 'position'),
        connect(sphereA, 'outDistance', union, 'lhs'),
        connect(sphereB, 'outDistance', union, 'rhs'),
        connect(union, 'outValue', out, 'in1'),
      ],
    };
    expect(new RaymarchingSdfEvaluator(unionGraph, Matrix44.identity()).calcSphere()).toBeNull();

    const box = createNode('SdBox');
    const boxOut = createNode('OutUnion');
    const boxGraph: NodeJSON = {
      nodes: [initial, box, boxOut],
      connections: [connect(initial, 'outPosition', box, 'position'), connect(box, 'outDistance', boxOut, 'in1')],
    };
    expect(new RaymarchingSdfEvaluator(boxGraph, Matrix44.identity()).calcSphere()).toBeNull();
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

  test('converts a local distance to a conservative world distance for a scaled world matrix', () => {
    const initial = createNode('InitialPosition');
    const worldMatrix = createNode('SdApplyWorldMatrix');
    const box = createNode('SdBox');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, worldMatrix, box, out],
      connections: [
        connect(initial, 'outPosition', worldMatrix, 'position'),
        connect(worldMatrix, 'outTransformedPosition', box, 'position'),
        connect(box, 'outDistance', out, 'in1'),
      ],
    };

    // A unit box (half-size 1) scaled to (1, 0.4, 1) in world space.
    const world = Matrix44.scale(Vector3.fromCopy3(1, 0.4, 1));
    const evaluator = new RaymarchingSdfEvaluator(graph, world);

    // The local distance of the point 1.6 above the slab's top face is 4. It must be
    // scaled down to the real world distance, otherwise ray marching steps past the
    // surface and the shape loses parts.
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(0, 2, 0))).toBeCloseTo(1.6);

    // The scale is conservative on the unscaled axes: the real distance is 1 here.
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(2, 0, 0))).toBeCloseTo(0.4);

    const hit = evaluator.marchRay(Vector3.fromCopy3(0, 5, 0), Vector3.fromCopy3(0, -1, 0));
    expect(hit).not.toBeNull();
    expect(hit?.position.y).toBeCloseTo(0.4, 2);
  });

  test('converts a local distance to a conservative world distance for a scaled SdApplyTransform', () => {
    const initial = createNode('InitialPosition');
    const scale = createNode('ConstantVector3Float', vec3(1, 0.4, 1));
    const transform = createNode('SdApplyTransform');
    const box = createNode('SdBox');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [initial, scale, transform, box, out],
      connections: [
        connect(initial, 'outPosition', transform, 'position'),
        connect(scale, 'out1', transform, 'scale'),
        connect(transform, 'outTransformedPosition', box, 'position'),
        connect(box, 'outDistance', out, 'in1'),
      ],
    };

    // The entity itself is not scaled; the graph's SdApplyTransform squashes the
    // unit box to (1, 0.4, 1), just like the node editor default graph.
    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());

    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(0, 2, 0))).toBeCloseTo(1.6);
    expect(evaluator.evalDistanceAt(Vector3.fromCopy3(2, 0, 0))).toBeCloseTo(0.4);

    const hit = evaluator.marchRay(Vector3.fromCopy3(0, 5, 0), Vector3.fromCopy3(0, -1, 0));
    expect(hit).not.toBeNull();
    expect(hit?.position.y).toBeCloseTo(0.4, 2);
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

  test('supports the TwistX/Y/Z, BendXY/XZ/YZ/YX/ZX/ZY and smooth combination nodes', () => {
    const initial = createNode('InitialPosition');
    const zero = createNode('ConstantScalarFloat', scalar(0));
    const twistX = createNode('TwistX');
    const twistY = createNode('TwistY');
    const twistZ = createNode('TwistZ');
    const bendXY = createNode('BendXY');
    const bendXZ = createNode('BendXZ');
    const bendYZ = createNode('BendYZ');
    const bendYX = createNode('BendYX');
    const bendZX = createNode('BendZX');
    const bendZY = createNode('BendZY');
    const translation = createNode('ConstantVector3Float', vec3(2, 0, 0));
    const transform = createNode('SdApplyTransform');
    const sphereA = createNode('SdSphere');
    const sphereB = createNode('SdSphere');
    const smoothUnion = createNode('OpSmoothUnion');
    const out = createNode('OutUnion');

    const graph: NodeJSON = {
      nodes: [
        initial,
        zero,
        twistX,
        twistY,
        twistZ,
        bendXY,
        bendXZ,
        bendYZ,
        bendYX,
        bendZX,
        bendZY,
        translation,
        transform,
        sphereA,
        sphereB,
        smoothUnion,
        out,
      ],
      connections: [
        connect(initial, 'outPosition', twistX, 'position'),
        connect(zero, 'out1', twistX, 'strength'),
        connect(twistX, 'outPosition', twistY, 'position'),
        connect(zero, 'out1', twistY, 'strength'),
        connect(twistY, 'outPosition', twistZ, 'position'),
        connect(zero, 'out1', twistZ, 'strength'),
        connect(twistZ, 'outPosition', bendXY, 'position'),
        connect(zero, 'out1', bendXY, 'strength'),
        connect(bendXY, 'outPosition', bendXZ, 'position'),
        connect(zero, 'out1', bendXZ, 'strength'),
        connect(bendXZ, 'outPosition', bendYZ, 'position'),
        connect(zero, 'out1', bendYZ, 'strength'),
        connect(bendYZ, 'outPosition', bendYX, 'position'),
        connect(zero, 'out1', bendYX, 'strength'),
        connect(bendYX, 'outPosition', bendZX, 'position'),
        connect(zero, 'out1', bendZX, 'strength'),
        connect(bendZX, 'outPosition', bendZY, 'position'),
        connect(zero, 'out1', bendZY, 'strength'),
        connect(bendZY, 'outPosition', sphereA, 'position'),
        connect(initial, 'outPosition', transform, 'position'),
        connect(translation, 'out1', transform, 'translation'),
        connect(transform, 'outTransformedPosition', sphereB, 'position'),
        connect(sphereA, 'outDistance', smoothUnion, 'lhs'),
        connect(sphereB, 'outDistance', smoothUnion, 'rhs'),
        connect(smoothUnion, 'outValue', out, 'in1'),
      ],
    };

    const bounds = new RaymarchingSdfEvaluator(graph, Matrix44.identity()).calcBounds();
    expect(bounds).not.toBeNull();
    // The smooth union covers both spheres (the blend extends slightly outside them).
    expect(bounds!.minPoint.x).toBeLessThan(-0.5);
    expect(bounds!.maxPoint.x).toBeGreaterThan(2.5);

    const evaluator = new RaymarchingSdfEvaluator(graph, Matrix44.identity());
    expect(evaluator.marchRay(Vector3.fromCopy3(0, 0, 5), Vector3.fromCopy3(0, 0, -1))).not.toBeNull();
  });
});
