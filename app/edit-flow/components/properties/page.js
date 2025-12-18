"use client";

import React from "react";
import { Settings } from "lucide-react";
import { useImageEditor } from "../../context/page";
import BackgroundRemover from "../../components/tools/bgremover/page";
import CropTool from "../../components/tools/crop/page";
import TextTool from "../../components/tools/text/page";
import FiltersTool from "../../components/tools/filters/page";
import BackgroundTool from "../../components/tools/bgchange/page";
import AddColorTool from "../../components/tools/color/page";
import AIEditTool from "../../components/tools/aiimageedittool/page"; // New import

const PropertiesPanel = () => {
  const { state } = useImageEditor();

  return (
    <div className="w-80 flex flex-col">
      {/* <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center text-gray-800">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          Properties
        </h2>
      </div> */}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {state.currentTool === "crop" && <CropTool />}
        {state.currentTool === "text" && <TextTool />}
        {state.currentTool === "filters" && <FiltersTool />}
        {state.currentTool === "background-remove" && <BackgroundRemover />}
        {state.currentTool === "background" && <BackgroundTool />}
        {state.currentTool === "add-color" && <AddColorTool />}
        {state.currentTool === "ai-edit" && <AIEditTool />} {/* New AI Edit tool */}
      </div>
    </div>
  );
};

export default PropertiesPanel;