import express from 'express';
import http from 'http';
import path from 'path';
import { CONFIG } from './config';

const app = express();
const server = http.createServer(app);

// serve files from public folder
app.use(express.static(path.resolve(__dirname, 'public')));

server.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on http://localhost:${CONFIG.PORT}`);
});
