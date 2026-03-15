import React from 'react';

const MestrePensandoBanner = ({ ativo }) => {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        ativo ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden min-h-0">
        {ativo && (
          <div className="mx-2 mb-1.5 animate-slide-up">
            <div className="glass px-4 py-2.5 rounded-xl border border-purple-500/40 animate-glow relative overflow-hidden">
              {/* Shimmer overlay */}
              <div className="absolute inset-0 shimmer pointer-events-none" />

              <div className="relative flex items-center justify-center gap-3">
                <span className="text-lg drop-shadow-lg">🎭</span>

                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gradient-to-t from-purple-500 to-purple-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                    />
                  ))}
                </div>

                <span className="text-purple-200 text-sm font-medium tracking-wide">
                  O Mestre esta pensando...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MestrePensandoBanner;
