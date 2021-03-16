import RnObject from '../core/RnObject';
import BufferView from './BufferView';
import {Byte, TypedArray} from '../../types/CommonTypes';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../foundation/definitions/CompositionType';
import {
  ComponentType,
  ComponentTypeEnum,
} from '../../foundation/definitions/ComponentType';

import DataUtil from '../misc/DataUtil';

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

  private __padding() {
    const paddingSize = DataUtil.calcPaddingBytes(
      this.__takenBytesIndex,
      this.__byteAlign
    );
    if (paddingSize > 0) {
      console.info(`Padding bytes added to takenBytesIndex.`);
    }

    this.__takenBytesIndex += paddingSize;
  }

  private __paddingByteLengthToNeed(byteLengthToNeed: Byte) {
    const paddingSize = DataUtil.calcPaddingBytes(
      byteLengthToNeed,
      this.__byteAlign
    );
    if (paddingSize > 0) {
      console.info(`Padding bytes added to takenBytesIndex.`);
    }
    return paddingSize;
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
      byteStride: byteStride,
      byteLength: byteLengthToNeed,
      raw: this.__raw,
      isAoS: isAoS,
      byteAlign,
    });
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
    const byteAlign = this.__byteAlign;
    const bufferView = new BufferView({
      buffer: this,
      byteOffset: byteOffset + this.__byteOffset,
      byteStride: byteStride,
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
    length = 100
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
        length
      );
    } else {
      ret = new typedArray(
        this.__raw,
        this.__byteOffset + offset4bytesUnit * 4,
        1
      );
    }

    return ret;
  }
}
