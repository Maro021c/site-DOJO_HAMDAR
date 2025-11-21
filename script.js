// Variáveis globais
let athletes = JSON.parse(localStorage.getItem('athletes')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let events = JSON.parse(localStorage.getItem('events')) || [];
const ADMIN_USERNAME = 'hamdar-admin';
const ADMIN_PASSWORD = 'hamdar123';

// === CONFIGURAÇÃO DO FIREBASE ===
const firebaseConfig = {
    apiKey: "AIzaSyCSAevGFmbue9ArGhzkBmXIXHRfB6EaYkA",
    authDomain: "dojo-hamdar.firebaseapp.com",
    projectId: "dojo-hamdar",
    storageBucket: "dojo-hamdar.firebasestorage.app",
    messagingSenderId: "601678346574",
    appId: "1:601678346574:web:00e4ffc7cf3b0d430d861f",
    measurementId: "G-X804DSPVRS"
};

// Inicialização do Firebase
let db;
try {
    if (typeof firebase !== 'undefined' && firebase.app) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase inicializado com sucesso!');
    }
} catch (error) {
    console.log('Firebase não disponível, usando localStorage');
}

// Elementos da página
const loginPage = document.getElementById('login-page');
const registerPage = document.getElementById('register-page');
const homePage = document.getElementById('home-page');
const listPage = document.getElementById('list-page');
const eventsPage = document.getElementById('events-page');
const adminPage = document.getElementById('admin-page');
const addAthleteModal = document.getElementById('add-athlete-modal');
const editProfileModal = document.getElementById('edit-profile-modal');
const changePhotoModal = document.getElementById('change-photo-modal');
const editAthleteModal = document.getElementById('edit-athlete-modal');
const createExamModal = document.getElementById('create-exam-modal');
const createEventModal = document.getElementById('create-event-modal');
const manageExamModal = document.getElementById('manage-exam-modal');
const manageEventModal = document.getElementById('manage-event-modal');

// === FUNÇÕES FIREBASE ===
async function saveAthleteToFirebase(athlete) {
    if (!db) {
        console.log('Firebase não disponível, salvando apenas no localStorage');
        return;
    }
    
    try {
        await db.collection('athletes').doc(athlete.id).set(athlete);
        console.log('Atleta salvo no Firebase:', athlete.name);
    } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
    }
}

async function updateAthleteInFirebase(athleteId, updates) {
    if (!db) return;
    
    try {
        await db.collection('athletes').doc(athleteId).update(updates);
        console.log('Atleta atualizado no Firebase:', athleteId);
    } catch (error) {
        console.error('Erro ao atualizar no Firebase:', error);
    }
}

async function deleteAthleteFromFirebase(athleteId) {
    if (!db) return;
    
    try {
        await db.collection('athletes').doc(athleteId).delete();
        console.log('Atleta deletado do Firebase:', athleteId);
    } catch (error) {
        console.error('Erro ao deletar do Firebase:', error);
    }
}

async function saveEventToFirebase(event) {
    if (!db) return;
    
    try {
        await db.collection('events').doc(event.id).set(event);
        console.log('Evento salvo no Firebase:', event.name);
    } catch (error) {
        console.error('Erro ao salvar evento no Firebase:', error);
    }
}

async function updateEventInFirebase(eventId, updates) {
    if (!db) return;
    
    try {
        await db.collection('events').doc(eventId).update(updates);
        console.log('Evento atualizado no Firebase:', eventId);
    } catch (error) {
        console.error('Erro ao atualizar evento no Firebase:', error);
    }
}

async function deleteEventFromFirebase(eventId) {
    if (!db) return;
    
    try {
        await db.collection('events').doc(eventId).delete();
        console.log('Evento deletado do Firebase:', eventId);
    } catch (error) {
        console.error('Erro ao deletar evento do Firebase:', error);
    }
}

async function loadAllDataFromFirebase() {
    if (!db) {
        console.log('Firebase não disponível, carregando do localStorage');
        return;
    }
    
    try {
        // Carregar atletas
        const athletesSnapshot = await db.collection('athletes').get();
        const loadedAthletes = [];
        
        athletesSnapshot.forEach(doc => {
            loadedAthletes.push(doc.data());
        });
        
        if (loadedAthletes.length > 0) {
            athletes = loadedAthletes;
            localStorage.setItem('athletes', JSON.stringify(athletes));
            console.log('Atletas carregados do Firebase:', loadedAthletes.length);
        }
        
        // Carregar eventos
        const eventsSnapshot = await db.collection('events').get();
        const loadedEvents = [];
        
        eventsSnapshot.forEach(doc => {
            loadedEvents.push(doc.data());
        });
        
        if (loadedEvents.length > 0) {
            events = loadedEvents;
            localStorage.setItem('events', JSON.stringify(events));
            console.log('Eventos carregados do Firebase:', loadedEvents.length);
        }
        
    } catch (error) {
        console.error('Erro ao carregar do Firebase:', error);
    }
}

function setupRealtimeSync() {
    if (!db) return;
    
    // Sincronização em tempo real para atletas
    db.collection('athletes').onSnapshot((snapshot) => {
        const updatedAthletes = [];
        snapshot.forEach(doc => {
            updatedAthletes.push(doc.data());
        });
        
        athletes = updatedAthletes;
        localStorage.setItem('athletes', JSON.stringify(athletes));
        
        // Atualizar a interface se necessário
        if (!homePage.classList.contains('hidden')) {
            renderDashboard();
        }
        if (!listPage.classList.contains('hidden')) {
            renderAthleteList();
        }
        
        console.log('Dados sincronizados em tempo real - Atletas:', updatedAthletes.length);
    });
    
    // Sincronização em tempo real para eventos
    db.collection('events').onSnapshot((snapshot) => {
        const updatedEvents = [];
        snapshot.forEach(doc => {
            updatedEvents.push(doc.data());
        });
        
        events = updatedEvents;
        localStorage.setItem('events', JSON.stringify(events));
        
        // Atualizar a interface se necessário
        if (!eventsPage.classList.contains('hidden')) {
            renderEventsPage();
        }
        
        console.log('Dados sincronizados em tempo real - Eventos:', updatedEvents.length);
    });
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', async function() {
    await initializeFirebase();
    initializeApp();
});

async function initializeFirebase() {
    try {
        // Carrega os scripts do Firebase se não estiverem carregados
        if (typeof firebase === 'undefined') {
            await loadFirebaseScripts();
        }
        
        // Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Carrega dados do Firebase
        await loadAllDataFromFirebase();
        
        // Configura sincronização em tempo real
        setupRealtimeSync();
        
        console.log('Firebase configurado com sucesso!');
    } catch (error) {
        console.log('Firebase não pôde ser inicializado, usando apenas localStorage:', error);
    }
}

