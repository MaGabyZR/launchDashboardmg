# Implementation Plan: Launch Tracker Dashboard

## Overview

This implementation plan breaks down the Launch Tracker Dashboard into discrete, actionable coding tasks. The system is a zero-cost MVP using React + Vite frontend, Node.js + Express backend (Vercel serverless functions), Vercel Postgres + Prisma ORM, and open-source scraping libraries. All tasks build incrementally, with property-based tests integrated throughout to validate correctness properties from the design document.

**Implementation Language**: TypeScript

## Tasks

- [x] 1. Project setup and infrastructure configuration
  - [x] 1.1 Initialize monorepo structure with frontend and backend workspaces
    - Create root package.json with workspaces for `frontend` and `backend`
    - Set up TypeScript configuration for both workspaces
    - Configure shared ESLint and Prettier settings
    - _Requirements: 9.1, 9.2_

  - [x] 1.2 Set up frontend with React + Vite + Tailwind CSS
    - Initialize Vite project with React and TypeScript template
    - Install and configure Tailwind CSS with PostCSS
    - Install TanStack Query for server state management
    - Install React Hook Form for form validation
    - Create basic app shell with routing
    - _Requirements: 9.1, 15.1_

  - [x] 1.3 Set up backend with Node.js + Express for Vercel serverless
    - Create Express app structure compatible with Vercel serverless functions
    - Install dependencies: express, axios, cheerio, puppeteer-core
    - Configure TypeScript for Node.js backend
    - Set up API route structure in `/api` directory
    - _Requirements: 9.2, 8.1-8.6_

  - [x] 1.4 Configure Vercel deployment and environment variables
    - Create `vercel.json` configuration file
    - Set up environment variable structure for DATABASE_URL
    - Configure build commands for frontend and backend
    - Create `.env.example` files for local development
    - _Requirements: 9.3, 9.4_

- [x] 2. Database layer with Prisma ORM
  - [x] 2.1 Initialize Prisma and define database schema
    - Install Prisma CLI and client
    - Create Prisma schema with Company, Fundraise, LaunchPost, ContactInfo models
    - Define enums for Platform and DataSource
    - Set up relationships and indexes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7_

  - [x] 2.2 Create and run initial database migration
    - Generate Prisma migration files
    - Test migration on local Postgres instance
    - Document migration process for Vercel Postgres
    - _Requirements: 7.5_

  - [x] 2.3 Set up Prisma client and database connection utilities
    - Create database connection singleton for serverless functions
    - Implement connection pooling configuration
    - Add error handling for database connection failures
    - _Requirements: 9.4_

  - [x]* 2.4 Write property test for data persistence with metadata
    - **Property 3: Data Persistence with Metadata**
    - **Validates: Requirements 1.5, 2.4, 3.4, 5.5**
    - Test that any data entity stored in database is retrievable with all metadata intact

- [-] 3. URL Parser Service
  - [x] 3.1 Implement URL parser for X (Twitter) and LinkedIn
    - Create `services/urlParser.ts` with parseURL function
    - Implement regex patterns for X URLs (twitter.com, x.com, mobile variants)
    - Implement regex patterns for LinkedIn URLs (posts and feed updates)
    - Extract platform type and post ID from valid URLs
    - Return structured ParsedURL object with validation status
    - _Requirements: 1.3, 1.4, 11.1, 11.2, 11.3, 11.5_

  - [ ]* 3.2 Write property test for URL parsing and validation
    - **Property 1: URL Parsing and Validation**
    - **Validates: Requirements 1.3, 1.4, 11.1, 11.2, 11.5**
    - Test that any valid X or LinkedIn URL is correctly parsed with platform and post ID

  - [ ]* 3.3 Write property test for invalid URL error handling
    - **Property 2: Invalid URL Error Handling**
    - **Validates: Requirements 1.6, 11.4**
    - Test that any invalid URL returns descriptive error message

  - [ ]* 3.4 Write unit tests for URL parser edge cases
    - Test special characters in URLs
    - Test encoded URLs
    - Test malformed URLs
    - Test URLs with query parameters
    - _Requirements: 11.3, 11.4_

