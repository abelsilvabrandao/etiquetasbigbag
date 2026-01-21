
import React, { useMemo, useState } from 'react';
import { Product, LabelSession } from '../types';

interface LabelPreviewProps {
  product: Product;
  session: LabelSession;
}

// Logo Cibra em Base64 para garantir exibição (Versão simplificada e leve)
const LOGO_CIBRA_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABACAMAAAC976SRAAAAnFBMVEX///8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv8Aqv9xY2m9AAAAUnRSTlMAAwUKDB0eHygpLi86O0BEQUVGR0hMTU5PVFZZWl1fYGVmZ2pvcnN3eHt9f3+ChYaHiIyNjo+QlJaXmZudn6Cho6Spqqyur7Czs7W2t7i5ur6/wMXGx+D2fFEAAAMdSURBVGje7ZjbchMxDEXBySXOJRda6P3/P7ZJSW90OmmZ7N00zD6vU9IInmNRpXre7/f7/f7X0mUo0vR0H8rE78rC70un21M9/D3V6S5VvFOfE8SuvQm0p90EmqfNCPdqNoL6VMPfMWh3GNRp9X0m7x6mOfLpXp/6U8z3O6O+I+pPMXpYp/6SgYdh9HBIdD8W/F0M7keCh+HgoCw8HAoPh8LDofBwKDwvCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCg+HwsOh8HAoPBwKD4fCw6HwcCg8HAgPh8LDofBwKDwcCo/zB76mYv+pLvep5O5U/O/9AV8m8TyA+v1+v9/v9/uf7A9u438uG0DndwAAAABJRU5ErkJggg==";

// Logo Fertimaxi em Base64
const LOGO_FERTIMAXI_BASE64 = "data:image/png;base64,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";

