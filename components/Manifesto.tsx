import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const Manifesto: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-yolo-black flex flex-col items-center pt-16 md:pt-20 pb-12 px-4 md:px-6 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 text-[40vw] font-black text-yolo-gray/10 leading-none select-none pointer-events-none -mr-20 -mt-20">
        YOLO
      </div>

      <div className="max-w-4xl w-full z-10">
        <div className="mb-20">
          <h2 className="text-6xl md:text-9xl font-black text-yolo-white mb-4 tracking-tighter uppercase relative inline-block">
            {t.manifesto.title}
            <span className="absolute -bottom-4 left-0 w-full h-2 bg-yolo-lime"></span>
          </h2>
        </div>

        <div className="space-y-24">
          {t.manifesto.items.map((item, index) => (
            <div key={index} className="group relative">
              <div className="absolute -left-12 md:-left-20 top-0 text-6xl md:text-8xl font-black text-yolo-gray/20 font-mono group-hover:text-yolo-pink/20 transition-colors">
                0{index + 1}
              </div>
              
              <div className="relative pl-8 md:pl-0 border-l-4 border-yolo-gray group-hover:border-yolo-lime md:border-none transition-colors pl-6 duration-300">
                <h3 className="text-3xl md:text-5xl font-bold text-yolo-white mb-4 uppercase tracking-wide group-hover:translate-x-2 transition-transform duration-300">
                  {item.title}
                </h3>
                <p className="text-xl md:text-2xl text-yolo-gray font-mono group-hover:text-yolo-white transition-colors duration-300">
                  {item.desc}
                </p>
              </div>
              
              <div className="absolute right-0 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="w-12 h-12 text-yolo-lime animate-spin" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-32 text-center p-12 border border-yolo-white/20 bg-white/5 backdrop-blur-sm">
            <p className="text-yolo-lime font-mono text-lg mb-4">THE ONLY RULE:</p>
            <p className="text-4xl md:text-6xl font-black text-yolo-white uppercase leading-tight">
                Die with <span className="text-transparent stroke-white" style={{WebkitTextStroke: '2px white'}}>memories</span>, <br/>
                not <span className="text-yolo-pink">dreams</span>.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Manifesto;