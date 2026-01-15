
import React, { useState } from 'react';
import { Product } from '../types';
import { X } from 'lucide-react';

interface ProductFormProps {
  onSave: (product: Product) => void;
  onCancel: () => void;
  initialProduct?: Product;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel, initialProduct }) => {
  const [formData, setFormData] = useState<Product>(initialProduct || {
    id: crypto.randomUUID(),
    code: '',
    name: '',
    mapaReg: '',
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
      nbpt: ''
    }
  });

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
  
  // Classe específica para os inputs pequenos de micronutrientes
  const microInputClasses = "p-2 border-2 border-gray-400 rounded-lg bg-white text-slate-900 focus:border-emerald-500 outline-none font-bold text-sm text-center w-full";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="bg-[#0F172A] p-8 text-white flex justify-between items-center">
          <div>
            <p className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Administração de Produto</p>
            <h2 className="text-2xl font-black">
              {initialProduct ? 'Editar Cadastro' : 'Novo Cadastro'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 md:p-10 space-y-10">
          <div className="grid grid-cols-1 gap-10">
            
            {/* Info Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">A</div>
                 <h3 className="font-black text-[#0F172A] uppercase tracking-wider text-sm">Informações Gerais</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Código Interno</label>
                  <input name="code" value={formData.code} onChange={handleChange} className={inputClasses} placeholder="Ex: SA-001" />
                </div>
                <div>
                  <label className={labelClasses}>Natureza Física</label>
                  <select 
                    name="nature" 
                    value={formData.nature} 
                    onChange={handleChange} 
                    className={inputClasses}
                  >
                    <option value="GRANULADO">GRANULADO</option>
                    <option value="FARELADO">FARELADO</option>
                    <option value="MISTURA DE GRANULOS">MISTURA DE GRANULOS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Nome Comercial</label>
                <input name="name" value={formData.name} onChange={handleChange} className={inputClasses} placeholder="SULFATO DE AMONIO" />
              </div>

              <div>
                <label className={labelClasses}>Registro no MAPA</label>
                <input name="mapaReg" value={formData.mapaReg} onChange={handleChange} className={inputClasses} placeholder="BA 000541-0.000XXX" />
              </div>

              <div>
                <label className={labelClasses}>Categoria do Produto</label>
                <input name="category" value={formData.category} onChange={handleChange} className={inputClasses} placeholder="FERTILIZANTE MINERAL" />
              </div>
            </section>

            {/* Composition Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">B</div>
                 <h3 className="font-black text-[#0F172A] uppercase tracking-wider text-sm">Garantias (%)</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>% N Total</label>
                  <input name="composition.nTotal" value={formData.composition.nTotal} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>% P2O5 CNA</label>
                  <input name="composition.p2o5Cna" value={formData.composition.p2o5Cna} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>% K2O Sol</label>
                  <input name="composition.k2oSol" value={formData.composition.k2oSol} onChange={handleChange} className={inputClasses} />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <label className={labelClasses}>Micronutrientes Adicionais</label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1 text-center">B</span>
                    <input name="composition.b" value={formData.composition.b} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1 text-center">Cu</span>
                    <input name="composition.cu" value={formData.composition.cu} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1 text-center">Mn</span>
                    <input name="composition.mn" value={formData.composition.mn} onChange={handleChange} className={microInputClasses} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold mb-1 ml-1 text-center">Zn</span>
                    <input name="composition.zn" value={formData.composition.zn} onChange={handleChange} className={microInputClasses} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t-2 border-slate-100">
            <button
              onClick={onCancel}
              className="px-8 py-4 border-2 border-gray-300 rounded-2xl text-slate-600 font-black hover:bg-gray-50 transition-all active:scale-95"
            >
              CANCELAR
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-95"
            >
              SALVAR PRODUTO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
