import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';

export abstract class IShape extends Primitive {
  abstract generate(desc: IAnyPrimitiveDescriptor): void;
}
