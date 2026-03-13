# Requirements Document

## Introduction

The Launch Tracker Dashboard is a Phase 1 MVP application that displays company launch videos and fundraise announcements from multiple platforms. This zero-cost MVP uses manual URL entry and free data sources to demonstrate the concept without paid API integrations. The system enables users to track launch performance metrics and identify companies with low engagement for outreach purposes. The application consists of a React frontend, Node.js backend, and uses Vercel Postgres for data storage. The architecture is designed to support future automated API integrations when budget allows.

## Glossary

- **Dashboard**: The web application interface that displays aggregated launch data
- **Launch_Post**: A social media post announcing a company's product or service launch
- **Fundraise_Announcement**: A public announcement of a company receiving investment funding
- **Engagement_Metric**: Quantifiable interaction data such as likes, shares, or comments
- **URL_Parser**: The backend service that extracts metadata from social media URLs
- **Scraper**: Open-source library that fetches public engagement metrics (with ToS risk acknowledgment)
- **Low_Engagement_Launch**: A launch post with engagement metrics below a defined threshold
- **DM_Draft**: A pre-written direct message template for outreach
- **Database**: Vercel Postgres database storing aggregated launch data
- **Frontend**: React + Vite web application
- **Backend**: Node.js Express server
- **ORM**: Prisma database migration and query tool
- **Manual_Entry_Interface**: UI component for pasting URLs and entering data
- **YC_API**: Free, open-source YCombinator API from yc-oss/api GitHub repository
- **Data_Source_Indicator**: Visual indicator showing whether data is manually entered or automatically fetched

## Requirements

### Requirement 1: Manual URL Entry for Launch Posts

**User Story:** As a user, I want to manually paste URLs from X and LinkedIn, so that I can add launch posts to track without paying for API access.

#### Acceptance Criteria

1. THE Manual_Entry_Interface SHALL provide an input field for pasting X (Twitter) URLs
2. THE Manual_Entry_Interface SHALL provide an input field for pasting LinkedIn URLs
3. WHEN a URL is pasted, THE URL_Parser SHALL validate the URL format
4. WHEN a valid URL is provided, THE URL_Parser SHALL extract the platform type and post identifier
5. THE Backend SHALL store the URL and extracted metadata in the Database
6. WHEN a URL is invalid, THE Manual_Entry_Interface SHALL display a descriptive error message

### Requirement 2: Fetch Engagement Metrics from Public URLs

**User Story:** As a user, I want to see engagement metrics for launch posts, so that I can identify low-performing launches without paying for API access.

#### Acceptance Criteria

1. WHEN a launch post URL is added, THE Scraper SHALL attempt to fetch public engagement metrics
2. THE Scraper SHALL extract like counts from X (Twitter) posts using open-source libraries
3. THE Scraper SHALL extract like counts from LinkedIn posts using open-source libraries
4. THE Backend SHALL store engagement metrics in the Database with a timestamp
5. THE Dashboard SHALL display a disclaimer acknowledging ToS risks of web scraping
6. WHEN scraping fails, THE Manual_Entry_Interface SHALL allow manual entry of engagement metrics

### Requirement 3: Integrate Free YCombinator API for Fundraise Data

**User Story:** As a user, I want to see fundraise data from YCombinator companies, so that I can track recently funded YC startups without API costs.

#### Acceptance Criteria

1. THE Backend SHALL integrate with the free YC_API from the yc-oss/api GitHub repository
2. WHEN a company name is provided, THE Backend SHALL query the YC_API for fundraise information
3. THE Backend SHALL extract company name, batch, amount raised, and announcement date from YC_API responses
4. THE Backend SHALL store YC fundraise data in the Database with source attribution
5. THE Dashboard SHALL prioritize YC companies as the primary data source for fundraise information
6. WHEN YC_API data is unavailable, THE Manual_Entry_Interface SHALL allow manual entry of fundraise data

### Requirement 4: Display Company Launch Metrics

