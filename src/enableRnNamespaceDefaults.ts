import { registerGizmos } from './foundation/gizmos/registerGizmos';
import { Engine } from './foundation/system/Engine';

/**
 * Turns on the optional features that the default `Rn` namespace export has always provided, and returns the
 * namespace unchanged.
 *
 * @remarks
 * `index.ts` passes the namespace through this function to create its default export. The call is marked pure, so
 * applications that use only named imports never evaluate it and their bundler drops what it pulls in (every gizmo
 * class, and the XR module that `Engine.init` would otherwise load). Using the default export
 * (`import Rn from 'rhodonite'`, or the IIFE build) evaluates it, so such applications keep working without calling
 * `registerGizmos()` or passing `xr: true` to `Engine.init` themselves.
 *
 * @internal
 */
export function enableRnNamespaceDefaults<T>(rnNamespace: T): T {
  registerGizmos();
  Engine._loadXRByDefault = true;
  return rnNamespace;
}
