
  const getTokenColorClasses = (token: FormulaToken): { background: string; text: string } => {
    switch (token.type) {
      case 'instrument':
        return { background: 'bg-brand-lime/20', text: 'text-white' };
      case 'percentage':
        return { background: 'bg-brand-lime/20', text: 'text-white' };
      case 'fixedValue':
        return { background: 'bg-brand-lime/20', text: 'text-white' };
      case 'operator':
        return { background: 'bg-brand-lime/20', text: 'text-white' };
      case 'openBracket':
      case 'closeBracket':
        return { background: 'bg-brand-lime/20', text: 'text-white' };
      default:
        return { background: 'bg-brand-lime/20', text: 'text-white' };
    }
  };