function loadFirebaseScripts() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            resolve();
            return;
        }
        
        const script1 = document.createElement('script');
        script1.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js';
            script2.onload = resolve;
            script2.onerror = reject;
            document.head.appendChild(script2);
        };
        script1.onerror = reject;
        document.head.appendChild(script1);
    });
}

// === FUNÇÕES EXISTENTES (ATUALIZADAS) ===
function initializeApp() {
    // Navegação
    document.getElementById('nav-home').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('home');
    });
    document.getElementById('nav-register').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('register');
    });
    document.getElementById('nav-list').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('list');
    });
    document.getElementById('nav-events').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('events');
    });
    document.getElementById('nav-admin').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('admin');
    });
    document.getElementById('nav-login').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('login');
    });
    document.getElementById('nav-logout').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    document.getElementById('show-register').addEventListener('click', function(e) {
        e.preventDefault();
        showPage('register');
    });

    // Formulários
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('update-weight-btn').addEventListener('click', updateUserWeight);
    document.getElementById('delete-all-btn').addEventListener('click', deleteAllAthletes);
    
    // Botões de perfil
    document.getElementById('edit-profile-btn').addEventListener('click', showEditProfileModal);
    document.getElementById('change-photo-btn').addEventListener('click', showChangePhotoModal);
    
    // Modais de perfil
    document.getElementById('cancel-edit-profile').addEventListener('click', function() {
        editProfileModal.classList.remove('active');
    });
    document.getElementById('edit-profile-form').addEventListener('submit', handleEditProfile);
    document.getElementById('cancel-change-photo').addEventListener('click', function() {
        changePhotoModal.classList.remove('active');
    });
    document.getElementById('remove-photo').addEventListener('click', removeProfilePhoto);
    document.getElementById('change-photo-form').addEventListener('submit', handleChangePhoto);
    
    // Atletas
    document.getElementById('add-athlete-btn').addEventListener('click', function() {
        addAthleteModal.classList.add('active');
    });
    document.getElementById('cancel-add-athlete').addEventListener('click', function() {
        addAthleteModal.classList.remove('active');
    });
    document.getElementById('add-athlete-form').addEventListener('submit', handleAddAthlete);
    
    // Modal editar atleta (admin)
    document.getElementById('cancel-edit-athlete').addEventListener('click', function() {
        editAthleteModal.classList.remove('active');
    });
    document.getElementById('edit-athlete-form').addEventListener('submit', handleEditAthlete);
    
    // Eventos
    document.getElementById('create-exam-btn').addEventListener('click', function() {
        showCreateExamModal();
    });
    document.getElementById('create-event-btn').addEventListener('click', function() {
        showCreateEventModal();
    });
    document.getElementById('cancel-create-exam').addEventListener('click', function() {
        createExamModal.classList.remove('active');
    });
    document.getElementById('cancel-create-event').addEventListener('click', function() {
        createEventModal.classList.remove('active');
    });
    document.getElementById('create-exam-form').addEventListener('submit', handleCreateExam);
    document.getElementById('create-event-form').addEventListener('submit', handleCreateEvent);
    document.getElementById('close-manage-exam').addEventListener('click', function() {
        manageExamModal.classList.remove('active');
    });
    document.getElementById('close-manage-event').addEventListener('click', function() {
        manageEventModal.classList.remove('active');
    });

    // Fechar modais ao clicar fora
    const modals = [addAthleteModal, editProfileModal, changePhotoModal, editAthleteModal, 
                   createExamModal, createEventModal, manageExamModal, manageEventModal];
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    updateNavigation();
    showPage('login');
}

// Funções de navegação
function showPage(page) {
    // Esconder todas as páginas
    loginPage.classList.add('hidden');
    registerPage.classList.add('hidden');
    homePage.classList.add('hidden');
    listPage.classList.add('hidden');
    eventsPage.classList.add('hidden');
    adminPage.classList.add('hidden');
    
    // Mostrar a página solicitada
    switch(page) {
        case 'login':
            loginPage.classList.remove('hidden');
            break;
        case 'register':
            registerPage.classList.remove('hidden');
            break;
        case 'home':
            homePage.classList.remove('hidden');
            renderDashboard();
            break;
        case 'list':
            if (currentUser || isAdmin) {
                listPage.classList.remove('hidden');
                renderAthleteList();
            } else {
                showAlert('login-alert', 'Você precisa fazer login para ver a lista de atletas.', 'error');
                showPage('login');
            }
            break;
        case 'events':
            if (currentUser || isAdmin) {
                eventsPage.classList.remove('hidden');
                renderEventsPage();
            } else {
                showAlert('login-alert', 'Você precisa fazer login para ver os eventos.', 'error');
                showPage('login');
            }
            break;
        case 'admin':
            adminPage.classList.remove('hidden');
            break;
    }
}

function updateNavigation() {
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    
    if (currentUser || isAdmin) {
        navLogin.classList.add('hidden');
        navLogout.classList.remove('hidden');
    } else {
        navLogin.classList.remove('hidden');
        navLogout.classList.add('hidden');
    }
}

// Funções de autenticação
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Verificar se é admin
    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        showAlert('login-alert', 'Login administrativo realizado com sucesso!', 'success');
        updateNavigation();
        showPage('home');
        return;
    }
    
    // Verificar se é um atleta
    const athlete = athletes.find(a => a.email === email && a.password === password);
    if (athlete) {
        currentUser = athlete;
        localStorage.setItem('currentUser', JSON.stringify(athlete));
        showAlert('login-alert', 'Login realizado com sucesso!', 'success');
        updateNavigation();
        showPage('home');
    } else {
        showAlert('login-alert', 'Email ou senha incorretos.', 'error');
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        showAlert('admin-alert', 'Acesso administrativo concedido!', 'success');
        updateNavigation();
        showPage('home');
    } else {
        showAlert('admin-alert', 'Credenciais administrativas incorretas.', 'error');
    }
}

function logout() {
    currentUser = null;
    isAdmin = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    updateNavigation();
    showPage('login');
}

// === FUNÇÕES PRINCIPAIS ATUALIZADAS ===
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const rg = document.getElementById('register-rg').value;
    const birthdate = document.getElementById('register-birthdate').value;
    const instagram = document.getElementById('register-instagram').value;
    const facebook = document.getElementById('register-facebook').value;
    const tkdBelt = document.getElementById('register-tkd-belt').value;
    const hpkBelt = document.getElementById('register-hpk-belt').value;
    const weight = parseFloat(document.getElementById('register-weight').value);
    
    // Verificar se o email já existe
    if (athletes.some(a => a.email === email)) {
        showAlert('register-alert', 'Este email já está cadastrado.', 'error');
        return;
    }
    
    // Criar novo atleta (status pendente por padrão)
    const newAthlete = {
        id: Date.now().toString(),
        name,
        email,
        password,
        rg,
        birthdate,
        instagram,
        facebook,
        tkdBelt,
        hpkBelt,
        weight,
        status: 'pending',
        registeredAt: new Date().toISOString(),
        photo: null
    };
    
    // Salvar no Firebase E no localStorage
    await saveAthleteToFirebase(newAthlete);
    athletes.push(newAthlete);
    localStorage.setItem('athletes', JSON.stringify(athletes));
    
    showAlert('register-alert', 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.', 'success');
    document.getElementById('register-form').reset();
    
    // Fazer login automaticamente
    currentUser = newAthlete;
    localStorage.setItem('currentUser', JSON.stringify(newAthlete));
    updateNavigation();
    showPage('home');
}

