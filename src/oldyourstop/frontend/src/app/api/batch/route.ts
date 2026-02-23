import { NextRequest, NextResponse } from 'next/server';

interface BatchedRequest {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

interface BatchResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}

export async function POST(request: NextRequest) {
  try {
    const { requests }: { requests: BatchedRequest[] } = await request.json();

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    if (requests.length > 10) {
      return NextResponse.json(
        { error: 'Too many requests in batch' },
        { status: 400 }
      );
    }

    // Process all requests in parallel
    const responses = await Promise.allSettled(
      requests.map(async (req) => {
        try {
          const url = new URL(req.url, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
          
          const response = await fetch(url.toString(), {
            method: req.method,
            headers: {
              'Content-Type': 'application/json',
              ...req.headers,
            },
            body: req.body,
          });

          const data = await response.json();

          return {
            id: req.id,
            success: response.ok,
            data: response.ok ? data : null,
            error: response.ok ? null : data.error || 'Request failed',
            status: response.status,
          };
        } catch (error) {
          return {
            id: req.id,
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
          };
        }
      })
    );

    // Extract results from settled promises
    const results: BatchResponse[] = responses.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: 'unknown',
          success: false,
          data: null,
          error: result.reason?.message || 'Promise rejected',
          status: 500,
        };
      }
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Batch request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
