import React from 'react';
import { motion } from 'framer-motion';
import { RiskCategory } from '../utils/riskCalculations';

interface RiskIndicatorProps extends RiskCategory {
  title: string;
}

export function RiskIndicator({ title, level, color, tip }: RiskIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${color}`}
    >
      <div className="text-sm uppercase tracking-wide opacity-90 font-medium">
        {title}
      </div>
      <div className="text-3xl font-extrabold my-3">
        {level}
      </div>
      <div className="text-sm opacity-90 leading-relaxed">
        {tip}
      </div>
    </motion.div>
  );
}