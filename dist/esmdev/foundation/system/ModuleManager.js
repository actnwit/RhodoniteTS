// src/foundation/system/ModuleManager.ts
var ModuleManager = class _ModuleManager {
  constructor() {
    this.hB = /* @__PURE__ */ new Map();
  }
  /* eslint-disable prettier/prettier */
  /**
   * Dynamically loads a module by name and stores it in the internal module registry.
   * Supports loading WebGL, WebGPU, Effekseer, PBR, and XR modules with code splitting.
   *
   * @param moduleName - The name of the module to load (case-insensitive).
   *                     Supported modules: 'webgl', 'webgpu', 'effekseer', 'pbr', 'xr'
   * @param options - Optional configuration object for module loading
   * @param options.wasm - WASM module URI, currently used only for Effekseer module
   * @param options.wasmWebGL - WebGL backend WASM module URI for Effekseer
   * @param options.nativeScriptWebGL - WebGL backend native script URI for Effekseer
   * @param options.wasmWebGPU - WebGPU backend WASM module URI for Effekseer
   * @param options.nativeScriptWebGPU - WebGPU backend native script URI for Effekseer
   * @returns A promise that resolves to the loaded module
   * @throws Will throw an error if the module fails to load
   *
   * @example
   * ```typescript
   * const moduleManager = ModuleManager.getInstance();
   * const webglModule = await moduleManager.loadModule('webgl');
   * const effekseerModule = await moduleManager.loadModule('effekseer', {
   *   wasm: '/path/to/effekseer-webgl.wasm',
   *   nativeScript: '/path/to/effekseer-webgl.js'
   * });
   * ```
   */
  async loadModule(moduleName, options) {
    let module;
    if (moduleName.toLowerCase() === "webgl") {
      if (typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__) {
        module = await (await import(
          /* webpackChunkName: "webgl" */
          "../../webgl/main.js"
        )).default;
      } else {
        throw new Error("WebGL support is disabled in this build (__RN_WEBGL__ = false).");
      }
    } else if (moduleName.toLowerCase() === "webgpu") {
      if (typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__) {
        module = await (await import(
          /* webpackChunkName: "webgpu" */
          "../../webgpu/main.js"
        )).default;
      } else {
        throw new Error("WebGPU support is disabled in this build (__RN_WEBGPU__ = false).");
      }
    } else if (moduleName.toLowerCase() === "effekseer") {
      module = await (await import(
        /* webpackChunkName: "effekseer" */
        "../../effekseer/main.js"
      )).Effekseer;
      module.EffekseerComponent.wasmModuleUri = options == null ? void 0 : options.wasm;
      module.EffekseerComponent.nativeScriptUri = options == null ? void 0 : options.nativeScript;
      module.EffekseerComponent.wasmModuleUriWebGL = options == null ? void 0 : options.wasmWebGL;
      module.EffekseerComponent.nativeScriptUriWebGL = options == null ? void 0 : options.nativeScriptWebGL;
      module.EffekseerComponent.wasmModuleUriWebGPU = options == null ? void 0 : options.wasmWebGPU;
      module.EffekseerComponent.nativeScriptUriWebGPU = options == null ? void 0 : options.nativeScriptWebGPU;
    } else if (moduleName.toLowerCase() === "pbr") {
      module = await (await import(
        /* webpackChunkName: "pbr" */
        "../../pbr/main.js"
      )).default;
    } else if (moduleName.toLowerCase() === "xr") {
      module = await (await import(
        /* webpackChunkName: "xr" */
        "../../xr/main.js"
      )).default;
    }
    this.hB.set(moduleName, module);
    return module;
  }
  /**
   * Retrieves a previously loaded module from the internal registry.
   *
   * @param moduleName - The name of the module to retrieve
   * @returns The loaded module if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const moduleManager = ModuleManager.getInstance();
   * const webglModule = moduleManager.getModule('webgl');
   * if (webglModule) {
   *   // Use the module
   * }
   * ```
   */
  getModule(moduleName) {
    return this.hB.get(moduleName);
  }
  /**
   * Gets the singleton instance of ModuleManager.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton ModuleManager instance
   *
   * @example
   * ```typescript
   * const moduleManager = ModuleManager.getInstance();
   * ```
   */
  static getInstance() {
    if (!this.Yi) {
      this.Yi = new _ModuleManager();
    }
    return this.Yi;
  }
};
export {
  ModuleManager
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vc3lzdGVtL01vZHVsZU1hbmFnZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQSBzaW5nbGV0b24gbW9kdWxlIG1hbmFnZXIgdGhhdCBoYW5kbGVzIGR5bmFtaWMgbG9hZGluZyBhbmQgbWFuYWdlbWVudCBvZiB2YXJpb3VzIG1vZHVsZXNcbiAqIHN1Y2ggYXMgV2ViR0wsIFdlYkdQVSwgRWZmZWtzZWVyLCBQQlIsIGFuZCBYUiBtb2R1bGVzLlxuICpcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYSBjZW50cmFsaXplZCB3YXkgdG8gbG9hZCBtb2R1bGVzIG9uLWRlbWFuZCBhbmQgcmV0cmlldmUgdGhlbSB3aGVuIG5lZWRlZCxcbiAqIGhlbHBpbmcgdG8gb3B0aW1pemUgYnVuZGxlIHNpemUgYnkgZW5hYmxpbmcgY29kZSBzcGxpdHRpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBNb2R1bGVNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX19pbnN0YW5jZTogTW9kdWxlTWFuYWdlcjtcbiAgcHJpdmF0ZSBfX21vZHVsZXM6IE1hcDxzdHJpbmcsIGFueT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIHByZXR0aWVyL3ByZXR0aWVyICovXG4gIC8qKlxuICAgKiBEeW5hbWljYWxseSBsb2FkcyBhIG1vZHVsZSBieSBuYW1lIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGludGVybmFsIG1vZHVsZSByZWdpc3RyeS5cbiAgICogU3VwcG9ydHMgbG9hZGluZyBXZWJHTCwgV2ViR1BVLCBFZmZla3NlZXIsIFBCUiwgYW5kIFhSIG1vZHVsZXMgd2l0aCBjb2RlIHNwbGl0dGluZy5cbiAgICpcbiAgICogQHBhcmFtIG1vZHVsZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbW9kdWxlIHRvIGxvYWQgKGNhc2UtaW5zZW5zaXRpdmUpLlxuICAgKiAgICAgICAgICAgICAgICAgICAgIFN1cHBvcnRlZCBtb2R1bGVzOiAnd2ViZ2wnLCAnd2ViZ3B1JywgJ2VmZmVrc2VlcicsICdwYnInLCAneHInXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvYmplY3QgZm9yIG1vZHVsZSBsb2FkaW5nXG4gICAqIEBwYXJhbSBvcHRpb25zLndhc20gLSBXQVNNIG1vZHVsZSBVUkksIGN1cnJlbnRseSB1c2VkIG9ubHkgZm9yIEVmZmVrc2VlciBtb2R1bGVcbiAgICogQHBhcmFtIG9wdGlvbnMud2FzbVdlYkdMIC0gV2ViR0wgYmFja2VuZCBXQVNNIG1vZHVsZSBVUkkgZm9yIEVmZmVrc2VlclxuICAgKiBAcGFyYW0gb3B0aW9ucy5uYXRpdmVTY3JpcHRXZWJHTCAtIFdlYkdMIGJhY2tlbmQgbmF0aXZlIHNjcmlwdCBVUkkgZm9yIEVmZmVrc2VlclxuICAgKiBAcGFyYW0gb3B0aW9ucy53YXNtV2ViR1BVIC0gV2ViR1BVIGJhY2tlbmQgV0FTTSBtb2R1bGUgVVJJIGZvciBFZmZla3NlZXJcbiAgICogQHBhcmFtIG9wdGlvbnMubmF0aXZlU2NyaXB0V2ViR1BVIC0gV2ViR1BVIGJhY2tlbmQgbmF0aXZlIHNjcmlwdCBVUkkgZm9yIEVmZmVrc2VlclxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgbG9hZGVkIG1vZHVsZVxuICAgKiBAdGhyb3dzIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIG1vZHVsZSBmYWlscyB0byBsb2FkXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgbW9kdWxlTWFuYWdlciA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICogY29uc3Qgd2ViZ2xNb2R1bGUgPSBhd2FpdCBtb2R1bGVNYW5hZ2VyLmxvYWRNb2R1bGUoJ3dlYmdsJyk7XG4gICAqIGNvbnN0IGVmZmVrc2Vlck1vZHVsZSA9IGF3YWl0IG1vZHVsZU1hbmFnZXIubG9hZE1vZHVsZSgnZWZmZWtzZWVyJywge1xuICAgKiAgIHdhc206ICcvcGF0aC90by9lZmZla3NlZXItd2ViZ2wud2FzbScsXG4gICAqICAgbmF0aXZlU2NyaXB0OiAnL3BhdGgvdG8vZWZmZWtzZWVyLXdlYmdsLmpzJ1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBsb2FkTW9kdWxlKFxuICAgIG1vZHVsZU5hbWU6IHN0cmluZyxcbiAgICBvcHRpb25zPzoge1xuICAgICAgd2FzbT86IHN0cmluZztcbiAgICAgIG5hdGl2ZVNjcmlwdD86IHN0cmluZztcbiAgICAgIHdhc21XZWJHTD86IHN0cmluZztcbiAgICAgIG5hdGl2ZVNjcmlwdFdlYkdMPzogc3RyaW5nO1xuICAgICAgd2FzbVdlYkdQVT86IHN0cmluZztcbiAgICAgIG5hdGl2ZVNjcmlwdFdlYkdQVT86IHN0cmluZztcbiAgICB9XG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgbGV0IG1vZHVsZTogYW55O1xuICAgIGlmIChtb2R1bGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd3ZWJnbCcpIHtcbiAgICAgIGlmICh0eXBlb2YgX19STl9XRUJHTF9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdMX18pIHtcbiAgICAgICAgbW9kdWxlID0gYXdhaXQgKGF3YWl0IGltcG9ydCgvKiB3ZWJwYWNrQ2h1bmtOYW1lOiBcIndlYmdsXCIgKi8gJy4uLy4uL3dlYmdsL21haW4nKSkuZGVmYXVsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignV2ViR0wgc3VwcG9ydCBpcyBkaXNhYmxlZCBpbiB0aGlzIGJ1aWxkIChfX1JOX1dFQkdMX18gPSBmYWxzZSkuJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtb2R1bGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd3ZWJncHUnKSB7XG4gICAgICBpZiAodHlwZW9mIF9fUk5fV0VCR1BVX18gPT09ICd1bmRlZmluZWQnIHx8IF9fUk5fV0VCR1BVX18pIHtcbiAgICAgICAgbW9kdWxlID0gYXdhaXQgKGF3YWl0IGltcG9ydCgvKiB3ZWJwYWNrQ2h1bmtOYW1lOiBcIndlYmdwdVwiICovICcuLi8uLi93ZWJncHUvbWFpbicpKS5kZWZhdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdXZWJHUFUgc3VwcG9ydCBpcyBkaXNhYmxlZCBpbiB0aGlzIGJ1aWxkIChfX1JOX1dFQkdQVV9fID0gZmFsc2UpLicpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobW9kdWxlTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZWZmZWtzZWVyJykge1xuICAgICAgbW9kdWxlID0gYXdhaXQgKGF3YWl0IGltcG9ydCgvKiB3ZWJwYWNrQ2h1bmtOYW1lOiBcImVmZmVrc2VlclwiICovICcuLi8uLi9lZmZla3NlZXIvbWFpbicpKS5FZmZla3NlZXI7XG4gICAgICBtb2R1bGUuRWZmZWtzZWVyQ29tcG9uZW50Lndhc21Nb2R1bGVVcmkgPSBvcHRpb25zPy53YXNtO1xuICAgICAgbW9kdWxlLkVmZmVrc2VlckNvbXBvbmVudC5uYXRpdmVTY3JpcHRVcmkgPSBvcHRpb25zPy5uYXRpdmVTY3JpcHQ7XG4gICAgICBtb2R1bGUuRWZmZWtzZWVyQ29tcG9uZW50Lndhc21Nb2R1bGVVcmlXZWJHTCA9IG9wdGlvbnM/Lndhc21XZWJHTDtcbiAgICAgIG1vZHVsZS5FZmZla3NlZXJDb21wb25lbnQubmF0aXZlU2NyaXB0VXJpV2ViR0wgPSBvcHRpb25zPy5uYXRpdmVTY3JpcHRXZWJHTDtcbiAgICAgIG1vZHVsZS5FZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaVdlYkdQVSA9IG9wdGlvbnM/Lndhc21XZWJHUFU7XG4gICAgICBtb2R1bGUuRWZmZWtzZWVyQ29tcG9uZW50Lm5hdGl2ZVNjcmlwdFVyaVdlYkdQVSA9IG9wdGlvbnM/Lm5hdGl2ZVNjcmlwdFdlYkdQVTtcbiAgICB9IGVsc2UgaWYgKG1vZHVsZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3BicicpIHtcbiAgICAgIG1vZHVsZSA9IGF3YWl0IChhd2FpdCBpbXBvcnQoLyogd2VicGFja0NodW5rTmFtZTogXCJwYnJcIiAqLyAnLi4vLi4vcGJyL21haW4nKSkuZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKG1vZHVsZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3hyJykge1xuICAgICAgbW9kdWxlID0gYXdhaXQgKGF3YWl0IGltcG9ydCgvKiB3ZWJwYWNrQ2h1bmtOYW1lOiBcInhyXCIgKi8gJy4uLy4uL3hyL21haW4nKSkuZGVmYXVsdDtcbiAgICB9XG4gICAgdGhpcy5fX21vZHVsZXMuc2V0KG1vZHVsZU5hbWUsIG1vZHVsZSk7XG4gICAgLy8gTG9nZ2VyLmxvZygnTW9kdWxlIExvYWRlZDonLCBtb2R1bGUpO1xuXG4gICAgcmV0dXJuIG1vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBwcmV2aW91c2x5IGxvYWRlZCBtb2R1bGUgZnJvbSB0aGUgaW50ZXJuYWwgcmVnaXN0cnkuXG4gICAqXG4gICAqIEBwYXJhbSBtb2R1bGVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1vZHVsZSB0byByZXRyaWV2ZVxuICAgKiBAcmV0dXJucyBUaGUgbG9hZGVkIG1vZHVsZSBpZiBmb3VuZCwgdW5kZWZpbmVkIG90aGVyd2lzZVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IG1vZHVsZU1hbmFnZXIgPSBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCk7XG4gICAqIGNvbnN0IHdlYmdsTW9kdWxlID0gbW9kdWxlTWFuYWdlci5nZXRNb2R1bGUoJ3dlYmdsJyk7XG4gICAqIGlmICh3ZWJnbE1vZHVsZSkge1xuICAgKiAgIC8vIFVzZSB0aGUgbW9kdWxlXG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBnZXRNb2R1bGUobW9kdWxlTmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tb2R1bGVzLmdldChtb2R1bGVOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgTW9kdWxlTWFuYWdlci5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBNb2R1bGVNYW5hZ2VyIGluc3RhbmNlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgbW9kdWxlTWFuYWdlciA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKSB7XG4gICAgaWYgKCF0aGlzLl9faW5zdGFuY2UpIHtcbiAgICAgIHRoaXMuX19pbnN0YW5jZSA9IG5ldyBNb2R1bGVNYW5hZ2VyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19pbnN0YW5jZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQU9PLElBQU0sZ0JBQU4sTUFBTSxlQUFjO0FBQUEsRUFHakIsY0FBYztBQUR0QixTQUFRQSxLQUE4QixvQkFBSSxJQUFJO0FBQUEsRUFDdkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUE0QnZCLE1BQU0sV0FDSixZQUNBLFNBUWM7QUFDZCxRQUFJO0FBQ0osUUFBSSxXQUFXLFlBQVksTUFBTSxTQUFTO0FBQ3hDLFVBQUksT0FBTyxpQkFBaUIsZUFBZSxjQUFjO0FBQ3ZELGlCQUFTLE9BQU8sTUFBTTtBQUFBO0FBQUEsVUFBdUM7QUFBQSxRQUFrQixHQUFHO0FBQUEsTUFDcEYsT0FBTztBQUNMLGNBQU0sSUFBSSxNQUFNLGlFQUFpRTtBQUFBLE1BQ25GO0FBQUEsSUFDRixXQUFXLFdBQVcsWUFBWSxNQUFNLFVBQVU7QUFDaEQsVUFBSSxPQUFPLGtCQUFrQixlQUFlLGVBQWU7QUFDekQsaUJBQVMsT0FBTyxNQUFNO0FBQUE7QUFBQSxVQUF3QztBQUFBLFFBQW1CLEdBQUc7QUFBQSxNQUN0RixPQUFPO0FBQ0wsY0FBTSxJQUFJLE1BQU0sbUVBQW1FO0FBQUEsTUFDckY7QUFBQSxJQUNGLFdBQVcsV0FBVyxZQUFZLE1BQU0sYUFBYTtBQUNuRCxlQUFTLE9BQU8sTUFBTTtBQUFBO0FBQUEsUUFBMkM7QUFBQSxNQUFzQixHQUFHO0FBQzFGLGFBQU8sbUJBQW1CLGdCQUFnQixtQ0FBUztBQUNuRCxhQUFPLG1CQUFtQixrQkFBa0IsbUNBQVM7QUFDckQsYUFBTyxtQkFBbUIscUJBQXFCLG1DQUFTO0FBQ3hELGFBQU8sbUJBQW1CLHVCQUF1QixtQ0FBUztBQUMxRCxhQUFPLG1CQUFtQixzQkFBc0IsbUNBQVM7QUFDekQsYUFBTyxtQkFBbUIsd0JBQXdCLG1DQUFTO0FBQUEsSUFDN0QsV0FBVyxXQUFXLFlBQVksTUFBTSxPQUFPO0FBQzdDLGVBQVMsT0FBTyxNQUFNO0FBQUE7QUFBQSxRQUFxQztBQUFBLE1BQWdCLEdBQUc7QUFBQSxJQUNoRixXQUFXLFdBQVcsWUFBWSxNQUFNLE1BQU07QUFDNUMsZUFBUyxPQUFPLE1BQU07QUFBQTtBQUFBLFFBQW9DO0FBQUEsTUFBZSxHQUFHO0FBQUEsSUFDOUU7QUFDQSxTQUFLQSxHQUFVLElBQUksWUFBWSxNQUFNO0FBR3JDLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFpQkEsVUFBVSxZQUFvQjtBQUM1QixXQUFPLEtBQUtBLEdBQVUsSUFBSSxVQUFVO0FBQUEsRUFDdEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhQSxPQUFPLGNBQWM7QUFDbkIsUUFBSSxDQUFDLEtBQUtDLElBQVk7QUFDcEIsV0FBS0EsS0FBYSxJQUFJLGVBQWM7QUFBQSxJQUN0QztBQUVBLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fbW9kdWxlcyIsICJfX2luc3RhbmNlIl0KfQo=
