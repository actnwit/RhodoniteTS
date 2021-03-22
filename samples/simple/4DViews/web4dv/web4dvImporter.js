// **********************************************************
//
// WEB4DV
// rhodonite.js plug-in for 4Dviews volumetric video sequences
// with referenced to THREE.js plug-in for 4Dviews volumetric video sequences
//
//
//
// THREE.js plug-in for 4Dviews volumetric video sequences
//
// Version: 3.0.0
// Release date: 18-December 2020
//
// Copyright: 4D View Solutions SAS
// Authors: M.Adam & T.Groubet
//
//
// **********************************************************

import {default as ResourceManagerXHR, Decoder4D} from './web4dvResource.js';
import AudioPlayer from './audioPlayer.js';

// 4Dviews variables
const resourceManager = new ResourceManagerXHR();

// MAIN CLASS MANAGING A 4DS
export default class WEB4DS {
  constructor(id, urlD, urlM, urlA, position, gl) {
    // properties
    this.id = id;  // unique id
    this.urlD = urlD;  // url Desktop format
    this.urlM = urlM;  // url Mobile format
    this.urlA = urlA;  // url Audio
    this.position = position;
    this.gl = gl;
    this.glAstcExtension = this.gl.getExtension('WEBGL_compressed_texture_astc');

    // Rhodonite objects
    const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
    cameraComponent.zNear = 0.1;
    cameraComponent.zFar = 1000.0;
    cameraComponent.setFovyAndChangeFocalLength(50.0);

    this.renderPass = new Rn.RenderPass();
    this.renderPass.cameraComponent = cameraComponent;
    this.expression = new Rn.Expression();
    this.expression.addRenderPasses([this.renderPass]);

    this.entity4D = null;
    this.primitive = null;
    this.material4D = null;
    this.texture4D = null;
    this.isDrawing = false;
    this.targetingEntity4DByCameraController();

    this.textureSizeX = 0;
    this.textureSizeY = 0;

    // Options
    this.showPlaceholder = false;
    this.playOnload = true;

    // Status
    this.isLoaded = false;
    this.isPlaying = false;
    this.isAudioPlaying = false;
    this.wasPlaying = true;
    this.isDecoding = false;
    this.isMuted = false;

    // Audio
    this.audioPlayer = new AudioPlayer();

    this.audioStartOffset = 0;
    this.audioStartTime = 0;
    this.audioPassedTime = 0;
    this.audioLevel = null;

    // Loop
    this.playbackLoop = null;
    this.decodeLoop = null;

    this.firstChunks = false;

    this.currentMesh = null;
    this.currentFrame = null;

    this.meshesCache = [];
  }

  targetingEntity4DByCameraController() {
    // create target entity of camera
    const primitiveSphere = new Rn.Sphere();
    primitiveSphere.generate({
      radius: 1.5,
      widthSegments: 3,
      heightSegments: 3
    });

    const meshSphere = new Rn.Mesh();
    meshSphere.addPrimitive(primitiveSphere);

    const repo = Rn.EntityRepository.getInstance();
    const entityCameraTarget = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    const meshComponentCameraTarget = entityCameraTarget.getMesh();
    meshComponentCameraTarget.setMesh(meshSphere);
    // this.renderPass.addEntities([entityCameraTarget]);

    // targeting of camera controller component
    const cameraEntity = this.renderPass.cameraComponent.entity;
    const cameraControllerComponent = cameraEntity.getCameraController();

    const controller = cameraControllerComponent.controller;
    controller.setTarget(entityCameraTarget);
  }

