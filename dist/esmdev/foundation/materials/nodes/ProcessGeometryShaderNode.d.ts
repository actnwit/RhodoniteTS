import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';
/**
 * A shader node that processes geometry transformations in the vertex shader pipeline.
 * This node handles world space transformations, normal matrix calculations, and skeletal animation.
 * It provides essential geometry processing functionality for 3D rendering pipelines.
 */
export declare class ProcessGeometryShaderNode extends AbstractShaderNode {
    /**
     * Creates a new ProcessGeometryShaderNode instance.
     * Initializes input and output sockets for geometry processing operations.
     */
    constructor();
    /**
     * Gets the input socket for the world transformation matrix.
     * @returns The world matrix input socket
     */
    getSocketInputWorldMatrix(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for the normal transformation matrix.
     * @returns The normal matrix input socket
     */
    getSocketInputNormalMatrix(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for the view transformation matrix.
     * @returns The view matrix input socket
     */
    getSocketInputViewMatrix(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for vertex position data.
     * @returns The position input socket
     */
    getSocketInputPosition(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for vertex normal data.
     * @returns The normal input socket
     */
    getSocketInputNormal(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for skeletal animation joint indices.
     * @returns The joint input socket
     */
    getSocketInputJoint(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for skeletal animation joint weights.
     * @returns The weight input socket
     */
    getSocketInputWeight(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the input socket for billboard rendering flag.
     * @returns The billboard flag input socket
     */
    getSocketInputIsBillboard(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket for the processed normal matrix.
     * @returns The normal matrix output socket
     */
    getSocketOutputNormalMatrix(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket for the transformed position in world space.
     * @returns The world position output socket
     */
    getSocketOutputPositionInWorld(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
    /**
     * Gets the output socket for the transformed normal in world space.
     * @returns The world normal output socket
     */
    getSocketOutputNormalInWorld(): Socket<string, import("../..").CompositionTypeEnum, import("../..").ComponentTypeEnum, import("../core/Socket").SocketDefaultValue>;
}
