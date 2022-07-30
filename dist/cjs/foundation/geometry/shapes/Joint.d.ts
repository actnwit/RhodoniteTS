import { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
export declare type JointDescriptor = IAnyPrimitiveDescriptor;
/**
 * the Joint class
 */
export declare class Joint extends IShape {
    private __worldPositionOfThisJoint;
    private __worldPositionOfParentJoint;
    private __width;
    /**
     * Generates a joint object
     */
    generate(desc: JointDescriptor): void;
}
