# Requirements Document: UI and Search Enhancements

## Introduction

This document specifies the functional requirements for NaviHive's UI and search enhancement feature. The feature introduces theme customization capabilities (dark/light modes with custom color schemes), optimized website icon fetching with multi-source fallback, flexible view layouts (card/list modes), and enhanced search functionality with fuzzy matching, search history, and result highlighting. These enhancements improve user experience while maintaining the existing React 19 + TypeScript + Material-UI architecture.

## Glossary

- **Theme_System**: The component responsible for managing visual appearance modes (light/dark) and custom color schemes
- **Icon_Cache_Service**: The service that fetches, validates, and caches website icons from multiple sources
- **Search_Engine**: The fuzzy search implementation that matches user queries against sites and groups
- **Search_History_Service**: The service that persists and retrieves recent search queries
- **View_Mode_System**: The component that manages card vs list layout preferences
- **Highlight_Component**: The UI component that visually emphasizes matched search terms in results
- **localStorage**: Browser storage mechanism for persisting user preferences and cached data

## Requirements

### Requirement 1: Theme Mode Management

**User Story:** As a user, I want to switch between light and dark themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_System SHALL provide exactly two theme modes: 'light' and 'dark'
2. WHEN a user toggles the theme mode, THE Theme_System SHALL apply the new mode to all UI components immediately
3. WHEN a theme mode is changed, THE Theme_System SHALL persist the selection to localStorage
4. WHEN the application loads, THE Theme_System SHALL restore the previously selected theme mode from localStorage
5. WHERE no theme preference exists in localStorage, THE Theme_System SHALL default to 'light' mode

### Requirement 2: Custom Theme Colors

**User Story:** As a user, I want to customize theme colors, so that I can personalize the application's appearance to match my preferences.

#### Acceptance Criteria

1. THE Theme_System SHALL accept custom colors for five properties: primary, secondary, background, surface, and text
2. WHEN custom colors are provided, THE Theme_System SHALL validate each color as a valid CSS color string
3. IF an invalid color string is provided, THEN THE Theme_System SHALL reject the change and display an error message
4. WHEN valid custom colors are applied, THE Theme_System SHALL persist them to localStorage
5. THE Theme_System SHALL provide a reset function that restores default theme colors
6. WHEN custom colors are applied, THE Theme_System SHALL generate a valid Material-UI theme object

### Requirement 3: Icon Fetching with Multi-Source Fallback

**User Story:** As a user, I want website icons to load reliably, so that I can quickly identify bookmarks visually.

#### Acceptance Criteria

1. WHEN fetching an icon for a domain, THE Icon_Cache_Service SHALL attempt sources in this order: custom URL, Google favicons, DuckDuckGo icons, Clearbit logos
2. WHEN a custom icon URL is provided, THE Icon_Cache_Service SHALL validate it passes security checks before attempting to fetch
3. WHEN an icon source succeeds, THE Icon_Cache_Service SHALL cache the result in localStorage with the source name and timestamp
4. WHEN all icon sources fail, THE Icon_Cache_Service SHALL generate a fallback letter icon using the first character of the domain
5. THE Icon_Cache_Service SHALL validate all icon URLs use only https: or data:image/ protocols
6. WHEN a cached icon exists and is not expired, THE Icon_Cache_Service SHALL return the cached URL without fetching

### Requirement 4: Icon Cache Management

**User Story:** As a user, I want icon loading to be fast and efficient, so that the application remains responsive.

#### Acceptance Criteria

1. THE Icon_Cache_Service SHALL set icon cache expiration to 7 days from the timestamp
2. WHEN a cached icon is older than 7 days, THE Icon_Cache_Service SHALL treat it as expired and re-fetch
3. THE Icon_Cache_Service SHALL provide a clearCache function that removes all cached icons
4. THE Icon_Cache_Service SHALL provide a getCacheStats function that returns cache size and entry count
5. WHEN localStorage quota is exceeded, THE Icon_Cache_Service SHALL evict the oldest cache entries using LRU strategy

