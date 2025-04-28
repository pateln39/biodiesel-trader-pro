
import React from 'react';
import { Movement } from '@/types';
import { DemurrageCalculator } from './calculator/DemurrageCalculator';

interface DemurrageCalculatorDialogProps {
  movement: Movement;
  onClose: () => void;
}

const DemurrageCalculatorDialog: React.FC<DemurrageCalculatorDialogProps> = ({ movement, onClose }) => {
  return <DemurrageCalculator movement={movement} onClose={onClose} />;
};

export default DemurrageCalculatorDialog;
