import type { CGAPIResourceHandle } from '../../types/CommonTypes';
import { TextureParameter, type TextureParameterEnum } from '../definitions';
import type { Engine } from '../system/Engine';

/**
 * Descriptor object for configuring a texture sampler.
 */
export type SamplerDescriptor = {
  /** Minification filter mode for texture sampling */
  minFilter: TextureParameterEnum;
  /** Magnification filter mode for texture sampling */
  magFilter: TextureParameterEnum;
  /** Texture wrapping mode for S coordinate */
  wrapS: TextureParameterEnum;
  /** Texture wrapping mode for T coordinate */
  wrapT: TextureParameterEnum;
  /** Texture wrapping mode for R coordinate (optional) */
  wrapR?: TextureParameterEnum;
  /** Whether to enable anisotropic filtering (optional) */
  anisotropy?: boolean;
  /** Whether to enable shadow comparison mode (optional) */
  shadowCompareMode?: boolean;
};

/**
 * Represents a texture sampler that defines how textures are sampled during rendering.
 * A sampler encapsulates filtering and wrapping parameters for texture sampling operations.
 */
export class Sampler {
  private __engine: Engine;
  private __minFilter: TextureParameterEnum;
  private __magFilter: TextureParameterEnum;
  private __wrapS: TextureParameterEnum;
  private __wrapT: TextureParameterEnum;
  private __wrapR: TextureParameterEnum;
  private __anisotropy: boolean;
  private __shadowCompareMode: boolean;
  private __samplerResourceUid: CGAPIResourceHandle = -1;

  /**
   * Creates a new Sampler instance with the specified configuration.
   * @param desc - The sampler descriptor containing filtering and wrapping parameters
   */
  constructor(engine: Engine, desc: SamplerDescriptor) {
    this.__engine = engine;
    this.__minFilter = desc.minFilter;
    this.__magFilter = desc.magFilter;
    this.__wrapS = desc.wrapS;
    this.__wrapT = desc.wrapT;
    this.__wrapR = desc.wrapR ?? TextureParameter.Repeat;
    this.__anisotropy = desc.anisotropy ?? true;
    this.__shadowCompareMode = desc.shadowCompareMode ?? false;
  }

  /**
   * Creates the underlying graphics API sampler resource.
   * This method must be called before the sampler can be used for rendering.
   */
  create() {
    const webGLResourceRepository = this.__engine.cgApiResourceRepository;
    this.__samplerResourceUid = webGLResourceRepository?.createTextureSampler({
      minFilter: this.__minFilter,
      magFilter: this.__magFilter,
      wrapS: this.__wrapS,
      wrapT: this.__wrapT,
      wrapR: this.__wrapR,
      anisotropy: this.__anisotropy,
      shadowCompareMode: this.__shadowCompareMode,
    });
  }

  /**
   * Checks whether the sampler resource has been created.
   * @returns True if the sampler has been created, false otherwise
   */
  get created(): boolean {
    return this.__samplerResourceUid !== -1;
  }

  /**
   * Gets the minification filter mode used when the texture is scaled down.
   * @returns The minification filter parameter
   */
  get minFilter(): TextureParameterEnum {
    return this.__minFilter;
  }

  /**
   * Gets the magnification filter mode used when the texture is scaled up.
   * @returns The magnification filter parameter
   */
  get magFilter(): TextureParameterEnum {
    return this.__magFilter;
  }

  /**
   * Gets the texture wrapping mode for the S (horizontal) coordinate.
   * @returns The S-coordinate wrapping parameter
   */
  get wrapS(): TextureParameterEnum {
    return this.__wrapS;
  }

  /**
   * Gets the texture wrapping mode for the T (vertical) coordinate.
   * @returns The T-coordinate wrapping parameter
   */
  get wrapT(): TextureParameterEnum {
    return this.__wrapT;
  }

  /**
   * Gets the texture wrapping mode for the R (depth) coordinate.
   * @returns The R-coordinate wrapping parameter
   */
  get wrapR(): TextureParameterEnum {
    return this.__wrapR;
  }

  /**
   * Gets the internal sampler resource handle used by the graphics API.
   * @returns The sampler resource UID
   * @internal
   */
  get _samplerResourceUid(): CGAPIResourceHandle {
    return this.__samplerResourceUid;
  }

  /**
   * Destroys the sampler resource and resets its internal state.
   * This invalidates the sampler resource UID, allowing it to be recreated.
   * @internal Called from Engine.destroy() or texture cleanup
   */
  destroy() {
    this.__samplerResourceUid = -1;
  }
}

const __sharedSamplers = new WeakMap<Engine, Map<string, Sampler>>();

/**
 * Returns a sampler shared per engine for the given descriptor, creating it on first use.
 *
 * Use this for default samplers that are set on many materials. Creating a new Sampler per material
 * creates one GPU sampler object per material, and the renderer then has to rebind the sampler on
 * every draw because no two consecutive materials share one. Samplers are immutable after creation,
 * so sharing them is safe.
 *
 * @param engine - The engine that owns the sampler
 * @param desc - The sampler descriptor
 * @returns The shared sampler (already created)
 * @internal
 */
export function getSharedSampler(engine: Engine, desc: SamplerDescriptor): Sampler {
  let samplers = __sharedSamplers.get(engine);
  if (samplers == null) {
    samplers = new Map();
    __sharedSamplers.set(engine, samplers);
  }
  const key = [
    desc.minFilter.index,
    desc.magFilter.index,
    desc.wrapS.index,
    desc.wrapT.index,
    desc.wrapR?.index ?? -1,
    desc.anisotropy ?? -1,
    desc.shadowCompareMode ?? -1,
  ].join(',');
  let sampler = samplers.get(key);
  if (sampler == null) {
    sampler = new Sampler(engine, desc);
    samplers.set(key, sampler);
  }
  if (!sampler.created) {
    // Also re-creates the GPU resource after destroy() reset it.
    sampler.create();
  }
  return sampler;
}
