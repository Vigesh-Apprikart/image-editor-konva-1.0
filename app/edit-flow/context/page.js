"use client";

import React from 'react';
import { createContext, useContext, useReducer, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { createBackgroundWorker } from "../utils/backgroundworker/page";

const ImageEditorContext = createContext();

const initialState = {
  currentTool: "select",
  image: null,
  layers: [],
  selectedLayerId: null,
  history: [],
  historyIndex: -1,
  zoom: 1,
  canvasSize: { width: 800, height: 600 },
  isLoading: false,
  cropData: null,
  backgroundRemovalProgress: 0,
  background: { type: "color", value: "transparent" },
  panelVisible: true, // Add panelVisible to initial state
};

const MAX_HISTORY_STEPS = 20;

const createNewLayer = (image) => ({
  id: crypto.randomUUID(),
  type: "image",
  data: image,
  visible: true,
  opacity: 1,
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  width: image ? image.width : 0,
  height: image ? image.height : 0,
  name: "Image Layer",
  backgroundColor: null,
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    opacity: 100,
  },
});

const imageEditorReducer = (state, action) => {
  switch (action.type) {
    case "SET_TOOL":
      if (state.currentTool === action.payload) return state;
      return { ...state, currentTool: action.payload };

    case "SET_IMAGE": {
      const newLayer = createNewLayer(action.payload);
      return {
        ...state,
        image: action.payload,
        layers: [newLayer],
        selectedLayerId: newLayer.id,
        history: [],
        historyIndex: -1,
      };
    }

    case "ADD_LAYER":
      return {
        ...state,
        layers: [...state.layers, action.payload],
        selectedLayerId: action.payload.id,
      };

    case "UPDATE_LAYER":
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.payload.id
            ? { ...layer, ...action.payload.updates }
            : layer
        ),
      };

    case "DELETE_LAYER": {
      const filteredLayers = state.layers.filter(
        (layer) => layer.id !== action.payload
      );
      return {
        ...state,
        layers: filteredLayers,
        selectedLayerId:
          filteredLayers.length > 0 ? filteredLayers[0].id : null,
      };
    }

    case "SELECT_LAYER":
      if (state.selectedLayerId === action.payload) return state;
      return { ...state, selectedLayerId: action.payload };

    case "REORDER_LAYERS":
      return { ...state, layers: action.payload };

    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) };

    case "SET_CANVAS_SIZE":
      return { ...state, canvasSize: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_CROP_DATA":
      return { ...state, cropData: action.payload };

    case "SET_BG_REMOVAL_PROGRESS":
      return { ...state, backgroundRemovalProgress: action.payload };

    case "SET_BACKGROUND":
      return { ...state, background: action.payload };

    case "APPLY_COLOR":
      if (!state.selectedLayerId) return state;
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === state.selectedLayerId && layer.type === "image"
            ? { ...layer, backgroundColor: action.payload }
            : layer
        ),
      };

    case "SAVE_HISTORY": {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      if (newHistory.length >= MAX_HISTORY_STEPS) {
        newHistory.shift();
      }
      return {
        ...state,
        history: [...newHistory, action.payload],
        historyIndex: Math.min(newHistory.length, MAX_HISTORY_STEPS - 1),
      };
    }

    case "UNDO":
      if (state.historyIndex <= 0) return state;
      return {
        ...state,
        ...state.history[state.historyIndex - 1],
        historyIndex: state.historyIndex - 1,
      };

    case "REDO":
      if (state.historyIndex >= state.history.length - 1) return state;
      return {
        ...state,
        ...state.history[state.historyIndex + 1],
        historyIndex: state.historyIndex + 1,
      };

    case "DUPLICATE_LAYER": {
      const layerToDuplicate = state.layers.find(
        (l) => l.id === action.payload
      );
      if (!layerToDuplicate) return state;

      const duplicatedLayer = {
        ...layerToDuplicate,
        id: crypto.randomUUID(),
        name: `${layerToDuplicate.name || "Layer"} Copy`,
        x: (layerToDuplicate.x || 0) + 10,
        y: (layerToDuplicate.y || 0) + 10,
        filters: layerToDuplicate.filters
          ? { ...layerToDuplicate.filters }
          : null,
        backgroundColor: layerToDuplicate.backgroundColor || null,
      };

      const index = state.layers.findIndex((l) => l.id === action.payload);
      const newLayers = [...state.layers];
      newLayers.splice(index + 1, 0, duplicatedLayer);

      return {
        ...state,
        layers: newLayers,
        selectedLayerId: duplicatedLayer.id,
      };
    }

    case "CENTER_LAYER": {
      const layerToCenter = state.layers.find(
        (l) => l.id === action.payload.layerId
      );
      if (!layerToCenter || layerToCenter.type !== "image") return state;

      const {
        canvasWidth,
        canvasHeight,
        layerWidth,
        layerHeight,
        scaleX,
        scaleY,
      } = action.payload;
      const newX = (canvasWidth - layerWidth * scaleX) / 2;
      const newY = (canvasHeight - layerHeight * scaleY) / 2;

      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.payload.layerId
            ? { ...layer, x: newX, y: newY }
            : layer
        ),
        selectedLayerId: action.payload.layerId,
      };
    }

    case "UPDATE_LAYER_IMAGE_ONLY":
      return {
        ...state,
        layers: state.layers.map((layer) =>
          layer.id === action.payload.id
            ? { ...layer, data: action.payload.data }
            : layer
        ),
      };

    case "TOGGLE_PANEL":
      console.log('Toggling panel, current panelVisible:', state.panelVisible);
      return {
        ...state,
        panelVisible: !state.panelVisible,
      };

    default:
      return state;
  }
};

export const ImageEditorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(imageEditorReducer, initialState);
  const workerRef = useRef(null);

  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const saveToHistory = useCallback(() => {
    dispatch({
      type: "SAVE_HISTORY",
      payload: state,
    });
  }, [state]);

  const removeBackgroundAsync = useCallback((imageData) => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    workerRef.current = createBackgroundWorker();
    dispatch({ type: "SET_LOADING", payload: true });

    workerRef.current.onmessage = (e) => {
      if (e.data.type === "progress") {
        dispatch({ type: "SET_BG_REMOVAL_PROGRESS", payload: e.data.progress });
      } else if (e.data.type === "done") {
        const currentLayer = state.layers.find(
          (l) => l.id === state.selectedLayerId
        );
        if (currentLayer) {
          dispatch({
            type: "UPDATE_LAYER_IMAGE_ONLY",
            payload: {
              id: currentLayer.id,
              data: e.data.result, // the new base64 image
            },
          });
        }
        dispatch({ type: "SET_LOADING", payload: false });
        dispatch({ type: "SET_BG_REMOVAL_PROGRESS", payload: 100 });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
    workerRef.current.postMessage({ imageData });
  }, []);

  const focusTextInput = useCallback(() => {
    if (window.focusTextInput) {
      window.focusTextInput();
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      saveToHistory,
      removeBackgroundAsync,
      focusTextInput,
    }),
    [state, saveToHistory, removeBackgroundAsync, focusTextInput]
  );

  return (
    <ImageEditorContext.Provider value={value}>
      {children}
    </ImageEditorContext.Provider>
  );
};

ImageEditorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useImageEditor = () => {
  const context = useContext(ImageEditorContext);
  if (!context) {
    throw new Error("useImageEditor must be used within ImageEditorProvider");
  }
  return context;
};

export const MemoizedImageEditorProvider = React.memo(ImageEditorProvider);