import React from "react";
import { useLocation } from "@remix-run/react";
import StickyHeader from "./StickyHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  // Define page titles and back navigation
  const getPageInfo = () => {
    const path = location.pathname;
    
    // Skip header for certain pages (like auth)
    if (path.includes('/auth/')) {
      return null;
    }
    
    // Main dashboard - no back button
    if (path === '/app' || path === '/app/') {
      return {
        title: "Visual Search Dashboard",
        showBackButton: false
      };
    }
    
    // Define page configurations
    const pageConfigs: Record<string, { title: string; showBackButton: boolean; backUrl?: string }> = {
      '/app/navigation': {
        title: "Navigation Hub",
        showBackButton: true,
        backUrl: "/app"
      },
      '/app/visual-search': {
        title: "Visual Search Settings",
        showBackButton: true,
        backUrl: "/app/navigation"
      },
      '/app/app-blocks': {
        title: "App Block Setup",
        showBackButton: true,
        backUrl: "/app/navigation"
      }
    };
    
    // Get config for current path
    const config = pageConfigs[path];
    if (config) {
      return config;
    }
    
    // Default for unknown pages
    return {
      title: "Visual Search App",
      showBackButton: true,
      backUrl: "/app"
    };
  };
  
  const pageInfo = getPageInfo();
  
  // Don't render header for auth pages
  if (!pageInfo) {
    return <>{children}</>;
  }
  
  return (
    <>
      <StickyHeader 
        title={pageInfo.title}
        showBackButton={pageInfo.showBackButton}
        backUrl={pageInfo.backUrl}
      />
      {children}
    </>
  );
}
