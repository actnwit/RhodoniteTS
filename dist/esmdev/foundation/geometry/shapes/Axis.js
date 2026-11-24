// src/foundation/geometry/shapes/Axis.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { IShape } from "./IShape.js";
var Axis = class extends IShape {
  /**
   * Generates vertex data for a 3D coordinate axis with colored lines
   * representing X (red), Y (green), and Z (blue) axes.
   *
   * @param _desc - Configuration object containing axis properties
   * @param _desc.length - The length of each axis line (defaults to 1)
   * @param _desc.material - Material to be applied to the axis
   *
   * @remarks
   * This method creates three colored lines extending from the origin:
   * - X axis: Red line from (0,0,0) to (length,0,0)
   * - Y axis: Green line from (0,0,0) to (0,length,0)
   * - Z axis: Blue line from (0,0,0) to (0,0,length)
   *
   * The generated geometry uses LINE primitive mode for rendering.
   *
   * @public
   */
  generate(_desc) {
    var _a;
    const desc = {
      length: (_a = _desc.length) != null ? _a : 1,
      material: _desc.material
    };
    const positions = [
      // X axis
      0,
      0,
      0,
      desc.length,
      0,
      0,
      // Y axis
      0,
      0,
      0,
      0,
      desc.length,
      0,
      // Z axis
      0,
      0,
      0,
      0,
      0,
      desc.length
    ];
    const colors = [
      // X axis as Red
      1,
      0,
      0,
      1,
      0,
      0,
      // Y axis as Green
      0,
      1,
      0,
      0,
      1,
      0,
      // Z axis as Blue
      0,
      0,
      1,
      0,
      0,
      1
    ];
    const attributes = [new Float32Array(positions), new Float32Array(colors)];
    const attributeSemantics = [VertexAttribute.Position.XYZ, VertexAttribute.Color0.XYZ];
    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: desc.material
    });
  }
};
export {
  Axis
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL0F4aXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgU2l6ZSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IElBbnlQcmltaXRpdmVEZXNjcmlwdG9yIH0gZnJvbSAnLi4vUHJpbWl0aXZlJztcbmltcG9ydCB7IElTaGFwZSB9IGZyb20gJy4uL3NoYXBlcy9JU2hhcGUnO1xuXG4vKipcbiAqIERlc2NyaXB0b3IgaW50ZXJmYWNlIGZvciBjcmVhdGluZyBhbiBBeGlzIHNoYXBlXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXhpc0Rlc2NyaXB0b3IgZXh0ZW5kcyBJQW55UHJpbWl0aXZlRGVzY3JpcHRvciB7XG4gIC8qKlxuICAgKiBUaGUgbGVuZ3RoIG9mIGVhY2ggYXhpcyBsaW5lXG4gICAqIEBkZWZhdWx0VmFsdWUgMVxuICAgKi9cbiAgbGVuZ3RoPzogU2l6ZTtcbn1cblxuLyoqXG4gKiBBIDNEIGNvb3JkaW5hdGUgYXhpcyBzaGFwZSB0aGF0IGRpc3BsYXlzIFgsIFksIGFuZCBaIGF4ZXMgd2l0aCBkaWZmZXJlbnQgY29sb3JzLlxuICogVGhlIFggYXhpcyBpcyByZW5kZXJlZCBpbiByZWQsIFkgYXhpcyBpbiBncmVlbiwgYW5kIFogYXhpcyBpbiBibHVlLlxuICogRWFjaCBheGlzIGV4dGVuZHMgZnJvbSB0aGUgb3JpZ2luICgwLDAsMCkgdG8gdGhlIHNwZWNpZmllZCBsZW5ndGguXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBjbGFzcyBBeGlzIGV4dGVuZHMgSVNoYXBlIHtcbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB2ZXJ0ZXggZGF0YSBmb3IgYSAzRCBjb29yZGluYXRlIGF4aXMgd2l0aCBjb2xvcmVkIGxpbmVzXG4gICAqIHJlcHJlc2VudGluZyBYIChyZWQpLCBZIChncmVlbiksIGFuZCBaIChibHVlKSBheGVzLlxuICAgKlxuICAgKiBAcGFyYW0gX2Rlc2MgLSBDb25maWd1cmF0aW9uIG9iamVjdCBjb250YWluaW5nIGF4aXMgcHJvcGVydGllc1xuICAgKiBAcGFyYW0gX2Rlc2MubGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiBlYWNoIGF4aXMgbGluZSAoZGVmYXVsdHMgdG8gMSlcbiAgICogQHBhcmFtIF9kZXNjLm1hdGVyaWFsIC0gTWF0ZXJpYWwgdG8gYmUgYXBwbGllZCB0byB0aGUgYXhpc1xuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIHRocmVlIGNvbG9yZWQgbGluZXMgZXh0ZW5kaW5nIGZyb20gdGhlIG9yaWdpbjpcbiAgICogLSBYIGF4aXM6IFJlZCBsaW5lIGZyb20gKDAsMCwwKSB0byAobGVuZ3RoLDAsMClcbiAgICogLSBZIGF4aXM6IEdyZWVuIGxpbmUgZnJvbSAoMCwwLDApIHRvICgwLGxlbmd0aCwwKVxuICAgKiAtIFogYXhpczogQmx1ZSBsaW5lIGZyb20gKDAsMCwwKSB0byAoMCwwLGxlbmd0aClcbiAgICpcbiAgICogVGhlIGdlbmVyYXRlZCBnZW9tZXRyeSB1c2VzIExJTkUgcHJpbWl0aXZlIG1vZGUgZm9yIHJlbmRlcmluZy5cbiAgICpcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgcHVibGljIGdlbmVyYXRlKF9kZXNjOiBBeGlzRGVzY3JpcHRvcik6IHZvaWQge1xuICAgIGNvbnN0IGRlc2MgPSB7XG4gICAgICBsZW5ndGg6IF9kZXNjLmxlbmd0aCA/PyAxLFxuICAgICAgbWF0ZXJpYWw6IF9kZXNjLm1hdGVyaWFsLFxuICAgIH07XG5cbiAgICAvLyBwcmV0dGllci1pZ25vcmVcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBbXG4gICAgICAvLyBYIGF4aXNcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIGRlc2MubGVuZ3RoLFxuICAgICAgMCxcbiAgICAgIDAsXG5cbiAgICAgIC8vIFkgYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIGRlc2MubGVuZ3RoLFxuICAgICAgMCxcblxuICAgICAgLy8gWiBheGlzXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIGRlc2MubGVuZ3RoLFxuICAgIF07XG5cbiAgICAvLyBwcmV0dGllci1pZ25vcmVcbiAgICBjb25zdCBjb2xvcnMgPSBbXG4gICAgICAvLyBYIGF4aXMgYXMgUmVkXG4gICAgICAxLCAwLCAwLCAxLCAwLCAwLFxuXG4gICAgICAvLyBZIGF4aXMgYXMgR3JlZW5cbiAgICAgIDAsIDEsIDAsIDAsIDEsIDAsXG5cbiAgICAgIC8vIFogYXhpcyBhcyBCbHVlXG4gICAgICAwLCAwLCAxLCAwLCAwLCAxLFxuICAgIF07XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gW25ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zKSwgbmV3IEZsb2F0MzJBcnJheShjb2xvcnMpXTtcblxuICAgIC8vIENoZWNrIFNpemVcbiAgICBjb25zdCBhdHRyaWJ1dGVTZW1hbnRpY3MgPSBbVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWiwgVmVydGV4QXR0cmlidXRlLkNvbG9yMC5YWVpdO1xuXG4gICAgdGhpcy5jb3B5VmVydGV4RGF0YSh7XG4gICAgICBhdHRyaWJ1dGVzLFxuICAgICAgYXR0cmlidXRlU2VtYW50aWNzLFxuICAgICAgcHJpbWl0aXZlTW9kZTogUHJpbWl0aXZlTW9kZS5MaW5lcyxcbiAgICAgIG1hdGVyaWFsOiBkZXNjLm1hdGVyaWFsLFxuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFFaEMsU0FBUyxjQUFjO0FBb0JoQixJQUFNLE9BQU4sY0FBbUIsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbUJ4QixTQUFTLE9BQTZCO0FBM0MvQztBQTRDSSxVQUFNLE9BQU87QUFBQSxNQUNYLFNBQVEsV0FBTSxXQUFOLFlBQWdCO0FBQUEsTUFDeEIsVUFBVSxNQUFNO0FBQUEsSUFDbEI7QUFHQSxVQUFNLFlBQVk7QUFBQTtBQUFBLE1BRWhCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUs7QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFHQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsS0FBSztBQUFBLE1BQ0w7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxLQUFLO0FBQUEsSUFDUDtBQUdBLFVBQU0sU0FBUztBQUFBO0FBQUEsTUFFYjtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUE7QUFBQSxNQUdmO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQTtBQUFBLE1BR2Y7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLElBQ2pCO0FBRUEsVUFBTSxhQUFhLENBQUMsSUFBSSxhQUFhLFNBQVMsR0FBRyxJQUFJLGFBQWEsTUFBTSxDQUFDO0FBR3pFLFVBQU0scUJBQXFCLENBQUMsZ0JBQWdCLFNBQVMsS0FBSyxnQkFBZ0IsT0FBTyxHQUFHO0FBRXBGLFNBQUssZUFBZTtBQUFBLE1BQ2xCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsZUFBZSxjQUFjO0FBQUEsTUFDN0IsVUFBVSxLQUFLO0FBQUEsSUFDakIsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
