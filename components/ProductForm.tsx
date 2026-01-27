
import React, { useState } from 'react';
import { Product } from '../types';
import { X } from 'lucide-react';

interface ProductFormProps {
  onSave: (product: Product) => void;
  onCancel: () => void;
  initialProduct?: Product;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel, initialProduct }) => {
  const defaultProduct: Product = {
    id: crypto.randomUUID(),
    code: '',
    clientName: 'FERTIMAXI',
    name: '',
    mapaReg: '',
    epBa: '',
    application: 'VIA SOLO',
    category: 'FERTILIZANTE MINERAL SIMPLES',
    nature: 'GRANULADO',
    composition: {
      nTotal: '',
      p2o5Cna: '',
      p2o5Sol: '',
      k2oSol: '',
      s: '',
      ca: '',
      b: '',
      cu: '',
      mn: '',
      zn: '',
      nbpt: '',
      mg: '-',
      so4: '-',
      aditivo: '-'
    }
  };

  const [formData, setFormData] = useState<Product>(
    initialProduct
      ? {
          ...defaultProduct,
          ...initialProduct,
          composition: {
            ...defaultProduct.composition,
            ...initialProduct.composition,
          },
        }
      : defaultProduct
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Product] as object),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const inputClasses = "mt-2 block w-full rounded-xl border-2 border-gray-400 bg-white p-3 text-slate-900 font-bold focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-400";
  const labelClasses = "block text-xs font-black text-slate-700 uppercase tracking-widest ml-1";
  const microInputClasses = "p-2 border-2 border-gray-400 rounded-lg bg-white text-slate-900 focus:border-emerald-500 outline-none font-bold text-sm text-center w-full";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start md:items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="bg-[#0F172A] p-6 md:p-8 text-white flex justify-between items-center shrink-0">
          <div>
            <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-1">Administração de Produto</p>
            <h2 className="text-xl md:text-2xl font-black">
              {initialProduct ? 'Editar Cadastro' : 'Novo Cadastro'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-1 gap-10">
            
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">A</div>
                 <h3 className="font-black text-[#0F172A] uppercase tracking-wider text-sm">Informações Gerais</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Cliente</label>
                  <select name="clientName" value={formData.clientName} onChange={handleChange} className={inputClasses}>
                    <option value="FERTIMAXI">FERTIMAXI</option>
                    <option value="CIBRA">CIBRA</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Código Interno</label>
                  <input name="code" value={formData.code} onChange={handleChange} className={inputClasses} placeholder="Ex: SA-001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Nome Comercial</label>
                  <input name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="SULFATO DE AMONIO" />
                </div>
                <div>
                  <label className={labelClasses}>Natureza Física</label>
                  <select name="nature" value={formData.nature} onChange={handleChange} className={inputClasses}>
                    <option value="GRANULADO">GRANULADO</option>
                    <option value="FARELADO">FARELADO</option>
                    <option value="MISTURA DE GRANULOS">MISTURA DE GRANULOS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Aplicação</label>
                  <select
                    name="application"
                    value={formData.application}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option value="VIA SOLO">VIA SOLO</option>
                    <option value="FOLIAR">FOLIAR</option>
                    <option value="FERTIRRIGAÇÃO">FERTIRRIGAÇÃO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Registro no MAPA</label>
                  <input name="mapaReg" value={formData.mapaReg} onChange={handleChange} className={inputClasses} placeholder="BA 000541-0.000XXX" />
                </div>
                {formData.clientName === 'CIBRA' && (
                  <div>
                    <label className={labelClasses}>Código EP BA (Cibra)</label>
                    <input name="epBa" value={formData.epBa} onChange={handleChange} className={inputClasses} placeholder="EP BA 000939-3" />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClasses}>Categoria do Produto</label>
                <input name="category" value={formData.category} onChange={handleChange} className={inputClasses} placeholder="FERTILIZANTE MINERAL" />
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">B</div>
                 <h3 className="font-black text-[#0F172A] uppercase tracking-wider text-sm">Garantias (%)</h3>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClasses}>% N Total</label>
                  <input name="composition.nTotal" value={formData.composition.nTotal} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>% P2O5 CNA</label>
                  <input name="composition.p2o5Cna" value={formData.composition.p2o5Cna} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>% P2O5 SOL</label>
                  <input name="composition.p2o5Sol" value={formData.composition.p2o5Sol} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>% K2O Sol</label>
                  <input name="composition.k2oSol" value={formData.composition.k2oSol} onChange={handleChange} className={inputClasses} />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <label className={labelClasses}>Adicionais e Micronutrientes</label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">S</span>
                    <input name="composition.s" value={formData.composition.s} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">Ca</span>
                    <input name="composition.ca" value={formData.composition.ca} onChange={handleChange} className={microInputClasses} />
                  </div>
                  {formData.clientName === 'CIBRA' && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">Mg</span>
                        <input name="composition.mg" value={formData.composition.mg} onChange={handleChange} className={microInputClasses} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">SO4</span>
                        <input name="composition.so4" value={formData.composition.so4} onChange={handleChange} className={microInputClasses} />
                      </div>
                    </>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">B</span>
                    <input name="composition.b" value={formData.composition.b} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">Cu</span>
                    <input name="composition.cu" value={formData.composition.cu} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">Mn</span>
                    <input name="composition.mn" value={formData.composition.mn} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">Zn</span>
                    <input name="composition.zn" value={formData.composition.zn} onChange={handleChange} className={microInputClasses} />
                  </div>
                  {formData.clientName === 'CIBRA' && (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold mb-1 text-center">Aditivo</span>
                      <input name="composition.aditivo" value={formData.composition.aditivo} onChange={handleChange} className={microInputClasses} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 md:p-8 border-t-2 border-slate-100 bg-slate-50/50 flex justify-end gap-4 shrink-0">
          <button onClick={onCancel} className="px-6 md:px-8 py-3 md:py-4 border-2 border-gray-300 rounded-2xl text-slate-600 font-black hover:bg-gray-100 transition-all text-sm">CANCELAR</button>
          <button onClick={() => onSave(formData)} className="px-8 md:px-12 py-3 md:py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all text-sm">SALVAR PRODUTO</button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
