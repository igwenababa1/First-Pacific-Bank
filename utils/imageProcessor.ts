export const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } else {
                    reject(new Error("Canvas context is null"));
                }
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const viewBase64Image = (base64Data: string) => {
    try {
        const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
            window.open(base64Data, "_blank");
            return;
        }
        
        const contentType = match[1];
        const byteCharacters = atob(match[2]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
    } catch (e) {
        console.error("Failed to view image:", e);
        window.open(base64Data, "_blank"); // fallback
    }
};
