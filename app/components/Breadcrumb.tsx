import { InlineStack, Text, Link } from "@shopify/polaris";

interface BreadcrumbItem {
  label: string;
  url?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <InlineStack gap="100" align="start">
      {items.map((item, index) => (
        <InlineStack key={index} gap="100" align="center">
          {item.url && !item.current ? (
            <Link
              url={item.url}
              monochrome
            >
              <Text variant="bodySm" as="span">
                {item.label}
              </Text>
            </Link>
          ) : (
            <Text 
              variant="bodySm" 
              as="span" 
              tone={item.current ? "base" : "subdued"}
              fontWeight={item.current ? "medium" : "regular"}
            >
              {item.label}
            </Text>
          )}
          
          {index < items.length - 1 && (
            <Text variant="bodySm" as="span" tone="subdued">
              /
            </Text>
          )}
        </InlineStack>
      ))}
    </InlineStack>
  );
}

// Common breadcrumb configurations
export const BREADCRUMB_CONFIGS = {
  dashboard: [
    { label: "Dashboard", url: "/app", current: true }
  ],
  
  visualSearch: [
    { label: "Dashboard", url: "/app" },
    { label: "Visual Search", current: true }
  ],
  
  preview: [
    { label: "Dashboard", url: "/app" },
    { label: "Preview & Customize", current: true }
  ],
  
  navigation: [
    { label: "Dashboard", url: "/app" },
    { label: "Navigation", current: true }
  ],
  
  additional: [
    { label: "Dashboard", url: "/app" },
    { label: "Analytics", current: true }
  ],
  
  testing: [
    { label: "Dashboard", url: "/app" },
    { label: "Testing Tools", current: true }
  ],
  
  verification: [
    { label: "Dashboard", url: "/app" },
    { label: "Verify Integration", current: true }
  ]
};

export type { BreadcrumbItem, BreadcrumbProps };
