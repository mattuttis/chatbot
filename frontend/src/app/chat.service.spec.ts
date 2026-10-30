import { vi } from 'vitest';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const service = new ChatService();

  afterEach(() => vi.unstubAllGlobals());

  function stubResponse(chunks: string[], status = 200) {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })));
  }

  it('keeps the spaces between streamed pieces', async () => {
    stubResponse(['data:{"text":"Hello"}\n\n', 'data:{"text":" world"}\n\n']);
    const pieces: string[] = [];

    await service.send('Hi', (text) => pieces.push(text));

    expect(pieces.join('')).toBe('Hello world');
  });

  it('handles an event split across two chunks', async () => {
    stubResponse(['data:{"te', 'xt":"Hello"}\n\n']);
    const pieces: string[] = [];

    await service.send('Hi', (text) => pieces.push(text));

    expect(pieces).toEqual(['Hello']);
  });

  it('throws on an error event', async () => {
    stubResponse(['event:error\ndata:{"text":"The reply failed."}\n\n']);

    await expect(service.send('Hi', () => {})).rejects.toThrow('The reply failed.');
  });

  it('throws when the server rejects the request', async () => {
    stubResponse([], 400);

    await expect(service.send('Hi', () => {})).rejects.toThrow('status 400');
  });
});
