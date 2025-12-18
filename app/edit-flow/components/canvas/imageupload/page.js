"use client";

import React, { useCallback } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { useImageEditor } from '../../../context/page';

const ImageUpload = () => {
  const { state, dispatch } = useImageEditor();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      dispatch({ type: 'SET_IMAGE', payload: imageFile });
    }
  }, [dispatch]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      dispatch({ type: 'SET_IMAGE', payload: file });
    }
  };

  if (state.image || state.layers.length > 0) {
    return null;
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg "
    >
      <div className="text-center p-8 glass rounded-2xl border-2 border-dashed border-white/20 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-black">Start Your Creative Journey</h3>
        <p className="text-gray-400 mb-6">
          Drag and drop an image here, or click to browse
        </p>
        
        <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 cursor-pointer">
          <ImageIcon className="w-4 h-4 mr-2" />
          Select Image
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        
        <div className="mt-4 text-xs text-gray-500">
          Supports PNG, JPG, WebP formats
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;