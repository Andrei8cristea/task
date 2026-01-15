import { NextResponse } from 'next/server';
import { fetchFinnhub } from '@/lib/api-helper';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const category = searchParams.get('category') || 'general';

    try {
        let data;
        if (symbol) {
            const to = new Date().toISOString().split('T')[0];
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 7);
            const from = fromDate.toISOString().split('T')[0];

            data = await fetchFinnhub('/company-news', { symbol, from, to });
        } else {
            data = await fetchFinnhub('/news', { category });
        }
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
