const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
// Detect port: Use 80 on AWS, 3000 on Local
const port = process.env.PORT || 3000;

const directoryPath = path.join(__dirname, 'files');
if (!fs.existsSync(directoryPath)) { fs.mkdirSync(directoryPath, { recursive: true }); }

const datastore = new FileStore({ directory: directoryPath });
const tusServer = new Server({
    path: '/uploads',
    datastore: datastore,
});

app.use(compression());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS', 'DELETE'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Tus-Resumable',
        'Upload-Length',
        'Upload-Offset',
        'Upload-Metadata',
        'X-HTTP-Method-Override'
    ],
    exposedHeaders: [
        'Tus-Resumable',
        'Upload-Length',
        'Upload-Offset',
        'Upload-Metadata',
        'Location',
        'Upload-Expires'
    ]
}));

// --- SMART FILE LISTING ---
app.get('/list-files', (req, res) => {
    const requestedUser = req.query.user;
    fs.readdir(directoryPath, (err, files) => {
        if (err) return res.status(500).send('Folder error');

        const metadataFiles = files.filter(f => f.endsWith('.json'));
        const fileList = metadataFiles.map(filename => {
            const filePath = path.join(directoryPath, filename);
            try {
                const info = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const meta = info.metadata || {};

                // Only show if the User ID matches
                if (meta.userId === requestedUser) {
                    return {
                        id: filename.replace('.json', ''),
                        originalName: meta.filename || meta.name || 'Unknown'
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

// SERVE REACT FRONTEND
// This allows the server to host the website and the API at the same time
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "Catch-all" route using Regex to avoid the PathError
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => { console.log(`Vault Server online on port ${port}`); });