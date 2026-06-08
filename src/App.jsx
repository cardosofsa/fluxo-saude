import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  MapPin, 
  Search, 
  ChevronRight, 
  Phone, 
  Navigation, 
  Users, 
  Clock, 
  Layers, 
  FileText, 
  User, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  ChevronLeft, 
  Filter, 
  ArrowRight,
  TrendingUp, 
  Calendar,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Settings,
  Database,
  Smartphone,
  Eye,
  HeartPulse,
  Sparkles,
  Info,
  Map,
  LogOut,
  ClipboardList
} from 'lucide-react';
import './App.css';
import { DEFAULT_USER_LOCATION } from './config/mapConfig';
import { useHealthMap } from './hooks/useHealthMap';
import { useAuth } from './hooks/useAuth';
import { HealthMapView, WazeInstructionBanner, WazeRouteHud } from './components/HealthMapView';
import { db } from './services/db';
import {
  INITIAL_UNITS,
  INITIAL_BEDS,
  INITIAL_HANDOVERS,
} from './data/units';

const formatCPF = (val) => {
  if (!val) return '';
  let v = val.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
};

function App() {
  // Global Database states
  const [units, setUnits] = useState(INITIAL_UNITS);
  const [beds, setBeds] = useState(INITIAL_BEDS);
  const [handovers, setHandovers] = useState(INITIAL_HANDOVERS);
  // `logs` é write-only por enquanto (alimenta um futuro painel de debug). Mantém-se o setter.
  const [, setLogs] = useState([
    { id: 1, time: '17:56:00', text: 'Banco de Dados do Fluxo Saúde conectado com especificações de layout Figma.' },
    { id: 2, time: '17:56:10', text: 'Simulador calibrado para canvas exato de 390px com rolagens fluidas.' }
  ]);
  const [digitalCheckins, setDigitalCheckins] = useState([]);

  // Patient user authentication state
  const [patientUser, setPatientUser] = useState(() => {
    const saved = localStorage.getItem('fs_logged_patient');
    return saved ? JSON.parse(saved) : null;
  });
  const [patientActiveTab, setPatientActiveTab] = useState('login'); // login | register
  const [patientLoginForm, setPatientLoginForm] = useState({ cpf: '', password: '' });
  const [patientRegisterForm, setPatientRegisterForm] = useState({ name: '', cpf: '', cns: '', birthDate: '', password: '' });
  const [patientAuthError, setPatientAuthError] = useState('');

  // Doctor triage active states
  const [selectedTriageCheckin, setSelectedTriageCheckin] = useState(null);
  const [selectedTriageUrgency, setSelectedTriageUrgency] = useState('Verde');
  const [triageNotes, setTriageNotes] = useState('');

  // Bed management extras
  const [bedMgmtTab, setBedMgmtTab] = useState('beds'); // 'beds' | 'triage'
  const [newBedLabel, setNewBedLabel] = useState('');
  const [bedAssignCheckinId, setBedAssignCheckinId] = useState(null);

  // Guest queue lookup
  const [queueLookupCode, setQueueLookupCode] = useState('');
  const [queueLookupResult, setQueueLookupResult] = useState(null); // null | checkin object | 'not_found'

  // Custom premium modal/dialog data
  const [modalData, setModalData] = useState(null); // { title, content }

  // Load database on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const u = await db.getUnits();
        setUnits(u);
        const b = await db.getBeds();
        setBeds(b);
        const h = await db.getHandovers();
        setHandovers(h);
        const c = await db.getCheckins();
        setDigitalCheckins(c);
      } catch (err) {
        console.error('Erro ao carregar dados do banco:', err);
      }
    };
    loadAllData();
  }, []);

  // Mobile App screen navigation
  const [activeScreen, setActiveScreen] = useState('welcome');
  const [clickedPaciente, setClickedPaciente] = useState(false);
  const [clickedProfissional, setClickedProfissional] = useState(false);
  const [clickedUpdatePanel, setClickedUpdatePanel] = useState(false);
  const [flowSuccessMsg, setFlowSuccessMsg] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('mangabeira');
  const [selectedBedId, setSelectedBedId] = useState(null);
  
  // Form wizards
  const [checkinForm, setCheckinForm] = useState({
    name: '',
    cpf: '',
    symptoms: [],
    unitId: 'mangabeira',
    urgencyLevel: 'Verde'
  });

  const [lastCheckinResult, setLastCheckinResult] = useState(null);

  // Pre-fill checkin form automatically when patient logs in
  useEffect(() => {
    if (patientUser) {
      setCheckinForm(prev => ({
        ...prev,
        name: patientUser.name,
        cpf: formatCPF(patientUser.cpf)
      }));
    } else {
      setCheckinForm(prev => ({
        ...prev,
        name: '',
        cpf: ''
      }));
    }
  }, [patientUser]);
  
  const [handoverForm, setHandoverForm] = useState({
    bedId: 1,
    status: 'observation',
    patientName: '',
    age: '',
    notes: '',
    description: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, UPA, Policlínica
  
  // Atendente: estado local de seleção de lotação (só aplica ao clicar em Atualizar)
  const [pendingStatus, setPendingStatus] = useState(null); // null = nenhuma alteração pendente

  // Localização do usuário (alimentada pela geolocalização do navegador).
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [isGpsManual] = useState(false);

  // Request browser geolocation to track the user's actual live position
  useEffect(() => {
    if (isGpsManual) return;
    const defaultCoords = DEFAULT_USER_LOCATION; // Rua Rivas, Capuchinhos

    const successCallback = (position) => {
      if (isGpsManual) return;
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setUserLocation([lat, lng]);
      addLog(`[Localização] GPS do navegador ativo: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    };

    const errorCallback = (error) => {
      if (isGpsManual) return;
      // Se falhar a alta precisão (comum em desktops sem chip GPS), tenta obter com menor precisão
      if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
        addLog("[Localização] Tentando obter localização com precisão padrão...");
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (err2) => {
            console.warn("Geolocalização indisponível nos dois modos:", err2);
            setUserLocation(defaultCoords);
            addLog("[Localização] Permissão GPS indisponível. Inicializado na Rua Rivas, Capuchinhos.");
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      } else {
        console.warn("Geolocalização não concedida ou com erro:", error);
        setUserLocation(defaultCoords);
        addLog("[Localização] Permissão GPS indisponível. Inicializado na Rua Rivas, Capuchinhos.");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, { enableHighAccuracy: true, timeout: 4000 });

      // Watch position to update live if the user moves
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (isGpsManual) return;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
        },
        null,
        { enableHighAccuracy: false, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isGpsManual]);

  // Logs helper
  const addLog = (text) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setLogs(prev => [{ id: Date.now(), time, text }, ...prev.slice(0, 49)]);
  };

  // Autenticação (login profissional/admin + cadastro) encapsulada no hook.
  const {
    currentUser,
    loginForm,
    setLoginForm,
    loginError,
    adminForm,
    setAdminForm,
    lastGeneratedStaff,
    staffMembers,
    handleLoginSubmit,
    handleCreateStaff,
  } = useAuth({ setActiveScreen, addLog });

  // Synchronizers
  const currentProfessionalUnit = currentUser?.unitId || 'mangabeira';
  const getSelectedUnit = () => units.find(u => u.id === selectedUnitId) || units[0];
  const getProfUnit = () => units.find(u => u.id === currentProfessionalUnit) || units[0];

  // When the professional logs in or beds load, default the handover form to the first bed of their unit
  useEffect(() => {
    if (currentUser && beds.length > 0) {
      const firstUnitBed = beds.find(b => b.unitId === currentUser.unitId);
      if (firstUnitBed) {
        setHandoverForm(prev => ({ ...prev, bedId: firstUnitBed.id }));
      }
    }
  }, [currentUser, beds]);

  // Posição do paciente na fila de triados da unidade (1-based)
  const getQueuePosition = (checkinId) => {
    const checkin = digitalCheckins.find(c => c.id === checkinId);
    if (!checkin) return null;
    const queue = digitalCheckins
      .filter(c => c.unitName === checkin.unitName && c.status === 'Triado')
      .sort((a, b) => {
        const priority = { 'Vermelho': 0, 'Laranja': 1, 'Amarelo': 2, 'Verde': 3, 'Azul': 4 };
        return (priority[a.urgencyLevel] ?? 5) - (priority[b.urgencyLevel] ?? 5);
      });
    return queue.findIndex(c => c.id === checkinId) + 1;
  };

  // Paciente - Autenticação
  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setPatientAuthError('');
    try {
      const user = await db.loginPatient(patientLoginForm.cpf, patientLoginForm.password);
      setPatientUser(user);
      localStorage.setItem('fs_logged_patient', JSON.stringify(user));
      addLog(`[Paciente] Login efetuado: ${user.name}`);
      setPatientLoginForm({ cpf: '', password: '' });
    } catch (err) {
      setPatientAuthError(err.message);
    }
  };

  const handlePatientRegister = async (e) => {
    e.preventDefault();
    setPatientAuthError('');
    try {
      const user = await db.registerPatient({
        name: patientRegisterForm.name,
        cpf: patientRegisterForm.cpf,
        cns: patientRegisterForm.cns,
        birthDate: patientRegisterForm.birthDate,
        password: patientRegisterForm.password,
      });
      setPatientUser(user);
      localStorage.setItem('fs_logged_patient', JSON.stringify(user));
      addLog(`[Paciente] Registro e login efetuados: ${user.name}`);
      setPatientRegisterForm({ name: '', cpf: '', cns: '', birthDate: '', password: '' });
    } catch (err) {
      setPatientAuthError(err.message);
    }
  };

  const handlePatientLogout = () => {
    setPatientUser(null);
    localStorage.removeItem('fs_logged_patient');
    addLog('[Paciente] Logout efetuado.');
  };

  // Control updates from backoffice
  const handleUpdateUnitWaitTime = async (unitId, newMinutes) => {
    let status = 'BAIXO';
    let color = '#10B981';
    if (newMinutes > 45) {
      status = 'ALTO';
      color = '#EF4444';
    } else if (newMinutes > 15) {
      status = 'MÉDIO';
      color = '#F59E0B';
    }
    
    try {
      const updated = await db.updateUnit(unitId, {
        waitMinutes: parseInt(newMinutes),
        status,
        color
      });
      setUnits(prev => prev.map(unit => unit.id === unitId ? updated : unit));
      addLog(`[Controle Regional] Alterou tempo de espera da ${updated.name} para ${newMinutes}min (Status: ${status}).`);
    } catch (err) {
      console.error('Erro ao atualizar tempo de espera:', err);
    }
  };

  // Ferramenta de backoffice (ainda sem botão na UI — manter para wiring futuro).
  // eslint-disable-next-line no-unused-vars
  const handleUpdateUnitQueue = async (unitId, newQueueSize) => {
    try {
      const updated = await db.updateUnit(unitId, { queueSize: parseInt(newQueueSize) });
      setUnits(prev => prev.map(unit => unit.id === unitId ? updated : unit));
      addLog(`[Controle Regional] Alterou fila de ${updated.name} para ${newQueueSize} pacientes.`);
    } catch (err) {
      console.error('Erro ao atualizar fila:', err);
    }
  };

  // Ferramenta de demo (ainda sem botão na UI — manter para wiring futuro).
  // eslint-disable-next-line no-unused-vars
  const triggerMockCheckin = async (targetUnitId = 'mangabeira') => {
    const names = ['Fernanda Lima', 'Rodrigo Simas', 'Camila Pitanga', 'Antônio Fagundes', 'Aline Wirley', 'Thiago Lacerda'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const mockCpf = `${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}`;
    const randomSymptom = ['Febre Alta', 'Dor Abdominal', 'Problema Respiratório', 'Fratura', 'Cefaleia Intensa'][Math.floor(Math.random() * 5)];
    const targetUnit = units.find(u => u.id === targetUnitId);

    const newCheckin = {
      id: `c_${Date.now()}`,
      name: randomName,
      cpf: mockCpf,
      symptom: randomSymptom,
      unitName: targetUnit.name,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      code: `FS-${Math.floor(Math.random() * 9000 + 1000)}`,
      urgencyLevel: 'Verde',
      status: 'Pendente',
      triageNotes: ''
    };

    try {
      const added = await db.addCheckin(newCheckin);
      setDigitalCheckins(prev => [added, ...prev]);
      
      const updatedUnit = await db.updateUnit(targetUnitId, {
        queueSize: targetUnit.queueSize + 1,
        todayCheckins: targetUnit.todayCheckins + 1
      });
      setUnits(prev => prev.map(u => u.id === targetUnitId ? updatedUnit : u));

      addLog(`[Check-In Digital] ${randomName} efetuou check-in online para ${targetUnit.name}.`);
    } catch (err) {
      console.error('Erro ao acionar checkin simulado:', err);
    }
  };

  const handleBedStatusUpdate = async (bedId, newStatus) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;
    let patientName = bed.patientName;
    let notes = bed.notes;
    
    if (newStatus === 'free') {
      patientName = 'Nenhum';
      notes = 'Leito livre e higienizado';
    } else if (bed.patientName === 'Nenhum') {
      patientName = 'Paciente Admitido';
      notes = newStatus === 'observation' ? 'Observação clínica' : 'Caso sob ventilação mecânica';
    }
    
    try {
      const updated = await db.updateBed(bedId, { status: newStatus, patientName, notes });
      setBeds(prev => prev.map(b => b.id === bedId ? updated : b));
      addLog(`[Gestão de Leitos] ${updated.label} alterado para ${newStatus.toUpperCase()} (${patientName}).`);
    } catch (err) {
      console.error('Erro ao atualizar status do leito:', err);
    }
    setSelectedBedId(null);
  };

  const handleAddBed = async () => {
    if (!newBedLabel.trim()) return;
    const profUnitId = currentUser?.unitId || 'mangabeira';
    const newBed = {
      id: Date.now(),
      label: newBedLabel.trim(),
      unitId: profUnitId,
      status: 'free',
      patientName: 'Nenhum',
      age: '',
      notes: 'Leito livre e higienizado',
      time: '--:--'
    };
    try {
      const added = await db.addBed(newBed);
      setBeds(prev => [...prev, added]);
      setNewBedLabel('');
      addLog(`[Gestão de Leitos] Leito "${added.label}" adicionado.`);
    } catch (err) {
      console.error('Erro ao adicionar leito:', err);
    }
  };

  const handleDeleteBed = async (bedId) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;
    if (!window.confirm(`Excluir "${bed.label}"?`)) return;
    try {
      await db.deleteBed(bedId);
      setBeds(prev => prev.filter(b => b.id !== bedId));
      if (selectedBedId === bedId) setSelectedBedId(null);
      addLog(`[Gestão de Leitos] Leito "${bed.label}" removido.`);
    } catch (err) {
      console.error('Erro ao excluir leito:', err);
    }
  };

  const handleAssignCheckinToBed = async (checkinId, bedId) => {
    const checkin = digitalCheckins.find(c => c.id === checkinId);
    const bed = beds.find(b => b.id === bedId);
    if (!checkin || !bed) return;
    try {
      const updatedBed = await db.updateBed(bedId, {
        status: 'observation',
        patientName: checkin.name,
        notes: `Via triagem: ${checkin.symptom || 'Triagem geral'}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      setBeds(prev => prev.map(b => b.id === bedId ? updatedBed : b));
      await db.updateCheckin(checkinId, { status: 'Internado' });
      setDigitalCheckins(prev => prev.map(c => c.id === checkinId ? { ...c, status: 'Internado' } : c));
      setBedAssignCheckinId(null);
      addLog(`[Triagem] ${checkin.name} encaminhado(a) para ${bed.label}.`);
    } catch (err) {
      console.error('Erro ao encaminhar paciente para leito:', err);
    }
  };

  // Sync beds occupied count
  useEffect(() => {
    const syncBedsAndUnits = async () => {
      // Mangabeira unit summary update based on bed occupation
      const activeBeds = beds.filter(b => b.status !== 'free').length;
      const criticalBeds = beds.filter(b => b.status === 'critical').length;
      const targetUnit = units.find(u => u.id === 'mangabeira');
      if (targetUnit && (targetUnit.occupiedBeds !== activeBeds || targetUnit.criticalCases !== criticalBeds)) {
        try {
          const updated = await db.updateUnit('mangabeira', {
            occupiedBeds: activeBeds,
            criticalCases: criticalBeds
          });
          setUnits(prev => prev.map(u => u.id === 'mangabeira' ? updated : u));
        } catch (err) {
          console.error('Erro ao sincronizar leitos/unidades:', err);
        }
      }
    };
    syncBedsAndUnits();
  }, [beds]);

  // Submit from wizards inside phone simulator
  const handleMobilePatientCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!checkinForm.name || !checkinForm.cpf) return;

    const targetUnit = units.find(u => u.id === checkinForm.unitId);
    const codeVal = `FS-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newCheckin = {
      id: `c_${Date.now()}`,
      name: checkinForm.name,
      cpf: checkinForm.cpf,
      symptom: checkinForm.symptoms.join(', ') || 'Triagem geral',
      unitName: targetUnit.name,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      code: codeVal,
      urgencyLevel: 'Verde', // default before triage
      status: 'Pendente',
      triageNotes: ''
    };

    try {
      const added = await db.addCheckin(newCheckin);
      setDigitalCheckins(prev => [added, ...prev]);

      const updated = await db.updateUnit(checkinForm.unitId, {
        queueSize: targetUnit.queueSize + 1,
        todayCheckins: targetUnit.todayCheckins + 1
      });
      setUnits(prev => prev.map(u => u.id === checkinForm.unitId ? updated : u));

      addLog(`[Simulador Mobile] Paciente ${checkinForm.name} realizou Check-in Digital na ${targetUnit.name}.`);
      setLastCheckinResult({ code: added.code, unitName: added.unitName });
      setActiveScreen('patient_checkin_success');
    } catch (err) {
      console.error('Erro no checkin digital:', err);
    }
  };

  const handleClinicTriageSubmit = async (checkinId) => {
    try {
      const targetCheckin = digitalCheckins.find(c => c.id === checkinId);
      if (!targetCheckin) return;

      const updates = {
        urgencyLevel: selectedTriageUrgency,
        triageNotes: triageNotes
      };

      await db.triageCheckin(checkinId, updates);
      
      setDigitalCheckins(prev => prev.map(c => 
        c.id === checkinId ? { ...c, ...updates, status: 'Triado' } : c
      ));

      addLog(`[Triagem] Paciente ${targetCheckin.name} triado como ${selectedTriageUrgency}.`);
      setSelectedTriageCheckin(null);
      
      // Update unit queue/critical cases if clinical impact is large
      if (selectedTriageUrgency === 'Vermelho' || selectedTriageUrgency === 'Laranja') {
        const targetUnit = units.find(u => u.name === targetCheckin.unitName);
        if (targetUnit) {
          const updatedUnit = await db.updateUnit(targetUnit.id, {
            criticalCases: targetUnit.criticalCases + 1
          });
          setUnits(prev => prev.map(u => u.id === targetUnit.id ? updatedUnit : u));
        }
      }
      
      alert(`Triagem de ${targetCheckin.name} concluída com sucesso! Classificação: ${selectedTriageUrgency}`);
    } catch (err) {
      console.error('Erro ao salvar triagem:', err);
      alert('Erro ao salvar triagem clínica.');
    }
  };

  const handleMobileNewHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!handoverForm.patientName || !handoverForm.description) return;

    const profUnitId = currentUser?.unitId || 'mangabeira';
    const targetBed = beds.find(b => b.id === Number(handoverForm.bedId));
    const newHandover = {
      id: `h_${Date.now()}`,
      bedLabel: targetBed?.label || 'Leito',
      status: handoverForm.status,
      title: `${targetBed?.label || 'Leito'} - ${handoverForm.status === 'critical' ? 'Crítico' : handoverForm.status === 'observation' ? 'Observação' : 'Estável'}`,
      description: handoverForm.description,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      professional: currentUser?.name || 'Dra. Ana Silva',
      unitId: profUnitId
    };

    try {
      const added = await db.addHandover(newHandover);
      setHandovers(prev => [added, ...prev]);

      const updatedBed = await db.updateBed(Number(handoverForm.bedId), {
        status: handoverForm.status,
        patientName: handoverForm.patientName,
        age: handoverForm.age || '40 anos',
        notes: handoverForm.notes || 'Atualizado via passagem de plantão',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      setBeds(prev => prev.map(b => b.id === Number(handoverForm.bedId) ? updatedBed : b));

      addLog(`[Simulador Mobile] Passagem de plantão no ${targetBed.label} (Paciente: ${handoverForm.patientName}).`);
    } catch (err) {
      console.error('Erro na passagem de plantão:', err);
    }
    
    // Clear and redirect
    setHandoverForm({
      bedId: 1,
      status: 'observation',
      patientName: '',
      age: '',
      notes: '',
      description: ''
    });
    setActiveScreen('professional_handover_history');
  };

  // Memoize filtered units so the map hook gets a stable reference
  // (avoids infinite re-render loop when units is in a useEffect dep array)
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      const matchesSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            unit.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || unit.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [units, searchQuery, filterType]);

  const getFilteredUnits = () => filteredUnits;

  // Mapa, rota e navegação (Leaflet + OSRM) encapsulados no hook.
  const {
    wazeActiveUnit,
    wazeDistance,
    wazeDuration,
    handleUnitSelectFromList,
    resetRoute,
  } = useHealthMap({
    units: filteredUnits,
    userLocation,
    activeScreen,
    selectedUnitId,
    setSelectedUnitId,
    addLog,
  });

  const getAge = (birthDateString) => {
    if (!birthDateString) return '';
    const birthDate = new Date(birthDateString);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' anos';
  };

  const maskCpf = (cpf) => {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length < 9) return cpf;
    return `${clean.substring(0, 3)}.***.***-${clean.substring(clean.length - 2)}`;
  };

  return (
    <div className="app-container-centered">
      
      {/* Dev Stage controls floating above/next to the phone */}
      <div className="dev-stage-controls">
        <button 
          className={`dev-btn ${activeScreen.startsWith('patient') || activeScreen === 'welcome' ? 'active' : ''}`}
          onClick={() => {
            setActiveScreen('patient_home');
            addLog('[Desenvolvedor] Alternou para Modo Paciente');
          }}
        >
          <User style={{ width: '14px', height: '14px' }} />
          Modo Paciente
        </button>
        <button 
          className={`dev-btn ${activeScreen.startsWith('professional') ? 'active' : ''}`}
          onClick={() => {
            setActiveScreen('professional_dashboard');
            addLog('[Desenvolvedor] Alternou para Modo Profissional');
          }}
        >
          <HeartPulse style={{ width: '14px', height: '14px' }} />
          Modo Profissional
        </button>
        <div className="dev-divider"></div>
        <button 
          className="dev-btn reset"
          onClick={async () => {
            try {
              await db.resetAll();
              const u = await db.getUnits();
              setUnits(u);
              const b = await db.getBeds();
              setBeds(b);
              const h = await db.getHandovers();
              setHandovers(h);
              setDigitalCheckins([]);
              setPatientUser(null);
              localStorage.removeItem('fs_logged_patient');
              addLog('[Desenvolvedor] Database resetada e recarregada.');
              alert('Banco de dados do protótipo foi reiniciado para os valores padrão!');
            } catch (err) {
              console.error('Erro ao reiniciar banco:', err);
            }
          }}
        >
          <RefreshCw style={{ width: '12px', height: '12px' }} />
          Resetar BD
        </button>
      </div>

      {/* Center Phone Simulator Column */}
      <div className="phone-mockup">
        {/* Physical volume and power button graphics */}
        <div className="phone-btn-volume-up"></div>
        <div className="phone-btn-volume-down"></div>
        <div className="phone-btn-power"></div>

        {/* Smart dynamic island */}
        <div className="phone-dynamic-island"></div>

        <div className="phone-screen">
          
          {/* STATUS BAR */}
          <div className="phone-status-bar">
            <span>17:56</span>
            <div className="status-bar-icons">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '10px' }}>
                <span style={{ width: '2px', height: '4px', backgroundColor: '#0F172B', borderRadius: '10px' }}></span>
                <span style={{ width: '2px', height: '6px', backgroundColor: '#0F172B', borderRadius: '10px' }}></span>
                <span style={{ width: '2px', height: '8px', backgroundColor: '#0F172B', borderRadius: '10px' }}></span>
                <span style={{ width: '2px', height: '10px', backgroundColor: '#0F172B', borderRadius: '10px' }}></span>
              </div>
              <span>5G</span>
              <div style={{ width: '18px', height: '9px', border: '1px solid #0F172B', borderRadius: '2px', padding: '0.5px', display: 'flex' }}>
                <div style={{ width: '12px', height: '100%', backgroundColor: '#0F172B', borderRadius: '1px' }}></div>
              </div>
            </div>
          </div>

          {/* PHONE PAGE ROUTINGS */}
          <div className="phone-content">
                {/* SCREEN 1: Splash/Welcome (Fluxo Saúde Feira) */}
                {activeScreen === 'welcome' && (
                  <div 
                    className="FluxoSaDeFeira" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      position: 'relative', 
                      background: '#F7F9FB', 
                      overflow: 'hidden', 
                      flexDirection: 'column', 
                      justifyContent: 'flex-start', 
                      alignItems: 'flex-start', 
                      display: 'inline-flex' 
                    }}
                  >
                    <div 
                      className="Main" 
                      style={{ 
                        alignSelf: 'stretch', 
                        height: '100%', 
                        paddingLeft: '32px', 
                        paddingRight: '32px', 
                        paddingTop: '64px', 
                        paddingBottom: '64px', 
                        position: 'relative', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        display: 'flex' 
                      }}
                    >
                      {/* Aesthetic Footer Element (Editorial Asymmetry) */}
                      <div 
                        className="AestheticFooterElementEditorialAsymmetry" 
                        style={{ 
                          width: '256px', 
                          height: '256px', 
                          left: '262px', 
                          top: '756px', 
                          position: 'absolute', 
                          background: 'rgba(214, 227, 255, 0.10)', 
                          boxShadow: '100px 100px 100px', 
                          borderRadius: '9999px', 
                          filter: 'blur(50px)' 
                        }}
                      ></div>
                      
                      {/* Top spacing spacer */}
                      <div style={{ height: '4px' }}></div>
                      
                      {/* Subtle background texture for "Clinical Sanctuary" feel */}
                      <div 
                        className="SubtleBackgroundTextureForClinicalSanctuaryFeel" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          left: 0, 
                          top: 0, 
                          position: 'absolute', 
                          opacity: 0.40, 
                          background: 'radial-gradient(ellipse 123.87% 54.65% at 50% 50%, rgba(214, 227, 255, 0.40) 0%, rgba(214, 227, 255, 0) 70%)',
                          pointerEvents: 'none'
                        }}
                      ></div>
                      
                      {/* Center Branding Section */}
                      <div 
                        className="CenterBrandingSection" 
                        style={{ 
                          maxWidth: '384px', 
                          flexDirection: 'column', 
                          justifyContent: 'flex-start', 
                          alignItems: 'center', 
                          gap: '32px', 
                          display: 'flex',
                          zIndex: 2
                        }}
                      >
                        {/* Elegant Heart + Pin Logo Component */}
                        <div 
                          className="ElegantHeartPinLogoComponent" 
                          style={{ 
                            position: 'relative', 
                            flexDirection: 'column', 
                            justifyContent: 'flex-start', 
                            alignItems: 'flex-start', 
                            display: 'flex' 
                          }}
                        >
                          <div 
                            className="GradientBlur" 
                            style={{ 
                              width: '192px', 
                              height: '192px', 
                              left: '-16px', 
                              top: '-16px', 
                              position: 'absolute', 
                              opacity: 0.10, 
                              background: 'linear-gradient(135deg, #00478D 0%, #005EB8 100%)', 
                              boxShadow: '40px 40px 40px', 
                              borderRadius: '9999px', 
                              filter: 'blur(20px)' 
                            }}
                          ></div>
                          <div 
                            className="BackgroundShadow" 
                            style={{ 
                              width: '160px', 
                              height: '160px', 
                              position: 'relative', 
                              background: 'linear-gradient(135deg, #00478D 0%, #005EB8 100%)', 
                              boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                              overflow: 'hidden', 
                              borderRadius: '48px', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              display: 'inline-flex' 
                            }}
                          >
                            <div 
                              className="OverlayOverlayblur" 
                              style={{ 
                                width: '160px', 
                                height: '160px', 
                                left: 0, 
                                top: 0, 
                                position: 'absolute', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                backdropFilter: 'blur(0.50px)' 
                              }}
                            ></div>
                            <div 
                              className="IconStack" 
                              style={{ 
                                position: 'relative', 
                                flexDirection: 'column', 
                                justifyContent: 'flex-start', 
                                alignItems: 'center', 
                                display: 'inline-flex' 
                              }}
                            >
                              <div className="Icon">
                                <svg width="48" height="60" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M24 30C25.65 30 27.0625 29.4125 28.2375 28.2375C29.4125 27.0625 30 25.65 30 24C30 22.35 29.4125 20.9375 28.2375 19.7625C27.0625 18.5875 25.65 18 24 18C22.35 18 20.9375 18.5875 19.7625 19.7625C18.5875 20.9375 18 22.35 18 24C18 25.65 18.5875 27.0625 19.7625 28.2375C20.9375 29.4125 22.35 30 24 30ZM24 60C15.95 53.15 9.9375 46.7875 5.9625 40.9125C1.9875 35.0375 0 29.6 0 24.6C0 17.1 2.4125 11.125 7.2375 6.675C12.0625 2.225 17.65 0 24 0C30.35 0 35.9375 2.225 40.7625 6.675C45.5875 11.125 48 17.1 48 24.6C48 29.6 46.0125 35.0375 42.0375 40.9125C38.0625 46.7875 32.05 53.15 24 60Z" fill="white"/>
                                </svg>
                              </div>
                              <div 
                                className="Container" 
                                style={{ 
                                  width: '23.99px', 
                                  height: '34.17px', 
                                  paddingTop: '1px', 
                                  left: '12px', 
                                  top: '15px', 
                                  position: 'absolute', 
                                  flexDirection: 'column', 
                                  justifyContent: 'flex-start', 
                                  alignItems: 'center', 
                                  display: 'flex' 
                                }}
                              >
                                <div 
                                  className="Text" 
                                  style={{ 
                                    width: '36.06px', 
                                    height: '40px', 
                                    textAlign: 'center', 
                                    justifyContent: 'center', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    color: 'white', 
                                    fontSize: '36px', 
                                    fontFamily: 'Material Symbols Outlined', 
                                    fontWeight: 400, 
                                    lineHeight: '40px', 
                                    wordWrap: 'break-word' 
                                  }}
                                >
                                  favorite
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Typography Anchor */}
                        <div 
                          className="TypographyAnchor" 
                          style={{ 
                            flexDirection: 'column', 
                            justifyContent: 'flex-start', 
                            alignItems: 'flex-start', 
                            gap: '8px', 
                            display: 'flex' 
                          }}
                        >
                          <div 
                            className="Heading1" 
                            style={{ 
                              width: '261px', 
                              flexDirection: 'column', 
                              justifyContent: 'flex-start', 
                              alignItems: 'center', 
                              display: 'flex' 
                            }}
                          >
                            <div 
                              className="FluxoSaDe" 
                              style={{ 
                                alignSelf: 'stretch', 
                                height: '40px', 
                                textAlign: 'center', 
                                justifyContent: 'center', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                color: '#00478D', 
                                fontSize: '36px', 
                                fontFamily: 'Manrope', 
                                fontWeight: 800, 
                                lineHeight: '40px', 
                                wordWrap: 'break-word' 
                              }}
                            >
                              Fluxo Saúde
                            </div>
                          </div>
                          <div 
                            className="Container" 
                            style={{ 
                              alignSelf: 'stretch', 
                              flexDirection: 'column', 
                              justifyContent: 'flex-start', 
                              alignItems: 'center', 
                              display: 'flex' 
                            }}
                          >
                            <div 
                              className="Text" 
                              style={{ 
                                width: '179.64px', 
                                height: '20px', 
                                textAlign: 'center', 
                                justifyContent: 'center', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                color: '#424752', 
                                fontSize: '14px', 
                                fontFamily: 'Public Sans', 
                                fontWeight: 600, 
                                textTransform: 'uppercase', 
                                lineHeight: '20px', 
                                letterSpacing: '2.80px', 
                                wordWrap: 'break-word' 
                              }}
                            >
                              Feira de Santana
                            </div>
                          </div>
                          
                          {/* Dot Carousel Indicators */}
                          <div 
                            className="Container" 
                            style={{ 
                              alignSelf: 'stretch', 
                              paddingTop: '16px', 
                              justifyContent: 'center', 
                              alignItems: 'flex-start', 
                              gap: '6px', 
                              display: 'inline-flex' 
                            }}
                          >
                            <div className="Background">
                              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect opacity="0.2" width="6" height="6" rx="3" fill="#00478D"/>
                              </svg>
                            </div>
                            <div className="Background">
                              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect opacity="0.4" width="6" height="6" rx="3" fill="#00478D"/>
                              </svg>
                            </div>
                            <div className="Background">
                              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect opacity="0.2" width="6" height="6" rx="3" fill="#00478D"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section - Bottom Action Cluster */}
                      <div 
                        className="SectionBottomActionCluster" 
                        style={{ 
                          width: '100%', 
                          maxWidth: '448px', 
                          flexDirection: 'column', 
                          justifyContent: 'flex-start', 
                          alignItems: 'flex-start', 
                          gap: '16px', 
                          display: 'flex',
                          zIndex: 2
                        }}
                      >
                        {/* Button - Primary Patient CTA */}
                        <div 
                          className="ButtonPrimaryPatientCta" 
                          onClick={() => {
                            setClickedPaciente(true);
                            setTimeout(() => {
                              setClickedPaciente(false);
                              setActiveScreen('patient_home');
                              addLog('[Simulador Mobile] Acessou Portal do Paciente.');
                            }, 150);
                          }}
                          style={{ 
                            alignSelf: 'stretch', 
                            paddingLeft: '32px', 
                            paddingRight: '32px', 
                            paddingTop: '20px', 
                            paddingBottom: '20px', 
                            position: 'relative', 
                            background: 'linear-gradient(168deg, #00478D 0%, #005EB8 100%)', 
                            borderRadius: '9999px', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            display: 'inline-flex',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transform: clickedPaciente ? 'scale(0.95)' : 'scale(1)',
                            opacity: clickedPaciente ? 0.85 : 1,
                            transition: 'transform 0.1s ease, opacity 0.1s ease'
                          }}
                        >
                          <div 
                            className="ButtonPrimaryPatientCtaShadow" 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              left: 0, 
                              top: 0, 
                              position: 'absolute', 
                              background: 'rgba(255, 255, 255, 0)', 
                              boxShadow: '0px 4px 6px -4px rgba(0, 71, 141, 0.20), 0px 10px 15px -3px rgba(0, 71, 141, 0.20)', 
                              borderRadius: '9999px',
                              pointerEvents: 'none'
                            }}
                          ></div>
                          <div 
                            className="Container" 
                            style={{ 
                              justifyContent: 'flex-start', 
                              alignItems: 'center', 
                              gap: '12px', 
                              display: 'flex' 
                            }}
                          >
                            <div>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="white"/>
                              </svg>
                            </div>
                            <div 
                              className="Text" 
                              style={{ 
                                height: '24px', 
                                textAlign: 'center', 
                                justifyContent: 'center', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                color: 'white', 
                                fontSize: '16px', 
                                fontFamily: 'Manrope', 
                                fontWeight: 700, 
                                lineHeight: '24px', 
                                wordWrap: 'break-word' 
                              }}
                            >
                              SOU PACIENTE
                            </div>
                          </div>
                          <div>
                            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="white"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Button - Secondary Professional CTA */}
                        <div 
                          className="ButtonSecondaryProfessionalCta" 
                          onClick={() => {
                            setClickedProfissional(true);
                            setTimeout(() => {
                              setClickedProfissional(false);
                              setActiveScreen('professional_env_select');
                              addLog('[Simulador Mobile] Acessou Acesso Profissional.');
                            }, 150);
                          }}
                          style={{ 
                            alignSelf: 'stretch', 
                            paddingLeft: '32px', 
                            paddingRight: '32px', 
                            paddingTop: '20px', 
                            paddingBottom: '20px', 
                            background: clickedProfissional ? '#F1F5F9' : 'white', 
                            borderRadius: '9999px', 
                            outline: '2px rgba(0, 71, 141, 0.10) solid', 
                            outlineOffset: '-2px', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            display: 'inline-flex',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transform: clickedProfissional ? 'scale(0.95)' : 'scale(1)',
                            transition: 'transform 0.1s ease, background 0.1s ease'
                          }}
                        >
                          <div 
                            className="Container" 
                            style={{ 
                              justifyContent: 'flex-start', 
                              alignItems: 'center', 
                              gap: '12px', 
                              display: 'flex' 
                            }}
                          >
                            <div>
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2ZM2 18H18V6H2V18ZM8 4H12V2H8V4ZM2 18V6V18ZM9 13V16H11V13H14V11H11V8H9V11H6V13H9Z" fill="#00478D"/>
                              </svg>
                            </div>
                            <div 
                              className="Text" 
                              style={{ 
                                height: '24px', 
                                textAlign: 'center', 
                                justifyContent: 'center', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                color: '#00478D', 
                                fontSize: '16px', 
                                fontFamily: 'Manrope', 
                                fontWeight: 700, 
                                lineHeight: '24px', 
                                wordWrap: 'break-word' 
                              }}
                            >
                              SOU PROFISSIONAL
                            </div>
                          </div>
                          <div>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="#00478D" fillOpacity={0.4}/>
                            </svg>
                          </div>
                        </div>
                        
                        <div 
                          className="Container" 
                          style={{ 
                            alignSelf: 'stretch', 
                            paddingTop: '24px', 
                            flexDirection: 'column', 
                            justifyContent: 'flex-start', 
                            alignItems: 'center', 
                            display: 'flex' 
                          }}
                        >
                          <div 
                            className="Text" 
                            style={{ 
                              textAlign: 'center', 
                              justifyContent: 'center', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              color: 'rgba(66, 71, 82, 0.60)', 
                              fontSize: '12px', 
                              fontFamily: 'Public Sans', 
                              fontWeight: 400, 
                              lineHeight: '16px', 
                              wordWrap: 'break-word' 
                            }}
                          >
                            ©Fluxo Saúde — Gestão Inteligente de Fluxos
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCREEN 2: Professional Login (Acesso do Funcionário / Admin) */}
                {activeScreen === 'professional_env_select' && (
                  <div className="screen-professional-env">
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('welcome')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">ACESSO</span>
                      </div>
                      <span className="phone-nav-badge" style={{ backgroundColor: 'rgba(0, 86, 179, 0.1)', color: 'var(--color-primary)' }}>PORTAL</span>
                    </div>

                    <div className="screen-inner-content">
                      <div className="prof-greeting-block">
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--mobile-text)' }}>Área do Funcionário</h3>
                        <p style={{ fontSize: '0.68rem', lineHeight: '1.4', marginTop: '6px', color: 'var(--color-text-muted)' }}>
                          Identifique-se com suas credenciais de acesso clínico para gerenciar leitos e fluxos.
                        </p>
                      </div>

                      <form onSubmit={handleLoginSubmit} className="app-wizard-form" style={{ marginTop: '20px' }}>
                        <div className="form-group-block">
                          <label>CPF ou Login Admin</label>
                          <input 
                            type="text" 
                            placeholder="Apenas números ou 'admin'" 
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          />
                        </div>

                        <div className="form-group-block">
                          <label>Senha</label>
                          <input 
                            type="password" 
                            placeholder="Sua senha de acesso" 
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          />
                        </div>

                        {loginError && (
                          <div style={{ color: 'var(--color-danger)', fontSize: '0.68rem', fontWeight: '800', marginTop: '4px', backgroundColor: 'var(--color-danger-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-danger-border)' }}>
                            ⚠️ {loginError}
                          </div>
                        )}

                        <button type="submit" className="btn-welcome-primary" style={{ marginTop: '16px' }}>
                          Acessar Painel
                          <ArrowRight style={{ width: '16px', height: '16px' }} />
                        </button>
                      </form>

                      {/* FAST LOGIN HELPERS FOR TESTING */}
                      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1.5px solid var(--mobile-border)' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Acesso Rápido de Teste:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button 
                            className="btn-welcome-secondary" 
                            style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.65rem', justifyContent: 'flex-start', border: '1px solid var(--mobile-border)' }}
                            onClick={() => setLoginForm({ username: '12345678900', password: '12345678' })}
                          >
                            🩺 <strong>Médico:</strong> CPF 123.456.789-00 (senha: 12345678)
                          </button>
                          <button 
                            className="btn-welcome-secondary" 
                            style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.65rem', justifyContent: 'flex-start', border: '1px solid var(--mobile-border)' }}
                            onClick={() => setLoginForm({ username: '98765432100', password: '87654321' })}
                          >
                            📋 <strong>Recepção:</strong> CPF 987.654.321-00 (senha: 87654321)
                          </button>
                          <button 
                            className="btn-welcome-secondary" 
                            style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.65rem', justifyContent: 'flex-start', border: '1px solid var(--mobile-border)', color: '#D97706' }}
                            onClick={() => setLoginForm({ username: 'admin', password: 'adm123' })}
                          >
                            ⚡ <strong>Admin Geral:</strong> admin / adm123
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item active" onClick={() => setActiveScreen('welcome')}>
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item" onClick={() => setModalData({
                        title: 'Acesso de Funcionário',
                        content: (
                          <div style={{ fontSize: '0.78rem', lineHeight: '1.6', color: 'var(--mobile-text)' }}>
                            <p style={{ margin: 0 }}>Para obter as suas credenciais profissionais e de plantão, por favor dirija-se à sala de administração ou procure o Administrador Geral do seu setor.</p>
                            <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Suporte Técnico: (75) 3600-0000</p>
                          </div>
                        )
                      })}>
                        <Info style={{ width: '16px', height: '16px' }} /> CREDENCIAIS
                      </span>
                    </div>
                  </div>
                )}

                {/* SCREEN 2.5: Professional Admin Dashboard (Gerenciamento de Logins do Sistema) */}
                {activeScreen === 'professional_admin' && (
                  <div className="screen-professional-env">
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('professional_env_select')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">PAINEL ADMIN</span>
                      </div>
                      <span className="phone-nav-badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>GERENCIAL</span>
                    </div>

                    <div className="screen-inner-content">
                      <div className="prof-greeting-block" style={{ marginTop: '12px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mobile-text)' }}>Cadastrar Acesso</h3>
                        <p style={{ fontSize: '0.68rem', lineHeight: '1.4', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                          Registre funcionários clínicos ou de atendimento e gere a senha aleatória de 8 dígitos de forma instantânea.
                        </p>
                      </div>

                      <form onSubmit={handleCreateStaff} className="app-wizard-form" style={{ marginTop: '16px' }}>
                        <div className="form-group-block">
                          <label>Nome Completo</label>
                          <input 
                            type="text" 
                            placeholder="Ex: Dra. Luciana Peixoto" 
                            value={adminForm.name}
                            onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                          />
                        </div>

                        <div className="symptoms-selector-grid" style={{ gap: '10px' }}>
                          <div className="form-group-block">
                            <label>CPF (11 dígitos)</label>
                            <input 
                              type="text" 
                              maxLength="11"
                              placeholder="Apenas números" 
                              value={adminForm.cpf}
                              onChange={(e) => setAdminForm({ ...adminForm, cpf: e.target.value })}
                            />
                          </div>

                          <div className="form-group-block">
                            <label>Perfil de Acesso</label>
                            <select 
                              value={adminForm.role}
                              onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                            >
                              <option value="clinical">Corpo Clínico</option>
                              <option value="flow">Controle de Fluxo</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group-block">
                          <label>Unidade de Trabalho</label>
                          <select
                            value={adminForm.unitId || 'mangabeira'}
                            onChange={(e) => setAdminForm({ ...adminForm, unitId: e.target.value })}
                          >
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>

                        <button type="submit" className="btn-welcome-primary" style={{ marginTop: '12px', background: '#D97706' }}>
                          Gerar Senha e Acesso
                        </button>
                      </form>

                      {/* LAST GENERATED ACCESSS BANNER */}
                      {lastGeneratedStaff && (
                        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: '#FEF3C7', border: '1.5px dashed #D97706', color: '#78350F' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', color: '#D97706', display: 'block', marginBottom: '6px' }}>Acesso Criado com Sucesso:</span>
                          <div style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div>👤 <strong>Nome:</strong> {lastGeneratedStaff.name}</div>
                            <div>🔑 <strong>Login (CPF):</strong> {lastGeneratedStaff.cpf}</div>
                            <div style={{ marginTop: '6px', padding: '8px', borderRadius: '8px', background: '#FFFDF5', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Senha Provisória:</span>
                              <strong style={{ fontSize: '0.95rem', color: '#D97706', letterSpacing: '0.05em' }}>{lastGeneratedStaff.password}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STAFF LIST FOR EASY TESTING */}
                      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1.5px solid var(--mobile-border)' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Funcionários Cadastrados ({staffMembers.length}):</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {staffMembers.map((staff, idx) => {
                            const staffUnit = units.find(u => u.id === staff.unitId);
                            return (
                              <div 
                                key={idx} 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid var(--mobile-border)' }}
                              >
                                <div>
                                  <strong style={{ fontSize: '0.72rem', color: 'var(--mobile-text)', display: 'block' }}>{staff.name}</strong>
                                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                                    {staff.role === 'clinical' ? '🩺 Clínico' : '📋 Fluxo'}
                                  </span>
                                  {staffUnit && (
                                    <span style={{ fontSize: '0.58rem', color: 'var(--color-primary)', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                                      🏥 {staffUnit.name}
                                    </span>
                                  )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-primary)', background: 'var(--color-primary-bg)', padding: '3px 8px', borderRadius: '6px' }}>
                                    {staff.password}
                                  </div>
                                  <div style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>CPF: {staff.cpf}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item active">
                        <Activity style={{ width: '16px', height: '16px' }} /> ADMIN
                      </span>
                      <span className="tab-bar-item" onClick={() => { setActiveScreen('professional_env_select'); addLog('[Admin] Logout do painel gerencial.'); }}>
                        <LogOut style={{ width: '16px', height: '16px' }} /> SAIR
                      </span>
                    </div>
                  </div>
                )}

                {/* SCREEN 3: Professional - Reception Flow Control (Controle de Fluxo - Atendente) */}
                {activeScreen === 'professional_flow_control' && (
                  <div className="screen-flow-control">
                    <div className="screen-inner-content">
                      <div className="prof-header-row">
                        <div className="prof-header-left">
                          <div className="prof-header-avatar">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Carlos Costa" />
                          </div>
                          <div className="prof-header-meta">
                            <h4>{currentUser?.name || 'Carlos Costa'}</h4>
                            <p>Recepção | {getProfUnit()?.name || 'Unidade'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {flowSuccessMsg && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
                          ✓ {flowSuccessMsg}
                        </div>
                      )}

                      <div className="flow-title-block" style={{ marginBottom: '20px' }}>
                        <h3>Controle de Fluxo</h3>
                        <p>Selecione o estado atual de lotação para informar o público em tempo real.</p>
                      </div>

                      {/* Negócio mostrando o estado atual */}
                      <div className="current-status-display" style={{ 
                        alignSelf: 'stretch', 
                        background: '#FFFFFF', 
                        border: '1px solid #E2E8F0', 
                        borderRadius: '16px', 
                        padding: '12px 18px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '24px',
                        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)'
                      }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748B', letterSpacing: '0.05em', fontFamily: 'Manrope' }}>STATUS DE LOTAÇÃO ATUAL:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="pulse-indicator" style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '9999px', 
                            background: getProfUnit().status === 'BAIXO' ? '#10B981' : getProfUnit().status === 'MÉDIO' ? '#F59E0B' : '#F43F5E',
                            display: 'inline-block',
                            boxShadow: getProfUnit().status === 'BAIXO' ? '0px 0px 8px rgba(16, 185, 129, 0.6)' : getProfUnit().status === 'MÉDIO' ? '0px 0px 8px rgba(245, 158, 11, 0.6)' : '0px 0px 8px rgba(244, 63, 94, 0.6)'
                          }}></span>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: '800', 
                            textTransform: 'uppercase',
                            padding: '4px 12px', 
                            borderRadius: '9999px',
                            fontFamily: 'Manrope',
                            color: getProfUnit().status === 'BAIXO' ? '#064E3B' : getProfUnit().status === 'MÉDIO' ? '#78350F' : '#881337',
                            background: getProfUnit().status === 'BAIXO' ? '#ECFDF5' : getProfUnit().status === 'MÉDIO' ? '#FFFBEB' : '#FFF1F2',
                            border: getProfUnit().status === 'BAIXO' ? '1px solid #D1FAE5' : getProfUnit().status === 'MÉDIO' ? '1px solid #FDE68A' : '1px solid #FFE4E6'
                          }}>
                            {getProfUnit().status}
                          </span>
                        </div>
                      </div>

                      <div className="StatusCards" style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px', display: 'inline-flex', width: '100%', marginTop: '8px' }}>
                        
                        {/* Green Card (Low) */}
                        <div 
                          className="ButtonGreenCardLow" 
                          onClick={() => setPendingStatus('BAIXO')}
                          style={{ 
                            alignSelf: 'stretch', 
                            padding: '12px 20px', 
                            background: '#ECFDF5', 
                            borderRadius: '16px', 
                            outline: '2px #D1FAE5 solid', 
                            outlineOffset: '-2px', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            display: 'inline-flex',
                            cursor: 'pointer',
                            userSelect: 'none',
                            position: 'relative',
                            boxShadow: (pendingStatus ?? getProfUnit().status) === 'BAIXO' ? '0px 0px 0px 6px #00478D, 0px 0px 0px 3px white' : 'none',
                            transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                            transform: (pendingStatus ?? getProfUnit().status) === 'BAIXO' ? 'scale(0.98)' : 'scale(1)'
                          }}
                        >
                          <div className="Container" style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '12px', display: 'flex' }}>
                            <div className="Background" style={{ width: '36px', height: '36px', background: '#10B981', borderRadius: '9999px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.6 14.6L15.65 7.55L14.25 6.15L8.6 11.8L5.75 8.95L4.35 10.35L8.6 14.6ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="white"/>
                              </svg>
                            </div>
                            <div className="Container" style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '2px', display: 'inline-flex' }}>
                              <div className="Heading4" style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                                <div className="Text" style={{ height: '16px', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#064E3B', fontSize: '15px', fontFamily: 'Manrope', fontWeight: 700, textTransform: 'uppercase', lineHeight: '16px', letterSpacing: '0.45px', wordWrap: 'break-word' }}>BAIXO</div>
                              </div>
                              <div className="Container" style={{ alignSelf: 'stretch', opacity: 0.80, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                                <div className="Text" style={{ height: '16px', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#047857', fontSize: '12px', fontFamily: 'Public Sans', fontWeight: 600, lineHeight: '16px', wordWrap: 'break-word' }}>&lt; 1h de espera</div>
                              </div>
                            </div>
                          </div>
                          {(pendingStatus ?? getProfUnit().status) === 'BAIXO' && (
                            <div className="Background" style={{ width: '24px', height: '24px', position: 'relative', background: '#00478D', borderRadius: '9999px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                              <div className="Container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <svg width="10" height="8" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4.75 10.0208L0 5.27083L1.1875 4.08333L4.75 7.64583L12.3958 0L13.5833 1.1875L4.75 10.0208Z" fill="white"/>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Yellow Card (Medium) */}
                        <div 
                          className="ButtonYellowCardMedium" 
                          onClick={() => setPendingStatus('MÉDIO')}
                          style={{ 
                            alignSelf: 'stretch', 
                            padding: '12px 20px', 
                            background: '#FFFBEB', 
                            borderRadius: '16px', 
                            outline: '2px #FDE68A solid', 
                            outlineOffset: '-2px', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            display: 'inline-flex',
                            cursor: 'pointer',
                            userSelect: 'none',
                            position: 'relative',
                            boxShadow: (pendingStatus ?? getProfUnit().status) === 'MÉDIO' ? '0px 0px 0px 6px #00478D, 0px 0px 0px 3px white' : 'none',
                            transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                            transform: (pendingStatus ?? getProfUnit().status) === 'MÉDIO' ? 'scale(0.98)' : 'scale(1)'
                          }}
                        >
                          <div className="Container" style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '12px', display: 'flex' }}>
                            <div className="Background" style={{ width: '36px', height: '36px', background: '#F59E0B', borderRadius: '9999px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.3 14.7L14.7 13.3L11 9.6V5H9V10.4L13.3 14.7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="white"/>
                              </svg>
                            </div>
                            <div className="Container" style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '2px', display: 'inline-flex' }}>
                              <div className="Heading4" style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                                <div className="Text" style={{ height: '16px', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#78350F', fontSize: '15px', fontFamily: 'Manrope', fontWeight: 700, textTransform: 'uppercase', lineHeight: '16px', letterSpacing: '0.45px', wordWrap: 'break-word' }}>MÉDIO</div>
                              </div>
                              <div className="Container" style={{ alignSelf: 'stretch', opacity: 0.80, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                                <div className="Text" style={{ height: '16px', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#B45309', fontSize: '12px', fontFamily: 'Public Sans', fontWeight: 600, lineHeight: '16px', wordWrap: 'break-word' }}>1-3h de espera</div>
                              </div>
                            </div>
                          </div>
                          {(pendingStatus ?? getProfUnit().status) === 'MÉDIO' && (
                            <div className="Background" style={{ width: '24px', height: '24px', position: 'relative', background: '#00478D', borderRadius: '9999px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                              <div className="Container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <svg width="10" height="8" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4.75 10.0208L0 5.27083L1.1875 4.08333L4.75 7.64583L12.3958 0L13.5833 1.1875L4.75 10.0208Z" fill="white"/>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Red Card (High) */}
                        <div 
                          className="ButtonRedCardHigh" 
                          onClick={() => setPendingStatus('ALTO')}
                          style={{ 
                            alignSelf: 'stretch', 
                            padding: '12px 20px', 
                            background: '#FFF1F2', 
                            borderRadius: '16px', 
                            outline: '2px #FFE4E6 solid', 
                            outlineOffset: '-2px', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            display: 'inline-flex',
                            cursor: 'pointer',
                            userSelect: 'none',
                            position: 'relative',
                            boxShadow: (pendingStatus ?? getProfUnit().status) === 'ALTO' ? '0px 0px 0px 6px #00478D, 0px 0px 0px 3px white' : 'none',
                            transition: 'box-shadow 0.2s ease, transform 0.1s ease',
                            transform: (pendingStatus ?? getProfUnit().status) === 'ALTO' ? 'scale(0.98)' : 'scale(1)'
                          }}
                        >
                          <div className="Container" style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '12px', display: 'flex' }}>
                            <div className="Background" style={{ width: '36px', height: '36px', background: '#F43F5E', borderRadius: '9999px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                              <svg width="18" height="16" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 19L11 0L22 19H0ZM3.45 17H18.55L11 4L3.45 17ZM11 16C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14C10.7167 14 10.4792 14.0958 10.2875 14.2875C10.0958 14.4792 10 14.7167 10 15C10 15.2833 10.0958 15.5208 10.2875 15.7125C10.4792 15.9042 10.7167 16 11 16ZM10 13H12V8H10V13Z" fill="white"/>
                              </svg>
                            </div>
                            <div className="Container" style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '2px', display: 'inline-flex' }}>
                              <div className="Heading4" style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                                <div className="Text" style={{ height: '16px', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#881337', fontSize: '15px', fontFamily: 'Manrope', fontWeight: 700, textTransform: 'uppercase', lineHeight: '16px', letterSpacing: '0.45px', wordWrap: 'break-word' }}>ALTO</div>
                              </div>
                              <div className="Container" style={{ alignSelf: 'stretch', opacity: 0.80, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                                <div className="Text" style={{ height: '16px', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#BE123C', fontSize: '12px', fontFamily: 'Public Sans', fontWeight: 600, lineHeight: '16px', wordWrap: 'break-word' }}>&gt; 3h de espera</div>
                              </div>
                            </div>
                          </div>
                          {(pendingStatus ?? getProfUnit().status) === 'ALTO' && (
                            <div className="Background" style={{ width: '24px', height: '24px', position: 'relative', background: '#00478D', borderRadius: '9999px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                              <div className="Container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <svg width="10" height="8" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4.75 10.0208L0 5.27083L1.1875 4.08333L4.75 7.64583L12.3958 0L13.5833 1.1875L4.75 10.0208Z" fill="white"/>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* CTA Button */}
                      <div 
                        className="CtaButton" 
                        onClick={async () => {
                          if (!pendingStatus) {
                            setFlowSuccessMsg('Selecione um nível de lotação primeiro!');
                            setTimeout(() => setFlowSuccessMsg(''), 2000);
                            return;
                          }
                          setClickedUpdatePanel(true);
                          const minutesMap = { 'BAIXO': 12, 'MÉDIO': 30, 'ALTO': 115 };
                          await handleUpdateUnitWaitTime(currentProfessionalUnit, minutesMap[pendingStatus]);
                          setPendingStatus(null);
                          addLog('[Atendente] Status de lotação atualizado no painel público.');
                          setFlowSuccessMsg('✓ Painel Público Atualizado!');
                          setTimeout(() => {
                            setFlowSuccessMsg('');
                            setClickedUpdatePanel(false);
                          }, 2500);
                        }}
                        style={{ 
                          alignSelf: 'stretch', 
                          paddingTop: '16px', 
                          paddingBottom: '16px', 
                          position: 'relative', 
                          background: 'linear-gradient(90deg, #00478D 0%, #005EB8 100%)', 
                          borderRadius: '9999px', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '8px', 
                          display: 'inline-flex',
                          width: '100%',
                          marginTop: '24px',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transform: clickedUpdatePanel ? 'scale(0.96)' : 'scale(1)',
                          transition: 'transform 0.1s ease',
                          boxShadow: '0px 4px 6px -4px rgba(0, 0, 0, 0.10), 0px 10px 15px -3px rgba(0, 0, 0, 0.10)'
                        }}
                      >
                        <div className="Container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 16V14H2.75L2.35 13.65C1.48333 12.8833 0.875 12.0083 0.525 11.025C0.175 10.0417 0 9.05 0 8.05C0 6.2 0.554167 4.55417 1.6625 3.1125C2.77083 1.67083 4.21667 0.716667 6 0.25V2.35C4.8 2.78333 3.83333 3.52083 3.1 4.5625C2.36667 5.60417 2 6.76667 2 8.05C2 8.8 2.14167 9.52917 2.425 10.2375C2.70833 10.9458 3.15 11.6 3.75 12.2L4 12.45V10H6V16H0ZM10 15.75V13.65C11.2 13.2167 12.1667 12.4792 12.9 11.4375C13.6333 10.3958 14 9.23333 14 7.95C14 7.2 13.8583 6.47083 13.5 5.7625C13.2 5.05 12.85 4.4 12.25 3.8L12 3.55V6H10V0H16V2H13.25L13.65 2.35C14.4667 3.16667 15.0625 4.05417 15.4375 5.0125C15.8125 5.97083 16 6.95 16 7.95C16 9.8 15.4458 11.4458 14.3375 12.8875C13.2292 14.3292 11.7833 15.2833 10 15.75Z" fill="white"/>
                          </svg>
                          <div className="Text" style={{ height: '16px', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'white', fontSize: '13px', fontFamily: 'Manrope', fontWeight: 700, textTransform: 'uppercase', lineHeight: '16px', letterSpacing: '1.40px', wordWrap: 'break-word' }}>ATUALIZAR PAINEL PÚBLICO</div>
                        </div>
                      </div>
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item active">
                        <Layers style={{ width: '16px', height: '16px' }} /> FLUXO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_env_select')}>
                        <LogOut style={{ width: '16px', height: '16px' }} /> SAIR
                      </span>
                    </div>
                  </div>
                )}

                {/* SCREEN 4: Professional - Clinical Dashboard (Dashboard Profissional - Simplificado) */}
                {activeScreen === 'professional_dashboard' && (
                  <div className="screen-professional-dashboard">
                    <div className="screen-inner-content">
                      <div className="prof-header-row">
                        <div className="prof-header-left">
                          <div className="prof-header-avatar">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" alt="Ana Silva" />
                          </div>
                          <div className="prof-header-meta">
                            <h4>{currentUser?.name || 'Plantonista Ana Silva'}</h4>
                            <p>Corpo Clínico | {getProfUnit()?.name || 'Unidade'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="prof-featured-panel">
                        <span className="prof-featured-tag">PAINEL DO SETOR</span>
                        <h4 className="prof-featured-title">{getProfUnit()?.name || 'Unidade'}</h4>
                        <p className="prof-featured-desc">Controle em tempo real de ocupação de leitos de isolamento e criticidades sob regulação direta.</p>
                      </div>

                      <div className="prof-quick-actions">
                        <div 
                          className="action-row-card"
                          onClick={() => {
                            setActiveScreen('professional_new_handover');
                            addLog('[Simulador Mobile] Abriu Nova Passagem de Plantão.');
                          }}
                        >
                          <div className="action-row-left">
                            <div className="action-icon-box">
                              <Plus style={{ width: '15px', height: '15px' }} />
                            </div>
                            <div className="action-text-wrap">
                              <span className="action-text-title">NOVA PASSAGEM DE PLANTÃO</span>
                              <span className="action-text-sub">Ficha clínica rápida de caso</span>
                            </div>
                          </div>
                          <ChevronRight style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                        </div>

                        <div 
                          className="action-row-card"
                          onClick={() => {
                            setActiveScreen('professional_handover_history');
                            addLog('[Simulador Mobile] Abriu Histórico de Casos.');
                          }}
                        >
                          <div className="action-row-left">
                            <div className="action-icon-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                              <ClipboardList style={{ width: '15px', height: '15px' }} />
                            </div>
                            <div className="action-text-wrap">
                              <span className="action-text-title">VER HISTÓRICO DE CASOS</span>
                              <span className="action-text-sub">Consultar prontuários passados</span>
                            </div>
                          </div>
                          <ChevronRight style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                        </div>
                      </div>

                      {/* FILA DE TRIAGEM DIGITAL */}
                      {(() => {
                        const unitCheckins = digitalCheckins.filter(chk => chk.unitName === getProfUnit().name);
                        const pendingCheckins = unitCheckins.filter(chk => chk.status === 'Pendente');
                        return (
                          <div className="prof-greeting-block" style={{ marginTop: '24px' }}>
                            <h4 style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                              🩺 PRÉ CHECK-INS PENDENTES ({pendingCheckins.length})
                            </h4>
                            {pendingCheckins.length === 0 ? (
                              <div style={{ background: '#FFFFFF', border: '1px solid var(--mobile-border)', borderRadius: '12px', padding: '14px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                Nenhum pré check-in aguardando triagem.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {pendingCheckins.map(chk => (
                                  <div 
                                    key={chk.id} 
                                    className="action-row-card"
                                    onClick={() => {
                                      setSelectedTriageCheckin(chk);
                                      setSelectedTriageUrgency('Verde');
                                      setTriageNotes('');
                                    }}
                                    style={{ cursor: 'pointer', padding: '10px 12px', background: '#FFFFFF', border: '1px solid var(--mobile-border)', flexDirection: 'column', alignItems: 'stretch' }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <strong style={{ fontSize: '0.75rem', color: 'var(--mobile-text)' }}>{chk.name}</strong>
                                      <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: '800', background: 'var(--color-primary-bg)', padding: '2px 6px', borderRadius: '4px' }}>{chk.code}</span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                      <strong>Sintomas:</strong> {chk.symptom}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--mobile-border)' }}>
                                      <span>CPF: {maskCpf(chk.cpf)}</span>
                                      <span>⏱ {chk.time}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="prof-greeting-block" style={{ marginTop: '24px' }}>
                        <h4 style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <TrendingUp style={{ width: '12px', height: '12px', color: 'var(--color-primary)' }} /> RESUMO OPERACIONAL DO DIA
                        </h4>
                        <div className="prof-summary-grid">
                          <div className="summary-stat-card">
                            <span className="summary-stat-val primary">{getProfUnit().todayCheckins}</span>
                            <span className="summary-stat-lbl">ATENDIMENTOS</span>
                          </div>
                          <div className="summary-stat-card">
                            <span className="summary-stat-val">{getProfUnit().occupiedBeds}/12</span>
                            <span className="summary-stat-lbl">LEITOS EM USO</span>
                          </div>
                          <div className="summary-stat-card">
                            <span className="summary-stat-val">{getProfUnit().doctorsCount}</span>
                            <span className="summary-stat-lbl">MÉDICOS DE PLANTÃO</span>
                          </div>
                          <div className="summary-stat-card">
                            <span className="summary-stat-val danger">{getProfUnit().criticalCases}</span>
                            <span className="summary-stat-lbl">CASOS CRÍTICOS</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item active">
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item" onClick={() => {
                        setActiveScreen('professional_bed_management');
                        addLog('[Simulador Mobile] Acessou painel de Leitos.');
                      }}>
                        <Layers style={{ width: '16px', height: '16px' }} /> LEITOS
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_handover_history')}>
                        <FileText style={{ width: '16px', height: '16px' }} /> PLANTÃO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_env_select')}>
                        <LogOut style={{ width: '16px', height: '16px' }} /> SAIR
                      </span>
                    </div>
                  </div>
                )}

                {/* SCREEN 5: Professional - Bed Sector Management */}
                {activeScreen === 'professional_bed_management' && (
                  <div className="screen-bed-management" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('professional_dashboard')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">GESTÃO DE SETOR</span>
                      </div>
                      <span className="phone-nav-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                        {beds.filter(b => b.unitId === (currentUser?.unitId || 'mangabeira')).length} LEITOS
                      </span>
                    </div>

                    {/* Tab switcher */}
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', flexShrink: 0 }}>
                      <button type="button" onClick={() => setBedMgmtTab('beds')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: bedMgmtTab === 'beds' ? '#FFFFFF' : 'transparent', fontWeight: bedMgmtTab === 'beds' ? '800' : '600', fontSize: '0.68rem', cursor: 'pointer', color: bedMgmtTab === 'beds' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: bedMgmtTab === 'beds' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: 'Manrope', transition: 'all 0.15s' }}>
                        🛏 LEITOS
                      </button>
                      <button type="button" onClick={() => setBedMgmtTab('triage')} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: bedMgmtTab === 'triage' ? '#FFFFFF' : 'transparent', fontWeight: bedMgmtTab === 'triage' ? '800' : '600', fontSize: '0.68rem', cursor: 'pointer', color: bedMgmtTab === 'triage' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: bedMgmtTab === 'triage' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', fontFamily: 'Manrope', transition: 'all 0.15s' }}>
                        🏥 TRIAGEM {(() => { const n = digitalCheckins.filter(c => c.unitName === getProfUnit()?.name && (c.status === 'Pendente' || c.status === 'Triado')).length; return n > 0 ? `(${n})` : ''; })()}
                      </button>
                    </div>

                    <div className="screen-inner-content">
                      {bedMgmtTab === 'beds' ? (
                        <>
                          <div className="bed-screen-grid">
                            {beds.filter(bed => bed.unitId === (currentUser?.unitId || 'mangabeira')).map(bed => (
                              <div
                                key={bed.id}
                                className={`bed-card-item status-${bed.status} ${selectedBedId === bed.id ? 'selected' : ''}`}
                                onClick={() => setSelectedBedId(prev => prev === bed.id ? null : bed.id)}
                              >
                                <div className="bed-card-header">
                                  <span className="bed-card-lbl">{bed.label}</span>
                                  <span className={`bed-card-status-badge ${bed.status}`}>{bed.status === 'free' ? 'LIVRE' : bed.status === 'observation' ? 'OBS' : 'CRÍTICO'}</span>
                                </div>
                                <h5 className="bed-card-patient">{bed.patientName}</h5>
                                <span className="bed-card-time">{bed.status === 'free' ? 'Higienizado' : `Admitido: ${bed.time}`}</span>
                              </div>
                            ))}
                          </div>

                          {selectedBedId && (
                            <div className="bed-editor-box">
                              <div className="bed-editor-top">
                                <span className="bed-editor-title">Editar: {beds.find(b => b.id === selectedBedId)?.label}</span>
                                <button className="btn-bed-editor-close" onClick={() => setSelectedBedId(null)}>Fechar</button>
                              </div>
                              <div className="bed-editor-btn-grid">
                                <button className="btn-bed-status free" onClick={() => handleBedStatusUpdate(selectedBedId, 'free')}>Livre</button>
                                <button className="btn-bed-status observation" onClick={() => handleBedStatusUpdate(selectedBedId, 'observation')}>Obs</button>
                                <button className="btn-bed-status critical" onClick={() => handleBedStatusUpdate(selectedBedId, 'critical')}>Crítico</button>
                              </div>
                              <button
                                onClick={() => handleDeleteBed(selectedBedId)}
                                style={{ marginTop: '8px', width: '100%', padding: '8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'Manrope' }}
                              >🗑 Excluir Este Leito</button>
                            </div>
                          )}

                          <div style={{ marginTop: '16px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1.5px dashed var(--mobile-border)' }}>
                            <p style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Adicionar Novo Leito</p>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Ex: Leito 13"
                                value={newBedLabel}
                                onChange={e => setNewBedLabel(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddBed()}
                                style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--mobile-border)', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'Manrope', outline: 'none' }}
                              />
                              <button onClick={handleAddBed} style={{ padding: '10px 16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Manrope' }}>+</button>
                            </div>
                          </div>

                          <button
                            className="btn-welcome-primary"
                            style={{ marginTop: '16px' }}
                            onClick={() => { setActiveScreen('professional_new_handover'); addLog('[Simulador Mobile] Direcionado para passagem de leito.'); }}
                          >REMANEJAR PLANTÃO DO SETOR</button>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {digitalCheckins.filter(c => c.unitName === getProfUnit()?.name && c.status !== 'Internado').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                              <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0 0 4px 0' }}>✅ Fila vazia</p>
                              <p style={{ fontSize: '0.7rem', margin: 0 }}>Nenhum paciente aguardando triagem.</p>
                            </div>
                          ) : digitalCheckins
                              .filter(c => c.unitName === getProfUnit()?.name && c.status !== 'Internado')
                              .sort((a, b) => {
                                const statusOrder = { 'Pendente': 0, 'Triado': 1 };
                                const urgOrder = { 'Vermelho': 0, 'Laranja': 1, 'Amarelo': 2, 'Verde': 3, 'Azul': 4 };
                                if (a.status !== b.status) return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
                                return (urgOrder[a.urgencyLevel] ?? 5) - (urgOrder[b.urgencyLevel] ?? 5);
                              })
                              .map(chk => {
                                const urgColors = {
                                  'Vermelho': { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
                                  'Laranja':  { bg: '#FFEDD5', text: '#9A3412', border: '#FED7AA' },
                                  'Amarelo':  { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' },
                                  'Verde':    { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
                                  'Azul':     { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
                                };
                                const uc = urgColors[chk.urgencyLevel] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
                                const isPending = chk.status === 'Pendente';
                                return (
                                  <div key={chk.id} style={{ padding: '12px', background: '#FFFFFF', borderRadius: '12px', border: `1.5px solid ${isPending ? '#E2E8F0' : uc.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div>
                                        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '800', color: 'var(--mobile-text)' }}>{chk.name}</p>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{chk.code} · {chk.time}</p>
                                      </div>
                                      <span style={{ fontSize: '0.55rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: isPending ? '#FEF9C3' : uc.bg, color: isPending ? '#854D0E' : uc.text, textTransform: 'uppercase', flexShrink: 0, marginLeft: '6px' }}>
                                        {isPending ? 'PENDENTE' : chk.urgencyLevel}
                                      </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)', background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px' }}>{chk.symptom || 'Triagem geral'}</p>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {isPending ? (
                                        <button onClick={() => { setSelectedTriageCheckin(chk); setSelectedTriageUrgency('Verde'); setTriageNotes(''); }} style={{ flex: 1, padding: '8px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.68rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Manrope' }}>
                                          🩺 Realizar Triagem
                                        </button>
                                      ) : (
                                        <>
                                          <button onClick={() => { setSelectedTriageCheckin(chk); setSelectedTriageUrgency(chk.urgencyLevel || 'Verde'); setTriageNotes(chk.triageNotes || ''); }} style={{ flex: 1, padding: '8px', background: '#F1F5F9', color: 'var(--mobile-text)', border: '1px solid var(--mobile-border)', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'Manrope' }}>
                                            ✏️ Reclassificar
                                          </button>
                                          <button onClick={() => setBedAssignCheckinId(bedAssignCheckinId === chk.id ? null : chk.id)} style={{ flex: 1, padding: '8px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Manrope' }}>
                                            🛏 Encaminhar
                                          </button>
                                        </>
                                      )}
                                    </div>
                                    {bedAssignCheckinId === chk.id && (
                                      <div style={{ padding: '10px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                                        <p style={{ margin: '0 0 6px 0', fontSize: '0.62rem', fontWeight: '800', color: '#166534' }}>Selecione um leito livre:</p>
                                        {beds.filter(b => b.unitId === (currentUser?.unitId || 'mangabeira') && b.status === 'free').length === 0 ? (
                                          <p style={{ margin: 0, fontSize: '0.65rem', color: '#DC2626', fontWeight: '700' }}>⚠️ Nenhum leito livre disponível.</p>
                                        ) : (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {beds.filter(b => b.unitId === (currentUser?.unitId || 'mangabeira') && b.status === 'free').map(b => (
                                              <button key={b.id} onClick={() => handleAssignCheckinToBed(chk.id, b.id)} style={{ padding: '6px 12px', background: '#FFFFFF', color: '#166534', border: '1.5px solid #86EFAC', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'Manrope' }}>{b.label}</button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                          }
                        </div>
                      )}
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_dashboard')}>
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item active">
                        <Layers style={{ width: '16px', height: '16px' }} /> LEITOS
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_handover_history')}>
                        <FileText style={{ width: '16px', height: '16px' }} /> PLANTÃO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_env_select')}>
                        <LogOut style={{ width: '16px', height: '16px' }} /> SAIR
                      </span>
                    </div>
                  </div>
                )}


                {/* SCREEN 6: Professional - Handover History (Busca e Histórico - Profissional) */}
                {activeScreen === 'professional_handover_history' && (
                  <div className="screen-handover-history">
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('professional_dashboard')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">BUSCA DE PLANTÕES</span>
                      </div>
                      <span className="phone-nav-badge" style={{ backgroundColor: 'rgba(0, 86, 179, 0.1)', color: 'var(--color-primary)' }}>HISTÓRICO</span>
                    </div>

                    <div className="screen-inner-content">
                      <div className="handover-search-wrap">
                        <input type="text" className="handover-search-input" placeholder="Buscar leito ou passagem..." />
                        <Search className="handover-search-icon" style={{ width: '14px', height: '14px' }} />
                      </div>

                      <div className="handover-scroll-stack">
                        {handovers
                          .filter(h => !h.unitId || h.unitId === (currentUser?.unitId || 'mangabeira'))
                          .map(h => (
                          <div className="handover-card-item" key={h.id}>
                            <div className="handover-card-top">
                              <div className="handover-card-title-wrap">
                                <span className={`handover-card-dot ${h.status}`}></span>
                                <span className="handover-card-title">{h.title}</span>
                              </div>
                              <span className="handover-card-time">{h.time}</span>
                            </div>
                            <p className="handover-card-desc">{h.description}</p>
                            <div className="handover-card-footer">
                              <span>Prof: {h.professional}</span>
                              <span 
                                className="handover-card-link"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setModalData({
                                    title: 'Detalhes da Passagem de Plantão',
                                    content: (
                                      <div style={{ fontSize: '0.78rem', lineHeight: '1.6', color: 'var(--mobile-text)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                          <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--color-primary)' }}>{h.title}</span>
                                          <span className="handover-card-time" style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>⏱ {h.time}</span>
                                        </div>
                                        <div style={{ padding: '10px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid var(--mobile-border)', marginBottom: '12px' }}>
                                          <p style={{ margin: 0 }}><strong>Setor/Leito:</strong> {h.bedLabel || 'Não especificado'}</p>
                                          <p style={{ margin: '6px 0 0 0' }}><strong>Profissional Responsável:</strong> {h.professional}</p>
                                          <p style={{ margin: '6px 0 0 0' }}><strong>Status do Caso:</strong> <span style={{
                                            fontSize: '0.62rem',
                                            fontWeight: '800',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: h.status === 'critical' ? 'var(--color-danger-bg)' : h.status === 'observation' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                                            color: h.status === 'critical' ? 'var(--color-danger)' : h.status === 'observation' ? 'var(--color-warning)' : 'var(--color-success)'
                                          }}>{h.status === 'critical' ? 'CRÍTICO' : h.status === 'observation' ? 'OBSERVAÇÃO' : 'ESTÁVEL'}</span></p>
                                        </div>
                                        <div style={{ padding: '12px', background: '#FFFDF5', border: '1px solid #FEF3C7', borderRadius: '10px' }}>
                                          <strong style={{ color: '#B45309', display: 'block', marginBottom: '4px' }}>Descrição do Quadro Clínico:</strong>
                                          <p style={{ margin: 0, color: 'var(--mobile-text)', lineHeight: '1.4' }}>{h.description}</p>
                                        </div>
                                      </div>
                                    )
                                  });
                                  addLog(`[Simulador Mobile] Visualizou detalhes do plantão ${h.title}.`);
                                }}
                              >
                                Ver Detalhes
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_dashboard')}>
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_bed_management')}>
                        <Layers style={{ width: '16px', height: '16px' }} /> LEITOS
                      </span>
                      <span className="tab-bar-item active">
                        <FileText style={{ width: '16px', height: '16px' }} /> PLANTÃO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('professional_env_select')}>
                        <LogOut style={{ width: '16px', height: '16px' }} /> SAIR
                      </span>
                    </div>
                  </div>
                )}

                {/* SCREEN 7: Professional - Create Handover Case (Wizard screen matching heights) */}
                {activeScreen === 'professional_new_handover' && (
                  <div className="screen-checkin-wizard">
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('professional_dashboard')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">NOVA PASSAGEM</span>
                      </div>
                    </div>

                    <div className="screen-inner-content">
                      <form onSubmit={handleMobileNewHandoverSubmit} className="app-wizard-form">
                        <div className="symptoms-selector-grid">
                          <div className="form-group-block">
                            <label>Leito Destino</label>
                            <select 
                              value={handoverForm.bedId}
                              onChange={(e) => setHandoverForm({ ...handoverForm, bedId: e.target.value })}
                            >
                              {beds.filter(b => b.unitId === (currentUser?.unitId || 'mangabeira')).map(b => (
                                <option value={b.id} key={b.id}>{b.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group-block">
                            <label>Gravidade</label>
                            <select 
                              value={handoverForm.status}
                              onChange={(e) => setHandoverForm({ ...handoverForm, status: e.target.value })}
                            >
                              <option value="free">Livre / Alta</option>
                              <option value="observation">Observação</option>
                              <option value="critical">Crítico</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group-block">
                          <label>Nome do Paciente</label>
                          <input 
                            type="text" 
                            placeholder="Paciente" 
                            required
                            value={handoverForm.patientName}
                            onChange={(e) => setHandoverForm({ ...handoverForm, patientName: e.target.value })}
                          />
                        </div>

                        <div className="symptoms-selector-grid">
                          <div className="form-group-block">
                            <label>Idade</label>
                            <input 
                              type="text" 
                              placeholder="Ex: 50 anos"
                              value={handoverForm.age}
                              onChange={(e) => setHandoverForm({ ...handoverForm, age: e.target.value })}
                            />
                          </div>
                          <div className="form-group-block">
                            <label>Diagnóstico Rápido</label>
                            <input 
                              type="text" 
                              placeholder="Ex: Pós-op"
                              value={handoverForm.notes}
                              onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group-block">
                          <label>Descrição do Quadro Clínico</label>
                          <textarea 
                            rows="3" 
                            placeholder="Descreva a criticidade do caso..."
                            required
                            value={handoverForm.description}
                            onChange={(e) => setHandoverForm({ ...handoverForm, description: e.target.value })}
                            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--mobile-border)', borderRadius: '10px', fontSize: '0.78rem', outline: 'none', resize: 'none', fontFamily: 'var(--font-primary)' }}
                          ></textarea>
                        </div>

                        <button type="submit" className="btn-welcome-primary" style={{ marginTop: '8px' }}>
                          Passar Plantão do Setor
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* SCREEN 8: Patient - Home Screen (Unidades de Saúde - Perfil Paciente) */}
                {activeScreen === 'patient_home' && (
                  <div className="screen-patient-home">
                    <div className="screen-inner-content">
                      <div className="patient-greeting-row">
                        <div className="patient-profile-wrap" onClick={() => setActiveScreen('patient_profile')} style={{ cursor: 'pointer' }}>
                          <div className="patient-avatar">
                            {patientUser ? patientUser.name[0].toUpperCase() : 'V'}
                          </div>
                          <div className="patient-meta">
                            <h4>Olá, {patientUser ? patientUser.name : 'Visitante'}</h4>
                            <p>{patientUser ? 'Paciente SUS Conectado' : 'Acesse seu Perfil'}</p>
                          </div>
                        </div>
                        <button className="btn-phone-logout" onClick={() => { handlePatientLogout(); setActiveScreen('welcome'); }}>
                          <LogOut style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>



                      {/* FEATURED UNIT CARD (UPA MANGABEIRA FIGMA HIGH FIDELITY) */}
                      <div 
                        className="app-featured-card"
                        onClick={() => {
                          setSelectedUnitId('mangabeira');
                          setActiveScreen('patient_unit_details');
                          addLog('[Simulador Mobile] Rodrigo clicou nos detalhes de Mangabeira.');
                        }}
                      >
                        <div className="featured-card-top">
                          <span className="featured-badge" style={{ backgroundColor: '#10B981', color: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontSize: '0.52rem', fontWeight: '800', textTransform: 'uppercase' }}>MAIS PRÓXIMA</span>
                          <span className="featured-dist" style={{ fontSize: '0.62rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Navigation style={{ width: '10px', height: '10px', transform: 'rotate(45deg)' }} />
                            1.2 km de você
                          </span>
                        </div>
                        <h4 className="featured-name" style={{ fontSize: '1.2rem', fontWeight: '800', margin: '8px 0 4px 0' }}>{units.find(u => u.id === 'mangabeira')?.name}</h4>
                        <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.35', marginBottom: '12px' }}>
                          Unidade de Pronto Atendimento 24h para urgências e emergências.
                        </p>
                        
                        <div className="featured-stats-bar" style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '8px' }}>
                          <span className="featured-stat-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: '700' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                            Espera Baixa (&lt;1h)
                          </span>
                          <span className="featured-stat-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: '700', opacity: 0.8 }}>
                            <Clock style={{ width: '11px', height: '11px' }} />
                            Fila: {units.find(u => u.id === 'mangabeira')?.waitMinutes} min
                          </span>
                        </div>
                      </div>

                      {/* DIGITAL CHECK-IN HERO BANNER */}
                      <div 
                        className="digital-checkin-banner"
                        style={{
                          backgroundColor: '#E6F0FA',
                          border: '1.5px solid rgba(0, 86, 179, 0.12)',
                          marginTop: '16px'
                        }}
                        onClick={() => {
                          setActiveScreen('patient_checkin_wizard');
                          addLog('[Simulador Mobile] Abriu Check-in Digital.');
                        }}
                      >
                        <div className="checkin-banner-left">
                          <div className="checkin-banner-icon-box" style={{ backgroundColor: 'rgba(0, 86, 179, 0.1)', color: 'var(--color-primary)' }}>
                            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                          </div>
                          <div className="checkin-banner-text-wrap">
                            <span className="checkin-banner-title" style={{ color: 'var(--color-primary)', fontWeight: '800' }}>Check-In Digital</span>
                            <span className="checkin-banner-desc" style={{ color: '#0F172A', opacity: 0.85 }}>Agilize seu atendimento informando seus dados antes de sair.</span>
                          </div>
                        </div>
                        <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                      </div>

                      {/* STATS WIDGETS */}
                      <div className="phone-stats-grid">
                        <div className="stat-widget">
                          <div className="stat-widget-icon">
                            <Layers style={{ width: '14px', height: '14px' }} />
                          </div>
                          <div className="stat-widget-info">
                            <span className="stat-widget-num">08</span>
                            <span className="stat-widget-label">Unidades Ativas</span>
                          </div>
                        </div>
                        <div className="stat-widget">
                          <div className="stat-widget-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                            <Clock style={{ width: '14px', height: '14px' }} />
                          </div>
                          <div className="stat-widget-info">
                            <span className="stat-widget-num">15min</span>
                            <span className="stat-widget-label">Média de Espera</span>
                          </div>
                        </div>
                      </div>

                      {/* SEARCH & FILTER BLOCK IN THE UNITS SECTION - HIGH TOUCH UX */}
                      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1.5px solid var(--mobile-border)' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--mobile-text)', margin: '0 0 10px 0' }}>Buscar UPA ou Policlínica</h3>
                        
                        <div className="patient-search-wrap" style={{ marginTop: 0 }}>
                          <input 
                            type="text" 
                            className="patient-search-input" 
                            placeholder="Qual unidade você procura?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <Search className="patient-search-icon" style={{ width: '14px', height: '14px' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', alignItems: 'center' }} className="scroll-hidden">
                          <button 
                            className="btn-phone-filter" 
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: '1.5px solid var(--mobile-border)',
                              backgroundColor: '#FFFFFF',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              color: 'var(--mobile-text)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              height: '32px'
                            }}
                          >
                            <Filter style={{ width: '10px', height: '10px' }} strokeWidth={2.5} />
                            Filtrar
                          </button>
                          <span className={`pill-filter ${filterType === 'ALL' ? 'active' : 'inactive'}`} style={{ height: '32px', display: 'inline-flex', alignItems: 'center', padding: '0 14px', margin: 0, borderRadius: '20px' }} onClick={() => setFilterType('ALL')}>Todas</span>
                          <span className={`pill-filter ${filterType === 'UPA' ? 'active' : 'inactive'}`} style={{ height: '32px', display: 'inline-flex', alignItems: 'center', padding: '0 14px', margin: 0, borderRadius: '20px' }} onClick={() => setFilterType('UPA')}>UPAs</span>
                          <span className={`pill-filter ${filterType === 'Policlínica' ? 'active' : 'inactive'}`} style={{ height: '32px', display: 'inline-flex', alignItems: 'center', padding: '0 14px', margin: 0, borderRadius: '20px' }} onClick={() => setFilterType('Policlínica')}>Policlínicas</span>
                        </div>
                      </div>

                      <div className="list-header-row" style={{ marginTop: '20px' }}>
                        <span className="list-header-title" style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidades de Atendimento</span>
                      </div>

                      <div className="app-units-list-stack">
                        {getFilteredUnits().map(unit => (
                          <div 
                            key={unit.id}
                            className="list-unit-item"
                            onClick={() => {
                              handleUnitSelectFromList(unit.id);
                              setActiveScreen('patient_unit_details');
                            }}
                          >
                            <div className="list-unit-left">
                              <div className="list-unit-avatar" style={{ backgroundColor: 'rgba(0, 86, 179, 0.08)', color: 'var(--color-primary)' }}>
                                <Activity style={{ width: '14px', height: '14px' }} />
                              </div>
                              <div className="list-unit-meta">
                                <h5>{unit.name}</h5>
                                <div className="list-unit-sub-stats">
                                  <span>{unit.distance}</span>
                                  <span className="bullet-separator"></span>
                                  <span>{unit.waitMinutes} min</span>
                                </div>
                              </div>
                            </div>

                            <div className="list-unit-right">
                              <span className="list-unit-status-label" style={{
                                backgroundColor: unit.status === 'ALTO' ? 'var(--color-danger-bg)' : unit.status === 'MÉDIO' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                                color: unit.status === 'ALTO' ? 'var(--color-danger)' : unit.status === 'MÉDIO' ? 'var(--color-warning)' : 'var(--color-success)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.52rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                marginRight: '8px'
                              }}>{unit.status}</span>
                              <span 
                                className="list-unit-dot" 
                                style={{ backgroundColor: unit.status === 'ALTO' ? 'var(--color-danger)' : unit.status === 'MÉDIO' ? 'var(--color-warning)' : 'var(--color-success)' }}
                              ></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item active">
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_checkin_wizard')}>
                        <CheckCircle2 style={{ width: '16px', height: '16px' }} /> CHECK-IN
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_map')}>
                        <MapPin style={{ width: '16px', height: '16px' }} /> MAPA
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_profile')}>
                        <User style={{ width: '16px', height: '16px' }} /> PERFIL
                      </span>
                    </div>
                  </div>
                )}

                {/* SCREEN 9: Patient - Unit Details & Map (Detalhes da Unidade - UPA Mangabeira) */}
                {activeScreen === 'patient_unit_details' && (
                  <div className="screen-patient-details">
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('patient_home')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">{getSelectedUnit().name}</span>
                      </div>
                      <span 
                        className="phone-nav-badge" 
                        style={{ 
                          backgroundColor: getSelectedUnit().status === 'ALTO' ? 'var(--color-danger-bg)' : getSelectedUnit().status === 'MÉDIO' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)', 
                          color: getSelectedUnit().status === 'ALTO' ? 'var(--color-danger)' : getSelectedUnit().status === 'MÉDIO' ? 'var(--color-warning)' : 'var(--color-success)' 
                        }}
                      >
                        LOTAÇÃO: {getSelectedUnit().status}
                      </span>
                    </div>

                    <div className="screen-inner-content">
                      <HealthMapView
                        mapId="details-leaflet-map"
                        className="sim-gps-map"
                        style={{ height: '220px' }}
                        mapStyle={{ width: '100%', height: '100%', zIndex: 1 }}
                      >
                        <div className="gps-bottom-overlay" style={{ zIndex: 1000, width: 'calc(100% - 24px)', left: '12px', bottom: '12px' }}>
                          <span className="gps-destination-lbl">Destino:</span>
                          <span className="gps-destination-val">{getSelectedUnit().address}</span>
                        </div>
                      </HealthMapView>

                      <div className="patient-details-stats">
                        <div className="details-stats-grid">
                          <div className="details-stat-box border-right">
                            <span className="details-stat-val">{getSelectedUnit().waitMinutes} min</span>
                            <span className="details-stat-lbl">ESPERA ESTIMADA</span>
                          </div>
                          <div className="details-stat-box">
                            <span className="details-stat-val">{getSelectedUnit().distance}</span>
                            <span className="details-stat-lbl">DISTÂNCIA</span>
                          </div>
                        </div>
                      </div>

                      <div className="patient-details-advice">
                        <span className="details-advice-lbl">INFORMAÇÃO REGIONAL</span>
                        <p className="details-advice-desc">Esta unidade possui {getSelectedUnit().queueSize} pacientes em triagem física. Realize o check-in digital antes do trânsito.</p>
                      </div>

                      <button 
                        className="btn-welcome-primary" 
                        style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => {
                          setSelectedUnitId(getSelectedUnit().id);
                          setActiveScreen('patient_map');
                          addLog(`[Simulador Mobile] Visualizou ${getSelectedUnit().name} no mapa.`);
                        }}
                      >
                        <MapPin style={{ width: '15px', height: '15px' }} />
                        VER NO MAPA
                      </button>

                      <div className="details-btn-grid">
                        <button className="btn-details-call" onClick={() => setModalData({
                          title: 'Contato Telefônico',
                          content: (
                            <div style={{ fontSize: '0.78rem', lineHeight: '1.6', color: 'var(--mobile-text)' }}>
                              <p style={{ margin: 0 }}>Deseja iniciar uma chamada de voz para a recepção da unidade <strong>{getSelectedUnit().name}</strong>?</p>
                              <p style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', color: 'var(--color-primary)' }}>📞 {getSelectedUnit().telephone || '(75) 3617-3268'}</p>
                              <a href={`tel:${(getSelectedUnit().telephone || '7536173268').replace(/\D/g, '')}`} className="btn-welcome-primary" style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none', height: '36px' }}>
                                Confirmar e Ligar
                              </a>
                            </div>
                          )
                        })}>
                          <Phone style={{ width: '12px', height: '12px', color: 'var(--color-primary)' }} /> LIGAR UNIDADE
                        </button>
                        <button className="btn-details-checkin" onClick={() => {
                          setCheckinForm(prev => ({ ...prev, unitId: selectedUnitId }));
                          setActiveScreen('patient_checkin_wizard');
                        }}>
                          <CheckCircle2 style={{ width: '12px', height: '12px' }} /> DIGITAL CHECK-IN
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCREEN 12: Patient - Dedicated Full Screen Map Tab */}
                {activeScreen === 'patient_map' && (
                  <div className="screen-patient-map" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Header with Search and Filters */}
                    <div className="map-screen-header" style={{ padding: '16px', backgroundColor: '#FFFFFF', borderBottom: '1.5px solid var(--mobile-border)', zIndex: 1001, flexShrink: 0 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mobile-text)', margin: '0 0 10px 0' }}>Mapa de Transparência</h3>
                      
                      <div className="patient-search-wrap" style={{ marginTop: 0 }}>
                        <input 
                          type="text" 
                          className="patient-search-input" 
                          placeholder="Buscar UPA ou Policlínica..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="patient-search-icon" style={{ width: '14px', height: '14px' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', alignItems: 'center' }} className="scroll-hidden">
                        <span className={`pill-filter ${filterType === 'ALL' ? 'active' : 'inactive'}`} style={{ height: '30px', display: 'inline-flex', alignItems: 'center', padding: '0 12px', margin: 0, borderRadius: '20px', fontSize: '0.7rem' }} onClick={() => setFilterType('ALL')}>Todas</span>
                        <span className={`pill-filter ${filterType === 'UPA' ? 'active' : 'inactive'}`} style={{ height: '30px', display: 'inline-flex', alignItems: 'center', padding: '0 12px', margin: 0, borderRadius: '20px', fontSize: '0.7rem' }} onClick={() => setFilterType('UPA')}>UPAs</span>
                        <span className={`pill-filter ${filterType === 'Policlínica' ? 'active' : 'inactive'}`} style={{ height: '30px', display: 'inline-flex', alignItems: 'center', padding: '0 12px', margin: 0, borderRadius: '20px', fontSize: '0.7rem' }} onClick={() => setFilterType('Policlínica')}>Policlínicas</span>
                      </div>
                    </div>

                    {/* Full Screen Map Container */}
                    <HealthMapView
                      mapId="full-leaflet-waze-map"
                      style={{ flexGrow: 1, width: '100%' }}
                      mapStyle={{ width: '100%', height: '100%', zIndex: 1 }}
                    >
                      {/* Floating HUD overlay (Bottom Card) */}
                      {wazeActiveUnit && (
                        <WazeRouteHud
                          variant="fullscreen"
                          unitName={units.find(u => u.id === wazeActiveUnit)?.name}
                          subtitle={`Espera: ${units.find(u => u.id === wazeActiveUnit)?.waitMinutes} min | Lotação: ${units.find(u => u.id === wazeActiveUnit)?.status}`}
                          eta={wazeDuration}
                          distance={wazeDistance}
                          onReset={resetRoute}
                        >
                            <button
                              className="btn-welcome-primary"
                              style={{ flexGrow: 1, padding: '8px', fontSize: '0.7rem', margin: 0, height: '36px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              onClick={() => {
                                setSelectedUnitId(wazeActiveUnit);
                                setActiveScreen('patient_unit_details');
                                addLog(`[Simulador Mobile] Acessou detalhes de ${units.find(u => u.id === wazeActiveUnit)?.name} do mapa.`);
                              }}
                            >
                              VER DETALHES
                            </button>
                            <button
                              className="btn-welcome-primary"
                              style={{ flexGrow: 1, padding: '8px', fontSize: '0.7rem', margin: 0, height: '36px', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              onClick={() => {
                                setSelectedUnitId(wazeActiveUnit);
                                setCheckinForm(prev => ({ ...prev, unitId: wazeActiveUnit }));
                                setActiveScreen('patient_checkin_wizard');
                              }}
                            >
                              CHECK-IN DIGITAL
                            </button>
                        </WazeRouteHud>
                      )}
                    </HealthMapView>

                    {/* Bottom Navigation Tab Bar */}
                    <div className="phone-bottom-tab-bar" style={{ marginTop: 0 }}>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_home')}>
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_checkin_wizard')}>
                        <CheckCircle2 style={{ width: '16px', height: '16px' }} /> CHECK-IN
                      </span>
                      <span className="tab-bar-item active">
                        <MapPin style={{ width: '16px', height: '16px' }} /> MAPA
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_profile')}>
                        <User style={{ width: '16px', height: '16px' }} /> PERFIL
                      </span>
                    </div>

                  </div>
                )}

                {/* SCREEN 13: Patient - Profile Screen */}
                {activeScreen === 'patient_profile' && (
                  <div className="screen-patient-profile" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <span className="phone-nav-title" style={{ marginLeft: '12px' }}>Meu Perfil Fluxo Saúde</span>
                      </div>
                      <span className="phone-nav-badge" style={{ 
                        backgroundColor: patientUser ? 'var(--color-success-bg)' : 'rgba(239, 68, 68, 0.1)', 
                        color: patientUser ? 'var(--color-success)' : 'var(--color-danger)' 
                      }}>
                        {patientUser ? 'CONECTADO' : 'NÃO LOGADO'}
                      </span>
                    </div>

                    <div className="screen-inner-content" style={{ overflowY: 'auto' }}>
                      {!patientUser ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                          {/* Header de boas-vindas */}
                          <div style={{ textAlign: 'center', padding: '8px 0 20px 0' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #00478D, #005EB8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', boxShadow: '0 4px 16px rgba(0,71,141,0.25)' }}>
                              <User style={{ width: '26px', height: '26px', color: 'white' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mobile-text)', margin: '0 0 4px 0' }}>Acesso ao Perfil Fluxo Saúde</h3>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>Faça login ou cadastre-se para acompanhar sua triagem</p>
                          </div>

                          {/* Tab Switcher */}
                          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '14px', padding: '4px', marginBottom: '16px' }}>
                            <button 
                              type="button" 
                              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: patientActiveTab === 'login' ? '#FFFFFF' : 'transparent', fontWeight: patientActiveTab === 'login' ? '800' : '600', fontSize: '0.8rem', cursor: 'pointer', color: patientActiveTab === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: patientActiveTab === 'login' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }}
                              onClick={() => { setPatientActiveTab('login'); setPatientAuthError(''); }}
                            >
                              Entrar
                            </button>
                            <button 
                              type="button" 
                              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: patientActiveTab === 'register' ? '#FFFFFF' : 'transparent', fontWeight: patientActiveTab === 'register' ? '800' : '600', fontSize: '0.8rem', cursor: 'pointer', color: patientActiveTab === 'register' ? 'var(--color-primary)' : 'var(--color-text-muted)', boxShadow: patientActiveTab === 'register' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }}
                              onClick={() => { setPatientActiveTab('register'); setPatientAuthError(''); }}
                            >
                              Cadastrar
                            </button>
                          </div>

                          {patientAuthError && (
                            <div style={{ color: 'var(--color-danger)', fontSize: '0.72rem', fontWeight: '700', backgroundColor: 'var(--color-danger-bg)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-danger-border)', marginBottom: '12px' }}>
                              ⚠️ {patientAuthError}
                            </div>
                          )}

                          {patientActiveTab === 'login' ? (
                            <form onSubmit={handlePatientLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPF</label>
                                <input 
                                  type="text" inputMode="numeric"
                                  placeholder="000.000.000-00" 
                                  required
                                  value={patientLoginForm.cpf}
                                  onChange={(e) => setPatientLoginForm({ ...patientLoginForm, cpf: e.target.value })}
                                  style={{ padding: '14px 16px', border: '1.5px solid var(--mobile-border)', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', background: '#FFFFFF', color: 'var(--mobile-text)', fontFamily: 'Manrope' }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
                                <input 
                                  type="password" 
                                  placeholder="Sua senha" 
                                  required
                                  value={patientLoginForm.password}
                                  onChange={(e) => setPatientLoginForm({ ...patientLoginForm, password: e.target.value })}
                                  style={{ padding: '14px 16px', border: '1.5px solid var(--mobile-border)', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', background: '#FFFFFF', color: 'var(--mobile-text)', fontFamily: 'Manrope' }}
                                />
                              </div>
                              <button type="submit" style={{ padding: '15px', background: 'linear-gradient(135deg, #00478D, #005EB8)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Manrope', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,71,141,0.3)' }}>
                                Entrar
                              </button>
                              <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', fontSize: '0.65rem', border: '1px dashed var(--mobile-border)', textAlign: 'center' }}>
                                <span style={{ fontWeight: '700', color: 'var(--color-primary)', display: 'block', marginBottom: '3px' }}>💡 Credenciais de teste</span>
                                CPF: <strong>12345678901</strong> | Senha: <strong>123</strong>
                              </div>

                              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--mobile-border)' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--mobile-text)', margin: '0 0 8px 0' }}>🔍 Consultar fila sem login</p>
                                <p style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>Informe o código do seu pré check-in para ver sua posição:</p>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Ex: FS-4872"
                                    value={queueLookupCode}
                                    onChange={e => setQueueLookupCode(e.target.value.toUpperCase())}
                                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--mobile-border)', borderRadius: '10px', fontSize: '0.8rem', fontFamily: 'Manrope', outline: 'none' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const found = digitalCheckins.find(c => c.code === queueLookupCode.trim());
                                      setQueueLookupResult(found || 'not_found');
                                    }}
                                    style={{ padding: '10px 14px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Manrope' }}
                                  >Buscar</button>
                                </div>
                                {queueLookupResult && (
                                  <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: queueLookupResult === 'not_found' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${queueLookupResult === 'not_found' ? '#FCA5A5' : '#86EFAC'}` }}>
                                    {queueLookupResult === 'not_found' ? (
                                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#DC2626', fontWeight: '700' }}>⚠️ Código não encontrado. Verifique e tente novamente.</p>
                                    ) : (() => {
                                      const chk = queueLookupResult;
                                      const priority = { 'Vermelho': 0, 'Laranja': 1, 'Amarelo': 2, 'Verde': 3, 'Azul': 4 };
                                      const queue = digitalCheckins
                                        .filter(c => c.unitName === chk.unitName && c.status === 'Triado')
                                        .sort((a, b) => (priority[a.urgencyLevel] ?? 5) - (priority[b.urgencyLevel] ?? 5));
                                      const pos = queue.findIndex(c => c.id === chk.id) + 1;
                                      return (
                                        <div style={{ fontSize: '0.7rem', color: '#166534' }}>
                                          <p style={{ margin: '0 0 4px 0', fontWeight: '800' }}>✅ {chk.name}</p>
                                          <p style={{ margin: '0 0 2px 0' }}>Unidade: <strong>{chk.unitName}</strong></p>
                                          <p style={{ margin: '0 0 2px 0' }}>Status: <strong>{chk.status}</strong></p>
                                          {chk.status === 'Triado' && pos > 0 && <p style={{ margin: 0 }}>Posição na fila: <strong>#{pos}</strong></p>}
                                          {chk.status === 'Pendente' && <p style={{ margin: 0, color: '#B45309' }}>⏳ Aguardando triagem clínica</p>}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </form>
                          ) : (
                            <form onSubmit={handlePatientRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {[
                                { label: 'Nome Completo', field: 'name', type: 'text', placeholder: 'Rodrigo Carvalho', inputMode: 'text' },
                                { label: 'CPF', field: 'cpf', type: 'text', placeholder: '000.000.000-00', inputMode: 'numeric' },
                                { label: 'CNS (Cartão SUS)', field: 'cns', type: 'text', placeholder: '898 0000 0000 0000', inputMode: 'numeric' },
                                { label: 'Data de Nascimento', field: 'birthDate', type: 'date', placeholder: '', inputMode: 'none' },
                                { label: 'Senha', field: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres', inputMode: 'none' },
                              ].map(({ label, field, type, placeholder, inputMode }) => (
                                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                                  <input 
                                    type={type}
                                    inputMode={inputMode !== 'none' ? inputMode : undefined}
                                    placeholder={placeholder} 
                                    required
                                    value={patientRegisterForm[field]}
                                    onChange={(e) => setPatientRegisterForm({ ...patientRegisterForm, [field]: e.target.value })}
                                    style={{ padding: '13px 16px', border: '1.5px solid var(--mobile-border)', borderRadius: '12px', fontSize: '0.85rem', outline: 'none', background: '#FFFFFF', color: 'var(--mobile-text)', fontFamily: 'Manrope' }}
                                  />
                                </div>
                              ))}
                              <button type="submit" style={{ padding: '15px', background: 'linear-gradient(135deg, #00478D, #005EB8)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '800', cursor: 'pointer', fontFamily: 'Manrope', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,71,141,0.3)' }}>
                                Criar Conta e Entrar
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0 16px 0' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px', boxShadow: '0 4px 10px rgba(0, 86, 179, 0.2)' }}>
                              {patientUser.name[0].toUpperCase()}
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mobile-text)', margin: 0, textAlign: 'center' }}>{patientUser.name}</h4>
                            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Paciente Conectado | Feira de Santana</p>
                          </div>

                          {/* Info Group 1 */}
                          <div style={{ background: '#FFFFFF', border: '1.5px solid var(--mobile-border)', borderRadius: '14px', padding: '14px' }}>
                            <span style={{ fontSize: '0.58rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Dados Pessoais</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>CPF:</span>
                                <span style={{ fontWeight: '700', color: 'var(--mobile-text)' }}>{maskCpf(patientUser.cpf)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>CNS (Cartão SUS):</span>
                                <span style={{ fontWeight: '700', color: 'var(--mobile-text)' }}>{patientUser.cns}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Nascimento:</span>
                                <span style={{ fontWeight: '700', color: 'var(--mobile-text)' }}>
                                  {new Date(patientUser.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')} ({getAge(patientUser.birthDate)})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Info Group 2: Check-ins Ativos */}
                          <div style={{ background: '#FFFFFF', border: '1.5px solid var(--mobile-border)', borderRadius: '14px', padding: '14px' }}>
                            <span style={{ fontSize: '0.58rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Seus Pré Check-ins Ativos</span>
                            
                            {digitalCheckins.filter(chk => chk.cpf === patientUser.cpf).length === 0 ? (
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center', padding: '8px 0' }}>Nenhum check-in digital ativo no momento.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {digitalCheckins.filter(chk => chk.cpf === patientUser.cpf).map(chk => {
                                  const levelColors = {
                                    'Vermelho': { bg: '#FEE2E2', text: '#991B1B' },
                                    'Laranja': { bg: '#FFEDD5', text: '#9A3412' },
                                    'Amarelo': { bg: '#FEF9C3', text: '#854D0E' },
                                    'Verde': { bg: '#DCFCE7', text: '#166534' },
                                    'Azul': { bg: '#DBEAFE', text: '#1E40AF' }
                                  };
                                  const c = levelColors[chk.urgencyLevel] || { bg: '#E2E8F0', text: '#1E293B' };
                                  return (
                                    <div key={chk.id} style={{ display: 'flex', flexDirection: 'column', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1.5px solid var(--mobile-border)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--color-primary)' }}>{chk.code}</span>
                                          <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: '600', marginTop: '2px' }}>{chk.unitName}</span>
                                        </div>
                                        <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: '500' }}>{chk.time}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--mobile-border)' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--mobile-text)' }}>Status:</span>
                                        <span style={{ 
                                          fontSize: '0.62rem', 
                                          fontWeight: '800', 
                                          backgroundColor: chk.status === 'Triado' ? c.bg : '#F1F5F9',
                                          color: chk.status === 'Triado' ? c.text : '#475569',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          textTransform: 'uppercase'
                                        }}>
                                          {chk.status === 'Triado' ? `Triado - ${chk.urgencyLevel}` : 'Aguardando Triagem'}
                                        </span>
                                      </div>
                                      {chk.status === 'Triado' && (() => {
                                        const pos = getQueuePosition(chk.id);
                                        return pos ? (
                                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: c.bg, borderRadius: '10px', border: `1px solid ${c.text}30` }}>
                                            <div>
                                              <div style={{ fontSize: '0.6rem', fontWeight: '700', color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posição na Fila</div>
                                              <div style={{ fontSize: '0.65rem', color: c.text, marginTop: '2px' }}>Você é o {pos}º a ser chamado</div>
                                            </div>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <span style={{ fontSize: '1rem', fontWeight: '900', color: 'white' }}>{pos}</span>
                                            </div>
                                          </div>
                                        ) : null;
                                      })()}
                                      {chk.status === 'Triado' && chk.triageNotes && (
                                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--mobile-border)', fontSize: '0.65rem', color: 'var(--mobile-text)', lineHeight: '1.4' }}>
                                          <strong>Obs. Clínicas:</strong> {chk.triageNotes}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Info Group 3: Outros */}
                          <div style={{ background: '#FFFFFF', border: '1.5px solid var(--mobile-border)', borderRadius: '14px', padding: '14px' }}>
                            <span style={{ fontSize: '0.58rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Opções</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--mobile-text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => {
                                const checkinCount = digitalCheckins.filter(chk => chk.cpf === patientUser.cpf).length;
                                setModalData({
                                  title: 'Histórico de Pré Check-ins',
                                  content: (
                                    <div style={{ fontSize: '0.78rem', lineHeight: '1.5', color: 'var(--mobile-text)' }}>
                                      <p>Você possui <strong>{checkinCount}</strong> pré check-ins registrados.</p>
                                      {checkinCount > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                          {digitalCheckins.filter(chk => chk.cpf === patientUser.cpf).map(chk => (
                                            <div key={chk.id} style={{ padding: '8px', background: '#F1F5F9', borderRadius: '6px' }}>
                                              <strong>{chk.code}</strong> - {chk.unitName} ({chk.time}) <br />
                                              <span style={{fontSize:'0.65rem', color:'#64748B'}}>Status: {chk.status} {chk.status === 'Triado' ? `(${chk.urgencyLevel})` : ''}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p style={{ color: '#64748B' }}>Nenhum histórico disponível nos últimos 30 dias.</p>
                                      )}
                                    </div>
                                  )
                                });
                              }}>
                                <span>Histórico de Triagem</span>
                                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--color-text-muted)' }} />
                              </div>
                              
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--mobile-text)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => {
                                setModalData({
                                  title: 'Sobre a Plataforma',
                                  content: (
                                    <div style={{ fontSize: '0.75rem', lineHeight: '1.5', color: 'var(--mobile-text)' }}>
                                      <p><strong>Fluxo Saúde v1.5.0</strong></p>
                                      <p>Plataforma inteligente de gerenciamento de fluxos de atendimento de saúde municipal integrado ao SUS.</p>
                                      <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Feira de Santana - BA</p>
                                    </div>
                                  )
                                });
                              }}>
                                <span>Sobre a Plataforma</span>
                                <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--color-text-muted)' }} />
                              </div>

                              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--mobile-border)' }} onClick={() => {
                                handlePatientLogout();
                              }}>
                                <span>Sair da Conta</span>
                                <LogOut style={{ width: '14px', height: '14px', color: 'var(--color-danger)' }} />
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>

                    <div className="phone-bottom-tab-bar">
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_home')}>
                        <Activity style={{ width: '16px', height: '16px' }} /> INÍCIO
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_checkin_wizard')}>
                        <CheckCircle2 style={{ width: '16px', height: '16px' }} /> CHECK-IN
                      </span>
                      <span className="tab-bar-item" onClick={() => setActiveScreen('patient_map')}>
                        <MapPin style={{ width: '16px', height: '16px' }} /> MAPA
                      </span>
                      <span className="tab-bar-item active">
                        <User style={{ width: '16px', height: '16px' }} /> PERFIL
                      </span>
                    </div>

                  </div>
                )}

                {/* SCREEN 10: Patient - Checkin Wizard */}
                {activeScreen === 'patient_checkin_wizard' && (
                  <div className="screen-checkin-wizard">
                    <div className="phone-nav-header">
                      <div className="phone-nav-back-title">
                        <button className="btn-phone-back" onClick={() => setActiveScreen('patient_home')}>
                          <ChevronLeft style={{ width: '20px', height: '20px' }} />
                        </button>
                        <span className="phone-nav-title">CHECK-IN DIGITAL</span>
                      </div>
                    </div>

                    <div className="screen-inner-content">
                      <form onSubmit={handleMobilePatientCheckinSubmit} className="app-wizard-form">
                        <div className="form-group-block">
                          <label>Nome Completo</label>
                          <input 
                            type="text" 
                            placeholder="Rodrigo Carvalho" 
                            required 
                            value={checkinForm.name} 
                            onChange={(e) => setCheckinForm({ ...checkinForm, name: e.target.value })} 
                          />
                        </div>

                        <div className="form-group-block">
                          <label>CPF</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            placeholder="000.000.000-00" 
                            required 
                            value={checkinForm.cpf} 
                            onChange={(e) => setCheckinForm({ ...checkinForm, cpf: formatCPF(e.target.value) })} 
                          />
                        </div>

                        <div className="form-group-block">
                          <label>Unidade Pretendida</label>
                          <select 
                            value={checkinForm.unitId} 
                            onChange={(e) => setCheckinForm({ ...checkinForm, unitId: e.target.value })}
                          >
                            {units.map(u => (
                              <option value={u.id} key={u.id}>{u.name} ({u.waitMinutes}min fila)</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group-block">
                          <label>Assinale seus Sintomas</label>
                          <div className="symptoms-selector-grid">
                            {['Febre alta', 'Dor de cabeça', 'Falta de ar', 'Tosse constante', 'Dor no peito', 'Dor abdominal severa', 'Náusea/Vômitos', 'Fraqueza extrema', 'Tontura/Desmaio', 'Dor de garganta', 'Reação alérgica', 'Fratura/Lesão'].map(sym => {
                              const isSelected = checkinForm.symptoms.includes(sym);
                              return (
                                <div 
                                  className={`symptom-tag-select ${isSelected ? 'selected' : ''}`}
                                  key={sym}
                                  onClick={() => {
                                    const updated = isSelected 
                                      ? checkinForm.symptoms.filter(s => s !== sym)
                                      : [...checkinForm.symptoms, sym];
                                    setCheckinForm({ ...checkinForm, symptoms: updated });
                                  }}
                                >
                                  {sym}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button type="submit" className="btn-welcome-primary" style={{ marginTop: '16px' }}>
                          Gerar Meu Check-In Digital
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* SCREEN 11: Patient - Checkin Success */}
                {activeScreen === 'patient_checkin_success' && (
                  <div className="screen-checkin-success">
                    <div className="screen-inner-content" style={{ height: '100%', justifyContent: 'space-between' }}>
                      <div className="success-screen-body">
                        <div className="success-badge-tick">
                          <CheckCircle2 style={{ width: '28px', height: '28px' }} />
                        </div>
                        <h3>Check-In Confirmado!</h3>
                        <p>Apresente o código ou QR Code gerado abaixo nos guichês eletrônicos ao chegar na recepção.</p>

                        <div className="success-qrcode-card">
                          <div className="qrcode-box-mock">
                            <div className="qrcode-row-mock">
                              <div className="qrcode-corner-mock"></div>
                              <div className="qrcode-corner-mock"></div>
                            </div>
                            <div className="qrcode-row-mock middle">
                              <div className="qrcode-line-mock"></div>
                              <div className="qrcode-line-mock" style={{ width: '60%' }}></div>
                              <div className="qrcode-line-mock"></div>
                            </div>
                            <div className="qrcode-row-mock">
                              <div className="qrcode-corner-mock"></div>
                              <div style={{ width: '14px', height: '14px', backgroundColor: 'white', borderRadius: '1px' }}></div>
                            </div>
                          </div>
                        </div>

                        <span className="success-code-tag">CÓDIGO: {lastCheckinResult?.code}</span>

                        <div className="success-summary-card" style={{ marginBottom: '8px' }}>
                          <span className="success-summary-lbl">Posição na Fila de Triagem:</span>
                          <span className="success-summary-val" style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FEF08A', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>
                              {lastCheckinResult ? digitalCheckins.filter(c => c.unitName === lastCheckinResult.unitName && c.status === 'Pendente').length : '-'}
                            </div>
                            Aguardando triagem clínica
                          </span>
                        </div>

                        <div className="success-summary-card">
                          <span className="success-summary-lbl">Destino:</span>
                          <span className="success-summary-val">{units.find(u => u.id === checkinForm.unitId)?.name}</span>
                        </div>
                      </div>

                      <button className="btn-welcome-primary" onClick={() => {
                        setCheckinForm({ name: '', cpf: '', symptoms: [], unitId: 'mangabeira', urgencyLevel: 'Verde' });
                        setActiveScreen('patient_home');
                      }}>
                        Voltar ao Início
                      </button>
                    </div>
                  </div>
                )}

              </div>

          {/* PREMIUM GENERAL CUSTOM MODAL OVERLAY */}
          {modalData && (
            <div className="premium-modal-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div className="premium-modal-card" style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px 20px',
                boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -10px 10px -5px rgba(0, 0, 0, 0.04)',
                transform: 'translateY(0)',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mobile-text)', margin: 0 }}>{modalData.title}</h3>
                  <button 
                    onClick={() => setModalData(null)}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="premium-modal-body">
                  {modalData.content}
                </div>
              </div>
            </div>
          )}

          {/* CLINICAL TRIAGE MODAL OVERLAY */}
          {selectedTriageCheckin && (
            <div className="premium-modal-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}>
              <div className="premium-modal-card" style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '20px',
                boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                maxHeight: '85%',
                boxSizing: 'border-box',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Triagem Clínica</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mobile-text)', margin: '2px 0 0 0' }}>{selectedTriageCheckin.name}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedTriageCheckin(null)}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--mobile-text)', background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid var(--mobile-border)' }}>
                  <strong>Queixa/Sintomas Relatados:</strong><br />
                  {selectedTriageCheckin.symptom}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Classificação de Risco (Manchester)</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { level: 'Vermelho', label: 'Vermelho (Emergência)', desc: 'Risco imediato de morte. Atendimento imediato.', color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' },
                      { level: 'Laranja', label: 'Laranja (Muito Urgente)', desc: 'Risco alto de morte. Atendimento em 10 min.', color: '#F97316', bg: '#FFEDD5', border: '#FED7AA' },
                      { level: 'Amarelo', label: 'Amarelo (Urgente)', desc: 'Gravidade moderada. Atendimento em 60 min.', color: '#EAB308', bg: '#FEF9C3', border: '#FEF08A' },
                      { level: 'Verde', label: 'Verde (Pouco Urgente)', desc: 'Casos leves. Atendimento em até 120 min.', color: '#22C55E', bg: '#DCFCE7', border: '#BBF7D0' },
                      { level: 'Azul', label: 'Azul (Não Urgente)', desc: 'Casos simples. Atendimento em até 240 min.', color: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE' }
                    ].map(opt => {
                      const isSelected = selectedTriageUrgency === opt.level;
                      return (
                        <div 
                          key={opt.level}
                          onClick={() => setSelectedTriageUrgency(opt.level)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            backgroundColor: opt.bg,
                            border: isSelected ? `2.5px solid ${opt.color}` : `1px solid ${opt.border}`,
                            cursor: 'pointer',
                            opacity: isSelected ? 1 : 0.65,
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: opt.color }}>{opt.label}</span>
                            {isSelected && <span style={{ fontSize: '0.72rem' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.62rem', color: '#475569', marginTop: '2px' }}>{opt.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group-block">
                  <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Observações Clínicas / Conduta</label>
                  <textarea 
                    placeholder="Descreva a conduta clínica ou observações..." 
                    style={{
                      width: '100%',
                      height: '70px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--mobile-border)',
                      padding: '10px',
                      fontSize: '0.75rem',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                  />
                </div>

                <button 
                  className="btn-welcome-primary" 
                  style={{ marginTop: '8px', height: '42px' }}
                  onClick={() => handleClinicTriageSubmit(selectedTriageCheckin.id)}
                >
                  Confirmar Triagem Clínica
                </button>
              </div>
            </div>
          )}


          {/* BOTTOM PHONE HOME INDICATOR */}
          <div className="phone-home-indicator">
            <div className="phone-indicator-pill"></div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
