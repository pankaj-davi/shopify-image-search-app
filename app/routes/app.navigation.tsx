import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Text, Card, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

import AppNavigation from "../components/AppNavigation";
import type { NavigationSection } from "../components/AppNavigation";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  return json({
    shop: session.shop,
    appUrl
  });
}

export default function NavigationPage() {
  const data = useLoaderData<typeof loader>();

  // Custom navigation sections with dynamic URLs
  const customSections: NavigationSection[] = [
    {
      title: "Visual Search Features",
      description: "Core functionality and customization",
      links: [
        {
          url: "/app/preview",
          label: "Live Preview & Theme Customization",
          icon: "🎨",
          variant: "primary",
          description: "Real-time preview with positioning controls, color themes, and configuration generator"
        },
        {
          url: "/app/visual-search", 
          label: "Visual Search Management",
          icon: "🔍",
          variant: "secondary",
          description: "Script injection, cleanup, and core visual search settings"
        },
        {
          url: "/app/additional",
          label: "Analytics Dashboard", 
          icon: "📊",
          variant: "secondary",
          description: "Usage statistics, performance metrics, and user behavior insights"
        }
      ]
    },
    {
      title: "Development & Testing",
      description: "Tools for developers and store owners",
      links: [
        {
          url: "/app/verify-integration",
          label: "Integration Verification",
          icon: "✅",
          variant: "secondary",
          description: "Check installation status and troubleshoot common issues"
        },
        {
          url: "/app/testing-tools",
          label: "Testing & Debug Tools",
          icon: "🛠️",
          variant: "secondary", 
          description: "Debug visual search functionality and test different scenarios"
        }
      ]
    },
    {
      title: "Interactive Demos & Examples",
      description: "Live demonstrations of features",
      links: [
        {
          url: `${data.appUrl}/positioning-demo.html`,
          label: "Positioning Playground",
          icon: "🎯",
          variant: "secondary",
          external: true,
          description: "Interactive demo to test left/right positioning, spacing, and sizing"
        },
        {
          url: `${data.appUrl}/overlap-prevention-demo.html`, 
          label: "Smart Positioning Demo",
          icon: "🔧",
          variant: "secondary",
          external: true,
          description: "See how collision detection prevents overlap with existing icons"
        },
        {
          url: `${data.appUrl}/visual-search-unified.js`,
          label: "View Unified Script",
          icon: "📜",
          variant: "tertiary",
          external: true,
          description: "Inspect the unified visual search script source code"
        }
      ]
    },
    {
      title: "Documentation & Resources",
      description: "Guides, references, and community resources", 
      links: [
        {
          url: "https://github.com/pankaj-davi/shopify-image-search-app/blob/develop/POSITIONING_GUIDE.md",
          label: "Complete Positioning Guide",
          icon: "📖",
          variant: "secondary", 
          external: true,
          description: "Comprehensive guide covering all positioning and customization options"
        },
        {
          url: "https://github.com/pankaj-davi/shopify-image-search-app/blob/develop/README.md",
          label: "Project Documentation",
          icon: "📚",
          variant: "secondary",
          external: true,
          description: "Full project documentation including setup and development guides"
        },
        {
          url: "https://github.com/pankaj-davi/shopify-image-search-app/issues",
          label: "Report Issues",
          icon: "🐛",
          variant: "tertiary",
          external: true,
          description: "Report bugs, request features, or get help from the community"
        },
        {
          url: "https://shopify.dev/docs/apps",
          label: "Shopify App Development",
          icon: "🛒",
          variant: "tertiary",
          external: true,
          description: "Official Shopify documentation for app development"
        }
      ]
    },
    {
      title: "Quick Actions",
      description: "Common tasks and shortcuts",
      links: [
        {
          url: "/app/preview?action=reset",
          label: "Reset Theme to Default",
          icon: "🔄",
          variant: "tertiary",
          description: "Reset all customizations to default Pinterest-style theme"
        },
        {
          url: "/app/visual-search?action=fix-script",
          label: "Re-inject Visual Search Script",
          icon: "🔧",
          variant: "tertiary",
          description: "Force re-injection of the visual search script to your storefront"
        },
        {
          url: `${data.appUrl}/app`,
          label: "App Dashboard Home",
          icon: "🏠",
          variant: "tertiary",
          description: "Return to the main dashboard with store overview"
        }
      ]
    }
  ];

  return (
    <Page>
      <TitleBar title="Visual Search Navigation" />
      
      <BlockStack gap="500">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Visual Search Navigation Hub
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Complete navigation for all visual search features, tools, and resources for {data.shop}
              </Text>
            </BlockStack>
          </Card>

          <AppNavigation sections={customSections} compact={false} />

          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                🚀 Getting Started
              </Text>
              <Text variant="bodyMd" as="p">
                New to Visual Search? Start with these recommended steps:
              </Text>
              <ol style={{ marginLeft: "20px", lineHeight: "1.8" }}>
                <li><strong>Preview & Customize:</strong> Visit the Theme Preview page to configure positioning and colors</li>
                <li><strong>Test Integration:</strong> Use the Verification tool to ensure everything is working</li>
                <li><strong>Explore Demos:</strong> Try the interactive positioning demos to understand the features</li>
                <li><strong>Monitor Analytics:</strong> Check the Analytics Dashboard for usage insights</li>
              </ol>
            </BlockStack>
          </Card>
        </BlockStack>
      </Page>
  );
}
