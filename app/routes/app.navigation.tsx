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
        </BlockStack>
      </Page>
  );
}