- [~] 4. Scraping Service with rate limiting and error handling
  - [x] 4.1 Implement base scraping service with Cheerio
    - Create `services/scraper.ts` with scrapeXPost and scrapeLinkedInPost functions
    - Implement HTML fetching with axios
    - Parse engagement metrics (likes) from HTML structure
    - Return ScrapedMetrics object with success status
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 Add rate limiting with bottleneck library
    - Install and configure bottleneck for rate limiting
    - Set max 10 requests per minute per platform
    - Implement request queuing
    - _Requirements: 2.1_

  - [ ] 4.3 Implement exponential backoff retry logic
    - Add retry mechanism with 1s, 2s, 4s delays
    - Maximum 3 retry attempts
    - Log each retry attempt
    - Store failure record after max retries
    - _Requirements: 10.1, 10.3, 10.4_

  - [ ]* 4.4 Write property test for exponential backoff retry pattern
    - **Property 12: Exponential Backoff Retry Pattern**
    - **Validates: Requirements 10.3**
    - Test that failed scraping attempts retry with correct exponential delays

  - [~] 4.5 Add Puppeteer fallback for JavaScript-rendered content
    - Install puppeteer-core with chromium
    - Implement fallback logic when Cheerio parsing fails
    - Configure lightweight Puppeteer mode
    - Add 10-second timeout per request
    - _Requirements: 2.1_

  - [~] 4.6 Implement error handling and logging
    - Handle rate limit errors (429 responses)
    - Handle network timeouts
    - Handle parsing errors
    - Log all errors with context (platform, post ID)
    - Mark data for manual entry on failure
    - _Requirements: 2.5, 2.6, 10.1, 10.2, 10.5_

  - [ ]* 4.7 Write property test for scraping error isolation
    - **Property 11: Scraping Error Isolation**
    - **Validates: Requirements 10.2**
    - Test that scraping failures don't interrupt other scraping requests

  - [ ]* 4.8 Write unit tests for scraping service
    - Mock successful scraping responses
    - Test rate limit error handling
    - Test network timeout handling
    - Test HTML parsing with various structures
    - _Requirements: 2.1, 2.2, 2.3, 10.1_

- [~] 5. YCombinator API Client
  - [~] 5.1 Implement YC API client service
    - Create `services/ycClient.ts` with searchYCCompany function
    - Integrate with yc-oss/api endpoints
    - Implement fuzzy company name matching
    - Parse YC API responses for company data
    - Return YCCompany object or null if not found
    - _Requirements: 3.1, 3.2, 3.6_

  - [~] 5.2 Add response caching for 24 hours
    - Implement in-memory cache with TTL
    - Cache successful YC API responses
    - Reduce redundant API calls
    - _Requirements: 3.1_

  - [ ]* 5.3 Write property test for YC API response parsing
    - **Property 4: YC API Response Parsing**
    - **Validates: Requirements 3.3**
    - Test that any valid YC API response is correctly parsed

  - [~] 5.4 Add error handling for YC API failures
    - Handle API unavailable (503) errors
    - Handle rate limit errors
    - Handle invalid response formats
    - Return null and log errors
    - _Requirements: 3.6_

  - [ ]* 5.5 Write unit tests for YC API client
    - Mock successful API responses
    - Test company not found scenarios
    - Test API unavailable handling
    - Test response parsing with various data formats
    - _Requirements: 3.1, 3.2, 3.3_

