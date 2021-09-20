/// importing ///

/**
 * TypeScript source code version
 */
// import Rn from '../src';

/**
 * ESM (CommonJS Wrapped) version.
 * You will use this when you installed RhodoniteTS as the npm package.
 */
import Rn from '../dist/esm';

// importing the source code version of Rhodonite object for type annotations
import RnForType from '../src/index';

// Change the TypeScript type of Rhodonite,
//   from `typeof Rn` (ESM built index.d.ts)
//   to `typeof RnForType` (TypeScript source codes).
// This is for code editing convinience.
// You can jump to the source code definition of Rhodonite Object Types easily in your source code editor.
export default Rn as unknown as typeof RnForType; // type Rn = typeof RnForType;
