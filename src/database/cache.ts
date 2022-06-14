import { Router } from 'express';
import { parsePost } from './functions.js';
import { RedisManager } from './redis/manager.js';

const cacheRouter = Router();

cacheRouter.post('/:id', async (req, res) => {
    console.log(`[CACHE] ${req.method} ${req.url}`);
    const id = req.params.id;
    const data = JSON.stringify(parsePost(id, req.body));
    const result = await RedisManager.set(id, data, Number(req.query.expire || 0));
    res.json(result);
});

cacheRouter.get('/:id', async (req, res) => {
    console.log(`[CACHE] ${req.method} ${req.url}`);
    const id = req.params.id;
    const result = await RedisManager.get(id);
    res.json(JSON.parse(result ?? '{}'));
});

cacheRouter.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const result = req.query.match === 'true' ? await RedisManager.deleteAllKeysMatched(id) : await RedisManager.delete(id);
    res.json(result);
});

cacheRouter.get('/scan/:query', async (req, res) => {
    const query = req.params.query;
    const keys = await RedisManager.scanMatch(query);
    res.json(keys);
});

export { cacheRouter };