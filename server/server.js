const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const host = '127.0.0.1';
const port = 3000;

// Setup Storage
const directoryPath = path.join(__dirname, 'files');
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
}
const datastore = new FileStore({ directory: './files' });

const tusServer = new Server({
    path: '/uploads',
    datastore: datastore,
});

app.use(cors({
    origin: '*', // Allow your frontend to talk to the server
    methods: ['GET', 'POST', 'PATCH', 'HEAD', 'OPTIONS', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Upload-Metadata', 'X-HTTP-Method-Override'],
    exposedHeaders: ['Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Upload-Metadata', 'Location', 'Upload-Expires']
}));

// --- THE FIX IS HERE ---
app.get('/list-files', (req, res) => {
    fs.readdir(directoryPath, (err, files) => {
        if (err) return res.status(500).send('Unable to scan files');

        // 1. LOOK FOR .json FILES (NOT .info)
        const metadataFiles = files.filter(f => f.endsWith('.json'));

        const fileList = metadataFiles.map(filename => {
            // The ID is the filename minus ".json"
            const fileId = filename.replace('.json', '');
            const filePath = path.join(directoryPath, filename);
            let finalName = 'Unknown File';

            try {
                const rawData = fs.readFileSync(filePath, 'utf8');
                const info = JSON.parse(rawData);

                // Read the name exactly as you showed me
                if (info.metadata) {
                    finalName = info.metadata.filename || info.metadata.name || finalName;
                }
            } catch (e) {
                console.error(`Error parsing ${filename}:`, e.message);
            }

            return { id: fileId, originalName: finalName };
        });

        res.json(fileList);
    });
});

// Download Route
app.get('/download/:fileId', (req, res) => {
    // We download the file using the ID (the file without extension)
    const filePath = path.join(directoryPath, req.params.fileId);

    // Check if file exists
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Upload Route
app.all(/^\/uploads/, (req, res) => {
    tusServer.handle(req, res);
});
// ... existing code ...

// --- SERVE REACT FRONTEND ---
// Point to the client build folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// For any request that isn't an API route, send the React index.html
app.get('*', (req, res) => {
    // Check if the request is for the API (don't return HTML for API calls)
    if (req.path.startsWith('/uploads') || req.path.startsWith('/list-files') || req.path.startsWith('/download')) {
        return res.status(404).send("API Not Found");
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// app.listen(...) is here

app.listen(port, host, () => {
    console.log(`[Server] Tigray Vault Backend running at http://${host}:${port}`);
});