### Requirement 5: View Mode Selection

**User Story:** As a user, I want to switch between card and list views, so that I can choose the layout that works best for my workflow.

#### Acceptance Criteria

1. THE View_Mode_System SHALL provide exactly two view modes: 'card' and 'list'
2. WHEN a user selects a view mode, THE View_Mode_System SHALL persist the selection to localStorage
3. WHEN the application loads, THE View_Mode_System SHALL restore the previously selected view mode from localStorage
4. WHERE no view preference exists in localStorage, THE View_Mode_System SHALL default to 'card' mode
5. WHEN the view mode changes, THE View_Mode_System SHALL trigger a layout re-render immediately

### Requirement 6: Fuzzy Search Implementation

**User Story:** As a user, I want search to find results even with typos or partial matches, so that I can locate bookmarks quickly without exact spelling.

#### Acceptance Criteria

1. WHEN a search query is provided, THE Search_Engine SHALL calculate similarity scores for site names, URLs, and descriptions
2. THE Search_Engine SHALL use Levenshtein distance algorithm to calculate text similarity
3. WHEN calculating similarity, THE Search_Engine SHALL normalize all text to lowercase before comparison
4. THE Search_Engine SHALL return only results with similarity scores at or above the configured threshold
5. WHEN multiple fields match, THE Search_Engine SHALL use the highest score among name, URL, and description
6. THE Search_Engine SHALL weight URL matches at 0.8 and description matches at 0.6 relative to name matches
7. WHEN a search query exactly matches text, THE Search_Engine SHALL return a similarity score of 1.0
8. WHEN a search query is a substring of text, THE Search_Engine SHALL return a similarity score of at least 0.9

### Requirement 7: Search Result Ranking

**User Story:** As a user, I want the most relevant search results to appear first, so that I can find what I'm looking for quickly.

#### Acceptance Criteria

1. THE Search_Engine SHALL sort all search results by similarity score in descending order
2. WHEN two results have equal scores, THE Search_Engine SHALL maintain stable sort order
3. THE Search_Engine SHALL include match position information in each result for highlighting
4. THE Search_Engine SHALL ensure no duplicate results appear in the output
5. THE Search_Engine SHALL limit search results to a maximum of 50 items

### Requirement 8: Search History Tracking

**User Story:** As a user, I want to see my recent searches, so that I can quickly repeat common queries.

#### Acceptance Criteria

1. WHEN a search is executed, THE Search_History_Service SHALL record the query, timestamp, and result count
2. THE Search_History_Service SHALL persist search history to localStorage
3. WHEN a duplicate query is added, THE Search_History_Service SHALL remove the older entry and keep only the newest
4. THE Search_History_Service SHALL maintain entries sorted by timestamp with newest first
5. THE Search_History_Service SHALL enforce a maximum history size of 20 entries by default
6. WHEN history exceeds maximum size, THE Search_History_Service SHALL remove the oldest entries
7. THE Search_History_Service SHALL provide a clearHistory function that removes all entries
8. THE Search_History_Service SHALL provide a removeEntry function that deletes a specific query

### Requirement 9: Search Result Highlighting

**User Story:** As a user, I want matched search terms to be highlighted in results, so that I can see why each result was returned.

#### Acceptance Criteria

1. WHEN displaying search results, THE Highlight_Component SHALL identify all occurrences of the query in the result text
2. THE Highlight_Component SHALL perform case-insensitive matching when finding query occurrences
3. THE Highlight_Component SHALL wrap each matched occurrence in a styled span element
4. THE Highlight_Component SHALL support custom highlight styles via props
5. WHERE no custom style is provided, THE Highlight_Component SHALL apply a default highlight style

### Requirement 10: Search Input Optimization

**User Story:** As a user, I want search to be responsive without lag, so that the interface feels smooth while typing.

#### Acceptance Criteria

