// src/foundation/geometry/shapes/Capsule.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { Vector3 } from "../../math/Vector3.js";
import { Logger } from "../../misc/Logger.js";
import { IShape } from "./IShape.js";
var Capsule = class extends IShape {
  /**
   * Generates capsule geometry with the specified parameters
   *
   * @param _desc - The capsule descriptor containing generation parameters
   * @param _desc.radius - The radius of the capsule (default: 0.5)
   * @param _desc.height - The height of the cylinder part (default: 1)
   * @param _desc.widthSegments - The number of horizontal segments (default: 16)
   * @param _desc.heightSegments - The number of vertical segments for each hemisphere (default: 8)
   * @param _desc.material - The material to apply to the capsule
   *
   * @remarks
   * This method generates vertex positions, texture coordinates, normals, and indices
   * for a capsule shape. The capsule is centered at the origin with its axis along the Y-axis.
   * The total height of the capsule is (height + 2 * radius).
   *
   * If the radius is zero or nearly zero, it will be clamped to 0.001 for safety.
   *
   * @example
   * ```typescript
   * const capsule = new Capsule();
   * capsule.generate({
   *   radius: 0.5,
   *   height: 2.0,
   *   widthSegments: 24,
   *   heightSegments: 12,
   *   material: myMaterial
   * });
   * ```
   */
  generate(_desc) {
    var _a, _b, _c, _d;
    const desc = {
      radius: (_a = _desc.radius) != null ? _a : 0.5,
      height: (_b = _desc.height) != null ? _b : 1,
      widthSegments: (_c = _desc.widthSegments) != null ? _c : 16,
      heightSegments: (_d = _desc.heightSegments) != null ? _d : 8,
      material: _desc.material
    };
    if (Math.abs(desc.radius) < Number.EPSILON) {
      Logger.default.warn(
        "The argument radius is zero / nearly zero. Rn will take the radius as 0.001 for safety. Check your code."
      );
      desc.radius = 1e-3;
    }
    const positions = [];
    const texcoords = [];
    const normals = [];
    const indices = [];
    const halfHeight = desc.height / 2;
    for (let lat = 0; lat <= desc.heightSegments; lat++) {
      const theta = lat * Math.PI / (2 * desc.heightSegments);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= desc.widthSegments; lon++) {
        const phi = lon * 2 * Math.PI / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = desc.radius * cosPhi * sinTheta;
        const y = desc.radius * cosTheta + halfHeight;
        const z = desc.radius * sinPhi * sinTheta;
        positions.push(x, y, z);
        const u = 1 - lon / desc.widthSegments;
        const v = lat / (desc.heightSegments * 2 + 1);
        texcoords.push(u, v);
        const normal = Vector3.normalize(Vector3.fromCopy3(cosPhi * sinTheta, cosTheta, sinPhi * sinTheta));
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    for (let lat = 1; lat < desc.heightSegments; lat++) {
      const t = lat / desc.heightSegments;
      const y = halfHeight - t * desc.height;
      for (let lon = 0; lon <= desc.widthSegments; lon++) {
        const phi = lon * 2 * Math.PI / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = desc.radius * cosPhi;
        const z = desc.radius * sinPhi;
        positions.push(x, y, z);
        const u = 1 - lon / desc.widthSegments;
        const v = (desc.heightSegments + lat) / (desc.heightSegments * 2 + desc.heightSegments);
        texcoords.push(u, v);
        normals.push(cosPhi, 0, sinPhi);
      }
    }
    for (let lat = 0; lat <= desc.heightSegments; lat++) {
      const theta = Math.PI / 2 + lat * Math.PI / (2 * desc.heightSegments);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= desc.widthSegments; lon++) {
        const phi = lon * 2 * Math.PI / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = desc.radius * cosPhi * sinTheta;
        const y = desc.radius * cosTheta - halfHeight;
        const z = desc.radius * sinPhi * sinTheta;
        positions.push(x, y, z);
        const u = 1 - lon / desc.widthSegments;
        const v = (desc.heightSegments * 2 + lat) / (desc.heightSegments * 3 + 1);
        texcoords.push(u, v);
        const normal = Vector3.normalize(Vector3.fromCopy3(cosPhi * sinTheta, cosTheta, sinPhi * sinTheta));
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    const topHemisphereRows = desc.heightSegments + 1;
    const cylinderRows = desc.heightSegments - 1;
    const bottomHemisphereRows = desc.heightSegments + 1;
    const totalRows = topHemisphereRows + cylinderRows + bottomHemisphereRows;
    for (let lat = 0; lat < totalRows - 1; lat++) {
      for (let lon = 0; lon < desc.widthSegments; lon++) {
        const first = lat * (desc.widthSegments + 1) + lon;
        const second = first + desc.widthSegments + 1;
        indices.push(first + 1, second, first);
        indices.push(first + 1, second + 1, second);
      }
    }
    const attributeSemantics = [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY];
    const primitiveMode = PrimitiveMode.Triangles;
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];
    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode,
      indices: new Uint16Array(indices),
      material: desc.material
    });
  }
};
export {
  Capsule
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL0NhcHN1bGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ291bnQgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBQcmltaXRpdmVNb2RlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJpbWl0aXZlTW9kZSc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi8uLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgdHlwZSB7IFBoeXNpY3NQcm9wZXJ0eSB9IGZyb20gJy4uLy4uL3BoeXNpY3MvUGh5c2ljc1Byb3BlcnR5JztcbmltcG9ydCB0eXBlIHsgSUFueVByaW1pdGl2ZURlc2NyaXB0b3IgfSBmcm9tICcuLi9QcmltaXRpdmUnO1xuaW1wb3J0IHsgSVNoYXBlIH0gZnJvbSAnLi9JU2hhcGUnO1xuXG4vKipcbiAqIFRoZSBhcmd1bWVudCBkZXNjcmlwdG9yIGZvciBDYXBzdWxlIHByaW1pdGl2ZXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDYXBzdWxlRGVzY3JpcHRvciBleHRlbmRzIElBbnlQcmltaXRpdmVEZXNjcmlwdG9yIHtcbiAgLyoqXG4gICAqIFRoZSByYWRpdXMgb2YgdGhlIGNhcHN1bGUgKGhhbGYtc3BoZXJlcyBhbmQgY3lsaW5kZXIpLlxuICAgKiBAZGVmYXVsdCAwLjVcbiAgICovXG4gIHJhZGl1cz86IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGhlaWdodCBvZiB0aGUgY2Fwc3VsZSAoZGlzdGFuY2UgYmV0d2VlbiB0aGUgY2VudGVycyBvZiB0aGUgdHdvIGhhbGYtc3BoZXJlcykuXG4gICAqIEBkZWZhdWx0IDFcbiAgICovXG4gIGhlaWdodD86IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBzZWdtZW50cyB0aGF0IGRlZmluZSB0aGUgY2Fwc3VsZSdzIHdpZHRoIChob3Jpem9udGFsIGRpdmlzaW9ucykuXG4gICAqIEBkZWZhdWx0IDE2XG4gICAqL1xuICB3aWR0aFNlZ21lbnRzPzogQ291bnQ7XG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2Ygc2VnbWVudHMgdGhhdCBkZWZpbmUgdGhlIGNhcHN1bGUncyBoZWlnaHQgKHZlcnRpY2FsIGRpdmlzaW9ucyBmb3IgZWFjaCBoYWxmLXNwaGVyZSkuXG4gICAqIEBkZWZhdWx0IDhcbiAgICovXG4gIGhlaWdodFNlZ21lbnRzPzogQ291bnQ7XG5cbiAgLyoqXG4gICAqIFBoeXNpY3MgcHJvcGVydGllcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNhcHN1bGUsIHN1Y2ggYXMgbWFzcyBhbmQgY29sbGlzaW9uIHNldHRpbmdzLlxuICAgKi9cbiAgcGh5c2ljcz86IFBoeXNpY3NQcm9wZXJ0eTtcbn1cblxuLyoqXG4gKiBDYXBzdWxlIGNsYXNzIGZvciBnZW5lcmF0aW5nIGNhcHN1bGUgZ2VvbWV0cnkgd2l0aCBjdXN0b21pemFibGUgcGFyYW1ldGVycy5cbiAqIEEgY2Fwc3VsZSBjb25zaXN0cyBvZiBhIGN5bGluZGVyIHdpdGggaGVtaXNwaGVyaWNhbCBjYXBzIGF0IGJvdGggZW5kcy5cbiAqIFRoZSBjYXBzdWxlIGlzIG9yaWVudGVkIGFsb25nIHRoZSBZLWF4aXMsIHdpdGggdGhlIGNlbnRlciBhdCB0aGUgb3JpZ2luLlxuICovXG5leHBvcnQgY2xhc3MgQ2Fwc3VsZSBleHRlbmRzIElTaGFwZSB7XG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgY2Fwc3VsZSBnZW9tZXRyeSB3aXRoIHRoZSBzcGVjaWZpZWQgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcGFyYW0gX2Rlc2MgLSBUaGUgY2Fwc3VsZSBkZXNjcmlwdG9yIGNvbnRhaW5pbmcgZ2VuZXJhdGlvbiBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBfZGVzYy5yYWRpdXMgLSBUaGUgcmFkaXVzIG9mIHRoZSBjYXBzdWxlIChkZWZhdWx0OiAwLjUpXG4gICAqIEBwYXJhbSBfZGVzYy5oZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSBjeWxpbmRlciBwYXJ0IChkZWZhdWx0OiAxKVxuICAgKiBAcGFyYW0gX2Rlc2Mud2lkdGhTZWdtZW50cyAtIFRoZSBudW1iZXIgb2YgaG9yaXpvbnRhbCBzZWdtZW50cyAoZGVmYXVsdDogMTYpXG4gICAqIEBwYXJhbSBfZGVzYy5oZWlnaHRTZWdtZW50cyAtIFRoZSBudW1iZXIgb2YgdmVydGljYWwgc2VnbWVudHMgZm9yIGVhY2ggaGVtaXNwaGVyZSAoZGVmYXVsdDogOClcbiAgICogQHBhcmFtIF9kZXNjLm1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGFwcGx5IHRvIHRoZSBjYXBzdWxlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGdlbmVyYXRlcyB2ZXJ0ZXggcG9zaXRpb25zLCB0ZXh0dXJlIGNvb3JkaW5hdGVzLCBub3JtYWxzLCBhbmQgaW5kaWNlc1xuICAgKiBmb3IgYSBjYXBzdWxlIHNoYXBlLiBUaGUgY2Fwc3VsZSBpcyBjZW50ZXJlZCBhdCB0aGUgb3JpZ2luIHdpdGggaXRzIGF4aXMgYWxvbmcgdGhlIFktYXhpcy5cbiAgICogVGhlIHRvdGFsIGhlaWdodCBvZiB0aGUgY2Fwc3VsZSBpcyAoaGVpZ2h0ICsgMiAqIHJhZGl1cykuXG4gICAqXG4gICAqIElmIHRoZSByYWRpdXMgaXMgemVybyBvciBuZWFybHkgemVybywgaXQgd2lsbCBiZSBjbGFtcGVkIHRvIDAuMDAxIGZvciBzYWZldHkuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgY2Fwc3VsZSA9IG5ldyBDYXBzdWxlKCk7XG4gICAqIGNhcHN1bGUuZ2VuZXJhdGUoe1xuICAgKiAgIHJhZGl1czogMC41LFxuICAgKiAgIGhlaWdodDogMi4wLFxuICAgKiAgIHdpZHRoU2VnbWVudHM6IDI0LFxuICAgKiAgIGhlaWdodFNlZ21lbnRzOiAxMixcbiAgICogICBtYXRlcmlhbDogbXlNYXRlcmlhbFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBnZW5lcmF0ZShfZGVzYzogQ2Fwc3VsZURlc2NyaXB0b3IpIHtcbiAgICBjb25zdCBkZXNjID0ge1xuICAgICAgcmFkaXVzOiBfZGVzYy5yYWRpdXMgPz8gMC41LFxuICAgICAgaGVpZ2h0OiBfZGVzYy5oZWlnaHQgPz8gMSxcbiAgICAgIHdpZHRoU2VnbWVudHM6IF9kZXNjLndpZHRoU2VnbWVudHMgPz8gMTYsXG4gICAgICBoZWlnaHRTZWdtZW50czogX2Rlc2MuaGVpZ2h0U2VnbWVudHMgPz8gOCxcbiAgICAgIG1hdGVyaWFsOiBfZGVzYy5tYXRlcmlhbCxcbiAgICB9O1xuXG4gICAgaWYgKE1hdGguYWJzKGRlc2MucmFkaXVzKSA8IE51bWJlci5FUFNJTE9OKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAnVGhlIGFyZ3VtZW50IHJhZGl1cyBpcyB6ZXJvIC8gbmVhcmx5IHplcm8uIFJuIHdpbGwgdGFrZSB0aGUgcmFkaXVzIGFzIDAuMDAxIGZvciBzYWZldHkuIENoZWNrIHlvdXIgY29kZS4nXG4gICAgICApO1xuICAgICAgZGVzYy5yYWRpdXMgPSAwLjAwMTtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NpdGlvbnM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgdGV4Y29vcmRzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IG5vcm1hbHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgaW5kaWNlczogbnVtYmVyW10gPSBbXTtcblxuICAgIGNvbnN0IGhhbGZIZWlnaHQgPSBkZXNjLmhlaWdodCAvIDI7XG5cbiAgICAvLyBHZW5lcmF0ZSB0b3AgaGVtaXNwaGVyZSAoZnJvbSB0b3AgcG9sZSB0byBlcXVhdG9yKVxuICAgIGZvciAobGV0IGxhdCA9IDA7IGxhdCA8PSBkZXNjLmhlaWdodFNlZ21lbnRzOyBsYXQrKykge1xuICAgICAgY29uc3QgdGhldGEgPSAobGF0ICogTWF0aC5QSSkgLyAoMiAqIGRlc2MuaGVpZ2h0U2VnbWVudHMpO1xuICAgICAgY29uc3Qgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgICBjb25zdCBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcblxuICAgICAgZm9yIChsZXQgbG9uID0gMDsgbG9uIDw9IGRlc2Mud2lkdGhTZWdtZW50czsgbG9uKyspIHtcbiAgICAgICAgY29uc3QgcGhpID0gKGxvbiAqIDIgKiBNYXRoLlBJKSAvIGRlc2Mud2lkdGhTZWdtZW50cztcbiAgICAgICAgY29uc3Qgc2luUGhpID0gTWF0aC5zaW4ocGhpKTtcbiAgICAgICAgY29uc3QgY29zUGhpID0gTWF0aC5jb3MocGhpKTtcblxuICAgICAgICBjb25zdCB4ID0gZGVzYy5yYWRpdXMgKiBjb3NQaGkgKiBzaW5UaGV0YTtcbiAgICAgICAgY29uc3QgeSA9IGRlc2MucmFkaXVzICogY29zVGhldGEgKyBoYWxmSGVpZ2h0O1xuICAgICAgICBjb25zdCB6ID0gZGVzYy5yYWRpdXMgKiBzaW5QaGkgKiBzaW5UaGV0YTtcblxuICAgICAgICBwb3NpdGlvbnMucHVzaCh4LCB5LCB6KTtcblxuICAgICAgICBjb25zdCB1ID0gMSAtIGxvbiAvIGRlc2Mud2lkdGhTZWdtZW50cztcbiAgICAgICAgY29uc3QgdiA9IGxhdCAvIChkZXNjLmhlaWdodFNlZ21lbnRzICogMiArIDEpO1xuICAgICAgICB0ZXhjb29yZHMucHVzaCh1LCB2KTtcblxuICAgICAgICBjb25zdCBub3JtYWwgPSBWZWN0b3IzLm5vcm1hbGl6ZShWZWN0b3IzLmZyb21Db3B5Myhjb3NQaGkgKiBzaW5UaGV0YSwgY29zVGhldGEsIHNpblBoaSAqIHNpblRoZXRhKSk7XG4gICAgICAgIG5vcm1hbHMucHVzaChub3JtYWwueCwgbm9ybWFsLnksIG5vcm1hbC56KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBjeWxpbmRlciBwYXJ0XG4gICAgZm9yIChsZXQgbGF0ID0gMTsgbGF0IDwgZGVzYy5oZWlnaHRTZWdtZW50czsgbGF0KyspIHtcbiAgICAgIGNvbnN0IHQgPSBsYXQgLyBkZXNjLmhlaWdodFNlZ21lbnRzO1xuICAgICAgY29uc3QgeSA9IGhhbGZIZWlnaHQgLSB0ICogZGVzYy5oZWlnaHQ7XG5cbiAgICAgIGZvciAobGV0IGxvbiA9IDA7IGxvbiA8PSBkZXNjLndpZHRoU2VnbWVudHM7IGxvbisrKSB7XG4gICAgICAgIGNvbnN0IHBoaSA9IChsb24gKiAyICogTWF0aC5QSSkgLyBkZXNjLndpZHRoU2VnbWVudHM7XG4gICAgICAgIGNvbnN0IHNpblBoaSA9IE1hdGguc2luKHBoaSk7XG4gICAgICAgIGNvbnN0IGNvc1BoaSA9IE1hdGguY29zKHBoaSk7XG5cbiAgICAgICAgY29uc3QgeCA9IGRlc2MucmFkaXVzICogY29zUGhpO1xuICAgICAgICBjb25zdCB6ID0gZGVzYy5yYWRpdXMgKiBzaW5QaGk7XG5cbiAgICAgICAgcG9zaXRpb25zLnB1c2goeCwgeSwgeik7XG5cbiAgICAgICAgY29uc3QgdSA9IDEgLSBsb24gLyBkZXNjLndpZHRoU2VnbWVudHM7XG4gICAgICAgIGNvbnN0IHYgPSAoZGVzYy5oZWlnaHRTZWdtZW50cyArIGxhdCkgLyAoZGVzYy5oZWlnaHRTZWdtZW50cyAqIDIgKyBkZXNjLmhlaWdodFNlZ21lbnRzKTtcbiAgICAgICAgdGV4Y29vcmRzLnB1c2godSwgdik7XG5cbiAgICAgICAgbm9ybWFscy5wdXNoKGNvc1BoaSwgMCwgc2luUGhpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBib3R0b20gaGVtaXNwaGVyZSAoZnJvbSBlcXVhdG9yIHRvIGJvdHRvbSBwb2xlKVxuICAgIGZvciAobGV0IGxhdCA9IDA7IGxhdCA8PSBkZXNjLmhlaWdodFNlZ21lbnRzOyBsYXQrKykge1xuICAgICAgY29uc3QgdGhldGEgPSBNYXRoLlBJIC8gMiArIChsYXQgKiBNYXRoLlBJKSAvICgyICogZGVzYy5oZWlnaHRTZWdtZW50cyk7XG4gICAgICBjb25zdCBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcbiAgICAgIGNvbnN0IGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuXG4gICAgICBmb3IgKGxldCBsb24gPSAwOyBsb24gPD0gZGVzYy53aWR0aFNlZ21lbnRzOyBsb24rKykge1xuICAgICAgICBjb25zdCBwaGkgPSAobG9uICogMiAqIE1hdGguUEkpIC8gZGVzYy53aWR0aFNlZ21lbnRzO1xuICAgICAgICBjb25zdCBzaW5QaGkgPSBNYXRoLnNpbihwaGkpO1xuICAgICAgICBjb25zdCBjb3NQaGkgPSBNYXRoLmNvcyhwaGkpO1xuXG4gICAgICAgIGNvbnN0IHggPSBkZXNjLnJhZGl1cyAqIGNvc1BoaSAqIHNpblRoZXRhO1xuICAgICAgICBjb25zdCB5ID0gZGVzYy5yYWRpdXMgKiBjb3NUaGV0YSAtIGhhbGZIZWlnaHQ7XG4gICAgICAgIGNvbnN0IHogPSBkZXNjLnJhZGl1cyAqIHNpblBoaSAqIHNpblRoZXRhO1xuXG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKHgsIHksIHopO1xuXG4gICAgICAgIGNvbnN0IHUgPSAxIC0gbG9uIC8gZGVzYy53aWR0aFNlZ21lbnRzO1xuICAgICAgICBjb25zdCB2ID0gKGRlc2MuaGVpZ2h0U2VnbWVudHMgKiAyICsgbGF0KSAvIChkZXNjLmhlaWdodFNlZ21lbnRzICogMyArIDEpO1xuICAgICAgICB0ZXhjb29yZHMucHVzaCh1LCB2KTtcblxuICAgICAgICBjb25zdCBub3JtYWwgPSBWZWN0b3IzLm5vcm1hbGl6ZShWZWN0b3IzLmZyb21Db3B5Myhjb3NQaGkgKiBzaW5UaGV0YSwgY29zVGhldGEsIHNpblBoaSAqIHNpblRoZXRhKSk7XG4gICAgICAgIG5vcm1hbHMucHVzaChub3JtYWwueCwgbm9ybWFsLnksIG5vcm1hbC56KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgdG90YWwgbnVtYmVyIG9mIGxhdGl0dWRlIHJvd3NcbiAgICBjb25zdCB0b3BIZW1pc3BoZXJlUm93cyA9IGRlc2MuaGVpZ2h0U2VnbWVudHMgKyAxO1xuICAgIGNvbnN0IGN5bGluZGVyUm93cyA9IGRlc2MuaGVpZ2h0U2VnbWVudHMgLSAxO1xuICAgIGNvbnN0IGJvdHRvbUhlbWlzcGhlcmVSb3dzID0gZGVzYy5oZWlnaHRTZWdtZW50cyArIDE7XG4gICAgY29uc3QgdG90YWxSb3dzID0gdG9wSGVtaXNwaGVyZVJvd3MgKyBjeWxpbmRlclJvd3MgKyBib3R0b21IZW1pc3BoZXJlUm93cztcblxuICAgIC8vIEdlbmVyYXRlIGluZGljZXNcbiAgICBmb3IgKGxldCBsYXQgPSAwOyBsYXQgPCB0b3RhbFJvd3MgLSAxOyBsYXQrKykge1xuICAgICAgZm9yIChsZXQgbG9uID0gMDsgbG9uIDwgZGVzYy53aWR0aFNlZ21lbnRzOyBsb24rKykge1xuICAgICAgICBjb25zdCBmaXJzdCA9IGxhdCAqIChkZXNjLndpZHRoU2VnbWVudHMgKyAxKSArIGxvbjtcbiAgICAgICAgY29uc3Qgc2Vjb25kID0gZmlyc3QgKyBkZXNjLndpZHRoU2VnbWVudHMgKyAxO1xuXG4gICAgICAgIGluZGljZXMucHVzaChmaXJzdCArIDEsIHNlY29uZCwgZmlyc3QpO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmlyc3QgKyAxLCBzZWNvbmQgKyAxLCBzZWNvbmQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF0dHJpYnV0ZVNlbWFudGljcyA9IFtWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaLCBWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWiwgVmVydGV4QXR0cmlidXRlLlRleGNvb3JkMC5YWV07XG4gICAgY29uc3QgcHJpbWl0aXZlTW9kZSA9IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpLCBuZXcgRmxvYXQzMkFycmF5KG5vcm1hbHMpLCBuZXcgRmxvYXQzMkFycmF5KHRleGNvb3JkcyldO1xuXG4gICAgdGhpcy5jb3B5VmVydGV4RGF0YSh7XG4gICAgICBhdHRyaWJ1dGVzLFxuICAgICAgYXR0cmlidXRlU2VtYW50aWNzLFxuICAgICAgcHJpbWl0aXZlTW9kZSxcbiAgICAgIGluZGljZXM6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzKSxcbiAgICAgIG1hdGVyaWFsOiBkZXNjLm1hdGVyaWFsLFxuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYztBQUd2QixTQUFTLGNBQWM7QUF5Q2hCLElBQU0sVUFBTixjQUFzQixPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBOEJsQyxTQUFTLE9BQTBCO0FBOUVyQztBQStFSSxVQUFNLE9BQU87QUFBQSxNQUNYLFNBQVEsV0FBTSxXQUFOLFlBQWdCO0FBQUEsTUFDeEIsU0FBUSxXQUFNLFdBQU4sWUFBZ0I7QUFBQSxNQUN4QixnQkFBZSxXQUFNLGtCQUFOLFlBQXVCO0FBQUEsTUFDdEMsaUJBQWdCLFdBQU0sbUJBQU4sWUFBd0I7QUFBQSxNQUN4QyxVQUFVLE1BQU07QUFBQSxJQUNsQjtBQUVBLFFBQUksS0FBSyxJQUFJLEtBQUssTUFBTSxJQUFJLE9BQU8sU0FBUztBQUMxQyxhQUFPLFFBQVE7QUFBQSxRQUNiO0FBQUEsTUFDRjtBQUNBLFdBQUssU0FBUztBQUFBLElBQ2hCO0FBRUEsVUFBTSxZQUFzQixDQUFDO0FBQzdCLFVB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
