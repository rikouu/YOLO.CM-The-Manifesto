import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingBag, Lock } from 'lucide-react';

const Merch: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-yolo-black flex flex-col items-center pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background Glitch Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-yolo-gray/5 leading-none select-none pointer-events-none whitespace-nowrap">
        SOLD OUT
      </div>

      <div className="max-w-6xl w-full z-10">
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-8xl font-black text-yolo-white mb-4 tracking-tighter uppercase">
            {t.merch.title}
          </h2>
          <p className="text-yolo-gray font-mono text-xl">{t.merch.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.merch.items.map((item, index) => (
            <div key={index} className="group relative border border-yolo-gray bg-black/40 p-4 aspect-[3/4] flex flex-col justify-between overflow-hidden">
                {/* Sold Out Overlay */}
                <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <div className="border-4 border-yolo-pink text-yolo-pink px-6 py-2 text-2xl font-black uppercase transform -rotate-12 tracking-widest">
                        {t.merch.soldOut}
                    </div>
                </div>

                {/* Product Placeholder */}
                <div className="flex-1 flex items-center justify-center bg-yolo-gray/10 mb-4 border border-yolo-gray/20 relative group-hover:border-yolo-lime/50 transition-colors">
                    <ShoppingBag className="w-16 h-16 text-yolo-gray group-hover:text-yolo-white transition-colors" />
                    
                    {/* Fake Scan Lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold font-mono text-yolo-white">{item.name}</h3>
                        <span className="text-yolo-gray text-sm">{item.price}</span>
                    </div>
                    <div className="w-full h-px bg-yolo-gray/50"></div>
                    <div className="flex justify-between items-center text-xs font-mono text-yolo-pink">
                        <span>STATUS:</span>
                        <span className="animate-pulse">{t.merch.soldOut}</span>
                    </div>
                </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center border-t border-yolo-gray pt-12">
            <div className="inline-flex items-center gap-2 bg-yolo-lime/10 border border-yolo-lime text-yolo-lime px-6 py-3 font-mono font-bold animate-pulse">
                <Lock className="w-4 h-4" />
                {t.merch.dropDate}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Merch;