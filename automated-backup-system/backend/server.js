require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Mock Database Storage for users without local MySQL installed
let mockDatabaseLog = [
    { id: 1, filename: "backup_20260702_090000.zip", s3_uri: "s3://mock-bucket/scheduled/backup_20260702_090000.zip", execution_type: "scheduled", status: "success", error_message: null, created_at: new Date(Date.now() - 3600000) }
];

// 1. GET: Fetch Backup History Ledger
app.get('/api/backups', (req, res) => {
    // In production, this will query RDS. For now, we return our array log.
    res.json(mockDatabaseLog.slice().reverse());
});

// 2. POST: Invoke Backup Operation
app.post('/api/backups', (req, res) => {
    console.log("Simulating Lambda function invocation...");
    
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").split('Z')[0];
    const newFilename = `backup_${timestamp}.zip`;
    
    const newRecord = {
        id: mockDatabaseLog.length + 1,
        filename: newFilename,
        s3_uri: `s3://sandbox-bucket-demo/manual/${newFilename}`,
        execution_type: "manual",
        status: "success",
        error_message: null,
        created_at: new Date()
    };
    
    mockDatabaseLog.push(newRecord);
    res.json({ success: true, message: "Mock Lambda executed cleanly.", data: newRecord });
});

// 3. POST: Generate Secure Download Route
app.post('/api/backups/:id/download', (req, res) => {
    const record = mockDatabaseLog.find(r => r.id === parseInt(req.params.id));
    if (!record) return res.status(404).json({ error: "Record not found" });
    
    // Mocking the S3 Pre-signed URL loop by sending a public test zip download link
    res.json({ downloadUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Local development engine alive on http://localhost:${PORT}`));