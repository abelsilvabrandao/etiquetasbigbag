
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
  ChevronRight, Database, CheckCircle2, History, Clock, RotateCcw, Copy, Filter, XCircle, Truck, AlertTriangle, Info, X, Weight, Anchor, ListOrdered, FileUp, GripVertical, Check, ExternalLink, Calendar, Eye, Settings2, Save, FilePlus
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
  variant: 'danger' | 'primary' | 'success' | 'info';
  onConfirm: () => void;
  icon?: React.ReactNode;
  hideCancel?: boolean;
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [view, setView] = useState<AppView>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtros da Fila
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState<QueueItem['status'] | 'all'>('all');

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

  // Resetar o ID do log atual quando mudar lote ou placa para forçar nova verificação
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

  const showCustomAlert = (title: string, message: string, variant: ConfirmDialogConfig['variant'] = 'info', icon?: React.ReactNode) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: 'OK',
      hideCancel: true,
      variant,
      icon: icon || (variant === 'success' ? <CheckCircle2 size={32} /> : variant === 'danger' ? <XCircle size={32} /> : <Info size={32} />),
      onConfirm: closeConfirm
    });
  };

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

  const filteredQueue = useMemo(() => {
    return queue.filter(item => {
      const search = queueSearchQuery.toLowerCase();
      const matchesSearch = !search || 
        item.placa.toLowerCase().includes(search) ||
        item.carrier.toLowerCase().includes(search) ||
        item.productName.toLowerCase().includes(search) ||
        item.orderNumber.toLowerCase().includes(search);
      
      const matchesStatus = queueStatusFilter === 'all' || item.status === queueStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [queue, queueSearchQuery, queueStatusFilter]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleSaveProduct = async (product: Product) => {
    await setDoc(doc(db, 'products', product.id), product);
    setIsProductModalOpen(false);
    setEditingProduct(undefined);
    showCustomAlert('Sucesso', 'Produto salvo no banco de dados!', 'success');
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
      title: 'Imprimir Etiqueta',
      message: `Deseja imprimir a etiqueta para o lote ${record.lote}? Informe ${record.labelsQuantity} cópias na janela de impressão.`,
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
            qty: '1'
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
          showCustomAlert('Erro', 'Não foi possível excluir o registro.', 'danger');
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
            clientName: record.clientName || 'FERTIMAXI',
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

  const handleSaveToHistory = async () => {
    if (!selectedProduct || !session.lote || !session.placa) {
      showCustomAlert('Aviso', 'Selecione um produto e preencha Lote/Placa para salvar.', 'info');
      return;
    }

    const existingRecord = history.find(r => 
      r.lote === session.lote && 
      r.placa === session.placa && 
      r.productCode === selectedProduct.code
    );

    const performSave = async (idToUpdate?: string) => {
      const recordData = {
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        productNature: selectedProduct.nature,
        lote: session.lote,
        placa: session.placa,
        tonelada: session.tonelada,
        labelsQuantity: labelQuantity,
        timestamp: serverTimestamp(),
      };

      try {
        if (idToUpdate) {
          await updateDoc(doc(db, 'history', idToUpdate), recordData);
          setCurrentLogId(idToUpdate);
        } else {
          const docRef = await addDoc(collection(db, 'history'), {
            ...recordData,
            termGenerated: false
          });
          setCurrentLogId(docRef.id);
        }
        showCustomAlert('Sucesso', 'Registro sincronizado com sucesso no histórico!', 'success');
      } catch (err) {
        showCustomAlert('Erro', 'Houve uma falha ao tentar salvar o registro.', 'danger');
      }
    };

    setConfirmDialog({
      isOpen: true,
      title: existingRecord ? 'Atualizar Histórico' : 'Salvar no Histórico',
      message: existingRecord 
        ? `Já existe um registro para o lote ${session.lote}. Deseja salvar as alterações?`
        : `Deseja salvar os dados do lote ${session.lote} e placa ${session.placa} no histórico?`,
      confirmLabel: existingRecord ? 'ATUALIZAR' : 'SALVAR AGORA',
      variant: 'primary',
      icon: <Save size={24} />,
      onConfirm: () => {
        closeConfirm();
        performSave(existingRecord?.id);
      }
    });
  };

  const handlePrintLabels = () => {
    if (!selectedProduct) return;

    const missingFields = [];
    if (!session.lote) missingFields.push('Lote');
    if (!session.placa) missingFields.push('Placa');
    if (!session.tonelada) missingFields.push('Tonelagem');

    if (missingFields.length > 0) {
      showCustomAlert('Campos Faltando', `Preencha os seguintes campos: ${missingFields.join(', ')}`, 'info', <AlertTriangle size={32} />);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Impressão',
      message: `Informe ${labelQuantity} cópias na próxima janela de impressão. Confirmar?`,
      confirmLabel: 'ABRIR IMPRESSÃO',
      variant: 'success',
      icon: <Printer size={24} />,
      onConfirm: () => {
        setIsPrintingTerm(false);
        setPendingPrint('label');
        closeConfirm();
      }
    });
  };

  const handleTermSave = async (data: WithdrawalTermData) => {
    setWithdrawalData(data);
    
    if (currentLogId) {
      const docRef = doc(db, 'history', currentLogId);
      await updateDoc(docRef, {
        termGenerated: true,
        clientName: data.clientName,
        driverName: data.driverName,
        driverCpf: data.driverCpf,
        carrier: data.carrier,
        sealsQuantity: data.sealsQuantity,
        date: data.date,
        time: data.time
      });
    } else {
      const record: GenerationRecord = {
        timestamp: serverTimestamp(),
        productName: selectedProduct?.name || 'EMISSÃO AVULSA',
        productCode: selectedProduct?.code || 'AVULSO',
        lote: session.lote || 'AVULSO',
        placa: session.placa || data.truckPlate,
        tonelada: session.tonelada || '0',
        labelsQuantity: labelQuantity,
        termGenerated: true,
        ...data
      };
      const docRef = await addDoc(collection(db, 'history'), record);
      setCurrentLogId(docRef.id);
    }
    
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
          showCustomAlert('Sucesso', `${newItems.length} veículos importados com sucesso!`, 'success');
        } else {
          showCustomAlert('Aviso', 'Nenhum veículo identificado no padrão do PDF.', 'info');
        }
      } catch (error) {
        showCustomAlert('Erro', 'Falha ao processar o arquivo PDF.', 'danger');
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
      message: 'Deseja remover TODOS os itens da fila?',
      confirmLabel: 'LIMPAR AGORA',
      variant: 'danger',
      onConfirm: async () => {
        for (const item of queue) await deleteDoc(doc(db, 'queue', item.id));
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
            <button onClick={() => setView('terms')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'terms' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <FilePlus size={18} /> <span className="hidden md:inline">Termos</span>
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
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black">Fila de Carregamento</h2>
                <p className="text-slate-500 font-bold">Importe e gerencie a ordem de carregamento dos veículos.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                {/* Filtros da Fila */}
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar Placa, Produto ou Pedido..." 
                    value={queueSearchQuery} 
                    onChange={(e) => setQueueSearchQuery(e.target.value)} 
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-emerald-500 transition-all shadow-sm" 
                  />
                </div>
                <div className="flex bg-white border-2 border-slate-200 rounded-2xl p-1 shadow-sm">
                  {[
                    {id: 'all', label: 'TODOS'},
                    {id: 'pending', label: 'PENDENTES'},
                    {id: 'label_issued', label: 'ETIQUETADOS'},
                    {id: 'completed', label: 'CONCLUÍDOS'}
                  ].map(f => (
                    <button key={f.id} onClick={() => setQueueStatusFilter(f.id as any)} className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all ${queueStatusFilter === f.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePdfImport} accept=".pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50">
                  {isImporting ? <Clock className="animate-spin" size={20} /> : <FileUp size={20} />} <span className="hidden md:inline">IMPORTAR (PDF)</span>
                </button>
                <button onClick={clearQueue} className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95">
                  <Trash2 size={20} /> <span className="hidden md:inline">LIMPAR</span>
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
                  <Reorder.Group axis="y" values={filteredQueue} onReorder={handleReorder} as="tbody">
                    {filteredQueue.length > 0 ? filteredQueue.map((item) => (
                      <Reorder.Item key={item.id} value={item} as="tr" className={`hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 ${item.status === 'completed' ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <GripVertical className="text-slate-300 drag-handle" size={16} />
                             <span className="font-black text-slate-900">{item.order}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5"><span className="font-black text-slate-900 text-lg">{item.placa}</span></td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm">{item.carrier}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PEDIDO: {item.orderNumber}</p>
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
                               <button onClick={() => handleGenerateFromQueue(item)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100">
                                 <Tag size={14} /> GERAR
                               </button>
                             )}
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                               <button onClick={() => handleQueueStatusChange(item.id, 'label_issued')} className={`p-2 rounded-lg transition-all ${item.status === 'label_issued' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}><Printer size={16} /></button>
                               <button onClick={() => handleQueueStatusChange(item.id, 'completed')} className={`p-2 rounded-lg transition-all ${item.status === 'completed' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}><Check size={16} /></button>
                               <button onClick={() => handleRemoveQueueItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-all"><X size={16} /></button>
                             </div>
                          </div>
                        </td>
                      </Reorder.Item>
                    )) : (
                      <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Nenhum veículo encontrado</td></tr>
                    )}
                  </Reorder.Group>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'terms' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 text-center">
            <div className="bg-white rounded-3xl p-12 shadow-2xl border border-slate-100 max-w-lg w-full">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FilePlus size={40} />
              </div>
              <h2 className="text-2xl font-black mb-3">Emissão de Termo Avulso</h2>
              <p className="text-slate-500 font-bold mb-8">
                Gere termos avulsos para carregamentos externos (CIBRA, etc) de forma independente do sistema de etiquetas.
              </p>
              <button 
                onClick={() => {
                  setCurrentLogId(null);
                  setWithdrawalData(null);
                  setIsTermModalOpen(true);
                }} 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-100 text-lg"
              >
                <Plus size={24} /> GERAR NOVO TERMO
              </button>
              <div className="mt-8 pt-8 border-t border-slate-50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clientes Suportados</p>
                 <div className="flex items-center justify-center gap-4 mt-4 opacity-50 grayscale">
                    <span className="text-xs font-black">FERTIMAXI</span>
                    <span className="text-xs font-black">CIBRA</span>
                    <span className="text-xs font-black">OUTROS</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 animate-in slide-in-from-left duration-500">
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                <div className="relative">
                  <input type="text" placeholder="Buscar Fertilizante (Nome ou Código)..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 pl-10 text-sm font-bold outline-none focus:border-emerald-500 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lote <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" 
                        value={session.lote} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            setSession({ ...session, lote: val });
                          }
                        }} 
                        placeholder="Ex: 00011999" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa <span className="text-red-500">*</span></label>
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 uppercase text-sm" value={session.placa} onChange={(e) => setSession({ ...session, placa: e.target.value.toUpperCase() })} placeholder="ABC-1234" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tonelagem <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" 
                        value={session.tonelada} 
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setSession({ ...session, tonelada: e.target.value });
                          }
                        }} 
                        placeholder="Ex: 32" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso Unitário (kg)</label>
                      <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={session.peso} onChange={(e) => handlePesoChange(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Fabricação</label>
                      <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={getDateValue(session.fabricacao)} onChange={(e) => handleDateChange('fabricacao', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validade</label>
                      <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={getDateValue(session.validade)} onChange={(e) => handleDateChange('validade', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                    <button onClick={handleReset} className="md:col-span-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
                      <RotateCcw size={18} /> LIMPAR
                    </button>
                    
                    <button onClick={handleSaveToHistory} className="md:col-span-3 py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 text-base">
                      <Save size={20} /> SALVAR NO HISTÓRICO
                    </button>

                    <button onClick={handlePrintLabels} className="md:col-span-4 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 text-xl">
                      <Printer size={24} /> IMPRIMIR ETIQUETAS
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-6 sticky top-28 animate-in slide-in-from-right duration-500">
              {selectedProduct ? (
                <>
                  <div className="w-full bg-slate-900 rounded-3xl p-5 text-white flex items-center justify-between shadow-2xl shadow-slate-200 relative overflow-hidden group">
                    <div className="relative z-10 shrink-0">
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Sugestão de Cópias</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-emerald-400">{labelQuantity}</span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unids</span>
                      </div>
                    </div>

                    <div className="flex-1 px-4 text-center relative z-10 hidden md:flex flex-col items-center">
                       <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl max-w-[220px]">
                          <Info className="text-amber-400 shrink-0" size={14} />
                          <p className="text-amber-100 text-[8px] font-bold uppercase leading-[1.3] tracking-wide text-left">
                            Informe o número {labelQuantity} no campo "Cópias" da próxima tela de impressão.
                          </p>
                       </div>
                    </div>

                    <div className="relative z-10 shrink-0">
                      <div className="p-3 bg-white/5 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                        <Printer size={32} />
                      </div>
                    </div>

                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  </div>

                  <div className="scale-[0.8] md:scale-[0.85] origin-top">
                    <LabelPreview product={selectedProduct} session={session} />
                  </div>
                </>
              ) : (
                <div className="w-full max-w-[10.5cm] aspect-[10.5/16] border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                  <Tag size={64} className="mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-sm">Selecione um produto para visualizar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-3xl font-black">Banco de Produtos</h2>
              <button onClick={() => { setEditingProduct(undefined); setIsProductModalOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95">
                <Plus size={20} /> NOVO PRODUTO
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                  {/* Decoração de fundo */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-[100%] pointer-events-none opacity-50"></div>
                  
                  <div className="flex flex-col lg:flex-row gap-10">
                    {/* Coluna de Identificação */}
                    <div className="lg:w-1/3 space-y-6">
                      <div className="flex items-center gap-3">
                         <div className="bg-slate-900 text-white px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest">{p.code}</div>
                         <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{p.nature}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors uppercase">{p.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.category}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Registro MAPA</span>
                           <span className="font-bold text-slate-700 text-xs">{p.mapaReg}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Aplicação</span>
                           <span className="font-bold text-slate-700 text-xs uppercase">{p.application}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"><Edit2 size={14} /> EDITAR</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    {/* Coluna de Garantias (Grades Técnicas) */}
                    <div className="lg:w-2/3 flex flex-col gap-6">
                       {/* Seção NPK */}
                       <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Macronutrientes Primários</h4>
                         <div className="grid grid-cols-4 border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                           <div className="bg-slate-50 border-r border-slate-100 p-4 text-center">
                              <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">% N TOTAL</span>
                              <span className="text-xl font-black text-slate-900">{p.composition.nTotal || '0'}</span>
                           </div>
                           <div className="bg-white border-r border-slate-100 p-4 text-center">
                              <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">% P₂O₅ (CNA)</span>
                              <span className="text-xl font-black text-slate-900">{p.composition.p2o5Cna || '0'}</span>
                           </div>
                           <div className="bg-white border-r border-slate-100 p-4 text-center">
                              <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">% P₂O₅ (SOL)</span>
                              <span className="text-xl font-black text-slate-900">{p.composition.p2o5Sol || '0'}</span>
                           </div>
                           <div className="bg-slate-50 p-4 text-center">
                              <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">% K₂O (SOL)</span>
                              <span className="text-xl font-black text-slate-900">{p.composition.k2oSol || '0'}</span>
                           </div>
                         </div>
                       </div>

                       {/* Seção Micros e Outros */}
                       <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Micronutrientes e Adicionais</h4>
                         <div className="grid grid-cols-7 border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                           {[
                             {label: '% S', value: p.composition.s},
                             {label: '% Ca', value: p.composition.ca},
                             {label: '% B', value: p.composition.b},
                             {label: '% Cu', value: p.composition.cu},
                             {label: '% Mn', value: p.composition.mn},
                             {label: '% Zn', value: p.composition.zn},
                             {label: '% NBPT', value: p.composition.nbpt},
                           ].map((item, idx) => (
                             <div key={idx} className={`p-4 text-center border-r border-slate-100 last:border-0 ${item.value && item.value !== '0' ? 'bg-emerald-50/30' : 'bg-white'}`}>
                               <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">{item.label}</span>
                               <span className={`text-sm font-black ${item.value && item.value !== '0' ? 'text-emerald-700' : 'text-slate-300'}`}>
                                 {item.value || '-'}
                               </span>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <h2 className="text-3xl font-black">Histórico de Emissões</h2>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Filtrar Histórico..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex bg-white border-2 border-slate-200 rounded-2xl p-1 shadow-sm">
                  {['all', 'with', 'without'].map(f => (
                    <button key={f} onClick={() => setHistoryTermFilter(f as any)} className={`px-4 py-3 rounded-xl text-xs font-black transition-all ${historyTermFilter === f ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
                      {f === 'all' ? 'TODOS' : f === 'with' ? 'COM TERMO' : 'SEM TERMO'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto / Cliente</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lote/Placa</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-black text-sm">{record.timestamp?.toDate?.().toLocaleDateString('pt-BR') || '...'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{record.timestamp?.toDate?.().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) || '...'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm">{record.productName}</p>
                          <div className="flex gap-1 items-center mt-1">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 rounded">{record.productCode}</span>
                            {record.clientName && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 rounded">{record.clientName}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">LOTE: {record.lote}</span>
                            <span className="text-xs font-black text-slate-900 uppercase">{record.placa}</span>
                            <span className="text-[10px] font-black text-emerald-600">{record.tonelada} TON</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm">{record.driverName || 'SEM TERMO'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{record.carrier || '-'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-1.5">
                             <button onClick={(e) => handleLoadFromHistory(record, e)} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Copy size={16} /></button>
                             <button onClick={(e) => handleHistoryPrintLabels(record, e)} className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Printer size={16} /></button>
                             <button onClick={(e) => handleHistoryTerm(record, e)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${record.termGenerated ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-slate-100 text-slate-400'}`}><Eye size={16} /></button>
                             <button onClick={(e) => handleDeleteHistory(record.id, e)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ) ) : (
                      <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest">Histórico Vazio</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE PRÉVIA DO TERMO */}
      {isPreviewTermOpen && withdrawalData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 no-print">
          <div className="relative bg-white md:rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl h-full md:h-[95vh] overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white z-20 shrink-0">
               <h3 className="text-xl font-black">Conferência de Documento</h3>
               <div className="flex gap-2">
                  <button onClick={() => { setIsPreviewTermOpen(false); setIsTermModalOpen(true); }} className="px-4 py-2 bg-slate-100 text-slate-700 font-black rounded-xl text-sm">CORRIGIR</button>
                  <button onClick={confirmAndPrintTerm} className="px-6 py-2 bg-emerald-500 text-white font-black rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-200">
                    <Printer size={18} /> IMPRIMIR AGORA
                  </button>
                  <button onClick={() => setIsPreviewTermOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 md:p-12 flex justify-center custom-scrollbar">
               <div className="bg-white shadow-2xl scale-[0.5] sm:scale-[0.7] md:scale-[1.0] origin-top mb-12">
                  <WithdrawalTermPreview data={withdrawalData} />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO / ALERTAS CUSTOMIZADOS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="p-8 text-center">
                 <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${
                    confirmDialog.variant === 'danger' ? 'bg-red-50 text-red-600' : 
                    confirmDialog.variant === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                    confirmDialog.variant === 'info' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-slate-50 text-slate-600'
                 }`}>
                    {confirmDialog.icon || <Info size={32} />}
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-3">{confirmDialog.title}</h3>
                 <p className="text-slate-500 font-bold leading-relaxed">{confirmDialog.message}</p>
              </div>
              <div className="p-4 bg-slate-50 flex flex-col gap-2">
                 <button onClick={confirmDialog.onConfirm} className={`w-full py-4 rounded-2xl font-black text-white transition-all active:scale-[0.98] ${
                    confirmDialog.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 
                    confirmDialog.variant === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                    confirmDialog.variant === 'info' ? 'bg-emerald-500 hover:bg-emerald-600' :
                    'bg-slate-900 hover:bg-slate-800'
                 }`}>{confirmDialog.confirmLabel}</button>
                 {!confirmDialog.hideCancel && (
                    <button onClick={closeConfirm} className="w-full py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all">CANCELAR</button>
                 )}
              </div>
           </div>
        </div>
      )}

      {showTermPrompt && !isTermModalOpen && !isPrintingTerm && !isPreviewTermOpen && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-8 duration-500 no-print">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
            <div>
              <h4 className="font-black text-lg">Deseja gerar o Termo de Retirada?</h4>
              <p className="text-slate-400 text-sm">Vincule os dados do motorista ao registro.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTermPrompt(false)} className="px-6 py-3 font-bold text-slate-400">NÃO</button>
              <button onClick={() => setIsTermModalOpen(true)} className="px-8 py-3 bg-white text-slate-900 font-black rounded-2xl">SIM, GERAR</button>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && ( <ProductForm onSave={handleSaveProduct} onCancel={() => { setIsProductModalOpen(false); setEditingProduct(undefined); }} initialProduct={editingProduct} /> )}
      {isTermModalOpen && ( <WithdrawalTermForm labelQuantity={labelQuantity} initialTruckPlate={session.placa} initialData={withdrawalData} onSave={handleTermSave} onCancel={() => setIsTermModalOpen(false)} /> )}

      <div className="hidden print:block">
        {!isPrintingTerm && (selectedProduct || historyPrintRecord) && (
          <div className="flex flex-col items-center">
            {/* Imprime apenas uma etiqueta; o usuário escolhe a quantidade na janela de impressão */}
            <div className="page-break">
              <LabelPreview product={historyPrintRecord ? historyPrintRecord.product : selectedProduct!} session={historyPrintRecord ? historyPrintRecord.session : session} />
            </div>
          </div>
        )}
        {isPrintingTerm && withdrawalData && ( <WithdrawalTermPreview data={withdrawalData} /> )}
      </div>
    </div>
  );
};

export default App;
