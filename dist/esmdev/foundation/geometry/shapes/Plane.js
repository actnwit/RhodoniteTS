// src/foundation/geometry/shapes/Plane.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { IShape } from "./IShape.js";
var Plane = class extends IShape {
  /**
   * Generates a plane geometry with the specified parameters
   *
   * Creates a rectangular plane mesh with configurable width, height, and tessellation.
   * The plane is generated in the XZ plane with Y=0, centered at the origin.
   * Supports texture coordinate generation with optional UV repetition and Y-axis flipping.
   *
   * @param _desc - Configuration object containing plane generation parameters
   * @param _desc.width - The width of the plane along the X-axis (default: 1)
   * @param _desc.height - The height of the plane along the Z-axis (default: 1)
   * @param _desc.uSpan - Number of subdivisions along the U(X)-axis (default: 1)
   * @param _desc.vSpan - Number of subdivisions along the V(Z)-axis (default: 1)
   * @param _desc.isUVRepeat - Whether to repeat texture coordinates instead of normalizing (default: false)
   * @param _desc.flipTextureCoordinateY - Whether to flip texture coordinates along the V-axis (default: false)
   * @param _desc.material - Optional material to assign to the generated geometry
   *
   * @returns void
   *
   * @example
   * ```typescript
   * const plane = new Plane();
   * plane.generate({
   *   width: 2,
   *   height: 2,
   *   uSpan: 4,
   *   vSpan: 4,
   *   isUVRepeat: false,
   *   flipTextureCoordinateY: true
   * });
   * ```
   */
  generate(_desc) {
    var _a, _b, _c, _d, _e, _f;
    const desc = {
      width: (_a = _desc.width) != null ? _a : 1,
      height: (_b = _desc.height) != null ? _b : 1,
      uSpan: (_c = _desc.uSpan) != null ? _c : 1,
      vSpan: (_d = _desc.vSpan) != null ? _d : 1,
      isUVRepeat: (_e = _desc.isUVRepeat) != null ? _e : false,
      flipTextureCoordinateY: (_f = _desc.flipTextureCoordinateY) != null ? _f : false,
      material: _desc.material
    };
    const positions = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      for (let j = 0; j <= desc.uSpan; j++) {
        positions.push((j / desc.uSpan - 1 / 2) * desc.width);
        positions.push(0);
        positions.push((i / desc.vSpan - 1 / 2) * desc.height);
      }
    }
    const indices = [];
    for (let i = 0; i < desc.vSpan; i++) {
      let degenerate_left_index = 0;
      let degenerate_right_index = 0;
      for (let j = 0; j <= desc.uSpan; j++) {
        indices.push(i * (desc.uSpan + 1) + j);
        indices.push((i + 1) * (desc.uSpan + 1) + j);
        if (j === 0) {
          degenerate_left_index = (i + 1) * (desc.uSpan + 1) + j;
        } else if (j === desc.uSpan) {
          degenerate_right_index = (i + 1) * (desc.uSpan + 1) + j;
        }
      }
      indices.push(degenerate_right_index);
      indices.push(degenerate_left_index);
    }
    const normals = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      for (let j = 0; j <= desc.uSpan; j++) {
        normals.push(0);
        normals.push(1);
        normals.push(0);
      }
    }
    const texcoords = [];
    for (let i = 0; i <= desc.vSpan; i++) {
      const i_ = desc.flipTextureCoordinateY ? i : desc.vSpan - i;
      for (let j = 0; j <= desc.uSpan; j++) {
        if (desc.isUVRepeat) {
          texcoords.push(j);
          texcoords.push(i_);
        } else {
          texcoords.push(j / desc.uSpan);
          texcoords.push(i_ / desc.vSpan);
        }
      }
    }
    const attributeSemantics = [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY];
    const primitiveMode = PrimitiveMode.TriangleStrip;
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];
    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode,
      indices: new Uint16Array(indices),
      material: desc == null ? void 0 : desc.material
    });
  }
};
export {
  Plane
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL1BsYW5lLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IFNpemUgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBQcmltaXRpdmVNb2RlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJpbWl0aXZlTW9kZSc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBQaHlzaWNzUHJvcGVydHkgfSBmcm9tICcuLi8uLi9waHlzaWNzL1BoeXNpY3NQcm9wZXJ0eSc7XG5pbXBvcnQgdHlwZSB7IElBbnlQcmltaXRpdmVEZXNjcmlwdG9yIH0gZnJvbSAnLi4vUHJpbWl0aXZlJztcbmltcG9ydCB7IElTaGFwZSB9IGZyb20gJy4vSVNoYXBlJztcblxuLyoqXG4gKiBJbnRlcmZhY2UgZGVzY3JpYmluZyB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciBjcmVhdGluZyBhIHBsYW5lIGdlb21ldHJ5XG4gKiBAaW50ZXJmYWNlIFBsYW5lRGVzY3JpcHRvclxuICogQGV4dGVuZHMgSUFueVByaW1pdGl2ZURlc2NyaXB0b3JcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQbGFuZURlc2NyaXB0b3IgZXh0ZW5kcyBJQW55UHJpbWl0aXZlRGVzY3JpcHRvciB7XG4gIC8qKiB0aGUgbGVuZ3RoIG9mIFUoWCktYXhpcyBkaXJlY3Rpb24gKi9cbiAgd2lkdGg/OiBTaXplO1xuICAvKiogdGhlIGxlbmd0aCBvZiBWKFkpLWF4aXMgZGlyZWN0aW9uICovXG4gIGhlaWdodD86IFNpemU7XG4gIC8qKiBudW1iZXIgb2Ygc3BhbnMgaW4gVShYKS1heGlzIGRpcmVjdGlvbiAqL1xuICB1U3Bhbj86IFNpemU7XG4gIC8qKiBudW1iZXIgb2Ygc3BhbnMgaW4gVihZKS1heGlzIGRpcmVjdGlvbiAqL1xuICB2U3Bhbj86IFNpemU7XG4gIC8qKiBkcmF3IHVTcGFuIHRpbWVzIHZTcGFuIG51bWJlciBvZiB0ZXh0dXJlcyAqL1xuICBpc1VWUmVwZWF0PzogYm9vbGVhbjtcbiAgLyoqIGRyYXcgdGV4dHVyZXMgYnkgZmxpcHBpbmcgb24gdGhlIFYoWSktYXhpcyAqL1xuICBmbGlwVGV4dHVyZUNvb3JkaW5hdGVZPzogYm9vbGVhbjtcbiAgcGh5c2ljcz86IFBoeXNpY3NQcm9wZXJ0eTtcbn1cblxuLyoqXG4gKiBBIGNsYXNzIGZvciBnZW5lcmF0aW5nIHBsYW5lIGdlb21ldHJ5IHdpdGggY3VzdG9taXphYmxlIGRpbWVuc2lvbnMgYW5kIHRlc3NlbGxhdGlvblxuICpcbiAqIFRoZSBQbGFuZSBjbGFzcyBjcmVhdGVzIGEgcmVjdGFuZ3VsYXIgbWVzaCB0aGF0IGxpZXMgaW4gdGhlIFhaIHBsYW5lIChZPTApIGJ5IGRlZmF1bHQuXG4gKiBJdCBzdXBwb3J0cyB2YXJpb3VzIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBpbmNsdWRpbmcgc2l6ZSwgc3ViZGl2aXNpb24sIGFuZCB0ZXh0dXJlIG1hcHBpbmcuXG4gKlxuICogQGNsYXNzIFBsYW5lXG4gKiBAZXh0ZW5kcyBJU2hhcGVcbiAqL1xuZXhwb3J0IGNsYXNzIFBsYW5lIGV4dGVuZHMgSVNoYXBlIHtcbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHBsYW5lIGdlb21ldHJ5IHdpdGggdGhlIHNwZWNpZmllZCBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIENyZWF0ZXMgYSByZWN0YW5ndWxhciBwbGFuZSBtZXNoIHdpdGggY29uZmlndXJhYmxlIHdpZHRoLCBoZWlnaHQsIGFuZCB0ZXNzZWxsYXRpb24uXG4gICAqIFRoZSBwbGFuZSBpcyBnZW5lcmF0ZWQgaW4gdGhlIFhaIHBsYW5lIHdpdGggWT0wLCBjZW50ZXJlZCBhdCB0aGUgb3JpZ2luLlxuICAgKiBTdXBwb3J0cyB0ZXh0dXJlIGNvb3JkaW5hdGUgZ2VuZXJhdGlvbiB3aXRoIG9wdGlvbmFsIFVWIHJlcGV0aXRpb24gYW5kIFktYXhpcyBmbGlwcGluZy5cbiAgICpcbiAgICogQHBhcmFtIF9kZXNjIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyBwbGFuZSBnZW5lcmF0aW9uIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIF9kZXNjLndpZHRoIC0gVGhlIHdpZHRoIG9mIHRoZSBwbGFuZSBhbG9uZyB0aGUgWC1heGlzIChkZWZhdWx0OiAxKVxuICAgKiBAcGFyYW0gX2Rlc2MuaGVpZ2h0IC0gVGhlIGhlaWdodCBvZiB0aGUgcGxhbmUgYWxvbmcgdGhlIFotYXhpcyAoZGVmYXVsdDogMSlcbiAgICogQHBhcmFtIF9kZXNjLnVTcGFuIC0gTnVtYmVyIG9mIHN1YmRpdmlzaW9ucyBhbG9uZyB0aGUgVShYKS1heGlzIChkZWZhdWx0OiAxKVxuICAgKiBAcGFyYW0gX2Rlc2MudlNwYW4gLSBOdW1iZXIgb2Ygc3ViZGl2aXNpb25zIGFsb25nIHRoZSBWKFopLWF4aXMgKGRlZmF1bHQ6IDEpXG4gICAqIEBwYXJhbSBfZGVzYy5pc1VWUmVwZWF0IC0gV2hldGhlciB0byByZXBlYXQgdGV4dHVyZSBjb29yZGluYXRlcyBpbnN0ZWFkIG9mIG5vcm1hbGl6aW5nIChkZWZhdWx0OiBmYWxzZSlcbiAgICogQHBhcmFtIF9kZXNjLmZsaXBUZXh0dXJlQ29vcmRpbmF0ZVkgLSBXaGV0aGVyIHRvIGZsaXAgdGV4dHVyZSBjb29yZGluYXRlcyBhbG9uZyB0aGUgVi1heGlzIChkZWZhdWx0OiBmYWxzZSlcbiAgICogQHBhcmFtIF9kZXNjLm1hdGVyaWFsIC0gT3B0aW9uYWwgbWF0ZXJpYWwgdG8gYXNzaWduIHRvIHRoZSBnZW5lcmF0ZWQgZ2VvbWV0cnlcbiAgICpcbiAgICogQHJldHVybnMgdm9pZFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHBsYW5lID0gbmV3IFBsYW5lKCk7XG4gICAqIHBsYW5lLmdlbmVyYXRlKHtcbiAgICogICB3aWR0aDogMixcbiAgICogICBoZWlnaHQ6IDIsXG4gICAqICAgdVNwYW46IDQsXG4gICAqICAgdlNwYW46IDQsXG4gICAqICAgaXNVVlJlcGVhdDogZmFsc2UsXG4gICAqICAgZmxpcFRleHR1cmVDb29yZGluYXRlWTogdHJ1ZVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgZ2VuZXJhdGUoX2Rlc2M6IFBsYW5lRGVzY3JpcHRvcik6IHZvaWQge1xuICAgIGNvbnN0IGRlc2MgPSB7XG4gICAgICB3aWR0aDogX2Rlc2Mud2lkdGggPz8gMSxcbiAgICAgIGhlaWdodDogX2Rlc2MuaGVpZ2h0ID8/IDEsXG4gICAgICB1U3BhbjogX2Rlc2MudVNwYW4gPz8gMSxcbiAgICAgIHZTcGFuOiBfZGVzYy52U3BhbiA/PyAxLFxuICAgICAgaXNVVlJlcGVhdDogX2Rlc2MuaXNVVlJlcGVhdCA/PyBmYWxzZSxcbiAgICAgIGZsaXBUZXh0dXJlQ29vcmRpbmF0ZVk6IF9kZXNjLmZsaXBUZXh0dXJlQ29vcmRpbmF0ZVkgPz8gZmFsc2UsXG4gICAgICBtYXRlcmlhbDogX2Rlc2MubWF0ZXJpYWwsXG4gICAgfTtcblxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gZGVzYy52U3BhbjsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBkZXNjLnVTcGFuOyBqKyspIHtcbiAgICAgICAgcG9zaXRpb25zLnB1c2goKGogLyBkZXNjLnVTcGFuIC0gMSAvIDIpICogZGVzYy53aWR0aCk7XG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKDApO1xuICAgICAgICBwb3NpdGlvbnMucHVzaCgoaSAvIGRlc2MudlNwYW4gLSAxIC8gMikgKiBkZXNjLmhlaWdodCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW5kaWNlcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzYy52U3BhbjsgaSsrKSB7XG4gICAgICBsZXQgZGVnZW5lcmF0ZV9sZWZ0X2luZGV4ID0gMDtcbiAgICAgIGxldCBkZWdlbmVyYXRlX3JpZ2h0X2luZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGRlc2MudVNwYW47IGorKykge1xuICAgICAgICBpbmRpY2VzLnB1c2goaSAqIChkZXNjLnVTcGFuICsgMSkgKyBqKTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKChpICsgMSkgKiAoZGVzYy51U3BhbiArIDEpICsgaik7XG4gICAgICAgIGlmIChqID09PSAwKSB7XG4gICAgICAgICAgZGVnZW5lcmF0ZV9sZWZ0X2luZGV4ID0gKGkgKyAxKSAqIChkZXNjLnVTcGFuICsgMSkgKyBqO1xuICAgICAgICB9IGVsc2UgaWYgKGogPT09IGRlc2MudVNwYW4pIHtcbiAgICAgICAgICBkZWdlbmVyYXRlX3JpZ2h0X2luZGV4ID0gKGkgKyAxKSAqIChkZXNjLnVTcGFuICsgMSkgKyBqO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpbmRpY2VzLnB1c2goZGVnZW5lcmF0ZV9yaWdodF9pbmRleCk7XG4gICAgICBpbmRpY2VzLnB1c2goZGVnZW5lcmF0ZV9sZWZ0X2luZGV4KTtcbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gZGVzYy52U3BhbjsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBkZXNjLnVTcGFuOyBqKyspIHtcbiAgICAgICAgbm9ybWFscy5wdXNoKDApO1xuICAgICAgICBub3JtYWxzLnB1c2goMSk7XG4gICAgICAgIG5vcm1hbHMucHVzaCgwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0ZXhjb29yZHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBkZXNjLnZTcGFuOyBpKyspIHtcbiAgICAgIGNvbnN0IGlfID0gZGVzYy5mbGlwVGV4dHVyZUNvb3JkaW5hdGVZID8gaSA6IGRlc2MudlNwYW4gLSBpO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBkZXNjLnVTcGFuOyBqKyspIHtcbiAgICAgICAgaWYgKGRlc2MuaXNVVlJlcGVhdCkge1xuICAgICAgICAgIHRleGNvb3Jkcy5wdXNoKGopO1xuICAgICAgICAgIHRleGNvb3Jkcy5wdXNoKGlfKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0ZXhjb29yZHMucHVzaChqIC8gZGVzYy51U3Bhbik7XG4gICAgICAgICAgdGV4Y29vcmRzLnB1c2goaV8gLyBkZXNjLnZTcGFuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIFNpemVcbiAgICBjb25zdCBhdHRyaWJ1dGVTZW1hbnRpY3MgPSBbVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWiwgVmVydGV4QXR0cmlidXRlLk5vcm1hbC5YWVosIFZlcnRleEF0dHJpYnV0ZS5UZXhjb29yZDAuWFldO1xuICAgIGNvbnN0IHByaW1pdGl2ZU1vZGUgPSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlU3RyaXA7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucyksIG5ldyBGbG9hdDMyQXJyYXkobm9ybWFscyksIG5ldyBGbG9hdDMyQXJyYXkodGV4Y29vcmRzKV07XG5cbiAgICB0aGlzLmNvcHlWZXJ0ZXhEYXRhKHtcbiAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICBhdHRyaWJ1dGVTZW1hbnRpY3MsXG4gICAgICBwcmltaXRpdmVNb2RlLFxuICAgICAgaW5kaWNlczogbmV3IFVpbnQxNkFycmF5KGluZGljZXMpLFxuICAgICAgbWF0ZXJpYWw6IGRlc2M/Lm1hdGVyaWFsLFxuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFHaEMsU0FBUyxjQUFjO0FBZ0NoQixJQUFNLFFBQU4sY0FBb0IsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFB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
