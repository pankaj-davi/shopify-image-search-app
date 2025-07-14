import { Button, InlineStack, Text, Box } from '@shopify/polaris';

interface StickyHeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function StickyHeader({
  title,
  showBackButton = false,
  backUrl = '/app',
}: StickyHeaderProps) {
  return (
    <Box
      position="sticky"
      insetBlockStart="0"
      zIndex="1000"
      background="bg-surface"
      borderBlockEndWidth="025"
      borderColor="border"
      paddingInline="500"
      paddingBlock="300"
      shadow="100"
    >
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
    </Box>
  );
}
