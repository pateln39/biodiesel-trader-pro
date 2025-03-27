
// Common types used across multiple domains

// String literal type for different instruments
export type Instrument = 
  'Argus UCOME' | 
  'Argus RME' | 
  'Argus FAME0' | 
  'Platts LSGO' | 
  'Platts Diesel' | 
  'Argus HVO' | 
  'ICE GASOIL FUTURES';

// Transaction direction type
export type Direction = 'buy' | 'sell';

// Define common numeric types with precision for specific domains
export type Quantity = number;
export type Price = number;
export type Amount = number;
