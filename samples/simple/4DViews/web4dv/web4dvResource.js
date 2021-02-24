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


import {default as Module} from './CODEC.js'
var ModuleInstance

class Decoder {
  constructor() {
    this._codecInstance = null
    this._decodedFrames = []
    this._chunks4D = []
    this._curChunkIndex = 0
    this._keepChunksInCache = false
    this._maxCacheSize = 20
  }

  Destroy() {
    if (typeof this._codecInstance !== 'undefined') {
      this._codecInstance.delete()
      this._codecInstance = null
    }
  }

  SetInputTextureEncoding(encoding) {
    if (!this._codecInstance) return
    this._codecInstance.SetTextureEncoding(164)
  }

  DecodeChunk() {
    let chunk4D

    if (this._keepChunksInCache) {
      chunk4D = this._chunks4D[this._curChunkIndex]
      if (this._curChunkIndex < this._chunks4D.length) {
        this._curChunkIndex++
      } else {
        this._curChunkIndex = 0
      }
    } else {
      chunk4D = this._chunks4D.shift()
    }

    if (chunk4D) {
      const mesh4D = this._codecInstance.AddChunk(chunk4D)

      if (!this._keepChunksInCache) {
        chunk4D.delete()
        chunk4D = null
      } else if (this._curChunkIndex >= this._chunks4D.length) {
        this._curChunkIndex = 0
      }

      if (mesh4D !== null) {
        if (this._keepChunksInCache === false) {
          if (this._decodedFrames.length > (this._maxCacheSize + 1)) {
            this._decodedFrames = []
          }

          if (mesh4D.frame < this._maxCacheSize) {
            this._decodedFrames.push(mesh4D.frame)
          } else {
            this._decodedFrames.shift()
            this._decodedFrames.push(mesh4D.frame)
          }
        } else if (this._keepChunksInCache === true) {
          if (this._decodedFrames.includes(mesh4D.frame)) {
            // do nothing
          } else {
            this._decodedFrames.push(mesh4D.frame)
          }
        }
      }

      return mesh4D
    } else {
      // console.log('there is NO chunk4D');
      return null
    }
  }
}

export const Decoder4D = new Decoder()

//wait Module loaded promise to create the instance
Module().then((instance) => {
  if (!Decoder4D._codecInstance) {
    Decoder4D._codecInstance = new instance.LinearEBD4DVDecoder()
    ModuleInstance = instance
    console.log('Codec Instance Created')
  }
})


class BlocInfo {
  constructor(keyFrameId, nbInterFrames, blocChunkPos) {
    this.KeyFrameId = keyFrameId
    this.NbInterFrames = nbInterFrames
    this.BlocChunkPos = blocChunkPos
  }
}

export default class ResourceManagerXHR {
  constructor() {
    this._internalCacheSize = 20000000

    this._sequenceInfo = {
      NbFrames: 0,
      NbBlocs: 0,
      FrameRate: 0,
      MaxVertices: 0,
      MaxTriangles: 0,
      TextureEncoding: 0,
      TextureSizeX: 0,
      TextureSizeY: 0,
      NbAdditionalTracks: 0,
    }

    this._pointerToSequenceInfo = 0
    this._pointerToBlocIndex = 0
    this._pointerToTrackIndex = 0

    this._blocInfos = []
    this._KFPositions = []
    this._currentBlocIndex = 0
    this._firstBlocIndex = 0
    this._lastBlocIndex = 0

    this._tracksPositions = []
    this._audioTrack = []

    this._isInitialized = false
    this._isDownloading = false

    this._file4ds = ''
  }

  Open(callbackFunction) {
    this._callback = callbackFunction

    this.getFileHeader()
  }


  fetchBuffer(firstByte, lastByte) {
    const headers = new Headers();
    headers.append('Range', `bytes=${firstByte}-${lastByte}`)

    return fetch(this._file4ds, {
      method: 'GET',
      mode: 'cors',
      headers
    });
  }

