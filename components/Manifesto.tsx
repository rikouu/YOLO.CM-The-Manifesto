import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

const Manifesto: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-yolo-black flex flex-col items-center pt-16 md:pt-20 pb-12 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 text-[30vw] sm:text-[35vw] md:text-[40vw] font-black text-yolo-gray/10 leading-none select-none pointer-events-none -mr-10 sm:-mr-16 md:-mr-20 -mt-10 sm:-mt-16 md:-mt-20">
        YOLO
      </div>

      <div className="max-w-4xl w-full z-10">
        <div className="mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-4xl sm:text-6xl md:text-9xl font-black text-yolo-white mb-4 tracking-tighter uppercase relative inline-block">
            {t.manifesto.title}
            <span className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-0 w-full h-1 sm:h-1.5 md:h-2 bg-yolo-lime"></span>
          </h2>
        </div>

        <div className="space-y-12 sm:space-y-18 md:space-y-24">
          {t.manifesto.items.map((item, index) => (
            <div key={index} className="group relative">
              <div className="absolute -left-6 sm:-left-10 md:-left-20 top-0 text-4xl sm:text-6xl md:text-8xl font-black text-yolo-gray/20 font-mono group-hover:text-yolo-pink/20 transition-colors">
                0{index + 1}
              </div>

              <div className="relative pl-6 sm:pl-8 md:pl-0 border-l-2 sm:border-l-4 border-yolo-gray group-hover:border-yolo-lime md:border-none transition-colors duration-300">
                <h3 className="text-xl sm:text-3xl md:text-5xl font-bold text-yolo-white mb-2 sm:mb-3 md:mb-4 uppercase tracking-wide group-hover:translate-x-2 transition-transform duration-300">
                  {item.title}
                </h3>
                <p className="text-base sm:text-xl md:text-2xl text-yolo-gray font-mono group-hover:text-yolo-white transition-colors duration-300">
                  {item.desc}
                </p>
              </div>

              <div className="absolute right-0 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yolo-lime animate-spin" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-24 md:mt-32 text-center p-6 sm:p-8 md:p-12 border border-yolo-white/20 bg-white/5 backdrop-blur-sm">
            <p className="text-yolo-lime font-mono text-sm sm:text-base md:text-lg mb-3 sm:mb-4">THE ONLY RULE:</p>
            <p className="text-2xl sm:text-4xl md:text-6xl font-black text-yolo-white uppercase leading-tight">
                Die with <span className="text-transparent stroke-white" style={{WebkitTextStroke: '1px white'}}>memories</span>, <br className="sm:hidden" />
                not <span className="text-yolo-pink">dreams</span>.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Manifesto;