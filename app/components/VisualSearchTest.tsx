// Test Component for Visual Search API
// Add this to any of your app routes to test the API

import React, { useState } from "react";
import { Card, Button, Text, BlockStack } from "@shopify/polaris";

export function VisualSearchTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const testAPI = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/product-handle', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to call API' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">🧪 Visual Search API Test</Text>
        <div>
          <Text as="p" variant="bodyMd" tone="subdued">
            Upload an image to test the visual search functionality
          </Text>
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        
        <Button 
          variant="primary"
          loading={loading} 
          disabled={!selectedFile}
          onClick={testAPI}
        >
          Test Visual Search API
        </Button>

        {result && (
          <div>
            <Text as="h3" variant="headingMd">API Response:</Text>
            <div style={{ 
              background: '#f6f6f7', 
              padding: '16px', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxHeight: '400px',
              border: '1px solid #e1e3e5'
            }}>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </BlockStack>
    </Card>
  );
}
