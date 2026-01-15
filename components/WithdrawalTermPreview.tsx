
import React from 'react';
import { WithdrawalTermData } from '../types';

interface WithdrawalTermPreviewProps {
  data: WithdrawalTermData;
}

const WithdrawalTermPreview: React.FC<WithdrawalTermPreviewProps> = ({ data }) => {
  return (
    <div className="bg-white text-black p-[1.5cm] w-[21cm] min-h-[29.7cm] flex flex-col font-sans text-sm leading-normal">
      
      {/* Header Logo Intermarítima */}
      <div className="mb-6 flex flex-col">
         <div className="flex justify-between items-center h-20 mb-2">
            <img 
              src="/logo_intermaritima.png" 
              alt="Intermarítima" 
              className="h-full w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="bg-[#00703C] p-3 rounded-lg"><span class="text-white font-black italic text-2xl tracking-tighter uppercase px-2">INTERMARÍTIMA</span></div>';
              }}
            />
            <div className="text-right">
               <p className="text-[10px] font-black text-[#00703C] uppercase tracking-widest">Documento Interno</p>
               <p className="text-[10px] font-bold text-slate-400">Mod. LOG-GATE-001</p>
            </div>
         </div>
         <div className="h-1 w-full bg-[#00703C]"></div>
      </div>

      {/* Título */}
      <div className="text-center mb-10">
        <h1 className="text-xl font-bold uppercase tracking-widest border-b-2 border-slate-100 inline-block pb-1">
          Termo de Retirada de Lacres e Etiquetas
        </h1>
      </div>

      {/* Identificação preenchida pelo sistema */}
      <div className="mb-10 overflow-hidden border-2 border-[#00703C] rounded-lg">
        <div className="bg-[#00703C] text-white text-center py-2.5 font-bold uppercase tracking-wider text-[13px]">
          Identificação do Motorista e Veículo
        </div>
        <div className="grid grid-cols-[180px_1fr]">
          <div className="border-t-2 border-r-2 border-[#00703C] p-3 font-bold uppercase text-[11px] bg-slate-50 flex items-center">Nome do Condutor</div>
          <div className="border-t-2 border-[#00703C] p-3 font-bold uppercase text-[14px]">{data.driverName || ""}</div>
          
          <div className="border-t-2 border-r-2 border-[#00703C] p-3 font-bold uppercase text-[11px] bg-slate-50 flex items-center">CPF</div>
          <div className="border-t-2 border-[#00703C] p-3 font-medium text-[14px]">{data.driverCpf || ""}</div>
          
          <div className="border-t-2 border-r-2 border-[#00703C] p-3 font-bold uppercase text-[11px] bg-slate-50 flex items-center">Transportadora</div>
          <div className="border-t-2 border-[#00703C] p-3 font-medium uppercase text-[14px]">{data.carrier || ""}</div>
          
          <div className="border-t-2 border-r-2 border-[#00703C] p-3 font-bold uppercase text-[11px] bg-slate-50 flex items-center">Placa do Veículo</div>
          <div className="border-t-2 border-[#00703C] p-3 font-black uppercase text-[16px] text-[#00703C]">{data.truckPlate || ""}</div>
        </div>
      </div>

      {/* Dados da Retirada - PREENCHIMENTO MANUAL (Com marcadores estilo lista) */}
      <div className="mb-12 space-y-6">
        <h2 className="font-bold text-[15px] text-[#00703C] flex items-center gap-2">
           <div className="w-2 h-5 bg-[#00703C] rounded-full"></div>
           DADOS DA RETIRADA (Preenchimento Manual no Gate):
        </h2>
        
        <div className="flex flex-col gap-8 pl-8">
           <div className="flex items-end gap-3">
              <span className="text-xl leading-none">•</span>
              <span className="font-bold text-[13px] uppercase whitespace-nowrap">Data da Retirada:</span>
              <div className="flex-1 border-b-2 border-black h-6 max-w-[250px]"></div>
           </div>
           
           <div className="flex items-end gap-3">
              <span className="text-xl leading-none">•</span>
              <span className="font-bold text-[13px] uppercase whitespace-nowrap">Hora da Retirada:</span>
              <div className="flex-1 border-b-2 border-black h-6 max-w-[200px]"></div>
           </div>

           <div className="flex items-end gap-3">
              <span className="text-xl leading-none">•</span>
              <span className="font-bold text-[13px] uppercase whitespace-nowrap">Quantidade de Lacres Retirados:</span>
              <div className="flex-1 border-b-2 border-black h-6 max-w-[150px]"></div>
           </div>

           <div className="flex items-end gap-3">
              <span className="text-xl leading-none">•</span>
              <span className="font-bold text-[13px] uppercase whitespace-nowrap">Quantidade de Etiquetas Retiradas:</span>
              <div className="flex-1 border-b-2 border-black h-6 max-w-[150px]"></div>
           </div>
        </div>
      </div>

      {/* Declaração */}
      <div className="mb-20 text-justify leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <p className="text-[13px] font-medium text-slate-700 italic">
          "Declaro, para os devidos fins, que recebi os lacres e etiquetas acima descritos no Gate desta unidade portuária, 
          comprometendo-me a utilizá-los exclusivamente no carregamento em questão e conforme as normas de segurança e 
          rastreabilidade estabelecidas pela Intermarítima Portos e Logística S/A. Estou ciente de que este documento 
          será anexado ao processo de conferência de carga correspondente."
        </p>
      </div>

      {/* Assinaturas (Linha no topo, texto abaixo) */}
      <div className="grid grid-cols-2 gap-20 mt-8 px-4">
        <div className="flex flex-col items-center">
            <div className="w-full border-b-2 border-black mb-3"></div>
            <span className="font-black text-[12px] uppercase tracking-tighter">Assinatura do Motorista</span>
            <span className="text-[10px] text-slate-400 font-bold">(Conforme documento de identidade)</span>
        </div>

        <div className="flex flex-col items-center">
            <div className="w-full border-b-2 border-black mb-3"></div>
            <span className="font-black text-[12px] uppercase tracking-tighter">Assinatura do Responsável pelo Gate</span>
            <span className="text-[10px] text-slate-400 font-bold">Intermarítima Portos e Logística S/A</span>
        </div>
      </div>

      {/* Footer com Selo ISO */}
      <div className="mt-auto pt-10">
          <div className="h-0.5 w-full bg-[#00703C] opacity-20 mb-6"></div>
          <div className="flex justify-between items-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase leading-tight space-y-0.5">
                <p className="text-slate-800 font-black text-[12px]">Intermarítima Portos e Logística S/A</p>
                <p>VIA MATOIM, 482 - DISTRITO INDUSTRIAL</p>
                <p>CEP. 43.813-000 - CANDEIAS - BA</p>
                <p className="text-[#00703C] font-black mt-1">www.intermaritima.com.br</p>
            </div>
            
            <div className="flex items-center gap-6">
                <img 
                  src="/iso9001.png" 
                  alt="Selo ISO 9001" 
                  className="h-20 w-auto"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
                <div className="flex flex-col items-center border-l-2 border-slate-100 pl-6 h-12 justify-center">
                    <span className="text-[8px] text-slate-400 font-black tracking-widest">SISTEMA DE QUALIDADE</span>
                    <span className="text-[16px] text-slate-800 font-black">CERTIFICADO</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default WithdrawalTermPreview;
