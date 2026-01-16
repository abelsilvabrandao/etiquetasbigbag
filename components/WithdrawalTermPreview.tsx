
import React from 'react';
import { WithdrawalTermData } from '../types';

interface WithdrawalTermPreviewProps {
  data: WithdrawalTermData;
}

const WithdrawalTermPreview: React.FC<WithdrawalTermPreviewProps> = ({ data }) => {
  return (
    <div className="bg-white text-black p-[1.2cm] w-[21cm] h-[29.7cm] flex flex-col font-sans text-sm leading-tight print:m-0 print:p-[1.2cm]">
      
      {/* Header Logo */}
      <div className="mb-4 flex flex-col shrink-0">
         <div className="flex justify-between items-center h-16 mb-2">
            <img 
              src="/logo_intermaritima.png" 
              alt="Intermarítima" 
              className="h-full w-auto object-contain"
              onError={(e) => {
                // Fallback caso a imagem ainda não exista na raiz
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="bg-[#00703C] p-2 rounded-lg"><span class="text-white font-black italic text-xl tracking-tighter uppercase px-2">INTERMARÍTIMA</span></div>';
              }}
            />
            <div className="text-right">
               <p className="text-[9px] font-black text-[#00703C] uppercase tracking-widest">Documento Interno</p>
               <p className="text-[9px] font-bold text-slate-400">Mod. LOG-GATE-001</p>
            </div>
         </div>
         <div className="h-1 w-full bg-[#00703C]"></div>
      </div>

      {/* Título Centralizado */}
      <div className="text-center mb-8 shrink-0">
        <h1 className="text-lg font-bold uppercase tracking-widest border-b-2 border-slate-100 inline-block pb-1">
          Termo de Retirada de Lacres e Etiquetas
        </h1>
      </div>

      {/* Tabela de Identificação */}
      <div className="mb-8 overflow-hidden border-2 border-[#00703C] rounded-lg shrink-0">
        <div className="bg-[#00703C] text-white text-center py-2 font-bold uppercase tracking-wider text-[12px]">
          Identificação do Motorista e Veículo
        </div>
        <div className="grid grid-cols-[160px_1fr]">
          <div className="border-t-2 border-r-2 border-[#00703C] p-2 font-bold uppercase text-[10px] bg-slate-50 flex items-center">Nome do Condutor</div>
          <div className="border-t-2 border-[#00703C] p-2 font-bold uppercase text-[13px]">{data.driverName || ""}</div>
          
          <div className="border-t-2 border-r-2 border-[#00703C] p-2 font-bold uppercase text-[10px] bg-slate-50 flex items-center">CPF</div>
          <div className="border-t-2 border-[#00703C] p-2 font-medium text-[13px]">{data.driverCpf || ""}</div>
          
          <div className="border-t-2 border-r-2 border-[#00703C] p-2 font-bold uppercase text-[10px] bg-slate-50 flex items-center">Transportadora</div>
          <div className="border-t-2 border-[#00703C] p-2 font-medium uppercase text-[13px]">{data.carrier || ""}</div>
          
          <div className="border-t-2 border-r-2 border-[#00703C] p-2 font-bold uppercase text-[10px] bg-slate-50 flex items-center">Placa do Veículo</div>
          <div className="border-t-2 border-[#00703C] p-2 font-black uppercase text-[15px] text-[#00703C]">{data.truckPlate || ""}</div>
        </div>
      </div>

      {/* Dados da Retirada (PARA PREENCHIMENTO MANUAL) */}
      <div className="mb-10 space-y-5 shrink-0">
        <h2 className="font-bold text-[14px] text-[#00703C] flex items-center gap-2">
           <div className="w-1.5 h-4 bg-[#00703C] rounded-full"></div>
           DADOS DA RETIRADA (Preenchimento Manual):
        </h2>
        <div className="grid grid-cols-2 gap-y-8 gap-x-12 pl-4">
          <div className="flex items-end gap-2">
             <span className="font-bold text-[11px] uppercase whitespace-nowrap">Data da Retirada:</span>
             <div className="flex-1 border-b-[1.5px] border-black h-5 min-w-[120px]"></div>
          </div>
          <div className="flex items-end gap-2">
             <span className="font-bold text-[11px] uppercase whitespace-nowrap">Hora da Retirada:</span>
             <div className="flex-1 border-b-[1.5px] border-black h-5 min-w-[80px]"></div>
          </div>
          <div className="flex items-end gap-2">
             <span className="font-bold text-[11px] uppercase whitespace-nowrap">Qtd. Lacres:</span>
             <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
          </div>
          <div className="flex items-end gap-2">
             <span className="font-bold text-[11px] uppercase whitespace-nowrap">Qtd. Etiquetas:</span>
             <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
          </div>
        </div>
      </div>

      {/* Declaração */}
      <div className="mb-10 text-justify leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200 shrink-0">
        <p className="text-[12px] font-medium text-slate-700 italic">
          "Declaro, para os devidos fins, que recebi os lacres e etiquetas acima descritos no Gate desta unidade portuária, 
          comprometendo-me a utilizá-los exclusivamente no carregamento em questão e conforme as normas de segurança e 
          rastreabilidade estabelecidas pela Intermarítima Portos e Logística S/A. Estou ciente de que este documento 
          será anexado ao processo de conferência de carga correspondente."
        </p>
      </div>

      {/* Assinaturas (EMPURRADAS PARA BAIXO PELO mt-auto E COM mb-28 PARA SUBIR UM POUCO MAIS) */}
      <div className="grid grid-cols-2 gap-12 mt-auto mb-28">
        <div className="flex flex-col items-center">
            <div className="w-full border-b-[1.5px] border-black mb-2"></div>
            <span className="font-black text-[11px] uppercase tracking-tighter">Assinatura do Motorista</span>
            <span className="text-[8px] text-slate-400 font-bold">(Conforme documento de identidade)</span>
        </div>

        <div className="flex flex-col items-center">
            <div className="w-full border-b-[1.5px] border-black mb-2"></div>
            <span className="font-black text-[11px] uppercase tracking-tighter">Assinatura do Responsável (Gate)</span>
            <span className="text-[8px] text-slate-400 font-bold">Intermarítima Portos e Logística S/A</span>
        </div>
      </div>

      {/* Footer - Fixado na base */}
      <div className="shrink-0">
          <div className="h-0.5 w-full bg-[#00703C] opacity-20 mb-4"></div>
          <div className="flex justify-between items-center pb-2">
            <div className="text-[9px] text-slate-500 font-bold uppercase leading-tight space-y-0.5">
                <p className="text-slate-800 font-black text-[11px]">Intermarítima Portos e Logística S/A</p>
                <p>VIA MATOIM, 482 - DISTRITO INDUSTRIAL</p>
                <p>CEP. 43.813-000 - CANDEIAS - BA</p>
                <p className="text-emerald-700 font-black mt-0.5">www.intermaritima.com.br</p>
            </div>
            
            <div className="flex items-center gap-4">
                <img 
                  src="/certificadoiso9001.png" 
                  alt="Selo ISO" 
                  className="h-12 w-auto grayscale opacity-80"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
                <div className="flex flex-col items-center border-l-2 border-slate-100 pl-4">
                    <span className="text-[7px] text-slate-400 font-black">CERTIFICAÇÃO</span>
                    <span className="text-[12px] text-slate-800 font-black">ISO 9001</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default WithdrawalTermPreview;
