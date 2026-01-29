
import React, { useState, useEffect } from 'react';
import { WithdrawalTermData } from '../types';
import { X, Truck, Hash, ShieldCheck, Calendar, AlertCircle, Building2 } from 'lucide-react';

interface WithdrawalTermFormProps {
  labelQuantity: string;
  initialTruckPlate?: string;
  initialLote?: string;
  initialProductName?: string;
  initialTonelada?: string;
  initialData?: WithdrawalTermData | null;
  onSave: (data: WithdrawalTermData) => void;
  onCancel: () => void;
}

const WithdrawalTermForm: React.FC<WithdrawalTermFormProps> = ({ 
  labelQuantity, 
  initialTruckPlate = '', 
  initialLote = '',
  initialProductName = '',
  initialTonelada = '',
  initialData,
  onSave, 
  onCancel 
}) => {
  const [data, setData] = useState<WithdrawalTermData>(initialData || {
    clientName: 'FERTIMAXI',
    driverName: '',
    driverCpf: '',
    carrier: '',
    truckPlate: initialTruckPlate,
    lote: initialLote,
    date: new Date().toLocaleDateString('pt-BR'),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    sealsQuantity: labelQuantity,
    labelsQuantity: labelQuantity,
    hasSeals: true,
    productName: initialProductName,
    tonelada: initialTonelada
  });

  const [isCustomClient, setIsCustomClient] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  // Sincroniza lacres apenas se for um novo formulário (sem initialData)
  useEffect(() => {
    if (!initialData) {
      if (data.hasSeals) {
        setData(prev => ({ ...prev, sealsQuantity: labelQuantity }));
      } else {
        setData(prev => ({ ...prev, sealsQuantity: '0' }));
      }
    }
  }, [data.hasSeals, labelQuantity, initialData]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const validate = () => {
    const newErrors: string[] = [];
    if (!data.clientName.trim()) newErrors.push('clientName');
    if (!data.driverName.trim()) newErrors.push('driverName');
    if (data.driverCpf.length < 14) newErrors.push('driverCpf');
    if (!data.carrier.trim()) newErrors.push('carrier');
    if (!data.truckPlate.trim()) newErrors.push('truckPlate');
    if (!data.labelsQuantity || parseInt(data.labelsQuantity) <= 0) newErrors.push('labelsQuantity');
    if (data.hasSeals && (!data.sealsQuantity || parseInt(data.sealsQuantity) <= 0)) newErrors.push('sealsQuantity');
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    setTouched(true);
    if (validate()) {
      onSave(data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'driverName' || name === 'carrier' || name === 'truckPlate' || name === 'clientName' || name === 'lote' || name === 'productName') {
      processedValue = value.toUpperCase();
    } else if (name === 'driverCpf') {
      processedValue = formatCpf(value);
    } else if (name === 'labelsQuantity' || name === 'sealsQuantity') {
      if (value !== '' && !/^\d+$/.test(value)) return;
    }

    setData(prev => ({ ...prev, [name]: processedValue }));
    
    if (touched) {
      setErrors(prev => prev.filter(err => err !== name));
    }
  };

  const getInputClasses = (name: string) => {
    const hasError = touched && errors.includes(name);
    return `mt-1 block w-full rounded-xl border-2 p-3 text-slate-900 font-bold outline-none transition-all uppercase placeholder:normal-case ${
      hasError 
        ? 'border-red-500 bg-red-50 focus:border-red-600' 
        : 'border-gray-200 bg-white focus:border-emerald-600'
    }`;
  };

  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Truck className="text-emerald-400" />
            <h2 className="text-xl font-black">Termo de Retirada</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X /></button>
        </div>

        <div className="p-6 space-y-6">
          {touched && errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-tight">Campos em destaque são obrigatórios.</p>
            </div>
          )}

          <section className="space-y-4">
            {/* Campo Cliente */}
            <div>
              <label className={labelClasses}>
                Cliente Portuário
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {!isCustomClient ? (
                  <select 
                    name="clientName" 
                    value={data.clientName} 
                    onChange={handleChange} 
                    className={`${getInputClasses('clientName')} flex-1`}
                  >
                    <option value="FERTIMAXI">FERTIMAXI</option>
                    <option value="CIBRA">CIBRA</option>
                    <option value="OUTRO">...OUTRO CLIENTE</option>
                  </select>
                ) : (
                  <input 
                    name="clientName" 
                    value={data.clientName === 'OUTRO' ? '' : data.clientName} 
                    onChange={handleChange} 
                    className={getInputClasses('clientName')} 
                    placeholder="DIGITE O NOME DO CLIENTE" 
                    autoFocus
                  />
                )}
                <button 
                  onClick={() => {
                    setIsCustomClient(!isCustomClient);
                    if (isCustomClient) setData(prev => ({ ...prev, clientName: 'FERTIMAXI' }));
                  }}
                  className="mt-1 px-3 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"
                  title={isCustomClient ? "Voltar para lista" : "Digitar nome manualmente"}
                >
                  <Building2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClasses}>
                  Produto / Carga
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  name="productName" 
                  value={data.productName} 
                  onChange={handleChange} 
                  className={getInputClasses('productName')} 
                  placeholder="EX: SULFATO DE AMÔNIO" 
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Quantidade (VALOR)
                </label>
                <input 
                  name="tonelada" 
                  value={data.tonelada} 
                  onChange={handleChange} 
                  className={getInputClasses('tonelada')} 
                  placeholder="EX: 50" 
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Nome do Motorista
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  name="driverName" 
                  value={data.driverName} 
                  onChange={handleChange} 
                  className={getInputClasses('driverName')} 
                  placeholder="NOME COMPLETO" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>
                  CPF
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  name="driverCpf" 
                  value={data.driverCpf} 
                  onChange={handleChange} 
                  className={getInputClasses('driverCpf')} 
                  placeholder="000.000.000-00" 
                  maxLength={14}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Lote
                </label>
                <input 
                  name="lote" 
                  value={data.lote} 
                  onChange={handleChange} 
                  className={getInputClasses('lote')} 
                  placeholder="NÚMERO DO LOTE" 
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>
                Transportadora / Placa Cavalo
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input 
                  name="carrier" 
                  value={data.carrier} 
                  onChange={handleChange} 
                  className={`${getInputClasses('carrier')} flex-[2]`} 
                  placeholder="NOME DA EMPRESA" 
                />
                <input 
                  name="truckPlate" 
                  value={data.truckPlate} 
                  onChange={handleChange} 
                  className={`${getInputClasses('truckPlate')} flex-1`} 
                  placeholder="ABC-1234" 
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-100"></div>

          <section className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className={data.hasSeals ? "text-emerald-500" : "text-gray-300"} />
                <span className="font-bold text-slate-700 text-sm">Possui Lacres?</span>
              </div>
              <button 
                onClick={() => setData(prev => ({ ...prev, hasSeals: !prev.hasSeals }))}
                className={`w-12 h-7 rounded-full p-1 transition-all ${data.hasSeals ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${data.hasSeals ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>
                  Etiquetas
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  inputMode="numeric"
                  name="labelsQuantity" 
                  value={data.labelsQuantity} 
                  onChange={handleChange} 
                  className={getInputClasses('labelsQuantity')} 
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Lacres
                  {data.hasSeals && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="text"
                  inputMode="numeric"
                  name="sealsQuantity" 
                  value={data.sealsQuantity} 
                  onChange={handleChange} 
                  disabled={!data.hasSeals}
                  className={getInputClasses('sealsQuantity')} 
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2 pt-2">
            <button 
              onClick={handleSubmit}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              SALVAR ALTERAÇÕES
            </button>
            <button onClick={onCancel} className="w-full py-3 font-bold text-slate-500 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalTermForm;
