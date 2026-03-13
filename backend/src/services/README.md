# Services

This directory contains business logic services for the Launch Tracker Dashboard backend.

## URL Parser Service

**File**: `urlParser.ts`

### Purpose

Parses and validates URLs from X (Twitter) and LinkedIn to extract platform type and post identifiers. This service is critical for validating user input and preparing URLs for scraping.

### Supported Platforms

#### X (Twitter)
- `https://twitter.com/username/status/1234567890`
- `https://x.com/username/status/1234567890`
- `https://mobile.twitter.com/username/status/1234567890`
- Supports both `http` and `https` protocols
- Supports `www` prefix
- Handles query parameters and URL fragments

#### LinkedIn
- `https://www.linkedin.com/posts/username_activity-1234567890-abcd`
- `https://linkedin.com/feed/update/urn:li:activity:1234567890`
- Supports both `http` and `https` protocols
- Supports with or without `www` prefix

### API

```typescript
interface ParsedURL {
  platform: 'x' | 'linkedin';
  postId: string;
  isValid: boolean;
  error?: string;
}

function parseURL(url: string): ParsedURL;
```

### Usage

```typescript
import { parseURL } from './services/urlParser.js';

const result = parseURL('https://twitter.com/user/status/1234567890');

if (result.isValid) {
  console.log(`Platform: ${result.platform}`);
  console.log(`Post ID: ${result.postId}`);
  // Proceed with scraping or storage
} else {
  console.error(`Error: ${result.error}`);
  // Show error to user
}
```

### Error Handling

The parser returns descriptive error messages for:
- Empty or invalid input
- Unsupported platforms
- Malformed URLs
- Missing post identifiers

All errors are returned in the `error` field with `isValid: false`.

### Testing

Comprehensive unit tests are available in `urlParser.test.ts`:
- 37 test cases covering all supported formats
- Edge cases (empty strings, special characters, encoded URLs)
- Error scenarios
- Case sensitivity handling

Run tests:
```bash
npm test -- urlParser.test.ts --run
```

### Requirements Validation

This service validates the following requirements:
- **1.3**: URL validation for X and LinkedIn
- **1.4**: Platform type and post identifier extraction
- **11.1**: X (Twitter) URL parsing
- **11.2**: LinkedIn URL parsing
- **11.3**: URL format validation
- **11.5**: Mobile and desktop URL format support

## Scraping Service

**File**: `scraper.ts`

### Purpose

Fetches public engagement metrics (likes) from X (Twitter) and LinkedIn posts using Cheerio for lightweight HTML parsing. This service provides the core functionality for automatically collecting engagement data without requiring paid API access.

### Features

- **Lightweight HTML Parsing**: Uses Cheerio for fast, efficient parsing
- **Error Handling**: Gracefully handles network errors, timeouts, and rate limits
- **Multiple Selector Support**: Tries multiple CSS selectors to handle platform structure changes
- **Timeout Protection**: 10-second timeout per request to prevent hanging
- **User Agent Spoofing**: Mimics browser requests for better success rates

### API

```typescript
interface ScrapedMetrics {
  likes: number;
  success: boolean;
  error?: string;
  scrapedAt: Date;
}

async function scrapeXPost(postId: string): Promise<ScrapedMetrics>;
async function scrapeLinkedInPost(postId: string): Promise<ScrapedMetrics>;
```

### Usage

```typescript
import { scrapeXPost, scrapeLinkedInPost } from './services/scraper.js';

// Scrape X post
const xResult = await scrapeXPost('1234567890123456789');
if (xResult.success) {
  console.log(`Likes: ${xResult.likes}`);
} else {
  console.error(`Error: ${xResult.error}`);
}

// Scrape LinkedIn post
const linkedInResult = await scrapeLinkedInPost('7123456789012345678');
if (linkedInResult.success) {
  console.log(`Likes: ${linkedInResult.likes}`);
}
```

### Supported Metrics

Currently supports:
- **X (Twitter)**: Like counts
- **LinkedIn**: Reaction counts (including K notation like "1.2K")

### Error Handling

The scraper handles various error scenarios:
- **Network Errors**: Connection failures, timeouts
- **Rate Limiting**: HTTP 429 responses
- **Authentication Errors**: HTTP 401/403 responses
- **Parsing Errors**: Missing or malformed HTML elements
- **Empty Responses**: Returns 0 likes with success status

All errors are logged and returned in the `error` field with `success: false`.

### Testing

Comprehensive unit tests are available in `scraper.test.ts`:
- 14 test cases covering success and failure scenarios
- Network error handling
- Rate limit and timeout handling
- Edge cases (empty HTML, malformed responses, K notation)
- Mock-based testing for reliable CI/CD

Run tests:
```bash
npm test -- scraper.test.ts --run
```

### Requirements Validation

This service validates the following requirements:
- **2.1**: Fetch engagement metrics from launch post URLs
- **2.2**: Extract like counts from X (Twitter) posts
- **2.3**: Extract like counts from LinkedIn posts

### Important Notes

⚠️ **Terms of Service Compliance**: This service scrapes public data from social media platforms. Users should be aware of potential ToS violations. The dashboard displays a disclaimer acknowledging these risks.

⚠️ **Reliability**: Social media platforms frequently change their HTML structure. The scraper uses multiple selectors to improve reliability, but may require updates when platforms change.

⚠️ **Rate Limiting**: This base implementation does not include rate limiting. See task 4.2 for rate limiting implementation.

### Future Enhancements

To be implemented in subsequent tasks:
- Rate limiting (max 10 requests per minute per platform)
- Exponential backoff retry logic (3 attempts max)
- Puppeteer fallback for JavaScript-rendered content
- Caching to reduce redundant requests

### Future Services

Additional services to be implemented:
- `ycClient.ts` - YCombinator API integration
- `dmGenerator.ts` - Generate outreach message drafts
