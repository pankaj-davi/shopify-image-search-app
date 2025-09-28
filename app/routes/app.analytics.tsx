import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  DataTable,
  Badge,
  EmptyState,
  Grid,
  BlockStack,
  InlineStack,
  Box,
  SkeletonBodyText,
  SkeletonDisplayText,
  Select
} from "@shopify/polaris";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { authenticate } from "../shopify.server";
import { getDatabase } from "../services/database.interface";
import type { VisualSearchAnalytics, AnalyticsFilters } from "../services/database.interface";

interface LoaderData {
  analytics: VisualSearchAnalytics;
  filters: AnalyticsFilters;
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get("timeframe") || "7d";

    // Security: Only show analytics for the current authenticated shop
    const currentShop = session.shop;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "1d":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const filters: AnalyticsFilters = {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      source: "visual-search",
      shop: currentShop // Force current shop only
    };


    const db = await getDatabase();
    const analytics = await db.getVisualSearchAnalytics(filters);
    console.log('📊 Analytics result:', analytics);

    return json<LoaderData>({
      analytics,
      filters: {
        ...filters,
        shop: currentShop
      }
    });

  } catch (error) {
    console.error("Failed to load analytics:", error);

    // Return empty analytics data structure
    const emptyAnalytics: VisualSearchAnalytics = {
      totalEvents: 0,
      actionBreakdown: { loaded: 0, added: 0, viewed: 0, used: 0 },
      dailyTrends: [],
      deviceBreakdown: { mobile: 0, desktop: 0 },
      topShops: [],
      recentEvents: []
    };

    return json<LoaderData>({
      analytics: emptyAnalytics,
      filters: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        source: "visual-search",
        shop: session?.shop || "unknown"
      },
      error: "Failed to load analytics data"
    });
  }
}

// CSS styles
const styles = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
  .pulse-animation {
    animation: pulse 1.5s ease-in-out infinite;
  }