- [~] 6. DM Generator Service
  - [~] 6.1 Implement low engagement detection logic
    - Create `services/dmGenerator.ts` with classifyEngagement function
    - Define thresholds: X < 50 likes, LinkedIn < 100 likes
    - Calculate total engagement across platforms
    - Return boolean classification
    - _Requirements: 6.1, 6.2_

  - [~] 6.2 Implement DM draft generation
    - Create generateDM function
    - Build message template with company name
    - Include reason for outreach
    - Return DMDraft object or null
    - _Requirements: 6.3_

  - [ ]* 6.3 Write property test for low engagement classification
    - **Property 6: Low Engagement Classification**
    - **Validates: Requirements 6.2**
    - Test that posts below threshold are classified as low engagement

  - [ ]* 6.4 Write property test for DM draft generation
    - **Property 7: DM Draft Generation**
    - **Validates: Requirements 6.3**
    - Test that low-engagement companies get DM drafts with company name

  - [ ]* 6.5 Write unit tests for DM generator
    - Test threshold detection for X posts
    - Test threshold detection for LinkedIn posts
    - Test combined engagement calculation
    - Test message template generation
    - Test null handling for missing data
    - _Requirements: 6.1, 6.2, 6.3_

- [~] 7. API Endpoint: GET /api/companies
  - [~] 7.1 Implement companies list endpoint
    - Create `/api/companies/index.ts` serverless function
    - Query all companies with related data (fundraise, launchPosts, contactInfo)
    - Support query parameters: sortBy, order, minEngagement, hasContact
    - Calculate isLowEngagement and dmDraft for each company
    - Return JSON response with companies array
    - _Requirements: 8.1, 4.1_

  - [ ]* 7.2 Write property test for complete company data rendering
    - **Property 5: Complete Company Data Rendering**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
    - Test that any company with data displays all metrics with source indicators

  - [ ]* 7.3 Write property test for JSON response format
    - **Property 10: JSON Response Format**
    - **Validates: Requirements 8.8**
    - Test that any successful API response returns valid JSON

  - [ ]* 7.4 Write unit tests for companies endpoint
    - Test request validation
    - Test response format verification
    - Test filtering and sorting
    - Test database interaction with mocked Prisma
    - _Requirements: 8.1_

- [~] 8. API Endpoint: POST /api/launch-posts
  - [~] 8.1 Implement launch posts creation endpoint
    - Create `/api/launch-posts/index.ts` serverless function
    - Accept URLs array and companyName in request body
    - Validate each URL using URL parser
    - Create or find company record
    - Store URL metadata in database
    - Trigger async scraping for each URL (non-blocking)
    - Query YC API if company name provided
    - Return results array with success/failure status per URL
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.5, 13.3, 13.4_

  - [~] 8.2 Add support for manual metrics entry
    - Accept optional manualMetrics in request body
    - Store manual metrics with MANUAL data source
    - Skip scraping when manual metrics provided
    - _Requirements: 2.6_

  - [ ]* 8.3 Write property test for bulk URL input parsing
    - **Property 14: Bulk URL Input Parsing**
    - **Validates: Requirements 13.2**
    - Test that multiple URLs separated by newlines or commas are correctly parsed

  - [ ]* 8.4 Write property test for batch URL processing
    - **Property 15: Batch URL Processing and Validation**
    - **Validates: Requirements 13.3, 13.4, 13.6**
    - Test that batch URLs are validated individually with error reporting

  - [ ]* 8.5 Write property test for API error response format
    - **Property 9: API Error Response Format**
    - **Validates: Requirements 8.7**
    - Test that invalid requests return appropriate HTTP error codes and JSON error messages

  - [ ]* 8.6 Write unit tests for launch posts endpoint
    - Test single URL submission
    - Test bulk URL submission
    - Test validation error handling
    - Test manual metrics entry
    - Test YC API integration
    - _Requirements: 8.5, 13.1, 13.2, 13.5_

