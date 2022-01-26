import {VertexAttribute} from './VertexAttribute';

test('Vertex Attributes with Positions', async () => {
  const position3 = [
    VertexAttribute.Position.X,
    VertexAttribute.Position.Y,
    VertexAttribute.Position.Z,
  ];
  expect(position3).toStrictEqual(['POSITION.X', 'POSITION.Y', 'POSITION.Z']);

  const position4 = VertexAttribute.Position.XYZW;
  expect(position4).toStrictEqual(
    'POSITION.X,POSITION.Y,POSITION.Z,POSITION.W'
  );
});

test('Custom Vertex Layout contains Positions, Normals and Texcoords', async () => {
  const custom0 = [
    VertexAttribute.Position.X,
    VertexAttribute.Position.Y,
    VertexAttribute.Position.Z,
    VertexAttribute.Texcoord0.X,
  ];
  const custom1 = [
    VertexAttribute.Normal.X,
    VertexAttribute.Normal.Y,
    VertexAttribute.Normal.Z,
    VertexAttribute.Texcoord0.Y,
  ];
  expect([custom0, custom1]).toStrictEqual([
    ['POSITION.X', 'POSITION.Y', 'POSITION.Z', 'TEXCOORD_0.X'],
    ['NORMAL.X', 'NORMAL.Y', 'NORMAL.Z', 'TEXCOORD_0.Y'],
  ]);
});
