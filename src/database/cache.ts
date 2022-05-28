import { Router } from 'express';
import { parsePost } from './functions.js';
import { RedisManager } from './manager.js';
import { scanMatch, deleteAllKeysMatched } from './redisclient.js';

const cacheRouter = Router();

cacheRouter.post('/:id', async (req, res) => {
    const id = req.params.id;
    const data = JSON.stringify(parsePost(id, req.body));
    const result = await RedisManager.set(id, data, Number(req.query.expire || 0));
    res.json(result);
});

cacheRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    const result = await RedisManager.get(id);
    res.json(JSON.parse(result ?? '{}'));
});

cacheRouter.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const result = req.query.match === 'true' ? await deleteAllKeysMatched(id) : await RedisManager.delete(id);
    res.json(result ?? {});
});

cacheRouter.get('/scan/:query', async (req, res) => {
    const query = req.params.query;
    const keys = await scanMatch(query);
    res.json(keys);
});

export { cacheRouter };