import { Button, Box, InlineStack } from "@shopify/polaris";

interface BackToHomeProps {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "micro" | "slim" | "medium" | "large";
  style?: "floating" | "inline" | "header";
}

export default function BackToHome({ 
  variant = "secondary",
  size = "medium",
  style = "inline"
}: BackToHomeProps) {
  const button = (
    <Button
      url="/app"
      variant={variant}
      size={size}
    >
      🏠 Back to Home
    </Button>
  );

  if (style === "floating") {
    return (
      <Box 
        position="fixed" 
        insetBlockStart="400" 
        insetInlineEnd="400" 
        zIndex="1000"
      >
        <Box 
          background="bg-surface" 
          borderRadius="200" 
          shadow="300"
          padding="200"
        >
          {button}
        </Box>
      </Box>
    );
  }

  if (style === "header") {
    return (
      <InlineStack align="space-between" blockAlign="center">
        {button}
      </InlineStack>
    );
  }

  return (
    <Box paddingBlockEnd="500">
      {button}
    </Box>
  );
}

// Updated styles using Polaris tokens
export const BACK_TO_HOME_STYLES = {
  // Use Polaris spacing tokens instead of hardcoded values
  inlineTop: {
    marginBottom: "var(--p-space-500)" // 20px equivalent in Polaris
  },
  
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--p-space-400)" // 16px equivalent in Polaris
  }
};