`;

export default function AnalyticsPage() {
  const { analytics, filters, error } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const [timeframe, setTimeframe] = useState(searchParams.get("timeframe") || "7d");
  const [isLoading, setIsLoading] = useState(false);

  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("timeframe", newTimeframe);
    setTimeframe(newTimeframe);
    setIsLoading(true);
    submit(params, { method: "get" });
  }, [searchParams, submit]);

  // Reset loading state when data loads
  useEffect(() => {
    setIsLoading(false);
  }, [analytics]);

  // Chart colors matching Polaris theme
  const chartColors = {
    loaded: '#008060',    // Shopify green
    added: '#3B82F6',     // Blue
    viewed: '#F59E0B',    // Amber
    used: '#DC2626'       // Red
  };

  // Prepare data for charts
  const actionData = [
    { action: 'Component Loaded', value: analytics.actionBreakdown.loaded, color: chartColors.loaded },
    { action: 'Image Uploaded', value: analytics.actionBreakdown.added, color: chartColors.added },
    { action: 'Results Viewed', value: analytics.actionBreakdown.viewed, color: chartColors.viewed },
    { action: 'Product Clicked', value: analytics.actionBreakdown.used, color: chartColors.used }
  ];

  const deviceData = [
    { device: 'Mobile', value: analytics.deviceBreakdown.mobile, color: '#8B5CF6' },
    { device: 'Desktop', value: analytics.deviceBreakdown.desktop, color: '#10B981' }
  ];

  // Recent events table data
  const recentEventsRows = analytics.recentEvents.slice(0, 20).map((event, index) => [
    event.action,
    new URL(event.url || 'https://example.com').pathname,
    new Date(event.timestamp).toLocaleString(),
    <Badge key={index} tone={
      event.action === 'used' ? 'success' :
      event.action === 'viewed' ? 'attention' :
      event.action === 'added' ? 'info' : undefined
    }>
      {event.action}
    </Badge>
  ]);

  if (error) {
    return (
      <Page
        title="Visual Search Analytics"
        subtitle="Track user interactions with your visual search component"
      >
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="Failed to load analytics"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Page
        title="Visual Search Analytics"
        subtitle="Track user interactions with your visual search component"
      >
      <Layout>
        {/* Filters */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">Analytics for {filters.shop}</Text>
                <InlineStack gap="400">
                  <Box minWidth="200px">
                    <Select
                      label="Timeframe"
                      options={[
                        {label: 'Last 24 hours', value: '1d'},
                        {label: 'Last 7 days', value: '7d'},
                        {label: 'Last 30 days', value: '30d'},
                        {label: 'Last 90 days', value: '90d'},
                      ]}
                      onChange={handleTimeframeChange}
                      value={timeframe}
                    />
                  </Box>
                </InlineStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* KPI Cards */}
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  {isLoading ? (
                    <>
                      <SkeletonBodyText lines={1} />
                      <SkeletonDisplayText size="large" />
                    </>
                  ) : (
                    <>
                      <Text variant="bodySm" as="p" tone="subdued">TOTAL EVENTS</Text>
                      <Text variant="heading2xl" as="h3">
                        {analytics.totalEvents.toLocaleString()}
                      </Text>
                    </>
                  )}
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  {isLoading ? (
                    <>
                      <SkeletonBodyText lines={1} />
                      <SkeletonDisplayText size="large" />
                    </>
                  ) : (
                    <>
                      <Text variant="bodySm" as="p" tone="subdued">COMPONENT LOADS</Text>
                      <Text variant="heading2xl" as="h3" tone="success">
                        {analytics.actionBreakdown.loaded.toLocaleString()}
                      </Text>
                    </>
                  )}
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  {isLoading ? (
                    <>
                      <SkeletonBodyText lines={1} />
                      <SkeletonDisplayText size="large" />
                    </>
                  ) : (
                    <>
                      <Text variant="bodySm" as="p" tone="subdued">IMAGE UPLOADS</Text>
                      <Text variant="heading2xl" as="h3">
                        {analytics.actionBreakdown.added.toLocaleString()}
                      </Text>
                    </>
                  )}
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Card>
                <BlockStack gap="200">
                  {isLoading ? (
                    <>
                      <SkeletonBodyText lines={1} />
                      <SkeletonDisplayText size="large" />
                    </>
                  ) : (
                    <>
                      <Text variant="bodySm" as="p" tone="subdued">PRODUCT CLICKS</Text>
                      <Text variant="heading2xl" as="h3" tone="critical">
                        {analytics.actionBreakdown.used.toLocaleString()}
                      </Text>
                    </>
                  )}
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        {/* Daily Trends Chart - Full Width */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Daily Trends</Text>
              <div style={{height: "300px"}}>
                {isLoading ? (
                  <Box padding="500">
                    <SkeletonBodyText lines={8} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="loaded" stroke={chartColors.loaded} strokeWidth={2} name="Loaded" />
                      <Line type="monotone" dataKey="added" stroke={chartColors.added} strokeWidth={2} name="Uploaded" />
                      <Line type="monotone" dataKey="viewed" stroke={chartColors.viewed} strokeWidth={2} name="Viewed" />
                      <Line type="monotone" dataKey="used" stroke={chartColors.used} strokeWidth={2} name="Clicked" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Action Breakdown Chart - Full Width */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Action Breakdown</Text>
              <div style={{height: "300px"}}>
                {isLoading ? (
                  <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <div
                      style={{
                        width: "240px",
                        height: "240px",
                        borderRadius: "50%",
                        background: "linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)"
                      }}
                      className="pulse-animation"
                    />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ action, value }) => `${action}: ${value}`}
                      >
                        {actionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Device Breakdown */}
        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Device Usage</Text>
                  <div style={{height: "200px"}}>
                    {isLoading ? (
                      <Box padding="500">
                        <SkeletonBodyText lines={4} />
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deviceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="device" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8">
                            {deviceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>

            {/* Summary Stats */}
            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Usage Summary</Text>
                  <Box>
                    {isLoading ? (
                      <BlockStack gap="200">
                        <SkeletonBodyText lines={3} />
                      </BlockStack>
                    ) : (
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text variant="bodyMd" as="p">Most Popular Action</Text>
                          <Badge>
                            {Object.entries(analytics.actionBreakdown)
                              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
                          </Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text variant="bodyMd" as="p">Primary Device</Text>
                          <Badge>
                            {analytics.deviceBreakdown.mobile > analytics.deviceBreakdown.desktop
                              ? 'Mobile' : 'Desktop'}
                          </Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text variant="bodyMd" as="p">Total Events</Text>
                          <Badge>{analytics.totalEvents.toString()}</Badge>
                        </InlineStack>
                      </BlockStack>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        {/* Recent Activity */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Recent Activity</Text>
              {isLoading ? (
                <div style={{height: "400px", padding: "20px"}}>
                  <SkeletonBodyText lines={12} />
                </div>
              ) : recentEventsRows.length > 0 ? (
                <div
                  style={{
                    height: "400px",
                    overflowY: "auto",
                    border: "1px solid var(--p-border)",
                    borderRadius: "6px"
                  }}
                >
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text']}
                    headings={['Action', 'URL', 'Timestamp', 'Status']}
                    rows={recentEventsRows}
                  />
                </div>
              ) : (
                <EmptyState
                  heading="No recent activity"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>No visual search events recorded yet.</p>
                </EmptyState>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </>
  );
}