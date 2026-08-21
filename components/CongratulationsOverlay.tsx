import React from 'react';

const emojis = ['🎉', '🎊', '👍', '✅', '💯', '🙌'];

export const CongratulationsOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[80] animate-fade-in pointer-events-none">
            <div className="relative text-center">
                <h2 className="text-4xl font-black text-[#0F172A] dark:text-white drop-shadow-lg animate-pop-in">VERIFICATION COMPLETED!</h2>
                <p className="text-lg text-[#0F172A] dark:text-[#1E293B] mt-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>Your transfer is now being processed.</p>
            </div>
            
            {/* Emojis */}
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute text-3xl animate-emoji-float"
                    style={{
                        left: `${Math.random() * 100}vw`,
                        animationDuration: `${Math.random() * 3 + 2}s`, // 2-5 seconds
                        animationDelay: `${Math.random() * 2}s`,
                    }}
                >
                    {emojis[i % emojis.length]}
                </div>
            ))}

            <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

                @keyframes pop-in {
                  0% { transform: scale(0.5); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop-in { animation: pop-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                
                @keyframes fade-in-up {
                  0% { opacity: 0; transform: translateY(20px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }

                @keyframes emoji-float {
                  0% {
                    transform: translateY(100vh) scale(1);
                    opacity: 1;
                  }
                  100% {
                    transform: translateY(-100px) scale(1.5);
                    opacity: 0;
                  }
                }
                .animate-emoji-float {
                  animation-name: emoji-float;
                  animation-timing-function: linear;
                  animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
};