- [~] 9. API Endpoint: POST /api/refresh/:companyId
  - [~] 9.1 Implement data refresh endpoint
    - Create `/api/refresh/[id].ts` serverless function
    - Get company's launch post URLs from database
    - Trigger scraping for each URL
    - Update existing records with new metrics
    - Return summary with updated/failed counts
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 9.2 Write property test for data refresh updates
    - **Property 13: Data Refresh Updates Existing Records**
    - **Validates: Requirements 12.4**
    - Test that refresh updates existing records instead of creating duplicates

  - [~] 9.3 Add last refresh timestamp tracking
    - Update lastScraped field on successful refresh
    - Return timestamp in response
    - _Requirements: 12.5_

  - [~] 9.4 Handle refresh failures gracefully
    - Mark posts needing manual update when scraping fails
    - Log refresh errors
    - Continue processing remaining posts
    - _Requirements: 12.6_

  - [ ]* 9.5 Write unit tests for refresh endpoint
    - Test successful refresh flow
    - Test partial failure handling
    - Test timestamp updates
    - Test error response format
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [~] 10. API Endpoint: POST /api/companies/:companyId/contact
  - [~] 10.1 Implement contact information endpoint
    - Create `/api/companies/[id]/contact.ts` serverless function
    - Accept email, phone, linkedinUrl, xHandle in request body
    - Validate email format
    - Format phone number
    - Create or update ContactInfo record
    - Return saved contact information
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.6_

  - [ ]* 10.2 Write unit tests for contact endpoint
    - Test contact creation
    - Test contact updates
    - Test email validation
    - Test phone formatting
    - Test partial data updates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [~] 11. API Endpoint: GET /api/export
  - [~] 11.1 Implement data export endpoint
    - Create `/api/export/index.ts` serverless function
    - Support format query parameter (csv or json)
    - Support companyIds filter for selective export
    - Query companies with all related data
    - Generate CSV or JSON output
    - Set appropriate Content-Type and Content-Disposition headers
    - Include timestamp in filename
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 11.2 Write property test for export data completeness
    - **Property 16: Export Data Completeness**
    - **Validates: Requirements 14.2, 14.3, 14.4**
    - Test that exports contain all required fields for all companies

  - [ ]* 11.3 Write property test for export metadata inclusion
    - **Property 17: Export Metadata Inclusion**
    - **Validates: Requirements 14.6**
    - Test that exports include timestamp and data source indicators

  - [ ]* 11.4 Write unit tests for export endpoint
    - Test CSV format generation
    - Test JSON format generation
    - Test filtering by company IDs
    - Test timestamp inclusion
    - Test data source indicators
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [~] 12. Checkpoint - Backend services and API endpoints complete
  - Ensure all tests pass, ask the user if questions arise.

- [~] 13. Frontend: Dashboard layout and routing
  - [~] 13.1 Create main Dashboard component
    - Create `src/components/Dashboard.tsx`
    - Set up TanStack Query for fetching companies
    - Implement loading and error states
    - Display companies in responsive grid layout
    - _Requirements: 4.1, 15.1_

  - [~] 13.2 Implement responsive grid layout
    - Use Tailwind CSS grid utilities
    - Single column on mobile (< 768px)
    - Multi-column grid on desktop (>= 768px)
    - Maintain readability across screen sizes
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 13.3 Write property test for responsive layout adaptation
    - **Property 18: Responsive Layout Adaptation**
    - **Validates: Requirements 15.1**
    - Test that layout adapts appropriately to different screen widths

  - [ ]* 13.4 Write unit tests for Dashboard component
    - Test component rendering with various data
    - Test loading state display
    - Test error state display
    - Test responsive behavior at breakpoints
    - _Requirements: 4.1, 15.1_

