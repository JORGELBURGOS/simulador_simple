// Datos iniciales
const initialData = {
    products: [],
    clients: [],
    additionalProducts: [],
    pestelVariables: {
        political: [],
        economic: [],
        social: [],
        technological: [],
        ecological: [],
        legal: []
    },
    porterVariables: {
        "new-entrants": [],
        "buyers": [],
        "substitutes": [],
        "competition": [],
        "suppliers": []
    },
    strategies: [],
    selectedPestelVariables: [],
    selectedPorterVariables: [],
    activeStrategies: [],
    financialData: {
        revenue: 0,
        opCosts: 0,
        genExpenses: 0,
        ebitda: 0,
        roi: 0,
        nps: 50,
        churn: 5,
        uptime: 99.5
    },
    budget: {
        revenue: 1000000,
        opCosts: 300000,
        genExpenses: 200000,
        ebitda: 500000,
        roi: 25,
        nps: 60,
        churn: 3,
        uptime: 99.9
    }
};

// Estado de la aplicación
let state = {
    ...initialData,
    currentSection: 'clientes'
};

// Cargar datos iniciales desde archivos JSON
async function loadInitialData() {
    try {
        const [productsRes, clientsRes, strategiesRes] = await Promise.all([
            fetch('productos.json'),
            fetch('clientes.json'),
            fetch('estrategias.json')
        ]);
        
        const productsData = await productsRes.json();
        const clientsData = await clientsRes.json();
        const strategiesData = await strategiesRes.json();
        
        // Procesar productos
        state.products = productsData.map(product => ({
            ...product,
            clients: [],
            transactions: 0,
            unitValue: 0,
            growth: 0,
            marketShare: 0,
            marketGrowth: 0,
            strategy: ""
        }));
        
        // Procesar clientes
        state.clients = clientsData.map(client => ({
            ...client,
            products: [],
            transactions: 0,
            revenue: 0
        }));
        
        // Procesar estrategias
        state.strategies = strategiesData;
        
        // Generar datos aleatorios para transacciones y valores unitarios
        generateInitialTransactionData();
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        // Si hay error, generar datos de prueba
        generateTestData();
    }
}
function populateStrategyProductOptions() {
    const select = document.getElementById('strategy-product');
    if (!select) return;

    select.innerHTML = '<option value="">-- Ninguno --</option>';
    state.products.forEach(prod => {
        const opt = document.createElement('option');
        opt.value = prod.id;
        opt.textContent = prod.name;
        select.appendChild(opt);
    });
}

// Generar datos de transacciones iniciales
function generateInitialTransactionData() {
    state.products.forEach(product => {
        // Seleccionar aleatoriamente entre 3 y 8 clientes para cada producto
        const numClients = Math.floor(Math.random() * 6) + 3;
        const shuffledClients = [...state.clients].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numClients; i++) {
            const client = shuffledClients[i];
            
            // Generar datos aleatorios
            const transactions = Math.floor(Math.random() * 50000) + 10000;
            const unitValue = (Math.random() * 3) + 0.5;
            const revenue = transactions * unitValue;
            
            // Asignar producto al cliente
            client.products.push({
                id: product.id,
                name: product.name,
                transactions: transactions,
                unitValue: unitValue,
                revenue: revenue
            });
            
            // Actualizar totales del cliente
            client.transactions += transactions;
            client.revenue += revenue;
            
            // Actualizar producto
            product.clients.push({
                id: client.id,
                name: client.name,
                transactions: transactions,
                unitValue: unitValue,
                revenue: revenue
            });
            
            product.transactions += transactions;
            product.unitValue = ((product.unitValue * (product.clients.length - 1)) + unitValue / product.clients.length;
        }
        
        // Generar crecimiento y participación de mercado aleatorios
        product.growth = (Math.random() * 20) - 5; // Entre -5% y 15%
        product.marketShare = Math.random() * 30 + 5; // Entre 5% y 35%
        product.marketGrowth = Math.random() * 15 + 5; // Entre 5% y 20%
    });
    
    // Calcular datos financieros iniciales
    calculateFinancials();
}

