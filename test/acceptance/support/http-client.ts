/**
 * The single seam between the acceptance suite and the services.
 *
 * This is the only module in test/ that calls fetch(). It never throws on a
 * non-2xx response and it never asserts -- it returns a plain record and lets
 * the resource drivers decide what the outcome means.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse {
  status: number,
  /** Parsed JSON, or undefined when the body was empty or not JSON. */
  body: unknown,
  rawBody: string,
  method: HttpMethod,
  path: string,
}

export interface HttpClient {
  get(path: string): Promise<ApiResponse>,
  post(path: string, body?: unknown): Promise<ApiResponse>,
  put(path: string, body?: unknown): Promise<ApiResponse>,
  patch(path: string, body?: unknown): Promise<ApiResponse>,
  del(path: string): Promise<ApiResponse>,
  withToken(token: string | undefined): HttpClient,
}

export interface HttpClientOptions {
  baseUrl: string,
  token?: string,
  timeoutMs: number,
}

export class ServiceUnreachableError extends Error {}

/** The header these services use instead of `Authorization: Bearer`. */
export const AUTH_HEADER = 'x-feral-auth-token';

function parseBody(rawBody: string): unknown {
  if (rawBody === '') {
    return undefined;
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    // Several routes reply in plain text (`sendStatus` gives "OK", "Created").
    // Callers get rawBody.
    return undefined;
  }
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const { baseUrl, token, timeoutMs, } = options;

  async function send(method: HttpMethod, path: string, body?: unknown): Promise<ApiResponse> {
    const headers: Record<string, string> = { accept: 'application/json', };

    if (token !== undefined) {
      headers[AUTH_HEADER] = token;
    }
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new ServiceUnreachableError(
        [
          `${method} ${path} could not be completed: ${(err as Error).message}`,
          '',
          `Is a service running and listening at ${baseUrl}?`,
          'Start it with `npm run dev` in its repo, or with ../start-vigilant-harvest.sh.',
        ].join('\n')
      );
    }

    const rawBody = await response.text();

    return { status: response.status, body: parseBody(rawBody), rawBody, method, path, };
  }

  return {
    get: (path: string) => send('GET', path),
    post: (path: string, body?: unknown) => send('POST', path, body),
    put: (path: string, body?: unknown) => send('PUT', path, body),
    patch: (path: string, body?: unknown) => send('PATCH', path, body),
    del: (path: string) => send('DELETE', path),
    withToken: (nextToken: string | undefined) => createHttpClient({ ...options, token: nextToken, }),
  };
}
