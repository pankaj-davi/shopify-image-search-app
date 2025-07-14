import { Button } from "@shopify/polaris";

interface BackToHomeProps {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "micro" | "slim" | "medium" | "large";
}

export default function BackToHome({ 
  variant = "secondary",
  size = "medium"
}: BackToHomeProps) {
  return (
    <Button
      url="/app"
      variant={variant}
      size={size}
    >
      🏠 Back to Home
    </Button>
  );
}

// Quick styles for consistent styling
export const BACK_TO_HOME_STYLES = {
  floatingTopRight: {
    position: "fixed" as const,
    top: "20px",
    right: "20px",
    zIndex: 1000,
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  
  inlineTop: {
    marginBottom: "20px"
  },
  
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  }
};