1. THE Search_Engine SHALL debounce search input with a 300ms delay
2. WHEN a search query exceeds 200 characters, THE Search_Engine SHALL truncate it to 200 characters
3. IF a query is truncated, THEN THE Search_Engine SHALL display a warning message to the user
4. THE Search_Engine SHALL sanitize search queries to prevent injection attacks
5. WHEN displaying results, THE Search_Engine SHALL use textContent instead of innerHTML to prevent XSS

### Requirement 11: localStorage Data Validation

**User Story:** As a developer, I want localStorage data to be validated on read, so that corrupted data doesn't crash the application.

#### Acceptance Criteria

1. WHEN reading data from localStorage, THE Theme_System SHALL validate the structure matches expected format
2. IF localStorage data is corrupted or invalid, THEN THE Theme_System SHALL clear the corrupted data and reinitialize with defaults
3. WHEN JSON parsing fails, THE Theme_System SHALL log the error to console and continue with default values
4. THE Icon_Cache_Service SHALL validate cached icon entries have required fields: url, timestamp, and source
5. THE Search_History_Service SHALL validate history entries have required fields: query, timestamp, and resultCount

### Requirement 12: Security Validation for Icon URLs

**User Story:** As a developer, I want icon URLs to be validated for security, so that the application is protected from SSRF and XSS attacks.

#### Acceptance Criteria

1. THE Icon_Cache_Service SHALL validate all icon URLs use only https: or data:image/ protocols
2. THE Icon_Cache_Service SHALL reject URLs pointing to private IP addresses
3. THE Icon_Cache_Service SHALL reject URLs pointing to localhost or 127.0.0.1
4. THE Icon_Cache_Service SHALL sanitize domain names before constructing icon URLs
5. WHEN an icon URL fails security validation, THE Icon_Cache_Service SHALL skip that source and try the next

### Requirement 13: Theme Customizer UI

**User Story:** As a user, I want a visual interface to customize theme colors, so that I can preview changes before applying them.

#### Acceptance Criteria

1. THE Theme_Customizer SHALL display color pickers for all five theme color properties
2. WHEN a color is changed in the picker, THE Theme_Customizer SHALL preview the change in real-time
3. THE Theme_Customizer SHALL provide a save button that applies and persists the custom colors
4. THE Theme_Customizer SHALL provide a reset button that reverts to default colors
5. THE Theme_Customizer SHALL provide preset color schemes for quick selection
6. WHEN the customizer is closed without saving, THE Theme_Customizer SHALL discard preview changes

### Requirement 14: Similarity Score Properties

**User Story:** As a developer, I want similarity scores to be mathematically correct, so that search results are reliable and predictable.

#### Acceptance Criteria

1. THE Search_Engine SHALL ensure all similarity scores are between 0.0 and 1.0 inclusive
2. WHEN comparing identical strings, THE Search_Engine SHALL return a similarity score of exactly 1.0
3. WHEN comparing empty strings, THE Search_Engine SHALL return a similarity score of 1.0
4. WHEN comparing an empty string with a non-empty string, THE Search_Engine SHALL return a similarity score of 0.0
5. THE Search_Engine SHALL ensure similarity calculation is symmetric: similarity(a, b) equals similarity(b, a)

### Requirement 15: Parser and Serializer for localStorage Data

**User Story:** As a developer, I want localStorage data to be correctly serialized and parsed, so that user preferences persist reliably across sessions.

#### Acceptance Criteria

1. WHEN saving theme preferences, THE Theme_System SHALL serialize the data structure to valid JSON
2. WHEN loading theme preferences, THE Theme_System SHALL parse the JSON back to the original data structure
3. WHEN saving icon cache, THE Icon_Cache_Service SHALL serialize the cache map to valid JSON
4. WHEN loading icon cache, THE Icon_Cache_Service SHALL parse the JSON back to the original cache map
5. WHEN saving search history, THE Search_History_Service SHALL serialize the history array to valid JSON
6. WHEN loading search history, THE Search_History_Service SHALL parse the JSON back to the original history array
7. FOR ALL valid data structures, serializing then parsing then serializing SHALL produce equivalent JSON output