const CibraLabel: React.FC<LabelPreviewProps> = ({ product, session }) => {
  const [logoError, setLogoError] = useState(false);
  return (
    <div className="bg-white text-black font-sans font-bold overflow-hidden print:w-[10cm] print:h-[7cm] w-[10cm] h-[7cm] flex flex-col items-center relative border-[1px] border-black shadow-none print:border-[1px] p-1.5 leading-none">
      
      {/* Header CIBRA - Mais compacto */}
      <div className="w-full flex justify-between items-start mb-0.5 px-0.5 shrink-0">
        <div className="flex flex-col pt-0.5">
          {!logoError ? (
            <img
              src="/logo-cibra-registrada.png"
              alt="Cibra Logo"
              className="h-7 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <img
              src={LOGO_CIBRA_BASE64}
              alt="Cibra Logo Fallback"
              className="h-7 w-auto object-contain"
            />
          )}
        </div>
        <div className="text-[6.5px] text-right font-black leading-tight pt-0.5">
          <p className="text-[8px] tracking-tighter font-black">CIA BRASILEIRA FERTILIZANTES</p>
          <p>CNPJ: 00.117.842/0005-51 IE: 1246.638.55</p>
          <p>V MATOIM, BRACO BC - CIA NORTE - CANDEIAS / BA</p>
          <p>CEP: 43813-000</p>
        </div>
      </div>

      {/* Seção Garantias - Altura reduzida para caber nos 7cm */}
      <div className="w-full border-[1.2px] border-black mb-0 shrink-0">
        <div className="flex h-[58px]">
           <div className="flex-1 flex flex-col border-r-[1.2px] border-black">
              <div className="bg-zinc-900 text-white text-center text-[9px] py-0.5 font-black uppercase tracking-wider border-b-[1.2px] border-black">GARANTIAS</div>
              {/* Garantias Primárias Grid Unificado */}
              <div className="flex bg-white flex-1">
                 <div className="flex-1 border-r border-black flex flex-col justify-center">
                    <div className="text-center h-6 flex flex-col justify-center border-b border-black">
                       <span className="text-[8px] font-black leading-tight">% N</span>
                       <span className="text-[7px] font-black leading-tight">Total</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[14px] font-black">{product.composition.nTotal || '00'}</div>
                 </div>
                 <div className="flex-1 border-r border-black flex flex-col justify-center">
                    <div className="text-center h-6 flex flex-col justify-center border-b border-black">
                       <span className="text-[8px] font-black leading-tight">% P₂O₅</span>
                       <span className="text-[6px] font-black leading-tight">Sol.CNA+H₂O</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[14px] font-black">{product.composition.p2o5Cna || '00'}</div>
                 </div>
                 <div className="flex-1 border-r border-black flex flex-col justify-center">
                    <div className="text-center h-6 flex flex-col justify-center border-b border-black">
                       <span className="text-[8px] font-black leading-tight">% P₂O₅</span>
                       <span className="text-[6px] font-black leading-tight">Sol. Água</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[14px] font-black">{product.composition.p2o5Sol || '00'}</div>
                 </div>
                 <div className="flex-1 flex flex-col justify-center">
                    <div className="text-center h-6 flex flex-col justify-center border-b border-black">
                       <span className="text-[8px] font-black leading-tight">% K₂O</span>
                       <span className="text-[6px] font-black leading-tight">Sol. Água</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[14px] font-black">{product.composition.k2oSol || '00'}</div>
                 </div>
              </div>
           </div>
           {/* Reg. MAPA e EP BA */}
           <div className="w-[100px] flex flex-col">
              <div className="bg-white text-black text-center text-[8px] py-0.5 font-black h-6 border-b-[1.2px] border-black flex items-center justify-center tracking-tight leading-none">
                {product.epBa || 'EP BA 000939-3'}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-0.5 text-center leading-none">
                 <span className="text-[10px] font-black mb-0.5">Reg. Produto</span>
                 <span className="text-[9px] font-black">{product.mapaReg || 'BA000773-0.000090'}</span>
              </div>
           </div>
        </div>

        {/* Micros Grid Unificado - Linhas compactas */}
        <div className="flex text-center border-t-[1.2px] border-black font-black uppercase bg-white">
           {[
             { label: '% Mg', value: product.composition.mg },
             { label: '% Ca', value: product.composition.ca },
             { label: '% S', value: product.composition.s },
             { label: '% SO4', value: product.composition.so4 },
             { label: '% B', value: product.composition.b },
             { label: '% Cu', value: product.composition.cu },
             { label: '% Mn', value: product.composition.mn },
             { label: '% Zn', value: product.composition.zn }
           ].map((item, idx, arr) => (
             <div key={idx} className={`flex-1 flex flex-col ${idx !== arr.length - 1 ? 'border-r border-black' : ''}`}>
                <div className="text-[7.5px] py-0.5 border-b border-black leading-none">{item.label}</div>
                <div className="text-[10px] h-5.5 flex items-center justify-center">{item.value || '-'}</div>
             </div>
           ))}
        </div>
      </div>

      {/* Info Adicional / Nome do Produto - Ajuste de espaçamento acima do nome */}
      <div className="w-full border-[1.2px] border-black border-t-0 mb-0 shrink-0">
         <div className="bg-zinc-900 text-white text-center text-[9px] py-0.5 font-black uppercase tracking-tight border-b-[1.2px] border-black">COMPONENTES DO PRODUTO / INFORMAÇÕES ADICIONAIS</div>
         <div className="text-[14px] font-black text-center py-0.5 uppercase leading-tight min-h-[22px] flex items-center justify-center tracking-tight px-3">
           {product.name}
         </div>
         <div className="bg-zinc-900 text-white text-center font-black uppercase border-t-[1.2px] border-black flex flex-col justify-center py-0.5 leading-tight">
            <span className="text-[7.5px]">APLICAÇÃO VIA SOLO • INDÚSTRIA BRASILEIRA</span>
         </div>
      </div>

      {/* Natureza e Marca */}
      <div className="w-full text-[8.5px] border-[1.2px] border-black border-t-0 font-black bg-white shrink-0 flex flex-col">
         <div className="text-center uppercase text-[9px] py-1">
            FERTILIZANTE MINERAL SIMPLES
         </div>
         <div className="flex border-b border-black pb-1 px-1">
            <div className="flex-1 uppercase tracking-tighter">
               MARCA: <span className="font-black text-[10px]">CIBRA</span>
            </div>
            <div className="flex-1 text-right uppercase tracking-tighter">
               PESO LÍQUIDO: <span className="font-black text-[10px]">{session.peso} KG</span>
            </div>
         </div>
         <div className="flex">
            <div className="flex-1 p-0.5 px-1 border-r border-black uppercase tracking-tighter">
               NATUREZA: <span className="font-black text-[10px] uppercase">{product.nature}</span>
            </div>
            <div className="flex-1 p-0.5 px-1 uppercase tracking-tighter">
               ADITIVO: <span className="font-black text-[10px]">{product.composition.aditivo === '-' ? '' : (product.composition.aditivo || '')}</span>
            </div>
         </div>
      </div>

      {/* Rastreabilidade - Redução do espaçamento vertical h-8 para h-5.5 */}
      <div className="w-full border-[1.2px] border-black border-t-0 shrink-0 flex flex-col">
         <div className="flex bg-white flex-1">
            <div className="flex-1 border-r border-black flex flex-col">
               <div className="text-center text-[7.5px] font-black uppercase py-0.5 border-b border-black">LOTE Nº:</div>
               <div className="h-[22px] flex items-center justify-center text-[10px] font-black tracking-tighter px-0.5">{session.lote}</div>
            </div>
            <div className="flex-1 border-r border-black flex flex-col">
               <div className="text-center text-[7.5px] font-black uppercase py-0.5 border-b border-black">QTD KG</div>
               <div className="h-[22px] flex items-center justify-center text-[10px] font-black">{session.tonelada}</div>
            </div>
            <div className="flex-1 border-r border-black flex flex-col">
               <div className="text-center text-[7.5px] font-black uppercase py-0.5 border-b border-black">FABRICAÇÃO:</div>
               <div className="h-[22px] flex items-center justify-center text-[9px] font-black">{session.fabricacao}</div>
            </div>
            <div className="flex-1 flex flex-col">
               <div className="text-center text-[7.5px] font-black uppercase py-0.5 border-b border-black">VÁLIDO ATÉ:</div>
               <div className="h-[22px] flex items-center justify-center text-[9px] font-black">{session.validade}</div>
            </div>
         </div>
      </div>
    </div>
  );
};

