// src/foundation/geometry/shapes/Sphere.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { Vector3 } from "../../math/Vector3.js";
import { Logger } from "../../misc/Logger.js";
import { IShape } from "./IShape.js";
var Sphere = class extends IShape {
  /**
   * Generates sphere geometry with the specified parameters
   *
   * @param _desc - The sphere descriptor containing generation parameters
   * @param _desc.radius - The radius of the sphere (default: 1)
   * @param _desc.widthSegments - The number of horizontal segments (default: 10)
   * @param _desc.heightSegments - The number of vertical segments (default: 10)
   * @param _desc.material - The material to apply to the sphere
   * @param _desc.inverseNormal - Whether to invert the normals (default: false)
   *
   * @remarks
   * This method generates vertex positions, texture coordinates, normals, and indices
   * for a UV sphere using spherical coordinates. The sphere is centered at the origin.
   *
   * If the radius is zero or nearly zero, it will be clamped to 0.001 for safety.
   * A small shift value is applied to avoid singularities at the poles.
   *
   * The texture coordinates are mapped so that u ranges from 0 to 1 (longitude)
   * and v ranges from 0 to 1 (latitude).
   *
   * @example
   * ```typescript
   * const sphere = new Sphere();
   * sphere.generate({
   *   radius: 2.0,
   *   widthSegments: 20,
   *   heightSegments: 20,
   *   material: myMaterial
   * });
   * ```
   */
  generate(_desc) {
    var _a, _b, _c, _d;
    const desc = {
      radius: (_a = _desc.radius) != null ? _a : 1,
      widthSegments: (_b = _desc.widthSegments) != null ? _b : 10,
      heightSegments: (_c = _desc.heightSegments) != null ? _c : 10,
      material: _desc.material,
      inverseNormal: (_d = _desc.inverseNormal) != null ? _d : false
    };
    const positions = [];
    const texcoords = [];
    const normals = [];
    if (Math.abs(desc.radius) < Number.EPSILON) {
      Logger.default.warn(
        "The argument radius is zero / nearly zero. Rn will take the radius as 0.001 for safety. Check your code."
      );
      desc.radius = 1e-3;
    }
    const shiftValue = 1e-5;
    for (let latNumber = 0; latNumber <= desc.heightSegments; latNumber++) {
      const theta = latNumber * Math.PI / desc.heightSegments + shiftValue;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let longNumber = 0; longNumber <= desc.widthSegments; longNumber++) {
        const phi = longNumber * 2 * Math.PI / desc.widthSegments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = desc.radius * cosPhi * sinTheta;
        const y = desc.radius * cosTheta;
        const z = desc.radius * sinPhi * sinTheta;
        const position = Vector3.fromCopyArray([x, y, z]);
        positions.push(x);
        positions.push(y);
        positions.push(z);
        const u = 1 - longNumber / desc.widthSegments;
        const v = latNumber / desc.heightSegments;
        texcoords.push(u);
        texcoords.push(v);
        const normal = Vector3.normalize(position);
        normals.push(desc.inverseNormal ? -normal.x : normal.x);
        normals.push(desc.inverseNormal ? -normal.y : normal.y);
        normals.push(desc.inverseNormal ? -normal.z : normal.z);
      }
    }
    const indices = [];
    for (let latNumber = 0; latNumber < desc.heightSegments; latNumber++) {
      for (let longNumber = 0; longNumber < desc.widthSegments; longNumber++) {
        const first = latNumber * (desc.widthSegments + 1) + longNumber;
        const second = first + desc.widthSegments + 1;
        indices.push(first + 1);
        indices.push(second);
        indices.push(first);
        indices.push(first + 1);
        indices.push(second + 1);
        indices.push(second);
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
  Sphere
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL1NwaGVyZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb3VudCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uLy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgUGh5c2ljc1Byb3BlcnR5IH0gZnJvbSAnLi4vLi4vcGh5c2ljcy9QaHlzaWNzUHJvcGVydHknO1xuaW1wb3J0IHR5cGUgeyBJQW55UHJpbWl0aXZlRGVzY3JpcHRvciB9IGZyb20gJy4uL1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBJU2hhcGUgfSBmcm9tICcuL0lTaGFwZSc7XG5cbi8qKlxuICogVGhlIGFyZ3VtZW50IGRlc2NyaXB0b3IgZm9yIFNwaGVyZSBwcmltaXRpdmVzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3BoZXJlRGVzY3JpcHRvciBleHRlbmRzIElBbnlQcmltaXRpdmVEZXNjcmlwdG9yIHtcbiAgLyoqXG4gICAqIFRoZSByYWRpdXMgb2YgdGhlIHNwaGVyZS5cbiAgICogQGRlZmF1bHQgMVxuICAgKi9cbiAgcmFkaXVzPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIHNlZ21lbnRzIHRoYXQgZGVmaW5lIHRoZSBzcGhlcmUncyB3aWR0aCAoaG9yaXpvbnRhbCBkaXZpc2lvbnMpLlxuICAgKiBAZGVmYXVsdCAxMFxuICAgKi9cbiAgd2lkdGhTZWdtZW50cz86IENvdW50O1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIHNlZ21lbnRzIHRoYXQgZGVmaW5lIHRoZSBzcGhlcmUncyBoZWlnaHQgKHZlcnRpY2FsIGRpdmlzaW9ucykuXG4gICAqIEBkZWZhdWx0IDEwXG4gICAqL1xuICBoZWlnaHRTZWdtZW50cz86IENvdW50O1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0byBpbnZlcnQgdGhlIG5vcm1hbHMgb2YgdGhlIHNwaGVyZSdzIHN1cmZhY2UuXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBpbnZlcnNlTm9ybWFsPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogUGh5c2ljcyBwcm9wZXJ0aWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BoZXJlLCBzdWNoIGFzIG1hc3MgYW5kIGNvbGxpc2lvbiBzZXR0aW5ncy5cbiAgICovXG4gIHBoeXNpY3M/OiBQaHlzaWNzUHJvcGVydHk7XG59XG5cbi8qKlxuICogU3BoZXJlIGNsYXNzIGZvciBnZW5lcmF0aW5nIHNwaGVyaWNhbCBnZW9tZXRyeSB3aXRoIGN1c3RvbWl6YWJsZSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBTcGhlcmUgZXh0ZW5kcyBJU2hhcGUge1xuICAvKipcbiAgICogR2VuZXJhdGVzIHNwaGVyZSBnZW9tZXRyeSB3aXRoIHRoZSBzcGVjaWZpZWQgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcGFyYW0gX2Rlc2MgLSBUaGUgc3BoZXJlIGRlc2NyaXB0b3IgY29udGFpbmluZyBnZW5lcmF0aW9uIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIF9kZXNjLnJhZGl1cyAtIFRoZSByYWRpdXMgb2YgdGhlIHNwaGVyZSAoZGVmYXVsdDogMSlcbiAgICogQHBhcmFtIF9kZXNjLndpZHRoU2VnbWVudHMgLSBUaGUgbnVtYmVyIG9mIGhvcml6b250YWwgc2VnbWVudHMgKGRlZmF1bHQ6IDEwKVxuICAgKiBAcGFyYW0gX2Rlc2MuaGVpZ2h0U2VnbWVudHMgLSBUaGUgbnVtYmVyIG9mIHZlcnRpY2FsIHNlZ21lbnRzIChkZWZhdWx0OiAxMClcbiAgICogQHBhcmFtIF9kZXNjLm1hdGVyaWFsIC0gVGhlIG1hdGVyaWFsIHRvIGFwcGx5IHRvIHRoZSBzcGhlcmVcbiAgICogQHBhcmFtIF9kZXNjLmludmVyc2VOb3JtYWwgLSBXaGV0aGVyIHRvIGludmVydCB0aGUgbm9ybWFscyAoZGVmYXVsdDogZmFsc2UpXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGdlbmVyYXRlcyB2ZXJ0ZXggcG9zaXRpb25zLCB0ZXh0dXJlIGNvb3JkaW5hdGVzLCBub3JtYWxzLCBhbmQgaW5kaWNlc1xuICAgKiBmb3IgYSBVViBzcGhlcmUgdXNpbmcgc3BoZXJpY2FsIGNvb3JkaW5hdGVzLiBUaGUgc3BoZXJlIGlzIGNlbnRlcmVkIGF0IHRoZSBvcmlnaW4uXG4gICAqXG4gICAqIElmIHRoZSByYWRpdXMgaXMgemVybyBvciBuZWFybHkgemVybywgaXQgd2lsbCBiZSBjbGFtcGVkIHRvIDAuMDAxIGZvciBzYWZldHkuXG4gICAqIEEgc21hbGwgc2hpZnQgdmFsdWUgaXMgYXBwbGllZCB0byBhdm9pZCBzaW5ndWxhcml0aWVzIGF0IHRoZSBwb2xlcy5cbiAgICpcbiAgICogVGhlIHRleHR1cmUgY29vcmRpbmF0ZXMgYXJlIG1hcHBlZCBzbyB0aGF0IHUgcmFuZ2VzIGZyb20gMCB0byAxIChsb25naXR1ZGUpXG4gICAqIGFuZCB2IHJhbmdlcyBmcm9tIDAgdG8gMSAobGF0aXR1ZGUpLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHNwaGVyZSA9IG5ldyBTcGhlcmUoKTtcbiAgICogc3BoZXJlLmdlbmVyYXRlKHtcbiAgICogICByYWRpdXM6IDIuMCxcbiAgICogICB3aWR0aFNlZ21lbnRzOiAyMCxcbiAgICogICBoZWlnaHRTZWdtZW50czogMjAsXG4gICAqICAgbWF0ZXJpYWw6IG15TWF0ZXJpYWxcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2VuZXJhdGUoX2Rlc2M6IFNwaGVyZURlc2NyaXB0b3IpIHtcbiAgICBjb25zdCBkZXNjID0ge1xuICAgICAgcmFkaXVzOiBfZGVzYy5yYWRpdXMgPz8gMSxcbiAgICAgIHdpZHRoU2VnbWVudHM6IF9kZXNjLndpZHRoU2VnbWVudHMgPz8gMTAsXG4gICAgICBoZWlnaHRTZWdtZW50czogX2Rlc2MuaGVpZ2h0U2VnbWVudHMgPz8gMTAsXG4gICAgICBtYXRlcmlhbDogX2Rlc2MubWF0ZXJpYWwsXG4gICAgICBpbnZlcnNlTm9ybWFsOiBfZGVzYy5pbnZlcnNlTm9ybWFsID8/IGZhbHNlLFxuICAgIH07XG4gICAgY29uc3QgcG9zaXRpb25zID0gW107XG4gICAgY29uc3QgdGV4Y29vcmRzID0gW107XG4gICAgY29uc3Qgbm9ybWFscyA9IFtdO1xuXG4gICAgaWYgKE1hdGguYWJzKGRlc2MucmFkaXVzKSA8IE51bWJlci5FUFNJTE9OKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKFxuICAgICAgICAnVGhlIGFyZ3VtZW50IHJhZGl1cyBpcyB6ZXJvIC8gbmVhcmx5IHplcm8uIFJuIHdpbGwgdGFrZSB0aGUgcmFkaXVzIGFzIDAuMDAxIGZvciBzYWZldHkuIENoZWNrIHlvdXIgY29kZS4nXG4gICAgICApO1xuICAgICAgZGVzYy5yYWRpdXMgPSAwLjAwMTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGlmdFZhbHVlID0gMC4wMDAwMTsgLy8gZm9yIGF2b2lkIFNpbmd1bGFyIHBvaW50XG4gICAgZm9yIChsZXQgbGF0TnVtYmVyID0gMDsgbGF0TnVtYmVyIDw9IGRlc2MuaGVpZ2h0U2VnbWVudHM7IGxhdE51bWJlcisrKSB7XG4gICAgICBjb25zdCB0aGV0YSA9IChsYXROdW1iZXIgKiBNYXRoLlBJKSAvIGRlc2MuaGVpZ2h0U2VnbWVudHMgKyBzaGlmdFZhbHVlO1xuICAgICAgY29uc3Qgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgICBjb25zdCBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcblxuICAgICAgZm9yIChsZXQgbG9uZ051bWJlciA9IDA7IGxvbmdOdW1iZXIgPD0gZGVzYy53aWR0aFNlZ21lbnRzOyBsb25nTnVtYmVyKyspIHtcbiAgICAgICAgY29uc3QgcGhpID0gKGxvbmdOdW1iZXIgKiAyICogTWF0aC5QSSkgLyBkZXNjLndpZHRoU2VnbWVudHM7XG4gICAgICAgIGNvbnN0IHNpblBoaSA9IE1hdGguc2luKHBoaSk7XG4gICAgICAgIGNvbnN0IGNvc1BoaSA9IE1hdGguY29zKHBoaSk7XG5cbiAgICAgICAgY29uc3QgeCA9IGRlc2MucmFkaXVzICogY29zUGhpICogc2luVGhldGE7XG4gICAgICAgIGNvbnN0IHkgPSBkZXNjLnJhZGl1cyAqIGNvc1RoZXRhO1xuICAgICAgICBjb25zdCB6ID0gZGVzYy5yYWRpdXMgKiBzaW5QaGkgKiBzaW5UaGV0YTtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW3gsIHksIHpdKTtcbiAgICAgICAgcG9zaXRpb25zLnB1c2goeCk7XG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKHkpO1xuICAgICAgICBwb3NpdGlvbnMucHVzaCh6KTtcbiAgICAgICAgY29uc3QgdSA9IDEgLSBsb25nTnVtYmVyIC8gZGVzYy53aWR0aFNlZ21lbnRzO1xuICAgICAgICBjb25zdCB2ID0gbGF0TnVtYmVyIC8gZGVzYy5oZWlnaHRTZWdtZW50cztcbiAgICAgICAgdGV4Y29vcmRzLnB1c2godSk7XG4gICAgICAgIHRleGNvb3Jkcy5wdXNoKHYpO1xuICAgICAgICBjb25zdCBub3JtYWwgPSBWZWN0b3IzLm5vcm1hbGl6ZShwb3NpdGlvbik7XG4gICAgICAgIG5vcm1hbHMucHVzaChkZXNjLmludmVyc2VOb3JtYWwgPyAtbm9ybWFsLnggOiBub3JtYWwueCk7XG4gICAgICAgIG5vcm1hbHMucHVzaChkZXNjLmludmVyc2VOb3JtYWwgPyAtbm9ybWFsLnkgOiBub3JtYWwueSk7XG4gICAgICAgIG5vcm1hbHMucHVzaChkZXNjLmludmVyc2VOb3JtYWwgPyAtbm9ybWFsLnogOiBub3JtYWwueik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZmlyc3QgICAgZmlyc3QrMVxuICAgIC8vICAgICstLS0tLS0tK1xuICAgIC8vICAgIHwgICAgIC8gfFxuICAgIC8vICAgIHwgICAvICAgfFxuICAgIC8vICAgIHwgLyAgICAgfFxuICAgIC8vICAgICstLS0tLS0tK1xuICAgIC8vIHNlY29uZCAgIHNlY29uZCsxXG4gICAgLy9cbiAgICBjb25zdCBpbmRpY2VzID0gW107XG4gICAgZm9yIChsZXQgbGF0TnVtYmVyID0gMDsgbGF0TnVtYmVyIDwgZGVzYy5oZWlnaHRTZWdtZW50czsgbGF0TnVtYmVyKyspIHtcbiAgICAgIGZvciAobGV0IGxvbmdOdW1iZXIgPSAwOyBsb25nTnVtYmVyIDwgZGVzYy53aWR0aFNlZ21lbnRzOyBsb25nTnVtYmVyKyspIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBsYXROdW1iZXIgKiAoZGVzYy53aWR0aFNlZ21lbnRzICsgMSkgKyBsb25nTnVtYmVyO1xuICAgICAgICBjb25zdCBzZWNvbmQgPSBmaXJzdCArIGRlc2Mud2lkdGhTZWdtZW50cyArIDE7XG5cbiAgICAgICAgaW5kaWNlcy5wdXNoKGZpcnN0ICsgMSk7XG4gICAgICAgIGluZGljZXMucHVzaChzZWNvbmQpO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmlyc3QpO1xuXG4gICAgICAgIGluZGljZXMucHVzaChmaXJzdCArIDEpO1xuICAgICAgICBpbmRpY2VzLnB1c2goc2Vjb25kICsgMSk7XG4gICAgICAgIGluZGljZXMucHVzaChzZWNvbmQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF0dHJpYnV0ZVNlbWFudGljcyA9IFtWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaLCBWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWiwgVmVydGV4QXR0cmlidXRlLlRleGNvb3JkMC5YWV07XG4gICAgY29uc3QgcHJpbWl0aXZlTW9kZSA9IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzO1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBbbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpLCBuZXcgRmxvYXQzMkFycmF5KG5vcm1hbHMpLCBuZXcgRmxvYXQzMkFycmF5KHRleGNvb3JkcyldO1xuXG4gICAgdGhpcy5jb3B5VmVydGV4RGF0YSh7XG4gICAgICBhdHRyaWJ1dGVzLFxuICAgICAgYXR0cmlidXRlU2VtYW50aWNzLFxuICAgICAgcHJpbWl0aXZlTW9kZSxcbiAgICAgIGluZGljZXM6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzKSxcbiAgICAgIG1hdGVyaWFsOiBkZXNjLm1hdGVyaWFsLFxuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYztBQUd2QixTQUFTLGNBQWM7QUF1Q2hCLElBQU0sU0FBTixjQUFxQixPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWdDakMsU0FBUyxPQUF5QjtBQTlFcEM7QUErRUksVUFBTSxPQUFPO0FBQUEsTUFDWCxTQUFRLFdBQU0sV0FBTixZQUFnQjtBQUFBLE1BQ3hCLGdCQUFlLFdBQU0sa0JBQU4sWUFBdUI7QUFBQSxNQUN0QyxpQkFBZ0IsV0FBTSxtQkFBTixZQUF3QjtBQUFBLE1BQ3hDLFVBQVUsTUFBTTtBQUFBLE1BQ2hCLGdCQUFlLFdBQU0sa0JBQU4sWUFBdUI7QUFBQSxJQUN4QztBQUNBLFVBQU0sWUFBWSxDQUFDO0FBQ25CLFVBQU0sWUFBWSxD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
