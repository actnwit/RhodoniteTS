import RnObject from '../core/RnObject';
import BufferView from './BufferView';
import {
  Byte,
  TypedArray,
  TypedArrayConstructor,
} from '../../commontypes/CommonTypes';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../foundation/definitions/CompositionType';
import {
  ComponentType,
  ComponentTypeEnum,
} from '../../foundation/definitions/ComponentType';

import {Is} from '../misc/Is';
import Vector2 from '../math/Vector2';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';

export default class Buffer extends RnObject {
  private __byteLength: Byte = 0;
  private __byteOffset: Byte = 0;
  private __raw: ArrayBuffer;
  private __name = '';
  private __takenBytesIndex: Byte = 0;
  private __bufferViews: Array<BufferView> = [];
  private __byteAlign: Byte;

  constructor({
    byteLength,
    buffer,
    name,
    byteAlign,
  }: {
    byteLength: Byte;
    buffer: ArrayBuffer;
    name: string;
    byteAlign: Byte;
  }) {
    super();
    this.__name = name;
    this.__byteLength = byteLength;
    this.__byteAlign = byteAlign;

    if (buffer instanceof Uint8Array) {
      this.__raw = buffer.buffer;
      this.__byteOffset = buffer.byteOffset;
      this.__takenBytesIndex = buffer.byteOffset;
    } else {
      this.__raw = buffer;
    }
  }

  set name(str) {
    this.__name = str;
  }

  get name() {
    return this.__name;
  }

  getArrayBuffer() {
    return this.__raw;
  }

  takeBufferView({
    byteLengthToNeed,
    byteStride,
    isAoS,
  }: {
    byteLengthToNeed: Byte;
    byteStride: Byte;
    isAoS: boolean;
  }) {
    const byteAlign = this.__byteAlign;
    if (byteLengthToNeed % byteAlign !== 0) {
      console.info(
        `Padding bytes added because byteLengthToNeed must be a multiple of ${byteAlign}.`
      );
      byteLengthToNeed += byteAlign - (byteLengthToNeed % byteAlign);
    }
    // if (byteStride % 4 !== 0) {
    //   console.info('Padding bytes added, byteStride must be a multiple of 4.');
    //   byteStride += 4 - (byteStride % 4);
    // }

    const bufferView = new BufferView({
      buffer: this,
      byteOffset: this.__takenBytesIndex,
      byteLength: byteLengthToNeed,
      raw: this.__raw,
      isAoS: isAoS,
      byteAlign,
    });
    bufferView.byteStride = byteStride;
    this.__takenBytesIndex += Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed;

    this.__bufferViews.push(bufferView);

    return bufferView;
  }

  takeBufferViewWithByteOffset({
    byteLengthToNeed,
    byteStride,
    byteOffset,
    isAoS,
  }: {
    byteLengthToNeed: Byte;
    byteStride: Byte;
    byteOffset: Byte;
    isAoS: boolean;
  }) {
    // if (byteLengthToNeed % 4 !== 0) {
    //   console.info('Padding bytes added because byteLengthToNeed must be a multiple of 4.');
    //   byteLengthToNeed += 4 - (byteLengthToNeed % 4);
    // }
    // if (byteStride % 4 !== 0) {
    //   console.info('Padding bytes added, byteStride must be a multiple of 4.');
    //   byteStride += 4 - (byteStride % 4);
    // }

    const byteAlign = this.__byteAlign;
    const bufferView = new BufferView({
      buffer: this,
      byteOffset: byteOffset + this.__byteOffset,
      byteLength: byteLengthToNeed,
      raw: this.__raw,
      isAoS: isAoS,
      byteAlign,
    });

    const takenBytesIndex =
      Uint8Array.BYTES_PER_ELEMENT * byteLengthToNeed +
      byteOffset +
      this.__byteOffset;
    if (this.__takenBytesIndex < takenBytesIndex) {
      this.__takenBytesIndex = takenBytesIndex;
    }

    bufferView.byteStride = byteStride;

    this.__bufferViews.push(bufferView);

    return bufferView;
  }

  _addTakenByteIndex(value: Byte) {
    this.__takenBytesIndex += value;
  }

  get byteLength() {
    return this.__byteLength;
  }

  get takenSizeInByte() {
    return this.__takenBytesIndex;
  }

  get byteOffsetInRawArrayBuffer() {
    return this.__byteOffset;
  }

  getTypedArray(
    offset4bytesUnit: number,
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum,
    length4BytesUnit = 100
  ) {
    let ret: TypedArray;
    const typedArray = ComponentType.toTypedArray(componentType)!;
    if (typedArray === undefined) {
      console.warn('componentType is Invalid');
    }
    if (CompositionType.isArray(compositionType)) {
      ret = new typedArray(
        this.__raw,
        this.__byteOffset + offset4bytesUnit * 4,
        length4BytesUnit
      );
    } else {
      const componentN = compositionType.getNumberOfComponents();
      const len = length4BytesUnit / componentN;
      const array = new Array(len);
      const dataView = new DataView(
        this.__raw,
        this.__byteOffset + offset4bytesUnit
      );
      switch (compositionType) {
        case CompositionType.Vec2:
          {
            for (let i = 0; i < len; i++) {
              array[i] = new Vector2(
                dataView.getFloat32(len * componentN, true)
              );
            }
          }
          break;
        case CompositionType.Vec3:
          {
            for (let i = 0; i < len; i++) {
              array[i] = new Vector3(dataView.getFloat32(len * 3, true));
            }
          }
          break;
        case CompositionType.Vec4:
          {
            for (let i = 0; i < len; i++) {
              array[i] = new Vector4(dataView.getFloat32(len * 4, true));
            }
          }
          break;
        case CompositionType.Mat3: {
          for (let i = 0; i < len; i++) {
            array[i] = new Vector4(dataView.getFloat32(len * 4, true));
          }
        }
      }
      return array;
    }
    return ret;
  }
}
