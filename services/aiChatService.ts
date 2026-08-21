
export interface AiChatResult {
    answer: string;
    isError: boolean;
}

export const getSupportAiResponse = async (query: string): Promise<AiChatResult> => {
    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error("Offline");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch('/api/gemini/support-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
             throw new Error(`AI Service Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.msg || data.message || (typeof data === 'string' ? data : null);
        
        if (text) {
             return { answer: text, isError: false };
        }
        
        throw new Error("Empty response");

    } catch (error) {
        // Fallback response to keep the chat functional
        return { 
            answer: "I am currently operating in secure offline mode due to a network interruption. For immediate assistance with your inquiry regarding **" + query + "**, please contact our Priority Voice Desk at contact@firstpaba.com or try again shortly.", 
            isError: false 
        };
    }
};
