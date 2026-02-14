module.exports = {
    apps: [
        {
            name: 'tigray-vault',
            script: './server.js',
            cwd: __dirname,
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                AWS_REGION: 'eu-north-1',
                S3_BUCKET: 'tigray-vault-storage-yohannes',
                PORT: 80
            }
        }
    ]
};
