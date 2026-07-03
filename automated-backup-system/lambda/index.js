const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mysql = require("mysql2/promise");

exports.handler = async (event) => {
    const execType = event.execution_type || 'scheduled';
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").split('Z')[0];
    const filename = `backup_${timestamp}.zip`;
    const s3Key = `${execType}/${filename}`;
    
    // Minimal mock system payload to act as our backup bundle
    const backupData = Buffer.from(JSON.stringify({
        systemStatus: "HEALTHY",
        scope: event.backup_scope || "all",
        capturedAt: timestamp
    }));
    
    const s3 = new S3Client({ region: "us-east-1" });
    let connection;
    
    try {
        // 1. Stream the payload file directly to S3
        await s3.send(new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: s3Key,
            Body: backupData
        }));
        
        // 2. Open log connection to RDS database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        // 3. Register transaction row into history table
        await connection.execute(
            `INSERT INTO backup_history (filename, s3_uri, execution_type, status) VALUES (?, ?, ?, 'success')`,
            [filename, `s3://${process.env.BUCKET_NAME}/${s3Key}`, execType]
        );
        
        return { statusCode: 200, body: JSON.stringify({ message: "Backup written to cloud vault successfully." }) };
        
    } catch (error) {
        console.error("Critical Failure:", error);
        if (connection) {
            await connection.execute(
                `INSERT INTO backup_history (filename, s3_uri, execution_type, status, error_message) VALUES (?, '', ?, 'failed', ?)`,
                [filename, execType, error.message]
            );
        }
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    } finally {
        if (connection) await connection.end();
    }
};