  initSequence(maxVertices, maxTriangles, textureSizeX, textureSizeY, modelPosition) {
    if (this.entity4D) {
      return;
    }
    // create 4Dview entity
    this.material4D = Rn.MaterialHelper.createClassicUberMaterial({
      additionalName: 'mesh4D_' + this.id, isMorphing: false, isSkinning: false, isLighting: false
    });

    this.primitive = new Rn.Primitive();
    this.primitive.material = this.material4D;

    // set tmp accessors
    const positionAccessor = this.createAttributeAccessor(new Float32Array(3 * maxVertices).buffer, Rn.ComponentType.Float, Rn.CompositionType.Vec3, "position_" + this.id);
    const normalAccessor = this.createAttributeAccessor(new Float32Array(3 * maxVertices).buffer, Rn.ComponentType.Float, Rn.CompositionType.Vec3, "normal_" + this.id);
    const texcoordAccessor = this.createAttributeAccessor(new Float32Array(2 * maxVertices).buffer, Rn.ComponentType.Float, Rn.CompositionType.Vec2, "texcoord0_" + this.id);
    const indicesAccessor = this.createAttributeAccessor(new Uint32Array(3 * maxTriangles).buffer, Rn.ComponentType.UnsignedInt, Rn.CompositionType.Scalar, "indices_" + this.id);

    const attributeMap = new Map();
    attributeMap.set(Rn.VertexAttribute.Position, positionAccessor);
    attributeMap.set(Rn.VertexAttribute.Normal, normalAccessor);
    attributeMap.set(Rn.VertexAttribute.Texcoord0, texcoordAccessor);
    this.primitive.setData(attributeMap, Rn.PrimitiveMode.Triangles, this.material4D, indicesAccessor);
    this.isDrawing = true;


    const mesh4D = new Rn.Mesh();
    mesh4D.addPrimitive(this.primitive);

    const repo = Rn.EntityRepository.getInstance();
    this.entity4D = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    const meshComponent4D = this.entity4D.getMesh();
    meshComponent4D.setMesh(mesh4D);

    const transformComponent4D = this.entity4D.getTransform();
    const tmpVec3 = Rn.MutableVector3.zero();
    transformComponent4D.translate = tmpVec3.setComponents(...modelPosition);
    transformComponent4D.rotate = tmpVec3.setComponents(-Math.PI / 2, 0.0, 0.0);

    this.renderPass.addEntities([this.entity4D]);

    this.texture4D = new Rn.Texture();
    this.material4D.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, this.texture4D);


