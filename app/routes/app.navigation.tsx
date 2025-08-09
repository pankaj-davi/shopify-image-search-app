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
      title: "App Block Setup",
      description: "Configure visual search through Shopify's theme editor",
      links: [
        {
          url: "/app/app-blocks",
          label: "App Block Integration",
          icon: "📦",
          variant: "primary",
          description: "Add visual search blocks to your theme using Shopify's native theme editor"
        },
        {
          url: "/app/visual-search", 
          label: "Visual Search Management",
          icon: "🔍",
          variant: "secondary",
          description: "Theme configuration and visual search settings"
        }
      ]
    },
    {
      title: "Analytics & Insights",
      description: "Track and analyze performance",
      links: [
        {
          url: "/app/block-stats",
          label: "App Block Analytics",
          icon: "📊",
          variant: "primary",
          description: "Track app block usage and performance metrics"
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
        </BlockStack>
      </Page>
  );
}
