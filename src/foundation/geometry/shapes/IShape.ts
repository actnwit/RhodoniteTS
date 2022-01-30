import {IAnyPrimitiveDescriptor} from '../Primitive';

export interface IShape {
  generate(desc: IAnyPrimitiveDescriptor): void;
}
