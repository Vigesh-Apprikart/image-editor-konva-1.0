import { ImageEditorProvider } from "./context/page";
import TopNavbar from "./components/navigation/page";
import StatusBar from "./components/statusbar/page";


export default function RootLayout({ children }) {
  return (
    <ImageEditorProvider>
      <div className="w-full h-screen flex flex-col overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <TopNavbar />
        {children}
        <StatusBar />
      </div>
    </ImageEditorProvider>
  );
}