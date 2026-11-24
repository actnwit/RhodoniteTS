// src/foundation/geometry/shapes/Cone.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { IShape } from "./IShape.js";
var Cone = class extends IShape {
  /**
   * Generates vertex buffers for a cone shape.
   * @param _desc - Cone descriptor with geometry options.
   */
  generate(_desc) {
    var _a, _b, _c, _d;
    const desc = {
      radius: (_a = _desc.radius) != null ? _a : 0.4,
      height: (_b = _desc.height) != null ? _b : 1,
      radialSegments: Math.max(3, (_c = _desc.radialSegments) != null ? _c : 12),
      includeBase: (_d = _desc.includeBase) != null ? _d : true,
      material: _desc.material
    };
    const positions = [];
    const normals = [];
    const texcoords = [];
    const indices = [];
    const slope = desc.radius / desc.height;
    for (let i = 0; i < desc.radialSegments; i++) {
      const theta = i / desc.radialSegments * Math.PI * 2;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const x = desc.radius * cosTheta;
      const z = desc.radius * sinTheta;
      positions.push(x, 0, z);
      const len = Math.hypot(cosTheta, slope, sinTheta);
      normals.push(cosTheta / len, slope / len, sinTheta / len);
      texcoords.push(i / desc.radialSegments, 0);
    }
    const tipIndex = positions.length / 3;
    positions.push(0, desc.height, 0);
    normals.push(0, 1, 0);
    texcoords.push(0.5, 1);
    for (let i = 0; i < desc.radialSegments; i++) {
      const curr = i;
      const next = (i + 1) % desc.radialSegments;
      indices.push(curr, next, tipIndex);
    }
    if (desc.includeBase) {
      const baseCenterIndex = positions.length / 3;
      positions.push(0, 0, 0);
      normals.push(0, -1, 0);
      texcoords.push(0.5, 0.5);
      const baseStartIndex = positions.length / 3;
      for (let i = 0; i < desc.radialSegments; i++) {
        const theta = i / desc.radialSegments * Math.PI * 2;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        const x = desc.radius * cosTheta;
        const z = desc.radius * sinTheta;
        positions.push(x, 0, z);
        normals.push(0, -1, 0);
        texcoords.push(cosTheta * 0.5 + 0.5, sinTheta * 0.5 + 0.5);
      }
      for (let i = 0; i < desc.radialSegments; i++) {
        const curr = baseStartIndex + i;
        const next = baseStartIndex + (i + 1) % desc.radialSegments;
        indices.push(baseCenterIndex, next, curr);
      }
    }
    this.copyVertexData({
      attributes: [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)],
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY],
      primitiveMode: PrimitiveMode.Triangles,
      indices: new Uint16Array(indices),
      material: desc.material
    });
  }
};
export {
  Cone
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL0NvbmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ291bnQgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBQcmltaXRpdmVNb2RlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJpbWl0aXZlTW9kZSc7XG5pbXBvcnQgeyBWZXJ0ZXhBdHRyaWJ1dGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBQaHlzaWNzUHJvcGVydHkgfSBmcm9tICcuLi8uLi9waHlzaWNzL1BoeXNpY3NQcm9wZXJ0eSc7XG5pbXBvcnQgdHlwZSB7IElBbnlQcmltaXRpdmVEZXNjcmlwdG9yIH0gZnJvbSAnLi4vUHJpbWl0aXZlJztcbmltcG9ydCB7IElTaGFwZSB9IGZyb20gJy4vSVNoYXBlJztcblxuLyoqXG4gKiBEZXNjcmlwdG9yIGZvciBnZW5lcmF0aW5nIGEgY29uZSBwcmltaXRpdmUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29uZURlc2NyaXB0b3IgZXh0ZW5kcyBJQW55UHJpbWl0aXZlRGVzY3JpcHRvciB7XG4gIC8qKlxuICAgKiBSYWRpdXMgb2YgdGhlIGNvbmUgYmFzZS5cbiAgICogQGRlZmF1bHRWYWx1ZSAwLjFcbiAgICovXG4gIHJhZGl1cz86IG51bWJlcjtcbiAgLyoqXG4gICAqIEhlaWdodCBvZiB0aGUgY29uZSBtZWFzdXJlZCBhbG9uZyB0aGUgK1kgYXhpcy5cbiAgICogQGRlZmF1bHRWYWx1ZSAwLjI1XG4gICAqL1xuICBoZWlnaHQ/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcmFkaWFsIHNlZ21lbnRzIHRoYXQgZm9ybSB0aGUgY29uZSBjaXJjdW1mZXJlbmNlLlxuICAgKiBAZGVmYXVsdFZhbHVlIDEyXG4gICAqL1xuICByYWRpYWxTZWdtZW50cz86IENvdW50O1xuICAvKipcbiAgICogV2hldGhlciB0byBnZW5lcmF0ZSBhIGJhc2UgZGlzayB0aGF0IGNhcHMgdGhlIGNvbmUuXG4gICAqIEBkZWZhdWx0VmFsdWUgdHJ1ZVxuICAgKi9cbiAgaW5jbHVkZUJhc2U/OiBib29sZWFuO1xuICBwaHlzaWNzPzogUGh5c2ljc1Byb3BlcnR5O1xufVxuXG4vKipcbiAqIENvbmUgcHJpbWl0aXZlIGFsaWduZWQgYWxvbmcgdGhlICtZIGF4aXMgKGJhc2Ugb24gdGhlIFhaIHBsYW5lLCB0aXAgYWxvbmcgK1kpLlxuICovXG5leHBvcnQgY2xhc3MgQ29uZSBleHRlbmRzIElTaGFwZSB7XG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdmVydGV4IGJ1ZmZlcnMgZm9yIGEgY29uZSBzaGFwZS5cbiAgICogQHBhcmFtIF9kZXNjIC0gQ29uZSBkZXNjcmlwdG9yIHdpdGggZ2VvbWV0cnkgb3B0aW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZW5lcmF0ZShfZGVzYzogQ29uZURlc2NyaXB0b3IpOiB2b2lkIHtcbiAgICBjb25zdCBkZXNjID0ge1xuICAgICAgcmFkaXVzOiBfZGVzYy5yYWRpdXMgPz8gMC40LFxuICAgICAgaGVpZ2h0OiBfZGVzYy5oZWlnaHQgPz8gMSxcbiAgICAgIHJhZGlhbFNlZ21lbnRzOiBNYXRoLm1heCgzLCBfZGVzYy5yYWRpYWxTZWdtZW50cyA/PyAxMiksXG4gICAgICBpbmNsdWRlQmFzZTogX2Rlc2MuaW5jbHVkZUJhc2UgPz8gdHJ1ZSxcbiAgICAgIG1hdGVyaWFsOiBfZGVzYy5tYXRlcmlhbCxcbiAgICB9O1xuXG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IG5vcm1hbHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgdGV4Y29vcmRzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGluZGljZXM6IG51bWJlcltdID0gW107XG5cbiAgICBjb25zdCBzbG9wZSA9IGRlc2MucmFkaXVzIC8gZGVzYy5oZWlnaHQ7XG5cbiAgICAvLyBTaWRlIHZlcnRpY2VzIChiYXNlIHJpbmcpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjLnJhZGlhbFNlZ21lbnRzOyBpKyspIHtcbiAgICAgIGNvbnN0IHRoZXRhID0gKGkgLyBkZXNjLnJhZGlhbFNlZ21lbnRzKSAqIE1hdGguUEkgKiAyO1xuICAgICAgY29uc3QgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgICBjb25zdCBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcbiAgICAgIGNvbnN0IHggPSBkZXNjLnJhZGl1cyAqIGNvc1RoZXRhO1xuICAgICAgY29uc3QgeiA9IGRlc2MucmFkaXVzICogc2luVGhldGE7XG4gICAgICBwb3NpdGlvbnMucHVzaCh4LCAwLCB6KTtcbiAgICAgIGNvbnN0IGxlbiA9IE1hdGguaHlwb3QoY29zVGhldGEsIHNsb3BlLCBzaW5UaGV0YSk7XG4gICAgICBub3JtYWxzLnB1c2goY29zVGhldGEgLyBsZW4sIHNsb3BlIC8gbGVuLCBzaW5UaGV0YSAvIGxlbik7XG4gICAgICB0ZXhjb29yZHMucHVzaChpIC8gZGVzYy5yYWRpYWxTZWdtZW50cywgMCk7XG4gICAgfVxuXG4gICAgLy8gVGlwIHZlcnRleFxuICAgIGNvbnN0IHRpcEluZGV4ID0gcG9zaXRpb25zLmxlbmd0aCAvIDM7XG4gICAgcG9zaXRpb25zLnB1c2goMCwgZGVzYy5oZWlnaHQsIDApO1xuICAgIG5vcm1hbHMucHVzaCgwLCAxLCAwKTtcbiAgICB0ZXhjb29yZHMucHVzaCgwLjUsIDEpO1xuXG4gICAgLy8gU2lkZSBpbmRpY2VzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjLnJhZGlhbFNlZ21lbnRzOyBpKyspIHtcbiAgICAgIGNvbnN0IGN1cnIgPSBpO1xuICAgICAgY29uc3QgbmV4dCA9IChpICsgMSkgJSBkZXNjLnJhZGlhbFNlZ21lbnRzO1xuICAgICAgaW5kaWNlcy5wdXNoKGN1cnIsIG5leHQsIHRpcEluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAoZGVzYy5pbmNsdWRlQmFzZSkge1xuICAgICAgY29uc3QgYmFzZUNlbnRlckluZGV4ID0gcG9zaXRpb25zLmxlbmd0aCAvIDM7XG4gICAgICBwb3NpdGlvbnMucHVzaCgwLCAwLCAwKTtcbiAgICAgIG5vcm1hbHMucHVzaCgwLCAtMSwgMCk7XG4gICAgICB0ZXhjb29yZHMucHVzaCgwLjUsIDAuNSk7XG5cbiAgICAgIGNvbnN0IGJhc2VTdGFydEluZGV4ID0gcG9zaXRpb25zLmxlbmd0aCAvIDM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2MucmFkaWFsU2VnbWVudHM7IGkrKykge1xuICAgICAgICBjb25zdCB0aGV0YSA9IChpIC8gZGVzYy5yYWRpYWxTZWdtZW50cykgKiBNYXRoLlBJICogMjtcbiAgICAgICAgY29uc3QgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgICAgIGNvbnN0IHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuICAgICAgICBjb25zdCB4ID0gZGVzYy5yYWRpdXMgKiBjb3NUaGV0YTtcbiAgICAgICAgY29uc3QgeiA9IGRlc2MucmFkaXVzICogc2luVGhldGE7XG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKHgsIDAsIHopO1xuICAgICAgICBub3JtYWxzLnB1c2goMCwgLTEsIDApO1xuICAgICAgICB0ZXhjb29yZHMucHVzaChjb3NUaGV0YSAqIDAuNSArIDAuNSwgc2luVGhldGEgKiAwLjUgKyAwLjUpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlc2MucmFkaWFsU2VnbWVudHM7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJyID0gYmFzZVN0YXJ0SW5kZXggKyBpO1xuICAgICAgICBjb25zdCBuZXh0ID0gYmFzZVN0YXJ0SW5kZXggKyAoKGkgKyAxKSAlIGRlc2MucmFkaWFsU2VnbWVudHMpO1xuICAgICAgICAvLyBSZXZlcnNlIHdpbmRpbmcgdG8ga2VlcCB0aGUgbm9ybWFsIGZhY2luZyAtWVxuICAgICAgICBpbmRpY2VzLnB1c2goYmFzZUNlbnRlckluZGV4LCBuZXh0LCBjdXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvcHlWZXJ0ZXhEYXRhKHtcbiAgICAgIGF0dHJpYnV0ZXM6IFtuZXcgRmxvYXQzMkFycmF5KHBvc2l0aW9ucyksIG5ldyBGbG9hdDMyQXJyYXkobm9ybWFscyksIG5ldyBGbG9hdDMyQXJyYXkodGV4Y29vcmRzKV0sXG4gICAgICBhdHRyaWJ1dGVTZW1hbnRpY3M6IFtWZXJ0ZXhBdHRyaWJ1dGUuUG9zaXRpb24uWFlaLCBWZXJ0ZXhBdHRyaWJ1dGUuTm9ybWFsLlhZWiwgVmVydGV4QXR0cmlidXRlLlRleGNvb3JkMC5YWV0sXG4gICAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlcyxcbiAgICAgIGluZGljZXM6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzKSxcbiAgICAgIG1hdGVyaWFsOiBkZXNjLm1hdGVyaWFsLFxuICAgIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFHaEMsU0FBUyxjQUFjO0FBZ0NoQixJQUFNLE9BQU4sY0FBbUIsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLeEIsU0FBUyxPQUE2QjtBQTFDL0M7QUEyQ0ksVUFBTSxPQUFPO0FBQUEsTUFDWCxTQUFRLFdBQU0sV0FBTixZQUFnQjtBQUFBLE1BQ3hCLFNBQVEsV0FBTSxXQUFOLFlBQWdCO0FBQUEsTUFDeEIsZ0JBQWdCLEtBQUssSUFBSSxJQUFHLFdBQU0sbUJBQU4sWUFBd0IsRUFBRTtBQUFBLE1BQ3RELGNBQWEsV0FBTSxnQkFBTixZQUFxQjtBQUFBLE1BQ2xDLFVBQVUsTUFBTTtBQUFBLElBQ2xCO0FBRUEsVUFBTSxZQUFzQixDQUFDO0FBQzdCLFVBQU0sVUFBb0IsQ0FBQztBQUMzQixVQUFNLFlBQXNCLENBQUM7QUFDN0IsVUFBTSxV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
