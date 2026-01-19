
export interface ProductComposition {
  nTotal: string;
  p2o5Cna: string;
  p2o5Sol: string;
  k2oSol: string;
  s: string;
  ca: string;
  b: string;
  cu: string;
  mn: string;
  zn: string;
  nbpt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  mapaReg: string;
  application: string;
  category: string;
  nature: string;
  composition: ProductComposition;
}

export interface LabelSession {
  lote: string;
  placa: string;
  tonelada: string;
  fabricacao: string;
  validade: string;
  peso: string;
}

export interface WithdrawalTermData {
  clientName: string;
  driverName: string;
  driverCpf: string;
  carrier: string;
  truckPlate: string;
  date: string;
  time: string;
  sealsQuantity: string;
  labelsQuantity: string;
  hasSeals: boolean;
}

export interface GenerationRecord {
  id?: string;
  timestamp: any;
  productName: string;
  productCode: string;
  productNature?: string;
  lote: string;
  placa: string;
  tonelada: string;
  labelsQuantity: string;
  termGenerated: boolean;
  clientName?: string;
  driverName?: string;
  driverCpf?: string;
  carrier?: string;
  sealsQuantity?: string;
  date?: string;
  time?: string;
}

export interface QueueItem {
  id: string;
  order: number;
  placa: string;
  carrier: string;
  productName: string;
  quantity: string;
  orderNumber: string;
  status: 'pending' | 'label_issued' | 'completed';
  importedAt?: string;
}

export type AppView = 'generator' | 'inventory' | 'history' | 'queue' | 'terms';
