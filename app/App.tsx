"use client";

import { fabric } from "fabric";
import Live from "@/components/Live";
import { Room } from "./Room";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectScaling, handleCanvasSelectionCreated, handleCanvaseMouseMove, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {

    const undo = useUndo();
    const redo = useRedo();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const isDrawing = useRef(false);
    const shapeRef = useRef<fabric.Object | null>(null);
    const selectedShapeRef = useRef<string | null>(null);

    const activeObjectRef = useRef<fabric.Object | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const isEditingRef = useRef(false);

    const [activeElement, setActiveElement] = useState<ActiveElement>({
        name: "",
        value: "",
        icon: "",
    })

    const [elementAttributes, setElementAttributes] = useState<Attributes>({
        width: "",
        height: "",
        fontSize: "",
        fontFamily: "",
        fontWeight: "",
        fill: "#aabbcc",
        stroke: "#aabbcc",
    })

    const canvasObjects = useStorage((root) => root.canvasObjects);

    const syncShapeInStorage = useMutation(({ storage }, object) => {
        if (!object) return;

        const { objectId } = object;

        const shapeData = object.toJSON();
        shapeData.objectId = objectId;

        const canvasObjects = storage.get("canvasObjects");

        canvasObjects.set(objectId, shapeData);
    }, [])

    const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
        const canvasObjects = storage.get("canvasObjects");
        canvasObjects.delete(shapeId);
    }, [])


    const deleteAllShapes = useMutation(({ storage }) => {
        const canvasObjects = storage.get("canvasObjects");

        if (!canvasObjects || canvasObjects.size === 0) return true;

        for (const [key, value] of canvasObjects.entries()) {
            canvasObjects.delete(key);
        }

        return canvasObjects.size === 0;

    }, [])

    const handleActiveElement = (elem: ActiveElement) => {
        setActiveElement(elem);

        switch (elem?.value) {
            case 'reset':
                deleteAllShapes();
                fabricRef.current?.clear();
                setActiveElement(defaultNavElement);
                break;

            case 'delete':
                handleDelete(fabricRef.current as any, deleteShapeFromStorage);
                setActiveElement(defaultNavElement);
                break;

            case 'image':
                imageInputRef.current?.click();
                isDrawing.current = false;

                if (fabricRef.current) {
                    fabricRef.current.isDrawingMode = false;
                }
                break;

            default:
                break;
        }


        selectedShapeRef.current = elem?.value as string;
    }

    useEffect(() => {
        const canvas = initializeFabric({ canvasRef, fabricRef });

        canvas.on("mouse:down", (options: any) => {
            handleCanvasMouseDown({
                options,
                canvas,
                isDrawing,
                shapeRef,
                selectedShapeRef
            })
        })

        canvas.on("mouse:move", (options: any) => {
            handleCanvaseMouseMove({
                options,
                canvas,
                isDrawing,
                shapeRef,
                selectedShapeRef,
                syncShapeInStorage
            })
        })

        canvas.on("mouse:up", () => {
            handleCanvasMouseUp({
                canvas,
                isDrawing,
                shapeRef,
                selectedShapeRef,
                syncShapeInStorage,
                setActiveElement,
                activeObjectRef
            })
        })

        canvas.on("object:modified", (options: any) => {
            handleCanvasObjectModified({
                options,
                syncShapeInStorage,
            })
        })

        canvas.on("selection:created", (options: any) => {
            handleCanvasSelectionCreated({
                options,
                isEditingRef,
                setElementAttributes,
            })
        })

        canvas.on("object:scaling", (options: any) => {
            handleCanvasObjectScaling({
                options,
                setElementAttributes
            })
        })

        window.addEventListener("resize", () => {
            handleResize({
                canvas: fabricRef.current,
            })
        })

        return () => {
            canvas.dispose();
        }
    }, [])

    window.addEventListener("keydown", (e) =>
        handleKeyDown({
            e,
            canvas: fabricRef.current,
            undo,
            redo,
            syncShapeInStorage,
            deleteShapeFromStorage,
        })
    )

    useEffect(() => {
        renderCanvas({
            fabricRef,
            canvasObjects,
            activeObjectRef,
        })
    }, [canvasObjects])

    return (
        <>
            <main className="h-screen overflow-hidden">
                <Navbar
                    activeElement={activeElement}
                    handleActiveElement={handleActiveElement}
                    imageInputRef={imageInputRef}
                    handleImageUpload={(e: any) => {
                        e.stopPropagation();

                        handleImageUpload({
                            file: e.target.files[0],
                            canvas: fabricRef as any,
                            shapeRef,
                            syncShapeInStorage,
                        })
                    }}
                />

                <section className="flex h-full flex-row">
                    <LeftSidebar allShapes={Array.from(canvasObjects)} />
                    <Live canvasRef={canvasRef} undo={undo} redo={redo} />
                    <RightSidebar
                        elementAttributes={elementAttributes}
                        setElementAttributes={setElementAttributes}
                        fabricRef={fabricRef}
                        isEditingRef={isEditingRef}
                        activeObjectRef={activeObjectRef}
                        syncShapeInStorage={syncShapeInStorage}

                    />
                </section>

            </main>
        </>

    );
}