**User Story:** As a user, I want to see each company's launch performance metrics, so that I can compare engagement across companies.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of companies with launch data
2. FOR EACH company, THE Dashboard SHALL display the amount raised
3. FOR EACH company, THE Dashboard SHALL display the number of likes on their X launch post
4. FOR EACH company, THE Dashboard SHALL display the number of likes on their LinkedIn launch post
5. FOR EACH metric, THE Dashboard SHALL display a Data_Source_Indicator showing whether data is manually entered or automatically fetched
6. WHEN a company has no data for a specific metric, THE Dashboard SHALL display a null indicator or zero value

### Requirement 5: Manual Entry of Contact Information

**User Story:** As a user, I want to manually enter contact information for companies, so that I can track outreach details without paying for enrichment services.

#### Acceptance Criteria

1. THE Manual_Entry_Interface SHALL provide input fields for email addresses
2. THE Manual_Entry_Interface SHALL provide input fields for phone numbers
3. THE Manual_Entry_Interface SHALL provide input fields for LinkedIn profile URLs
4. THE Manual_Entry_Interface SHALL provide input fields for X (Twitter) handles
5. THE Backend SHALL store contact information in the Database linked to the company
6. THE Dashboard SHALL display contact information in a dedicated section for each company
7. WHEN contact information is unavailable, THE Dashboard SHALL indicate missing data with an option to add it

### Requirement 6: Generate Outreach Messages for Low Engagement Launches

**User Story:** As a user, I want to draft DMs for companies with low engagement launches, so that I can efficiently reach out to potential leads.

#### Acceptance Criteria

1. THE Backend SHALL define a threshold for low engagement based on like counts
2. WHEN a launch post has engagement metrics below the threshold, THE Backend SHALL classify it as a Low_Engagement_Launch
3. THE Backend SHALL generate a DM_Draft for each Low_Engagement_Launch
4. THE Dashboard SHALL display the DM_Draft alongside the company information
5. THE Dashboard SHALL provide a mechanism to copy the DM_Draft to clipboard

### Requirement 7: Persist Data with Database Schema

**User Story:** As a developer, I want a structured database schema, so that launch data is stored consistently and can be queried efficiently.

#### Acceptance Criteria

1. THE ORM SHALL define a schema for companies including name, identifier, and timestamps
2. THE ORM SHALL define a schema for launch posts including platform, URL, likes, data source type, and company reference
3. THE ORM SHALL define a schema for fundraise announcements including amount, date, source, and company reference
4. THE ORM SHALL define a schema for contact information including email, phone, LinkedIn URL, X handle, and company reference
5. THE ORM SHALL create database migrations for schema changes
6. THE Database SHALL enforce referential integrity between companies and related data
7. THE ORM SHALL define a field to track whether data is manually entered or automatically fetched

### Requirement 8: Provide RESTful API Endpoints

**User Story:** As a frontend developer, I want API endpoints to retrieve launch data, so that I can display it in the Dashboard.

#### Acceptance Criteria

1. THE Backend SHALL provide an endpoint to retrieve all companies with launch data
2. THE Backend SHALL provide an endpoint to retrieve launch metrics for a specific company
3. THE Backend SHALL provide an endpoint to retrieve contact information for a specific company
4. THE Backend SHALL provide an endpoint to retrieve DM drafts for low engagement launches
5. THE Backend SHALL provide an endpoint to add new launch post URLs
6. THE Backend SHALL provide an endpoint to manually update engagement metrics
7. WHEN an API request is invalid, THE Backend SHALL return an appropriate HTTP error code and message
8. THE Backend SHALL return data in JSON format

### Requirement 9: Deploy Application to Vercel Free Tier

**User Story:** As a product owner, I want the application deployed on Vercel's free tier, so that I can validate the MVP without infrastructure costs.

#### Acceptance Criteria

1. THE Frontend SHALL be deployable to Vercel as a static site
2. THE Backend SHALL be deployable to Vercel as serverless functions
3. THE Database SHALL use Vercel Postgres within free tier limits
4. THE Backend SHALL connect to the Database using environment variables for credentials
5. WHEN the application exceeds free tier limits, THE Backend SHALL log warnings

