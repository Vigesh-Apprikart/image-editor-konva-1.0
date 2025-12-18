// import "./globals.css";
// import { ImageEditorProvider } from "./edit-flow/context/page";
// import TopNavbar from "./edit-flow/components/navigation/page";
// import StatusBar from "./edit-flow/components/statusbar/page";


// export default function RootLayout({ children }) {
//   return (
//     <ImageEditorProvider>
//       <div className="w-full h-screen flex flex-col overflow-hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//         <TopNavbar />
//         {children}
//         <StatusBar />
//       </div>
//     </ImageEditorProvider>
//   );
// }


import "./globals.css";
import { ImageEditorProvider } from "./edit-flow/context";
import TopNavbar from "./edit-flow/components/navigation/page";
import StatusBar from "./edit-flow/components/statusbar/page";

export const metadata = {
  title: "Image Editor",
  description: "Konva based image editor"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <ImageEditorProvider>
          <div className="w-full h-full flex flex-col relative">
            <TopNavbar />
            {children}
            <StatusBar />
          </div>
        </ImageEditorProvider>
      </body>
    </html>
  );
}
