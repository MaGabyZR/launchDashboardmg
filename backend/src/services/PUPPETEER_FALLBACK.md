# Puppeteer Fallback Implementation

## Overview

Task 4.5 adds Puppeteer as a fallback mechanism for scraping JavaScript-rendered content when Cheerio (lightweight HTML parser) fails to extract engagement metrics.

## Implementation Details

### Dependencies Added

- `@sparticuz/chromium@^121.0.0` - Lightweight Chromium binary optimized for serverless environments
- `puppeteer-core@^21.0.0` - Already installed, now actively used for fallback

### Key Features

1. **Automatic Fallback Logic**: When Cheerio returns 0 likes, the scraper automatically attempts to use Puppeteer
2. **Lightweight Configuration**: Uses `@sparticuz/chromium` for optimized serverless deployment
3. **10-Second Timeout**: Each Puppeteer request has a 10-second timeout as specified in requirements
4. **Resource Cleanup**: Browser instances are properly closed even if errors occur

### How It Works

```typescript
// 1. Try Cheerio first (fast, lightweight)
const $ = cheerio.load(response.data);
let likes = extractLikesFromCheerio($);

// 2. If Cheerio fails (0 likes), fallback to Puppeteer
if (likes === 0) {
  likes = await scrapeWithPuppeteer(url, selectors);
}
```

### Puppeteer Configuration

```typescript
browser = await puppeteer.launch({
  args: chromium.args,                    // Optimized args for serverless
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

### Timeout Configuration

- **REQUEST_TIMEOUT**: 10,000ms (10 seconds) - Applied to both Cheerio and Puppeteer
- **Navigation**: Uses `waitUntil: 'networkidle2'` for JavaScript-heavy pages

### Error Handling

- Puppeteer errors are caught and logged
- Returns 0 likes if Puppeteer also fails
- Browser cleanup happens in `finally` block to prevent resource leaks

## Testing

Added comprehensive test coverage for:
- ✅ Puppeteer fallback when Cheerio returns 0 likes (X and LinkedIn)
- ✅ Puppeteer timeout handling
- ✅ Browser cleanup on errors
- ✅ No Puppeteer usage when Cheerio succeeds
- ✅ Graceful handling when Puppeteer also returns 0 likes

All 94 tests passing, including 6 new Puppeteer fallback tests.

## Validates Requirements

- **Requirement 2.1**: Fetch engagement metrics from public URLs
- Implements Puppeteer fallback for JavaScript-rendered content
- Configures lightweight Puppeteer mode for serverless deployment
- Adds 10-second timeout per request
- Maintains existing Cheerio-first approach for performance

## Performance Considerations

- **Cheerio First**: Fast HTML parsing for static content (~100ms)
- **Puppeteer Fallback**: Only used when needed (~2-5 seconds with browser launch)
- **Serverless Optimized**: Uses `@sparticuz/chromium` for smaller bundle size
- **Resource Management**: Proper browser cleanup prevents memory leaks

## Future Improvements

- Consider caching browser instances for multiple requests (if not serverless)
- Add metrics tracking for Cheerio vs Puppeteer success rates
- Implement selector rotation if platforms change their HTML structure