  getOneChunk(position) {
    const parent = this

    this.fetchBuffer(position, position + 9).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        const headerChunk = arraybuffer

        const dv = new DataView(headerChunk)
        const type = dv.getUint8(0, true)
        const codec = dv.getUint16(1, true)
        const version = dv.getUint16(3, true)
        const chunkSize = dv.getUint32(5, true)

        const chunkHeader = {Type: type, Codec: codec, Version: version, Size: chunkSize}

        // console.log(`type = ${chunkHeader.Type}`);
        // console.log(`codec = ${chunkHeader.Codec}`);
        // console.log(`version = ${chunkHeader.Version}`);
        // console.log(`chunkSize = ${chunkHeader.Size}`);

        if (chunkHeader.Type === 1) {
          parent.getSequenceInfo(position + 9, chunkHeader.Size)
        } else if (chunkHeader.Type === 2) {
          parent.getTracksIndexes(position + 9, chunkHeader.Size)
        } else if (chunkHeader.Type === 3) {
          parent.getBlocsInfos(position + 9, chunkHeader.Size)
        } else if (chunkHeader.Type === 21) {
          parent.getAudioTrack(position + 9, chunkHeader.Size)
        } else {
          parent.getChunkData(position + 9, chunkHeader.Size)
        }
      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  getBunchOfChunks(onLoadCallback) {
    if (!this._isInitialized) {
      console.log('reading 4ds error: fetch not initalized')
      return
    }

    if (this._isDownloading) {
      return
    }
    this._isDownloading = true

    const pos0 = this._KFPositions[this._currentBlocIndex]
    let pos1 = pos0

    while ((pos1 - pos0) < this._internalCacheSize && ++this._currentBlocIndex <= this._lastBlocIndex) {
      pos1 = this._KFPositions[this._currentBlocIndex]
    }

    // reset if end of file
    if (this._currentBlocIndex > this._lastBlocIndex) {
      if (this._lastBlocIndex === this._sequenceInfo.NbBlocs - 1) {
        pos1 = this._pointerToBlocIndex
      } else {
        pos1 = this._KFPositions[this._currentBlocIndex]
      }
      this._currentBlocIndex = this._firstBlocIndex
    }

    let memorySize = (pos1 - pos0)

    const parent = this
    this.fetchBuffer(pos0, pos1).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        const dv = new DataView(arraybuffer)
        let dataPtr = 0
        while (memorySize > 0) {
          // extract a chunk

          const chunkSize = dv.getUint32(dataPtr + 5, true)

          const cdataArray = new Uint8Array(arraybuffer, dataPtr + 9, chunkSize)
          // const cdataArray = new Uint8Array(arraybuffer.slice(dataPtr + 9, dataPtr + 9 + chunkSize), 0, chunkSize)

          const chunk4D = new ModuleInstance.Chunk(dv.getUint8(dataPtr, true), dv.getUint16(dataPtr + 1, true), dv.getUint16(dataPtr + 3, true), chunkSize, cdataArray)

          dataPtr += 9 + chunkSize
          memorySize -= (9 + chunkSize)

          if (chunk4D.type === 10 || chunk4D.type === 11 || chunk4D.type === 12) {
            if (!Decoder4D._keepChunksInCache || Decoder4D.chunks4D.length < parent._sequenceInfo.NbFrames * 2) {
              Decoder4D._chunks4D.push(chunk4D)
            } else {
              console.log(`nbframes = ${parent._sequenceInfo.NbFrames}`)
            }
          } else {
            //console.log(`chunk4D type = ${chunk4D.type}`)
          }
        }

        // Chunks downloaded
        parent._isDownloading = false


      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  reinitResources() {
    this._sequenceInfo = {
      NbFrames: 0,
      NbBlocs: 0,
      FrameRate: 0,
      MaxVertices: 0,
      MaxTriangles: 0,
      TextureEncoding: 0,
      TextureSizeX: 0,
      TextureSizeY: 0,
      NbAdditionalTracks: 0,
    }

    this._blocInfos = []
    this._KFPositions = []
    this._currentBlocIndex = 0
    this._firstBlocIndex = 0
    this._lastBlocIndex = 0

    this._tracksPositions = []

    this._audioTrack = []

    this._isInitialized = false
    this._isDownloading = false
  }

  seek(frame) {
    // search for correct frame bloc
    let sf = 0
    let i = 0
    while (sf < frame) {
      sf += this._blocInfos[i].NbInterFrames + 1
      i++
    }

    // jump to bloc
    if (i > 0) {
      this._currentBlocIndex = i - 1
    } else {
      this._currentBlocIndex = 0
    }
  }

  getChunkData(position, size) {
    this.fetchBuffer(position, position + size).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        console.log('chunk Data Downloaded')

        return arraybuffer

      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  getFileHeader() {
    console.log(`file : ${this._file4ds}`)

    const parent = this
    this.fetchBuffer(0, 30).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        console.log('Header Downloaded')

        const headerChunk = arraybuffer

        const dv = new DataView(headerChunk)
        // const version = dv.getInt16(4, true)
        parent._pointerToSequenceInfo = dv.getInt32(6, true)
        // const pointerToSequenceInfoPart2 = dv.getInt32(10, true)
        parent._pointerToBlocIndex = dv.getInt32(14, true)
        // const pointerToBlocIndexPart2 = dv.getInt32(18, true)
        parent._pointerToTrackIndex = dv.getInt32(22, true)
        // const pointerToTrackIndexPart2 = dv.getInt32(26, true)

        //console.log(`file magic= ${dv.getUint8(0, true)} ${dv.getUint8(1, true)} ${dv.getUint8(2, true)} ${dv.getUint8(3, true)}`)
        //console.log(`version = ${version}`)
        //console.log(`pointerToSequenceInfo = ${parent._pointerToSequenceInfo}`)
        //console.log(`pointerToSequenceInfoPart2 = ${pointerToSequenceInfoPart2}`)
        //console.log(`pointerToBlocIndex = ${parent._pointerToBlocIndex}`)
        //console.log(`pointerToBlocIndexPart2 = ${pointerToBlocIndexPart2}`)

        // sequence info
        parent.getOneChunk(parent._pointerToSequenceInfo)
      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  getSequenceInfo(position, size) {
    const parent = this

    this.fetchBuffer(position, position + size).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        const dv = new DataView(arraybuffer)
        parent._sequenceInfo.NbFrames = dv.getUint32(0, true)
        parent._sequenceInfo.NbBlocs = dv.getUint32(4, true)
        parent._sequenceInfo.FrameRate = dv.getFloat32(8, true)
        parent._sequenceInfo.MaxVertices = dv.getUint32(12, true)
        parent._sequenceInfo.MaxTriangles = dv.getUint32(16, true)
        parent._sequenceInfo.TextureEncoding = dv.getUint32(20, true)
        parent._sequenceInfo.TextureSizeX = dv.getUint32(24, true)
        parent._sequenceInfo.TextureSizeY = dv.getUint32(28, true)
        parent._sequenceInfo.NbAdditionalTracks = dv.getUint32(32, true)

        console.log(parent._sequenceInfo)

        // bloc index
        parent.getOneChunk(parent._pointerToBlocIndex)

        // track index
        if (parent._sequenceInfo.NbAdditionalTracks > 0) {
          parent.getOneChunk(parent._pointerToTrackIndex)
        }
      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  getBlocsInfos(position, size) {
    const parent = this
    this.fetchBuffer(position, position + size).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        const dv = new DataView(arraybuffer)

        parent._KFPositions.push(79)

        for (let i = 0; i < parent._sequenceInfo.NbBlocs; i++) {
          const bi = new BlocInfo(dv.getInt32(i * 16, true), dv.getInt32(i * 16 + 4, true), dv.getInt32(i * 16 + 8, true))
          parent._blocInfos.push(bi)
          parent._KFPositions.push(bi.BlocChunkPos + 9 + (bi.NbInterFrames + 1) * 16)
        }

        parent._firstBlocIndex = 0
        parent._lastBlocIndex = parent._sequenceInfo.NbBlocs - 1

        // console.log(parent._blocInfos);

        parent._isInitialized = true
        parent._callback()
        // parent.Read();
      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  getTracksIndexes(position, size) {
    const parent = this

    this.fetchBuffer(position, position + size).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        const dv = new DataView(arraybuffer)

        for (let i = 0; i < parent._sequenceInfo.NbAdditionalTracks; i++) {
          parent._tracksPositions.push(dv.getInt32(i * 8, true))

          parent.getOneChunk(parent._tracksPositions[i])
        }
      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  getAudioTrack(position, size) {
    const parent = this

    this.fetchBuffer(position, position + size).then((response) => {
      response.arrayBuffer().then((arraybuffer) => {
        // var dv = new DataView(xhr.response);

        parent._audioTrack = arraybuffer
      })
    }).catch((e) => {
      console.error('getFileHeader: ' + e)
    })
  }

  set4DSFile(file) {
    this._file4ds = file
  }
}
