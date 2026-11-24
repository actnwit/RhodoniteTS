/**
 * Build-time flags that an application's bundler may define to drop the shaders of a rendering backend it does
 * not use. Both are undefined in the published package, which keeps the shaders of both backends.
 *
 * @example
 * ```js
 * // vite.config.js of a WebGL2-only application
 * export default { define: { __RN_WEBGPU__: false } };
 * ```
 *
 * Source code must test a flag inline, as `typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__`, so that the
 * bundler folds the expression after substituting the flag and drops the import it guards.
 */
declare const __RN_WEBGL__: boolean | undefined;
declare const __RN_WEBGPU__: boolean | undefined;
