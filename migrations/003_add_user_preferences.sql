-- Migration: Add user preferences persistence
-- Date: 2025-01-15
-- Description: Adds tables for user favorites, preferences, and recent visits to support cross-device sync

-- Step 1: Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    site_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(user_id, site_id)
);

-- Step 2: Create indexes for user_favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_site_id ON user_favorites(site_id);

-- Step 3: Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    view_mode TEXT DEFAULT 'card',
    theme_mode TEXT DEFAULT 'light',
    custom_colors TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create user_recent_visits table
CREATE TABLE IF NOT EXISTS user_recent_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    site_id INTEGER NOT NULL,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Step 5: Create indexes for user_recent_visits
CREATE INDEX IF NOT EXISTS idx_user_recent_visits_user_id ON user_recent_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recent_visits_visited_at ON user_recent_visits(visited_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_recent_visits_unique ON user_recent_visits(user_id, site_id);
