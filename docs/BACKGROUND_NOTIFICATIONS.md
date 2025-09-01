# Background Notification System

This document explains how the background notification system works for pending tasks and notifications, including automatic user ID and campus detection.

## Overview

The background notification system automatically fetches notification counts from U-Cursos every 5 minutes without requiring the user to visit specific pages. This provides real-time updates for:

- **Pending Tasks**: Homework assignments that are "En Plazo" (On time)
- **Pending Notifications**: Unread notifications from the main U-Cursos page

The system now automatically detects and uses the user's specific ID and campus information to build accurate URLs for fetching data.

## Architecture

### 1. Background Service Worker (`js/background.js`)
- Runs independently of web pages
- Fetches notification data every 5 minutes using Chrome alarms
- Uses stored user ID and campus information to build accurate URLs
- Stores counts in Chrome storage
- Notifies all open U-Cursos tabs when data is updated

### 2. User Data Capture (`js/userDataCapture.js`)
- Automatically detects user ID from URLs like `https://www.u-cursos.cl/usuario/<user_id>/*`
- Captures campus information from course URLs like `https://www.u-cursos.cl/<campus>/<year>/<semester>/<course>/<section>/*`
- Stores academic period information (current year and semester)
- Notifies background worker when user data is updated

### 3. Content Scripts
- **`js/pendingTasks.js`**: Displays task notifications in navigation
- **`js/pendingNotifications.js`**: Displays notification counts in module headers
- Both scripts listen for updates from the background worker
- Support multiple URL patterns for task pages

### 4. URL Utilities (`js/urlUtils.js`)
- Provides functions for building correct U-Cursos URLs
- Handles user ID-based and campus-based URL formats
- Includes pattern matching for different page types

### 5. Enhanced First Time Setup (`js/firstTime.js`)
- Captures user ID and campus on first visit
- Builds user-specific configuration
- Maintains backward compatibility

## User Data Detection

### User Data Extraction
The system automatically detects the user ID from URLs matching:
```
https://www.u-cursos.cl/usuario/<user_id>/*
```
Where `<user_id>` is a hexadecimal string identifying the user.

**Important: User data is only captured ONCE** - the system checks if data has already been captured and skips extraction on subsequent visits to prevent unnecessary logging and processing.

### Campus and Course Information
Campus information is extracted from course URLs matching:
```
https://www.u-cursos.cl/<campus>/<year>/<semester>/<course_id>/<section_id>/*
```

This provides:
- **Campus**: University campus (e.g., "ingenieria", "uchile")
- **Academic Year**: 4-digit year
- **Semester**: 1 or 2
- **Course Information**: Course and section identifiers

**Data Persistence**: Once both user ID and campus are captured, the system sets a `userDataCaptured` flag to prevent re-extraction.

### Academic Period Calculation
The system intelligently calculates the current academic period:
- **First Semester**: March-July (months 3-7)
- **Second Semester**: August-December (months 8-12)
- **January-February**: Considered part of previous year's second semester

## URL Building Strategy

### Tasks URLs:
Tasks URLs are **ALWAYS** in the format: `https://www.u-cursos.cl/usuario/<user_id>/tareas_usuario/`

There are **NO fallback URLs** for tasks - they will only work with the user's specific ID. The system:

1. **Extracts user ID** from any usuario URL visited
2. **Builds correct URL** using the stored user ID
3. **Returns 0 tasks** if no user ID is available (cannot fetch without it)

This ensures the background worker only attempts to fetch from the correct, working URL format.

### Why No Fallbacks:
- Campus-based URLs for tasks do not exist or work
- Legacy URLs are not functional for task fetching
- Only the user-specific ID format will return valid task data

The system prioritizes accuracy over attempting multiple URLs that won't work.

## How It Works

### Initial Setup
1. When the extension is installed/updated, the background worker sets up a periodic alarm
2. The alarm triggers every 5 minutes to fetch fresh data
3. Content scripts display stored counts and request fresh data when loaded

### Data Flow
1. **Background Worker** fetches data from U-Cursos pages using `fetch()` with credentials
2. **Parses HTML** to extract notification counts using DOM parsing
3. **Stores counts** in Chrome sync storage
4. **Notifies content scripts** on all open U-Cursos tabs
5. **Content scripts update** their displays with fresh data

### Real-time Updates
- When a user visits a notification page, the content script counts local data
- This triggers a background fetch to get the latest server data
- All open tabs receive updates when new data is available

## Benefits

### For Users
- **Real-time notifications** without visiting specific pages
- **Consistent data** across all browser tabs
- **Automatic updates** every 5 minutes
- **Battery efficient** - only fetches when needed

### For Extension
- **Reduced page load impact** - most fetching happens in background
- **Better user experience** - notifications appear faster
- **Sync across devices** - uses Chrome sync storage
- **Graceful degradation** - falls back to page-based counting if background fails

## Configuration

The background system is automatically enabled/disabled based on the feature settings:
- When `pendingTasks` or `pendingNotifications` features are enabled, background fetching starts
- When both features are disabled, background fetching stops to save resources
- Settings changes are detected automatically and update the background worker state

## Error Handling

- If background fetching fails, content scripts fall back to page-based counting
- Multiple URL patterns are tried for task fetching to handle different user types
- Network errors are logged but don't break the extension functionality
- Invalid responses result in a count of 0 rather than errors

## Performance

- Background fetching uses minimal resources (< 1MB RAM)
- Network requests are throttled to every 5 minutes maximum
- Content scripts have minimal overhead (just display logic)
- Chrome sync storage handles data synchronization efficiently
