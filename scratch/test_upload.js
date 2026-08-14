const fs = require('fs');
const path = require('path');

async function testResumeUpload() {
    try {
        console.log('1. Logging in to /api/login...');
        const loginRes = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'niveshARN@12', pin: '112520' })
        });
        const loginJson = await loginRes.json();
        console.log('Login Result:', loginJson);

        const token = loginJson.token;
        const pdfPath = path.join(__dirname, '..', 'public', 'assets', 'pdf', 'resume', 'NIVESH_R_RESUME.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);
        const fileBase64 = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');

        const newFilename = 'Nivesh_Software_Engineer_Resume.pdf';
        console.log(`2. Uploading custom filename: ${newFilename}...`);

        const uploadRes = await fetch('http://localhost:3000/api/upload/resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                filename: newFilename,
                fileBase64: fileBase64
            })
        });

        const uploadJson = await uploadRes.json();
        console.log('Upload Result:', uploadJson);
    } catch (err) {
        console.error('Exception during test:', err);
    }
}

testResumeUpload();
