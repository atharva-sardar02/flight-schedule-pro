# CloudFront Setup for SPA Routing

To fix the 404 issue with direct URL access (like `/login`), we need to set up CloudFront with a Lambda@Edge function.

## Option 1: Quick Fix (Use Root URL)

For now, users should access:
```
http://flight-schedule-pro-frontend.s3-website-us-east-1.amazonaws.com
```

Then navigate within the app. Direct URLs like `/login` will show 404.

## Option 2: CloudFront Distribution (Recommended)

1. Go to AWS Console → CloudFront
2. Create Distribution
3. Origin: S3 bucket `flight-schedule-pro-frontend`
4. Add Lambda@Edge function to rewrite all requests to `index.html`

This is more complex but provides proper SPA routing.

## Option 3: Update App to Use Hash Router

Change from `BrowserRouter` to `HashRouter` in `App.tsx`:
- URLs will be: `http://.../#/login` instead of `http://.../login`
- Works with S3 without CloudFront
- Less clean URLs but simpler setup

