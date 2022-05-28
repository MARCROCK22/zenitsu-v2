console.log('Starting...');

import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', (req, res) => {
    console.log(req.body);
    res.send(Buffer.from('Hello World!'));
});

app.listen(3333, () => {
    console.log('App listening on port 3333');
});