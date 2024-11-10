import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 768,
        height: 600,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
        frame: false,
        // Disable resizable window
        resizable: false,
    });

    win.loadURL('http://localhost:3000'); // URL donde se ejecuta la aplicación React
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
