// src/foundation/geometry/shapes/Cylinder.ts
import { PrimitiveMode } from "../../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../../definitions/VertexAttribute.js";
import { IShape } from "./IShape.js";
var Cylinder = class extends IShape {
  generate(_desc = {}) {
    var _a, _b, _c, _d, _e;
    const radiusBottom = (_a = _desc.radiusBottom) != null ? _a : 0.5;
    const radiusTop = (_b = _desc.radiusTop) != null ? _b : 0.5;
    const height = (_c = _desc.height) != null ? _c : 1;
    const requestedRadialSegments = (_d = _desc.radialSegments) != null ? _d : 16;
    if (!Number.isFinite(requestedRadialSegments) || !Number.isInteger(requestedRadialSegments)) {
      throw new Error("Cylinder radialSegments must be a finite integer.");
    }
    const radialSegments = Math.max(3, requestedRadialSegments);
    const includeCaps = (_e = _desc.includeCaps) != null ? _e : true;
    if (!Number.isFinite(radiusBottom) || !Number.isFinite(radiusTop) || !Number.isFinite(height) || radiusBottom < 0 || radiusTop < 0 || radiusBottom === 0 && radiusTop === 0 || height <= 0) {
      throw new Error("Cylinder dimensions must be finite, with positive height and at least one positive radius.");
    }
    const positions = [];
    const normals = [];
    const texcoords = [];
    const indices = [];
    const halfHeight = height / 2;
    const slope = (radiusBottom - radiusTop) / height;
    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const theta = i === radialSegments ? 0 : u * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const normalLength = Math.hypot(cos, slope, sin);
      positions.push(radiusBottom * cos, -halfHeight, radiusBottom * sin);
      normals.push(cos / normalLength, slope / normalLength, sin / normalLength);
      texcoords.push(u, 0);
      positions.push(radiusTop * cos, halfHeight, radiusTop * sin);
      normals.push(cos / normalLength, slope / normalLength, sin / normalLength);
      texcoords.push(u, 1);
    }
    for (let i = 0; i < radialSegments; i++) {
      const bottom = i * 2;
      const top = bottom + 1;
      const nextBottom = (i + 1) * 2;
      const nextTop = nextBottom + 1;
      indices.push(bottom, top, nextBottom, nextBottom, top, nextTop);
    }
    if (includeCaps) {
      this.fm(-halfHeight, radiusBottom, -1, radialSegments, positions, normals, texcoords, indices);
      this.fm(halfHeight, radiusTop, 1, radialSegments, positions, normals, texcoords, indices);
    }
    const indexArray = positions.length / 3 > 65536 ? new Uint32Array(indices) : new Uint16Array(indices);
    this.copyVertexData({
      attributes: [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)],
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Normal.XYZ, VertexAttribute.Texcoord0.XY],
      primitiveMode: PrimitiveMode.Triangles,
      indices: indexArray,
      material: _desc.material
    });
  }
  fm(y, radius, normalY, radialSegments, positions, normals, texcoords, indices) {
    if (radius === 0) {
      return;
    }
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, normalY, 0);
    texcoords.push(0.5, 0.5);
    const ring = positions.length / 3;
    for (let i = 0; i < radialSegments; i++) {
      const theta = i / radialSegments * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      positions.push(radius * cos, y, radius * sin);
      normals.push(0, normalY, 0);
      texcoords.push(cos * 0.5 + 0.5, sin * 0.5 + 0.5);
    }
    for (let i = 0; i < radialSegments; i++) {
      const current = ring + i;
      const next = ring + (i + 1) % radialSegments;
      if (normalY > 0) {
        indices.push(center, next, current);
      } else {
        indices.push(center, current, next);
      }
    }
  }
};
export {
  Cylinder
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvc2hhcGVzL0N5bGluZGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvdW50IH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgUGh5c2ljc1Byb3BlcnR5IH0gZnJvbSAnLi4vLi4vcGh5c2ljcy9QaHlzaWNzUHJvcGVydHknO1xuaW1wb3J0IHR5cGUgeyBJQW55UHJpbWl0aXZlRGVzY3JpcHRvciB9IGZyb20gJy4uL1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBJU2hhcGUgfSBmcm9tICcuL0lTaGFwZSc7XG5cbi8qKiBEZXNjcmlwdG9yIGZvciBhIGNhcHBlZCBjeWxpbmRlciBvciB0cnVuY2F0ZWQgY29uZSBhbGlnbmVkIHdpdGggdGhlIFkgYXhpcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3lsaW5kZXJEZXNjcmlwdG9yIGV4dGVuZHMgSUFueVByaW1pdGl2ZURlc2NyaXB0b3Ige1xuICByYWRpdXNCb3R0b20/OiBudW1iZXI7XG4gIHJhZGl1c1RvcD86IG51bWJlcjtcbiAgaGVpZ2h0PzogbnVtYmVyO1xuICByYWRpYWxTZWdtZW50cz86IENvdW50O1xuICBpbmNsdWRlQ2Fwcz86IGJvb2xlYW47XG4gIHBoeXNpY3M/OiBQaHlzaWNzUHJvcGVydHk7XG59XG5cbi8qKiBBIGNlbnRlcmVkLCBjYXBwZWQgY3lsaW5kZXIgdGhhdCBhbHNvIHN1cHBvcnRzIGRpZmZlcmVudCB0b3AgYW5kIGJvdHRvbSByYWRpaS4gKi9cbmV4cG9ydCBjbGFzcyBDeWxpbmRlciBleHRlbmRzIElTaGFwZSB7XG4gIHB1YmxpYyBnZW5lcmF0ZShfZGVzYzogQ3lsaW5kZXJEZXNjcmlwdG9yID0ge30pOiB2b2lkIHtcbiAgICBjb25zdCByYWRpdXNCb3R0b20gPSBfZGVzYy5yYWRpdXNCb3R0b20gPz8gMC41O1xuICAgIGNvbnN0IHJhZGl1c1RvcCA9IF9kZXNjLnJhZGl1c1RvcCA/PyAwLjU7XG4gICAgY29uc3QgaGVpZ2h0ID0gX2Rlc2MuaGVpZ2h0ID8/IDE7XG4gICAgY29uc3QgcmVxdWVzdGVkUmFkaWFsU2VnbWVudHMgPSBfZGVzYy5yYWRpYWxTZWdtZW50cyA/PyAxNjtcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShyZXF1ZXN0ZWRSYWRpYWxTZWdtZW50cykgfHwgIU51bWJlci5pc0ludGVnZXIocmVxdWVzdGVkUmFkaWFsU2VnbWVudHMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0N5bGluZGVyIHJhZGlhbFNlZ21lbnRzIG11c3QgYmUgYSBmaW5pdGUgaW50ZWdlci4nKTtcbiAgICB9XG4gICAgY29uc3QgcmFkaWFsU2VnbWVudHMgPSBNYXRoLm1heCgzLCByZXF1ZXN0ZWRSYWRpYWxTZWdtZW50cyk7XG4gICAgY29uc3QgaW5jbHVkZUNhcHMgPSBfZGVzYy5pbmNsdWRlQ2FwcyA/PyB0cnVlO1xuICAgIGlmIChcbiAgICAgICFOdW1iZXIuaXNGaW5pdGUocmFkaXVzQm90dG9tKSB8fFxuICAgICAgIU51bWJlci5pc0Zpbml0ZShyYWRpdXNUb3ApIHx8XG4gICAgICAhTnVtYmVyLmlzRmluaXRlKGhlaWdodCkgfHxcbiAgICAgIHJhZGl1c0JvdHRvbSA8IDAgfHxcbiAgICAgIHJhZGl1c1RvcCA8IDAgfHxcbiAgICAgIChyYWRpdXNCb3R0b20gPT09IDAgJiYgcmFkaXVzVG9wID09PSAwKSB8fFxuICAgICAgaGVpZ2h0IDw9IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ3lsaW5kZXIgZGltZW5zaW9ucyBtdXN0IGJlIGZpbml0ZSwgd2l0aCBwb3NpdGl2ZSBoZWlnaHQgYW5kIGF0IGxlYXN0IG9uZSBwb3NpdGl2ZSByYWRpdXMuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcG9zaXRpb25zOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IG5vcm1hbHM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgdGV4Y29vcmRzOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgY29uc3QgaGFsZkhlaWdodCA9IGhlaWdodCAvIDI7XG4gICAgY29uc3Qgc2xvcGUgPSAocmFkaXVzQm90dG9tIC0gcmFkaXVzVG9wKSAvIGhlaWdodDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHJhZGlhbFNlZ21lbnRzOyBpKyspIHtcbiAgICAgIGNvbnN0IHUgPSBpIC8gcmFkaWFsU2VnbWVudHM7XG4gICAgICBjb25zdCB0aGV0YSA9IGkgPT09IHJhZGlhbFNlZ21lbnRzID8gMCA6IHUgKiBNYXRoLlBJICogMjtcbiAgICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICAgIGNvbnN0IG5vcm1hbExlbmd0aCA9IE1hdGguaHlwb3QoY29zLCBzbG9wZSwgc2luKTtcbiAgICAgIHBvc2l0aW9ucy5wdXNoKHJhZGl1c0JvdHRvbSAqIGNvcywgLWhhbGZIZWlnaHQsIHJhZGl1c0JvdHRvbSAqIHNpbik7XG4gICAgICBub3JtYWxzLnB1c2goY29zIC8gbm9ybWFsTGVuZ3RoLCBzbG9wZSAvIG5vcm1hbExlbmd0aCwgc2luIC8gbm9ybWFsTGVuZ3RoKTtcbiAgICAgIHRleGNvb3Jkcy5wdXNoKHUsIDApO1xuICAgICAgcG9zaXRpb25zLnB1c2gocmFkaXVzVG9wICogY29zLCBoYWxmSGVpZ2h0LCByYWRpdXNUb3AgKiBzaW4pO1xuICAgICAgbm9ybWFscy5wdXNoKGNvcyAvIG5vcm1hbExlbmd0aCwgc2xvcGUgLyBub3JtYWxMZW5ndGgsIHNpbiAvIG5vcm1hbExlbmd0aCk7XG4gICAgICB0ZXhjb29yZHMucHVzaCh1LCAxKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByYWRpYWxTZWdtZW50czsgaSsrKSB7XG4gICAgICBjb25zdCBib3R0b20gPSBpICogMjtcbiAgICAgIGNvbnN0IHRvcCA9IGJvdHRvbSArIDE7XG4gICAgICBjb25zdCBuZXh0Qm90dG9tID0gKGkgKyAxKSAqIDI7XG4gICAgICBjb25zdCBuZXh0VG9wID0gbmV4dEJvdHRvbSArIDE7XG4gICAgICBpbmRpY2VzLnB1c2goYm90dG9tLCB0b3AsIG5leHRCb3R0b20sIG5leHRCb3R0b20sIHRvcCwgbmV4dFRvcCk7XG4gICAgfVxuXG4gICAgaWYgKGluY2x1ZGVDYXBzKSB7XG4gICAgICB0aGlzLl9fYXBwZW5kQ2FwKC1oYWxmSGVpZ2h0LCByYWRpdXNCb3R0b20sIC0xLCByYWRpYWxTZWdtZW50cywgcG9zaXRpb25zLCBub3JtYWxzLCB0ZXhjb29yZHMsIGluZGljZXMpO1xuICAgICAgdGhpcy5fX2FwcGVuZENhcChoYWxmSGVpZ2h0LCByYWRpdXNUb3AsIDEsIHJhZGlhbFNlZ21lbnRzLCBwb3NpdGlvbnMsIG5vcm1hbHMsIHRleGNvb3JkcywgaW5kaWNlcyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXhBcnJheSA9IHBvc2l0aW9ucy5sZW5ndGggLyAzID4gMHgxMDAwMCA/IG5ldyBVaW50MzJBcnJheShpbmRpY2VzKSA6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzKTtcblxuICAgIHRoaXMuY29weVZlcnRleERhdGEoe1xuICAgICAgYXR0cmlidXRlczogW25ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zKSwgbmV3IEZsb2F0MzJBcnJheShub3JtYWxzKSwgbmV3IEZsb2F0MzJBcnJheSh0ZXhjb29yZHMpXSxcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogW1ZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVosIFZlcnRleEF0dHJpYnV0ZS5Ob3JtYWwuWFlaLCBWZXJ0ZXhBdHRyaWJ1dGUuVGV4Y29vcmQwLlhZXSxcbiAgICAgIHByaW1pdGl2ZU1vZGU6IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVzLFxuICAgICAgaW5kaWNlczogaW5kZXhBcnJheSxcbiAgICAgIG1hdGVyaWFsOiBfZGVzYy5tYXRlcmlhbCxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX19hcHBlbmRDYXAoXG4gICAgeTogbnVtYmVyLFxuICAgIHJhZGl1czogbnVtYmVyLFxuICAgIG5vcm1hbFk6IC0xIHwgMSxcbiAgICByYWRpYWxTZWdtZW50czogbnVtYmVyLFxuICAgIHBvc2l0aW9uczogbnVtYmVyW10sXG4gICAgbm9ybWFsczogbnVtYmVyW10sXG4gICAgdGV4Y29vcmRzOiBudW1iZXJbXSxcbiAgICBpbmRpY2VzOiBudW1iZXJbXVxuICApOiB2b2lkIHtcbiAgICBpZiAocmFkaXVzID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNlbnRlciA9IHBvc2l0aW9ucy5sZW5ndGggLyAzO1xuICAgIHBvc2l0aW9ucy5wdXNoKDAsIHksIDApO1xuICAgIG5vcm1hbHMucHVzaCgwLCBub3JtYWxZLCAwKTtcbiAgICB0ZXhjb29yZHMucHVzaCgwLjUsIDAuNSk7XG4gICAgY29uc3QgcmluZyA9IHBvc2l0aW9ucy5sZW5ndGggLyAzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFkaWFsU2VnbWVudHM7IGkrKykge1xuICAgICAgY29uc3QgdGhldGEgPSAoaSAvIHJhZGlhbFNlZ21lbnRzKSAqIE1hdGguUEkgKiAyO1xuICAgICAgY29uc3QgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgICAgY29uc3Qgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgICAgcG9zaXRpb25zLnB1c2gocmFkaXVzICogY29zLCB5LCByYWRpdXMgKiBzaW4pO1xuICAgICAgbm9ybWFscy5wdXNoKDAsIG5vcm1hbFksIDApO1xuICAgICAgdGV4Y29vcmRzLnB1c2goY29zICogMC41ICsgMC41LCBzaW4gKiAwLjUgKyAwLjUpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhZGlhbFNlZ21lbnRzOyBpKyspIHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSByaW5nICsgaTtcbiAgICAgIGNvbnN0IG5leHQgPSByaW5nICsgKChpICsgMSkgJSByYWRpYWxTZWdtZW50cyk7XG4gICAgICBpZiAobm9ybWFsWSA+IDApIHtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGNlbnRlciwgbmV4dCwgY3VycmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRpY2VzLnB1c2goY2VudGVyLCBjdXJyZW50LCBuZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUdoQyxTQUFTLGNBQWM7QUFhaEIsSUFBTSxXQUFOLGNBQXVCLE9BQU87QUFBQSxFQUM1QixTQUFTLFFBQTRCLENBQUMsR0FBUztBQW5CeEQ7QUFvQkksVUFBTSxnQkFBZSxXQUFNLGlCQUFOLFlBQXNCO0FBQzNDLFVBQU0sYUFBWSxXQUFNLGNBQU4sWUFBbUI7QUFDckMsVUFBTSxVQUFTLFdBQU0sV0FBTixZQUFnQjtBQUMvQixVQUFNLDJCQUEwQixXQUFNLG1CQUFOLFlBQXdCO0FBQ3hELFFBQUksQ0FBQyxPQUFPLFNBQVMsdUJBQXVCLEtBQUssQ0FBQyxPQUFPLFVBQVUsdUJBQXVCLEdBQUc7QUFDM0YsWUFBTSxJQUFJLE1BQU0sbURBQW1EO0FBQUEsSUFDckU7QUFDQSxVQUFNLGlCQUFpQixLQUFLLElBQUksR0FBRyx1QkFBdUI7QUFDMUQsVUFBTSxlQUFjLFdBQU0sZ0JBQU4sWUFBcUI7QUFDekMsUUFDRSxDQUFDLE9BQU8sU0FBUyxZQUFZLEtBQzdCLENBQUMsT0FBTyxTQUFTLFNBQVMsS0FDMUIsQ0FBQyxPQUFPLFNBQVMsTUFBTSxLQUN2QixlQUFlLEtBQ2YsWUFBWSxLQUNYLGlCQUFpQixLQUFLLGNBQWMsS0FDckMsVUFBVSxHQUNWO0FBQ0EsWUFBTSxJQUFJLE1BQU0sNEZBQTRGO0FBQUEsSUFDOUc7QUFFQSxVQUFNLFlBQXNCLENBQUM7QUFDN0IsVUFBTSxVQUFvQixDQUFDO0FBQzNCLFVBQU0sWUFBc0IsQ0FBQztBQUM3QixVQUFNLFVBQW9CLENBQUM7QUFDM0IsVUFBTSxhQUFhLFNBQVM7QUFDNUIsVUFBTSxTQUFTLGVBQWUsYUFBYTtBQUUzQyxhQUFTLElBQUksR0FBRyxLQUFLLGdCQUFnQixLQUFLO0FBQ3hDLFlBQU0sSUFBSSxJQUFJO0FBQ2QsWUFBTSxRQUFRLE1BQU0saUJBQWlCLElBQUksSUFBSSxLQUFLLEtBQUs7QUFDdkQsWUFBTSxNQUFNLEtBQUssSUFBSSxLQUFLO0FBQzFCLFlBQU0sTUFBTSxLQUFLLElBQUksS0FBSztBQUMxQixZQUFNLGVBQWUsS0FBSyxNQUFNLEtBQUssT0FBTyxHQUFHO0FBQy9DLGdCQUFVLEtBQUssZUFBZSxLQUFLLENBQUMsWUFBWSxlQUFlLEdBQUc7QUFDbEUsY0FBUSxLQUFLLE1BQU0sY0FBYyxRQUFRLGNBQWMsTUFBTSxZQUFZO0FBQ3pFLGdCQUFVLEtBQUssR0FBRyxDQUFDO0FBQ25CLGdCQUFVLEtBQUssWUFBWSxLQUFLLFlBQVksWUFBWSxHQUFHO0FBQzNELGNBQVEsS0FBSyxNQUFNLGNBQWMsUUFBUSxjQUFjLE1BQU0sWUFBWTtBQUN6RSxnQkFBVSxLQUFLLEdBQUcsQ0FBQztBQUFBLElBQ3JCO0FBQ0EsYUFBUyxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsS0FBSztBQUN2QyxZQUFNLFNBQVMsSUFBSTtBQUNuQixZQUFNLE1BQU0sU0FBUztBQUNyQixZQUFNLGNBQWMsSUFBSSxLQUFLO0FBQzdCLFlBQU0sVUFBVSxhQUFhO0FBQzdCLGNBQVEsS0FBSyxRQUFRLEtBQUssWUFBWSxZQUFZLEtBQUssT0FBTztBQUFBLElBQ2hFO0FBRUEsUUFBSSxhQUFhO0FBQ2YsV0FBS0EsR0FBWSxDQUFDLFlBQVksY0FBYyxJQUFJLGdCQUFnQixXQUFXLFNBQVMsV0FBVyxPQUFPO0FBQ3RHLFdBQUtBLEdBQVksWUFBWSxXQUFXLEdBQUcsZ0JBQWdCLFdBQVcsU0FBUyxXQUFXLE9BQU87QUFBQSxJQUNuRztBQUVBLFVBQU0sYUFBYSxVQUFVLFNBQVMsSUFBSSxRQUFVLElBQUksWUFBWSxPQUFPLElBQUksSUFBSSxZQUFZLE9BQU87QUFFdEcsU0FBSyxlQUFlO0FBQUEsTUFDbEIsWUFBWSxDQUFDLElBQUksYUFBYSxTQUFTLEdBQUcsSUFBSSxhQUFhLE9BQU8sR0FBRyxJQUFJLGFBQWEsU0FBUyxDQUFDO0FBQUEsTUFDaEcsb0JBQW9CLENBQUMsZ0JBQWdCLFNBQVMsS0FBSyxnQkFBZ0IsT0FBTyxLQUFLLGdCQUFnQixVQUFVLEVBQUU7QUFBQSxNQUMzRyxlQUFlLGNBQWM7QUFBQSxNQUM3QixTQUFTO0FBQUEsTUFDVCxVQUFVLE1BQU07QUFBQSxJQUNsQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRVFBLEdBQ04sR0FDQSxRQUNBLFNBQ0EsZ0JBQ0EsV0FDQSxTQUNBLFdBQ0EsU0FDTTtBQUNOLFFBQUksV0FBVyxHQUFHO0FBQ2hCO0FBQUEsSUFDRjtBQUNBLFVBQU0sU0FBUyxVQUFVLFNBQVM7QUFDbEMsY0FBVSxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ3RCLFlBQVEsS0FBSyxHQUFHLFNBQVMsQ0FBQztBQUMxQixjQUFVLEtBQUssS0FBSyxHQUFHO0FBQ3ZCLFVBQU0sT0FBTyxVQUFVLFNBQVM7QUFDaEMsYUFBUyxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsS0FBSztBQUN2QyxZQUFNLFFBQVMsSUFBSSxpQkFBa0IsS0FBSyxLQUFLO0FBQy9DLFlBQU0sTUFBTSxLQUFLLElBQUksS0FBSztBQUMxQixZQUFNLE1BQU0sS0FBSyxJQUFJLEtBQUs7QUFDMUIsZ0JBQVUsS0FBSyxTQUFTLEtBQUssR0FBRyxTQUFTLEdBQUc7QUFDNUMsY0FBUSxLQUFLLEdBQUcsU0FBUyxDQUFDO0FBQzFCLGdCQUFVLEtBQUssTUFBTSxNQUFNLEtBQUssTUFBTSxNQUFNLEdBQUc7QUFBQSxJQUNqRDtBQUNBLGFBQVMsSUFBSSxHQUFHLElBQUksZ0JBQWdCLEtBQUs7QUFDdkMsWUFBTSxVQUFVLE9BQU87QUFDdkIsWUFBTSxPQUFPLFFBQVMsSUFBSSxLQUFLO0FBQy9CLFVBQUksVUFBVSxHQUFHO0FBQ2YsZ0JBQVEsS0FBSyxRQUFRLE1BQU0sT0FBTztBQUFBLE1BQ3BDLE9BQU87QUFDTCxnQkFBUSxLQUFLLFFBQVEsU0FBUyxJQUFJO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2FwcGVuZENhcCJdCn0K
