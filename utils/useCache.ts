import React, { useRef, useMemo } from 'react';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheStore {
    [key: string]: CacheEntry<any>;
}

const DEFAULT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Custom hook for caching data with time-based expiration
 * @param defaultDuration - Default cache duration in milliseconds (default: 10 minutes)
 */
export function useCache(defaultDuration: number = DEFAULT_CACHE_DURATION) {
    const cacheRef = useRef<CacheStore>({});

    /**
     * Get cached data if it exists and hasn't expired
     * @param key - Cache key
     * @returns Cached data or null if not found/expired
     */
    const getCachedData = <T,>(key: string): T | null => {
        const entry = cacheRef.current[key];

        if (!entry) {
            console.log(`[Cache] Miss: ${key} - Not found`);
            return null;
        }

        const now = Date.now();
        if (now > entry.expiresAt) {
            console.log(`[Cache] Miss: ${key} - Expired (${Math.round((now - entry.expiresAt) / 1000)}s ago)`);
            delete cacheRef.current[key];
            return null;
        }

        const age = Math.round((now - entry.timestamp) / 1000);
        console.log(`[Cache] Hit: ${key} - Age: ${age}s`);
        return entry.data as T;
    };

    /**
     * Store data in cache with expiration
     * @param key - Cache key
     * @param data - Data to cache
     * @param duration - Optional custom duration in milliseconds
     */
    const setCachedData = <T,>(key: string, data: T, duration?: number): void => {
        const now = Date.now();
        const cacheDuration = duration ?? defaultDuration;

        cacheRef.current[key] = {
            data,
            timestamp: now,
            expiresAt: now + cacheDuration,
        };

        console.log(`[Cache] Set: ${key} - Expires in ${Math.round(cacheDuration / 1000)}s`);
    };

    /**
     * Clear specific cache entry or entire cache
     * @param key - Optional cache key. If not provided, clears entire cache
     */
    const clearCache = (key?: string): void => {
        if (key) {
            delete cacheRef.current[key];
            console.log(`[Cache] Cleared: ${key}`);
        } else {
            cacheRef.current = {};
            console.log('[Cache] Cleared all entries');
        }
    };

    /**
     * Check if a cache entry exists and is valid
     * @param key - Cache key
     * @returns true if cache entry exists and hasn't expired
     */
    const isCached = (key: string): boolean => {
        const entry = cacheRef.current[key];
        if (!entry) return false;
        return Date.now() <= entry.expiresAt;
    };

    return useMemo(() => ({
        getCachedData,
        setCachedData,
        clearCache,
        isCached,
    }), []);
}
