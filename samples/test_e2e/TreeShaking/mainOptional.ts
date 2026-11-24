// Bundled to check that the optional material factories remain available through the
// 'rhodonite/optional-materials' subpath. The page never loads this bundle.
import { createMToon1Material } from 'rhodonite/optional-materials';

declare const window: any;

window._createMToon1Material = createMToon1Material;
