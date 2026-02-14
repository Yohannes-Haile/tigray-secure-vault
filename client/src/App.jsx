import React, { useEffect, useRef, useMemo, useState } from 'react';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import Tus from '@uppy/tus';
import CryptoJS from 'crypto-js';

function App() {
  const dashboardRef = useRef(null);
  const [username, setUsername] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [serverFiles, setServerFiles] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const userRef = useRef('');
  const passRef = useRef('');
  useEffect(() => { userRef.current = username; }, [username]);
  useEffect(() => { passRef.current = passphrase; }, [passphrase]);

  const uppy = useMemo(() => {
    return new Uppy({
      id: 'tigray-vault',
      debug: true,
      autoProceed: false,
      onBeforeFileAdded: (currentFile) => {
        if (currentFile.name.endsWith('.enc')) return true;
        return true;
      }
    })
      .use(Tus, {
        endpoint: '/uploads',
        retryDelays: [0, 1000, 3000, 5000, 10000],
        chunkSize: 5 * 1024 * 1024,
        removeFingerprintOnSuccess: true,
        // Deterministic ID logic
        fingerprint: (file) => {
          return ['tus', file.name, file.size, userRef.current].join('-');
        }
      });
  }, []);

  const fetchFiles = async () => {
    if (!username) return;
    try {
      const response = await fetch(`/list-files?user=${username}`);
      const data = await response.json();
      setServerFiles(data);
    } catch (e) { }
  };

  useEffect(() => {
    fetchFiles();
    if (dashboardRef.current && !uppy.getPlugin('Dashboard')) {
      uppy.use(Dashboard, { target: dashboardRef.current, inline: true, width: '100%', height: 350 });
    }

    uppy.addPreProcessor(async (fileIDs) => {
      const u = userRef.current;
      const p = passRef.current;
      if (!u || !p) { alert("Credentials Required!"); throw new Error("Auth"); }

      for (const fileID of fileIDs) {
        const file = uppy.getFile(fileID);
        if (file.name.endsWith('.enc') || file.meta.isEncrypted) continue;

        const base64Data = await new Promise(r => {
          const rd = new FileReader();
          rd.onload = () => r(rd.result);
          rd.readAsDataURL(file.data);
        });
        const encrypted = CryptoJS.AES.encrypt(base64Data, p).toString();

        uppy.setFileState(fileID, {
          data: new Blob([encrypted], { type: 'text/plain' }),
          name: file.name + '.enc',
          meta: { ...file.meta, filename: file.name + '.enc', userId: u, isEncrypted: true }
        });
      }
    });

    // --- FIX: SMART NETWORK LISTENER ---
    const handleOnline = () => {
      setIsOnline(true);
      console.log("Network back. Waiting 2s for stability...");
      // Wait 2 seconds before forcing retry
      setTimeout(() => {
        console.log("Resuming uploads now.");
        uppy.retryAll();
      }, 2000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    uppy.on('complete', () => { setTimeout(fetchFiles, 1000); });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [uppy]);

  const downloadAndDecrypt = async (fileId, originalName) => {
    if (!passphrase) { alert("Key Required!"); return; }
    try {
      const response = await fetch('/download/' + fileId);
      const encryptedText = await response.text();
      const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
      const decryptedBase64 = bytes.toString(CryptoJS.enc.Utf8);
      const res = await fetch(decryptedBase64);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName.replace('.enc', '');
      document.body.appendChild(a); a.click();
    } catch (e) { alert("Decryption Error"); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white', width: '100%', position: 'fixed', top: 0, left: 0, backgroundColor: isOnline ? '#34a853' : '#ea4335' }}>
        {isOnline ? "✅ SYSTEM ONLINE" : "⚠️ OFFLINE: UPLOADS PAUSED"}
      </div>
      <h1 style={{ color: '#1a73e8' }}>Tigray Secure Vault</h1>
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
        <input type="password" placeholder="Vault Key" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
      </div>
      <div style={{ width: '100%', maxWidth: '700px', marginBottom: '40px' }}><div ref={dashboardRef}></div></div>
      <div style={{ width: '100%', maxWidth: '700px', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
        <h3>Your Archive ({username || 'Guest'})</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {serverFiles.map(file => (
            <li key={file.id} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{file.originalName}</strong>
              <button onClick={() => downloadAndDecrypt(file.id, file.originalName)} style={{ backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Decrypt</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export default App;