- [~] 14. Frontend: CompanyCard component
  - [~] 14.1 Create CompanyCard component
    - Create `src/components/CompanyCard.tsx`
    - Display company name and YC batch
    - Display fundraise amount with source indicator
    - Display X likes with source indicator
    - Display LinkedIn likes with source indicator
    - Display contact information section
    - Display DM draft for low engagement companies
    - Display last updated timestamp
    - Add refresh button with loading state
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 5.6, 5.7, 6.4, 12.5_

  - [~] 14.2 Implement data source indicators
    - Create visual badges for MANUAL, SCRAPED, YC_API sources
    - Use distinct colors for each source type
    - Display null indicator for missing data
    - _Requirements: 4.5, 4.6_

  - [~] 14.3 Add copy-to-clipboard for DM drafts
    - Implement clipboard API integration
    - Show success feedback on copy
    - _Requirements: 6.5_

  - [ ]* 14.4 Write unit tests for CompanyCard component
    - Test rendering with complete data
    - Test rendering with missing data
    - Test data source indicator display
    - Test refresh button interaction
    - Test clipboard copy functionality
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 6.4, 6.5_

- [~] 15. Frontend: ManualEntryForm component
  - [~] 15.1 Create ManualEntryForm component for single URL entry
    - Create `src/components/ManualEntryForm.tsx`
    - Add input field for URL
    - Add input field for company name
    - Implement client-side URL validation
    - Display validation errors
    - Handle form submission with loading state
    - Show success/error feedback
    - _Requirements: 1.1, 1.2, 1.6_

  - [~] 15.2 Add bulk URL entry mode
    - Add textarea for multiple URLs
    - Parse newline or comma-separated URLs
    - Validate each URL individually
    - Display summary of successful/failed URLs
    - Show which URLs failed and why
    - _Requirements: 13.1, 13.2, 13.5, 13.6_

  - [~] 15.3 Add manual metrics entry fields
    - Add optional fields for X likes
    - Add optional fields for LinkedIn likes
    - Show manual entry fields when scraping fails
    - _Requirements: 2.6, 10.6_

  - [~] 15.4 Ensure mobile-friendly form inputs
    - Use appropriate input types for mobile keyboards
    - Ensure touch targets are at least 44x44 pixels
    - Test on mobile devices
    - _Requirements: 15.5, 15.6_

  - [ ]* 15.5 Write property test for touch target accessibility
    - **Property 19: Touch Target Accessibility**
    - **Validates: Requirements 15.5**
    - Test that interactive elements meet minimum 44x44px size on mobile

  - [ ]* 15.6 Write unit tests for ManualEntryForm component
    - Test single URL submission
    - Test bulk URL submission
    - Test validation error display
    - Test manual metrics entry
    - Test loading and success states
    - _Requirements: 1.1, 1.2, 1.6, 13.1, 13.2_

- [~] 16. Frontend: ContactInfoForm component
  - [~] 16.1 Create ContactInfoForm component
    - Create `src/components/ContactInfoForm.tsx`
    - Add input fields for email, phone, LinkedIn URL, X handle
    - Implement email validation
    - Implement phone number formatting
    - Handle form submission
    - Pre-populate with existing data
    - Display save confirmation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ]* 16.2 Write unit tests for ContactInfoForm component
    - Test form rendering
    - Test email validation
    - Test phone formatting
    - Test form submission
    - Test pre-population with existing data
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [~] 17. Frontend: FilterBar and ExportButton components
  - [~] 17.1 Create FilterBar component
    - Create `src/components/FilterBar.tsx`
    - Add sort by dropdown (date, engagement, fundraise amount)
    - Add sort order toggle (asc/desc)
    - Add minimum engagement filter
    - Add has contact info filter
    - Update query parameters on filter change
    - _Requirements: 14.5_

  - [~] 17.2 Create ExportButton component
    - Create `src/components/ExportButton.tsx`
    - Add format selection (CSV or JSON)
    - Trigger export API call
    - Handle file download
    - Show loading state during export
    - _Requirements: 14.1_

  - [ ]* 17.3 Write unit tests for FilterBar and ExportButton
    - Test filter interactions
    - Test export button click
    - Test format selection
    - Test loading states
    - _Requirements: 14.1, 14.5_

