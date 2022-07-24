import { IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
export declare abstract class IShape extends Primitive {
    abstract generate(desc: IAnyPrimitiveDescriptor): void;
}
