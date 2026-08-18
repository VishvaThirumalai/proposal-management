// frontend/src/services/keyService.js

export const keyService = {
    downloadPrivateKey: (privateKey, fileName = 'private_key.key') => {
        try {
            // ✅ Check if privateKey exists
            if (!privateKey) {
                console.error("❌ No private key to download");
                return;
            }
            
            console.log("📥 Downloading private key...");
            
            // Create blob from private key string
            const blob = new Blob([privateKey], { 
                type: 'application/octet-stream' 
            });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            console.log("✅ Private key downloaded successfully");
            
        } catch (error) {
            console.error("❌ Failed to download private key:", error);
        }
    },

    // ✅ Upload private key file (for granting access)
    uploadPrivateKeyFile: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsText(file);
        });
    },

    // ✅ Save private key (for demo only - use secure storage in production)
    savePrivateKey: (privateKey) => {
        if (!privateKey) return;
        try {
            localStorage.setItem('userPrivateKey', privateKey);
        } catch (error) {
            console.error("Failed to save private key:", error);
        }
    },

    getPrivateKey: () => {
        try {
            return localStorage.getItem('userPrivateKey');
        } catch (error) {
            console.error("Failed to get private key:", error);
            return null;
        }
    },

    clearPrivateKey: () => {
        try {
            localStorage.removeItem('userPrivateKey');
        } catch (error) {
            console.error("Failed to clear private key:", error);
        }
    }
};