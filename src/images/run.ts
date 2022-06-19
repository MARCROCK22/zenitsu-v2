console.log('Starting...');

import express from 'express';
import { join } from 'path';

const app = express();

import { tictactoeRouter } from './tictactoe/router.js';

app.use(express.static(join(process.cwd(), 'assets')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/tictactoe', tictactoeRouter);
app.set('view engine', 'ejs');

app.post('/', (req, res) => {
    console.log(req.body);
    res.send(Buffer.from('Hello World!'));
});

// app.get('/test', (req, res) => {
//     const { map } = req.query;
//     if (typeof map !== 'string') return res.status(400).send('Invalid map');
//     console.log(req.query, JSON.parse(map));
//     res.render(join(process.cwd(), 'src', 'images', 'views', 'test.ejs'), {
//         map: JSON.parse(map),
//     });
// });

app.listen(3333, () => {
    console.log('App listening on port 3333');
});