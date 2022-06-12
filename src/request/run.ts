console.log('Starting...');

import express from 'express';
import { Client as RestClient, Constants } from 'detritus-client-rest';
import multer from 'multer';
import { config } from 'dotenv';
import { join } from 'path';

config({
    path: join(process.cwd(), '.env')
});
const restClient = new RestClient(process.env.TOKEN!);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multer({ storage: multer.memoryStorage() }).any());
app.use(handleReason);

app.all('*', checkAuth, async (req, res) => {
    try {
        console.log(req.method, req.path, req.body);
        const endpoint = req.path.replace('/api/v' + Constants.ApiVersion, '');
        const method = req.method.toLowerCase();
        const dataType = req.get('content-type')?.includes('multipart') ? 'multipart' : 'json';
        const data = dataType === 'json' ? (Object.keys(req.query)[0] ? req.query : req.body) : handleMultipart(req);
        const files = data.files;
        delete data.files;
        const result = await restClient.request(['get', 'head'].includes(method) ? {
            method,
            path: endpoint,
        } : {
            body: data,
            method,
            path: endpoint,
            files,
        });
        return res.status(200).send(result);
    } catch (e: any) {
        console.error(e, 'error', JSON.stringify(e.errors));
        const status = e.response ? e.response.status : 500;
        const response = { status, error: e.toString() };
        if (e.response) Object.assign(response, e.response.data);
        return res.status(status).json(response);
    }
});

app.listen(4444, () => {
    console.log('Server listening on port 4444');
});

function handleMultipart(req: express.Request) {
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

function handleReason(req: express.Request, _res: express.Response, next: express.NextFunction) {
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

function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const host = req.get('host');
    if (host === 'localhost:4444') return next();
    return res.status(418).send('Unauthorized https://http.cat/418');
}