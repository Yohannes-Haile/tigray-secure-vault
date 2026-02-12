import React, { useEffect, useRef, useMemo, useState } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';
import CryptoJS from 'crypto-js';

// Styles for the Network Status Bar
const statusStyle = {
  padding: '10px',
  textAlign: 'center',
  fontWeight: 'bold',
  color: 'white',
  transition: 'all 0.5s ease',
  width: '100%',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 9999
};

function App() {
  const dashboardRef = useRef(null);
  const [serverFiles, setServerFiles] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // <--- NETWORK STATE
  const SECRET_KEY = 'TigraySecretKey';

  const uppy = useMemo(() => {
    return new Uppy({
      id: 'tigray-vault',
      debug: true,
      // Aggressive recovery strategy
      onBeforeFileAdded: (currentFile) => {
        if (currentFile.name.endsWith('.enc')) return true;
        return true;
      }
    }).use(Tus, {
      endpoint: '/uploads',
      // NEW: Infinite Retry Logic
      // If internet fails, it tries: instantly, then 1s, 3s, 5s... 
      // then every 10 seconds FOREVER until connection returns.
      retryDelays: [0, 1000, 3000, 5000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
      removeFingerprintOnSuccess: true,
    });
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/list-files')
      const data = await response.json();
      setServerFiles(data);
    } catch (e) { console.error("Fetch failed (Offline?)"); }
  };

  useEffect(() => {
    fetchFiles();

    // --- NETWORK LISTENERS (The "Network Aware" Logic) ---
    const handleOnline = () => { setIsOnline(true); uppy.retryAll(); }; // Auto-resume!
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    uppy.addPreProcessor(async (fileIDs) => {
      for (const fileID of fileIDs) {
        const file = uppy.getFile(fileID);
        if (file.name.endsWith('.enc')) continue;

        const base64Data = await new Promise(r => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result);
          rd.readAsDataURL(file.data);
        });

        const encrypted = CryptoJS.AES.encrypt(base64Data, SECRET_KEY).toString();
        const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });

        uppy.setFileState(fileID, {
          data: encryptedBlob,
          name: file.name + '.enc',
          meta: {
            ...file.meta,
            name: file.name + '.enc',
            filename: file.name + '.enc',
            type: 'text/plain'
          }
        });
      }
    });

    uppy.on('complete', () => {
      setTimeout(() => { fetchFiles(); uppy.cancelAll(); }, 1000);
    });

    if (dashboardRef.current && !uppy.getPlugin('Dashboard')) {
      uppy.use(Dashboard, { target: dashboardRef.current, inline: true, width: '100%', height: 350 });
    }

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [uppy]);

  const downloadAndDecrypt = async (fileId, originalName) => {
    try {
      const response = await fetch('/download/...')
      if (!response.ok) throw new Error("File not found");
      const encryptedText = await response.text();

      const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
      const decryptedBase64 = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedBase64) throw new Error("Decryption failed");

      const res = await fetch(decryptedBase64);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName.replace('.enc', '');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert("Download failed. Check connection or Key."); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* --- THE NETWORK STATUS BAR --- */}
      <div style={{ ...statusStyle, backgroundColor: isOnline ? '#34a853' : '#ea4335' }}>
        {isOnline ? "✅ SYSTEM ONLINE: CONNECTION STABLE" : "⚠️ NO CONNECTION: UPLOADS PAUSED (SAVING DATA)"}
      </div>

      <h1 style={{ color: '#1a73e8' }}>Tigray Secure Vault</h1>

      <div style={{ width: '100%', maxWidth: '700px', marginBottom: '40px' }}>
        <div ref={dashboardRef}></div>
      </div>

      <div style={{ width: '100%', maxWidth: '700px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h3>Vault Archive</h3>
        {serverFiles.length === 0 ? <p>No files found.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {serverFiles.map(file => (
              <li key={file.id} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{file.originalName}</strong>
                </div>
                <button onClick={() => downloadAndDecrypt(file.id, file.originalName)} style={{ backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  Decrypt
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;