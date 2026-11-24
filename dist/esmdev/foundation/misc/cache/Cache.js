// src/foundation/misc/cache/Cache.ts
import { SymbolWeakMap } from "./SymbolWeakMap.js";
var Cache = class {
  constructor() {
    this.Su = new SymbolWeakMap();
  }
  register(value) {
    this.Su.set(/* @__PURE__ */ Symbol(), value);
  }
  // public read(): T {}
};
export {
  Cache
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWlzYy9jYWNoZS9DYWNoZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgU3ltYm9sV2Vha01hcCB9IGZyb20gJy4vU3ltYm9sV2Vha01hcCc7XG5cbmV4cG9ydCBjbGFzcyBDYWNoZTxUPiB7XG4gIHByaXZhdGUgX19zeW1ib2xXZWFrTWFwID0gbmV3IFN5bWJvbFdlYWtNYXAoKTtcbiAgcHVibGljIHJlZ2lzdGVyKHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fX3N5bWJvbFdlYWtNYXAuc2V0KFN5bWJvbCgpLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBwdWJsaWMgcmVhZCgpOiBUIHt9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUyxxQkFBcUI7QUFFdkIsSUFBTSxRQUFOLE1BQWU7QUFBQSxFQUFmO0FBQ0wsU0FBUUEsS0FBa0IsSUFBSSxjQUFjO0FBQUE7QUFBQSxFQUNyQyxTQUFTLE9BQVU7QUFDeEIsU0FBS0EsR0FBZ0IsSUFBSSx1QkFBTyxHQUFHLEtBQUs7QUFBQSxFQUMxQztBQUFBO0FBR0Y7IiwKICAibmFtZXMiOiBbIl9fc3ltYm9sV2Vha01hcCJdCn0K
