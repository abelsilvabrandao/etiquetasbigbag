
import React from 'react';
import { WithdrawalTermData } from '../types';

interface WithdrawalTermPreviewProps {
  data: WithdrawalTermData;
}

// Logo da Intermarítima (Base64)
const LOGO_INTERMARITIMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABACAMAAACpuzXfAAAAPFBMVEX///8Acf8AeP8AgP8Aiv8AnP8Arv8Avf8Azv8A3f8A7v8A/v8BAQECAgIDAwMEBAUFBQYGBgcHBwgICAkJCQrEay8UAAAAAXRSTlMAQObYZgAAAY9JREFUaN7t2UFuwyAQBVBqY2MTUvX+p+0W27S2NlWReV5pZun3zP4Y8I8h8248H7m9yNl59iTfXp/u7Xm95rUu97O5l9p69N035zXmY13u93BfqXW5H0VvO6f5W3O7O+9jntZfP4rR7u58T5q9q02p93H8m767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676/5T934Wf2v9f8Fv5ofzE/t9/75/+m78+9D5k8AAAAASUVORK5CYII=";

const WithdrawalTermPreview: React.FC<WithdrawalTermPreviewProps> = ({ data }) => {
  return (
    <div className="bg-white text-black p-[1.5cm] w-[21cm] min-h-[29.7cm] flex flex-col font-sans text-sm leading-normal">
      
      {/* Header Logo */}
      <div className="mb-6 flex flex-col">
         <div className="flex justify-start items-center h-16 mb-2">
            <div className="bg-[#00703C] p-2 rounded-lg flex items-center gap-2">
                {/* Simulando o logo do modelo com texto branco e borda arredondada */}
                <span className="text-white font-black italic text-2xl tracking-tighter uppercase px-2">INTERMARÍTIMA</span>
            </div>
         </div>
         <div className="h-0.5 w-full bg-[#00703C] opacity-30"></div>
      </div>

      {/* Título Centralizado */}
      <div className="text-center mb-8">
        <h1 className="text-lg font-bold uppercase tracking-wide">
          Termo de Retirada de Lacres e Etiquetas
        </h1>
      </div>

      {/* Tabela de Identificação */}
      <div className="mb-10 overflow-hidden border border-[#00703C]">
        <div className="bg-[#7BB342] text-white text-center py-2 font-bold uppercase tracking-wider text-[13px]">
          Identificação do Motorista
        </div>
        <div className="grid grid-cols-[150px_1fr]">
          <div className="border-t border-r border-[#00703C] p-2 font-bold uppercase text-[11px] bg-gray-50 flex items-center">Nome</div>
          <div className="border-t border-[#00703C] p-2 font-medium uppercase text-[13px]">{data.driverName || ""}</div>
          
          <div className="border-t border-r border-[#00703C] p-2 font-bold uppercase text-[11px] bg-gray-50 flex items-center">CPF</div>
          <div className="border-t border-[#00703C] p-2 font-medium text-[13px]">{data.driverCpf || ""}</div>
          
          <div className="border-t border-r border-[#00703C] p-2 font-bold uppercase text-[11px] bg-gray-50 flex items-center">Transportador</div>
          <div className="border-t border-[#00703C] p-2 font-medium uppercase text-[13px]">{data.carrier || ""}</div>
          
          <div className="border-t border-r border-[#00703C] p-2 font-bold uppercase text-[11px] bg-gray-50 flex items-center">Placa Cavalo</div>
          <div className="border-t border-[#00703C] p-2 font-black uppercase text-[13px]">{data.truckPlate || ""}</div>
        </div>
      </div>

      {/* Dados da Retirada */}
      <div className="mb-8 space-y-4">
        <h2 className="font-bold text-[14px]">Dados da Retirada:</h2>
        <ul className="list-disc pl-8 space-y-3">
          <li>Data da Retirada: <span className="font-bold border-b border-black inline-block min-w-[120px] text-center">{data.date}</span></li>
          <li>Hora da Retirada: <span className="font-bold border-b border-black inline-block min-w-[120px] text-center">{data.time}</span></li>
          <li>Quantidade de Lacres Retirados: <span className="font-bold border-b border-black inline-block min-w-[120px] text-center">{data.sealsQuantity}</span></li>
          <li>Quantidade de Etiquetas Retiradas: <span className="font-bold border-b border-black inline-block min-w-[120px] text-center">{data.labelsQuantity}</span></li>
        </ul>
      </div>

      {/* Declaração */}
      <div className="mb-16 text-justify leading-relaxed">
        <p className="text-[13px]">
          Declaro, para os devidos fins, que recebi os lacres e etiquetas acima descritos no Gate, 
          comprometendo-me a utilizá-los conforme as normas estabelecidas pela empresa. 
          Estou ciente de que este documento será anexado ao processo correspondente.
        </p>
      </div>

      {/* Assinaturas */}
      <div className="space-y-16">
        <div className="flex flex-col items-start gap-4 ml-12">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-black"></div>
                <span className="font-bold text-[13px]">Assinatura do Motorista:</span>
            </div>
            <div className="w-full max-w-sm border-b border-black pt-4"></div>
        </div>

        <div className="flex flex-col items-start gap-4 ml-12">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-black"></div>
                <span className="font-bold text-[13px]">Assinatura do Responsável pelo Gate:</span>
            </div>
            <div className="w-full max-w-sm border-b border-black pt-4"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
          <div className="h-0.5 w-full bg-[#00703C] opacity-30 mb-4"></div>
          <div className="flex justify-between items-end">
            <div className="text-[9px] text-slate-500 font-bold uppercase leading-tight">
                <p className="text-slate-800 font-black">Intermarítima Portos e Logística S/A</p>
                <p>VIA MATOIM, 482</p>
                <p>DISTRITO INDUSTRIAL - CEP. 43.813-000</p>
                <p>CANDEIAS - BA</p>
                <p className="text-emerald-700 font-black mt-0.5">www.intermaritima.com.br</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <div className="border border-slate-200 rounded p-1 flex items-center gap-2">
                        <div className="flex flex-col items-center leading-none px-2">
                            <span className="text-[7px] text-slate-400 font-bold">CERTIFIED</span>
                            <span className="text-[10px] text-blue-800 font-black">ISO 9001</span>
                        </div>
                        <div className="w-6 h-8 bg-slate-100 flex items-center justify-center">
                            <ShieldCheck iconClassName="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

// Ícone de placeholder para o footer
const ShieldCheck = ({iconClassName}: {iconClassName: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
);

export default WithdrawalTermPreview;
