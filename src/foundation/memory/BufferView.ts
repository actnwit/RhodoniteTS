import Buffer from '../memory/Buffer';
import {CompositionTypeEnum} from '../definitions/CompositionType';
import {ComponentTypeEnum} from '../definitions/ComponentType';
import Accessor from './Accessor';
import {Byte, Count, Size} from '../../types/CommonTypes';
import {Is} from '../misc/Is';

export default class BufferView {
  private __buffer: Buffer;
  private __byteOffsetInRawArrayBufferOfBuffer: Byte;
  private __byteLength: Byte;
  private __defaultByteStride: Byte = 0;
  private __takenByteIndex: Byte = 0;
  private __raw: ArrayBuffer;
  private __accessors: Array<Accessor> = [];

  constructor({
    buffer,
    byteOffset,
    defaultByteStride,
    byteLength,
    raw,
    byteAlign,
  }: {
    buffer: Buffer;
    byteOffset: Byte;
    defaultByteStride: Byte;
    byteLength: Byte;
    raw: ArrayBuffer;
    byteAlign: Byte;
  }) {
    this.__buffer = buffer;
    this.__byteOffsetInRawArrayBufferOfBuffer = byteOffset;
    this.__byteLength = byteLength;
    this.__defaultByteStride = defaultByteStride;
    this.__raw = raw;
  }

  get defaultByteStride() {
    return this.__defaultByteStride;
  }

  get byteLength() {
    return this.__byteLength;
  }

  /**
   * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
   */
  get byteOffsetInBuffer() {
    return (
      this.__byteOffsetInRawArrayBufferOfBuffer -
      this.__buffer.byteOffsetInRawArrayBuffer
    );
  }

  /**
   * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
   */
  get byteOffsetInRawArrayBufferOfBuffer() {
    return this.__byteOffsetInRawArrayBufferOfBuffer;
  }

  get buffer() {
    return this.__buffer;
  }

  get isSoA() {
    return !this.isAoS;
  }

  get isAoS() {
    const foundAoS = this.__accessors.find((accessor: Accessor) => {
      return accessor.isAoS;
    });
    return Is.defined(foundAoS);
  }

  getUint8Array() {
    return new Uint8Array(
      this.__raw,
      this.__byteOffsetInRawArrayBufferOfBuffer,
      this.__byteLength
    );
  }

  takeAccessor({
    compositionType,
    componentType,
    count,
    max,
    min,
    normalized = false,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    max?: number[];
    min?: number[];
    normalized?: boolean;
  }): Accessor {
    const byteStride = this.defaultByteStride;
    const accessor = this.__takeAccessorInner({
      compositionType,
      componentType,
      count,
      byteStride,
      max,
      min,
      normalized,
      arrayLength: 1,
    });

    return accessor;
  }

  takeFlexibleAccessor({
    compositionType,
    componentType,
    count,
    byteStride,
    max,
    min,
    arrayLength,
    normalized = false,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride: Byte;
    max?: number[];
    min?: number[];
    byteAlign?: Byte;
    arrayLength?: Size;
    normalized?: boolean;
  }): Accessor {
    const _arrayLength = arrayLength ?? 1;

    const accessor = this.__takeAccessorInner({
      compositionType,
      componentType,
      count,
      byteStride,
      max,
      min,
      arrayLength: _arrayLength,
      normalized,
    });

    return accessor;
  }

  takeFlexibleAccessorWithByteOffset({
    compositionType,
    componentType,
    count,
    byteStride = 0,
    byteOffsetInBufferView,
    byteOffsetInAccessor = 0,
    max,
    min,
    normalized = false,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride: Byte;
    byteOffsetInBufferView: Byte;
    byteOffsetInAccessor: Byte;
    max?: number[];
    min?: number[];
    normalized?: boolean;
  }): Accessor {
    const accessor = this.__takeAccessorInnerWithByteOffset({
      compositionType,
      componentType,
      count,
      byteStride,
      byteOffsetInBufferView,
      byteOffsetInAccessor,
      max,
      min,
      normalized,
    });

    return accessor;
  }

  private __takeAccessorInner({
    compositionType,
    componentType,
    count,
    byteStride,
    max,
    min,
    arrayLength,
    normalized,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride: Byte;
    max?: number[];
    min?: number[];
    arrayLength: Size;
    normalized: boolean;
  }): Accessor {
    const byteOffsetInBufferView = this.__takenByteIndex;
    let actualByteStride = byteStride;
    if (actualByteStride === 0) {
      actualByteStride =
        compositionType.getNumberOfComponents() *
        componentType.getSizeInBytes() *
        arrayLength;
    }

    const accessor = new Accessor({
      bufferView: this,
      byteOffsetInBufferView,
      byteOffsetInAccessor: 0,
      compositionType,
      componentType,
      byteStride,
      count,
      raw: this.__raw,
      max,
      min,
      arrayLength,
      normalized,
    });

    this.__accessors.push(accessor);

    this.__takenByteIndex += actualByteStride * count;

    return accessor;
  }

  private __takeAccessorInnerWithByteOffset({
    compositionType,
    componentType,
    count,
    byteStride,
    byteOffsetInBufferView,
    byteOffsetInAccessor,
    max,
    min,
    normalized,
  }: {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    count: Count;
    byteStride: Byte;
    byteOffsetInBufferView: Byte;
    byteOffsetInAccessor: Byte;
    max?: number[];
    min?: number[];
    normalized: boolean;
  }): Accessor {
    const accessor = new Accessor({
      bufferView: this,
      byteOffsetInBufferView,
      byteOffsetInAccessor,
      compositionType,
      componentType,
      byteStride,
      count,
      raw: this.__raw,
      max,
      min,
      arrayLength: 1,
      normalized,
    });

    this.__accessors.push(accessor);

    return accessor;
  }
}
