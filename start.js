const { spawn } = require('child_process');

// Function to run the Flask application
function runFlaskApp() {
    const pythonProcess = spawn('python', ['main.py']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

// Execute the function
runFlaskApp();
