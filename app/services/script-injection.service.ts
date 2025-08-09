// This service has been completely removed as automatic script injection is no longer supported
// Visual search functionality is now provided exclusively through App Blocks

export class ScriptInjectionService {
  /**
   * Legacy cleanup function - only for removing old scripts during migration
   */
  static async removeVisualSearchScript(admin: any, shopDomain: string) {
    console.log(`[CLEANUP] Removing legacy visual search scripts for ${shopDomain}`);
    
    try {
      const existingScripts = await admin.graphql(`
        query {
          scriptTags(first: 10) {
            edges {
              node {
                id
                src
                displayScope
              }
            }
          }
        }
      `);

      const existingScriptData = await existingScripts.json();
      const scriptToRemove = existingScriptData.data.scriptTags.edges.find(
        (edge: any) => edge.node.src.includes('/visual-search-script.js') || 
                      edge.node.src.includes('/visual-search-unified.js')
      );

      if (!scriptToRemove) {
        return { success: true, message: "No legacy script found to remove" };
      }

      const deleteScriptMutation = await admin.graphql(`
        mutation scriptTagDelete($id: ID!) {
          scriptTagDelete(id: $id) {
            deletedScriptTagId
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          id: scriptToRemove.node.id
        }
      });

      const result = await deleteScriptMutation.json();
      
      if (result.data.scriptTagDelete.userErrors.length > 0) {
        return { 
          success: false, 
          error: "Error removing legacy script: " + result.data.scriptTagDelete.userErrors.map((e: any) => e.message).join(', ')
        };
      }

      return { 
        success: true, 
        message: "Legacy script removed successfully. Visual search is now available exclusively through App Blocks.",
        deletedId: result.data.scriptTagDelete.deletedScriptTagId 
      };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error during cleanup"
      };
    }
  }
}
