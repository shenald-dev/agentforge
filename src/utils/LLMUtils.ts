/**
 * Utility functions for interacting with LLM outputs securely and reliably.
 */
export class LLMUtils {
    /**
     * Safely extracts and parses JSON from a messy LLM markdown string response.
     * Handles markdown code blocks, trailing commas, and malformed strings.
     * 
     * @param llmResponse The raw string response from the LLM.
     * @returns Parsed JSON object or null if parsing fails entirely.
     */
    static extractJson<T>(llmResponse: string): T | null {
        try {
            // First attempt: direct parsing
            return JSON.parse(llmResponse) as T;
        } catch {
            try {
                // Second attempt: extract from markdown blocks
                const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
                const match = jsonRegex.exec(llmResponse);
                if (match && match[1]) {
                    // Try to clean up trailing commas
                    const cleaned = match[1].replace(/,\s*([\]}])/g, '$1');
                    return JSON.parse(cleaned) as T;
                }
                
                // Third attempt: fallback regex to grab anything looking like an object or array
                const fallbackRegex = /({[\s\S]*?}|\[[\s\S]*?\])/;
                const fallbackMatch = fallbackRegex.exec(llmResponse);
                if (fallbackMatch && fallbackMatch[1]) {
                    const cleaned = fallbackMatch[1].replace(/,\s*([\]}])/g, '$1');
                    return JSON.parse(cleaned) as T;
                }
                
                return null;
            } catch {
                return null;
            }
        }
    }
}
