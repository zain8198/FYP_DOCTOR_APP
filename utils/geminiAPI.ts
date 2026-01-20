import Constants from 'expo-constants';

/**
 * Gemini API Manager with automatic key rotation
 * Handles rate limit errors by rotating through multiple API keys
 */

class GeminiAPIManager {
    private apiKeys: string[] = [];
    private currentKeyIndex: number = 0;

    constructor() {
        this.loadAPIKeys();
    }

    /**
     * Load all available API keys from environment variables
     */
    private loadAPIKeys(): void {
        const keys: string[] = [];

        // Try to load up to 10 API keys
        for (let i = 1; i <= 10; i++) {
            const key = Constants.expoConfig?.extra?.[`EXPO_PUBLIC_GEMINI_API_KEY_${i}`] ||
                process.env[`EXPO_PUBLIC_GEMINI_API_KEY_${i}`];

            if (key && key !== 'your_api_key_here' && key.trim() !== '') {
                keys.push(key);
            }
        }

        // Fallback to old single key format for backward compatibility
        if (keys.length === 0) {
            const oldKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
                process.env.EXPO_PUBLIC_GEMINI_API_KEY;
            if (oldKey && oldKey !== 'your_api_key_here' && oldKey.trim() !== '') {
                keys.push(oldKey);
            }
        }

        this.apiKeys = keys;
        console.log(`[Gemini API] Loaded ${this.apiKeys.length} API key(s)`);
    }

    /**
     * Get current API key
     */
    private getCurrentKey(): string {
        if (this.apiKeys.length === 0) {
            throw new Error('No Gemini API keys configured. Please add keys to .env file.');
        }
        return this.apiKeys[this.currentKeyIndex];
    }

    /**
     * Rotate to next API key
     */
    private rotateKey(): boolean {
        if (this.apiKeys.length <= 1) {
            return false; // No other keys to rotate to
        }

        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        console.log(`[Gemini API] Rotated to key #${this.currentKeyIndex + 1}`);
        return true;
    }

    /**
     * Check if error is a rate limit error or temporary server overload
     */
    private isRateLimitError(error: any): boolean {
        const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
        return errorMessage.includes('quota exceeded') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('resource_exhausted') ||
            errorMessage.includes('exceeded your current quota') ||
            errorMessage.includes('overloaded'); // Handle server overload
    }

    /**
     * Make API call to Gemini with automatic retry on rate limit
     */
    async callGeminiAPI(prompt: string, maxRetries?: number): Promise<string> {
        const retries = maxRetries ?? this.apiKeys.length;
        let lastError: any = null;
        let attemptCount = 0;

        // Try with current key and rotate through all keys if needed
        for (let i = 0; i < retries; i++) {
            try {
                attemptCount++;
                const currentKey = this.getCurrentKey();
                console.log(`[Gemini API] Attempt ${attemptCount} using key #${this.currentKeyIndex + 1}`);

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${currentKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    }
                );

                const data = await response.json();

                // Check for API error
                if (data.error) {
                    throw new Error(data.error.message || JSON.stringify(data.error));
                }

                // Success - extract and return text
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                    throw new Error('No text content in API response');
                }

                console.log(`[Gemini API] ✓ Success with key #${this.currentKeyIndex + 1}`);
                return text;

            } catch (error: any) {
                lastError = error;
                console.error(`[Gemini API] ✗ Error with key #${this.currentKeyIndex + 1}:`, error.message);

                // If it's a rate limit error and we have more keys, rotate and retry
                if (this.isRateLimitError(error)) {
                    if (this.rotateKey()) {
                        console.log(`[Gemini API] Rate limit hit, retrying with next key...`);
                        continue; // Retry with next key
                    } else {
                        console.error(`[Gemini API] Rate limit hit but no more keys available`);
                        throw new Error('All API keys have exceeded their rate limits. Please try again later.');
                    }
                } else {
                    // Non-rate-limit error, don't retry
                    throw error;
                }
            }
        }

        // All retries exhausted
        throw lastError || new Error('Failed to call Gemini API after all retries');
    }

    /**
     * Get API statistics
     */
    getStats(): { totalKeys: number; currentKeyIndex: number } {
        return {
            totalKeys: this.apiKeys.length,
            currentKeyIndex: this.currentKeyIndex
        };
    }
}

// Create singleton instance
const geminiManager = new GeminiAPIManager();

/**
 * Call Gemini API with automatic key rotation on rate limits
 * @param prompt - The prompt to send to Gemini
 * @returns The generated text response
 */
export async function callGeminiAPI(prompt: string): Promise<string> {
    return geminiManager.callGeminiAPI(prompt);
}

/**
 * Get current API key statistics
 */
export function getGeminiStats() {
    return geminiManager.getStats();
}
