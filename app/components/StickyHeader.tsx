import { Button, InlineStack, Text } from "@shopify/polaris";

interface StickyHeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function StickyHeader({ 
  title, 
  showBackButton = false, 
  backUrl = "/app" 
}: StickyHeaderProps) {
  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 1000,
      backgroundColor: "white",
      borderBottom: "1px solid #e1e3e5",
      padding: "12px 20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          {showBackButton && (
            <Button url={backUrl} variant="tertiary" size="slim">
              ← Back
            </Button>
          )}
          <Text as="h1" variant="headingMd">
            {title}
          </Text>
        </InlineStack>
        
        <Button url="/app" variant="primary" size="slim">
          🏠 Home
        </Button>
      </InlineStack>
    </div>
  );
}
