// ============================================
// 🧠 THINKING BAR - Like Tasklet!
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkingBarProps {
  isThinking: boolean;
  stage?: 'analyzing' | 'searching' | 'generating' | 'finalizing';
  details?: string;
}

const stages = {
  analyzing: { ar: 'جاري التحليل...', en: 'Analyzing...', icon: '🔍', color: 'blue' },
  searching: { ar: 'جاري البحث...', en: 'Searching...', icon: '🌐', color: 'purple' },
  generating: { ar: 'جاري الكتابة...', en: 'Generating...', icon: '✍️', color: 'green' },
  finalizing: { ar: 'اللمسات الأخيرة...', en: 'Finalizing...', icon: '✨', color: 'yellow' },
};

export const ThinkingBar: React.FC<ThinkingBarProps> = ({ 
  isThinking, 
  stage = 'analyzing',
  details 
}) => {
  const currentStage = stages[stage];

  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-neutral-500/10 via-purple-500/10 to-neutral-500/10 border border-neutral-500/20 rounded-xl backdrop-blur-sm">
            {/* Main thinking indicator */}
            <div className="flex items-center gap-3">
              {/* Animated brain icon */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-2xl"
              >
                🧠
              </motion.div>

              {/* Progress section */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-neutral-300">
                    {currentStage.icon} {currentStage.ar}
                  </span>
                  
                  {/* Animated dots */}
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-1.5 h-1.5 bg-neutral-300 rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Details text */}
                {details && (
                  <p className="text-xs text-gray-400 truncate">
                    {details}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-neutral-500 via-purple-500 to-neutral-500"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{ width: '50%' }}
                  />
                </div>
              </div>

              {/* Stage indicators */}
              <div className="hidden sm:flex items-center gap-2">
                {Object.entries(stages).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    animate={{ 
                      scale: stage === key ? 1.1 : 1,
                      opacity: stage === key ? 1 : 0.4
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      stage === key 
                        ? 'bg-neutral-500/30 ring-2 ring-neutral-500' 
                        : 'bg-gray-700'
                    }`}
                  >
                    {value.icon}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThinkingBar;
