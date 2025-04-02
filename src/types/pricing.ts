
export interface MTMPriceDetail {
  instruments: Record<Instrument, { price: number; date: Date | null }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
  futureMonth?: string; // Add this line
}

export interface PriceDetail {
  instruments: Record<Instrument, { average: number; prices: { date: Date; price: number }[] }>;
  evaluatedPrice: number;
  fixedComponents?: FixedComponent[];
  futureMonth?: string; // Add this line
}