    this.textureSizeX = textureSizeX;
    this.textureSizeY = textureSizeY;
  }

  // methods
  load(showPlaceholder, playOnload, callback) {
    if (!this.isLoaded) {
      this.showPlaceholder = showPlaceholder;
      this.playOnload = playOnload;

      if (this.glAstcExtension) {
        resourceManager.set4DSFile(this.urlM);
        Decoder4D.SetInputTextureEncoding(164);
      } else {
        resourceManager.set4DSFile(this.urlD);
        Decoder4D.SetInputTextureEncoding(100);
      }

      resourceManager.Open(() => {
        const si = resourceManager._sequenceInfo;

        this.initSequence(si.MaxVertices, si.MaxTriangles, si.TextureSizeX, si.TextureSizeY, this.position);  // Get sequence information

        this.Decode();  // Start decoding, downloading

        this.loadAudio(this.urlA);

        const waiter = setInterval(() => {
          if (this.meshesCache.length >= Decoder4D._maxCacheSize) {
            clearInterval(waiter);  // Stop the waiter loop

            if (showPlaceholder === true) { // Placeholder equals frame 0
              resourceManager.seek(0);

              // Display the frame 0
              const placeholder = this.meshesCache.shift();
              this.updateSequenceMesh(placeholder.GetVertices(), placeholder.GetFaces(), placeholder.GetUVs(), placeholder.GetNormals(), placeholder.GetTexture(), placeholder.nbVertices, placeholder.nbFaces);

            } else { // Else, play sequence
              if (this.playOnload === true || this.playOnload == null)
                this.play();
              else
                alert('sequence is ready | showPlaceholder: ' + this.showPlaceholder + ' | playOnload: ' + this.playOnload);
            }
            document.getElementById('btnLoad').disabled = false;
          }
        }, 0.1);

        this.isLoaded = true;
        if (callback) {
          callback();
        }
      });
    } else {
      alert('A sequence is already loaded. One sequence at a time.');
    }
  }

  updateSequenceMesh(posBuffer, indexBuffer, UVBuffer, normalBuffer, textureBuffer, nbVerts, nbFaces) {
    /* update the buffers */
    const positionAccessor = this.createAttributeAccessor(new Float32Array(posBuffer).buffer, Rn.ComponentType.Float, Rn.CompositionType.Vec3, "position_" + this.id);
    const normalAccessor = this.createAttributeAccessor(new Float32Array(normalBuffer).buffer, Rn.ComponentType.Float, Rn.CompositionType.Vec3, "normal_" + this.id);
    const texcoordAccessor = this.createAttributeAccessor(new Float32Array(UVBuffer).buffer, Rn.ComponentType.Float, Rn.CompositionType.Vec2, "texcoord0_" + this.id);
    const indicesAccessor = this.createAttributeAccessor(new Uint32Array(indexBuffer).buffer, Rn.ComponentType.UnsignedInt, Rn.CompositionType.Scalar, "indices_" + this.id);

    const attributeMap = new Map();
    attributeMap.set(Rn.VertexAttribute.Position, positionAccessor);
    attributeMap.set(Rn.VertexAttribute.Normal, normalAccessor);
    attributeMap.set(Rn.VertexAttribute.Texcoord0, texcoordAccessor);
    this.primitive.setData(attributeMap, Rn.PrimitiveMode.Triangles, this.material4D, indicesAccessor);

    this.isDrawing = true;


    /* update the texture */
    const si = resourceManager._sequenceInfo;
    if (si.TextureEncoding === 164) {  // astc
      this.texture4D.generateCompressedTextureFromTypedArray(
        textureBuffer,
        this.textureSizeX,
        this.textureSizeY,
        Rn.CompressionTextureType.ASTC_RGBA_8x8
      );
    } else if (si.TextureEncoding === 100) {  // dxt
      this.texture4D.generateCompressedTextureFromTypedArray(
        textureBuffer,
        this.textureSizeX,
        this.textureSizeY,
        Rn.CompressionTextureType.S3TC_RGB_DXT1
      );
    } else {  // rgba
      this.texture4D.generateTextureFromTypedArray(textureBuffer);
    }
  }

  createAttributeAccessor(
    arrayBuffer,
    componentType,
    compositionType,
    bufferName
  ) {

    const accessorCount = arrayBuffer.byteLength / compositionType.getNumberOfComponents() / componentType.getSizeInBytes();

    const attributeBuffer = new Rn.Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: bufferName,
      byteAlign: 4
    });
    const attributeBufferView = attributeBuffer.takeBufferView({
      byteLengthToNeed: arrayBuffer.byteLength,
      byteStride: 0,
      isAoS: false,
    });
    const attributeAccessor = attributeBufferView.takeAccessor({
      compositionType,
      componentType,
      count: accessorCount
    });

    return attributeAccessor;
  }

  // Decode 4D Sequence
  Decode() {
    const decodeLoopTime = 1000.0 / (resourceManager._sequenceInfo.FrameRate * 3);

    /* Download a first pack of chunks at sequence init, bigger than the next ones */
    if (this.firstChunks === false) {
      if ((Decoder4D._keepChunksInCache === false && Decoder4D._chunks4D.length < resourceManager._sequenceInfo.NbFrames * 2)) {

        if (this.showPlaceholder === true) {
          resourceManager._internalCacheSize = 2000000; // 2 Mo (1 frame 2880p)
          Decoder4D._maxCacheSize = 1; // 1 frame
        } else {
          resourceManager._internalCacheSize = 20000000;  // 20 Mo
          Decoder4D._maxCacheSize = 20; // 20 frames
        }

        resourceManager.getBunchOfChunks();

        console.log('downloading first chunks');
      }

      this.firstChunks = true;
    }

    /* Decoding loop, 3*fps */
    this.decodeLoop = setInterval(() => {

      /* Do not decode if enough meshes in cache */
      if (
        Decoder4D._keepChunksInCache === true &&
        this.meshesCache.length >= this.sequenceLength
      ) {
        return;
      } else if (this.meshesCache.length >= Decoder4D._maxCacheSize) {
        return;
      }

      /* Decode chunk */
      const newMesh = Decoder4D.DecodeChunk();

      /* If a few chunks, download more */
      if (Decoder4D._chunks4D.length < 300 || (Decoder4D._keepChunksInCache === true && Decoder4D._chunks4D.length < resourceManager._sequenceInfo.NbFrames * 2)) {
        resourceManager._internalCacheSize = 6000000;  // 6 Mo

        if (this.showPlaceholder === false || this.showPlaceholder == null) {
          resourceManager.getBunchOfChunks();
        }
      }

      /* If mesh is decoded, we stock it */
      if (newMesh) {
        this.meshesCache.push(newMesh);
        //                 alert("stop");
      } else {
        // console.log('pas de mesh')
      }

    }, decodeLoopTime);

    this.isDecoding = true;
  }

  // For now, will pause any WEB4DV object created (function is generic)
  pause() {
    this.isPlaying = false;
    this.isDrawing = false;

    clearInterval(this.playbackLoop);

    if (this.meshesCache >= Decoder4D._maxCacheSize) {
      clearInterval(this.decodeLoop);
      this.isDecoding = false;
    }

    this.pauseAudio();
  }

  // For now, will play any WEB4DV object created (function is generic)
  play() {
    if (this.isPlaying) {  // If sequence is already playing, do nothing
      return;
    }

    if (!this.isDecoding) {  // If not decoding, decode
      this.Decode();
    }

    const dt = 1000.0 / resourceManager._sequenceInfo.FrameRate;

    this.playbackLoop = setInterval(() => {
      const mesh = this.meshesCache.shift();  // get first mesh from cache

      if (mesh) {
        /* update buffers for rendering */
        this.updateSequenceMesh(mesh.GetVertices(), mesh.GetFaces(), mesh.GetUVs(), mesh.GetNormals(), mesh.GetTexture(), mesh.nbVertices, mesh.nbFaces);

        if (this.currentMesh) {
          this.currentMesh.delete();
        }

        this.currentMesh = mesh;

        if (!this.isMuted) {
          if (this.audioPlayer.isLoaded) {
            if (mesh.frame === 0) {
              this.restartAudio();
            }

            if (
              (this.audioStartOffset + this.audioPassedTime) % this.audioPlayer.duration >
              (mesh.frame / resourceManager._sequenceInfo.FrameRate)
            ) {
              console.log(`Audio Time: ${this.audioStartOffset + this.audioPassedTime}  - sequence time:  ${mesh.frame / resourceManager._sequenceInfo.FrameRate}`);
              this.pauseAudio();
            } else {
              this.playAudio();
              this.audioPassedTime = this.audioPlayer.currentTime - this.audioStartTime;
            }
          }
        }

        if (!this.wasPlaying) {
          this.pauseSequence();
          this.wasPlaying = true;
        }

        this.currentFrame = mesh.frame;
      } else if (!this.isMuted) {
        /* There is no mesh to be displayed YET, pause audio */
        this.pauseAudio();
      }
    }, dt);

    this.isPlaying = true;
    this.isDrawing = true;
  }

  loadAudio(audioFile) {
    this.audioPlayer.volume = 0.5;
    if (audioFile !== '') {
      console.log(`loading audio file: ${audioFile}`);
      this.audioPlayer.loadPromise(audioFile);

    } else if (Array.isArray(resourceManager._audioTrack) && resourceManager._audioTrack.length > 0) {
      console.log('loading internal audio ');
      this.audioPlayer.audioContext.decodeAudioData(resourceManager._audioTrack, (audioBuffer) => {
        this.audioPlayer.audioBuffer = audioBuffer;
      });
    }
  }

  playAudio() {
    if (this.isAudioPlaying === false) {
      this.audioStartOffset = this.currentFrame / resourceManager._sequenceInfo.FrameRate;
      this.audioPlayer.startAt(this.audioStartOffset);
      console.log(`start audio at time ${this.audioStartOffset} ; ${this.audioPlayer.currentTime}`);
      this.isAudioPlaying = true;
      this.audioStartTime = this.audioPlayer.currentTime;
    }
  }

  pauseAudio() {
    if (this.isAudioPlaying === true) {
      this.audioPlayer.stop();
      this.isAudioPlaying = false;
    }
  }

  restartAudio() {
    console.log('restart audio playback');
    this.isAudioPlaying = false;
    this.audioPassedTime = 0;

    this.audioPlayer.stop();
    this.playAudio();
  }

  // For now, will mute any WEB4DV object created (function is generic)
  mute() {
    this.audioLevel = this.audioPlayer.volume;
    console.log(`volume will be set back at:${this.audioLevel}`);

    this.audioPlayer.volume = 0;
    this.isMuted = true;
  }

  // For now, will unmute any WEB4DV object created (function is generic)
  unmute() {
    this.isMuted = false;

    if (this.audioLevel) {
      this.audioPlayer.volume = this.audioLevel;
    } else {
      this.audioPlayer.volume = 0.5;
    }
  }

  keepsChunksInCache(booleanVal) {
    Decoder4D._keepChunksInCache = booleanVal;
  }

  destroy(callback) {
    document.getElementById('btnLoad').disabled = true;

    clearInterval(this.playbackLoop);
    clearInterval(this.decodeLoop);
    // clearInterval(renderLoop); // No more needed: renderLoop is managed outside

    if (this.audioPlayer) {
      this.audioPlayer.stop();
      this.audioPlayer.audioBuffer = null;

      this.audioStartTime = 0;
      this.audioStartOffset = 0;
      this.audioPassedTime = 0;
    }

    resourceManager.reinitResources();

    this.isLoaded = false;
    this.isPlaying = false;
    this.isDecoding = false;
    this.isAudioPlaying = false;
    this.firstChunks = false;

    this.currentMesh = null;

    Decoder4D._chunks4D.forEach((element) => {
      element.delete();
    });
    this.meshesCache.forEach((element) => {
      element.delete();
    });

    this.meshesCache = [];
    Decoder4D._chunks4D = [];

    // Decoder4D.Destroy(); //No more needed: there is always an instance running

    // Reset Sequence Infos
    this.currentFrame = 0;
    Decoder4D._decodedFrames = [];

    // Callback
    if (callback) {
      callback();
    }
  }

}
