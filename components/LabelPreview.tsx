
import React from 'react';
import { Product, LabelSession } from '../types';

interface LabelPreviewProps {
  product: Product;
  session: LabelSession;
}

// Map composition keys to readable names for the label
const COMPOSITION_LABELS: Record<string, string> = {
  nTotal: 'Nitrogênio (N) Total',
  p2o5Cna: 'P2O5 Sol. em CNA + H2O',
  p2o5Sol: 'P2O5 Solúvel em Água',
  k2oSol: 'Potássio (K2O) Sol. Água',
  s: 'Enxofre (S) Total',
  ca: 'Cálcio (Ca) Total',
  b: 'Boro (B) Total',
  cu: 'Cobre (Cu) Total',
  mn: 'Manganês (Mn) Total',
  zn: 'Zinco (Zn) Total',
  nbpt: 'Inibidor NBPT'
};

// Fixed implementation of LabelPreview to properly display fertilizer label data
const LabelPreview: React.FC<LabelPreviewProps> = ({ product, session }) => {
  return (
    <div className="bg-white text-black p-6 w-[10.5cm] min-h-[16cm] border-2 border-slate-200 flex flex-col font-sans text-xs shadow-inner">
      {/* Header with Logo Area */}
      <div className="border-b-4 border-[#00703C] pb-3 mb-4 flex justify-between items-center">
        <div className="bg-[#00703C] p-2 rounded-lg">
           <span className="text-white font-black italic text-xl tracking-tighter uppercase px-2">FERTIMAXI</span>
        </div>
        <div className="text-right">
          <p className="font-black text-[9px] text-[#00703C] uppercase tracking-wider">Intermarítima Portos e Logística S/A</p>
          <p className="text-[8px] text-slate-400 font-bold uppercase">CNPJ: 14.505.514/0001-34</p>
        </div>
      </div>

      {/* Product Information Section */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-[#0F172A] mb-1">
          {product.name}
        </h1>
        <div className="inline-block bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {product.category}
          </p>
        </div>
      </div>

      {/* Physical Nature Display */}
      <div className="bg-emerald-50 p-2.5 rounded-xl mb-4 text-center border-2 border-emerald-100">
        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block mb-0.5">Natureza Física</span>
        <span className="text-[13px] font-black text-[#00703C] uppercase">{product.nature}</span>
      </div>

      {/* Guarantees Table */}
      <div className="flex-1 space-y-3">
        <div className="overflow-hidden rounded-xl border-2 border-slate-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-100 p-2 text-left text-[9px] font-black uppercase text-slate-400 tracking-wider">Garantias do Produto</th>
                <th className="border-b border-slate-100 p-2 text-center text-[9px] font-black uppercase text-slate-400 tracking-wider">% p/p</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(product.composition)
                .filter(([_, v]) => v !== undefined && v !== null && v !== '0' && v !== '')
                .map(([key, value]) => (
                  <tr key={key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="p-2 font-bold uppercase text-[10px] text-slate-700">
                      {COMPOSITION_LABELS[key] || key.toUpperCase()}
                    </td>
                    <td className="p-2 text-center font-black text-[12px] text-slate-900">
                      {value}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        {/* Registration MAPA Section */}
        <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            REGISTRO NO MAPA Nº: <span className="text-slate-900 ml-1">{product.mapaReg}</span>
          </p>
        </div>
      </div>

      {/* Batch and Session Traceability Info */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-slate-100 pt-4 bg-slate-50/50 p-3 rounded-2xl">
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Lote</span>
            <span className="text-[14px] font-black text-slate-900 tracking-tight">{session.lote || "--------"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Placa Veículo</span>
            <span className="text-[14px] font-black text-slate-900 tracking-tight">{session.placa || "-------"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Data de Fabricação</span>
            <span className="text-[14px] font-black text-slate-900 tracking-tight">{session.fabricacao}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Prazo de Validade</span>
            <span className="text-[14px] font-black text-slate-900 tracking-tight">{session.validade}</span>
          </div>
        </div>
      </div>

      {/* Net Weight Display Section */}
      <div className="mt-4 bg-[#00703C] text-white p-3 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-100">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] ml-2">Peso Líquido</span>
        <div className="flex items-baseline gap-1 mr-2">
          <span className="text-2xl font-black italic leading-none">{session.peso}</span>
          <span className="text-xs font-black italic uppercase">kg</span>
        </div>
      </div>

      {/* Footer Instructions and Safety Warnings */}
      <div className="mt-5 text-[8px] text-slate-500 leading-snug text-justify italic font-medium px-2">
        <span className="font-bold uppercase not-italic">Cuidados:</span> Armazenar em local seco, ventilado e coberto. Evitar contato direto com o solo. 
        Mantenha fora do alcance de crianças e animais domésticos. Para maiores informações sobre modo de uso e 
        recomendações de aplicação, consulte um Engenheiro Agrônomo habilitado.
      </div>
    </div>
  );
};

export default LabelPreview;
