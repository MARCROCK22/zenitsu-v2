console.log('Starting...');

import express from 'express';
import multer from 'multer';
import { Client as RestClient, Constants } from 'detritus-client-rest';
import { config } from 'dotenv';
import { join } from 'path';
import { handleReason, checkAuth, handleMultipart } from './middlewares.js';

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
        console.log(req.method, req.path);
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
        // console.log(result, 'result!');
        return res.status(200).json(result);
    } catch (e: any) {
        console.error(e, 'error', JSON.stringify(e.errors));
        const status = e.response ? e.response.status : 500;
        const response = { status, error: e.toString(), errors: e.errors };
        if (e.response) Object.assign(response, e.response.data);
        return res.status(status).json(response);
    }
});

app.listen(4444, () => {
    console.log('Server listening on port 4444');
});