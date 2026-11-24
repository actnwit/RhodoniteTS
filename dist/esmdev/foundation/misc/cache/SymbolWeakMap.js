// src/foundation/misc/cache/SymbolWeakMap.ts
import { Is } from "../Is.js";
var SymbolWeakMap = class {
  constructor() {
    this.Ru = /* @__PURE__ */ new WeakMap();
  }
  /**
   * set key and value
   * @param symbol the key for access
   * @param value the value as a cache item
   * @returns true: succeed to set value, false: not set (already exists)
   */
  set(symbol, value) {
    const isExist = this.Ru.has(symbol);
    if (isExist) {
      return false;
    }
    this.Ru.set(symbol, value);
    return true;
  }
  /**
   * return the boolean value whether it have the key or not
   * @param symbol the key for access
   * @returns Whether it have the key or not.
   */
  has(symbol) {
    const isExist = this.Ru.has(symbol);
    if (isExist) {
      return true;
    }
    return false;
  }
  /**
   * return the number of this cache items
   * @returns the number of this cache items
   */
  // public size(): number {
  //   return this.__weakMap.size;
  // }
  /**
   * return the value in the cache by the key
   * @param symbol the key for access
   * @returns the value in the cache by the key
   */
  get(symbol) {
    const keyObj = this.Ru.get(symbol);
    if (Is.not.exist(keyObj)) {
      return void 0;
    }
    const val = this.Ru.get(symbol);
    return val;
  }
  /**
   * delete the value
   * @param symbol the key for access
   * @returns the flag of the deletion was succeed or not
   */
  delete(symbol) {
    const isExist = this.Ru.has(symbol);
    if (!isExist) {
      return false;
    }
    this.Ru.delete(symbol);
    return true;
  }
};
export {
  SymbolWeakMap
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWlzYy9jYWNoZS9TeW1ib2xXZWFrTWFwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBJcyB9IGZyb20gJy4uL0lzJztcblxuZXhwb3J0IGNsYXNzIFN5bWJvbFdlYWtNYXA8Vj4ge1xuICBwcml2YXRlIF9fd2Vha01hcDogV2Vha01hcDxTeW1ib2wsIFY+ID0gbmV3IFdlYWtNYXAoKTtcblxuICAvKipcbiAgICogc2V0IGtleSBhbmQgdmFsdWVcbiAgICogQHBhcmFtIHN5bWJvbCB0aGUga2V5IGZvciBhY2Nlc3NcbiAgICogQHBhcmFtIHZhbHVlIHRoZSB2YWx1ZSBhcyBhIGNhY2hlIGl0ZW1cbiAgICogQHJldHVybnMgdHJ1ZTogc3VjY2VlZCB0byBzZXQgdmFsdWUsIGZhbHNlOiBub3Qgc2V0IChhbHJlYWR5IGV4aXN0cylcbiAgICovXG4gIHB1YmxpYyBzZXQoc3ltYm9sOiBTeW1ib2wsIHZhbHVlOiBWKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNFeGlzdCA9IHRoaXMuX193ZWFrTWFwLmhhcyhzeW1ib2wpO1xuICAgIGlmIChpc0V4aXN0KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX193ZWFrTWFwLnNldChzeW1ib2wsIHZhbHVlKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm4gdGhlIGJvb2xlYW4gdmFsdWUgd2hldGhlciBpdCBoYXZlIHRoZSBrZXkgb3Igbm90XG4gICAqIEBwYXJhbSBzeW1ib2wgdGhlIGtleSBmb3IgYWNjZXNzXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgaXQgaGF2ZSB0aGUga2V5IG9yIG5vdC5cbiAgICovXG4gIHB1YmxpYyBoYXMoc3ltYm9sOiBTeW1ib2wpOiBib29sZWFuIHtcbiAgICBjb25zdCBpc0V4aXN0ID0gdGhpcy5fX3dlYWtNYXAuaGFzKHN5bWJvbCk7XG4gICAgaWYgKGlzRXhpc3QpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogcmV0dXJuIHRoZSBudW1iZXIgb2YgdGhpcyBjYWNoZSBpdGVtc1xuICAgKiBAcmV0dXJucyB0aGUgbnVtYmVyIG9mIHRoaXMgY2FjaGUgaXRlbXNcbiAgICovXG4gIC8vIHB1YmxpYyBzaXplKCk6IG51bWJlciB7XG4gIC8vICAgcmV0dXJuIHRoaXMuX193ZWFrTWFwLnNpemU7XG4gIC8vIH1cblxuICAvKipcbiAgICogcmV0dXJuIHRoZSB2YWx1ZSBpbiB0aGUgY2FjaGUgYnkgdGhlIGtleVxuICAgKiBAcGFyYW0gc3ltYm9sIHRoZSBrZXkgZm9yIGFjY2Vzc1xuICAgKiBAcmV0dXJucyB0aGUgdmFsdWUgaW4gdGhlIGNhY2hlIGJ5IHRoZSBrZXlcbiAgICovXG4gIHB1YmxpYyBnZXQoc3ltYm9sOiBTeW1ib2wpOiBWIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBrZXlPYmogPSB0aGlzLl9fd2Vha01hcC5nZXQoc3ltYm9sKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGtleU9iaikpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IHZhbCA9IHRoaXMuX193ZWFrTWFwLmdldChzeW1ib2wpO1xuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICAvKipcbiAgICogZGVsZXRlIHRoZSB2YWx1ZVxuICAgKiBAcGFyYW0gc3ltYm9sIHRoZSBrZXkgZm9yIGFjY2Vzc1xuICAgKiBAcmV0dXJucyB0aGUgZmxhZyBvZiB0aGUgZGVsZXRpb24gd2FzIHN1Y2NlZWQgb3Igbm90XG4gICAqL1xuICBwdWJsaWMgZGVsZXRlKHN5bWJvbDogU3ltYm9sKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaXNFeGlzdCA9IHRoaXMuX193ZWFrTWFwLmhhcyhzeW1ib2wpO1xuICAgIGlmICghaXNFeGlzdCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9fd2Vha01hcC5kZWxldGUoc3ltYm9sKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsVUFBVTtBQUVaLElBQU0sZ0JBQU4sTUFBdUI7QUFBQSxFQUF2QjtBQUNMLFNBQVFBLEtBQWdDLG9CQUFJLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUTdDLElBQUksUUFBZ0IsT0FBbUI7QUFDNUMsVUFBTSxVQUFVLEtBQUtBLEdBQVUsSUFBSSxNQUFNO0FBQ3pDLFFBQUksU0FBUztBQUNYLGFBQU87QUFBQSxJQUNUO0FBQ0EsU0FBS0EsR0FBVSxJQUFJLFFBQVEsS0FBSztBQUNoQyxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9PLElBQUksUUFBeUI7QUFDbEMsVUFBTSxVQUFVLEtBQUtBLEdBQVUsSUFBSSxNQUFNO0FBQ3pDLFFBQUksU0FBUztBQUNYLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWVPLElBQUksUUFBK0I7QUFDeEMsVUFBTSxTQUFTLEtBQUtBLEdBQVUsSUFBSSxNQUFNO0FBQ3hDLFFBQUksR0FBRyxJQUFJLE1BQU0sTUFBTSxHQUFHO0FBQ3hCLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxNQUFNLEtBQUtBLEdBQVUsSUFBSSxNQUFNO0FBQ3JDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT08sT0FBTyxRQUF5QjtBQUNyQyxVQUFNLFVBQVUsS0FBS0EsR0FBVSxJQUFJLE1BQU07QUFDekMsUUFBSSxDQUFDLFNBQVM7QUFDWixhQUFPO0FBQUEsSUFDVDtBQUNBLFNBQUtBLEdBQVUsT0FBTyxNQUFNO0FBQzVCLFdBQU87QUFBQSxFQUNUO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fd2Vha01hcCJdCn0K
