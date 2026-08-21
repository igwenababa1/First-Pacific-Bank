
/**
 * Generates a consistent URL for country flags using flagcdn.
 * Handles casing and fallbacks.
 * @param countryCode The ISO 3166-1 alpha-2 country code (e.g., 'US', 'gb').
 * @returns The URL string for the flag image.
 */
export const getFlagUrl = (countryCode: string | undefined): string => {
    if (!countryCode) return 'https://flagcdn.com/w40/un.png'; // United Nations flag as fallback
    
    // Handle specific edge cases or mapping if necessary
    let code = countryCode.toLowerCase();
    
    // Crypto handling
    const cryptoMap: Record<string, string> = {
        'btc': 'btc',
        'eth': 'eth',
        'sol': 'sol',
        'ada': 'ada',
        'dot': 'dot',
        'usdc': 'usdc',
        'usdt': 'usdt'
    };

    if (cryptoMap[code]) {
        return `https://assets.coincap.io/assets/icons/${cryptoMap[code]}@2x.png`;
    }
    
    // Ensure we have a valid 2-letter code generally, though flagcdn supports some others
    if (code === 'uk') code = 'gb'; 
    
    return `https://flagcdn.com/w40/${code}.png`;
};
