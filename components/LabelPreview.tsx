
import React, { useMemo } from 'react';
import { Product, LabelSession } from '../types';

interface LabelPreviewProps {
  product: Product;
  session: LabelSession;
}

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
      
      {/* ÁREA DE GUIA (FURO) E LOGOTIPO - APENAS VISUALIZAÇÃO EM TELA (Oculto na Impressão) */}
      <div className="print:hidden w-full flex flex-col items-center pt-4 shrink-0">
        
        {/* Representação do furo da etiqueta (Bolinha tracejada) */}
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
          <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
        </div>

        {/* Logotipo */}
        <img 
          src="logo-fertimaxi.png" 
          alt="Fertimaxi Logo" 
          className="h-24 w-auto object-contain"
          onError={(e) => {
            // Log silencioso se a imagem não existir
            (e.target as HTMLImageElement).style.opacity = '0.3';
          }}
        />
      </div>

      {/* ÁREA DE CONTEÚDO IMPRESSO - Esta parte é a que sai na impressora Zebra */}
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
                <div className="w-[18%] flex col flex-col">
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

      {/* RODAPÉ DA ETIQUETA - APENAS VISUALIZAÇÃO (Oculto na Impressão) */}
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
