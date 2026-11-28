export async function staffRequest(url: string, options: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000), ...options });
  } catch {
    throw new Error('The server did not respond. Check the connection and try again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error && body.error !== 'Bad Request'
      ? body.error
      : 'The server could not complete this request.');
  }
  return response;
}
