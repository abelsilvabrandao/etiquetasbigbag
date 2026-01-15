
import React, { useMemo } from 'react';
import { Product, LabelSession } from '../types';

interface LabelPreviewProps {
  product: Product;
  session: LabelSession;
}

// Logo Fertimaxi em Base64
const LOGO_BASE64 = "data:image/png;base64,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";

const LabelPreview: React.FC<LabelPreviewProps> = ({ product, session }) => {
  // Formata o peso para garantir o padrão milhar (Ex: 1.000)
  const formattedPeso = useMemo(() => {
    if (!session.peso) return "0.000";
    const numericValue = parseInt(session.peso.replace(/\D/g, ''), 10);
    if (isNaN(numericValue)) return session.peso;
    return numericValue.toLocaleString('pt-BR');
  }, [session.peso]);

  return (
    <div className="bg-white text-black font-bold overflow-hidden print:w-[10.5cm] print:h-[16cm] w-[10.5cm] h-[16cm] flex flex-col items-center relative border border-gray-100 shadow-sm print:border-0 print:shadow-none">
      
      {/* LOGOTIPO NO TOPO - IMAGEM EM BASE64 (Sempre visível na tela, oculto na impressão) */}
      <div className="print:hidden w-full flex justify-center pt-2 pb-1 shrink-0">
        <img 
          src={LOGO_BASE64} 
          alt="Fertimaxi Logo" 
          className="h-28 w-auto object-contain"
        />
      </div>

      {/* ÁREA DE CONTEÚDO IMPRESSO - Ajustado para ocupar o espaço disponível */}
      <div className="w-[10.2cm] flex flex-col gap-0 leading-[1.1] text-black z-10 flex-1 justify-center">
        
        {/* Cabeçalho da Empresa - Endereço e CNPJ */}
        <div className="text-center text-[7px] space-y-[0px] mb-1 font-bold uppercase shrink-0">
          <p className="text-[11px] font-black">FERTIMAXI COMERCIO E SERVIÇO DE FERTILIZANTES EIRELI</p>
          <p>BAIRRO: BR324, KM537 CONCEIÇÃO DO JACUIPE - BA</p>
          <p>CNPJ: 08.068.476/0001-76 EP BA - 000541-0</p>
          <p>CEP: 44245-000 TEL.: (75) 3257-2221</p>
          <p>INDÚSTRIA BRASILEIRA</p>
        </div>

        {/* Linha Superior - Divisória fina */}
        <div className="border-t-[1px] border-black mb-1 shrink-0"></div>

        {/* Bloco de Garantias Principais + Registro MAPA */}
        <div className="flex items-stretch gap-4 mb-1 shrink-0">
          {/* Tabela de Garantias NPK */}
          <div className="flex-1 flex border-collapse">
            <div className="w-6 flex items-center justify-center py-1">
              <span className="rotate-[-90deg] text-[7.5px] font-black tracking-tight whitespace-nowrap uppercase">GARANTIAS</span>
            </div>

            <div className="flex-1 flex flex-col border-[1.5px] border-black">
              <div className="flex flex-1">
                {/* Coluna N */}
                <div className="w-[25%] flex flex-col border-r-[1.5px] border-black">
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5 text-center leading-none">
                    <span className="text-[10px] font-black uppercase">% N</span>
                    <span className="text-[7.5px] font-black uppercase">TOTAL</span>
                  </div>
                  <div className="border-t-[1.5px] border-black p-0.5 text-center text-[10.5px] font-black">
                    {product.composition.nTotal || '0'}
                  </div>
                </div>

                {/* Coluna P2O5 */}
                <div className="flex-1 flex flex-col border-r-[1.5px] border-black">
                  <div className="text-center p-0.5 text-[10px] font-black uppercase">% P₂O₅</div>
                  <div className="flex flex-1 border-t-[1.5px] border-black">
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center text-[8.5px] p-0.5 leading-[1.1] text-center font-black">
                        <span>sol. CNA +</span>
                        <span className="uppercase">H₂O</span>
                      </div>
                      <div className="border-t-[1.5px] border-black p-0.5 text-center text-[10.5px] font-black">
                        {product.composition.p2o5Cna || '0'}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col border-l-[1.5px] border-black">
                      <div className="flex-1 flex flex-col items-center justify-center text-[8.5px] p-0.5 leading-[1.1] text-center font-black">
                        <span>sol. <span className="uppercase">H₂O</span></span>
                      </div>
                      <div className="border-t-[1.5px] border-black p-0.5 text-center text-[10.5px] font-black">
                        {product.composition.p2o5Sol || '0'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna K2O */}
                <div className="w-[18%] flex flex-col">
                  <div className="text-center p-0.5 text-[10px] font-black uppercase">% K₂O</div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center text-[8.5px] p-0.5 leading-none text-center font-black">
                      <span>sol.</span>
                      <span className="uppercase">H2O</span>
                    </div>
                    <div className="border-t-[1.5px] border-black p-0.5 text-center text-[10.5px] font-black">
                      {product.composition.k2oSol || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloco Registro MAPA à Direita */}
          <div className="w-[3.8cm] flex flex-col items-center shrink-0">
            <div className="text-center text-[7.5px] font-black mb-1 uppercase">REG. PRODUTO NO MAPA</div>
            <div className="w-full border-[1.5px] border-black bg-white">
              <div className="p-1 text-center font-black text-[9px] border-b-[1.5px] border-black leading-none min-h-[1.1rem] flex items-center justify-center uppercase">
                {product.mapaReg}
              </div>
              <div className="flex items-center text-[7.5px] font-black uppercase p-1">
                 <div className="whitespace-nowrap mr-1">APLICAÇÃO:</div>
                 <div className="flex-1 text-center">{product.application}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categoria do Produto */}
        <div className="flex flex-col mb-1 pl-6 shrink-0">
          <div className="text-center text-[8.5px] font-black py-0.5 uppercase tracking-wider">
            {product.category}
          </div>
          
          <table className="w-full border-[1.5px] border-black text-center text-[7px] table-fixed border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-black h-4">
                <th className="border-r-[1.5px] border-black font-black text-[9.5px]">% S</th>
                <th className="border-r-[1.5px] border-black font-black text-[9.5px]">% Ca</th>
                <th className="border-r-[1.5px] border-black font-black text-[9.5px]">% B</th>
                <th className="border-r-[1.5px] border-black font-black text-[9.5px]">% Cu</th>
                <th className="border-r-[1.5px] border-black font-black text-[9.5px]">% Mn</th>
                <th className="border-r-[1.5px] border-black font-black text-[9.5px]">% Zn</th>
                <th className="font-black text-[9.5px]">% NBPT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-5">
                <td className="border-r-[1.5px] border-black text-[10px] font-black">{product.composition.s || ''}</td>
                <td className="border-r-[1.5px] border-black text-[10px] font-black">{product.composition.ca || ''}</td>
                <td className="border-r-[1.5px] border-black text-[10px] font-black">{product.composition.b || ''}</td>
                <td className="border-r-[1.5px] border-black text-[10px] font-black">{product.composition.cu || ''}</td>
                <td className="border-r-[1.5px] border-black text-[10px] font-black">{product.composition.mn || ''}</td>
                <td className="border-r-[1.5px] border-black text-[10px] font-black">{product.composition.zn || ''}</td>
                <td className="text-[10px] font-black">{product.composition.nbpt || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Separador de Informações Adicionais */}
        <div className="mt-1 border-t-[1px] border-b-[1px] border-black p-0.5 text-center text-[9px] font-black tracking-tight uppercase shrink-0">
          COMPONENTES DO PRODUTO / INFORMAÇÕES ADICIONAIS:
        </div>

        {/* Nome do Produto */}
        <div className="flex items-center justify-center py-2 shrink-0">
          <div className="text-2xl font-black text-center leading-tight px-2 uppercase">
            {product.name}
          </div>
        </div>

        {/* Natureza Física */}
        <div className="mt-1 flex flex-col shrink-0">
          <div className="border-t-[1px] border-b-[1px] border-black p-0.5 text-center text-[9.5px] font-black tracking-tight uppercase">
            ESPECIFICAÇÃO DE NATUREZA FÍSICA:
          </div>
          <div className="border-b-[1.5px] border-black text-center py-1.5 text-2xl font-black uppercase">
            {product.nature}
          </div>
        </div>

        {/* Tabela de Lote */}
        <table className="w-full border-b-[1.5px] border-black text-center text-[7.5px] font-bold border-collapse shrink-0">
          <thead>
            <tr className="border-b-[1.5px] border-black h-4">
              <th className="border-r-[1.5px] border-black uppercase w-[38%]">LOTE</th>
              <th className="border-r-[1.5px] border-black uppercase w-[15%]">PLACA</th>
              <th className="border-r-[1.5px] border-black uppercase w-[11%]">TON</th>
              <th className="border-r-[1.5px] border-black uppercase w-[18%]">FABRICAÇÃO</th>
              <th className="uppercase w-[18%]">VALIDO ATÉ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-7">
              <td className="border-r-[1.5px] border-black text-[9.5px] font-black px-0.5 break-all leading-tight">{session.lote}</td>
              <td className="border-r-[1.5px] border-black text-[9.5px] font-black px-0.5 break-all leading-tight">{session.placa}</td>
              <td className="border-r-[1.5px] border-black text-[9.5px] font-black px-0.5">{session.tonelada}</td>
              <td className="border-r-[1.5px] border-black text-[9.5px] font-black px-0.5">{session.fabricacao}</td>
              <td className="text-[9.5px] font-black px-0.5">{session.validade}</td>
            </tr>
          </tbody>
        </table>

        {/* Peso Final */}
        <div className="text-center py-2 text-5xl font-black uppercase tracking-tighter shrink-0">
          {formattedPeso} KG
        </div>
      </div>

      {/* RODAPÉ DA ETIQUETA - APENAS VISUALIZAÇÃO */}
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

export default LabelPreview;
