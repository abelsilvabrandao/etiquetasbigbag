
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, LabelSession, AppView, WithdrawalTermData, GenerationRecord, QueueItem } from './types';
import { INITIAL_PRODUCTS } from './constants';
import LabelPreview from './components/LabelPreview';
import ProductForm from './components/ProductForm';
import WithdrawalTermForm from './components/WithdrawalTermForm';
import WithdrawalTermPreview from './components/WithdrawalTermPreview';
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  Search, Plus, Trash2, Printer, Edit2, Package, Tag, FileText, 
  ChevronRight, Database, CheckCircle2, History, Clock, RotateCcw, Copy, Filter, XCircle, Truck, AlertTriangle, Info, X, Weight, Anchor, ListOrdered, FileUp, GripVertical, Check, ExternalLink, Calendar, Eye, Settings2
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

// Definindo PDF.js globalmente
declare const pdfjsLib: any;

interface ConfirmDialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  icon?: React.ReactNode;
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [view, setView] = useState<AppView>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTermFilter, setHistoryTermFilter] = useState<'all' | 'with' | 'without'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  const [labelQuantity, setLabelQuantity] = useState('1');
  const [showTermPrompt, setShowTermPrompt] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [isPreviewTermOpen, setIsPreviewTermOpen] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalTermData | null>(null);
  const [isPrintingTerm, setIsPrintingTerm] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(true);

  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  const [pendingPrint, setPendingPrint] = useState<'label' | 'term' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    variant: 'primary',
    onConfirm: () => {}
  });

  const [session, setSession] = useState<LabelSession>({
    lote: '',
    placa: '',
    tonelada: '',
    fabricacao: new Date().toLocaleDateString('pt-BR'),
    validade: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('pt-BR'),
    peso: '1.000'
  });

  const [historyPrintRecord, setHistoryPrintRecord] = useState<{product: Product, session: LabelSession, qty: string} | null>(null);

  useEffect(() => {
    setCurrentLogId(null);
  }, [session.lote, session.placa, selectedProductId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      if (items.length === 0) {
        INITIAL_PRODUCTS.forEach(async (p) => {
          await setDoc(doc(db, 'products', p.id), p);
        });
      }
      setProducts(items);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GenerationRecord));
      setHistory(items);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Sincroniza fila do Firebase
    const unsub = onSnapshot(query(collection(db, 'queue'), orderBy('order', 'asc')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as QueueItem));
      setQueue(items);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (session.tonelada) {
      const tonStr = session.tonelada.replace(',', '.');
      const tonVal = parseFloat(tonStr);
      if (!isNaN(tonVal)) {
        const decimalPart = tonVal % 1;
        let rounded = decimalPart <= 0.5 ? Math.floor(tonVal) : Math.ceil(tonVal);
        setLabelQuantity(Math.max(1, rounded).toString());
      }
    }
  }, [session.tonelada]);

  useEffect(() => {
    if (pendingPrint) {
      const timer = setTimeout(() => {
        window.print();
        if (pendingPrint === 'term') {
          setIsPrintingTerm(false);
          setWithdrawalData(null);
          setShowTermPrompt(false);
          setIsPreviewTermOpen(false);
        } else if (pendingPrint === 'label') {
          if (historyPrintRecord) setHistoryPrintRecord(null);
          setShowTermPrompt(true);
        }
        setPendingPrint(null);
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [pendingPrint, historyPrintRecord]);

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const search = historySearchQuery.toLowerCase();
      const matchesSearch = !search || 
        record.productName.toLowerCase().includes(search) ||
        record.placa.toLowerCase().includes(search) ||
        record.lote.toLowerCase().includes(search) ||
        (record.driverName && record.driverName.toLowerCase().includes(search)) ||
        (record.carrier && record.carrier.toLowerCase().includes(search));

      const matchesTerm = historyTermFilter === 'all' || 
        (historyTermFilter === 'with' && record.termGenerated) ||
        (historyTermFilter === 'without' && !record.termGenerated);

      return matchesSearch && matchesTerm;
    });
  }, [history, historySearchQuery, historyTermFilter]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleSaveProduct = async (product: Product) => {
    await setDoc(doc(db, 'products', product.id), product);
    setIsProductModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleDeleteProduct = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto do Banco de Dados? Esta ação não pode ser revertida.',
      confirmLabel: 'EXCLUIR AGORA',
      variant: 'danger',
      icon: <Trash2 size={24} />,
      onConfirm: async () => {
        await deleteDoc(doc(db, 'products', id));
        if (selectedProductId === id) setSelectedProductId(null);
        closeConfirm();
      }
    });
  };

  const handleReset = () => {
    setSelectedProductId(null);
    setSearchQuery('');
    setCurrentLogId(null);
    setLabelQuantity('1');
    setSession({
      lote: '',
      placa: '',
      tonelada: '',
      fabricacao: new Date().toLocaleDateString('pt-BR'),
      validade: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('pt-BR'),
      peso: '1.000'
    });
    setShowTermPrompt(false);
    setIsPrintingTerm(false);
    setIsPreviewTermOpen(false);
    setWithdrawalData(null);
  };

  const handleLoadFromHistory = (record: GenerationRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Carregar Registro',
      message: `Deseja carregar os dados do lote ${record.lote} no formulário do Gerador?`,
      confirmLabel: 'CARREGAR DADOS',
      variant: 'primary',
      icon: <Copy size={24} />,
      onConfirm: () => {
        const product = products.find(p => p.code === record.productCode || p.name === record.productName);
        if (product) {
          setSelectedProductId(product.id);
          setSession(prev => ({
            ...prev,
            lote: record.lote,
            placa: record.placa,
            tonelada: record.tonelada
          }));
          setView('generator');
        }
        closeConfirm();
      }
    });
  };

  const handleHistoryPrintLabels = (record: GenerationRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Reimprimir Etiquetas',
      message: `Confirmar a impressão de ${record.labelsQuantity} etiquetas para o lote ${record.lote}?`,
      confirmLabel: 'IMPRIMIR AGORA',
      variant: 'success',
      icon: <Printer size={24} />,
      onConfirm: () => {
        const product = products.find(p => p.code === record.productCode || p.name === record.productName);
        if (product) {
          setHistoryPrintRecord({
            product,
            session: {
              lote: record.lote,
              placa: record.placa,
              tonelada: record.tonelada,
              fabricacao: '',
              validade: '',
              peso: '1.000'
            },
            qty: record.labelsQuantity
          });
          setIsPrintingTerm(false);
          setPendingPrint('label');
        }
        closeConfirm();
      }
    });
  };

  const handleDeleteHistory = async (id: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Histórico',
      message: 'Deseja remover permanentemente este registro das emissões passadas?',
      confirmLabel: 'REMOVER REGISTRO',
      variant: 'danger',
      icon: <Trash2 size={24} />,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'history', id));
          closeConfirm();
        } catch (error) {
          alert('Erro ao excluir: ' + error);
        }
      }
    });
  };

  const handleHistoryTerm = (record: GenerationRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const isReprint = record.termGenerated;
    setConfirmDialog({
      isOpen: true,
      title: isReprint ? 'Reimprimir Termo' : 'Gerar Termo',
      message: isReprint 
        ? `Deseja visualizar/reimprimir o termo de retirada do motorista ${record.driverName}?` 
        : 'Este registro ainda não possui um termo. Deseja preencher e gerar agora?',
      confirmLabel: isReprint ? 'VISUALIZAR TERMO' : 'ABRIR FORMULÁRIO',
      variant: isReprint ? 'success' : 'primary',
      icon: <FileText size={24} />,
      onConfirm: () => {
        closeConfirm();
        if (isReprint && record.driverName && record.driverCpf) {
          setWithdrawalData({
            driverName: record.driverName,
            driverCpf: record.driverCpf,
            carrier: record.carrier || '',
            truckPlate: record.placa,
            date: record.date || new Date().toLocaleDateString('pt-BR'),
            time: record.time || '',
            sealsQuantity: record.sealsQuantity || record.labelsQuantity,
            labelsQuantity: record.labelsQuantity,
            hasSeals: !!record.sealsQuantity && record.sealsQuantity !== '0'
          });
          setIsPreviewTermOpen(true);
        } else {
          setCurrentLogId(record.id || null);
          setLabelQuantity(record.labelsQuantity);
          setSession(prev => ({ ...prev, placa: record.placa }));
          setWithdrawalData(null);
          setIsTermModalOpen(true);
        }
      }
    });
  };

  const logToFirebase = async (termGenerated: boolean, termData?: WithdrawalTermData) => {
    if (!saveToHistory || !selectedProduct) return;

    if (currentLogId && termGenerated && termData) {
      const docRef = doc(db, 'history', currentLogId);
      await updateDoc(docRef, {
        termGenerated: true,
        driverName: termData.driverName,
        driverCpf: termData.driverCpf,
        carrier: termData.carrier,
        sealsQuantity: termData.sealsQuantity,
        date: termData.date,
        time: termData.time
      });
      return;
    }

    const record: GenerationRecord = {
      timestamp: serverTimestamp(),
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      productNature: selectedProduct.nature,
      lote: session.lote,
      placa: session.placa,
      tonelada: session.tonelada,
      labelsQuantity: labelQuantity,
      termGenerated
    };
    
    if (termGenerated && termData) {
      record.driverName = termData.driverName;
      record.driverCpf = termData.driverCpf;
      record.carrier = termData.carrier;
      record.sealsQuantity = termData.sealsQuantity;
      record.date = termData.date;
      record.time = termData.time;
    }

    const docRef = await addDoc(collection(db, 'history'), record);
    setCurrentLogId(docRef.id);
  };

  const handlePrintLabels = () => {
    if (!selectedProduct) return;

    // Validação de campos obrigatórios
    const missingFields = [];
    if (!session.lote) missingFields.push('Lote');
    if (!session.placa) missingFields.push('Placa');
    if (!session.tonelada) missingFields.push('Tonelagem');
    if (!session.fabricacao) missingFields.push('Fabricação');
    if (!session.validade) missingFields.push('Validade');

    if (missingFields.length > 0) {
      alert(`Os seguintes campos são obrigatórios: \n- ${missingFields.join('\n- ')}`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Emissão',
      message: `Serão impressas ${labelQuantity} etiquetas para o lote ${session.lote}. Confirmar processo?`,
      confirmLabel: 'INICIAR IMPRESSÃO',
      variant: 'success',
      icon: <Printer size={24} />,
      onConfirm: () => {
        setIsPrintingTerm(false);
        logToFirebase(false);
        setPendingPrint('label');
        closeConfirm();
      }
    });
  };

  const handleTermSave = async (data: WithdrawalTermData) => {
    setWithdrawalData(data);
    await logToFirebase(true, data);
    setIsTermModalOpen(false);
    setIsPreviewTermOpen(true);
  };

  const confirmAndPrintTerm = () => {
    setIsPrintingTerm(true);
    setPendingPrint('term');
  };

  const handlePesoChange = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) {
      setSession({ ...session, peso: '' });
      return;
    }
    const formatted = parseInt(numeric, 10).toLocaleString('pt-BR');
    setSession({ ...session, peso: formatted });
  };

  const handleDateChange = (name: 'fabricacao' | 'validade', dateValue: string) => {
    if (!dateValue) {
      setSession(prev => ({ ...prev, [name]: '' }));
      return;
    }
    const [year, month, day] = dateValue.split('-');
    setSession(prev => ({ ...prev, [name]: `${day}/${month}/${year}` }));
  };

  const getDateValue = (brDate: string) => {
    if (!brDate || !brDate.includes('/')) return '';
    const [day, month, year] = brDate.split('/');
    return `${year}-${month}-${day}`;
  };

  // Funções da Fila de Carregamento
  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + "\n";
        }

        const rowRegex = /(\d+)\s+([A-Z]{3}\d[A-Z\d]\d{2})\s+(.*?)\s+(SULFATO|Ureia|UREIA|SUPER|CLORETO|S\.AMONIO|AMONIO).*?\s+(BigBag|Granel|Saca)\s+(\d+)\s+.*?\s+.*?\s+(\d+)/gi;

        const newItems: QueueItem[] = [];
        let match;
        let count = queue.length + 1;
        while ((match = rowRegex.exec(fullText)) !== null) {
          const [_, ordemOrig, placa, carrier, prodRaw, especie, qty, pedido] = match;
          
          newItems.push({
            id: crypto.randomUUID(),
            order: count++,
            placa: placa.toUpperCase(),
            carrier: carrier.toUpperCase(),
            productName: prodRaw.toUpperCase(),
            quantity: qty,
            orderNumber: pedido,
            status: 'pending'
          });
        }

        if (newItems.length > 0) {
          for (const item of newItems) {
            await addDoc(collection(db, 'queue'), item);
          }
        } else {
          alert("Nenhum veículo identificado no PDF. Verifique o formato do arquivo.");
        }
      } catch (error) {
        console.error("PDF Parse Error:", error);
        alert("Erro ao ler PDF: " + (error as Error).message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleQueueStatusChange = async (id: string, newStatus: QueueItem['status']) => {
    await updateDoc(doc(db, 'queue', id), { status: newStatus });
  };

  const handleRemoveQueueItem = async (id: string) => {
    await deleteDoc(doc(db, 'queue', id));
  };

  const handleReorder = async (newOrder: QueueItem[]) => {
    setQueue(newOrder);
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].order !== i + 1) {
        await updateDoc(doc(db, 'queue', newOrder[i].id), { order: i + 1 });
      }
    }
  };

  const handleGenerateFromQueue = (item: QueueItem) => {
    const matchingProduct = products.find(p => 
      item.productName.toUpperCase().includes(p.name.toUpperCase()) ||
      p.name.toUpperCase().includes(item.productName.toUpperCase())
    );

    setSelectedProductId(matchingProduct?.id || null);
    setSession(prev => ({
      ...prev,
      placa: item.placa,
      tonelada: item.quantity,
      lote: '' 
    }));
    
    handleQueueStatusChange(item.id, 'label_issued');
    setView('generator');
  };

  const clearQueue = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Limpar Fila',
      message: 'Deseja remover TODOS os itens da fila de carregamento?',
      confirmLabel: 'LIMPAR AGORA',
      variant: 'danger',
      onConfirm: async () => {
        for (const item of queue) {
          await deleteDoc(doc(db, 'queue', item.id));
        }
        closeConfirm();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <nav className="bg-[#0F172A] text-white p-4 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Anchor className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight leading-none">Intermarítima</h1>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1">ETIQUETAS DE FERTILIZANTES</span>
            </div>
          </div>
          <div className="flex gap-1 bg-white/5 p-1 rounded-2xl">
            <button onClick={() => setView('queue')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'queue' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <ListOrdered size={18} /> <span className="hidden md:inline">Fila</span>
            </button>
            <button onClick={() => setView('generator')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'generator' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <Tag size={18} /> <span className="hidden md:inline">Gerador</span>
            </button>
            <button onClick={() => setView('inventory')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'inventory' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <Database size={18} /> <span className="hidden md:inline">Produtos</span>
            </button>
            <button onClick={() => setView('history')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'history' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <History size={18} /> <span className="hidden md:inline">Histórico</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 no-print">
        {view === 'queue' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black">Fila de Carregamento</h2>
                <p className="text-slate-500 font-bold">Importe e gerencie a ordem de carregamento dos veículos.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePdfImport} 
                  accept=".pdf" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isImporting ? <Clock className="animate-spin" size={20} /> : <FileUp size={20} />} 
                  IMPORTAR ORDEM (PDF)
                </button>
                <button 
                  onClick={clearQueue}
                  className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  <Trash2 size={20} /> LIMPAR FILA
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportador / Pedido</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto / Qtd</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <Reorder.Group axis="y" values={queue} onReorder={handleReorder} as="tbody">
                    {queue.length > 0 ? queue.map((item) => (
                      <Reorder.Item 
                        key={item.id} 
                        value={item} 
                        as="tr" 
                        className={`hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 ${item.status === 'completed' ? 'opacity-50 grayscale' : ''}`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <GripVertical className="text-slate-300 drag-handle" size={16} />
                             <span className="font-black text-slate-900">{item.order}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg">{item.placa}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm">{item.carrier}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">PEDIDO: {item.orderNumber}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase">{item.productName}</div>
                             <div className="text-xs font-bold text-slate-500">{item.quantity} TON</div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {item.status === 'pending' && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Pendente</span>}
                            {item.status === 'label_issued' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Etiqueta Emitida</span>}
                            {item.status === 'completed' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Concluído</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                             {item.status !== 'completed' && (
                               <button 
                                 onClick={() => handleGenerateFromQueue(item)}
                                 className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                               >
                                 <Tag size={14} /> GERAR
                               </button>
                             )}
                             
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                               <button 
                                 onClick={() => handleQueueStatusChange(item.id, 'label_issued')}
                                 title="Marcar Etiqueta Emitida"
                                 className={`p-2 rounded-lg transition-all ${item.status === 'label_issued' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                               >
                                 <Printer size={16} />
                               </button>
                               <button 
                                 onClick={() => handleQueueStatusChange(item.id, 'completed')}
                                 title="Marcar Saída Concluída"
                                 className={`p-2 rounded-lg transition-all ${item.status === 'completed' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                               >
                                 <Check size={16} />
                               </button>
                               <button 
                                 onClick={() => handleRemoveQueueItem(item.id)}
                                 title="Remover da Fila"
                                 className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                          </div>
                        </td>
                      </Reorder.Item>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-slate-300">
                             <Truck size={64} className="opacity-10" />
                             <p className="font-black uppercase tracking-widest text-sm">Fila Vazia. Importe um PDF para iniciar.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </Reorder.Group>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 animate-in slide-in-from-left duration-500">
              
              {/* Busca de Produto Compacta */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar Fertilizante (Nome ou Código)..." 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 pl-10 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                {searchQuery && (
                  <div className="mt-3 max-h-[250px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => { setSelectedProductId(p.id); setSearchQuery(''); }} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedProductId === p.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-50 hover:border-slate-200 bg-white'}`}>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-xs leading-none mb-1">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{p.code} • {p.nature}</p>
                        </div>
                        <ChevronRight className={selectedProductId === p.id ? 'text-emerald-500' : 'text-slate-300'} size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Configuração de Impressão</p>
                      <h3 className="text-xl md:text-2xl font-black">{selectedProduct.name}</h3>
                    </div>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase">{selectedProduct.code}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Lote <span className="text-red-500">*</span>
                      </label>
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 uppercase text-sm" value={session.lote} onChange={(e) => setSession({ ...session, lote: e.target.value.toUpperCase() })} placeholder="EX: 123/24" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Placa <span className="text-red-500">*</span>
                      </label>
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 uppercase text-sm" value={session.placa} onChange={(e) => setSession({ ...session, placa: e.target.value.toUpperCase() })} placeholder="ABC-1234" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Tonelagem <span className="text-red-500">*</span>
                      </label>
                      <input type="number" step="any" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={session.tonelada} onChange={(e) => setSession({ ...session, tonelada: e.target.value })} placeholder="Ex: 32" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Peso Unitário (kg) <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={session.peso} onChange={(e) => handlePesoChange(e.target.value)} placeholder="1.000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Data Fabricação <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" 
                        value={getDateValue(session.fabricacao)} 
                        onChange={(e) => handleDateChange('fabricacao', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Validade <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" 
                        value={getDateValue(session.validade)} 
                        onChange={(e) => handleDateChange('validade', e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Total de Etiquetas</p>
                      <div className="flex items-center gap-2.5">
                         <span className="text-2xl font-black">{labelQuantity}</span>
                         <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Unidades</span>
                      </div>
                    </div>
                    <Printer className="text-emerald-400" size={28} />
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <button onClick={handleReset} className="md:col-span-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 group text-sm">
                        <RotateCcw size={18} className="group-hover:rotate-[-45deg] transition-all" /> 
                        <span>LIMPAR</span>
                      </button>
                      <button onClick={handlePrintLabels} className="md:col-span-3 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 text-base">
                        <Printer size={22} /> IMPRIMIR ETIQUETAS
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-4 py-1">
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={saveToHistory} onChange={(e) => setSaveToHistory(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salvar no Histórico</span>
                       </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-6 sticky top-28 animate-in slide-in-from-right duration-500">
              
              {/* Dica de Impressão - Agora Acima da Etiqueta */}
              <div className="w-full max-w-[10.5cm] bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm no-print">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-700 shrink-0">
                   <Settings2 size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Dica de Impressão</p>
                   <p className="text-amber-800 text-[11px] font-bold leading-relaxed">
                     Para etiquetas perfeitas, no diálogo de impressão selecione as margens como <span className="underline font-black">"Nenhuma"</span> e escolha o tamanho do papel correspondente à etiqueta física.
                   </p>
                </div>
              </div>

              {selectedProduct ? (
                <div className="scale-[0.8] md:scale-[0.85] origin-top">
                  <LabelPreview product={selectedProduct} session={session} />
                </div>
              ) : (
                <div className="w-full max-w-[10.5cm] aspect-[10.5/16] border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                  <Tag size={64} className="mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-sm">Selecione um produto para visualizar a etiqueta</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Banco de Produtos</h2>
                <p className="text-slate-500 font-bold">Gerencie os fertilizantes cadastrados no sistema.</p>
              </div>
              <button onClick={() => { setEditingProduct(undefined); setIsProductModalOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95">
                <Plus size={20} /> NOVO PRODUTO
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-50 p-3 rounded-2xl font-black text-xs text-slate-500">{p.code}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-1 leading-tight">{p.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{p.nature}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(p.composition).filter(([_, v]) => v && v !== '0').map(([k, v]) => (
                        <div key={k} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{k}: {v}%</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black">Histórico de Emissões</h2>
                <p className="text-slate-500 font-bold">Gerencie e consulte todos os registros emitidos.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative group w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por Motorista, Placa, Lote..." 
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>

                <div className="flex bg-white border-2 border-slate-200 rounded-2xl p-1 shadow-sm">
                  <button 
                    onClick={() => setHistoryTermFilter('all')}
                    className={`px-4 py-3 rounded-xl text-xs font-black transition-all ${historyTermFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    TODOS
                  </button>
                  <button 
                    onClick={() => setHistoryTermFilter('with')}
                    className={`px-4 py-3 rounded-xl text-xs font-black transition-all ${historyTermFilter === 'with' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    COM TERMO
                  </button>
                  <button 
                    onClick={() => setHistoryTermFilter('without')}
                    className={`px-4 py-3 rounded-xl text-xs font-black transition-all ${historyTermFilter === 'without' ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    SEM TERMO
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto Emitido</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Transporte</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista / Transp</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                               <Clock size={18} />
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900">{record.timestamp?.toDate ? record.timestamp.toDate().toLocaleDateString('pt-BR') : '...'}</p>
                              <p className="text-[10px] text-slate-400 font-bold tracking-wider">{record.timestamp?.toDate ? record.timestamp.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '...'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm leading-none mb-1.5">{record.productName}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-tighter">
                              {record.productCode}
                            </span>
                            {record.productNature && (
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-tighter">
                                {record.productNature}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                             <div className="flex items-center gap-1.5">
                               <Tag size={12} className="text-slate-300" />
                               <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Lote: {record.lote}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                               <Truck size={12} className="text-slate-300" />
                               <span className="text-xs font-black text-slate-900 uppercase">{record.placa}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                               <Weight size={12} className="text-slate-400" />
                               <span className="text-xs font-black text-emerald-600 uppercase">{record.tonelada} TON</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {record.driverName ? (
                            <div className="space-y-1">
                               <p className="font-black text-slate-900 text-sm">{record.driverName}</p>
                               <div className="flex items-center gap-2">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                   <Database size={10} /> {record.carrier || 'TRANS. NÃO INF.'}
                                 </p>
                               </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase italic">Dados pendentes</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                           <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                                <FileText size={12} />
                                <span className="font-black text-[10px]">{record.labelsQuantity} ETIQ.</span>
                              </div>
                              {record.termGenerated ? (
                                <div className="flex items-center gap-1 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                                  <CheckCircle2 size={12} /> TERMO OK
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-300 font-black text-[9px] uppercase tracking-widest">
                                  <XCircle size={12} /> SEM TERMO
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-1.5">
                             <button 
                               onClick={(e) => handleLoadFromHistory(record, e)}
                               className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                               title="Carregar no Gerador"
                             >
                               <Copy size={16} />
                             </button>
                             <button 
                               onClick={(e) => handleHistoryPrintLabels(record, e)}
                               className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
                               title="Imprimir Etiquetas Novamente"
                             >
                               <Printer size={16} />
                             </button>
                             <button 
                               onClick={(e) => handleHistoryTerm(record, e)}
                               className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm group ${record.termGenerated ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                               title={record.termGenerated ? "Visualizar Termo" : "Gerar Termo"}
                             >
                               <Eye size={16} />
                             </button>
                             <button 
                               onClick={(e) => handleDeleteHistory(record.id, e)}
                               className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                               title="Excluir do Histórico"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ) ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-slate-300">
                             <Filter size={48} className="opacity-20" />
                             <p className="font-black uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE PRÉVIA DO TERMO COM ÁREA DE SCROLL MELHORADA */}
      {isPreviewTermOpen && withdrawalData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 no-print">
          <div className="relative bg-white md:rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl h-full md:h-[95vh] animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Toolbar Prévia - Sempre Visível */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white z-20 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <FileText size={24} />
                  </div>
                  <div className="hidden sm:block">
                    <h3 className="text-lg md:text-xl font-black">Conferência de Documento</h3>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Confira os dados antes de imprimir</p>
                  </div>
               </div>
               <div className="flex gap-2 md:gap-3">
                  <button 
                    onClick={() => { setIsPreviewTermOpen(false); setIsTermModalOpen(true); }}
                    className="px-4 md:px-6 py-2 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-all flex items-center gap-2 text-sm"
                  >
                    <Edit2 size={16} /> <span className="hidden xs:inline">CORRIGIR</span>
                  </button>
                  <button 
                    onClick={confirmAndPrintTerm}
                    className="px-5 md:px-8 py-2 md:py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95 text-sm"
                  >
                    <Printer size={18} /> IMPRIMIR AGORA
                  </button>
                  <button onClick={() => setIsPreviewTermOpen(false)} className="p-2 md:p-3 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
               </div>
            </div>

            {/* Document Area com Scroll Independente */}
            <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12 flex justify-center custom-scrollbar">
               <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] origin-top transform-gpu transition-transform mb-12">
                 {/* Ajustamos o componente para não ter margens externas excessivas na prévia */}
                 <div className="scale-[0.5] sm:scale-[0.7] md:scale-[0.8] lg:scale-[1.0] origin-top">
                    <WithdrawalTermPreview data={withdrawalData} />
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO PERSONALIZADO */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                 <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-lg ${
                    confirmDialog.variant === 'danger' ? 'bg-red-50 text-red-600 shadow-red-100' :
                    confirmDialog.variant === 'success' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                    'bg-blue-50 text-blue-600 shadow-blue-100'
                 }`}>
                    {confirmDialog.icon || <Info size={32} />}
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-3">{confirmDialog.title}</h3>
                 <p className="text-slate-500 font-bold leading-relaxed">{confirmDialog.message}</p>
              </div>
              <div className="p-4 bg-slate-50 flex flex-col gap-2">
                 <button 
                    onClick={confirmDialog.onConfirm}
                    className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${
                       confirmDialog.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
                       confirmDialog.variant === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' :
                       'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                    }`}
                 >
                    {confirmDialog.confirmLabel}
                 </button>
                 <button 
                    onClick={closeConfirm}
                    className="w-full py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all"
                 >
                    {confirmDialog.cancelLabel || 'CANCELAR'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showTermPrompt && !isTermModalOpen && !isPrintingTerm && !isPreviewTermOpen && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-8 duration-500 no-print">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><FileText size={24} /></div>
            <div>
              <h4 className="font-black text-lg leading-tight">Deseja gerar o Termo de Retirada?</h4>
              <p className="text-slate-400 text-sm font-medium">Isso irá atualizar o registro atual.</p>
            </div>
            <div className="flex gap-3 ml-4">
              <button onClick={() => setShowTermPrompt(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-white transition-colors">AGORA NÃO</button>
              <button onClick={() => setIsTermModalOpen(true)} className="px-8 py-3 bg-white text-slate-900 font-black rounded-2xl hover:bg-emerald-400 hover:text-white transition-all active:scale-95">GERAR TERMO</button>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && ( <ProductForm onSave={handleSaveProduct} onCancel={() => { setIsProductModalOpen(false); setEditingProduct(undefined); }} initialProduct={editingProduct} /> )}
      {isTermModalOpen && ( <WithdrawalTermForm labelQuantity={labelQuantity} initialTruckPlate={session.placa} initialData={withdrawalData} onSave={handleTermSave} onCancel={() => setIsTermModalOpen(false)} /> )}

      <div className="hidden print:block">
        {!isPrintingTerm && (selectedProduct || historyPrintRecord) && (
          <div className="flex flex-col items-center">
            {Array.from({ length: parseInt(historyPrintRecord ? historyPrintRecord.qty : labelQuantity) || 1 }).map((_, i) => (
              <div key={i} className="page-break">
                <LabelPreview 
                  product={historyPrintRecord ? historyPrintRecord.product : selectedProduct!} 
                  session={historyPrintRecord ? historyPrintRecord.session : session} 
                />
              </div>
            ))}
          </div>
        )}
        {isPrintingTerm && withdrawalData && ( <WithdrawalTermPreview data={withdrawalData} /> )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; break-after: page; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.3);
        }
      `}} />
    </div>
  );
};

export default App;
