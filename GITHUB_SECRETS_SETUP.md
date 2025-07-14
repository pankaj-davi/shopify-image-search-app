# 🔐 GitHub Secrets Setup for Development CI/CD

Copy these values to your GitHub repository secrets:

## Required Development Secrets

### Firebase Configuration
```
Secret Name: DEV_FIREBASE_PROJECT_ID
Secret Value: shopify-app-db

Secret Name: DEV_FIREBASE_CLIENT_EMAIL  
Secret Value: firebase-adminsdk-fbsvc@shopify-app-db.iam.gserviceaccount.com

Secret Name: DEV_FIREBASE_PRIVATE_KEY
Secret Value: -----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCirKJe3InVB2fn
OrkiHWc96Qo1RrYh443ZLBQjW6V5fBDH5fR0+RbILaJl7zA4RH02Jp3rIP83416q
7GA9/tY/jiULC3pYrM0O9TlRqOjpvGsl/fEUwo5+QjwSvEvtp0I66o74tmVBxmF6
+GJomOH1jVFwscdzs/kLSw/2uk0R6sA2dOmUoH5XuYhczfFXUaLk681bWwPwqz5q
GJx628AdGGxq747flw/IEP6l1BVVIrQ4Un7Rx4KiWk3umKSbsW0dtaaku4JRzuhT
2hO+LNXYQGnGOdjQhhVxqMvnkyLpTaj4YHDCvIzgh0g/JSsQ7toFXqjYFRNdwLMn
Gs76X/gFAgMBAAECggEAAcSyJtQAvJEuIDhGHcM85Xz5yIP6WV/K9t7Q4OSEuzoY
cu/X6oia++CWc24NnmL3iyXm0WZEV/lvr0MkCwXQ6D51k8s+EHuKZsdO0PQu2fxG
HD2IiB2oT7eNGyAIYZmP8aot6oa4ZDtm67UKWXw7TUB0xO6YeN8ZOItKQw1EkWAG
iX7neXmm84sHp0HzAoKi2dliz6cDBFsUUKfZUFkQ8H1zY6Yho+YplUeghh7n56uh
KdSCdj7ae04yhkbXaVE7CFDKdIJjJ4oRTGnLL39BXL2WSRtfWfWGS1ZivonIXn/N
3/3ZXxEbq8kVg+o7POEHzLkUoNKhyZVtEWzSH3RXYQKBgQDe3gY5k5Ofq+/HQUMi
p34BmVeU2r+9NBtIUH7XebycWjF6KJL6Ac1t5xFQ0UOv+HKxvt3nvz0w3RrUia+w
N+h+ZdKtZEJAyy9GX01jnT8NPTLEadJi2+Iyxygf9S6RsSWN/7PddwBJtWMeSKtB
ejyywSUq8HNAh2qcQ4lzBS64oQKBgQC628MsUbyNv9P8HaGmL4y10Bckg+d8RBa+
DF2uS5QAb5rHlOmjcEopq57/SBZUr2nJ1TwRmwlDuqSZiNUQPdLO9cGygPEoKKqH
8J+jPNQzgsk9+x2pSDOPd+uyHOezKmEqd2koknFneF4ehi7+uFj5B7gAzJ44c/rh
2ZN/flLQ5QKBgH0QqPucdkYvLUJqvCrxRQPOslhFHT4mxHyjN1rh5Nb0wjkkFb6Y
TlizR4NLu6k/SdW3Hz3SkpseKNVGYsIHzb9Ikp5c2dUUcHYUOxCAiIZ8ZkXUgIyb
iecm3bx5UWXOvB1gdeX8xruWP4YaD4iR+Qfy3VGoV3TJySjhuXtDWEGhAoGAfkjw
Cw/ioto2ZnmQOkSAkI/mVCNhWzaZODAbUCR8Dh9fN+uIS5EkTi1S86zAitNSZ7nZ
MvzYshF+FNXJSYS+6GhnVECYu09gkScqfKQrtfR6FY2VakcFsbyWanXmkcveh1jU
lTsDsa5DzdVaBYSJfSSeUsv3Uqfvspvdd5jkV5ECgYBmQnpsEQajksm0bxZwrmlF
C1efKEhMw9dMpYkU8vDbf9xOwOUFCMs+b/SZ9STvnhUx7HL5wnccJtkSlhRRosc2
Yb1fJUH33eJAcFxYsJWfaZud+UX6n8oYtU4sXc/Z8hOCctjlvNA/cbtwfQYfJhdN
xUZrZVNw3Mels0ceETrNeA==
-----END PRIVATE KEY-----

Secret Name: DEV_FIREBASE_DATABASE_URL
Secret Value: https://shopify-app-db-default-rtdb.firebaseio.com/
```

### Shopify Configuration
```
Secret Name: DEV_SHOPIFY_API_KEY
Secret Value: 19b92a0c7d4e217c2220271d82babe19

Secret Name: DEV_SHOPIFY_API_SECRET
Secret Value: fc3140c0bc579e00de96de9b1ccb541d

Secret Name: DEV_APP_URL
Secret Value: https://dna-dts-teams-niger.trycloudflare.com

Secret Name: DEV_SCOPES
Secret Value: write_products,read_products,write_script_tags,read_themes
```

### Optional Platform Secrets (Choose One)
```
# For Railway deployment
Secret Name: RAILWAY_TOKEN
Secret Value: [Get from railway.app dashboard]

# For Heroku deployment  
Secret Name: HEROKU_API_KEY
Secret Value: [Get from Heroku account settings]

# For Vercel deployment
Secret Name: VERCEL_TOKEN
Secret Value: [Get from Vercel account settings]
```

### Optional Notification Secrets
```
Secret Name: SLACK_WEBHOOK_URL
Secret Value: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

Secret Name: DISCORD_WEBHOOK_URL  
Secret Value: https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

## How to Add Secrets in GitHub:

1. Go to: https://github.com/pankaj-davi/shopify-image-search-app/settings/secrets/actions
2. Click "New repository secret"
3. Enter the secret name and value
4. Click "Add secret"
5. Repeat for all secrets above

## Note: 
- Copy the EXACT values from your .env file
- The private key should include the full content with BEGIN/END lines
- Make sure there are no extra spaces or characters
