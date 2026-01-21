
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
  limit,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  Search, Plus, Trash2, Printer, Edit2, Tag, FileText, 
  ChevronRight, Database, CheckCircle2, History, Clock, RotateCcw, Copy, AlertTriangle, Info, X, Anchor, ListOrdered, FileUp, GripVertical, Check, Eye, Save, FilePlus, FlaskConical, ClipboardCheck, XCircle, FileDown, Filter, LayoutDashboard, BarChart3, PieChart, TrendingUp
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

declare const pdfjsLib: any;
declare const XLSX: any;

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
  const [view, setView] = useState<AppView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState<QueueItem['status'] | 'all'>('all');

  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTermFilter, setHistoryTermFilter] = useState<'all' | 'with' | 'without'>('all');
  const [historyClientFilter, setHistoryClientFilter] = useState<'all' | 'FERTIMAXI' | 'CIBRA'>('all');

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  const [labelQuantity, setLabelQuantity] = useState('1');
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
    const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'), limit(150));
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

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  useEffect(() => {
    if (session.tonelada && selectedProduct) {
      const tonStr = session.tonelada.replace(/\./g, '').replace(',', '.');
      const tonVal = parseFloat(tonStr);
      if (!isNaN(tonVal)) {
        if (selectedProduct.clientName === 'CIBRA') {
           setLabelQuantity(Math.max(1, Math.ceil(tonVal / 1000)).toString());
        } else {
           const decimalPart = tonVal % 1;
           let rounded = decimalPart <= 0.5 ? Math.floor(tonVal) : Math.ceil(tonVal);
           setLabelQuantity(Math.max(1, rounded).toString());
        }
      }
    }
  }, [session.tonelada, selectedProduct]);

  useEffect(() => {
    if (pendingPrint) {
      const timer = setTimeout(() => {
        window.print();
        if (pendingPrint === 'term') {
          setIsPrintingTerm(false);
          setWithdrawalData(null);
          setIsPreviewTermOpen(false);
        } else if (pendingPrint === 'label') {
          if (historyPrintRecord) setHistoryPrintRecord(null);
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
        (record.carrier && record.carrier.toLowerCase().includes(search)) ||
        (record.orderNumber && record.orderNumber.toLowerCase().includes(search));

      const matchesTerm = historyTermFilter === 'all' || 
        (historyTermFilter === 'with' && record.termGenerated) ||
        (historyTermFilter === 'without' && !record.termGenerated);
      
      const matchesClient = historyClientFilter === 'all' || record.clientName === historyClientFilter;

      return matchesSearch && matchesTerm && matchesClient;
    });
  }, [history, historySearchQuery, historyTermFilter, historyClientFilter]);

  const termsHistory = useMemo(() => {
    return history.filter(record => {
      const search = historySearchQuery.toLowerCase();
      const matchesSearch = !search || 
        record.placa.toLowerCase().includes(search) ||
        (record.driverName && record.driverName.toLowerCase().includes(search)) ||
        (record.carrier && record.carrier.toLowerCase().includes(search));
      
      return matchesSearch && record.termGenerated;
    });
  }, [history, historySearchQuery]);

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

  const calculateLabelsFromQueueItem = (item: QueueItem): number => {
    const matchingProduct = products.find(p => 
      item.productName.toUpperCase().includes(p.name.toUpperCase()) ||
      p.name.toUpperCase().includes(item.productName.toUpperCase())
    );

    const isCibra = matchingProduct?.clientName === 'CIBRA';
    const qtyStr = item.quantity.replace(/\./g, '').replace(',', '.');
    const qtyVal = parseFloat(qtyStr);

    if (isNaN(qtyVal)) return 0;

    if (isCibra) {
      // Para CIBRA, quantity é KG total → 1000 KG por etiqueta
      return Math.max(1, Math.ceil(qtyVal / 1000));
    }

    // Para demais clientes, quantity é TON → arredondamento igual ao gerador
    const decimalPart = qtyVal % 1;
    const rounded = decimalPart <= 0.5 ? Math.floor(qtyVal) : Math.ceil(qtyVal);
    return Math.max(1, rounded);
  };

  const stats = useMemo(() => {
    const pendingLabels = queue
      .filter(q => !q.labelIssued && q.status !== 'completed')
      .reduce((sum, item) => sum + calculateLabelsFromQueueItem(item), 0);
    const pendingTerms = queue.filter(q => !q.termIssued && q.status !== 'completed').length;
    const completedLoadings = queue.filter(q => q.status === 'completed').length;

    const labelsFertimaxi = history
      .filter(h => h.clientName === 'FERTIMAXI' && h.labelGenerated)
      .reduce((sum, h) => sum + (parseInt((h.labelsQuantity || '1').replace(/\D/g, ''), 10) || 1), 0);

    const labelsCibra = history
      .filter(h => h.clientName === 'CIBRA' && h.labelGenerated)
      .reduce((sum, h) => sum + (parseInt((h.labelsQuantity || '1').replace(/\D/g, ''), 10) || 1), 0);
    
    const totalVehicles = queue.length;
    const readyPercentage = totalVehicles > 0 
      ? Math.round((queue.filter(q => q.labelIssued && q.termIssued).length / totalVehicles) * 100) 
      : 0;

    return {
      pendingLabels,
      pendingTerms,
      completedLoadings,
      labelsFertimaxi,
      labelsCibra,
      totalVehicles,
      readyPercentage
    };
  }, [queue, history, products]);

  const importTimestamp = useMemo(() => {
    if (queue.length === 0) return null;
    return queue[0].importedAt || null;
  }, [queue]);

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
        } else {
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
      onConfirm: async () => {
        const product = products.find(p => p.code === record.productCode || p.name === record.productName);
        if (product) {
          await updateDoc(doc(db, 'history', record.id!), { labelGenerated: true });
          
          setHistoryPrintRecord({
            product,
            session: {
              lote: record.lote,
              placa: record.placa,
              tonelada: record.tonelada,
              fabricacao: '',
              validade: '',
              peso: product.clientName === 'CIBRA' ? '1000' : '1.000'
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
        hasSeals: !!record.sealsQuantity && record.sealsQuantity !== '0',
        sampleLabelDelivered: record.sampleLabelDelivered,
        orderNumber: record.orderNumber || '',
        lote: record.lote
      });
      setIsPreviewTermOpen(true);
    } else {
      setCurrentLogId(record.id || null);
      setLabelQuantity(record.labelsQuantity);
      setSession(prev => ({ ...prev, placa: record.placa, lote: record.lote }));
      setWithdrawalData(null);
      setIsTermModalOpen(true);
    }
  };

  const handleSaveToHistory = async () => {
    if (!selectedProduct || !session.lote || !session.placa) {
      showCustomAlert('Aviso', 'Selecione um produto e preencha Lote/Placa para salvar.', 'info');
      return;
    }

    const q = query(collection(db, 'history'), where('placa', '==', session.placa), where('lote', '==', session.lote));
    const snap = await getDocs(q);
    const existingRecord = !snap.empty ? snap.docs[0] : null;

    const performSave = async (docId?: string) => {
      const queueItem = queue.find(q => q.placa === session.placa);
      const recordData = {
        productName: selectedProduct.name || "",
        productCode: selectedProduct.code || "",
        productNature: selectedProduct.nature || "",
        clientName: selectedProduct.clientName || "FERTIMAXI",
        lote: session.lote || "",
        placa: session.placa || "",
        tonelada: session.tonelada || "",
        labelsQuantity: labelQuantity || "1",
        timestamp: serverTimestamp(),
        orderNumber: queueItem?.orderNumber || ""
      };

      try {
        if (docId) {
          await updateDoc(doc(db, 'history', docId), recordData);
          setCurrentLogId(docId);
        } else {
          const docRef = await addDoc(collection(db, 'history'), {
            ...recordData,
            termGenerated: false,
            labelGenerated: false,
            sampleLabelDelivered: false
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

  const handlePrintLabels = async () => {
    if (!selectedProduct) return;

    const missingFields = [];
    if (!session.lote) missingFields.push('Lote');
    if (!session.placa) missingFields.push('Placa');
    if (!session.tonelada) missingFields.push(selectedProduct.clientName === 'CIBRA' ? 'Peso Total (KG)' : 'Tonelagem');

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
      onConfirm: async () => {
        const queueItem = queue.find(q => q.placa === session.placa);
        if (queueItem) {
          await updateDoc(doc(db, 'queue', queueItem.id), { labelIssued: true, status: 'label_issued' });
        }

        const q = query(collection(db, 'history'), where('placa', '==', session.placa), where('lote', '==', session.lote));
        const snap = await getDocs(q);
        const logId = !snap.empty ? snap.docs[0].id : null;

        if (logId) {
          await updateDoc(doc(db, 'history', logId), { labelGenerated: true });
        } else {
          const recordData = {
            productName: selectedProduct.name || "",
            productCode: selectedProduct.code || "",
            productNature: selectedProduct.nature || "",
            clientName: selectedProduct.clientName || "FERTIMAXI",
            lote: session.lote || "",
            placa: session.placa || "",
            tonelada: session.tonelada || "",
            labelsQuantity: labelQuantity || "1",
            timestamp: serverTimestamp(),
            labelGenerated: true,
            termGenerated: false,
            sampleLabelDelivered: queueItem?.sampleLabelDelivered || false,
            orderNumber: queueItem?.orderNumber || ""
          };
          await addDoc(collection(db, 'history'), recordData);
        }

        setIsPrintingTerm(false);
        setPendingPrint('label');
        closeConfirm();
      }
    });
  };

  const handleTermSave = async (data: WithdrawalTermData) => {
    setWithdrawalData(data);
    
    const queueItem = queue.find(q => q.placa === data.truckPlate);
    if (queueItem) {
      await updateDoc(doc(db, 'queue', queueItem.id), { termIssued: true });
    }

    const q = query(collection(db, 'history'), where('placa', '==', data.truckPlate));
    const snap = await getDocs(q);
    const existingId = !snap.empty ? snap.docs[0].id : null;

    if (existingId) {
      await updateDoc(doc(db, 'history', existingId), {
        termGenerated: true,
        clientName: data.clientName || "FERTIMAXI",
        driverName: data.driverName || "",
        driverCpf: data.driverCpf || "",
        carrier: data.carrier || "",
        sealsQuantity: data.sealsQuantity || "0",
        date: data.date || "",
        time: data.time || "",
        sampleLabelDelivered: data.sampleLabelDelivered || false,
        orderNumber: data.orderNumber || "",
        lote: data.lote || session.lote || "AVULSO"
      });
    } else {
      const record: GenerationRecord = {
        timestamp: serverTimestamp(),
        productName: selectedProduct?.name || 'EMISSÃO AVULSA',
        productCode: selectedProduct?.code || 'AVULSO',
        clientName: selectedProduct?.clientName || data.clientName || 'FERTIMAXI',
        lote: data.lote || session.lote || 'AVULSO',
        placa: session.placa || data.truckPlate,
        tonelada: session.tonelada || '0',
        labelsQuantity: labelQuantity || "1",
        termGenerated: true,
        labelGenerated: queueItem?.labelIssued || false,
        driverName: data.driverName || "",
        driverCpf: data.driverCpf || "",
        carrier: data.carrier || "",
        sealsQuantity: data.sealsQuantity || "0",
        date: data.date || "",
        time: data.time || "",
        sampleLabelDelivered: data.sampleLabelDelivered || false,
        orderNumber: data.orderNumber || ""
      };
      await addDoc(collection(db, 'history'), record);
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

  const handleToneladaChange = (value: string) => {
    if (selectedProduct?.clientName === 'CIBRA') {
      const numeric = value.replace(/\D/g, '');
      if (!numeric) {
        setSession(prev => ({ ...prev, tonelada: '' }));
        return;
      }
      const formatted = parseInt(numeric, 10).toLocaleString('pt-BR');
      setSession(prev => ({ ...prev, tonelada: formatted }));
    } else {
      setSession(prev => ({ ...prev, tonelada: value }));
    }
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
        const now = new Date().toLocaleString('pt-BR');
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
            status: 'pending',
            labelIssued: false,
            termIssued: false,
            sampleLabelDelivered: false,
            importedAt: now
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

  const handleToggleSampleLabel = async (id: string, currentStatus: boolean, placa: string) => {
    await updateDoc(doc(db, 'queue', id), { sampleLabelDelivered: !currentStatus });
    
    const historyRef = collection(db, 'history');
    const q = query(historyRef, where('placa', '==', placa));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docSnap) => {
      await updateDoc(doc(db, 'history', docSnap.id), { sampleLabelDelivered: !currentStatus });
    });
  };

  const handleToggleHistorySampleLabel = async (id: string | undefined, currentStatus: boolean, placa: string) => {
    if (!id) return;
    await updateDoc(doc(db, 'history', id), { sampleLabelDelivered: !currentStatus });
    
    const queueRef = collection(db, 'queue');
    const q = query(queueRef, where('placa', '==', placa));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docSnap) => {
      await updateDoc(doc(db, 'queue', docSnap.id), { sampleLabelDelivered: !currentStatus });
    });
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
      tonelada: matchingProduct?.clientName === 'CIBRA' ? item.quantity.replace(/\./g, '').replace(',', '') : item.quantity,
      lote: '',
      peso: matchingProduct?.clientName === 'CIBRA' ? '1000' : '1.000'
    }));
    
    if (matchingProduct?.clientName === 'CIBRA') {
      const numeric = item.quantity.replace(/\D/g, '');
      const formatted = parseInt(numeric, 10).toLocaleString('pt-BR');
      setSession(prev => ({ ...prev, tonelada: formatted }));
    }

    setView('generator');
  };

  const handleGenerateTermFromQueue = (item: QueueItem) => {
    setCurrentLogId(null);
    setSession(prev => ({
      ...prev,
      placa: item.placa,
      tonelada: item.quantity,
      lote: "AVULSO"
    }));
    
    const tonVal = parseFloat(item.quantity.replace(/\./g, '').replace(',', '.'));
    let suggestQty = '1';
    if (!isNaN(tonVal)) {
      suggestQty = Math.max(1, tonVal % 1 <= 0.5 ? Math.floor(tonVal) : Math.ceil(tonVal)).toString();
    }
    setLabelQuantity(suggestQty);

    setWithdrawalData({
      clientName: 'FERTIMAXI',
      driverName: '',
      driverCpf: '',
      carrier: item.carrier,
      truckPlate: item.placa,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      sealsQuantity: suggestQty,
      labelsQuantity: suggestQty,
      hasSeals: true,
      sampleLabelDelivered: item.sampleLabelDelivered || false,
      orderNumber: item.orderNumber,
      lote: "AVULSO"
    });
    
    setIsTermModalOpen(true);
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

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  };

  const handleExportQueue = () => {
    const dataToExport = filteredQueue.map(item => ({
      'Ordem': item.order,
      'Placa': item.placa,
      'Transportadora': item.carrier,
      'Produto': item.productName,
      'Quantidade (TON/KG)': item.quantity,
      'Pedido': item.orderNumber,
      'Status': item.status === 'completed' ? 'Concluído' : item.status === 'label_issued' ? 'Etiqueta Emitida' : 'Pendente',
      'Etiqueta Emitida': item.labelIssued ? 'Sim' : 'Não',
      'Termo Emitido': item.termIssued ? 'Sim' : 'Não',
      'Amostra Entregue': item.sampleLabelDelivered ? 'Sim' : 'Não'
    }));
    exportToExcel(dataToExport, 'fila_carregamento');
  };

  const handleExportTerms = () => {
    const dataToExport = termsHistory.map(record => ({
      'Data': record.date || record.timestamp?.toDate?.().toLocaleDateString('pt-BR'),
      'Hora': record.time || record.timestamp?.toDate?.().toLocaleTimeString('pt-BR'),
      'Cliente': record.clientName,
      'Motorista': record.driverName,
      'CPF': record.driverCpf,
      'Transportadora': record.carrier,
      'Placa': record.placa,
      'Produto': record.productName,
      'Lote': record.lote,
      'Pedido': record.orderNumber,
      'Etiqueta Emitida': record.labelGenerated ? 'Sim' : 'Não',
      'Amostra Entregue': record.sampleLabelDelivered ? 'Sim' : 'Não'
    }));
    exportToExcel(dataToExport, 'gestao_termos');
  };

  const handleExportHistory = () => {
    const dataToExport = filteredHistory.map(record => ({
      'Data': record.timestamp?.toDate?.().toLocaleDateString('pt-BR'),
      'Hora': record.timestamp?.toDate?.().toLocaleTimeString('pt-BR'),
      'Cliente': record.clientName,
      'Produto': record.productName,
      'Placa': record.placa,
      'Lote': record.lote,
      'Pedido': record.orderNumber || '-',
      'Etiqueta Gerada': record.labelGenerated ? 'Sim' : 'Não',
      'Termo Gerado': record.termGenerated ? 'Sim' : 'Não',
      'Amostra': record.sampleLabelDelivered ? 'Sim' : 'Não'
    }));
    exportToExcel(dataToExport, 'historico_completo');
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
          <div className="flex gap-1 bg-white/5 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shrink-0 ${view === 'dashboard' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <LayoutDashboard size={18} /> <span className="hidden md:inline">Dash</span>
            </button>
            <button onClick={() => setView('queue')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shrink-0 ${view === 'queue' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <ListOrdered size={18} /> <span className="hidden md:inline">Fila</span>
            </button>
            <button onClick={() => setView('generator')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shrink-0 ${view === 'generator' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <Tag size={18} /> <span className="hidden md:inline">Gerador</span>
            </button>
            <button onClick={() => setView('terms')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shrink-0 ${view === 'terms' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <FilePlus size={18} /> <span className="hidden md:inline">Termos</span>
            </button>
            <button onClick={() => setView('inventory')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shrink-0 ${view === 'inventory' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <Database size={18} /> <span className="hidden md:inline">Produtos</span>
            </button>
            <button onClick={() => setView('history')} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shrink-0 ${view === 'history' ? 'bg-emerald-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <History size={18} /> <span className="hidden md:inline">Histórico</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 no-print">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black">Dashboard Logístico</h2>
                <p className="text-slate-500 font-bold">Monitoramento de performance e prontidão da unidade.</p>
             </div>

             {/* KPIs Rápidos */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
                      <Tag size={28} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiquetas Pendentes</p>
                      <h4 className="text-3xl font-black text-slate-900 leading-none mt-1">{stats.pendingLabels}</h4>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                      <FileText size={28} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Termos Pendentes</p>
                      <h4 className="text-3xl font-black text-slate-900 leading-none mt-1">{stats.pendingTerms}</h4>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                      <CheckCircle2 size={28} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Concluídos (Fila)</p>
                      <h4 className="text-3xl font-black text-slate-900 leading-none mt-1">{stats.completedLoadings}</h4>
                   </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex items-center gap-5 overflow-hidden relative">
                   <div className="w-14 h-14 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center shadow-inner z-10">
                      <TrendingUp size={28} />
                   </div>
                   <div className="z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prontidão da Fila</p>
                      <h4 className="text-3xl font-black text-white leading-none mt-1">{stats.readyPercentage}%</h4>
                   </div>
                   <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 rounded-full translate-x-12 translate-y-12 blur-2xl"></div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribuição por Cliente */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-3">
                         <BarChart3 className="text-emerald-500" /> Emissões por Cliente
                      </h3>
                      <PieChart size={20} className="text-slate-300" />
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                            <span className="text-emerald-600">FERTIMAXI</span>
                            <span className="text-slate-900">{stats.labelsFertimaxi} etiquetas</span>
                         </div>
                         <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                            <motion.div 
                               initial={{ width: 0 }} 
                               animate={{ width: `${(stats.labelsFertimaxi / (stats.labelsFertimaxi + stats.labelsCibra || 1)) * 100}%` }}
                               className="h-full bg-emerald-500 rounded-full"
                            ></motion.div>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                            <span className="text-blue-600">CIBRA</span>
                            <span className="text-slate-900">{stats.labelsCibra} etiquetas</span>
                         </div>
                         <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                            <motion.div 
                               initial={{ width: 0 }} 
                               animate={{ width: `${(stats.labelsCibra / (stats.labelsFertimaxi + stats.labelsCibra || 1)) * 100}%` }}
                               className="h-full bg-blue-500 rounded-full"
                            ></motion.div>
                         </div>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Total Acumulado</p>
                         <h5 className="text-2xl font-black text-slate-900">{stats.labelsFertimaxi + stats.labelsCibra}</h5>
                      </div>
                      <div className="bg-white p-3 rounded-2xl text-slate-400 shadow-sm border border-slate-100">
                         <History size={24} />
                      </div>
                   </div>
                </div>

                {/* Status da Fila Atual */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-3">
                         <ListOrdered className="text-blue-500" /> Operação em Tempo Real
                      </h3>
                      <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                         {stats.totalVehicles} Veículos na Fila
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 text-center space-y-1">
                         <h6 className="text-3xl font-black text-emerald-600">{queue.filter(q => q.labelIssued).length}</h6>
                         <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Etiquetas OK</p>
                      </div>
                      <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 text-center space-y-1">
                         <h6 className="text-3xl font-black text-blue-600">{queue.filter(q => q.termIssued).length}</h6>
                         <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Termos OK</p>
                      </div>
                      <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 text-center col-span-2 space-y-1">
                         <h6 className="text-3xl font-black text-amber-600">{queue.filter(q => q.sampleLabelDelivered).length}</h6>
                         <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest">Amostras Entregues</p>
                      </div>
                   </div>
                   <button onClick={() => setView('queue')} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-800 text-sm uppercase tracking-widest">
                      ACESSAR FILA COMPLETA <ChevronRight size={18} />
                   </button>
                </div>
             </div>
          </div>
        )}

        {view === 'queue' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black">Fila de Carregamento</h2>
                <p className="text-slate-500 font-bold">Importe e gerencie a ordem de carregamento dos veículos.</p>
                {importTimestamp && (
                  <p className="text-emerald-600 text-xs font-black uppercase mt-2 bg-emerald-50 px-3 py-1 rounded-full inline-block">
                    Lista importada em: {importTimestamp}
                  </p>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Filtrar Placa, Produto ou Pedido..." value={queueSearchQuery} onChange={(e) => setQueueSearchQuery(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePdfImport} accept=".pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50">
                  {isImporting ? <Clock className="animate-spin" size={20} /> : <FileUp size={20} />} <span className="hidden md:inline">IMPORTAR</span>
                </button>
                <button onClick={handleExportQueue} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-sm">
                  <FileDown size={20} className="text-emerald-500" /> <span className="hidden md:inline">EXPORTAR EXCEL</span>
                </button>
                <button onClick={clearQueue} className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all">
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
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Amostra</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Emissão</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <Reorder.Group axis="y" values={filteredQueue} onReorder={handleReorder} as="tbody">
                    {filteredQueue.length > 0 ? filteredQueue.map((item) => (
                      <Reorder.Item key={item.id} value={item} as="tr" className={`hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 ${item.status === 'completed' ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-6 py-5"><div className="flex items-center gap-2"><GripVertical className="text-slate-300 drag-handle" size={16} /><span className="font-black text-slate-900">{item.order}</span></div></td>
                        <td className="px-6 py-5"><span className="font-black text-slate-900 text-lg">{item.placa}</span></td>
                        <td className="px-6 py-5"><p className="font-black text-slate-900 text-sm">{item.carrier}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PEDIDO: {item.orderNumber}</p></td>
                        <td className="px-6 py-5"><div className="flex items-center gap-2"><div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase">{item.productName}</div><div className="text-xs font-bold text-slate-500">{item.quantity} TON/KG</div></div></td>
                        <td className="px-6 py-5 text-center">
                          <button onClick={() => handleToggleSampleLabel(item.id, !!item.sampleLabelDelivered, item.placa)} className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 mx-auto ${item.sampleLabelDelivered ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                             <FlaskConical size={20} /><span className="text-[8px] font-black uppercase tracking-tighter">{item.sampleLabelDelivered ? 'ENTREGUE' : 'PENDENTE'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {item.termIssued ? (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <FileText size={12} /> TERMO OK
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <FileText size={12} /> TERMO PEND.
                              </span>
                            )}
                            {item.labelIssued ? (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <Tag size={12} /> ETIQUETA OK
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <Tag size={12} /> ETIQUETA PEND.
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <CheckCircle2 size={10} /> CONCLUÍDO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                             {item.status !== 'completed' && (
                               <div className="flex gap-2">
                                 <button onClick={() => handleGenerateFromQueue(item)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-100" title="Gerar Etiqueta"><Tag size={14} /> ETIQUETA</button>
                                 <button onClick={() => handleGenerateTermFromQueue(item)} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-100" title="Gerar Termo"><FileText size={14} /> TERMO</button>
                               </div>
                             )}
                             <div className="flex bg-slate-100 p-1 rounded-xl">
                               {item.status === 'completed' ? (
                                 <button onClick={() => handleQueueStatusChange(item.id, 'pending')} className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors" title="Reverter Conclusão"><RotateCcw size={16} /></button>
                               ) : (
                                 <button onClick={() => handleQueueStatusChange(item.id, 'completed')} className="p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors" title="Concluir Carregamento"><Check size={16} /></button>
                               )}
                               <button onClick={() => handleRemoveQueueItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Remover da Fila"><X size={16} /></button>
                             </div>
                          </div>
                        </td>
                      </Reorder.Item>
                    )) : (<tr><td colSpan={7} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Nenhum veículo encontrado</td></tr>)}
                  </Reorder.Group>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'terms' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black">Gestão de Termos de Retirada</h2>
                <p className="text-slate-500 font-bold">Emita novos termos avulsos ou visualize os já gerados.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar por Placa ou Motorista..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <button onClick={handleExportTerms} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-sm">
                  <FileDown size={20} className="text-blue-500" /> <span className="hidden md:inline">EXPORTAR EXCEL</span>
                </button>
                <button onClick={() => { setCurrentLogId(null); setWithdrawalData(null); setIsTermModalOpen(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all">
                  <FilePlus size={20} /> GERAR TERMO AVULSO
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
               <div className="overflow-x-auto max-h-[600px] no-scrollbar overflow-y-auto">
                 <table className="w-full">
                    <thead className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorista / CPF</th>
                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportadora / Placa</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Amostra</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Emissão</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {termsHistory.length > 0 ? termsHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-5">
                             <p className="font-black text-slate-900 text-sm">{record.date || record.timestamp?.toDate?.().toLocaleDateString('pt-BR') || '...'}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">{record.time || record.timestamp?.toDate?.().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) || '...'}</p>
                          </td>
                          <td className="px-6 py-5">
                             <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black tracking-widest uppercase ${record.clientName === 'CIBRA' ? 'bg-blue-100 text-blue-700' : record.clientName === 'FERTIMAXI' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {record.clientName || 'N/A'}
                             </span>
                          </td>
                          <td className="px-6 py-5">
                             <p className="font-black text-slate-900 text-sm uppercase">{record.driverName || 'N/A'}</p>
                             <p className="text-[10px] font-bold text-slate-400">{record.driverCpf || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-5">
                             <p className="font-black text-slate-900 text-sm uppercase">{record.carrier || 'N/A'}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black">{record.placa}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{record.productName}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <button 
                               onClick={() => handleToggleHistorySampleLabel(record.id, !!record.sampleLabelDelivered, record.placa)}
                               className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 mx-auto ${record.sampleLabelDelivered ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}
                             >
                                <FlaskConical size={18} />
                                <span className="text-[7px] font-black uppercase tracking-tighter">{record.sampleLabelDelivered ? 'Entregue' : 'Pendente'}</span>
                             </button>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <div className="flex flex-col gap-1.5 items-center">
                               <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                  <FileText size={12} /> TERMO EMITIDO
                               </span>
                               {record.labelGenerated ? (
                                 <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                    <Tag size={12} /> ETIQUETA EMITIDA
                                 </span>
                               ) : (
                                 <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                    <Tag size={12} /> ETIQUETA PENDENTE
                                 </span>
                               )}
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex items-center justify-end gap-2">
                                <button onClick={(e) => handleHistoryTerm(record, e)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-800 transition-all" title="Visualizar Termo">
                                   <Eye size={14} /> VISUALIZAR
                                </button>
                                <button onClick={(e) => handleDeleteHistory(record.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Excluir Registro">
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest">Nenhum termo encontrado</td>
                        </tr>
                      )}
                    </tbody>
                 </table>
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
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${p.clientName === 'CIBRA' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{p.clientName}</span>
                            <p className="font-black text-slate-900 text-xs leading-none">{p.name}</p>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{p.code} • {p.nature}</p>
                        </div>
                        <ChevronRight className={selectedProductId === p.id ? 'text-emerald-500' : 'text-slate-300'} size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                         <div className={`w-8 h-3 rounded-full ${selectedProduct.clientName === 'CIBRA' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${selectedProduct.clientName === 'CIBRA' ? 'text-blue-600' : 'text-emerald-600'}`}>
                           {selectedProduct.clientName}
                         </span>
                         <div className="ml-2 bg-slate-900 text-white px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider">{selectedProduct.code}</div>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase leading-none mb-1">{selectedProduct.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedProduct.category} • {selectedProduct.nature}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lote <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={session.lote} onChange={(e) => setSession({ ...session, lote: e.target.value })} placeholder="Ex: 82132161" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa <span className="text-red-500">*</span></label>
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 uppercase text-sm" value={session.placa} onChange={(e) => setSession({ ...session, placa: e.target.value.toUpperCase() })} placeholder="ABC-1234" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{selectedProduct.clientName === 'CIBRA' ? 'Peso Total (KG)' : 'Tonelagem'} <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 font-black outline-none focus:border-emerald-500 text-sm" value={session.tonelada} onChange={(e) => handleToneladaChange(e.target.value)} placeholder={selectedProduct.clientName === 'CIBRA' ? 'Ex: 48.030' : 'Ex: 32'} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso Unitário (KG)</label>
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
                    <button onClick={handleReset} className="md:col-span-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"><RotateCcw size={18} /> LIMPAR</button>
                    <button onClick={handleSaveToHistory} className="md:col-span-3 py-4 bg-slate-800 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 text-base"><Save size={20} /> SALVAR NO HISTÓRICO</button>
                    <button 
                      onClick={handlePrintLabels} 
                      className="md:col-span-4 py-7 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-[1.5rem] shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] text-2xl flex items-center justify-center relative group"
                    >
                      <Printer size={28} className="absolute left-8 top-1/2 -translate-y-1/2 opacity-90 group-hover:scale-110 transition-transform" />
                      <span className="tracking-widest">IMPRIMIR ETIQUETAS</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-6 sticky top-28 animate-in slide-in-from-right duration-500">
              {selectedProduct ? (
                <>
                  <div className="w-full bg-slate-900 rounded-3xl p-5 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 shrink-0">
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Sugestão de Cópias</p>
                      <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-emerald-400">{labelQuantity}</span><span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unids</span></div>
                    </div>
                    <div className="relative z-10 shrink-0"><div className="p-3 bg-white/5 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform"><Printer size={32} /></div></div>
                  </div>
                  <div className={`origin-top transition-transform ${selectedProduct.clientName === 'CIBRA' ? 'scale-[1.1]' : 'scale-[0.85]'}`}>
                    <LabelPreview product={selectedProduct} session={session} />
                  </div>
                </>
              ) : (<div className="w-full max-w-[10.5cm] aspect-[10.5/16] border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 p-12 text-center"><Tag size={64} className="mb-4 opacity-20" /><p className="font-black uppercase tracking-widest text-sm">Selecione um produto para visualizar</p></div>)}
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-3xl font-black">Banco de Produtos</h2>
              <button onClick={() => { setEditingProduct(undefined); setIsProductModalOpen(true); }} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg"><Plus size={20} /> NOVO PRODUTO</button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-xl group relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row gap-10">
                    <div className="lg:w-1/3 space-y-6">
                      <div className="flex items-center gap-3">
                         <div className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest ${p.clientName === 'CIBRA' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>{p.clientName}</div>
                         <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-[10px] tracking-widest">{p.code}</div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 uppercase">{p.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.category} • {p.nature}</p>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all" title="Editar Produto"><Edit2 size={14} /> EDITAR</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all" title="Excluir Produto"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="lg:w-2/3 flex flex-col gap-6">
                       <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Macronutrientes Primários (%)</h4>
                         <div className="grid grid-cols-4 border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                           <div className="bg-slate-50 border-r border-slate-100 p-4 text-center"><span className="block text-[10px] font-black text-slate-400 mb-1">N TOTAL</span><span className="text-xl font-black text-slate-900">{p.composition.nTotal || '0'}</span></div>
                           <div className="bg-white border-r border-slate-100 p-4 text-center"><span className="block text-[10px] font-black text-slate-400 mb-1">P₂O₅ (CNA)</span><span className="text-xl font-black text-slate-900">{p.composition.p2o5Cna || '0'}</span></div>
                           <div className="bg-white border-r border-slate-100 p-4 text-center"><span className="block text-[10px] font-black text-slate-400 mb-1">P₂O₅ (SOL)</span><span className="text-xl font-black text-slate-900">{p.composition.p2o5Sol || '0'}</span></div>
                           <div className="bg-slate-50 p-4 text-center"><span className="block text-[10px] font-black text-slate-400 mb-1">K₂O (SOL)</span><span className="text-xl font-black text-slate-900">{p.composition.k2oSol || '0'}</span></div>
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
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black">Histórico de Atividades</h2>
                <p className="text-slate-500 font-bold">Auditoria completa de todas as etiquetas e termos gerados.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Filtrar por Placa, Lote ou Pedido..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-emerald-500 transition-all shadow-sm" />
                </div>
                <div className="flex gap-2">
                   <select value={historyClientFilter} onChange={(e) => setHistoryClientFilter(e.target.value as any)} className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-4 font-black text-xs text-slate-600 outline-none focus:border-emerald-500 shadow-sm">
                      <option value="all">TODOS CLIENTES</option>
                      <option value="FERTIMAXI">FERTIMAXI</option>
                      <option value="CIBRA">CIBRA</option>
                   </select>
                   <button onClick={handleExportHistory} className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-sm" title="Exportar Tudo para Excel">
                    <FileDown size={20} className="text-emerald-500" /> <span className="hidden md:inline">EXPORTAR</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] no-scrollbar overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Produto</th>
                      <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa / Lote / Pedido</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Amostra</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Emissão</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm">{record.timestamp?.toDate?.().toLocaleDateString('pt-BR') || '...'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{record.timestamp?.toDate?.().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) || '...'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                             <span className={`w-fit text-[9px] px-2 py-0.5 rounded-lg font-black tracking-widest uppercase ${record.clientName === 'CIBRA' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {record.clientName}
                             </span>
                             <p className="font-black text-slate-900 text-sm uppercase">{record.productName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                             <p className="font-black text-slate-900 text-base">{record.placa}</p>
                             <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">LOTE: {record.lote}</span>
                                {record.orderNumber && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">PEDIDO: {record.orderNumber}</span>}
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button onClick={() => handleToggleHistorySampleLabel(record.id, !!record.sampleLabelDelivered, record.placa)} className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 mx-auto ${record.sampleLabelDelivered ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'}`}>
                             <FlaskConical size={18} /><span className="text-[7px] font-black uppercase tracking-tighter">{record.sampleLabelDelivered ? 'ENTREGUE' : 'PENDENTE'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {record.termGenerated ? (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <FileText size={12} /> TERMO OK
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <FileText size={12} /> TERMO PEND.
                              </span>
                            )}
                            {record.labelGenerated ? (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <Tag size={12} /> ETIQUETA OK
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 w-full justify-center">
                                <Tag size={12} /> ETIQUETA PEND.
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-1.5">
                             <button onClick={(e) => handleLoadFromHistory(record, e)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Carregar no Gerador"><Copy size={18} /></button>
                             <button onClick={(e) => handleHistoryPrintLabels(record, e)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Reimprimir Etiquetas"><Printer size={18} /></button>
                             <button onClick={(e) => handleHistoryTerm(record, e)} className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all shadow-sm ${record.termGenerated ? 'bg-white border-blue-200 text-blue-500 hover:bg-blue-500 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-300'}`} title="Visualizar Termo"><Eye size={18} /></button>
                             <button onClick={(e) => handleDeleteHistory(record.id, e)} className="w-10 h-10 flex items-center justify-center bg-white border border-red-100 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Excluir Registro"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Nenhum registro no histórico</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {isProductModalOpen && ( <ProductForm onSave={handleSaveProduct} onCancel={() => { setIsProductModalOpen(false); setEditingProduct(undefined); }} initialProduct={editingProduct} /> )}
      {isTermModalOpen && ( <WithdrawalTermForm labelQuantity={labelQuantity} initialTruckPlate={session.placa} initialData={withdrawalData} initialLote={session.lote} onSave={handleTermSave} onCancel={() => setIsTermModalOpen(false)} /> )}
      
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 text-center flex flex-col items-center">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${confirmDialog.variant === 'danger' ? 'bg-red-50 text-red-500' : confirmDialog.variant === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                    {confirmDialog.icon || <Info size={32} />}
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">{confirmDialog.title}</h3>
                 <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">{confirmDialog.message}</p>
                 <div className="flex gap-3 w-full">
                    {!confirmDialog.hideCancel && (
                      <button onClick={closeConfirm} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                    )}
                    <button onClick={confirmDialog.onConfirm} className={`flex-1 py-4 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${confirmDialog.variant === 'danger' ? 'bg-red-500 shadow-red-100 hover:bg-red-600' : confirmDialog.variant === 'success' ? 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600' : confirmDialog.variant === 'success' ? 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600' : 'bg-blue-500 shadow-blue-100 hover:bg-blue-600'}`}>{confirmDialog.confirmLabel}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isPreviewTermOpen && withdrawalData && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center p-4 md:p-8 z-50 overflow-y-auto no-print animate-in fade-in duration-300">
           <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-[21cm] mb-6 gap-4 text-white">
              <div className="flex items-center gap-4">
                 <div className="bg-emerald-500 p-3 rounded-2xl shadow-xl shadow-emerald-500/20"><FileText size={24} /></div>
                 <div>
                    <h2 className="font-black text-xl leading-none">Visualização do Termo</h2>
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-widest">LOTE: {withdrawalData.lote || session.lote || 'AVULSO'}</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-widest">PLACA: {withdrawalData.truckPlate}</span>
                      </div>
                      {withdrawalData.orderNumber && (
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-widest w-fit">PEDIDO: {withdrawalData.orderNumber}</span>
                      )}
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                 <button onClick={() => { setIsPreviewTermOpen(false); setIsTermModalOpen(true); }} className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 px-5 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest border border-white/5">
                    <Edit2 size={16} /> CORRIGIR
                 </button>
                 <button onClick={confirmAndPrintTerm} className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 transition-all text-xs uppercase tracking-widest">
                    <Printer size={18} /> IMPRIMIR AGORA
                 </button>
                 <button onClick={() => setIsPreviewTermOpen(false)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3.5 rounded-2xl transition-all border border-red-500/10">
                    <X size={20} />
                 </button>
              </div>
           </div>
           
           <div className="bg-white shadow-2xl rounded-sm scale-[0.95] origin-top mb-20 shadow-black/50">
              <WithdrawalTermPreview data={withdrawalData} />
           </div>
        </div>
      )}

      <div className="hidden print:block">
        {!isPrintingTerm && (selectedProduct || historyPrintRecord) && (
          <div className="flex flex-col items-center">
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