### Requirement 10: Handle Scraping Errors and Fallback to Manual Entry

**User Story:** As a system administrator, I want the application to handle scraping failures gracefully, so that I can manually enter data when automated fetching fails.

#### Acceptance Criteria

1. WHEN the Scraper encounters a rate limit error, THE Backend SHALL log the error and mark the data as requiring manual entry
2. WHEN the Scraper encounters an error, THE Backend SHALL log the error and continue processing other requests
3. THE Scraper SHALL implement exponential backoff for retries with a maximum of 3 attempts
4. WHEN all retry attempts fail, THE Backend SHALL store a failure record in the Database
5. THE Dashboard SHALL display a warning indicator for companies with incomplete data
6. THE Manual_Entry_Interface SHALL allow users to manually enter metrics when scraping fails

### Requirement 11: Parse and Validate Launch Video URLs

**User Story:** As a developer, I want to parse launch video URLs correctly, so that I can extract platform-specific identifiers and metadata.

#### Acceptance Criteria

1. WHEN an X (Twitter) URL is provided, THE URL_Parser SHALL extract the tweet ID
2. WHEN a LinkedIn URL is provided, THE URL_Parser SHALL extract the post ID
3. THE URL_Parser SHALL validate URL format before processing
4. WHEN a URL is invalid, THE URL_Parser SHALL return a descriptive error message
5. THE URL_Parser SHALL support both mobile and desktop URL formats for each platform

### Requirement 12: Implement Data Refresh Mechanism

**User Story:** As a user, I want launch data to be updated periodically, so that I see current engagement metrics.

#### Acceptance Criteria

1. THE Backend SHALL provide a mechanism to trigger data refresh for all companies
2. THE Backend SHALL provide a mechanism to trigger data refresh for a specific company
3. WHEN a refresh is triggered, THE Scraper SHALL attempt to fetch updated metrics from public URLs
4. THE Backend SHALL update existing records in the Database with new metrics
5. THE Dashboard SHALL display the last refresh timestamp for each company
6. WHEN scraping fails during refresh, THE Dashboard SHALL indicate that manual update is needed

### Requirement 13: Bulk URL Import Capability

**User Story:** As a user, I want to paste multiple URLs at once, so that I can quickly add many launch posts without entering them one by one.

#### Acceptance Criteria

1. THE Manual_Entry_Interface SHALL provide a textarea for pasting multiple URLs
2. THE Manual_Entry_Interface SHALL accept URLs separated by newlines or commas
3. WHEN multiple URLs are submitted, THE URL_Parser SHALL process each URL individually
4. THE Backend SHALL validate and store all valid URLs in a single batch operation
5. THE Dashboard SHALL display a summary showing how many URLs were successfully added and how many failed
6. WHEN some URLs fail validation, THE Manual_Entry_Interface SHALL display which URLs failed and why

### Requirement 14: Export Functionality for Demo Purposes

**User Story:** As a product owner, I want to export dashboard data, so that I can demonstrate value to clients and stakeholders.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an export button to download data
2. THE Backend SHALL generate CSV format exports containing company name, fundraise amount, engagement metrics, and contact information
3. THE Backend SHALL generate JSON format exports for programmatic access
4. WHEN export is triggered, THE Backend SHALL include all visible companies in the export
5. THE Dashboard SHALL allow filtering companies before export
6. THE exported file SHALL include a timestamp and data source indicators

### Requirement 15: Render Responsive Dashboard Interface

**User Story:** As a user, I want the dashboard to work on different screen sizes, so that I can access it from desktop or mobile devices.

#### Acceptance Criteria

1. THE Frontend SHALL render a responsive layout that adapts to screen width
2. WHEN viewed on mobile devices, THE Dashboard SHALL display company cards in a single column
3. WHEN viewed on desktop devices, THE Dashboard SHALL display company cards in a grid layout
4. THE Dashboard SHALL maintain readability of text and metrics across all screen sizes
5. THE Dashboard SHALL provide touch-friendly interaction targets on mobile devices
6. THE Manual_Entry_Interface SHALL be usable on both mobile and desktop devices
