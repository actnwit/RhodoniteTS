import { EnumClass, type EnumIO, _from, _fromString } from '../misc/EnumIO';

export type PhysicsShapeTypeEnum = EnumIO;

class PhysicsShapeTypeClass extends EnumClass implements PhysicsShapeTypeEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const Sphere: PhysicsShapeTypeEnum = new PhysicsShapeTypeClass({
  index: 0,
  str: 'Sphere',
});
const Box: PhysicsShapeTypeEnum = new PhysicsShapeTypeClass({
  index: 1,
  str: 'Box',
});

const typeList = [Sphere, Box];

function from(index: number): PhysicsShapeTypeEnum {
  return _from({ typeList, index }) as PhysicsShapeTypeEnum;
}

function fromString(str: string): PhysicsShapeTypeEnum {
  return _fromString({ typeList, str }) as PhysicsShapeTypeEnum;
}

export const PhysicsShape = Object.freeze({
  Sphere,
  Box,
  from,
  fromString,
});
