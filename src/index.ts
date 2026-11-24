import { enableRnNamespaceDefaults } from './enableRnNamespaceDefaults';
import * as RnNamespace from './import';

// Named exports let bundlers tree-shake what an application does not use:
//   import { Engine, Vector3 } from 'rhodonite';
// Optional features such as gizmos are then enabled explicitly (e.g. registerGizmos()).
export * from './import';

// The `Rn` namespace stays the default export for compatibility (`import Rn from 'rhodonite'`). Using it keeps
// every export in the bundle and enables the optional features. The call is bound to the default export (not a
// separate statement) so that bundlers which resolve `Rn.X` straight to the re-exported module still evaluate it.
const Rn = /*#__PURE__*/ enableRnNamespaceDefaults(RnNamespace);
export default Rn;