async function handleAddAthlete(e) {
    e.preventDefault();
    const name = document.getElementById('add-athlete-name').value;
    const email = document.getElementById('add-athlete-email').value;
    const rg = document.getElementById('add-athlete-rg').value;
    const birthdate = document.getElementById('add-athlete-birthdate').value;
    const instagram = document.getElementById('add-athlete-instagram').value;
    const facebook = document.getElementById('add-athlete-facebook').value;
    const tkdBelt = document.getElementById('add-athlete-tkd-belt').value;
    const hpkBelt = document.getElementById('add-athlete-hpk-belt').value;
    const weight = parseFloat(document.getElementById('add-athlete-weight').value);
    
    // Verificar se o email já existe
    if (athletes.some(a => a.email === email)) {
        showAlert('home-alert', 'Este email já está cadastrado.', 'error');
        return;
    }
    
    // Criar novo atleta (aprovado automaticamente)
    const newAthlete = {
        id: Date.now().toString(),
        name,
        email,
        rg,
        birthdate,
        instagram,
        facebook,
        tkdBelt,
        hpkBelt,
        weight,
        status: 'approved',
        registeredAt: new Date().toISOString(),
        isManual: true,
        photo: null
    };
    
    // Salvar no Firebase E no localStorage
    await saveAthleteToFirebase(newAthlete);
    athletes.push(newAthlete);
    localStorage.setItem('athletes', JSON.stringify(athletes));
    
    showAlert('home-alert', 'Atleta adicionado com sucesso!', 'success');
    document.getElementById('add-athlete-form').reset();
    addAthleteModal.classList.remove('active');
    
    renderDashboard();
    renderAthleteList();
}

// Funções de edição de perfil
function showEditProfileModal() {
    if (!currentUser) return;
    
    // Preencher o formulário com os dados atuais
    document.getElementById('edit-profile-name').value = currentUser.name;
    document.getElementById('edit-profile-email').value = currentUser.email;
    document.getElementById('edit-profile-rg').value = currentUser.rg || '';
    document.getElementById('edit-profile-birthdate').value = currentUser.birthdate;
    document.getElementById('edit-profile-instagram').value = currentUser.instagram || '';
    document.getElementById('edit-profile-facebook').value = currentUser.facebook || '';
    document.getElementById('edit-profile-tkd-belt').value = currentUser.tkdBelt;
    document.getElementById('edit-profile-hpk-belt').value = currentUser.hpkBelt;
    document.getElementById('edit-profile-weight').value = currentUser.weight;
    
    editProfileModal.classList.add('active');
}

async function handleEditProfile(e) {
    e.preventDefault();
    
    const name = document.getElementById('edit-profile-name').value;
    const email = document.getElementById('edit-profile-email').value;
    const rg = document.getElementById('edit-profile-rg').value;
    const birthdate = document.getElementById('edit-profile-birthdate').value;
    const instagram = document.getElementById('edit-profile-instagram').value;
    const facebook = document.getElementById('edit-profile-facebook').value;
    const tkdBelt = document.getElementById('edit-profile-tkd-belt').value;
    const hpkBelt = document.getElementById('edit-profile-hpk-belt').value;
    const weight = parseFloat(document.getElementById('edit-profile-weight').value);
    
    // Verificar se o email já existe (exceto para o próprio usuário)
    if (athletes.some(a => a.email === email && a.id !== currentUser.id)) {
        showAlert('home-alert', 'Este email já está sendo usado por outro atleta.', 'error');
        return;
    }
    
    // Atualizar dados do usuário atual
    const athleteIndex = athletes.findIndex(a => a.id === currentUser.id);
    if (athleteIndex !== -1) {
        const updates = {
            name,
            email,
            rg,
            birthdate,
            instagram,
            facebook,
            tkdBelt,
            hpkBelt,
            weight
        };
        
        // Atualizar no Firebase E no localStorage
        await updateAthleteInFirebase(currentUser.id, updates);
        
        athletes[athleteIndex] = { ...athletes[athleteIndex], ...updates };
        localStorage.setItem('athletes', JSON.stringify(athletes));
    }
    
    // Atualizar currentUser
    currentUser = { ...currentUser, name, email, rg, birthdate, instagram, facebook, tkdBelt, hpkBelt, weight };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showAlert('home-alert', 'Perfil atualizado com sucesso!', 'success');
    editProfileModal.classList.remove('active');
    renderUserDashboard();
}

function showChangePhotoModal() {
    if (!currentUser) return;
    
    const photoPreview = document.getElementById('current-photo-preview');
    if (currentUser.photo) {
        photoPreview.src = currentUser.photo;
        photoPreview.style.display = 'block';
    } else {
        photoPreview.style.display = 'none';
    }
    
    changePhotoModal.classList.add('active');
}

async function handleChangePhoto(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('photo-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('home-alert', 'Por favor, selecione uma foto.', 'error');
        return;
    }
    
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
        showAlert('home-alert', 'Por favor, selecione um arquivo de imagem.', 'error');
        return;
    }
    
    // Verificar tamanho do arquivo (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showAlert('home-alert', 'A imagem deve ter no máximo 2MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const photoData = e.target.result;
        
        // Atualizar foto do usuário atual
        const athleteIndex = athletes.findIndex(a => a.id === currentUser.id);
        if (athleteIndex !== -1) {
            const updates = { photo: photoData };
            
            // Atualizar no Firebase E no localStorage
            await updateAthleteInFirebase(currentUser.id, updates);
            
            athletes[athleteIndex].photo = photoData;
            localStorage.setItem('athletes', JSON.stringify(athletes));
        }
        
        // Atualizar currentUser
        currentUser.photo = photoData;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showAlert('home-alert', 'Foto de perfil atualizada com sucesso!', 'success');
        changePhotoModal.classList.remove('active');
        renderUserDashboard();
    };
    
    reader.readAsDataURL(file);
}

async function removeProfilePhoto() {
    if (!currentUser) return;
    
    // Remover foto do usuário atual
    const athleteIndex = athletes.findIndex(a => a.id === currentUser.id);
    if (athleteIndex !== -1) {
        const updates = { photo: null };
        
        // Atualizar no Firebase E no localStorage
        await updateAthleteInFirebase(currentUser.id, updates);
        
        athletes[athleteIndex].photo = null;
        localStorage.setItem('athletes', JSON.stringify(athletes));
    }
    
    // Atualizar currentUser
    currentUser.photo = null;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showAlert('home-alert', 'Foto de perfil removida com sucesso!', 'success');
    changePhotoModal.classList.remove('active');
    renderUserDashboard();
}