// Generar datos de prueba si no se pueden cargar los archivos
function generateTestData() {
    // Implementación similar a generateInitialTransactionData()
    // pero con datos de prueba mínimos
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar datos iniciales
    await loadInitialData();

    // Cargar datos guardados si existen
    loadDataFromLocalStorage();

    // Completar select de productos para estrategias manuales
    populateStrategyProductOptions();
    
    // Configurar navegación
    setupNavigation();

    // Guardar estado actual del simulador en localStorage
    document.getElementById('save-state-btn')?.addEventListener('click', () => {
        try {
            localStorage.setItem('newpay-strategic-simulator', JSON.stringify(state));
            alert('✅ Estado guardado correctamente.');
        } catch (e) {
            console.error('Error al guardar el estado:', e);
            alert('❌ Error al guardar el estado. Ver consola.');
        }
    });

    // Cargar estado previamente guardado desde localStorage
    document.getElementById('load-state-btn')?.addEventListener('click', () => {
        try {
            const saved = localStorage.getItem('newpay-strategic-simulator');
            if (!saved) {
                alert('⚠️ No hay estado guardado previamente.');
                return;
            }

            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);

            updateProductsSection();
            updateClientsSection();
            updateBCGMatrix();
            renderPestelRadar(getCategoryAverages(state.selectedPestelVariables));
            renderPorterRadar(getForceAverages(state.selectedPorterVariables));
            renderAvailableStrategies();
            renderActiveStrategies();
            renderMonthlyPL();

            alert('📂 Estado cargado correctamente.');
        } catch (e) {
            console.error('Error al cargar el estado:', e);
            alert('❌ Error al cargar el estado. Ver consola.');
        }
    });

    // Cargar sección inicial
    loadSection(state.currentSection);
    
    // Configurar eventos
    setupEventListeners();
    
    // Actualizar UI
    updateUI();

    // Mostrar el estado inicial del P&L
    renderPL();

    // Escuchar el cambio en el selector de comparativas
    document.getElementById('comparison-type').addEventListener('change', function () {
        const type = this.value;

        if (type === 'month') {
            renderPL();
        } else if (type === 'year') {
            renderAnnualPL();
        } else if (type === 'budget') {
            renderBudgetComparison();
        } else if (type === 'quarter') {
            renderQuarterlyPL();
        }
    });
});

    // Configurar envío del formulario PESTEL
    document.getElementById('pestel-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const categories = ['political', 'economic', 'social', 'technological', 'ecological', 'legal'];
        const categoryAverages = {};

        state.selectedPestelVariables = [];

        categories.forEach(cat => {
            const inputs = document.querySelectorAll(`#${cat}-vars input[type="number"]`);
            const values = [];

            inputs.forEach(input => {
                const value = parseInt(input.value) || 0;
                values.push(value);
            });

            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            categoryAverages[cat] = avg;

            state.selectedPestelVariables.push({
                categoria: cat,
                promedio: avg
            });
        });

        renderPestelRadar(categoryAverages);
        generatePestelStrategies(categoryAverages);
        saveDataToLocalStorage();
    });

    // Configurar envío del formulario PORTER
    document.getElementById('porter-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const forces = ['new-entrants', 'buyers', 'substitutes', 'competition', 'suppliers'];
        const forceAverages = {};

        state.selectedPorterVariables = [];

        forces.forEach(force => {
            const inputs = document.querySelectorAll(`#${force}-vars input[type="number"]`);
            const values = [];

            inputs.forEach(input => {
                const value = parseInt(input.value) || 0;
                values.push(value);
            });

            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            forceAverages[force] = avg;

            state.selectedPorterVariables.push({
                fuerza: force,
                promedio: avg
            });
        });

        renderPorterRadar(forceAverages);
        generatePorterStrategies(forceAverages);
        saveDataToLocalStorage();
    });

    // Configurar envío del formulario BCG
    document.getElementById('bcg-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const productId = parseInt(document.getElementById('bcg-product').value);
        const product = state.products.find(p => p.id === productId);
        const growth = parseFloat(document.getElementById('market-growth').value);
        const share = parseFloat(document.getElementById('market-share').value);
        const strategy = document.getElementById('growth-strategy').value;

        if (!product) return;

        product.marketGrowth = growth;
        product.marketShare = share;
        product.growthStrategy = strategy;

        generateGrowthStrategy(product);
        updateBCGMatrix();
        saveDataToLocalStorage();
    });

    // Configurar envío del formulario NUEVA ESTRATEGIA
    document.getElementById('new-strategy-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const nombre = document.getElementById('strategy-name').value;
        const tipo = document.getElementById('strategy-type').value;
        const productoId = document.getElementById('strategy-product').value || null;
        const inversion = parseInt(document.getElementById('strategy-investment').value) || 0;
        const duracion = parseInt(document.getElementById('strategy-duration').value) || 0;
        const impactoIngresos = parseFloat(document.getElementById('strategy-growth').value) || 0;
        const impactoCostos = Math.round(impactoIngresos / 2);

        state.strategies.push({
            nombre,
            tipo,
            productoId: productoId !== '' ? productoId : null,
            inversion,
            duracion,
            impactoIngresos,
            impactoCostos,
            activa: false
        });

        saveDataToLocalStorage();
        renderAvailableStrategies();
        this.reset();
        alert('¡Estrategia creada con éxito!');
    });
});


