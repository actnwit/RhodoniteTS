import {VertexAttribute} from './VertexAttribute';

test('Vertex Attribute: Position3', async () => {
  const position3 = [
    VertexAttribute.Position.X,
    VertexAttribute.Position.Y,
    VertexAttribute.Position.Z,
  ];
  expect(position3).toStrictEqual(['POSITION.X', 'POSITION.Y', 'POSITION.Z']);
});
