const BASE_URL = 'https://finnhub.io/api/v1';

export async function fetchFinnhub(endpoint: string, params: Record<string, string> = {}) {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
        throw new Error('FINNHUB_API_KEY is not configured');
    }

    const queryParams = new URLSearchParams(params);
    queryParams.append('token', apiKey);

    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('Rate limit exceeded');
        }
        throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    return response.json();
}