function renderBudgetComparison() {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    if (!ctx) return;

    const actual = [
        state.financialData.revenue,
        state.financialData.opCosts,
        state.financialData.genExpenses,
        state.financialData.ebitda
    ];

    const budget = [
        state.budget.revenue,
        state.budget.opCosts,
        state.budget.genExpenses,
        state.budget.ebitda
    ];

    const labels = ['Ingresos', 'Costos Operativos', 'Gastos Generales', 'EBITDA'];

    if (window.comparisonChart) window.comparisonChart.destroy();

    window.comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Real',
                    data: actual,
                    backgroundColor: 'rgba(40, 167, 69, 0.6)' // Verde
                },
                {
                    label: 'Presupuesto',
                    data: budget,
                    backgroundColor: 'rgba(255, 193, 7, 0.6)' // Amarillo
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparativa vs. Presupuesto'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Configurar navegación
function setupNavigation() {
    const navLinks = document.querySelectorAll('#main-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Actualizar estado
            state.currentSection = this.getAttribute('href').substring(1);
            
            // Actualizar navegación
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            
            // Cargar sección
            loadSection(state.currentSection);
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón para abrir el modal de agregar cliente
    document.getElementById('add-client-btn').addEventListener('click', showAddClientModal);

    // Event listener para el formulario dentro del modal de cliente (si existe dinámicamente)
    document.addEventListener('submit', function (e) {
        if (e.target && e.target.id === 'add-client-form') {
            e.preventDefault();

            const name = document.getElementById('client-name')?.value;
            const type = document.getElementById('client-type')?.value;

            if (!name || !type) return;

            const newClient = {
                id: state.clients.length + 1,
                name,
                type,
                products: [],
                transactions: 0,
                revenue: 0
            };

            state.clients.push(newClient);

            updateClientsSection();
            saveDataToLocalStorage();
            e.target.reset();
        }
    });

    // Formulario para agregar producto
    document.getElementById('add-product-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const newProductName = document.getElementById('new-product').value;
        const productUnit = document.getElementById('product-unit').value;
        const transactions = parseInt(document.getElementById('product-transactions').value);
        const unitValue = parseFloat(document.getElementById('product-unit-value').value);

        if (!newProductName) return;

        // Crear nuevo producto
        const newProduct = {
            id: state.products.length + 1,
            name: newProductName,
            unit: productUnit,
            clients: [],
            transactions: transactions,
            unitValue: unitValue,
            growth: 0,
            marketShare: 0,
            marketGrowth: 0,
            strategy: ""
        };

        state.products.push(newProduct);

        // Actualizar UI
        updateProductsSection();
        updateBCGSection();

        // Guardar estado actualizado
        saveDataToLocalStorage();

        // Resetear formulario
        this.reset();
    });

    // Comparativa P&L: cambio de tipo (Mes, Año, Budget)
    const comparisonTypeSelect = document.getElementById('comparison-type');
    if (comparisonTypeSelect) {
        comparisonTypeSelect.addEventListener('change', function () {
            const type = this.value;

            if (type === 'month') {
                renderMonthlyPL();
            } else if (type === 'year') {
                renderQuarterlyPL();
            } else if (type === 'budget') {
                renderBudgetComparison();
            }
        });
    }

    // Resto de event listeners...
}

// Mostrar modal para agregar cliente
function showAddClientModal() {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h3>Agregar Nuevo Cliente</h3>
        <form id='add-client-form'>
            <div class='form-group'>
                <label for='client-name'>Nombre:</label>
                <input type='text' id='client-name' required>
            </div>
            <div class='form-group'>
                <label for='client-type'>Tipo:</label>
                <select id='client-type' required>
                    <option value='Banco'>Banco</option>
                    <option value='Fintech'>Fintech</option>
                </select>
            </div>
            <div class='form-group'>
                <label>Productos:</label>
                <div id='client-products-list'>
                    ${state.products.map(product => `
                        <div class='client-product-item'>
                            <label>
                                <input type='checkbox' name='client-products' value='${product.id}'>
                                ${product.name}
                            </label>
                            <input type='number' class='product-transactions' placeholder='Transacciones' min='0' value='0'>
                            <input type='number' class='product-unit-value' placeholder='Valor unitario' min='0' step='0.01' value='0'>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class='action-buttons'>
                <button type='submit' class='btn'>Guardar</button>
                <button type='button' class='btn btn-cancel' id='cancel-add-client'>Cancelar</button>
            </div>
        </form>
    `;
    
    // Configurar formulario
    document.getElementById('add-client-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('client-name').value;
        const type = document.getElementById('client-type').value;
        
        // Crear nuevo cliente
        const newClient = {
            id: state.clients.length + 1,
            name: name,
            type: type,
            products: [],
            transactions: 0,
            revenue: 0
        };
        
        // Procesar productos seleccionados
        const productCheckboxes = document.querySelectorAll('input[name="client-products"]:checked');
        productCheckboxes.forEach(checkbox => {
            const productId = parseInt(checkbox.value);
            const product = state.products.find(p => p.id === productId);
            const productItem = checkbox.closest('.client-product-item');
            const transactions = parseInt(productItem.querySelector('.product-transactions').value) || 0;
            const unitValue = parseFloat(productItem.querySelector('.product-unit-value').value) || 0;
            const revenue = transactions * unitValue;
            
            if (product && transactions > 0 && unitValue > 0) {
                // Agregar producto al cliente
                newClient.products.push({
                    id: product.id,
                    name: product.name,
                    transactions: transactions,
                    unitValue: unitValue,
                    revenue: revenue
                });
                
                // Actualizar totales del cliente
                newClient.transactions += transactions;
                newClient.revenue += revenue;
                
                // Actualizar producto
                product.clients.push({
                    id: newClient.id,
                    name: newClient.name,
                    transactions: transactions,
                    unitValue: unitValue,
                    revenue: revenue
                });
                
                product.transactions += transactions;
                product.unitValue = ((product.unitValue * (product.clients.length - 1)) + unitValue) / product.clients.length;
            }
        });
        
        state.clients.push(newClient);
        
        // Recalcular datos financieros
        calculateFinancials();
        
        // Actualizar UI
        updateClientsSection();
        updateProductsSection();
        updateUI();

        // Guardar estado actualizado
        saveDataToLocalStorage();
        
        // Cerrar modal
        modal.style.display = 'none';
    });
    
    // Configurar botón cancelar
    document.getElementById('cancel-add-client').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Mostrar modal
    modal.style.display = 'block';
}

// Función para renderizar el P&L Trimestral
function renderQuarterlyPL() {
    const container = document.getElementById('pl-container');
    if (!container) return;

    const trimestres = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4'];
    const trimestreData = [0, 0, 0, 0];

    state.strategies.forEach(strat => {
        if (strat.activa) {
            for (let mes = 1; mes <= strat.duracion; mes++) {
                const trimestre = Math.floor((mes - 1) / 3);
                trimestreData[trimestre] += (strat.impactoIngresos || 0) - (strat.impactoCostos || 0);
            }
        }
    });

    const ctx = document.getElementById('comparison-chart').getContext('2d');
    if (window.comparisonChart) {
        window.comparisonChart.destroy();
    }

    window.comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trimestres,
            datasets: [{
                label: 'Resultado Trimestral',
                data: trimestreData,
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateGrowthStrategy(product) {
    let nombre = '';
    let impacto = 10;

    switch (product.strategy) {
        case 'penetration':
            nombre = `Profundizar en el mercado de ${product.name}`;
            impacto = 8;
            break;
        case 'development':
            nombre = `Desarrollar nuevas funciones para ${product.name}`;
            impacto = 12;
            break;
        case 'expansion':
            nombre = `Expandir ${product.name} a nuevos segmentos`;
            impacto = 15;
            break;
        case 'diversification':
            nombre = `Diversificar producto: caso ${product.name}`;
            impacto = 18;
            break;
        default:
            nombre = `Estrategia de crecimiento para ${product.name}`;
            impacto = 10;
    }

    state.strategies.push({
        nombre: nombre,
        tipo: 'Ansoff',
        productoId: product.id,
        inversion: 70000,
        duracion: 6,
        impactoIngresos: impacto,
        impactoCostos: Math.round(impacto / 2),
        activa: false
    });
}

// Funciones para actualizar las secciones de la UI
function updateClientsSection() {
    const table = document.getElementById('clients-table');
    table.innerHTML = '';
    
    state.clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.id}</td>
            <td>${client.name}</td>
            <td>${client.type}</td>
            <td>${client.products.length}</td>
            <td>${client.transactions.toLocaleString()}</td>
            <td>$${client.revenue.toLocaleString()}</td>
            <td>
                <button class='btn small' data-action='view' data-id='${client.id}'>Ver</button>
                <button class='btn small' data-action='edit-client' data-id='${client.id}'>Editar</button>
            </td>
        `;
        table.appendChild(row);
    });
    
    // Configurar eventos de botones
    setupClientActionButtons();
}
function renderPL() {
    const container = document.getElementById('pl-container');
    if (!container) return;

    let totalIngresos = 0;
    let totalCostos = 0;
    let resultado = 0;

    const plHTML = ['<table class="pl-table"><thead><tr><th>Mes</th><th>Ingresos</th><th>Costos</th><th>Resultado</th></tr></thead><tbody>'];

    for (let mes = 1; mes <= 12; mes++) {
        let ingresosMes = 0;
        let costosMes = 0;

        state.strategies.forEach(strat => {
            if (strat.activa && strat.duracion >= mes) {
                ingresosMes += strat.impactoIngresos;
                costosMes += strat.impactoCostos;
            }
        });

        const resultadoMes = ingresosMes - costosMes;
        totalIngresos += ingresosMes;
        totalCostos += costosMes;
        resultado += resultadoMes;

        let claseFila = '';
        if (resultadoMes < 0) {
            claseFila = 'pl-rojo';
        } else if (resultadoMes < 10000) {
            claseFila = 'pl-amarillo';
        } else {
            claseFila = 'pl-verde';
        }

        plHTML.push(`<tr class="${claseFila}">
            <td>Mes ${mes}</td>
            <td>$${ingresosMes.toFixed(2)}</td>
            <td>$${costosMes.toFixed(2)}</td>
            <td>$${resultadoMes.toFixed(2)}</td>
        </tr>`);
    }

    plHTML.push(`</tbody><tfoot>
        <tr><th>Total</th><th>$${totalIngresos.toFixed(2)}</th><th>$${totalCostos.toFixed(2)}</th><th>$${resultado.toFixed(2)}</th></tr>
    </tfoot></table>`);

    container.innerHTML = plHTML.join('');
}
// Guardar estado completo en localStorage
function saveDataToLocalStorage() {
    localStorage.setItem('simData', JSON.stringify(state));
}

// Cargar estado desde localStorage si existe
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('simData');
    if (savedData) {
        const parsed = JSON.parse(savedData);

        // Reemplazar estado actual
        Object.assign(state, parsed);

        // Asegurar consistencia visual en todas las secciones
        updateProductsSection();
        updateClientsSection();
        updateBCGMatrix();
        renderPestelRadar(getCategoryAverages(parsed.selectedPestelVariables));
        renderPorterRadar(getForceAverages(parsed.selectedPorterVariables));
        renderAvailableStrategies();
        renderActiveStrategies();
        renderMonthlyPL();

        // Restaurar sección visible si estaba guardada
        if (state.currentSection) {
            loadSection(state.currentSection);
        }
    }
}

// Utilidades para reconstruir radar charts
function getCategoryAverages(arr) {
    const result = {};
    arr.forEach(obj => result[obj.categoria] = obj.promedio);
    return result;
}

function getForceAverages(arr) {
    const result = {};
    arr.forEach(obj => result[obj.fuerza] = obj.promedio);
    return result;
}

function generatePestelStrategies(averages) {
    const threshold = 3.5;
    const labels = {
        political: 'Político',
        economic: 'Económico',
        social: 'Social',
        technological: 'Tecnológico',
        ecological: 'Ecológico',
        legal: 'Legal'
    };

    for (const cat in averages) {
        if (averages[cat] >= threshold) {
            state.strategies.push({
                nombre: `Adaptarse al cambio ${labels[cat]}`,
                tipo: 'PESTEL',
                productoId: null,
                inversion: 50000,
                duracion: 6,
                impactoIngresos: Math.round(averages[cat] * 5),
                impactoCostos: Math.round(averages[cat] * 2),
                activa: false
            });
        }
    }
}

// Configurar botones de acción para clientes
function setupClientActionButtons() {
    // Botón ver
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = parseInt(this.getAttribute('data-id'));
            const client = state.clients.find(c => c.id === clientId);
            
            if (client) {
                showClientDetailsModal(client);
            }
        });
    });
    
    // Botón editar
    document.querySelectorAll('[data-action="edit-client"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = parseInt(this.getAttribute('data-id'));
            const client = state.clients.find(c => c.id === clientId);
            
            if (client) {
                showEditClientModal(client);
            }
        });
    });
}
function renderPestelRadar(data) {
    const ctx = document.getElementById('pestel-radar').getContext('2d');

    if (window.pestelRadarChart) {
        window.pestelRadarChart.destroy();
    }

    window.pestelRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Político', 'Económico', 'Social', 'Tecnológico', 'Ecológico', 'Legal'],
            datasets: [{
                label: 'Impacto PESTEL (1 a 5)',
                data: [
                    data.political,
                    data.economic,
                    data.social,
                    data.technological,
                    data.ecological,
                    data.legal
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: false }
            },
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: { stepSize: 1 },
                    pointLabels: { font: { size: 14 } }
                }
            }
        }
    });
}
// Mostrar modal de edición de cliente
function showEditClientModal(client) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h3>Editar Cliente: ${client.name}</h3>
        <form id='edit-client-form'>
            <div class='client-detail-form'>
                <div class='form-group'>
                    <label for='edit-client-name'>Nombre:</label>
                    <input type='text' id='edit-client-name' value='${client.name}' required>
                </div>
                <div class='form-group'>
                    <label for='edit-client-type'>Tipo:</label>
                    <select id='edit-client-type' required>
                        <option value='Banco' ${client.type === 'Banco' ? 'selected' : ''}>Banco</option>
                        <option value='Fintech' ${client.type === 'Fintech' ? 'selected' : ''}>Fintech</option>
                    </select>
                </div>
            </div>
            
            <h4>Productos</h4>
            <div id='edit-client-products'>
                ${state.products.map(product => {
                    const clientProduct = client.products.find(p => p.id === product.id);
                    const hasProduct = !!clientProduct;
                    
                    return `
                        <div class='client-product-item'>
                            <label>
                                <input type='checkbox' name='edit-client-products' value='${product.id}' ${hasProduct ? 'checked' : ''}>
                                ${product.name}
                            </label>
                            <input type='number' class='product-transactions' placeholder='Transacciones' min='0' 
                                   value='${hasProduct ? clientProduct.transactions : 0}'>
                            <input type='number' class='product-unit-value' placeholder='Valor unitario' min='0' step='0.01' 
                                   value='${hasProduct ? clientProduct.unitValue.toFixed(2) : '0'}'>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class='action-buttons'>
                <button type='submit' class='btn'>Guardar Cambios</button>
                <button type='button' class='btn btn-cancel' id='cancel-edit-client'>Cancelar</button>
            </div>
        </form>
    `;
    
    // Configurar formulario
    document.getElementById('edit-client-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Actualizar datos básicos del cliente
        client.name = document.getElementById('edit-client-name').value;
        client.type = document.getElementById('edit-client-type').value;
        
        // Procesar productos
        const productCheckboxes = document.querySelectorAll('input[name="edit-client-products"]:checked');
        const newProducts = [];
        let totalTransactions = 0;
        let totalRevenue = 0;
        
        productCheckboxes.forEach(checkbox => {
            const productId = parseInt(checkbox.value);
            const product = state.products.find(p => p.id === productId);
            const productItem = checkbox.closest('.client-product-item');
            const transactions = parseInt(productItem.querySelector('.product-transactions').value) || 0;
            const unitValue = parseFloat(productItem.querySelector('.product-unit-value').value) || 0;
            const revenue = transactions * unitValue;
            
            if (product && transactions > 0 && unitValue > 0) {
                newProducts.push({
                    id: product.id,
                    name: product.name,
                    transactions: transactions,
                    unitValue: unitValue,
                    revenue: revenue
                });
                
                totalTransactions += transactions;
                totalRevenue += revenue;
            }
        });
        
        // Actualizar productos del cliente
        client.products = newProducts;
        client.transactions = totalTransactions;
        client.revenue = totalRevenue;
        
        // Actualizar referencias en productos
        updateProductClientReferences(client);
        
        // Recalcular datos financieros
        calculateFinancials();
        
        // Actualizar UI
        updateClientsSection();
        updateProductsSection();
        updateUI();

        // Guardar cambios en localStorage
        saveDataToLocalStorage();
        
        // Cerrar modal
        modal.style.display = 'none';
    });
    
    // Configurar botón cancelar
    document.getElementById('cancel-edit-client').addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Mostrar modal
    modal.style.display = 'block';
}
function updateBCGMatrix() {
    const matrixContainer = document.getElementById('bcg-matrix');
    matrixContainer.innerHTML = ''; // Limpiar contenido anterior

    const quadrants = {
        estrella: [],
        incognita: [],
        vaca: [],
        perro: []
    };

    state.products.forEach(product => {
        if (
            typeof product.marketGrowth === 'number' &&
            typeof product.marketShare === 'number'
        ) {
            let cuadrante = '';

            if (product.marketGrowth >= 10 && product.marketShare >= 10) {
                cuadrante = 'estrella';
            } else if (product.marketGrowth >= 10 && product.marketShare < 10) {
                cuadrante = 'incognita';
            } else if (product.marketGrowth < 10 && product.marketShare >= 10) {
                cuadrante = 'vaca';
            } else {
                cuadrante = 'perro';
            }

            quadrants[cuadrante].push(product);
        }
    });

    for (const key in quadrants) {
        const div = document.createElement('div');
        div.className = `bcg-quadrant ${key}`;
        div.innerHTML = `<h4>${key.toUpperCase()}</h4>`;

        quadrants[key].forEach(prod => {
            const p = document.createElement('p');
            p.textContent = `${prod.name} (${prod.marketShare}%, ${prod.marketGrowth}%)`;
            div.appendChild(p);
        });

        matrixContainer.appendChild(div);
    }
}

// Actualizar referencias de cliente en productos
function updateProductClientReferences(client) {
    // Primero eliminar todas las referencias antiguas de este cliente
    state.products.forEach(product => {
        product.clients = product.clients.filter(c => c.id !== client.id);
    });
    
    // Luego agregar las nuevas referencias
    client.products.forEach(clientProduct => {
        const product = state.products.find(p => p.id === clientProduct.id);
        if (product) {
            product.clients.push({
                id: client.id,
                name: client.name,
                transactions: clientProduct.transactions,
                unitValue: clientProduct.unitValue,
                revenue: clientProduct.revenue
            });
            
            // Recalcular totales del producto
            product.transactions = product.clients.reduce((sum, c) => sum + c.transactions, 0);
            product.unitValue = product.clients.length > 0 
                ? product.clients.reduce((sum, c) => sum + c.unitValue, 0) / product.clients.length 
                : 0;
        }
    });
}

// Resto de funciones de la aplicación...
// (Mantener las funciones existentes para otras secciones)
function renderActiveStrategies() {
    const container = document.getElementById('active-strategies-container');
    container.innerHTML = '';

    const activeStrategies = state.strategies.filter(strat => strat.activa);

    if (activeStrategies.length === 0) {
        container.innerHTML = '<p>No hay estrategias activas.</p>';
        return;
    }

    activeStrategies.forEach(strat => {
        const div = document.createElement('div');
        div.className = 'strategy-card active';

        const nombre = document.createElement('h4');
        nombre.textContent = strat.nombre;

        const detalles = document.createElement('p');
        detalles.innerHTML = `
            Tipo: <strong>${strat.tipo}</strong><br>
            Inversión: $${strat.inversion.toLocaleString()}<br>
            Duración: ${strat.duracion} meses<br>
            Impacto en ingresos: +${strat.impactoIngresos}%<br>
            Impacto en costos: +${strat.impactoCostos}%
        `;

        const btn = document.createElement('button');
        btn.textContent = 'Desactivar';
        btn.className = 'btn btn-small btn-danger';
        btn.addEventListener('click', () => {
            strat.activa = false;
            renderAvailableStrategies();
            renderActiveStrategies();
            saveDataToLocalStorage();
        });

        div.appendChild(nombre);
        div.appendChild(detalles);
        div.appendChild(btn);

        container.appendChild(div);
    });
}
function renderAvailableStrategies() {
    const container = document.getElementById('available-strategies-container');
    container.innerHTML = '';

    if (state.strategies.length === 0) {
        container.innerHTML = '<p>No hay estrategias disponibles.</p>';
        return;
    }

    state.strategies.forEach((strat) => {
        if (strat.activa) return; // Mostrar solo las inactivas

        const div = document.createElement('div');
        div.className = 'strategy-card';

        // Nombre de la estrategia
        const nombre = document.createElement('h4');
        nombre.textContent = strat.nombre;

        // Detalles visibles
        const detalles = document.createElement('p');
        detalles.innerHTML = `
            Tipo: <strong>${strat.tipo}</strong><br>
            Inversión: $${strat.inversion.toLocaleString()}<br>
            Duración: ${strat.duracion} meses<br>
            Impacto en ingresos: +${strat.impactoIngresos}%<br>
            Impacto en costos: +${strat.impactoCostos}%
        `;

        // Botón de activación
        const btn = document.createElement('button');
        btn.textContent = 'Activar Estrategia';
        btn.className = 'btn btn-small';
        btn.addEventListener('click', () => {
            strat.activa = true;
            renderAvailableStrategies();
            renderActiveStrategies();
            saveDataToLocalStorage();
        });

        // Ensamblado final
        div.appendChild(nombre);
        div.appendChild(detalles);
        div.appendChild(btn);
        container.appendChild(div);
    });
}
// Calcular datos financieros
function calculateFinancials() {
    // Calcular ingresos totales
    state.financialData.revenue = state.products.reduce(
        (sum, p) => sum + (p.transactions * p.unitValue), 0
    );
    
    // Calcular costos operativos (30% de ingresos)
    state.financialData.opCosts = state.financialData.revenue * 0.3;
    
    // Calcular gastos generales (20% de ingresos)
    state.financialData.genExpenses = state.financialData.revenue * 0.2;
    
    // Calcular EBITDA
    state.financialData.ebitda = state.financialData.revenue - state.financialData.opCosts - state.financialData.genExpenses;
    
    // Calcular ROI (EBITDA / (Costos + Gastos))
    const totalInvestment = state.financialData.opCosts + state.financialData.genExpenses;
    state.financialData.roi = totalInvestment > 0 
        ? (state.financialData.ebitda / totalInvestment) * 100 
        : 0;
    
    // Ajustar NPS y Churn basado en estrategias activas
    let npsAdjustment = 0;
    let churnAdjustment = 0;
    
    state.strategies.filter(s => s.activa).forEach(strategy => {
        npsAdjustment += strategy.impactoIngresos / 10;
        churnAdjustment -= strategy.impactoIngresos / 20;
    });
    
    state.financialData.nps = Math.min(100, Math.max(0, 50 + npsAdjustment));
    state.financialData.churn = Math.max(0, 5 + churnAdjustment);
}

// Funciones para cargar y guardar datos en localStorage
function saveDataToLocalStorage() {
    const dataToSave = {
        products: state.products,
        clients: state.clients,
        strategies: state.strategies,
        selectedPestelVariables: state.selectedPestelVariables,
        selectedPorterVariables: state.selectedPorterVariables,
        activeStrategies: state.activeStrategies,
        financialData: state.financialData,
        currentSection: state.currentSection
    };
    
    localStorage.setItem('newpay-strategic-simulator', JSON.stringify(dataToSave));
}
