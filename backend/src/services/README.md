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

### Future Services

Additional services to be implemented:
- `scraper.ts` - Fetch engagement metrics from URLs
- `ycClient.ts` - YCombinator API integration
- `dmGenerator.ts` - Generate outreach message drafts
