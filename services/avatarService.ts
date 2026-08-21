
export const generateUserAvatar = async (name: string, countryCode: string = 'US'): Promise<string | null> => {
    try {
        const url = new URL('https://random-user-profile-picture-generator.p.rapidapi.com/api/v1/rapid/capigenerateavatar');
        url.searchParams.append('name', name);
        url.searchParams.append('countryCode', countryCode);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'random-user-profile-picture-generator.p.rapidapi.com',
                'x-rapidapi-key': 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46'
            }
        });

        if (!response.ok) {
            throw new Error(`API status: ${response.status}`);
        }

        const data = await response.json();
        return data.url || data.avatarUrl || null;

    } catch (error) {
        // Fallback to high-quality Unsplash avatars
        const fallbacks = [
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=300&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop'
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
};

export const storeBiometricFace = async (base64Data: string): Promise<string | null> => {
    try {
        const response = await fetch('https://faceswap-image-transformation-api.p.rapidapi.com/face/store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'faceswap-image-transformation-api.p.rapidapi.com',
                'x-rapidapi-key': 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46'
            },
            body: JSON.stringify({
                FileBase64Data: base64Data
            })
        });

        if (!response.ok) {
            console.warn(`Face Store API Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        // Return the FaceId if available, or a success marker
        return data.FaceId || data.face_id || 'stored';

    } catch (e) {
        console.warn("Biometric storage failed", e);
        return null;
    }
};
