"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/common/sidebar";
import {Navbar} from "@/components/common/navbar";
// import packageJson from "@/../package.json"; // Adjust the path if needed
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const version = packageJson.version;
  // const releaseDate = packageJson.release_date; // Ensure this field exists in your package.json
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Listen for sidebar expansion state changes
  useEffect(() => {
    // Function to handle sidebar expansion state changes
    const handleSidebarStateChange = (event: CustomEvent) => {
      setSidebarExpanded(event.detail.expanded);
    };

    // Add event listener for custom sidebar state change event
    window.addEventListener('sidebarStateChange' as any, handleSidebarStateChange as any);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('sidebarStateChange' as any, handleSidebarStateChange as any);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div 
          className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
            sidebarExpanded ? 'ml-64' : 'ml-16'
          }`}
        >
          <Navbar />
          <main className="flex-1 h-full overflow-x-hidden overflow-y-auto bg-gray-100 px-4 py-12 mt-14 relative">
            {children}
            {/* <div className="opacity-50 fixed bottom-1 right-1 backdrop-blur-sm text-primary text-sm p-1 flex items-center space-x-1">
              <span className="text-primary font-bold text-base">
                v{version}
              </span>
              <span className="text-gray-500 text-xs">
                Released on {releaseDate}
              </span>
            </div> */}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}