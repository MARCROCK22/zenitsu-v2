import { type Response, type Request, type NextFunction } from 'express';

export function checkAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.get('authorization') ?? '';
    if (process.env.KEYS?.split(',').includes(auth)) return next();
    return res.status(418).send('Unauthorized https://http.cat/418');
}