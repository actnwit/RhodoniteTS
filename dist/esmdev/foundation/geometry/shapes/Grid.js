// src/foundation/geometry/shapes/Grid.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { IShape } from "./IShape.js";
var Grid = class extends IShape {
  /**
   * Generates a 3D grid with lines based on the provided configuration
   * Creates evenly spaced grid lines on the specified planes (XY, XZ, YZ)
   *
   * @param _desc - Configuration object defining grid properties
   * @param _desc.length - Half-length of the grid from center to edge (default: 1)
   * @param _desc.division - Number of divisions between grid lines (default: 10)
   * @param _desc.isXY - Generate grid lines on XY plane (default: true)
   * @param _desc.isXZ - Generate grid lines on XZ plane (default: true)
   * @param _desc.isYZ - Generate grid lines on YZ plane (default: true)
   * @param _desc.material - Material to apply to the grid
   *
   * @example
   * ```typescript
   * const grid = new Grid();
   * grid.generate({
   *   length: 5,
   *   division: 20,
   *   isXZ: true,
   *   isXY: false,
   *   isYZ: false
   * });
   * ```
   */
  generate(_desc) {
    var _a, _b, _c, _d, _e;
    const desc = {
      length: (_a = _desc.length) != null ? _a : 1,
      division: (_b = _desc.division) != null ? _b : 10,
      isXY: (_c = _desc.isXY) != null ? _c : true,
      isXZ: (_d = _desc.isXZ) != null ? _d : true,
      isYZ: (_e = _desc.isYZ) != null ? _e : true,
      material: _desc.material
    };
    const positions = [];
    for (let i = 0; i < desc.division * 2 + 3; i++) {
      const start = -desc.length;
      const oneUnitLength = desc.length / (desc.division + 1);
      if (desc.isXZ) {
        positions.push(-desc.length, 0, start + oneUnitLength * i);
        positions.push(desc.length, 0, start + oneUnitLength * i);
        positions.push(start + oneUnitLength * i, 0, -desc.length);
        positions.push(start + oneUnitLength * i, 0, desc.length);
      }
      if (desc.isXY) {
        positions.push(-desc.length, start + oneUnitLength * i, 0);
        positions.push(desc.length, start + oneUnitLength * i, 0);
        positions.push(start + oneUnitLength * i, -desc.length, 0);
        positions.push(start + oneUnitLength * i, desc.length, 0);
      }
      if (desc.isYZ) {
        positions.push(0, -desc.length, start + oneUnitLength * i);
        positions.push(0, desc.length, start + oneUnitLength * i);
        positions.push(0, start + oneUnitLength * i, -desc.length);
        positions.push(0, start + oneUnitLength * i, desc.length);
      }
    }
    const attributes = [new Float32Array(positions)];
    const attributeSemantics = [VertexAttribute.Position.XYZ];
    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: desc == null ? void 0 : desc.material
    });
  }
};
export {
  Grid
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL0dyaWQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgU2l6ZSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IElBbnlQcmltaXRpdmVEZXNjcmlwdG9yIH0gZnJvbSAnLi4vUHJpbWl0aXZlJztcbmltcG9ydCB7IElTaGFwZSB9IGZyb20gJy4vSVNoYXBlJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgY3JlYXRpbmcgYSBncmlkIHNoYXBlXG4gKiBAaW50ZXJmYWNlIEdyaWREZXNjcmlwdG9yXG4gKiBAZXh0ZW5kcyBJQW55UHJpbWl0aXZlRGVzY3JpcHRvclxuICovXG5leHBvcnQgaW50ZXJmYWNlIEdyaWREZXNjcmlwdG9yIGV4dGVuZHMgSUFueVByaW1pdGl2ZURlc2NyaXB0b3Ige1xuICAvKiogVGhlIGxlbmd0aCBvZiBlYWNoIGF4aXMgZnJvbSBjZW50ZXIgdG8gZWRnZSAqL1xuICBsZW5ndGg/OiBTaXplO1xuICAvKiogVGhlIG51bWJlciBvZiBkaXZpc2lvbnMgYWxvbmcgZWFjaCBheGlzICovXG4gIGRpdmlzaW9uPzogU2l6ZTtcbiAgLyoqIFdoZXRoZXIgdG8gZ2VuZXJhdGUgZ3JpZCBsaW5lcyBvbiB0aGUgWFogcGxhbmUgKi9cbiAgaXNYWj86IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIHRvIGdlbmVyYXRlIGdyaWQgbGluZXMgb24gdGhlIFhZIHBsYW5lICovXG4gIGlzWFk/OiBib29sZWFuO1xuICAvKiogV2hldGhlciB0byBnZW5lcmF0ZSBncmlkIGxpbmVzIG9uIHRoZSBZWiBwbGFuZSAqL1xuICBpc1laPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIDNEIGdyaWQgc2hhcGUgZ2VuZXJhdG9yIHRoYXQgY3JlYXRlcyBsaW5lLWJhc2VkIGdyaWQgc3RydWN0dXJlc1xuICogQ2FuIGdlbmVyYXRlIGdyaWRzIG9uIFhZLCBYWiwgYW5kIFlaIHBsYW5lcyB3aXRoIGNvbmZpZ3VyYWJsZSBkaXZpc2lvbnNcbiAqIEBjbGFzcyBHcmlkXG4gKiBAZXh0ZW5kcyBJU2hhcGVcbiAqL1xuZXhwb3J0IGNsYXNzIEdyaWQgZXh0ZW5kcyBJU2hhcGUge1xuICAvKipcbiAgICogR2VuZXJhdGVzIGEgM0QgZ3JpZCB3aXRoIGxpbmVzIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBjb25maWd1cmF0aW9uXG4gICAqIENyZWF0ZXMgZXZlbmx5IHNwYWNlZCBncmlkIGxpbmVzIG9uIHRoZSBzcGVjaWZpZWQgcGxhbmVzIChYWSwgWFosIFlaKVxuICAgKlxuICAgKiBAcGFyYW0gX2Rlc2MgLSBDb25maWd1cmF0aW9uIG9iamVjdCBkZWZpbmluZyBncmlkIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIF9kZXNjLmxlbmd0aCAtIEhhbGYtbGVuZ3RoIG9mIHRoZSBncmlkIGZyb20gY2VudGVyIHRvIGVkZ2UgKGRlZmF1bHQ6IDEpXG4gICAqIEBwYXJhbSBfZGVzYy5kaXZpc2lvbiAtIE51bWJlciBvZiBkaXZpc2lvbnMgYmV0d2VlbiBncmlkIGxpbmVzIChkZWZhdWx0OiAxMClcbiAgICogQHBhcmFtIF9kZXNjLmlzWFkgLSBHZW5lcmF0ZSBncmlkIGxpbmVzIG9uIFhZIHBsYW5lIChkZWZhdWx0OiB0cnVlKVxuICAgKiBAcGFyYW0gX2Rlc2MuaXNYWiAtIEdlbmVyYXRlIGdyaWQgbGluZXMgb24gWFogcGxhbmUgKGRlZmF1bHQ6IHRydWUpXG4gICAqIEBwYXJhbSBfZGVzYy5pc1laIC0gR2VuZXJhdGUgZ3JpZCBsaW5lcyBvbiBZWiBwbGFuZSAoZGVmYXVsdDogdHJ1ZSlcbiAgICogQHBhcmFtIF9kZXNjLm1hdGVyaWFsIC0gTWF0ZXJpYWwgdG8gYXBwbHkgdG8gdGhlIGdyaWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBncmlkID0gbmV3IEdyaWQoKTtcbiAgICogZ3JpZC5nZW5lcmF0ZSh7XG4gICAqICAgbGVuZ3RoOiA1LFxuICAgKiAgIGRpdmlzaW9uOiAyMCxcbiAgICogICBpc1haOiB0cnVlLFxuICAgKiAgIGlzWFk6IGZhbHNlLFxuICAgKiAgIGlzWVo6IGZhbHNlXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBnZW5lcmF0ZShfZGVzYzogR3JpZERlc2NyaXB0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBkZXNjID0ge1xuICAgICAgbGVuZ3RoOiBfZGVzYy5sZW5ndGggPz8gMSxcbiAgICAgIGRpdmlzaW9uOiBfZGVzYy5kaXZpc2lvbiA/PyAxMCxcbiAgICAgIGlzWFk6IF9kZXNjLmlzWFkgPz8gdHJ1ZSxcbiAgICAgIGlzWFo6IF9kZXNjLmlzWFogPz8gdHJ1ZSxcbiAgICAgIGlzWVo6IF9kZXNjLmlzWVogPz8gdHJ1ZSxcbiAgICAgIG1hdGVyaWFsOiBfZGVzYy5tYXRlcmlhbCxcbiAgICB9O1xuICAgIGNvbnN0IHBvc2l0aW9uczogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2MuZGl2aXNpb24gKiAyICsgMzsgaSsrKSB7XG4gICAgICBjb25zdCBzdGFydCA9IC1kZXNjLmxlbmd0aDtcbiAgICAgIGNvbnN0IG9uZVVuaXRMZW5ndGggPSBkZXNjLmxlbmd0aCAvIChkZXNjLmRpdmlzaW9uICsgMSk7XG5cbiAgICAgIC8vIFhaIGdyaWRcbiAgICAgIGlmIChkZXNjLmlzWFopIHtcbiAgICAgICAgcG9zaXRpb25zLnB1c2goLWRlc2MubGVuZ3RoLCAwLCBzdGFydCArIG9uZVVuaXRMZW5ndGggKiBpKTtcbiAgICAgICAgcG9zaXRpb25zLnB1c2goZGVzYy5sZW5ndGgsIDAsIHN0YXJ0ICsgb25lVW5pdExlbmd0aCAqIGkpO1xuXG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKHN0YXJ0ICsgb25lVW5pdExlbmd0aCAqIGksIDAsIC1kZXNjLmxlbmd0aCk7XG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKHN0YXJ0ICsgb25lVW5pdExlbmd0aCAqIGksIDAsIGRlc2MubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gWFkgZ3JpZFxuICAgICAgaWYgKGRlc2MuaXNYWSkge1xuICAgICAgICBwb3NpdGlvbnMucHVzaCgtZGVzYy5sZW5ndGgsIHN0YXJ0ICsgb25lVW5pdExlbmd0aCAqIGksIDApO1xuICAgICAgICBwb3NpdGlvbnMucHVzaChkZXNjLmxlbmd0aCwgc3RhcnQgKyBvbmVVbml0TGVuZ3RoICogaSwgMCk7XG5cbiAgICAgICAgcG9zaXRpb25zLnB1c2goc3RhcnQgKyBvbmVVbml0TGVuZ3RoICogaSwgLWRlc2MubGVuZ3RoLCAwKTtcbiAgICAgICAgcG9zaXRpb25zLnB1c2goc3RhcnQgKyBvbmVVbml0TGVuZ3RoICogaSwgZGVzYy5sZW5ndGgsIDApO1xuICAgICAgfVxuXG4gICAgICAvLyBZWiBncmlkXG4gICAgICBpZiAoZGVzYy5pc1laKSB7XG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIC1kZXNjLmxlbmd0aCwgc3RhcnQgKyBvbmVVbml0TGVuZ3RoICogaSk7XG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKDAsIGRlc2MubGVuZ3RoLCBzdGFydCArIG9uZVVuaXRMZW5ndGggKiBpKTtcblxuICAgICAgICBwb3NpdGlvbnMucHVzaCgwLCBzdGFydCArIG9uZVVuaXRMZW5ndGggKiBpLCAtZGVzYy5sZW5ndGgpO1xuICAgICAgICBwb3NpdGlvbnMucHVzaCgwLCBzdGFydCArIG9uZVVuaXRMZW5ndGggKiBpLCBkZXNjLmxlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucyldO1xuXG4gICAgLy8gSW5kZXggQnVmZmVyXG4gICAgLy8gQ2hlY2sgU2l6ZVxuICAgIGNvbnN0IGF0dHJpYnV0ZVNlbWFudGljcyA9IFtWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaXTtcblxuICAgIHRoaXMuY29weVZlcnRleERhdGEoe1xuICAgICAgYXR0cmlidXRlcyxcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljcyxcbiAgICAgIHByaW1pdGl2ZU1vZGU6IFByaW1pdGl2ZU1vZGUuTGluZXMsXG4gICAgICBtYXRlcmlhbDogZGVzYz8ubWF0ZXJpYWwsXG4gICAgfSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUVoQyxTQUFTLGNBQWM7QUEwQmhCLElBQU0sT0FBTixjQUFtQixPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF5QnhCLFNBQVMsT0FBNkI7QUF2RC9DO0FBd0RJLFVBQU0sT0FBTztBQUFBLE1BQ1gsU0FBUSxXQUFNLFdBQU4sWUFBZ0I7QUFBQSxNQUN4QixXQUFVLFdBQU0sYUFBTixZQUFrQjtBQUFBLE1BQzVCLE9BQU0sV0FBTSxTQUFOLFlBQWM7QUFBQSxNQUNwQixPQUFNLFdBQU0sU0FBTixZQUFjO0FBQUEsTUFDcEIsT0FBTSxXQUFNLFNBQU4sWUFBYztBQUFBLE1BQ3BCLFVBQVUsTUFBTTtBQUFBLElBQ2xCO0FBQ0EsVUFBTSxZQUFzQixDQUFDO0FBQzdCLGFBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxXQUFXLElBQUksR0FBRyxLQUFLO0FBQzlDLFlBQU0sUUFBUSxDQUFDLEtBQUs7QUFDcEIsWUFBTSxnQkFBZ0IsS0FBSyxVQUFVLEtBQUssV0FBVztBQUdyRCxVQUFJLEtBQUssTUFBTTtBQUNiLGtCQUFVLEtBQUssQ0FBQyxLQUFLLFFBQVEsR0FBRyxRQUFRLGdCQUFnQixDQUFDO0FBQ3pELGtCQUFVLEtBQUssS0FBSyxRQUFRLEdBQUcsUUFBUSxnQkFBZ0IsQ0FBQztBQUV4RCxrQkFBVSxLQUFLLFFBQVEsZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLEtBQUssTUFBTTtBQUN6RCxrQkFBVSxLQUFLLFFBQVEsZ0JBQWdCLEdBQUcsR0FBRyxLQUFLLE1BQU07QUFBQSxNQUMxRDtBQUdBLFVBQUksS0FBSyxNQUFNO0FBQ2Isa0JBQVUsS0FBSyxDQUFDLEtBQUssUUFBUSxRQUFRLGdCQUFnQixHQUFHLENBQUM7QUFDekQsa0JBQVUsS0FBSyxLQUFLLFFBQVEsUUFBUSxnQkFBZ0IsR0FBRyxDQUFDO0FBRXhELGtCQUFVLEtBQUssUUFBUSxnQkFBZ0IsR0FBRyxDQUFDLEtBQUssUUFBUSxDQUFDO0FBQ3pELGtCQUFVLEtBQUssUUFBUSxnQkFBZ0IsR0FBRyxLQUFLLFFBQVEsQ0FBQztBQUFBLE1BQzFEO0FBR0EsVUFBSSxLQUFLLE1BQU07QUFDYixrQkFBVSxLQUFLLEdBQUcsQ0FBQyxLQUFLLFFBQVEsUUFBUSxnQkFBZ0IsQ0FBQztBQUN6RCxrQkFBVSxLQUFLLEdBQUcsS0FBSyxRQUFRLFFBQVEsZ0JBQWdCLENBQUM7QUFFeEQsa0JBQVUsS0FBSyxHQUFHLFFBQVEsZ0JBQWdCLEdBQUcsQ0FBQyxLQUFLLE1BQU07QUFDekQsa0JBQVUsS0FBSyxHQUFHLFFBQVEsZ0JBQWdCLEdBQUcsS0FBSyxNQUFNO0FBQUEsTUFDMUQ7QUFBQSxJQUNGO0FBRUEsVUFBTSxhQUFhLENBQUMsSUFBSSxhQUFhLFNBQVMsQ0FBQztBQUkvQyxVQUFNLHFCQUFxQixDQUFDLGdCQUFnQixTQUFTLEdBQUc7QUFFeEQsU0FBSyxlQUFlO0FBQUEsTUFDbEI7QUFBQSxNQUNBO0FBQUEsTUFDQSxlQUFlLGNBQWM7QUFBQSxNQUM3QixVQUFVLDZCQUFNO0FBQUEsSUFDbEIsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
