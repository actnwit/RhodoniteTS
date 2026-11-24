// src/foundation/geometry/ComplexVertexAttribute.ts
var ComplexVertexAttribute = class {
  /**
   * Creates a new ComplexVertexAttribute instance.
   *
   * @param semanticAttribute - The semantic type of this vertex attribute (e.g., position, normal, UV)
   * @param attributes - A map of attribute names to their corresponding accessors
   */
  constructor(semanticAttribute, attributes) {
    this.Zh = [];
    this.sk = [];
    this.tk = semanticAttribute;
    this.sk = [];
    this.Zh = [];
    for (const [joinedString, accessor] of attributes) {
      const split = joinedString.split(",");
      for (let i = 0; i < split.length; i++) {
        const attributeComponentName = split[i];
        if (attributeComponentName === semanticAttribute.X) {
          this.sk[0] = i;
          this.Zh[0] = accessor;
        }
        if (attributeComponentName === semanticAttribute.Y) {
          this.sk[1] = i;
          this.Zh[1] = accessor;
        }
        if (attributeComponentName === semanticAttribute.Z) {
          this.sk[2] = i;
          this.Zh[2] = accessor;
        }
        if (attributeComponentName === semanticAttribute.W) {
          this.sk[3] = i;
          this.Zh[3] = accessor;
        }
      }
    }
  }
  /**
   * Gets the semantic type of this vertex attribute.
   *
   * @returns The vertex attribute semantic enum
   */
  get semantic() {
    return this.tk;
  }
  /**
   * Retrieves a single scalar value as a 1-element array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 1-element array containing the scalar value
   */
  getScalarAsArray(i, option) {
    return [this.Zh[0].getScalarAt(i, this.sk[0], option)];
  }
  /**
   * Retrieves a 2-component vector (Vec2) as an array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 2-element array containing the X and Y components
   */
  getVec2AsArray(i, option) {
    return [
      this.Zh[0].getScalarAt(i, this.sk[0], option),
      this.Zh[1].getScalarAt(i, this.sk[1], option)
    ];
  }
  /**
   * Retrieves a 3-component vector (Vec3) as an array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 3-element array containing the X, Y, and Z components
   */
  getVec3AsArray(i, option) {
    return [
      this.Zh[0].getScalarAt(i, this.sk[0], option),
      this.Zh[1].getScalarAt(i, this.sk[1], option),
      this.Zh[2].getScalarAt(i, this.sk[2], option)
    ];
  }
  /**
   * Retrieves a 4-component vector (Vec4) as an array from the vertex attribute at the specified index.
   *
   * @param i - The vertex index to access
   * @param option - Options for accessing the data (e.g., handling out-of-bounds indices)
   * @returns A 4-element array containing the X, Y, Z, and W components
   */
  getVec4AsArray(i, option) {
    return [
      this.Zh[0].getScalarAt(i, this.sk[0], option),
      this.Zh[1].getScalarAt(i, this.sk[1], option),
      this.Zh[2].getScalarAt(i, this.sk[2], option),
      this.Zh[3].getScalarAt(i, this.sk[3], option)
    ];
  }
};
export {
  ComplexVertexAttribute
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvQ29tcGxleFZlcnRleEF0dHJpYnV0ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBBcnJheTEsIEFycmF5MXRvNCwgQXJyYXkyLCBBcnJheTMsIEFycmF5NCwgSW5kZXggfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEF0dHJpYnV0ZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciwgSW5kaWNlc0FjY2Vzc09wdGlvbiB9IGZyb20gJy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgdHlwZSB7IElTZW1hbnRpY1ZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4vSVNlbWFudGljVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlcyB9IGZyb20gJy4vUHJpbWl0aXZlJztcblxuLyoqXG4gKiBBIGNvbXBsZXggdmVydGV4IGF0dHJpYnV0ZSB0aGF0IG1hbmFnZXMgbXVsdGlwbGUgYWNjZXNzb3JzIGZvciBkaWZmZXJlbnQgY29tcG9uZW50cyAoWCwgWSwgWiwgVylcbiAqIG9mIGEgdmVydGV4IGF0dHJpYnV0ZS4gVGhpcyBjbGFzcyBhbGxvd3MgdmVydGV4IGF0dHJpYnV0ZXMgdG8gYmUgc3RvcmVkIGFjcm9zcyBtdWx0aXBsZVxuICogZGF0YSBzb3VyY2VzIHdoaWxlIHByb3ZpZGluZyBhIHVuaWZpZWQgaW50ZXJmYWNlIGZvciBhY2Nlc3NpbmcgdGhlbS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBsZXhWZXJ0ZXhBdHRyaWJ1dGUgaW1wbGVtZW50cyBJU2VtYW50aWNWZXJ0ZXhBdHRyaWJ1dGUge1xuICBwcml2YXRlIF9fc2VtYW50aWM6IFZlcnRleEF0dHJpYnV0ZUVudW07XG4gIHByaXZhdGUgX19jb21wb25lbnRzOiBBcnJheTF0bzQ8QWNjZXNzb3I+ID0gW10gYXMgdW5rbm93biBhcyBBcnJheTF0bzQ8QWNjZXNzb3I+O1xuICBwcml2YXRlIF9fb2Zmc2V0czogQXJyYXkxdG80PEluZGV4PiA9IFtdIGFzIHVua25vd24gYXMgQXJyYXkxdG80PEluZGV4PjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBDb21wbGV4VmVydGV4QXR0cmlidXRlIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gc2VtYW50aWNBdHRyaWJ1dGUgLSBUaGUgc2VtYW50aWMgdHlwZSBvZiB0aGlzIHZlcnRleCBhdHRyaWJ1dGUgKGUuZy4sIHBvc2l0aW9uLCBub3JtYWwsIFVWKVxuICAgKiBAcGFyYW0gYXR0cmlidXRlcyAtIEEgbWFwIG9mIGF0dHJpYnV0ZSBuYW1lcyB0byB0aGVpciBjb3JyZXNwb25kaW5nIGFjY2Vzc29yc1xuICAgKi9cbiAgY29uc3RydWN0b3Ioc2VtYW50aWNBdHRyaWJ1dGU6IFZlcnRleEF0dHJpYnV0ZUVudW0sIGF0dHJpYnV0ZXM6IEF0dHJpYnV0ZXMpIHtcbiAgICB0aGlzLl9fc2VtYW50aWMgPSBzZW1hbnRpY0F0dHJpYnV0ZTtcbiAgICB0aGlzLl9fb2Zmc2V0cyA9IFtdIGFzIHVua25vd24gYXMgQXJyYXkxdG80PEluZGV4PjtcbiAgICB0aGlzLl9fY29tcG9uZW50cyA9IFtdIGFzIHVua25vd24gYXMgQXJyYXkxdG80PEFjY2Vzc29yPjtcbiAgICBmb3IgKGNvbnN0IFtqb2luZWRTdHJpbmcsIGFjY2Vzc29yXSBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBzcGxpdCA9IGpvaW5lZFN0cmluZy5zcGxpdCgnLCcpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGxpdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGVDb21wb25lbnROYW1lID0gc3BsaXRbaV07XG4gICAgICAgIGlmIChhdHRyaWJ1dGVDb21wb25lbnROYW1lID09PSBzZW1hbnRpY0F0dHJpYnV0ZS5YKSB7XG4gICAgICAgICAgdGhpcy5fX29mZnNldHNbMF0gPSBpO1xuICAgICAgICAgIHRoaXMuX19jb21wb25lbnRzWzBdID0gYWNjZXNzb3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF0dHJpYnV0ZUNvbXBvbmVudE5hbWUgPT09IHNlbWFudGljQXR0cmlidXRlLlkpIHtcbiAgICAgICAgICB0aGlzLl9fb2Zmc2V0c1sxXSA9IGk7XG4gICAgICAgICAgdGhpcy5fX2NvbXBvbmVudHNbMV0gPSBhY2Nlc3NvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXR0cmlidXRlQ29tcG9uZW50TmFtZSA9PT0gc2VtYW50aWNBdHRyaWJ1dGUuWikge1xuICAgICAgICAgIHRoaXMuX19vZmZzZXRzWzJdID0gaTtcbiAgICAgICAgICB0aGlzLl9fY29tcG9uZW50c1syXSA9IGFjY2Vzc29yO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRyaWJ1dGVDb21wb25lbnROYW1lID09PSBzZW1hbnRpY0F0dHJpYnV0ZS5XKSB7XG4gICAgICAgICAgdGhpcy5fX29mZnNldHNbM10gPSBpO1xuICAgICAgICAgIHRoaXMuX19jb21wb25lbnRzWzNdID0gYWNjZXNzb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2VtYW50aWMgdHlwZSBvZiB0aGlzIHZlcnRleCBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJ0ZXggYXR0cmlidXRlIHNlbWFudGljIGVudW1cbiAgICovXG4gIGdldCBzZW1hbnRpYygpOiBWZXJ0ZXhBdHRyaWJ1dGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX3NlbWFudGljO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHNpbmdsZSBzY2FsYXIgdmFsdWUgYXMgYSAxLWVsZW1lbnQgYXJyYXkgZnJvbSB0aGUgdmVydGV4IGF0dHJpYnV0ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSB2ZXJ0ZXggaW5kZXggdG8gYWNjZXNzXG4gICAqIEBwYXJhbSBvcHRpb24gLSBPcHRpb25zIGZvciBhY2Nlc3NpbmcgdGhlIGRhdGEgKGUuZy4sIGhhbmRsaW5nIG91dC1vZi1ib3VuZHMgaW5kaWNlcylcbiAgICogQHJldHVybnMgQSAxLWVsZW1lbnQgYXJyYXkgY29udGFpbmluZyB0aGUgc2NhbGFyIHZhbHVlXG4gICAqL1xuICBwdWJsaWMgZ2V0U2NhbGFyQXNBcnJheShpOiBJbmRleCwgb3B0aW9uOiBJbmRpY2VzQWNjZXNzT3B0aW9uKTogQXJyYXkxPG51bWJlcj4ge1xuICAgIHJldHVybiBbdGhpcy5fX2NvbXBvbmVudHNbMF0uZ2V0U2NhbGFyQXQoaSwgdGhpcy5fX29mZnNldHNbMF0sIG9wdGlvbildO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIDItY29tcG9uZW50IHZlY3RvciAoVmVjMikgYXMgYW4gYXJyYXkgZnJvbSB0aGUgdmVydGV4IGF0dHJpYnV0ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSB2ZXJ0ZXggaW5kZXggdG8gYWNjZXNzXG4gICAqIEBwYXJhbSBvcHRpb24gLSBPcHRpb25zIGZvciBhY2Nlc3NpbmcgdGhlIGRhdGEgKGUuZy4sIGhhbmRsaW5nIG91dC1vZi1ib3VuZHMgaW5kaWNlcylcbiAgICogQHJldHVybnMgQSAyLWVsZW1lbnQgYXJyYXkgY29udGFpbmluZyB0aGUgWCBhbmQgWSBjb21wb25lbnRzXG4gICAqL1xuICBwdWJsaWMgZ2V0VmVjMkFzQXJyYXkoaTogSW5kZXgsIG9wdGlvbjogSW5kaWNlc0FjY2Vzc09wdGlvbik6IEFycmF5MjxudW1iZXI+IHtcbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5fX2NvbXBvbmVudHNbMF0uZ2V0U2NhbGFyQXQoaSwgdGhpcy5fX29mZnNldHNbMF0sIG9wdGlvbiksXG4gICAgICB0aGlzLl9fY29tcG9uZW50c1sxXSEuZ2V0U2NhbGFyQXQoaSwgdGhpcy5fX29mZnNldHNbMV0hLCBvcHRpb24pLFxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgMy1jb21wb25lbnQgdmVjdG9yIChWZWMzKSBhcyBhbiBhcnJheSBmcm9tIHRoZSB2ZXJ0ZXggYXR0cmlidXRlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSBpIC0gVGhlIHZlcnRleCBpbmRleCB0byBhY2Nlc3NcbiAgICogQHBhcmFtIG9wdGlvbiAtIE9wdGlvbnMgZm9yIGFjY2Vzc2luZyB0aGUgZGF0YSAoZS5nLiwgaGFuZGxpbmcgb3V0LW9mLWJvdW5kcyBpbmRpY2VzKVxuICAgKiBAcmV0dXJucyBBIDMtZWxlbWVudCBhcnJheSBjb250YWluaW5nIHRoZSBYLCBZLCBhbmQgWiBjb21wb25lbnRzXG4gICAqL1xuICBwdWJsaWMgZ2V0VmVjM0FzQXJyYXkoaTogSW5kZXgsIG9wdGlvbjogSW5kaWNlc0FjY2Vzc09wdGlvbik6IEFycmF5MzxudW1iZXI+IHtcbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5fX2NvbXBvbmVudHNbMF0uZ2V0U2NhbGFyQXQoaSwgdGhpcy5fX29mZnNldHNbMF0sIG9wdGlvbiksXG4gICAgICB0aGlzLl9fY29tcG9uZW50c1sxXSEuZ2V0U2NhbGFyQXQoaSwgdGhpcy5fX29mZnNldHNbMV0hLCBvcHRpb24pLFxuICAgICAgdGhpcy5fX2NvbXBvbmVudHNbMl0hLmdldFNjYWxhckF0KGksIHRoaXMuX19vZmZzZXRzWzJdISwgb3B0aW9uKSxcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIDQtY29tcG9uZW50IHZlY3RvciAoVmVjNCkgYXMgYW4gYXJyYXkgZnJvbSB0aGUgdmVydGV4IGF0dHJpYnV0ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSB2ZXJ0ZXggaW5kZXggdG8gYWNjZXNzXG4gICAqIEBwYXJhbSBvcHRpb24gLSBPcHRpb25zIGZvciBhY2Nlc3NpbmcgdGhlIGRhdGEgKGUuZy4sIGhhbmRsaW5nIG91dC1vZi1ib3VuZHMgaW5kaWNlcylcbiAgICogQHJldHVybnMgQSA0LWVsZW1lbnQgYXJyYXkgY29udGFpbmluZyB0aGUgWCwgWSwgWiwgYW5kIFcgY29tcG9uZW50c1xuICAgKi9cbiAgcHVibGljIGdldFZlYzRBc0FycmF5KGk6IEluZGV4LCBvcHRpb246IEluZGljZXNBY2Nlc3NPcHRpb24pOiBBcnJheTQ8bnVtYmVyPiB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHRoaXMuX19jb21wb25lbnRzWzBdLmdldFNjYWxhckF0KGksIHRoaXMuX19vZmZzZXRzWzBdLCBvcHRpb24pLFxuICAgICAgdGhpcy5fX2NvbXBvbmVudHNbMV0hLmdldFNjYWxhckF0KGksIHRoaXMuX19vZmZzZXRzWzFdISwgb3B0aW9uKSxcbiAgICAgIHRoaXMuX19jb21wb25lbnRzWzJdIS5nZXRTY2FsYXJBdChpLCB0aGlzLl9fb2Zmc2V0c1syXSEsIG9wdGlvbiksXG4gICAgICB0aGlzLl9fY29tcG9uZW50c1szXSEuZ2V0U2NhbGFyQXQoaSwgdGhpcy5fX29mZnNldHNbM10hLCBvcHRpb24pLFxuICAgIF07XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFXTyxJQUFNLHlCQUFOLE1BQWlFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXdEUsWUFBWSxtQkFBd0MsWUFBd0I7QUFUNUUsU0FBUUEsS0FBb0MsQ0FBQztBQUM3QyxTQUFRQyxLQUE4QixDQUFDO0FBU3JDLFNBQUtDLEtBQWE7QUFDbEIsU0FBS0QsS0FBWSxDQUFDO0FBQ2xCLFNBQUtELEtBQWUsQ0FBQztBQUNyQixlQUFXLENBQUMsY0FBYyxRQUFRLEtBQUssWUFBWTtBQUNqRCxZQUFNLFFBQVEsYUFBYSxNQUFNLEdBQUc7QUFDcEMsZUFBUyxJQUFJLEdBQUcsSUFBSSxNQUFNLFFBQVEsS0FBSztBQUNyQyxjQUFNLHlC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
