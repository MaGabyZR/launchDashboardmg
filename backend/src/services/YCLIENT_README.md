# YC API Client Service

## Overview

The YC API Client Service provides integration with the free YCombinator API (yc-oss/api) to fetch fundraise data for YC companies. It implements fuzzy company name matching to handle variations and caches results for 24 hours to reduce API calls.

## Features

- **Fuzzy Name Matching**: Handles company name variations using Levenshtein distance algorithm
- **Name Normalization**: Removes common suffixes (Inc, LLC, Corp, etc.) and special characters
- **24-Hour Caching**: Reduces API calls by caching successful and failed lookups
- **Error Handling**: Gracefully handles API errors (404, 429, 503) and network issues
- **Field Flexibility**: Supports both snake_case and camelCase field names from API

## API

### `searchYCCompany(companyName: string): Promise<YCCompany | null>`

Searches for a YC company by name with fuzzy matching.

**Parameters:**
- `companyName` (string): Name of the company to search for

**Returns:**
- `YCCompany` object if found with similarity score >= 70%
- `null` if company not found or similarity score < 70%

**YCCompany Interface:**
```typescript
interface YCCompany {
  name: string;           // Company name from YC database
  batch: string;          // YC batch (e.g., "W24", "S23")
  amountRaised: number;   // Amount raised in dollars
  announcementDate: string; // ISO date string
}
```

## Usage Examples

### Basic Search

```typescript
import { searchYCCompany } from './services/ycClient.js';

const result = await searchYCCompany('Airbnb');

if (result) {
  console.log(`Found: ${result.name}`);
  console.log(`Batch: ${result.batch}`);
  console.log(`Raised: $${result.amountRaised.toLocaleString()}`);
} else {
  console.log('Company not found in YC database');
}
```

### Handling Name Variations

```typescript
// All of these will match the same company (if similarity >= 70%)
await searchYCCompany('Stripe');
await searchYCCompany('Stripe Inc');
await searchYCCompany('Stripe Corporation');
await searchYCCompany('Stripe, Inc.');
```

### Integration with Launch Post Workflow

```typescript
// When user adds a launch post
const companyName = 'Coinbase';
const ycData = await searchYCCompany(companyName);

if (ycData) {
  // Store fundraise data with source: 'yc_api'
  await db.fundraise.create({
    data: {
      companyId: company.id,
      amount: ycData.amountRaised,
      announcementDate: new Date(ycData.announcementDate),
      source: 'YC_API'
    }
  });
} else {
  // Allow manual entry with source: 'manual'
  console.log('YC data not available - user can enter manually');
}
```

## Implementation Details

### Fuzzy Matching Algorithm

The service uses Levenshtein distance to calculate similarity between company names:

1. **Normalization**: Both search term and API names are normalized:
   - Convert to lowercase
   - Remove common suffixes (Inc, LLC, Corp, Corporation, Ltd, Limited, Co)
   - Remove special characters
   - Trim whitespace

2. **Similarity Calculation**: 
   - Calculate edit distance between normalized names
   - Convert to similarity score: `(length - distance) / length`
   - Threshold: 70% similarity required for match

3. **Best Match Selection**:
   - If multiple companies match, select the one with highest similarity score
   - Return null if best score < 70%

### Caching Strategy

- **Cache Key**: Normalized company name
- **Cache TTL**: 24 hours (86,400,000 milliseconds)
- **Cache Storage**: In-memory Map (resets on server restart)
- **Cached Data**: Both successful results and null results (to avoid repeated failed requests)

### Error Handling

| Error Type | Status Code | Behavior |
|------------|-------------|----------|
| Company not found | 404 | Return null, cache result |
| Rate limit exceeded | 429 | Log warning, return null, cache result |
| Service unavailable | 503 | Log error, return null, cache result |
| Network error | N/A | Log error, return null, cache result |
| Invalid response | N/A | Log warning, return null, cache result |

## Configuration

### API Endpoint

```typescript
const YC_API_BASE_URL = 'https://api.ycombinator.com/v0.1';
```

### Request Timeout

```typescript
const REQUEST_TIMEOUT = 10000; // 10 seconds
```

### Cache TTL

```typescript
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

### Similarity Threshold

```typescript
const SIMILARITY_THRESHOLD = 0.7; // 70%
```

## Testing

The service includes comprehensive unit tests covering:

- Input validation (empty, whitespace, invalid types)
- Successful API responses
- Fuzzy matching with name variations
- Name normalization (suffix removal)
- Company not found scenarios
- Similarity threshold enforcement
- Error handling (404, 429, 503, network errors)
- Invalid response format handling
- Missing field handling
- Field name variations (snake_case vs camelCase)
- Best match selection with multiple results
- Whitespace trimming

Run tests:
```bash
npm test -- ycClient.test.ts
```

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 3.1**: Backend integrates with free YC_API from yc-oss/api GitHub repository
- **Requirement 3.2**: Backend queries YC_API for fundraise information when company name provided
- **Requirement 3.6**: When YC_API data unavailable, manual entry interface allows manual fundraise data entry

## Future Enhancements

1. **Persistent Cache**: Use Redis or database for cache persistence across server restarts
2. **Batch Queries**: Support searching multiple companies in a single request
3. **Advanced Matching**: Implement more sophisticated fuzzy matching algorithms (e.g., Jaro-Winkler)
4. **Metrics**: Track cache hit rate and API response times
5. **Rate Limiting**: Implement client-side rate limiting to respect API limits
6. **Retry Logic**: Add exponential backoff for transient errors

## Related Files

- `backend/src/services/ycClient.ts` - Main implementation
- `backend/src/services/ycClient.test.ts` - Unit tests
- `backend/src/services/ycClient.example.ts` - Usage examples
- `backend/src/types/index.ts` - Type definitions