const FertimaxiLabel: React.FC<LabelPreviewProps> = ({ product, session }) => {
  const [imageError, setImageError] = useState(false);

  const formattedPeso = useMemo(() => {
    if (!session.peso) return "0.000";
    const numericValue = parseInt(session.peso.replace(/\D/g, ''), 10);
    if (isNaN(numericValue)) return session.peso;
    return numericValue.toLocaleString('pt-BR');
  }, [session.peso]);

  return (
    <div className="bg-white text-black font-bold overflow-hidden print:w-[10.5cm] print:h-[16cm] w-[10.5cm] h-[16cm] flex flex-col items-center relative border border-gray-100 shadow-sm print:border-0 print:shadow-none">
      <div className="print:hidden w-full flex flex-col items-center pt-4 shrink-0 px-4">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
          <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-24 w-full flex items-center justify-center overflow-hidden">
          {!imageError ? (
            <img 
              src="https://fertimaxi.com.br/wp-content/uploads/2019/11/logo-fertimaxi.png" 
              alt="Fertimaxi Logo" 
              className="h-full w-auto object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <img 
              src={LOGO_FERTIMAXI_BASE64}
              alt="Fertimaxi Logo Fallback" 
              className="h-full w-auto object-contain opacity-90"
            />
          )}
        </div>
      </div>

      <div className="w-full px-5 flex flex-col gap-0 leading-[1.1] text-black z-10 flex-1 print:mt-[3.5cm]">
        <div className="text-center text-[7px] space-y-[0px] mb-1 font-bold uppercase shrink-0">
          <p className="text-[11px] font-black">FERTIMAXI COMERCIO E SERVIÇO DE FERTILIZANTES EIRELI</p>
          <p>BAIRRO: BR324, KM537 CONCEIÇÃO DO JACUIPE - BA</p>
          <p>CNPJ: 08.068.476/0001-76 EP BA - 000541-0</p>
          <p>CEP: 44245-000 TEL.: (75) 3257-2221</p>
          <p>INDÚSTRIA BRASILEIRA</p>
        </div>
        <div className="border-t border-black mb-1 shrink-0"></div>
        <div className="flex items-stretch gap-4 mb-1 shrink-0">
          <div className="flex-1 flex border-collapse">
            <div className="w-6 flex items-center justify-center py-1">
              <span className="rotate-[-90deg] text-[7.5px] font-black tracking-tight whitespace-nowrap uppercase">GARANTIAS</span>
            </div>
            <div className="flex-1 flex flex-col border border-black">
              <div className="flex flex-1">
                <div className="w-[25%] flex flex-col border-r border-black">
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5 text-center leading-none">
                    <span className="text-[10px] font-black uppercase">% N</span>
                    <span className="text-[7.5px] font-black uppercase">TOTAL</span>
                  </div>
                  <div className="border-t border-black p-0.5 text-center text-[10.5px] font-black">
                    {product.composition.nTotal || '0'}
                  </div>
                </div>
                <div className="flex-1 flex flex-col border-r border-black">
                  <div className="text-center p-0.5 text-[10px] font-black uppercase">% P₂O₅</div>
                  <div className="flex flex-1 border-t border-black">
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center text-[8.5px] p-0.5 leading-[1.1] text-center font-black">
                        <span>sol. CNA +</span>
                        <span className="uppercase">H₂O</span>
                      </div>
                      <div className="border-t border-black p-0.5 text-center text-[10.5px] font-black">
                        {product.composition.p2o5Cna || '0'}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col border-l border-black">
                      <div className="flex-1 flex flex-col items-center justify-center text-[8.5px] p-0.5 leading-[1.1] text-center font-black">
                        <span>sol. <span className="uppercase">H₂O</span></span>
                      </div>
                      <div className="border-t border-black p-0.5 text-center text-[10.5px] font-black">
                        {product.composition.p2o5Sol || '0'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-[18%] flex flex-col">
                  <div className="text-center p-0.5 text-[10px] font-black uppercase">% K₂O</div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center text-[8.5px] p-0.5 leading-none text-center font-black">
                      <span>sol.</span>
                      <span className="uppercase">H2O</span>
                    </div>
                    <div className="border-t border-black p-0.5 text-center text-[10.5px] font-black">
                      {product.composition.k2oSol || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[3.2cm] flex flex-col items-center shrink-0">
            <div className="text-center text-[7.5px] font-black mb-1 uppercase">REG. PRODUTO NO MAPA</div>
            <div className="w-full border border-black bg-white">
              <div className="p-1 text-center font-black text-[9px] border-b border-black leading-none min-h-[1.1rem] flex items-center justify-center uppercase">
                {product.mapaReg}
              </div>
              <div className="flex items-center text-[7.5px] font-black uppercase p-1">
                 <div className="whitespace-nowrap mr-1">APLICAÇÃO:</div>
                 <div className="flex-1 text-center">{product.application}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col mb-1 shrink-0">
          <div className="text-center text-[8.5px] font-black py-0.5 uppercase tracking-wider">
            {product.category}
          </div>
          <div className="flex">
            <div className="w-6 shrink-0"></div>
            <table className="flex-1 border border-black text-center text-[7px] table-fixed border-collapse">
              <thead>
                <tr className="border-b border-black h-4">
                  <th className="border-r border-black font-black text-[9.5px]">% S</th>
                  <th className="border-r border-black font-black text-[9.5px]">% Ca</th>
                  <th className="border-r border-black font-black text-[9.5px]">% B</th>
                  <th className="border-r border-black font-black text-[9.5px]">% Cu</th>
                  <th className="border-r border-black font-black text-[9.5px]">% Mn</th>
                  <th className="border-r border-black font-black text-[9.5px]">% Zn</th>
                  <th className="font-black text-[9.5px]">% NBPT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-5">
                  <td className="border-r border-black text-[10px] font-black">{product.composition.s || ''}</td>
                  <td className="border-r border-black text-[10px] font-black">{product.composition.ca || ''}</td>
                  <td className="border-r border-black text-[10px] font-black">{product.composition.b || ''}</td>
                  <td className="border-r border-black text-[10px] font-black">{product.composition.cu || ''}</td>
                  <td className="border-r border-black text-[10px] font-black">{product.composition.mn || ''}</td>
                  <td className="border-r border-black text-[10px] font-black">{product.composition.zn || ''}</td>
                  <td className="text-[10px] font-black">{product.composition.nbpt || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-1 border-t border-b border-black p-0.5 text-center text-[9px] font-black tracking-tight uppercase shrink-0">
          COMPONENTES DO PRODUTO / INFORMAÇÕES ADICIONAIS:
        </div>
        <div className="flex items-center justify-center py-2 shrink-0">
          <div className="text-xl font-black text-center leading-tight px-2 uppercase">
            {product.name}
          </div>
        </div>
        <div className="mt-1 flex flex-col shrink-0">
          <div className="border-t border-b border-black p-0.5 text-center text-[9.5px] font-black tracking-tight uppercase">
            ESPECIFICAÇÃO DE NATUREZA FÍSICA:
          </div>
          <div className="border-b border-black text-center py-1.5 text-xl font-black uppercase">
            {product.nature}
          </div>
        </div>
        <table className="w-full border-b border-black text-center text-[7.5px] font-bold border-collapse shrink-0">
          <thead>
            <tr className="border-b border-black h-4">
              <th className="border-r border-black uppercase w-[38%]">LOTE</th>
              <th className="border-r border-black uppercase w-[15%]">PLACA</th>
              <th className="border-r border-black uppercase w-[11%]">TON</th>
              <th className="border-r border-black uppercase w-[18%]">FABRICAÇÃO</th>
              <th className="uppercase w-[18%]">VALIDO ATÉ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-7">
              <td className="border-r border-black text-[9.5px] font-black px-0.5 break-all leading-tight">{session.lote}</td>
              <td className="border-r border-black text-[9.5px] font-black px-0.5 break-all leading-tight">{session.placa}</td>
              <td className="border-r border-black text-[9.5px] font-black px-0.5">{session.tonelada}</td>
              <td className="border-r border-black text-[9.5px] font-black px-0.5">{session.fabricacao}</td>
              <td className="text-[9.5px] font-black px-0.5">{session.validade}</td>
            </tr>
          </tbody>
        </table>
        <div className="text-center py-2 text-5xl font-black uppercase tracking-tighter shrink-0">
          {formattedPeso} KG
        </div>
      </div>
      <div className="print:hidden w-full shrink-0 flex flex-col items-center">
        <div className="w-full bg-[#A3C617] py-1.5 flex flex-col items-center text-white">
          <span className="text-[12px] font-black uppercase leading-none tracking-widest">FERTILIZANTE</span>
          <span className="text-[7px] font-bold uppercase leading-none mt-0.5">Informações ao Consumidor no Verso.</span>
        </div>
        <div className="py-2 text-black text-[8px] font-black uppercase tracking-widest">
          INDÚSTRIA BRASILEIRA
        </div>
      </div>
    </div>
  );
};

const LabelPreview: React.FC<LabelPreviewProps> = ({ product, session }) => {
  if (product.clientName === 'CIBRA') {
    return <CibraLabel product={product} session={session} />;
  }
  return <FertimaxiLabel product={product} session={session} />;
};

export default LabelPreview;
