import * as Rn from './import';

// Named exports let bundlers tree-shake what an application does not use:
//   import { Engine, Vector3 } from 'rhodonite';
export * from './import';

// The `Rn` namespace stays the default export for compatibility (`import Rn from 'rhodonite'`).
// Using it keeps every export in the bundle.
export default Rn;
