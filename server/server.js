const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 80;
const host = '0.0.0.0';

// Force Local Storage for Stability
const directoryPath = path.join(__dirname, 'files');
if (!fs.existsSync(directoryPath)) { fs.mkdirSync(directoryPath, { recursive: true }); }

// Fix Permissions on Startup
try { fs.chmodSync(directoryPath, '777'); } catch (e) { }

const datastore = new FileStore({ directory: directoryPath });
const tusServer = new Server({
    path: '/uploads',
    datastore: datastore,
});

app.use(compression());

// CRITICAL: Allow Resume Headers
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Upload-Metadata', 'X-HTTP-Method-Override'],
    exposedHeaders: ['Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Upload-Metadata', 'Location', 'Upload-Expires']
}));

// List Files Logic
app.get('/list-files', (req, res) => {
    const requestedUser = req.query.user;
    fs.readdir(directoryPath, (err, files) => {
        if (err) return res.status(500).json([]);

        const fileList = files.filter(f => f.endsWith('.json')).map(filename => {
            try {
                const filePath = path.join(directoryPath, filename);
                const raw = fs.readFileSync(filePath, 'utf8');
                const info = JSON.parse(raw);
                if (info.metadata && info.metadata.userId === requestedUser) {
                    return {
                        id: filename.replace('.json', ''),
                        originalName: info.metadata.filename || 'Unknown'
                    };
                }
            } catch (e) { }
            return null;
        }).filter(item => item !== null);

        res.json(fileList);
    });
});

app.get('/download/:fileId', (req, res) => {
    const filePath = path.join(directoryPath, req.params.fileId);
    if (fs.existsSync(filePath)) { res.download(filePath); }
    else { res.status(404).send('Not found'); }
});

app.all(/^\/uploads/, (req, res) => {
    tusServer.handle(req, res);
});

app.use(express.static(path.join(__dirname, '../client/dist')));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, host, () => { console.log('Stable Vault Server running on Port 80'); });