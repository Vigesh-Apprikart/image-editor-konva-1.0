"use client";
import { useImageEditor } from "../context";
import ToolSidebar from "../components/sidebar/page";
import KonvaCanvas from "../components/canvas/konvacanvas/page";
import ImageUpload from "../components/canvas/imageupload/page";
import RightPanel from "../components/rightpanel/page";

function Main() {
  const { state } = useImageEditor();
  console.log('Main rendering, panelVisible:', state.panelVisible);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <ToolSidebar />
      <div className="flex-1 flex flex-col p-4 min-w-0 bg-white">
        <div className="flex-1 flex items-center justify-center relative overflow-auto">
          <KonvaCanvas />
          <ImageUpload />
        </div>
      </div>
      {state.panelVisible && <RightPanel />}
    </div>
  );
}

export default Main;