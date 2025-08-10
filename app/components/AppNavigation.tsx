import { Card, BlockStack, InlineStack, Button, Text, SkeletonBodyText, SkeletonDisplayText } from "@shopify/polaris";

interface NavigationLink {
  url: string;
  label: string;
  icon: string;
  variant?: "primary" | "secondary" | "tertiary";
  external?: boolean;
  description?: string;
}

interface NavigationSection {
  title: string;
  description?: string;
  links: NavigationLink[];
}

interface AppNavigationProps {
  sections?: NavigationSection[];
  compact?: boolean;
  loading?: boolean;
}

const DEFAULT_SECTIONS: NavigationSection[] = [
];

export default function AppNavigation({ sections = DEFAULT_SECTIONS, compact = false, loading = false }: AppNavigationProps) {
  if (loading) {
    return (
      <BlockStack gap="400">
        {compact ? (
          <Card>
            <BlockStack gap="300">
              <SkeletonDisplayText size="medium" />
              <InlineStack gap="300" wrap>
                {[1, 2, 3].map((i) => (
                  <Card key={i} background="bg-surface-secondary">
                    <div style={{ padding: "16px", minWidth: "200px" }}>
                      <SkeletonBodyText lines={2} />
                    </div>
                  </Card>
                ))}
              </InlineStack>
            </BlockStack>
          </Card>
        ) : (
          <>
            {[1, 2].map((section) => (
              <Card key={section}>
                <BlockStack gap="400">
                  <SkeletonDisplayText size="medium" />
                  <SkeletonBodyText lines={1} />
                  <BlockStack gap="200">
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ padding: "12px", border: "1px solid #e1e1e1", borderRadius: "6px" }}>
                        <SkeletonBodyText lines={2} />
                      </div>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            ))}
          </>
        )}
      </BlockStack>
    );
  }

  if (compact) {
    // Compact version - show navigation links in a grid
    const quickLinks = sections[0]?.links || [];
    
    if (quickLinks.length === 0) {
      return null; // Don't render anything if no links
    }
    
    return (
      <Card>
        <BlockStack gap="300">
          <Text as="h2" variant="headingMd">
            Navigation
          </Text>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "12px" 
          }}>
            {quickLinks.map((link, index) => (
              <Button
                key={index}
                url={link.url}
                variant={link.variant || "secondary"}
                external={link.external}
                size="large"
              >
                {link.icon} {link.label}
              </Button>
            ))}
          </div>
          <div style={{ marginTop: "15px" }}>
            <Button url="/app/navigation" variant="tertiary" size="slim">
              View All Features →
            </Button>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <BlockStack gap="400">
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <BlockStack gap="300">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                {section.title}
              </Text>
              {section.description && (
                <Text variant="bodyMd" as="p" tone="subdued">
                  {section.description}
                </Text>
              )}
            </BlockStack>

            {/* Grid layout for larger sections, inline for smaller ones */}
            {section.links.length > 3 ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: "12px" 
              }}>
                {section.links.map((link, linkIndex) => (
                  <Button
                    key={linkIndex}
                    url={link.url}
                    variant={link.variant || "secondary"}
                    external={link.external}
                    size="large"
                  >
                    {link.icon} {link.label}
                  </Button>
                ))}
              </div>
            ) : (
              <InlineStack gap="300" wrap>
                {section.links.map((link, linkIndex) => (
                  <Button
                    key={linkIndex}
                    url={link.url}
                    variant={link.variant || "secondary"}
                    external={link.external}
                  >
                    {link.icon} {link.label}
                  </Button>
                ))}
              </InlineStack>
            )}

            {/* Show descriptions for links if available */}
            {section.links.some(link => link.description) && (
              <BlockStack gap="100">
                {section.links.map((link, linkIndex) => 
                  link.description ? (
                    <Text key={linkIndex} variant="bodySm" as="p" tone="subdued">
                      <Text as="span" fontWeight="medium">{link.icon} {link.label}:</Text> {link.description}
                    </Text>
                  ) : null
                )}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      ))}
    </BlockStack>
  );
}

export type { NavigationLink, NavigationSection, AppNavigationProps };
