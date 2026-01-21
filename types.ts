
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
  // Campos específicos CIBRA
  mg?: string;
  so4?: string;
  aditivo?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  clientName?: 'FERTIMAXI' | 'CIBRA';
  mapaReg: string;
  application: string;
  category: string;
  nature: string;
  composition: ProductComposition;
  epBa?: string; // Campo específico CIBRA
}

export interface LabelSession {
  lote: string;
  placa: string;
  tonelada: string; // Para CIBRA será interpretado como KG Total
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
  sampleLabelDelivered?: boolean;
  orderNumber?: string;
  lote?: string;
}

export interface GenerationRecord {
  id?: string;
  timestamp: any;
  productName: string;
  productCode: string;
  productNature?: string;
  clientName: string;
  lote: string;
  placa: string;
  tonelada: string;
  labelsQuantity: string;
  termGenerated: boolean;
  labelGenerated?: boolean; // Novo campo para controle na gestão de termos
  driverName?: string;
  driverCpf?: string;
  carrier?: string;
  sealsQuantity?: string;
  date?: string;
  time?: string;
  sampleLabelDelivered?: boolean;
  orderNumber?: string;
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
  labelIssued?: boolean;
  termIssued?: boolean;
  sampleLabelDelivered?: boolean;
  importedAt?: string;
}

export type AppView = 'generator' | 'inventory' | 'history' | 'queue' | 'terms' | 'dashboard';
