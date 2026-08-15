import { Response } from 'express';

const clients: Response[] = [];

export function addClient(res: Response) {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');
  clients.push(res);

  // Remove client on close
  reqOnClose(res, () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

function reqOnClose(res: Response, cb: () => void) {
  const raw = (res as any).req || (res as any).socket?.req;
  if (raw && raw.on) raw.on('close', cb);
  else {
    // fallback
    try { (res as any).on('close', cb); } catch (e) {}
  }
}

export function broadcastUpdate(payload: any) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((res) => {
    try {
      res.write(data);
    } catch (e) {
      // ignore broken pipe
    }
  });
}
