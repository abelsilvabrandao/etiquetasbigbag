
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    code: 'SA-001',
    name: 'SULFATO DE AMONIO',
    mapaReg: 'BA 000541-0.000204',
    application: 'VIA SOLO',
    category: 'FERTILIZANTE MINERAL SIMPLES',
    nature: 'FARELADO',
    composition: {
      nTotal: '21',
      p2o5Cna: '0',
      p2o5Sol: '0',
      k2oSol: '0',
      s: '23',
      ca: '',
      b: '',
      cu: '',
      mn: '',
      zn: '',
      nbpt: ''
    }
  },
  {
    id: '2',
    code: 'UR-002',
    name: 'UREIA',
    mapaReg: 'BA 000541-0.000203',
    application: 'VIA SOLO',
    category: 'FERTILIZANTE MINERAL SIMPLES',
    nature: 'GRANULADO',
    composition: {
      nTotal: '46',
      p2o5Cna: '0',
      p2o5Sol: '0',
      k2oSol: '0',
      s: '',
      ca: '',
      b: '',
      cu: '',
      mn: '',
      zn: '',
      nbpt: ''
    }
  },
  {
    id: '3',
    code: 'SS-003',
    name: 'SUPER SIMPLES',
    mapaReg: 'BA 000541-0.000205',
    application: 'VIA SOLO',
    category: 'FERTILIZANTE MINERAL SIMPLES',
    nature: 'GRANULADO',
    composition: {
      nTotal: '0',
      p2o5Cna: '19',
      p2o5Sol: '0',
      k2oSol: '0',
      s: '10',
      ca: '16',
      b: '',
      cu: '',
      mn: '',
      zn: '',
      nbpt: ''
    }
  },
  {
    id: '4',
    code: 'KC-004',
    name: 'CLORETO DE POTASSIO',
    mapaReg: 'BA 000541-0.000206',
    application: 'VIA SOLO',
    category: 'FERTILIZANTE MINERAL SIMPLES',
    nature: 'GRANULADO',
    composition: {
      nTotal: '0',
      p2o5Cna: '0',
      p2o5Sol: '0',
      k2oSol: '60',
      s: '',
      ca: '',
      b: '',
      cu: '',
      mn: '',
      zn: '',
      nbpt: ''
    }
  }
];