// Funções de edição de atleta (admin)
function showEditAthleteModal(athleteId) {
    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return;
    
    // Preencher o formulário com os dados do atleta
    document.getElementById('edit-athlete-id').value = athlete.id;
    document.getElementById('edit-athlete-name').value = athlete.name;
    document.getElementById('edit-athlete-email').value = athlete.email;
    document.getElementById('edit-athlete-password').value = '';
    document.getElementById('edit-athlete-rg').value = athlete.rg || '';
    document.getElementById('edit-athlete-birthdate').value = athlete.birthdate;
    document.getElementById('edit-athlete-instagram').value = athlete.instagram || '';
    document.getElementById('edit-athlete-facebook').value = athlete.facebook || '';
    document.getElementById('edit-athlete-tkd-belt').value = athlete.tkdBelt;
    document.getElementById('edit-athlete-hpk-belt').value = athlete.hpkBelt;
    document.getElementById('edit-athlete-weight').value = athlete.weight;
    document.getElementById('edit-athlete-status').value = athlete.status;
    
    editAthleteModal.classList.add('active');
}

async function handleEditAthlete(e) {
    e.preventDefault();
    
    const athleteId = document.getElementById('edit-athlete-id').value;
    const name = document.getElementById('edit-athlete-name').value;
    const email = document.getElementById('edit-athlete-email').value;
    const password = document.getElementById('edit-athlete-password').value;
    const rg = document.getElementById('edit-athlete-rg').value;
    const birthdate = document.getElementById('edit-athlete-birthdate').value;
    const instagram = document.getElementById('edit-athlete-instagram').value;
    const facebook = document.getElementById('edit-athlete-facebook').value;
    const tkdBelt = document.getElementById('edit-athlete-tkd-belt').value;
    const hpkBelt = document.getElementById('edit-athlete-hpk-belt').value;
    const weight = parseFloat(document.getElementById('edit-athlete-weight').value);
    const status = document.getElementById('edit-athlete-status').value;
    
    // Verificar se o email já existe (exceto para o próprio atleta)
    if (athletes.some(a => a.email === email && a.id !== athleteId)) {
        showAlert('home-alert', 'Este email já está sendo usado por outro atleta.', 'error');
        return;
    }
    
    // Atualizar dados do atleta
    const athleteIndex = athletes.findIndex(a => a.id === athleteId);
    if (athleteIndex !== -1) {
        const updates = {
            name,
            email,
            rg,
            birthdate,
            instagram,
            facebook,
            tkdBelt,
            hpkBelt,
            weight,
            status
        };
        
        // Atualizar senha se fornecida
        if (password) {
            updates.password = password;
        }
        
        // Atualizar no Firebase E no localStorage
        await updateAthleteInFirebase(athleteId, updates);
        
        athletes[athleteIndex] = { ...athletes[athleteIndex], ...updates };
        localStorage.setItem('athletes', JSON.stringify(athletes));
        
        // Se for o usuário atual, atualizar também
        if (currentUser && currentUser.id === athleteId) {
            currentUser = athletes[athleteIndex];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    showAlert('home-alert', 'Atleta atualizado com sucesso!', 'success');
    editAthleteModal.classList.remove('active');
    renderDashboard();
    renderAthleteList();
}

// Funções de renderização (mantidas iguais)
function renderDashboard() {
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const pendingApprovalMessage = document.getElementById('pending-approval-message');
    
    if (isAdmin) {
        userDashboard.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        renderAdminDashboard();
    } else if (currentUser) {
        userDashboard.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        renderUserDashboard();
        
        if (currentUser.status === 'pending') {
            pendingApprovalMessage.classList.remove('hidden');
        } else {
            pendingApprovalMessage.classList.add('hidden');
        }
    }
}

function renderUserDashboard() {
    const userData = document.getElementById('user-data');
    
    const birthdate = new Date(currentUser.birthdate);
    const formattedDate = `${birthdate.getDate().toString().padStart(2, '0')}/${(birthdate.getMonth() + 1).toString().padStart(2, '0')}/${birthdate.getFullYear()}`;
    
    let socialHTML = '';
    if (currentUser.instagram) {
        socialHTML += `<p><strong>Instagram:</strong> <a href="https://instagram.com/${currentUser.instagram.replace('@', '')}" class="social-link" target="_blank">${currentUser.instagram}</a></p>`;
    }
    if (currentUser.facebook) {
        socialHTML += `<p><strong>Facebook:</strong> ${currentUser.facebook}</p>`;
    }
    
    // Foto de perfil
    let photoHTML = '';
    if (currentUser.photo) {
        photoHTML = `<img src="${currentUser.photo}" alt="Foto de ${currentUser.name}" class="athlete-photo" style="float: right; margin-left: 1rem;">`;
    } else {
        photoHTML = `<div class="photo-placeholder" style="float: right; margin-left: 1rem;">Sem Foto</div>`;
    }
    
    userData.innerHTML = `
        ${photoHTML}
        <p><strong>Nome:</strong> ${currentUser.name}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Data de Nascimento:</strong> ${formattedDate}</p>
        ${socialHTML}
        <p><strong>Faixa de Taekwondo:</strong> <span class="belt belt-${currentUser.tkdBelt}">${getBeltName(currentUser.tkdBelt)}</span></p>
        <p><strong>Faixa de Hapkido:</strong> <span class="belt belt-hapkido-${currentUser.hpkBelt}">${getBeltName(currentUser.hpkBelt)}</span></p>
        <p><strong>Peso:</strong> ${currentUser.weight} kg</p>
        <p><strong>Status:</strong> <span class="status-badge status-${currentUser.status}">${currentUser.status === 'pending' ? 'Pendente' : 'Aprovado'}</span></p>
        <div style="clear: both;"></div>
    `;
    
    document.getElementById('update-weight').value = currentUser.weight;
}

function renderAdminDashboard() {
    const pendingAthletes = document.getElementById('pending-athletes');
    const allAthletesList = document.getElementById('all-athletes-list');
    const adminStats = document.getElementById('admin-stats');
    
    // Cadastros pendentes
    const pending = athletes.filter(a => a.status === 'pending');
    if (pending.length > 0) {
        let pendingHTML = '<ul>';
        pending.forEach(athlete => {
            pendingHTML += `
                <li style="margin-bottom: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px;">
                    <div><strong>${athlete.name}</strong> (${athlete.email})</div>
                    <div style="font-size: 0.9rem; color: #666;">Faixa TKD: ${getBeltName(athlete.tkdBelt)}</div>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-success btn-small" onclick="approveAthlete('${athlete.id}')">Aprovar</button>
                        <button class="btn btn-danger btn-small" onclick="deleteAthlete('${athlete.id}')">Recusar</button>
                    </div>
                </li>
            `;
        });
        pendingHTML += '</ul>';
        pendingAthletes.innerHTML = pendingHTML;
    } else {
        pendingAthletes.innerHTML = '<p>Nenhum cadastro pendente.</p>';
    }
    
    // Lista completa de atletas
    if (athletes.length > 0) {
        let athletesHTML = '';
        athletes.forEach(athlete => {
            const birthdate = new Date(athlete.birthdate);
            const formattedDate = `${birthdate.getDate().toString().padStart(2, '0')}/${(birthdate.getMonth() + 1).toString().padStart(2, '0')}/${birthdate.getFullYear()}`;
            
            // Foto do atleta
            let photoHTML = '';
            if (athlete.photo) {
                photoHTML = `<img src="${athlete.photo}" alt="Foto de ${athlete.name}" class="athlete-photo-small">`;
            } else {
                photoHTML = `<div class="photo-placeholder-small">Sem Foto</div>`;
            }
            
            athletesHTML += `
                <div class="athlete-card">
                    <div class="athlete-card-header">
                        ${photoHTML}
                        <div class="athlete-card-info">
                            <h4>${athlete.name}</h4>
                            <p style="color: #666; font-size: 0.9rem;">${athlete.email}</p>
                        </div>
                        <div class="athlete-card-actions">
                            <button class="btn btn-primary btn-small" onclick="showEditAthleteModal('${athlete.id}')">Editar</button>
                            <button class="btn btn-danger btn-small" onclick="deleteAthlete('${athlete.id}')">Excluir</button>
                            ${athlete.status === 'pending' ? `<button class="btn btn-success btn-small" onclick="approveAthlete('${athlete.id}')">Aprovar</button>` : ''}
                        </div>
                    </div>
                    <div class="athlete-details-grid">
                        <div class="athlete-detail">
                            <span>Data Nasc.:</span>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="athlete-detail">
                            <span>RG:</span>
                            <span>${athlete.rg || 'Não informado'}</span>
                        </div>
                        <div class="athlete-detail">
                            <span>Faixa TKD:</span>
                            <span class="belt belt-${athlete.tkdBelt}">${getBeltName(athlete.tkdBelt)}</span>
                        </div>
                        <div class="athlete-detail">
                            <span>Faixa HPK:</span>
                            <span class="belt belt-hapkido-${athlete.hpkBelt}">${getBeltName(athlete.hpkBelt)}</span>
                        </div>
                        <div class="athlete-detail">
                            <span>Peso:</span>
                            <span>${athlete.weight} kg</span>
                        </div>
                        <div class="athlete-detail">
                            <span>Status:</span>
                            <span class="status-badge status-${athlete.status}">${athlete.status === 'pending' ? 'Pendente' : 'Aprovado'}</span>
                        </div>
                        ${athlete.instagram ? `
                        <div class="athlete-detail">
                            <span>Instagram:</span>
                            <span>${athlete.instagram}</span>
                        </div>
                        ` : ''}
                        ${athlete.facebook ? `
                        <div class="athlete-detail">
                            <span>Facebook:</span>
                            <span>${athlete.facebook}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        allAthletesList.innerHTML = athletesHTML;
    } else {
        allAthletesList.innerHTML = '<p>Nenhum atleta cadastrado.</p>';
    }
    
    // Estatísticas
    const totalAthletes = athletes.length;
    const approvedAthletes = athletes.filter(a => a.status === 'approved').length;
    const pendingAthletesCount = pending.length;
    const manualAthletes = athletes.filter(a => a.isManual).length;
    
    adminStats.innerHTML = `
        <p><strong>Total de Atletas:</strong> ${totalAthletes}</p>
        <p><strong>Atletas Aprovados:</strong> ${approvedAthletes}</p>
        <p><strong>Cadastros Pendentes:</strong> ${pendingAthletesCount}</p>
        <p><strong>Atletas Manuais:</strong> ${manualAthletes}</p>
    `;
}

function renderAthleteList() {
    const tableBody = document.getElementById('athlete-table-body');
    tableBody.innerHTML = '';
    
    const beltOrder = {
        'black': 10, 'red-black': 9, 'red': 8, 'purple': 7,
        'blue-dark': 6, 'blue-light': 5, 'green': 4, 'orange': 3,
        'yellow': 2, 'white': 1
    };
    
    let athletesToShow = [...athletes];
    if (!isAdmin) {
        athletesToShow = athletesToShow.filter(a => a.status === 'approved');
    }
    
    const sortedAthletes = athletesToShow.sort((a, b) => {
        return beltOrder[b.tkdBelt] - beltOrder[a.tkdBelt];
    });
    
    sortedAthletes.forEach(athlete => {
        const row = document.createElement('tr');
        
        const birthdate = new Date(athlete.birthdate);
        const formattedDate = `${birthdate.getDate().toString().padStart(2, '0')}/${(birthdate.getMonth() + 1).toString().padStart(2, '0')}/${birthdate.getFullYear()}`;
        
        // Mostrar RG apenas para admin
        const rgDisplay = isAdmin && athlete.rg ? athlete.rg : '<span class="rg-admin-only">Apenas Admin</span>';
        
        // Mostrar email apenas para admin
        const emailDisplay = isAdmin ? athlete.email : '<span class="email-admin-only">Apenas Admin</span>';
        
        row.innerHTML = `
            <td>${athlete.name}</td>
            <td>${emailDisplay}</td>
            <td>${formattedDate}</td>
            <td>${rgDisplay}</td>
            <td><span class="belt belt-${athlete.tkdBelt}">${getBeltName(athlete.tkdBelt)}</span></td>
            <td><span class="belt belt-hapkido-${athlete.hpkBelt}">${getBeltName(athlete.hpkBelt)}</span></td>
            <td>${athlete.weight}</td>
            <td><span class="status-badge status-${athlete.status}">${athlete.status === 'pending' ? 'Pendente' : 'Aprovado'}</span></td>
            <td class="actions">
                ${(isAdmin || currentUser?.id === athlete.id) ? `<button class="btn btn-primary btn-small" onclick="editWeight('${athlete.id}')">Alterar Peso</button>` : ''}
                ${isAdmin ? `<button class="btn btn-danger btn-small" onclick="deleteAthlete('${athlete.id}')">Excluir</button>` : ''}
                ${isAdmin && athlete.status === 'pending' ? `<button class="btn btn-success btn-small" onclick="approveAthlete('${athlete.id}')">Aprovar</button>` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Funções de eventos (atualizadas com Firebase)
async function handleCreateExam(e) {
    e.preventDefault();
    const name = document.getElementById('exam-name').value;
    const date = document.getElementById('exam-date').value;
    const type = document.getElementById('exam-type').value;
    
    // Coletar participantes selecionados
    const selectedAthletes = [];
    const checkboxes = document.querySelectorAll('#exam-athletes-list input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const athleteId = checkbox.value;
        const athlete = athletes.find(a => a.id === athleteId);
        if (athlete) {
            selectedAthletes.push({
                athleteId: athlete.id,
                name: athlete.name,
                currentTkdBelt: athlete.tkdBelt,
                currentHpkBelt: athlete.hpkBelt,
                passed: false,
                newTkdBelt: athlete.tkdBelt,
                newHpkBelt: athlete.hpkBelt
            });
        }
    });
    
    if (selectedAthletes.length === 0) {
        showAlert('events-alert', 'Selecione pelo menos um atleta para o exame.', 'error');
        return;
    }
    
    const newExam = {
        id: Date.now().toString(),
        type: 'exam',
        examType: type,
        name,
        date,
        participants: selectedAthletes,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Salvar no Firebase E no localStorage
    await saveEventToFirebase(newExam);
    events.push(newExam);
    localStorage.setItem('events', JSON.stringify(events));
    
    showAlert('events-alert', 'Exame criado com sucesso!', 'success');
    document.getElementById('create-exam-form').reset();
    createExamModal.classList.remove('active');
    
    renderEventsPage();
}

async function handleCreateEvent(e) {
    e.preventDefault();
    const type = document.getElementById('event-type').value;
    const name = document.getElementById('event-name').value;
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;
    
    // Coletar participantes selecionados
    const selectedAthletes = [];
    const checkboxes = document.querySelectorAll('#event-athletes-list input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const athleteId = checkbox.value;
        const athlete = athletes.find(a => a.id === athleteId);
        if (athlete) {
            selectedAthletes.push({
                athleteId: athlete.id,
                name: athlete.name
            });
        }
    });
    
    const newEvent = {
        id: Date.now().toString(),
        type,
        name,
        date,
        description,
        participants: selectedAthletes,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Salvar no Firebase E no localStorage
    await saveEventToFirebase(newEvent);
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    
    showAlert('events-alert', 'Evento criado com sucesso!', 'success');
    document.getElementById('create-event-form').reset();
    createEventModal.classList.remove('active');
    
    renderEventsPage();
}

// Funções de ações (atualizadas)
async function approveAthlete(athleteId) {
    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return;
    
    // Atualizar no Firebase E no localStorage
    await updateAthleteInFirebase(athleteId, { status: 'approved' });
    
    athlete.status = 'approved';
    localStorage.setItem('athletes', JSON.stringify(athletes));
    
    if (currentUser && currentUser.id === athleteId) {
        currentUser.status = 'approved';
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    renderAthleteList();
    renderDashboard();
    showAlert('home-alert', 'Atleta aprovado com sucesso!', 'success');
}

async function deleteAthlete(athleteId) {
    if (confirm('Tem certeza que deseja excluir este atleta?')) {
        // Deletar do Firebase E do localStorage
        await deleteAthleteFromFirebase(athleteId);
        athletes = athletes.filter(a => a.id !== athleteId);
        localStorage.setItem('athletes', JSON.stringify(athletes));
        
        if (currentUser && currentUser.id === athleteId) {
            logout();
        } else {
            renderAthleteList();
            renderDashboard();
            showAlert('list-alert', 'Atleta excluído com sucesso!', 'success');
        }
    }
}

async function deleteEvent(eventId) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
        // Deletar do Firebase E do localStorage
        await deleteEventFromFirebase(eventId);
        events = events.filter(e => e.id !== eventId);
        localStorage.setItem('events', JSON.stringify(events));
        renderEventsPage();
        showAlert('events-alert', 'Evento excluído com sucesso!', 'success');
    }
}

// Funções utilitárias (mantidas iguais)
function getBeltName(beltKey) {
    const beltNames = {
        'white': 'Branca', 'gray': 'Cinza', 'yellow': 'Amarela', 'orange': 'Laranja',
        'green': 'Verde', 'blue-light': 'Azul Claro', 'blue-dark': 'Azul Escuro',
        'blue': 'Azul', 'brown': 'Marrom', 'purple': 'Roxa', 'red': 'Vermelha',
        'red-black': 'Ponta Preta', 'black': 'Preta'
    };
    
    return beltNames[beltKey] || beltKey;
}

function getExamTypeName(type) {
    const typeNames = {
        'tkd': 'Taekwondo',
        'hpk': 'Hapkido',
        'both': 'Taekwondo e Hapkido'
    };
    
    return typeNames[type] || type;
}

function getEventTypeName(type) {
    const typeNames = {
        'exam': 'Exame de Faixa',
        'seminar': 'Seminário',
        'championship': 'Campeonato',
        'training': 'Treinamento',
        'other': 'Outro'
    };
    
    return typeNames[type] || type;
}

function generateBeltOptions(type, currentBelt, selectedBelt) {
    const beltsTkd = ['white', 'yellow', 'orange', 'green', 'blue-light', 'blue-dark', 'purple', 'red', 'red-black', 'black'];
    const beltsHpk = ['white', 'gray', 'yellow', 'orange', 'green', 'blue', 'brown', 'red', 'red-black', 'black'];
    
    const belts = type === 'tkd' ? beltsTkd : beltsHpk;
    let options = '';
    
    belts.forEach(belt => {
        if (belts.indexOf(belt) >= belts.indexOf(currentBelt)) {
            options += `<option value="${belt}" ${belt === selectedBelt ? 'selected' : ''}>${getBeltName(belt)}</option>`;
        }
    });
    
    return options;
}

function updateUserWeight() {
    const newWeight = parseFloat(document.getElementById('update-weight').value);
    if (isNaN(newWeight)) {
        showAlert('home-alert', 'Por favor, insira um peso válido.', 'error');
        return;
    }
    
    const athleteIndex = athletes.findIndex(a => a.id === currentUser.id);
    if (athleteIndex !== -1) {
        athletes[athleteIndex].weight = newWeight;
        localStorage.setItem('athletes', JSON.stringify(athletes));
        updateAthleteInFirebase(currentUser.id, { weight: newWeight });
    }
    
    currentUser.weight = newWeight;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showAlert('home-alert', 'Peso atualizado com sucesso!', 'success');
    renderUserDashboard();
}

function editWeight(athleteId) {
    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return;
    
    const newWeight = prompt(`Alterar peso para ${athlete.name}:`, athlete.weight);
    if (newWeight !== null && !isNaN(parseFloat(newWeight))) {
        athlete.weight = parseFloat(newWeight);
        localStorage.setItem('athletes', JSON.stringify(athletes));
        updateAthleteInFirebase(athleteId, { weight: parseFloat(newWeight) });
        
        if (currentUser && currentUser.id === athleteId) {
            currentUser.weight = parseFloat(newWeight);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        renderAthleteList();
        if (homePage.classList.contains('hidden')) {
            showAlert('list-alert', 'Peso atualizado com sucesso!', 'success');
        } else {
            renderDashboard();
        }
    }
}

function deleteAllAthletes() {
    if (confirm('Tem certeza que deseja excluir TODOS os atletas? Esta ação não pode ser desfeita.')) {
        // Deletar todos do Firebase
        if (db) {
            athletes.forEach(athlete => {
                deleteAthleteFromFirebase(athlete.id);
            });
        }
        
        athletes = [];
        localStorage.setItem('athletes', JSON.stringify(athletes));
        renderAthleteList();
        renderDashboard();
        showAlert('home-alert', 'Todos os atletas foram excluídos.', 'success');
    }
}

function showAlert(containerId, message, type) {
    const alertContainer = document.getElementById(containerId);
    alertContainer.textContent = message;
    alertContainer.classList.remove('hidden', 'alert-success', 'alert-error', 'alert-warning');
    
    if (type === 'success') {
        alertContainer.classList.add('alert-success');
    } else if (type === 'warning') {
        alertContainer.classList.add('alert-warning');
    } else {
        alertContainer.classList.add('alert-error');
    }
    
    setTimeout(() => {
        alertContainer.classList.add('hidden');
    }, 5000);
}

// Funções de eventos (mantidas)
function renderEventsPage() {
    const userEvents = document.getElementById('user-events');
    const adminEvents = document.getElementById('admin-events');
    
    if (isAdmin) {
        userEvents.classList.add('hidden');
        adminEvents.classList.remove('hidden');
        renderAdminEvents();
    } else if (currentUser) {
        userEvents.classList.remove('hidden');
        adminEvents.classList.add('hidden');
        renderUserEvents();
    }
}

function renderUserEvents() {
    const userEventsList = document.getElementById('user-events-list');
    const userEvents = events.filter(event => 
        event.participants && event.participants.some(p => p.athleteId === currentUser.id)
    );
    
    if (userEvents.length > 0) {
        let eventsHTML = '<ul>';
        userEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const formattedDate = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
            
            eventsHTML += `
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 6px;">
                    <h4>${event.name} <span class="event-type-badge event-type-${event.type}">${getEventTypeName(event.type)}</span></h4>
                    <p><strong>Data:</strong> ${formattedDate}</p>
                    ${event.description ? `<p><strong>Descrição:</strong> ${event.description}</p>` : ''}
                    <p><strong>Status:</strong> ${event.completed ? 'Concluído' : 'Agendado'}</p>
                </li>
            `;
        });
        eventsHTML += '</ul>';
        userEventsList.innerHTML = eventsHTML;
    } else {
        userEventsList.innerHTML = '<p>Nenhum evento agendado.</p>';
    }
}

function renderAdminEvents() {
    const activeEvents = document.getElementById('active-events');
    const eventsHistory = document.getElementById('events-history');
    
    // Eventos ativos
    const active = events.filter(event => !event.completed);
    if (active.length > 0) {
        let activeHTML = '<ul>';
        active.forEach(event => {
            const eventDate = new Date(event.date);
            const formattedDate = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
            
            activeHTML += `
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 6px;">
                    <h4>${event.name} <span class="event-type-badge event-type-${event.type}">${getEventTypeName(event.type)}</span></h4>
                    <p><strong>Data:</strong> ${formattedDate}</p>
                    <p><strong>Participantes:</strong> ${event.participants ? event.participants.length : 0}</p>
                    <div style="margin-top: 0.5rem;">
                        <button class="btn btn-primary btn-small" onclick="manageEvent('${event.id}')">Gerenciar</button>
                        <button class="btn btn-danger btn-small" onclick="deleteEvent('${event.id}')">Excluir</button>
                    </div>
                </li>
            `;
        });
        activeHTML += '</ul>';
        activeEvents.innerHTML = activeHTML;
    } else {
        activeEvents.innerHTML = '<p>Nenhum evento ativo.</p>';
    }
    
    // Histórico
    const completed = events.filter(event => event.completed);
    if (completed.length > 0) {
        let historyHTML = '<ul>';
        completed.forEach(event => {
            const eventDate = new Date(event.date);
            const formattedDate = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
            
            historyHTML += `
                <li style="margin-bottom: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px;">
                    <strong>${event.name}</strong> - ${formattedDate} 
                    <span class="event-type-badge event-type-${event.type}">${getEventTypeName(event.type)}</span>
                </li>
            `;
        });
        historyHTML += '</ul>';
        eventsHistory.innerHTML = historyHTML;
    } else {
        eventsHistory.innerHTML = '<p>Nenhum evento concluído.</p>';
    }
}

function showCreateExamModal() {
    const athletesList = document.getElementById('exam-athletes-list');
    athletesList.innerHTML = '';
    
    // Listar apenas atletas aprovados
    const approvedAthletes = athletes.filter(a => a.status === 'approved');
    
    approvedAthletes.forEach(athlete => {
        const checkbox = document.createElement('div');
        checkbox.className = 'athlete-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="exam-athlete-${athlete.id}" value="${athlete.id}">
            <label for="exam-athlete-${athlete.id}">
                <strong>${athlete.name}</strong> - TKD: ${getBeltName(athlete.tkdBelt)} | HPK: ${getBeltName(athlete.hpkBelt)}
            </label>
        `;
        athletesList.appendChild(checkbox);
    });
    
    createExamModal.classList.add('active');
}

function showCreateEventModal() {
    const athletesList = document.getElementById('event-athletes-list');
    athletesList.innerHTML = '';
    
    // Listar apenas atletas aprovados
    const approvedAthletes = athletes.filter(a => a.status === 'approved');
    
    approvedAthletes.forEach(athlete => {
        const checkbox = document.createElement('div');
        checkbox.className = 'athlete-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="event-athlete-${athlete.id}" value="${athlete.id}">
            <label for="event-athlete-${athlete.id}">
                <strong>${athlete.name}</strong> - TKD: ${getBeltName(athlete.tkdBelt)}
            </label>
        `;
        athletesList.appendChild(checkbox);
    });
    
    createEventModal.classList.add('active');
}

function manageExam(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const title = document.getElementById('manage-exam-title');
    const content = document.getElementById('manage-exam-content');
    
    title.textContent = `Gerenciar: ${event.name}`;
    
    let contentHTML = `
        <p><strong>Data:</strong> ${new Date(event.date).toLocaleDateString('pt-BR')}</p>
        <p><strong>Tipo:</strong> ${getExamTypeName(event.examType)}</p>
        <p><strong>Status:</strong> ${event.completed ? 'Concluído' : 'Em andamento'}</p>
        
        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem;">Participantes</h4>
        <div class="exam-participants-list">
    `;
    
    event.participants.forEach(participant => {
        const athlete = athletes.find(a => a.id === participant.athleteId);
        if (athlete) {
            contentHTML += `
                <div class="exam-participant">
                    <div>
                        <strong>${participant.name}</strong><br>
                        <small>
                            TKD: ${getBeltName(participant.currentTkdBelt)} → 
                            <select id="new-tkd-${participant.athleteId}" ${event.completed ? 'disabled' : ''}>
                                ${generateBeltOptions('tkd', participant.currentTkdBelt, participant.newTkdBelt)}
                            </select>
                        </small>
                        ${event.examType !== 'tkd' ? `<br><small>
                            HPK: ${getBeltName(participant.currentHpkBelt)} → 
                            <select id="new-hpk-${participant.athleteId}" ${event.completed ? 'disabled' : ''}>
                                ${generateBeltOptions('hpk', participant.currentHpkBelt, participant.newHpkBelt)}
                            </select>
                        </small>` : ''}
                    </div>
                    <div class="participant-actions">
                        <label>
                            <input type="checkbox" id="passed-${participant.athleteId}" 
                                   ${participant.passed ? 'checked' : ''} 
                                   ${event.completed ? 'disabled' : ''}
                                   onchange="updateExamParticipantStatus('${event.id}', '${participant.athleteId}')">
                            Aprovado
                        </label>
                    </div>
                </div>
            `;
        }
    });
    
    contentHTML += '</div>';
    
    if (!event.completed) {
        contentHTML += `
            <div style="margin-top: 1.5rem;">
                <button class="btn btn-success" onclick="completeExam('${event.id}')">Finalizar Exame</button>
                <button class="btn btn-outline" onclick="updateAllExamBelts('${event.id}')">Atualizar Todas as Faixas</button>
            </div>
        `;
    }
    
    content.innerHTML = contentHTML;
    manageExamModal.classList.add('active');
}

function manageEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const title = document.getElementById('manage-event-title');
    const content = document.getElementById('manage-event-content');
    
    title.textContent = `Gerenciar: ${event.name}`;
    
    let contentHTML = `
        <p><strong>Tipo:</strong> ${getEventTypeName(event.type)}</p>
        <p><strong>Data:</strong> ${new Date(event.date).toLocaleDateString('pt-BR')}</p>
        ${event.description ? `<p><strong>Descrição:</strong> ${event.description}</p>` : ''}
        <p><strong>Status:</strong> ${event.completed ? 'Concluído' : 'Agendado'}</p>
        
        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem;">Participantes</h4>
        <div class="event-participants-list">
    `;
    
    if (event.participants && event.participants.length > 0) {
        event.participants.forEach(participant => {
            contentHTML += `
                <div class="event-participant">
                    <div>${participant.name}</div>
                </div>
            `;
        });
    } else {
        contentHTML += '<p>Nenhum participante.</p>';
    }
    
    contentHTML += '</div>';
    
    if (!event.completed) {
        contentHTML += `
            <div style="margin-top: 1.5rem;">
                <button class="btn btn-success" onclick="completeEvent('${event.id}')">Marcar como Concluído</button>
            </div>
        `;
    }
    
    content.innerHTML = contentHTML;
    manageEventModal.classList.add('active');
}

function updateExamParticipantStatus(eventId, athleteId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const participant = event.participants.find(p => p.athleteId === athleteId);
    if (participant) {
        const passedCheckbox = document.getElementById(`passed-${athleteId}`);
        participant.passed = passedCheckbox.checked;
        
        // Atualizar faixas se aprovado
        if (participant.passed) {
            const newTkdSelect = document.getElementById(`new-tkd-${athleteId}`);
            const newHpkSelect = document.getElementById(`new-hpk-${athleteId}`);
            
            if (newTkdSelect) participant.newTkdBelt = newTkdSelect.value;
            if (newHpkSelect) participant.newHpkBelt = newHpkSelect.value;
        } else {
            // Se reprovado, mantém as faixas atuais
            participant.newTkdBelt = participant.currentTkdBelt;
            participant.newHpkBelt = participant.currentHpkBelt;
        }
        
        localStorage.setItem('events', JSON.stringify(events));
        updateEventInFirebase(eventId, { participants: event.participants });
    }
}

function updateAllExamBelts(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    event.participants.forEach(participant => {
        const passedCheckbox = document.getElementById(`passed-${participant.athleteId}`);
        if (passedCheckbox && passedCheckbox.checked) {
            const newTkdSelect = document.getElementById(`new-tkd-${participant.athleteId}`);
            const newHpkSelect = document.getElementById(`new-hpk-${participant.athleteId}`);
            
            if (newTkdSelect) participant.newTkdBelt = newTkdSelect.value;
            if (newHpkSelect) participant.newHpkBelt = newHpkSelect.value;
        }
    });
    
    localStorage.setItem('events', JSON.stringify(events));
    updateEventInFirebase(eventId, { participants: event.participants });
    showAlert('events-alert', 'Todas as faixas foram atualizadas!', 'success');
}

async function completeExam(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (confirm('Deseja finalizar este exame? Esta ação não pode ser desfeita.')) {
        event.completed = true;
        
        // Aplicar mudanças de faixa aos atletas
        event.participants.forEach(participant => {
            if (participant.passed) {
                const athlete = athletes.find(a => a.id === participant.athleteId);
                if (athlete) {
                    athlete.tkdBelt = participant.newTkdBelt;
                    if (event.examType !== 'tkd') {
                        athlete.hpkBelt = participant.newHpkBelt;
                    }
                    
                    // Atualizar atleta no Firebase
                    const updates = { tkdBelt: participant.newTkdBelt };
                    if (event.examType !== 'tkd') {
                        updates.hpkBelt = participant.newHpkBelt;
                    }
                    updateAthleteInFirebase(athlete.id, updates);
                }
            }
        });
        
        localStorage.setItem('events', JSON.stringify(events));
        localStorage.setItem('athletes', JSON.stringify(athletes));
        await updateEventInFirebase(eventId, { completed: true, participants: event.participants });
        
        showAlert('events-alert', 'Exame finalizado com sucesso! As faixas foram atualizadas.', 'success');
        manageExamModal.classList.remove('active');
        renderEventsPage();
        renderAthleteList();
    }
}

async function completeEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (confirm('Deseja marcar este evento como concluído?')) {
        event.completed = true;
        localStorage.setItem('events', JSON.stringify(events));
        await updateEventInFirebase(eventId, { completed: true });
        
        showAlert('events-alert', 'Evento marcado como concluído!', 'success');
        manageEventModal.classList.remove('active');
        renderEventsPage();
    }
}

// Tornar funções globais para os botões
window.approveAthlete = approveAthlete;
window.deleteAthlete = deleteAthlete;
window.editWeight = editWeight;
window.showEditAthleteModal = showEditAthleteModal;
window.manageExam = manageExam;
window.manageEvent = manageEvent;
window.deleteEvent = deleteEvent;
window.updateExamParticipantStatus = updateExamParticipantStatus;
window.updateAllExamBelts = updateAllExamBelts;
window.completeExam = completeExam;
window.completeEvent = completeEvent;