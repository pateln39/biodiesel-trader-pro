
export type BuySell = 'buy' | 'sell';

export type Product = 'FAME0' | 'RME' | 'UCOME' | 'UCOME-5' | 'RME DC';

export type PhysicalTradeType = 'spot' | 'term';

export type IncoTerm = 'FOB' | 'CIF' | 'DES' | 'DAP' | 'FCA';

export type Unit = 'MT' | 'KG' | 'L';

export type PaymentTerm = 'advance' | '30 days' | '60 days' | '90 days';

export type CreditStatus = 'pending' | 'approved' | 'rejected';

export type TradeStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

export type Instrument = 'Argus UCOME' | 'Argus RME' | 'Argus FAME0' | 'Platts LSGO' | 'Platts diesel';

export type OperatorType = '+' | '-' | '*' | '/';

// Time periods for price data
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