- [~] 18. Frontend: Error handling and user feedback
  - [~] 18.1 Implement global error boundary
    - Create error boundary component
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: 1.6, 8.7_

  - [~] 18.2 Add ToS disclaimer for web scraping
    - Create disclaimer component
    - Display on dashboard load
    - Acknowledge scraping risks
    - _Requirements: 2.5_

  - [~] 18.3 Implement user-facing error messages
    - Create error message utilities
    - Map technical errors to user-friendly messages
    - Display actionable next steps
    - _Requirements: 1.6, 10.5, 10.6, 12.6_

  - [ ]* 18.4 Write unit tests for error handling
    - Test error boundary rendering
    - Test error message display
    - Test disclaimer display
    - _Requirements: 1.6, 2.5_

- [~] 19. Testing infrastructure setup
  - [~] 19.1 Configure Vitest for unit testing
    - Install Vitest and testing utilities
    - Configure test environment for React components
    - Set up test database for integration tests
    - Configure coverage reporting
    - _Requirements: All testing requirements_

  - [~] 19.2 Configure fast-check for property-based testing
    - Install fast-check library
    - Create custom generators for URLs, companies, and data entities
    - Configure test runs for 100 iterations minimum
    - Set up seed-based reproducibility
    - _Requirements: All property testing requirements_

  - [~] 19.3 Set up Playwright for E2E testing
    - Install Playwright
    - Configure test browsers
    - Create test fixtures for database seeding
    - _Requirements: Integration testing_

  - [~] 19.4 Configure CI pipeline with GitHub Actions
    - Create workflow file for CI
    - Run linting, type checking, unit tests, property tests
    - Generate coverage reports
    - Deploy preview to Vercel on PR
    - _Requirements: 9.1, 9.2_

- [~] 20. Checkpoint - Frontend components and testing complete
  - Ensure all tests pass, ask the user if questions arise.

- [~] 21. Integration and deployment
  - [~] 21.1 Wire frontend to backend API endpoints
    - Configure API base URL for different environments
    - Set up TanStack Query hooks for all endpoints
    - Implement error handling for API calls
    - Add request/response interceptors
    - _Requirements: 8.1-8.6_

  - [~] 21.2 Test complete user flows end-to-end
    - Manual URL entry → Database storage → Dashboard display
    - Bulk URL import → Validation → Summary display
    - Data refresh → Scraping → UI update
    - Contact info entry → Save → Display
    - Export → File generation → Download
    - _Requirements: All requirements_

  - [ ]* 21.3 Write property test for referential integrity
    - **Property 8: Referential Integrity**
    - **Validates: Requirements 7.6**
    - Test that deleting a company cascades to all related records

  - [~] 21.4 Deploy to Vercel and configure production environment
    - Connect GitHub repository to Vercel
    - Configure environment variables in Vercel dashboard
    - Set up Vercel Postgres database
    - Run Prisma migrations on production database
    - Test deployment with production URLs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [~] 21.5 Verify free tier constraints and optimization
    - Monitor bandwidth usage
    - Monitor serverless function invocations
    - Implement caching strategies if needed
    - Add request debouncing where appropriate
    - _Requirements: 9.5_

- [~] 22. Documentation and final polish
  - [~] 22.1 Create README with setup instructions
    - Document local development setup
    - Document environment variables
    - Document deployment process
    - Include troubleshooting guide
    - _Requirements: All requirements_

  - [~] 22.2 Create API documentation
    - Document all API endpoints
    - Include request/response examples
    - Document error codes and messages
    - _Requirements: 8.1-8.8_

  - [~] 22.3 Perform manual testing checklist
    - Test all user flows on desktop browsers (Chrome, Firefox, Safari)
    - Test all user flows on mobile browsers (iOS Safari, Android Chrome)
    - Verify responsive layout at various screen sizes
    - Test error scenarios and edge cases
    - Verify ToS disclaimer display
    - _Requirements: 15.1-15.6_

- [~] 23. Final checkpoint - Production ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code examples use TypeScript as the implementation language
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- The implementation stays within Vercel free tier constraints throughout
