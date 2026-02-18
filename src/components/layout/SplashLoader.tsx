import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Sparkles } from 'lucide-react';

export const SplashLoader = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-gold/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 gradient-cyan rounded-[2.5rem] shadow-[0_0_50px_rgba(34,211,238,0.3)] flex items-center justify-center relative mb-8"
                >
                    <Smartphone className="w-12 h-12 text-white" />
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2"
                    >
                        <Sparkles className="w-6 h-6 text-gold" />
                    </motion.div>
                </motion.div>

                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-heading">
                            BHAEES <span className="text-gold underline decoration-primary/50 decoration-4">POS</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">
                            Initializing Cloud Engine
                        </p>
                    </motion.div>

                    {/* Loading Bar */}
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-8">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="h-full gradient-cyan"
                        />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 flex flex-col items-center opacity-30">
                <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] mb-2">Developed for the Omani Market</p>
                <div className="flex gap-2">
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-gold rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                </div>
            </div>
        </div>
    );
};
