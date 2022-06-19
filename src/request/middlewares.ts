import { type Request, type Response, type NextFunction } from 'express';

export function handleMultipart(req: Request) {
    const body = JSON.parse(req.body.payload_json || '{}');
    body.files = [];
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
    files.forEach((f, i) => {
        body.files[i] = {
            filename: f.originalname,
            value: f.buffer,
        };
    });
    return body;
}

export function handleReason(req: Request, _res: Response, next: NextFunction) {
    const reason = req.get('x-audit-log-reason');
    if (reason) {
        if (req.method === 'GET' || req.path.includes('/bans') || req.path.includes('/prune')) {
            req.query.reason = reason;
        } else {
            req.body.reason = reason;
        }
    }
    next();
}

export function checkAuth(req: Request, res: Response, next: NextFunction) {
    const host = req.get('bot-token');
    if (host === process.env.TOKEN) return next();
    return res.status(418).send('Unauthorized https://http.cat/418');
}