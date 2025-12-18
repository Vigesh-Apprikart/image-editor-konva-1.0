"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
  Rect,
  Text,
  Circle,
} from "react-konva";
import { useImageEditor } from "../../../context/page";

const KonvaCanvas = () => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const cropRectRef = useRef();
  const circleRefs = useRef({
    "top-left": null,
    "top-right": null,
    "bottom-left": null,
    "bottom-right": null,
  });
  const selectedNodeRef = useRef(null);
  const { state, dispatch, saveToHistory, focusTextInput } = useImageEditor();
  const [stageSize] = useState({ width: 800, height: 600 });
  const [images, setImages] = useState({});
  const [cropRect, setCropRect] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState(null);
  const [filteredImages, setFilteredImages] = useState({});
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [activeHandle, setActiveHandle] = useState(null);
  const canvasRef = useRef(null);

  const measureTextDimensions = (
    text,
    fontSize,
    fontFamily,
    maxWidth = 600
  ) => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const ctx = canvasRef.current.getContext("2d");
    ctx.font = `${fontSize}px "${fontFamily}"`;

    const words = text.split(/\s+/);
    let lines = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      const metrics = ctx.measureText(testLine);
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    const maxWidthActual =
      Math.max(...lines.map((line) => ctx.measureText(line).width)) + 20;
    const lineHeight = fontSize * 1.2;
    const textHeight = Math.max(fontSize * 1.5, lines.length * lineHeight + 10);

    return {
      textWidth: maxWidthActual,
      textHeight,
    };
  };

  // Load background image
  useEffect(() => {
    if (state.background.type === "image") {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setBackgroundImage(img);
      img.onerror = () => {
        console.error("Failed to load background image");
        setBackgroundImage(null);
      };
      img.src = state.background.value;
    } else {
      setBackgroundImage(null);
    }
  }, [state.background]);

  // Update circle positions for crop
  const updateCirclePositions = (x, y, width, height) => {
    if (circleRefs.current["top-left"]) {
      circleRefs.current["top-left"].x(x);
      circleRefs.current["top-left"].y(y);
    }
    if (circleRefs.current["top-right"]) {
      circleRefs.current["top-right"].x(x + width);
      circleRefs.current["top-right"].y(y);
    }
    if (circleRefs.current["bottom-left"]) {
      circleRefs.current["bottom-left"].x(x);
      circleRefs.current["bottom-left"].y(y + height);
    }
    if (circleRefs.current["bottom-right"]) {
      circleRefs.current["bottom-right"].x(x + width);
      circleRefs.current["bottom-right"].y(y + height);
    }
    if (cropRectRef.current) {
      cropRectRef.current.getLayer().batchDraw();
    }
  };

  // Load images and select new layer
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = state.layers
        .filter((layer) => layer.type === "image" && layer.data)
        .map((layer) => {
          return new Promise((resolve) => {
            if (
              images[layer.id] &&
              images[layer.id].src === layer.data &&
              !layer.filters &&
              layer.initialized
            ) {
              resolve({ id: layer.id, image: images[layer.id] });
              return;
            }

            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              if (!layer.initialized) {
                const maxWidth = stageSize.width * 0.8;
                const maxHeight = stageSize.height * 0.8;
                const scale = Math.min(
                  maxWidth / img.width,
                  maxHeight / img.height,
                  1
                );

                const updates = {
                  scaleX: scale,
                  scaleY: scale,
                  x: (stageSize.width - img.width * scale) / 2,
                  y: (stageSize.height - img.height * scale) / 2,
                  width: img.width,
                  height: img.height,
                  initialized: true,
                };

                dispatch({
                  type: "UPDATE_LAYER",
                  payload: { id: layer.id, updates },
                });

                dispatch({ type: "SELECT_LAYER", payload: layer.id });
                dispatch({ type: "SET_TOOL", payload: "move" });
              }

              resolve({ id: layer.id, image: img });
            };

            img.onerror = () => {
              console.error(`Failed to load image for layer ${layer.id}`);
              resolve({ id: layer.id, image: null });
            };

            if (typeof layer.data === "string") {
              img.src = layer.data;
            } else if (layer.data instanceof File) {
              const reader = new FileReader();
              reader.onload = (e) => {
                img.src = e.target.result;
              };
              reader.onerror = () => {
                console.error(`Failed to read file for layer ${layer.id}`);
                resolve({ id: layer.id, image: null });
              };
              reader.readAsDataURL(layer.data);
            } else {
              console.error(`Invalid image data for layer ${layer.id}`);
              resolve({ id: layer.id, image: null });
            }
          });
        });

      const loadedImages = await Promise.all(imagePromises);
      const imageMap = {};
      loadedImages.forEach(({ id, image }) => {
        if (image) imageMap[id] = image;
      });

      setImages((prev) => {
        const newImages = { ...prev, ...imageMap };
        return newImages;
      });

      if (stageRef.current) {
        stageRef.current.batchDraw();
      }
    };

    loadImages();
  }, [state.layers, dispatch, stageSize]);

  // Handle image updates after background removal
  useEffect(() => {
    const updateImages = async () => {
      const imagePromises = state.layers
        .filter((layer) => layer.type === "image" && layer.data)
        .map((layer) => {
          return new Promise((resolve) => {
            if (
              images[layer.id] &&
              images[layer.id].src === layer.data &&
              !layer.filters
            ) {
              resolve({ id: layer.id, image: images[layer.id] });
              return;
            }

            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              resolve({ id: layer.id, image: img });
            };
            img.onerror = () => {
              console.error(`Failed to load image for layer ${layer.id}`);
              resolve({ id: layer.id, image: null });
            };

            if (typeof layer.data === "string") {
              img.src = layer.data;
            } else if (layer.data instanceof File) {
              const reader = new FileReader();
              reader.onload = (e) => {
                img.src = e.target.result;
              };
              reader.readAsDataURL(layer.data);
            }
          });
        });

      const loadedImages = await Promise.all(imagePromises);
      const imageMap = {};
      loadedImages.forEach(({ id, image }) => {
        if (image) imageMap[id] = image;
      });

      setImages((prev) => {
        const newImages = { ...prev, ...imageMap };
        return newImages;
      });

      if (stageRef.current) {
        stageRef.current.batchDraw();
      }
    };

    updateImages();
  }, [state.layers]);

  // Initialize or update crop rectangle to cover the entire selected image
  useEffect(() => {
    if (state.currentTool === "crop" && state.selectedLayerId && !cropRect) {
      const selectedLayer = state.layers.find(
        (layer) => layer.id === state.selectedLayerId
      );
      if (selectedLayer && images[selectedLayer.id]) {
        const img = images[selectedLayer.id];
        const scaleX = selectedLayer.scaleX || 1;
        const scaleY = selectedLayer.scaleY || 1;
        const layerX = selectedLayer.x || 0;
        const layerY = selectedLayer.y || 0;

        // Use the scaled dimensions of the image as rendered on the canvas
        const imgWidth = img.width * scaleX;
        const imgHeight = img.height * scaleY;

        // Set crop rectangle to cover the entire visible image area
        setCropRect({
          x: layerX,
          y: layerY,
          width: imgWidth,
          height: imgHeight,
        });
      }
    } else if (state.currentTool !== "crop") {
      setCropRect(null);
      setCropAspectRatio(null);
    }
  }, [
    state.currentTool,
    state.selectedLayerId,
    state.layers,
    images,
    cropAspectRatio,
  ]);

  // Update crop rectangle when aspect ratio changes
  useEffect(() => {
    if (cropRect && cropAspectRatio !== null && state.selectedLayerId) {
      const selectedLayer = state.layers.find(
        (layer) => layer.id === state.selectedLayerId
      );
      if (selectedLayer && images[selectedLayer.id]) {
        const img = images[selectedLayer.id];
        const scaleX = selectedLayer.scaleX || 1;
        const scaleY = selectedLayer.scaleY || 1;
        const layerX = selectedLayer.x || 0;
        const layerY = selectedLayer.y || 0;
        const imgWidth = img.width * scaleX;
        const imgHeight = img.height * scaleY;

        let newWidth = imgWidth;
        let newHeight = imgHeight;

        if (cropAspectRatio) {
          const imgRatio = imgWidth / imgHeight;
          if (cropAspectRatio > imgRatio) {
            newHeight = imgWidth / cropAspectRatio;
          } else {
            newWidth = imgHeight * cropAspectRatio;
          }
        }

        setCropRect({
          x: layerX + (imgWidth - newWidth) / 2,
          y: layerY + (imgHeight - newHeight) / 2,
          width: newWidth,
          height: newHeight,
        });
      }
    }
  }, [cropAspectRatio, state.selectedLayerId, state.layers, images]);

  // Expose setCropAspectRatio
  useEffect(() => {
    window.setCropAspectRatio = (ratio) => setCropAspectRatio(ratio);
    return () => delete window.setCropAspectRatio;
  }, []);

  // Handle filter updates
  const generateFilterString = (filters) => {
    if (!filters) return "none";
    const brightness = Math.max(0, Math.min(filters.brightness || 100, 200));
    const contrast = Math.max(0, Math.min(filters.contrast || 100, 200));
    const saturation = Math.max(0, Math.min(filters.saturation || 100, 200));
    const hue = Math.max(-360, Math.min(filters.hue || 0, 360));
    const blur = Math.max(0, Math.min(filters.blur || 0, 10));
    const grayscale = Math.max(0, Math.min(filters.grayscale || 0, 100));
    const sepia = Math.max(0, Math.min(filters.sepia || 0, 100));
    const invert = Math.max(0, Math.min(filters.invert || 0, 100));
    const opacity = Math.max(0, Math.min(filters.opacity || 100, 100));

    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%) invert(${invert}%) opacity(${opacity}%)`;
  };

  useEffect(() => {
    window.generateFilterString = generateFilterString;
    return () => delete window.generateFilterString;
  }, []);

  useEffect(() => {
    const applyFilters = async () => {
      const updatedFilteredImages = { ...filteredImages };

      for (const layer of state.layers) {
        if (layer.type === "image" && layer.filters && images[layer.id]) {
          const img = images[layer.id];
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;

          try {
            ctx.filter = generateFilterString(layer.filters);
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const filteredImg = new window.Image();
            filteredImg.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              filteredImg.onload = () => {
                updatedFilteredImages[layer.id] = filteredImg;
                resolve();
              };
              filteredImg.onerror = () => {
                console.error(
                  `Failed to load filtered image for layer ${layer.id}`
                );
                reject();
              };
              filteredImg.src = canvas.toDataURL("image/png");
            });
          } catch (error) {
            console.error(
              `Error applying filters to layer ${layer.id}:`,
              error
            );
            delete updatedFilteredImages[layer.id];
          }
        } else if (layer.type === "image" && !layer.filters) {
          delete updatedFilteredImages[layer.id];
        }
      }

      setFilteredImages(updatedFilteredImages);

      if (stageRef.current) {
        stageRef.current.batchDraw();
      }
    };

    applyFilters();
  }, [state.layers, images]);

  // Handle mouse down events on the stage or layers
  const handleStageMouseDown = (e) => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    const isStageClick =
      e.target === stage || e.target.getParent() === stage.getLayers()[0];

    if (isStageClick) {
      dispatch({ type: "SELECT_LAYER", payload: null });
      transformer.nodes([]);
      transformer.visible(false);
      transformer.getLayer().batchDraw();
      return;
    }

    const layerId = e.target.attrs.layerId;
    if (layerId) {
      dispatch({ type: "SELECT_LAYER", payload: layerId });
      const layer = state.layers.find(
        (l) => l.id === layerId && l.type === "text"
      );
      if (layer) {
        dispatch({ type: "SET_TOOL", payload: "text" });
        if (focusTextInput) focusTextInput();
      }
    }
  };

  const handleDblClick = (e) => {
    const layerId = e.target.attrs.layerId;
    const layer = state.layers.find(
      (l) => l.id === layerId && l.type === "text"
    );
    if (layer) {
      dispatch({ type: "SELECT_LAYER", payload: layerId });
      dispatch({ type: "SET_TOOL", payload: "text" });
      if (focusTextInput) focusTextInput();
    }
  };

  const applyCrop = () => {
    if (!cropRect || !state.selectedLayerId) return;

    const selectedLayer = state.layers.find(
      (layer) => layer.id === state.selectedLayerId
    );
    if (!selectedLayer || !images[selectedLayer.id]) return;

    const img = images[selectedLayer.id];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scaleX = selectedLayer.scaleX || 1;
    const scaleY = selectedLayer.scaleY || 1;
    const layerX = selectedLayer.x || 0;
    const layerY = selectedLayer.y || 0;

    let cropX = Math.round((cropRect.x - layerX) / scaleX);
    let cropY = Math.round((cropRect.y - layerY) / scaleY);
    let cropWidth = Math.round(cropRect.width / scaleX);
    let cropHeight = Math.round(cropRect.height / scaleY);

    cropX = Math.max(0, Math.min(cropX, img.width - 1));
    cropY = Math.max(0, Math.min(cropY, img.height - 1));
    cropWidth = Math.max(1, Math.min(cropWidth, img.width - cropX));
    cropHeight = Math.max(1, Math.min(cropHeight, img.height - cropY));

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    if (selectedLayer.filters) {
      ctx.filter = generateFilterString(selectedLayer.filters);
    }

    try {
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
    } catch (error) {
      console.error("Error drawing image on canvas:", error);
      return;
    }

    const croppedImg = new window.Image();
    croppedImg.crossOrigin = "anonymous";
    croppedImg.onload = () => {
      const currentDisplayWidth = selectedLayer.width * scaleX;
      const currentDisplayHeight = selectedLayer.height * scaleY;
      const aspectRatio = cropWidth / cropHeight;

      let newDisplayWidth = currentDisplayWidth;
      let newDisplayHeight = currentDisplayWidth / aspectRatio;

      if (newDisplayHeight > currentDisplayHeight) {
        newDisplayHeight = currentDisplayHeight;
        newDisplayWidth = currentDisplayHeight * aspectRatio;
      }

      newDisplayWidth = Math.min(newDisplayWidth, stageSize.width);
      newDisplayHeight = Math.min(newDisplayHeight, stageSize.height);

      const newScaleX = newDisplayWidth / cropWidth;
      const newScaleY = newDisplayHeight / cropHeight;

      const newX = cropRect.x;
      const newY = cropRect.y;

      dispatch({
        type: "UPDATE_LAYER",
        payload: {
          id: selectedLayer.id,
          updates: {
            data: canvas.toDataURL("image/png"),
            x: newX,
            y: newY,
            scaleX: newScaleX,
            scaleY: newScaleY,
            width: cropWidth,
            height: cropHeight,
            initialized: true,
            filters: selectedLayer.filters || null,
            preset: selectedLayer.preset || "Original",
          },
        },
      });

      setImages((prev) => ({
        ...prev,
        [selectedLayer.id]: croppedImg,
      }));

      setFilteredImages((prev) => {
        const newFilteredImages = { ...prev };
        delete newFilteredImages[selectedLayer.id];
        return newFilteredImages;
      });

      saveToHistory();
      setCropRect(null);
      setCropAspectRatio(null);
      dispatch({ type: "SET_TOOL", payload: "select" });

      if (stageRef.current) {
        stageRef.current.batchDraw();
      }
    };

    croppedImg.onerror = () => {
      console.error("Error loading cropped image");
    };

    croppedImg.src = canvas.toDataURL("image/png");
  };

  const handleCropDrag = (e) => {
    const node = e.target;
    const selectedLayer = state.layers.find(
      (layer) => layer.id === state.selectedLayerId
    );
    if (!selectedLayer || !images[selectedLayer.id]) return;

    const img = images[selectedLayer.id];
    const scaleX = selectedLayer.scaleX || 1;
    const scaleY = selectedLayer.scaleY || 1;
    const layerX = selectedLayer.x || 0;
    const layerY = selectedLayer.y || 0;
    const imgWidth = img.width * scaleX;
    const imgHeight = img.height * scaleY;

    const newX = Math.max(
      layerX,
      Math.min(node.x(), layerX + imgWidth - cropRect.width)
    );
    const newY = Math.max(
      layerY,
      Math.min(node.y(), layerY + imgHeight - cropRect.height)
    );

    setCropRect((prev) => ({ ...prev, x: newX, y: newY }));
    node.x(newX);
    node.y(newY);

    updateCirclePositions(newX, newY, cropRect.width, cropRect.height);
  };

  const handleCropTransform = (e) => {
    const node = e.target;
    const selectedLayer = state.layers.find(
      (layer) => layer.id === state.selectedLayerId
    );
    if (!selectedLayer || !images[selectedLayer.id]) return;

    const img = images[selectedLayer.id];
    const scaleX = selectedLayer.scaleX || 1;
    const scaleY = selectedLayer.scaleY || 1;
    const layerX = selectedLayer.x || 0;
    const layerY = selectedLayer.y || 0;
    const imgWidth = img.width * scaleX;
    const imgHeight = img.height * scaleY;

    let newWidth = cropRect.width * node.scaleX();
    let newHeight = cropAspectRatio
      ? newWidth / cropAspectRatio
      : cropRect.height * node.scaleY();
    let newX = node.x();
    let newY = node.y();

    newWidth = Math.max(5, Math.min(newWidth, imgWidth - (newX - layerX)));
    newHeight = Math.max(5, Math.min(newHeight, imgHeight - (newY - layerY)));
    newX = Math.max(layerX, Math.min(newX, layerX + imgWidth - newWidth));
    newY = Math.max(layerY, Math.min(newY, layerY + imgHeight - newHeight));

    if (cropAspectRatio) {
      newHeight = newWidth / cropAspectRatio;
      if (newY + newHeight > layerY + imgHeight) {
        newHeight = layerY + imgHeight - newY;
        newWidth = newHeight * cropAspectRatio;
      }
      if (newX + newWidth > layerX + imgWidth) {
        newWidth = layerX + imgWidth - newX;
        newHeight = newWidth / cropAspectRatio;
      }
    }

    setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight });
    node.scaleX(1);
    node.scaleY(1);
    updateCirclePositions(newX, newY, newWidth, newHeight);
  };

  const handleCornerResize = (corner, e) => {
    const node = e.target;
    const selectedLayer = state.layers.find(
      (layer) => layer.id === state.selectedLayerId
    );
    if (!selectedLayer || !images[selectedLayer.id]) return;

    const img = images[selectedLayer.id];
    const scaleX = selectedLayer.scaleX || 1;
    const scaleY = selectedLayer.scaleY || 1;
    const layerX = selectedLayer.x || 0;
    const layerY = selectedLayer.y || 0;
    const imgWidth = img.width * scaleX;
    const imgHeight = img.height * scaleY;

    let newX = cropRect.x;
    let newY = cropRect.y;
    let newWidth = cropRect.width;
    let newHeight = cropRect.height;

    switch (corner) {
      case "top-left":
        newX = Math.max(layerX, Math.min(node.x(), layerX + imgWidth));
        newY = Math.max(layerY, Math.min(node.y(), layerY + imgHeight));
        newWidth = cropRect.x + cropRect.width - newX;
        newHeight = cropRect.y + cropRect.height - newY;
        break;
      case "top-right":
        newX = cropRect.x;
        newY = Math.max(layerY, Math.min(node.y(), layerY + imgHeight));
        newWidth = Math.max(5, Math.min(node.x() - cropRect.x, imgWidth));
        newHeight = cropRect.y + cropRect.height - newY;
        break;
      case "bottom-left":
        newX = Math.max(layerX, Math.min(node.x(), layerX + imgWidth));
        newY = cropRect.y;
        newWidth = cropRect.x + cropRect.width - newX;
        newHeight = Math.max(5, Math.min(node.y() - cropRect.y, imgHeight));
        break;
      case "bottom-right":
        newX = cropRect.x;
        newY = cropRect.y;
        newWidth = Math.max(5, Math.min(node.x() - cropRect.x, imgWidth));
        newHeight = Math.max(5, Math.min(node.y() - cropRect.y, imgHeight));
        break;
    }

    newWidth = Math.max(5, Math.min(newWidth, imgWidth - (newX - layerX)));
    newHeight = Math.max(5, Math.min(newHeight, imgHeight - (newY - layerY)));
    newX = Math.max(layerX, Math.min(newX, layerX + imgWidth - newWidth));
    newY = Math.max(layerY, Math.min(newY, layerY + imgHeight - newHeight));

    if (cropAspectRatio) {
      const imgRatio = imgWidth / imgHeight;
      if (cropAspectRatio > imgRatio) {
        newHeight = newWidth / cropAspectRatio;
      } else {
        newWidth = newHeight * cropAspectRatio;
      }
    }

    setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight });
    updateCirclePositions(newX, newY, newWidth, newHeight);
  };

  // Handle center layer action
  const handleCenterLayer = (layerId) => {
    const layer = state.layers.find((l) => l.id === layerId);
    if (!layer) return;

    if (layer.type === "image" && images[layerId]) {
      const img = images[layerId];
      dispatch({
        type: "CENTER_LAYER",
        payload: {
          layerId,
          canvasWidth: stageSize.width,
          canvasHeight: stageSize.height,
          layerWidth: img.width,
          layerHeight: img.height,
          scaleX: layer.scaleX || 1,
          scaleY: layer.scaleY || 1,
        },
      });
    } else if (layer.type === "text") {
      dispatch({
        type: "CENTER_LAYER",
        payload: {
          layerId,
          canvasWidth: stageSize.width,
          canvasHeight: stageSize.height,
          layerWidth: layer.textWidth,
          layerHeight: layer.textHeight,
          scaleX: layer.scaleX || 1,
          scaleY: layer.scaleY || 1,
        },
      });
    }
    saveToHistory();
  };

  // Update transformer for selected layer
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;

    if (!transformer || !stage) return;

    if (
      state.selectedLayerId &&
      [
        "select",
        "move",
        "filters",
        "text",
        "background",
        "background-remove",
        "add-color",
        "ai-edit",
      ].includes(state.currentTool)
    ) {
      const selectedNode = stage.findOne(`#layer-${state.selectedLayerId}`);
      const selectedLayer = state.layers.find(
        (layer) => layer.id === state.selectedLayerId
      );
      if (selectedNode && selectedLayer) {
        transformer.nodes([selectedNode]);
        transformer.visible(true);
        transformer.getLayer().batchDraw();
        selectedNodeRef.current = selectedNode;

        selectedNode.on("dragmove", () => {
          dispatch({
            type: "UPDATE_LAYER",
            payload: {
              id: selectedLayer.id,
              updates: { x: selectedNode.x(), y: selectedNode.y() },
            },
          });
          const bgRect = stage.findOne(`#bg-rect-${selectedLayer.id}`);
          if (bgRect) {
            bgRect.setAttrs({ x: selectedNode.x(), y: selectedNode.y() });
            bgRect.getLayer().batchDraw();
          }
        });

        selectedNode.on("dragend", () => {
          dispatch({
            type: "UPDATE_LAYER",
            payload: {
              id: selectedLayer.id,
              updates: { x: selectedNode.x(), y: selectedNode.y() },
            },
          });
          saveToHistory();
        });

        selectedNode.on("transform", () => {
          const bgRect = stage.findOne(`#bg-rect-${selectedLayer.id}`);
          if (bgRect) {
            bgRect.setAttrs({
              x: selectedNode.x(),
              y: selectedNode.y(),
              scaleX: selectedNode.scaleX(),
              scaleY: selectedNode.scaleY(),
              rotation: selectedNode.rotation(),
            });
            bgRect.getLayer().batchDraw();
          }
        });

        selectedNode.on("transformend", () => {
          const updates = {
            x: selectedNode.x(),
            y: selectedNode.y(),
            rotation: selectedNode.rotation(),
            scaleX: selectedNode.scaleX(),
            scaleY: selectedNode.scaleY(),
          };

          if (selectedLayer.type === "text") {
            if (
              ["top-left", "top-right", "bottom-left", "bottom-right"].includes(
                activeHandle
              )
            ) {
              const newFontSize =
                selectedLayer.fontSize * selectedNode.scaleY();
              const newTextWidth =
                selectedLayer.textWidth * selectedNode.scaleX();
              const { textHeight } = measureTextDimensions(
                selectedLayer.text,
                newFontSize,
                selectedLayer.fontFamily,
                newTextWidth
              );
              updates.fontSize = newFontSize;
              updates.textWidth = newTextWidth;
              updates.textHeight = textHeight;
              updates.scaleX = 1;
              updates.scaleY = 1;
              selectedNode.scaleX(1);
              selectedNode.scaleY(1);
              selectedNode.fontSize(newFontSize);
              selectedNode.width(newTextWidth);
              selectedNode.height(textHeight);
            } else {
              updates.textWidth = selectedLayer.textWidth;
              updates.textHeight = selectedLayer.textHeight;
            }
          } else if (
            selectedLayer.type === "image" &&
            images[selectedLayer.id]
          ) {
            updates.scaleX = selectedNode.scaleX();
            updates.scaleY = selectedNode.scaleY();
          }

          dispatch({
            type: "UPDATE_LAYER",
            payload: {
              id: selectedLayer.id,
              updates,
            },
          });
          setActiveHandle(null);
          saveToHistory();
        });

        selectedNode.on("transformstart", () => {
          setActiveHandle(transformer.getActiveAnchor());
        });
      } else {
        transformer.nodes([]);
        transformer.visible(false);
        transformer.getLayer().batchDraw();
        selectedNodeRef.current = null;
      }
    } else {
      transformer.nodes([]);
      transformer.visible(false);
      transformer.getLayer().batchDraw();
      selectedNodeRef.current = null;
    }

    return () => {
      if (selectedNodeRef.current) {
        selectedNodeRef.current.off("dragmove");
        selectedNodeRef.current.off("dragend");
        selectedNodeRef.current.off("transform");
        selectedNodeRef.current.off("transformend");
        selectedNodeRef.current.off("transformstart");
      }
    };
  }, [
    state.selectedLayerId,
    state.currentTool,
    state.layers,
    images,
    saveToHistory,
    activeHandle,
  ]);

  // Expose centerLayer function
  useEffect(() => {
    window.centerLayer = handleCenterLayer;
    return () => {
      delete window.centerLayer;
    };
  }, [images, stageSize, state.layers]);

  useEffect(() => {
    window.applyCrop = applyCrop;
    return () => {
      delete window.applyCrop;
    };
  }, [applyCrop, images, cropRect, state.selectedLayerId, state.layers]);

  useEffect(() => {
    window.exportCanvas = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const cropLayer = stage.getLayers()[2];
      const transformerLayer = stage.getLayers()[3];

      if (cropLayer) cropLayer.hide();
      if (transformerLayer) transformerLayer.hide();

      const dataURL = stage.toDataURL({ pixelRatio: 1 });

      if (cropLayer) cropLayer.show();
      if (transformerLayer) transformerLayer.show();

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `pixel_edit_export_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      stage.batchDraw();
    };
    return () => delete window.exportCanvas;
  }, []);

  if (!state.image && state.layers && state.layers.length === 0) return null;

  const parseGradient = (gradient) => {
    const matches = gradient.match(/#[\da-fA-F]{6}/g);
    if (!matches || matches.length < 2) {
      return { colors: ["#ffffff", "#ffffff"], stops: [0, 1] };
    }
    return {
      colors: matches,
      stops: matches.map((_, i) => i / (matches.length - 1)),
    };
  };

  const calculateCoverDimensions = (img) => {
    if (!img) {
      return {
        width: stageSize.width,
        height: stageSize.height,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const canvasRatio = stageSize.width / stageSize.height;
    const imgRatio = img.width / img.height;

    let width, height, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      height = stageSize.height;
      width = stageSize.height * imgRatio;
      offsetX = (stageSize.width - width) / 2;
      offsetY = 0;
    } else {
      width = stageSize.width;
      height = stageSize.width / imgRatio;
      offsetX = 0;
      offsetY = (stageSize.height - height) / 2;
    }

    return { width, height, offsetX, offsetY };
  };

  const bgImageDimensions = backgroundImage
    ? calculateCoverDimensions(backgroundImage)
    : null;

  return (
    <div
      className="bg-gray-900/50 rounded-lg overflow-hidden border border-white/10"
      style={{ width: stageSize.width, height: stageSize.height }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={state.zoom}
        scaleY={state.zoom}
        onMouseDown={handleStageMouseDown}
        onDblClick={handleDblClick}
        className="cursor-crosshair"
      >
        {/* Background Layer */}
        <Layer>
          {state.background.type === "color" && (
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill={state.background.value}
              listening={false}
            />
          )}
          {state.background.type === "gradient" && (
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{
                x: stageSize.width,
                y: stageSize.height,
              }}
              fillLinearGradientColorStops={(() => {
                const { colors, stops } = parseGradient(state.background.value);
                return stops.flatMap((stop, i) => [stop, colors[i]]);
              })()}
              listening={false}
            />
          )}
          {state.background.type === "image" && backgroundImage && (
            <KonvaImage
              image={backgroundImage}
              x={bgImageDimensions.offsetX}
              y={bgImageDimensions.offsetY}
              width={bgImageDimensions.width}
              height={bgImageDimensions.height}
              listening={false}
            />
          )}
        </Layer>

        {/* Image and Text Layers */}
        <Layer>
          {state.layers.map((layer) => {
            if (layer.type === "image" && images[layer.id] && layer.visible) {
              const img = images[layer.id];
              let displayImage = img;
              if (layer.filters && filteredImages[layer.id]) {
                displayImage = filteredImages[layer.id];
              }

              return (
                <React.Fragment key={layer.id}>
                  {layer.backgroundColor && (
                    <Rect
                      id={`bg-rect-${layer.id}`}
                      x={layer.x || 0}
                      y={layer.y || 0}
                      width={layer.width || img.width}
                      height={layer.height || img.height}
                      scaleX={layer.scaleX || 1}
                      scaleY={layer.scaleY || 1}
                      rotation={layer.rotation || 0}
                      fill={layer.backgroundColor}
                      opacity={layer.opacity || 1}
                    />
                  )}
                  <KonvaImage
                    id={`layer-${layer.id}`}
                    layerId={layer.id}
                    image={displayImage}
                    x={layer.x || 0}
                    y={layer.y || 0}
                    width={layer.width || img.width}
                    height={layer.height || img.height}
                    scaleX={layer.scaleX || 1}
                    scaleY={layer.scaleY || 1}
                    rotation={layer.rotation || 0}
                    opacity={layer.opacity || 1}
                    draggable={state.currentTool !== "crop"}
                    onDragMove={(e) => {
                      dispatch({
                        type: "UPDATE_LAYER",
                        payload: {
                          id: layer.id,
                          updates: { x: e.target.x(), y: e.target.y() },
                        },
                      });
                      const bgRect = e.target
                        .getStage()
                        .findOne(`#bg-rect-${layer.id}`);
                      if (bgRect) {
                        bgRect.setAttrs({
                          x: e.target.x(),
                          y: e.target.y(),
                          scaleX: e.target.scaleX(),
                          scaleY: e.target.scaleY(),
                          rotation: e.target.rotation(),
                        });
                        bgRect.getLayer().batchDraw();
                      }
                    }}
                    onDragEnd={(e) => {
                      dispatch({
                        type: "UPDATE_LAYER",
                        payload: {
                          id: layer.id,
                          updates: { x: e.target.x(), y: e.target.y() },
                        },
                      });
                      saveToHistory();
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      dispatch({
                        type: "UPDATE_LAYER",
                        payload: {
                          id: layer.id,
                          updates: {
                            x: node.x(),
                            y: node.y(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY(),
                            rotation: node.rotation(),
                          },
                        },
                      });
                      setActiveHandle(null);
                      saveToHistory();
                    }}
                    onTransformStart={() => {
                      setActiveHandle(transformerRef.current.getActiveAnchor());
                    }}
                  />
                </React.Fragment>
              );
            } else if (layer.type === "text" && layer.visible) {
              return (
                <Text
                  key={layer.id}
                  id={`layer-${layer.id}`}
                  layerId={layer.id}
                  text={layer.text}
                  fontSize={layer.fontSize || 24}
                  fontFamily={layer.fontFamily || "Arial"}
                  fill={layer.fill || "#000000"}
                  align={layer.align || "left"}
                  x={layer.x || 0}
                  y={layer.y || 0}
                  width={layer.textWidth || 100}
                  height={layer.textHeight || 50}
                  scaleX={layer.scaleX || 1}
                  scaleY={layer.scaleY || 1}
                  rotation={layer.rotation || 0}
                  opacity={layer.opacity || 1}
                  wrap="word"
                  lineHeight={1.2}
                  ellipsis={false}
                  draggable={state.currentTool !== "crop"}
                  onDragEnd={(e) => {
                    dispatch({
                      type: "UPDATE_LAYER",
                      payload: {
                        id: layer.id,
                        updates: { x: e.target.x(), y: e.target.y() },
                      },
                    });
                    saveToHistory();
                  }}
                  onDblClick={handleDblClick}
                  onClick={handleStageMouseDown}
                />
              );
            }
            return null;
          })}
        </Layer>

        {/* Crop Layer */}
        {state.currentTool === "crop" && cropRect && (
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill="rgba(0, 0, 0, 0.5)"
            />
            <Rect
              x={cropRect.x}
              y={cropRect.y}
              width={cropRect.width}
              height={cropRect.height}
              globalCompositeOperation="destination-out"
            />
            <Rect
              ref={cropRectRef}
              x={cropRect.x}
              y={cropRect.y}
              width={cropRect.width}
              height={cropRect.height}
              stroke="#22c55e"
              strokeWidth={2}
              dash={[5, 5]}
              draggable
              onDragMove={handleCropDrag}
              onTransform={handleCropTransform}
            />
            {cropAspectRatio === null &&
              [
                { corner: "top-left", x: cropRect.x, y: cropRect.y },
                {
                  corner: "top-right",
                  x: cropRect.x + cropRect.width,
                  y: cropRect.y,
                },
                {
                  corner: "bottom-left",
                  x: cropRect.x,
                  y: cropRect.y + cropRect.height,
                },
                {
                  corner: "bottom-right",
                  x: cropRect.x + cropRect.width,
                  y: cropRect.y + cropRect.height,
                },
              ].map(({ corner, x, y }) => (
                <Circle
                  key={corner}
                  ref={(node) => (circleRefs.current[corner] = node)}
                  x={x}
                  y={y}
                  radius={8}
                  fill="#22c55e"
                  stroke="#ffffff"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleCornerResize(corner, e)}
                  onDragEnd={() => {
                    const transformer = transformerRef.current;
                    if (transformer && cropRectRef.current) {
                      transformer.nodes([]);
                      transformer.visible(false);
                      transformer.getLayer().batchDraw();
                    }
                  }}
                />
              ))}
          </Layer>
        )}

        {/* Transformer Layer */}
        <Layer>
          <Transformer
            ref={transformerRef}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "top-center",
              "bottom-center",
              "middle-left",
              "middle-right",
            ]}
            anchorStroke="#8A2BE2"
            anchorFill="#ffffff"
            anchorSize={8}
            borderStroke="#8A2BE2"
            borderStrokeWidth={2}
            rotateEnabled={true}
            boundBoxFunc={(oldBox, newBox) => {
              const selectedLayer = state.layers.find(
                (layer) => layer.id === state.selectedLayerId
              );
              if (!selectedLayer) return oldBox;

              const minSize = 20;

              if (state.currentTool === "crop" && cropRect) {
                const scaleX = selectedLayer.scaleX || 1;
                const scaleY = selectedLayer.scaleY || 1;
                const layerX = selectedLayer.x || 0;
                const layerY = selectedLayer.y || 0;
                const img = images[selectedLayer.id];
                const imgWidth = img.width * scaleX;
                const imgHeight = img.height * scaleY;

                let newWidth = newBox.width;
                let newHeight = newBox.height;
                let newX = newBox.x;
                let newY = newBox.y;

                newX = Math.max(
                  layerX,
                  Math.min(newX, layerX + imgWidth - newWidth)
                );
                newY = Math.max(
                  layerY,
                  Math.min(newY, layerY + imgHeight - newHeight)
                );
                newWidth = Math.max(
                  minSize,
                  Math.min(newWidth, imgWidth - (newX - layerX))
                );
                newHeight = Math.max(
                  minSize,
                  Math.min(newHeight, imgHeight - (newY - layerY))
                );

                if (cropAspectRatio) {
                  newHeight = newWidth / cropAspectRatio;
                  if (newY + newHeight > layerY + imgHeight) {
                    newHeight = layerY + imgHeight - newY;
                    newWidth = newHeight * cropAspectRatio;
                  }
                  if (newX + newWidth > layerX + imgWidth) {
                    newWidth = layerX + imgWidth - newX;
                    newHeight = newWidth / cropAspectRatio;
                  }
                }

                setCropRect({
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                });
                updateCirclePositions(newX, newY, newWidth, newHeight);

                return {
                  ...newBox,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                };
              }

              if (selectedLayer.type === "text" && activeHandle) {
                let newWidth = newBox.width;
                let newHeight = newBox.height;
                let newX = newBox.x;
                let newY = newBox.y;

                const isCorner = [
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ].includes(activeHandle);
                const initialAspectRatio =
                  selectedLayer.textWidth / selectedLayer.textHeight;

                if (isCorner) {
                  newHeight = newWidth / initialAspectRatio;

                  if (activeHandle === "top-left") {
                    newX = oldBox.x + oldBox.width - newWidth;
                    newY = oldBox.y + oldBox.height - newHeight;
                  } else if (activeHandle === "top-right") {
                    newY = oldBox.y + oldBox.height - newHeight;
                  } else if (activeHandle === "bottom-left") {
                    newX = oldBox.x + oldBox.width - newWidth;
                  }

                  newX = Math.max(
                    0,
                    Math.min(newX, stageSize.width - newWidth)
                  );
                  newY = Math.max(
                    0,
                    Math.min(newY, stageSize.height - newHeight)
                  );
                  newWidth = Math.max(
                    minSize,
                    Math.min(newWidth, stageSize.width - newX)
                  );
                  newHeight = newWidth / initialAspectRatio;

                  if (newY + newHeight > stageSize.height) {
                    newHeight = stageSize.height - newY;
                    newWidth = newHeight * initialAspectRatio;
                    if (
                      activeHandle === "top-left" ||
                      activeHandle === "top-right"
                    ) {
                      newY = stageSize.height - newHeight;
                    }
                  }
                  if (newX + newWidth > stageSize.width) {
                    newWidth = stageSize.width - newX;
                    newHeight = newWidth / initialAspectRatio;
                    if (
                      activeHandle === "top-left" ||
                      activeHandle === "bottom-left"
                    ) {
                      newX = stageSize.width - newWidth;
                    }
                  }
                } else if (
                  ["top-center", "bottom-center"].includes(activeHandle)
                ) {
                  newWidth = oldBox.width;
                  newX = oldBox.x;

                  if (activeHandle === "top-center") {
                    newY = oldBox.y + oldBox.height - newHeight;
                  }

                  newY = Math.max(
                    0,
                    Math.min(newY, stageSize.height - newHeight)
                  );
                  newHeight = Math.max(
                    minSize,
                    Math.min(newHeight, stageSize.height - newY)
                  );
                } else if (
                  ["middle-left", "middle-right"].includes(activeHandle)
                ) {
                  newHeight = oldBox.height;
                  newY = oldBox.y;

                  if (activeHandle === "middle-left") {
                    newX = oldBox.x + oldBox.width - newWidth;
                  }

                  newX = Math.max(
                    0,
                    Math.min(newX, stageSize.width - newWidth)
                  );
                  newWidth = Math.max(
                    minSize,
                    Math.min(newWidth, stageSize.width - newX)
                  );
                }

                return {
                  ...newBox,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                };
              }

              if (
                selectedLayer.type === "image" &&
                images[selectedLayer.id] &&
                activeHandle
              ) {
                const img = images[selectedLayer.id];
                const aspectRatio = img.width / img.height;
                let newWidth = newBox.width;
                let newHeight = newBox.height;
                let newX = newBox.x;
                let newY = newBox.y;

                const isCorner = [
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ].includes(activeHandle);

                if (isCorner) {
                  newHeight = newWidth / aspectRatio;

                  if (activeHandle === "top-left") {
                    newX = oldBox.x + oldBox.width - newWidth;
                    newY = oldBox.y + oldBox.height - newHeight;
                  } else if (activeHandle === "top-right") {
                    newY = oldBox.y + oldBox.height - newHeight;
                  } else if (activeHandle === "bottom-left") {
                    newX = oldBox.x + oldBox.width - newWidth;
                  }

                  newX = Math.max(
                    0,
                    Math.min(newX, stageSize.width - newWidth)
                  );
                  newY = Math.max(
                    0,
                    Math.min(newY, stageSize.height - newHeight)
                  );
                  newWidth = Math.max(
                    minSize,
                    Math.min(newWidth, stageSize.width - newX)
                  );
                  newHeight = newWidth / aspectRatio;

                  if (newY + newHeight > stageSize.height) {
                    newHeight = stageSize.height - newY;
                    newWidth = newHeight * aspectRatio;
                    if (
                      activeHandle === "top-left" ||
                      activeHandle === "top-right"
                    ) {
                      newY = stageSize.height - newHeight;
                    }
                  }
                  if (newX + newWidth > stageSize.width) {
                    newWidth = stageSize.width - newX;
                    newHeight = newWidth / aspectRatio;
                    if (
                      activeHandle === "top-left" ||
                      activeHandle === "bottom-left"
                    ) {
                      newX = stageSize.width - newWidth;
                    }
                  }
                } else if (
                  ["top-center", "bottom-center"].includes(activeHandle)
                ) {
                  newWidth = oldBox.width;
                  newX = oldBox.x;

                  if (activeHandle === "top-center") {
                    newY = oldBox.y + oldBox.height - newHeight;
                  }

                  newY = Math.max(
                    0,
                    Math.min(newY, stageSize.height - newHeight)
                  );
                  newHeight = Math.max(
                    minSize,
                    Math.min(newHeight, stageSize.height - newY)
                  );
                } else if (
                  ["middle-left", "middle-right"].includes(activeHandle)
                ) {
                  newHeight = oldBox.height;
                  newY = oldBox.y;

                  if (activeHandle === "middle-left") {
                    newX = oldBox.x + oldBox.width - newWidth;
                  }

                  newX = Math.max(
                    0,
                    Math.min(newX, stageSize.width - newWidth)
                  );
                  newWidth = Math.max(
                    minSize,
                    Math.min(newWidth, stageSize.width - newX)
                  );
                }

                return {
                  ...newBox,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                };
              }

              newBox.x = Math.max(
                0,
                Math.min(newBox.x, stageSize.width - newBox.width)
              );
              newBox.y = Math.max(
                0,
                Math.min(newBox.y, stageSize.height - newBox.height)
              );
              newBox.width = Math.max(
                minSize,
                Math.min(newBox.width, stageSize.width)
              );
              newBox.height = Math.max(
                minSize,
                Math.min(newBox.height, stageSize.height)
              );

              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaCanvas;
