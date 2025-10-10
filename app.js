// Comprehensive Inventory and Margin Management System with Advanced Column Settings
class InventoryManagementSystem {
    constructor() {
        this.data = {
            products: [],
            sales: [],
            settings: {
                exchangeRates: {
                    cnyToUsd: 0.1393,
                    cnyToRub: 11.5581,
                    source: "ЦБ РФ",
                    lastUpdated: "07.10.2025"
                },
                lowStockThreshold: 10,
                autoSaveInterval: 30,
                currencyDecimals: 2
            },
            columnConfigs: {
                margin: [],
                inventory: [],
                sales: []
            }
        };
        this.activeTab = 'margin-calculator';
        this.activeSubTab = 'margin-columns';
        this.autoSaveTimer = null;
        this.editingColumnId = null;
        this.columnTemplates = [
            {name: "Цена", type: "currency", symbol: "¥", required: false, width: 120},
            {name: "Количество", type: "number", required: false, width: 100},
            {name: "Дата", type: "date", required: false, width: 150},
            {name: "Процент", type: "percentage", required: false, width: 100},
            {name: "Статус", type: "dropdown", options: ["Активен", "Неактивен", "Ожидание"], required: false, width: 120},
            {name: "Маржа", type: "formula", formula: "[цена] - [себестоимость]", required: false, width: 120},
            {name: "Примечания", type: "text", required: false, width: 200}
        ];
        this.init();
    }

    init() {
        this.loadDefaultColumnConfigs();
        this.loadInitialData();
        this.bindEvents();
        this.updateAllDisplays();
        this.startAutoSave();
        this.updateTimestamp();
    }

    loadDefaultColumnConfigs() {
        // Default margin calculator columns
        this.data.columnConfigs.margin = [
            {id: "name", name: "Название товара", type: "text", required: true, visible: true, width: 200},
            {id: "price_yuan", name: "Цена в юанях", type: "currency", required: true, visible: true, width: 150, symbol: "¥"},
            {id: "price_usd", name: "Цена в долларах", type: "formula", formula: "[price_yuan] * [exchange_rate_usd]", visible: true, width: 150, symbol: "$"},
            {id: "price_rub", name: "Цена в рублях", type: "formula", formula: "[price_yuan] * [exchange_rate_rub]", visible: true, width: 150, symbol: "₽"},
            {id: "purchase_price", name: "Цена закупки", type: "currency", visible: true, width: 150, symbol: "¥"},
            {id: "delivery_costs", name: "Расходы на доставку", type: "currency", visible: true, width: 180, symbol: "¥"},
            {id: "advertising_costs", name: "Расходы на рекламу", type: "currency", visible: true, width: 180, symbol: "¥"},
            {id: "margin_yuan", name: "Маржа в юанях", type: "formula", formula: "[price_yuan] - [purchase_price] - [delivery_costs] - [advertising_costs]", visible: true, width: 150},
            {id: "margin_percent", name: "Маржа %", type: "formula", formula: "([margin_yuan] / [price_yuan]) * 100", visible: true, width: 120, format: "percentage"},
            {id: "current_stock", name: "Текущие остатки", type: "formula", formula: "LOOKUP([name], inventory, current_stock)", visible: true, width: 150}
        ];

        // Default inventory columns
        this.data.columnConfigs.inventory = [
            {id: "name", name: "Название товара", type: "text", required: true, visible: true, width: 200},
            {id: "current_stock", name: "Текущие остатки", type: "formula", formula: "[initial_stock] - SUMIF(sales, [name], quantity)", visible: true, width: 150},
            {id: "initial_stock", name: "Начальные остатки", type: "number", required: true, visible: true, width: 150},
            {id: "total_sold", name: "Всего продано", type: "formula", formula: "SUMIF(sales, [name], quantity)", visible: true, width: 150},
            {id: "last_updated", name: "Последнее обновление", type: "date", visible: true, width: 180},
            {id: "min_stock", name: "Минимальный остаток", type: "number", visible: true, width: 150},
            {id: "status", name: "Статус", type: "formula", formula: "IF([current_stock] <= 0, 'Нет в наличии', IF([current_stock] <= [min_stock], 'Мало', 'В наличии'))", visible: true, width: 120},
            {id: "actions", name: "Действия", type: "actions", visible: true, width: 120}
        ];

        // Default sales columns
        this.data.columnConfigs.sales = [
            {id: "date", name: "Дата", type: "date", required: true, visible: true, width: 150},
            {id: "product_name", name: "Название товара", type: "dropdown", required: true, visible: true, width: 200, source: "products"},
            {id: "quantity", name: "Количество", type: "number", required: true, visible: true, width: 120},
            {id: "unit_price", name: "Цена за единицу", type: "currency", visible: true, width: 150, symbol: "¥"},
            {id: "total_amount", name: "Итого", type: "formula", formula: "[quantity] * [unit_price]", visible: true, width: 120},
            {id: "customer", name: "Клиент/Примечания", type: "text", visible: true, width: 200},
            {id: "actions", name: "Действия", type: "actions", visible: true, width: 120}
        ];
    }

    loadInitialData() {
        // Load sample data from provided JSON
        const sampleData = {
            "exchange_rates": {
                "CNY_to_USD": 0.1393,
                "CNY_to_RUB": 11.5581,
                "source": "ЦБ РФ",
                "last_updated": "07.10.2025"
            },
            "products": [
                {
                    "id": "prod1",
                    "name": "Товар А",
                    "price_yuan": 100,
                    "purchase_price": 70,
                    "delivery_costs": 10,
                    "advertising_costs": 5,
                    "initial_stock": 150,
                    "min_stock": 10
                },
                {
                    "id": "prod2", 
                    "name": "Товар Б",
                    "price_yuan": 250,
                    "purchase_price": 180,
                    "delivery_costs": 20,
                    "advertising_costs": 15,
                    "initial_stock": 75,
                    "min_stock": 5
                },
                {
                    "id": "prod3",
                    "name": "Товар В", 
                    "price_yuan": 80,
                    "purchase_price": 60,
                    "delivery_costs": 8,
                    "advertising_costs": 3,
                    "initial_stock": 200,
                    "min_stock": 20
                }
            ],
            "sales": [
                {
                    "id": "sale1",
                    "product_id": "prod1",
                    "product_name": "Товар А",
                    "date": "2025-10-01",
                    "quantity": 10,
                    "unit_price": 100,
                    "customer": "Клиент Иванов"
                },
                {
                    "id": "sale2",
                    "product_id": "prod2", 
                    "product_name": "Товар Б",
                    "date": "2025-10-02",
                    "quantity": 5,
                    "unit_price": 250,
                    "customer": "Интернет-заказ"
                },
                {
                    "id": "sale3",
                    "product_id": "prod1",
                    "product_name": "Товар А", 
                    "date": "2025-10-03",
                    "quantity": 15,
                    "unit_price": 100,
                    "customer": "Оптовый клиент"
                }
            ]
        };

        // Convert sample data to internal format
        this.data.products = sampleData.products.map(p => ({
            id: p.id,
            name: p.name,
            priceYuan: p.price_yuan,
            purchasePrice: p.purchase_price,
            deliveryCosts: p.delivery_costs,
            advertisingCosts: p.advertising_costs,
            initialStock: p.initial_stock,
            minStock: p.min_stock,
            currentStock: p.initial_stock
        }));

        this.data.sales = sampleData.sales.map(s => ({
            id: s.id,
            productId: s.product_id,
            productName: s.product_name,
            date: s.date,
            quantity: s.quantity,
            unitPrice: s.unit_price,
            total: s.quantity * s.unit_price,
            customer: s.customer
        }));

        this.data.settings.exchangeRates = {
            cnyToUsd: sampleData.exchange_rates.CNY_to_USD,
            cnyToRub: sampleData.exchange_rates.CNY_to_RUB,
            source: sampleData.exchange_rates.source,
            lastUpdated: sampleData.exchange_rates.last_updated
        };

        this.recalculateInventory();
    }

    recalculateInventory() {
        this.data.products.forEach(product => {
            const totalSold = this.data.sales
                .filter(sale => sale.productId === product.id)
                .reduce((sum, sale) => sum + sale.quantity, 0);
            product.currentStock = product.initialStock - totalSold;
        });
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Sub-tab navigation
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSubTab(e.target.dataset.subtab);
            });
        });

        // Column settings events
        this.bindColumnSettingsEvents();

        // Inventory management
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showAddProductForm();
            });
        }

        // Sales management
        const addSaleBtn = document.getElementById('add-sale-btn');
        if (addSaleBtn) {
            addSaleBtn.addEventListener('click', () => {
                this.showSalesForm();
            });
        }

        const cancelSaleBtn = document.getElementById('cancel-sale-btn');
        if (cancelSaleBtn) {
            cancelSaleBtn.addEventListener('click', () => {
                this.hideSalesForm();
            });
        }

        const salesForm = document.getElementById('sales-form');
        if (salesForm) {
            salesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processSale();
            });
        }

        // Sales form interactions
        const productSelect = document.getElementById('sale-product-select');
        if (productSelect) {
            productSelect.addEventListener('change', (e) => {
                this.updateSaleForm(e.target.value);
            });
        }

        const quantityInput = document.getElementById('sale-quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                this.updateSaleTotal();
            });
        }

        // Settings
        const updateRatesBtn = document.getElementById('update-rates-btn');
        if (updateRatesBtn) {
            updateRatesBtn.addEventListener('click', () => {
                this.updateExchangeRates();
            });
        }

        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Data management
        const exportAllBtn = document.getElementById('export-all-btn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }

        const exportInventoryBtn = document.getElementById('export-inventory-btn');
        if (exportInventoryBtn) {
            exportInventoryBtn.addEventListener('click', () => {
                this.exportInventoryData();
            });
        }

        const importDataBtn = document.getElementById('import-data-btn');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                document.getElementById('import-file-input').click();
            });
        }

        const importFileInput = document.getElementById('import-file-input');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                this.importData(e.target.files[0]);
            });
        }

        const resetDataBtn = document.getElementById('reset-data-btn');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                if (confirm('Сбросить все данные к примеру? Это действие необратимо.')) {
                    this.loadInitialData();
                    this.updateAllDisplays();
                }
            });
        }

        // Set today's date as default for sales
        const today = new Date().toISOString().split('T')[0];
        const saleDateInput = document.getElementById('sale-date');
        if (saleDateInput) {
            saleDateInput.value = today;
        }
    }

    bindColumnSettingsEvents() {
        // Column template events
        this.updateColumnTemplates();

        // Add column buttons
        ['margin', 'inventory', 'sales'].forEach(tableType => {
            const addBtn = document.getElementById(`add-${tableType}-column-btn`);
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    this.showColumnConfigModal(tableType);
                });
            }

            const resetBtn = document.getElementById(`reset-${tableType}-columns-btn`);
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    if (confirm('Сбросить колонки к настройкам по умолчанию?')) {
                        this.resetColumnsToDefault(tableType);
                    }
                });
            }
        });

        // Column config export/import
        const exportConfigBtn = document.getElementById('export-column-config-btn');
        if (exportConfigBtn) {
            exportConfigBtn.addEventListener('click', () => {
                this.exportColumnConfig();
            });
        }

        const importConfigBtn = document.getElementById('import-column-config-btn');
        if (importConfigBtn) {
            importConfigBtn.addEventListener('click', () => {
                document.getElementById('import-column-file').click();
            });
        }

        const importColumnFile = document.getElementById('import-column-file');
        if (importColumnFile) {
            importColumnFile.addEventListener('change', (e) => {
                this.importColumnConfig(e.target.files[0]);
            });
        }

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        const modal = document.getElementById('column-config-modal');
        const modalBackdrop = document.getElementById('modal-backdrop');
        const closeBtn = document.getElementById('modal-close-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const form = document.getElementById('column-config-form');
        const typeSelect = document.getElementById('column-type');

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => {
                this.hideColumnConfigModal();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideColumnConfigModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideColumnConfigModal();
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.updateColumnConfigForm(e.target.value);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveColumnConfig();
            });
        }
    }

    switchTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Hide all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        this.activeTab = tabId;
        this.updateCurrentTabDisplay();
    }

    switchSubTab(subTabId) {
        // Hide all sub-tabs
        document.querySelectorAll('.sub-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Hide all sub-tab buttons
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected sub-tab
        const selectedSubTab = document.getElementById(subTabId);
        if (selectedSubTab) {
            selectedSubTab.classList.add('active');
        }

        const selectedBtn = document.querySelector(`[data-subtab="${subTabId}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        this.activeSubTab = subTabId;
        this.updateColumnsList();
    }

    updateCurrentTabDisplay() {
        switch(this.activeTab) {
            case 'margin-calculator':
                this.updateMarginCalculator();
                break;
            case 'inventory-database':
                this.updateInventoryDatabase();
                break;
            case 'sales-log':
                this.updateSalesLog();
                break;
            case 'column-settings':
                this.updateColumnSettings();
                break;
            case 'settings':
                this.updateSettings();
                break;
        }
    }

    updateAllDisplays() {
        this.updateMarginCalculator();
        this.updateInventoryDatabase();
        this.updateSalesLog();
        this.updateColumnSettings();
        this.updateSettings();
        this.updateGlobalStats();
    }

    // Column Settings Methods
    updateColumnSettings() {
        this.updateColumnTemplates();
        this.updateColumnsList();
    }

    updateColumnTemplates() {
        const templatesGrid = document.getElementById('column-templates');
        if (!templatesGrid) return;

        templatesGrid.innerHTML = this.columnTemplates.map(template => `
            <div class="template-item" onclick="app.addColumnFromTemplate('${JSON.stringify(template).replace(/"/g, '&quot;')}')">
                <div class="template-name">${template.name}</div>
                <div class="template-type">${this.getColumnTypeLabel(template.type)}</div>
            </div>
        `).join('');
    }

    addColumnFromTemplate(templateJson) {
        try {
            const template = JSON.parse(templateJson.replace(/&quot;/g, '"'));
            const tableType = this.activeSubTab.replace('-columns', '');
            const newColumn = {
                id: this.generateColumnId(),
                ...template,
                visible: true
            };
            
            this.data.columnConfigs[tableType].push(newColumn);
            this.updateColumnsList();
            this.updateTablesBasedOnColumns();
            this.updateTimestamp();
        } catch (error) {
            console.error('Error adding column from template:', error);
        }
    }

    updateColumnsList() {
        const tableType = this.activeSubTab.replace('-columns', '');
        const listContainer = document.getElementById(`${tableType}-columns-list`);
        if (!listContainer) return;

        const columns = this.data.columnConfigs[tableType] || [];

        if (columns.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Нет колонок</h3>
                    <p>Добавьте первую колонку используя шаблоны или кнопку "Добавить колонку"</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = columns.map((column, index) => `
            <div class="column-item" draggable="true" data-column-id="${column.id}">
                <span class="column-drag-handle">⋮⋮</span>
                <div class="column-info">
                    <div class="column-name">${column.name}</div>
                    <div class="column-type-badge">${this.getColumnTypeLabel(column.type)}</div>
                    <div class="column-width">${column.width}px</div>
                    <div class="column-actions">
                        <input type="checkbox" class="column-visibility-toggle" ${column.visible ? 'checked' : ''} 
                               onchange="app.toggleColumnVisibility('${tableType}', '${column.id}', this.checked)">
                        <button class="column-action-btn" onclick="app.editColumn('${tableType}', '${column.id}')" title="Редактировать">✎</button>
                        <button class="column-action-btn" onclick="app.duplicateColumn('${tableType}', '${column.id}')" title="Дублировать">⧉</button>
                        <button class="column-action-btn delete" onclick="app.deleteColumn('${tableType}', '${column.id}')" title="Удалить">✖</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add drag and drop functionality
        this.initColumnDragAndDrop(listContainer);
    }

    initColumnDragAndDrop(container) {
        const items = container.querySelectorAll('.column-item');
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    const tableType = this.activeSubTab.replace('-columns', '');
                    const draggedId = draggedItem.dataset.columnId;
                    const targetId = item.dataset.columnId;
                    this.reorderColumns(tableType, draggedId, targetId);
                }
            });
        });
    }

    reorderColumns(tableType, draggedId, targetId) {
        const columns = this.data.columnConfigs[tableType];
        const draggedIndex = columns.findIndex(col => col.id === draggedId);
        const targetIndex = columns.findIndex(col => col.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const draggedColumn = columns.splice(draggedIndex, 1)[0];
            columns.splice(targetIndex, 0, draggedColumn);
            
            this.updateColumnsList();
            this.updateTablesBasedOnColumns();
            this.updateTimestamp();
        }
    }

    toggleColumnVisibility(tableType, columnId, visible) {
        const column = this.data.columnConfigs[tableType].find(col => col.id === columnId);
        if (column) {
            column.visible = visible;
            this.updateTablesBasedOnColumns();
            this.updateTimestamp();
        }
    }

    editColumn(tableType, columnId) {
        const column = this.data.columnConfigs[tableType].find(col => col.id === columnId);
        if (column) {
            this.editingColumnId = columnId;
            this.showColumnConfigModal(tableType, column);
        }
    }

    duplicateColumn(tableType, columnId) {
        const column = this.data.columnConfigs[tableType].find(col => col.id === columnId);
        if (column) {
            const duplicatedColumn = {
                ...column,
                id: this.generateColumnId(),
                name: column.name + ' (копия)'
            };
            
            this.data.columnConfigs[tableType].push(duplicatedColumn);
            this.updateColumnsList();
            this.updateTablesBasedOnColumns();
            this.updateTimestamp();
        }
    }

    deleteColumn(tableType, columnId) {
        if (!confirm('Удалить эту колонку? Данные в этой колонке будут потеряны.')) return;

        this.data.columnConfigs[tableType] = this.data.columnConfigs[tableType].filter(col => col.id !== columnId);
        this.updateColumnsList();
        this.updateTablesBasedOnColumns();
        this.updateTimestamp();
    }

    showColumnConfigModal(tableType, column = null) {
        const modal = document.getElementById('column-config-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('column-config-form');

        if (title) {
            title.textContent = column ? 'Редактирование колонки' : 'Новая колонка';
        }

        if (column) {
            this.populateColumnConfigForm(column);
            this.editingColumnId = column.id;
        } else {
            form.reset();
            this.editingColumnId = null;
            // Set default width
            const widthInput = document.getElementById('column-width');
            if (widthInput) widthInput.value = 150;
        }

        this.currentEditingTableType = tableType;
        this.updateColumnConfigForm(column ? column.type : 'text');

        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideColumnConfigModal() {
        const modal = document.getElementById('column-config-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingColumnId = null;
        this.currentEditingTableType = null;
    }

    populateColumnConfigForm(column) {
        const fields = [
            'column-name', 'column-type', 'column-width', 'column-symbol',
            'column-formula', 'column-options', 'column-default'
        ];

        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (!element) return;

            const fieldName = fieldId.replace('column-', '');
            let value = '';

            switch (fieldName) {
                case 'name':
                    value = column.name || '';
                    break;
                case 'type':
                    value = column.type || 'text';
                    break;
                case 'width':
                    value = column.width || 150;
                    break;
                case 'symbol':
                    value = column.symbol || '';
                    break;
                case 'formula':
                    value = column.formula || '';
                    break;
                case 'options':
                    value = Array.isArray(column.options) ? column.options.join('\n') : '';
                    break;
                case 'default':
                    value = column.defaultValue || '';
                    break;
            }

            element.value = value;
        });

        // Set checkboxes
        const requiredCheckbox = document.getElementById('column-required');
        if (requiredCheckbox) requiredCheckbox.checked = column.required || false;

        const visibleCheckbox = document.getElementById('column-visible');
        if (visibleCheckbox) visibleCheckbox.checked = column.visible !== false;
    }

    updateColumnConfigForm(type) {
        const formulaGroup = document.getElementById('formula-group');
        const dropdownGroup = document.getElementById('dropdown-group');

        // Hide all type-specific groups
        if (formulaGroup) formulaGroup.classList.remove('active');
        if (dropdownGroup) dropdownGroup.classList.remove('active');

        // Show relevant groups
        if (type === 'formula' && formulaGroup) {
            formulaGroup.classList.add('active');
        }
        if (type === 'dropdown' && dropdownGroup) {
            dropdownGroup.classList.add('active');
        }
    }

    saveColumnConfig() {
        const form = document.getElementById('column-config-form');
        const formData = new FormData(form);

        const columnData = {
            name: document.getElementById('column-name').value,
            type: document.getElementById('column-type').value,
            width: parseInt(document.getElementById('column-width').value) || 150,
            symbol: document.getElementById('column-symbol').value,
            required: document.getElementById('column-required').checked,
            visible: document.getElementById('column-visible').checked,
            formula: document.getElementById('column-formula').value,
            options: document.getElementById('column-options').value.split('\n').filter(opt => opt.trim()),
            defaultValue: document.getElementById('column-default').value
        };

        if (!columnData.name) {
            alert('Пожалуйста, укажите название колонки');
            return;
        }

        const tableType = this.currentEditingTableType;

        if (this.editingColumnId) {
            // Edit existing column
            const columnIndex = this.data.columnConfigs[tableType].findIndex(col => col.id === this.editingColumnId);
            if (columnIndex !== -1) {
                this.data.columnConfigs[tableType][columnIndex] = {
                    ...this.data.columnConfigs[tableType][columnIndex],
                    ...columnData
                };
            }
        } else {
            // Add new column
            const newColumn = {
                id: this.generateColumnId(),
                ...columnData
            };
            this.data.columnConfigs[tableType].push(newColumn);
        }

        this.updateColumnsList();
        this.updateTablesBasedOnColumns();
        this.hideColumnConfigModal();
        this.updateTimestamp();
    }

    resetColumnsToDefault(tableType) {
        this.loadDefaultColumnConfigs();
        this.updateColumnsList();
        this.updateTablesBasedOnColumns();
        this.updateTimestamp();
    }

    exportColumnConfig() {
        const configData = {
            columnConfigs: this.data.columnConfigs,
            exportDate: new Date().toISOString()
        };
        this.downloadJSON(configData, `column_config_${this.getDateString()}.json`);
    }

    importColumnConfig(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedConfig = JSON.parse(e.target.result);
                
                if (importedConfig.columnConfigs) {
                    this.data.columnConfigs = importedConfig.columnConfigs;
                    this.updateColumnsList();
                    this.updateTablesBasedOnColumns();
                    this.updateTimestamp();
                    alert('Конфигурация колонок успешно импортирована');
                } else {
                    alert('Неверный формат файла конфигурации');
                }
            } catch (error) {
                alert('Ошибка при импорте конфигурации: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    updateTablesBasedOnColumns() {
        // Update all tables when columns change
        this.updateMarginCalculator();
        this.updateInventoryDatabase();
        this.updateSalesLog();
    }

    generateColumnId() {
        return 'col_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getColumnTypeLabel(type) {
        const labels = {
            text: 'Текст',
            number: 'Число',
            currency: 'Валюта',
            percentage: 'Процент',
            date: 'Дата',
            formula: 'Формула',
            dropdown: 'Список',
            actions: 'Действия'
        };
        return labels[type] || type;
    }

    // Enhanced table rendering methods
    updateMarginCalculator() {
        this.renderDynamicTable('margin', 'margin-table-header', 'margin-table-body', this.data.products, (product) => {
            const calculations = this.calculateProductMargin(product);
            return {
                ...product,
                price_yuan: product.priceYuan,
                price_usd: calculations.priceUsd,
                price_rub: calculations.priceRub,
                purchase_price: product.purchasePrice,
                delivery_costs: product.deliveryCosts,
                advertising_costs: product.advertisingCosts,
                margin_yuan: calculations.marginYuan,
                margin_percent: calculations.marginPercent,
                current_stock: product.currentStock,
                exchange_rate_usd: this.data.settings.exchangeRates.cnyToUsd,
                exchange_rate_rub: this.data.settings.exchangeRates.cnyToRub
            };
        });
        
        this.updateMarginSummary();
    }

    updateInventoryDatabase() {
        this.renderDynamicTable('inventory', 'inventory-table-header', 'inventory-table-body', this.data.products, (product) => {
            const totalSold = this.data.sales
                .filter(sale => sale.productId === product.id)
                .reduce((sum, sale) => sum + sale.quantity, 0);
            
            return {
                ...product,
                current_stock: product.currentStock,
                initial_stock: product.initialStock,
                total_sold: totalSold,
                last_updated: new Date().toISOString().split('T')[0],
                min_stock: product.minStock,
                status: this.getStockStatusText(product)
            };
        });
    }

    updateSalesLog() {
        this.updateSalesStats();
        this.updateSalesFormProductSelect();
        
        // Sort sales by date (newest first)
        const sortedSales = [...this.data.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.renderDynamicTable('sales', 'sales-table-header', 'sales-table-body', sortedSales, (sale) => ({
            ...sale,
            date: sale.date,
            product_name: sale.productName,
            quantity: sale.quantity,
            unit_price: sale.unitPrice,
            total_amount: sale.total,
            customer: sale.customer || '—'
        }));
    }

    renderDynamicTable(tableType, headerElementId, bodyElementId, data, dataMapper) {
        const columns = this.data.columnConfigs[tableType] || [];
        const visibleColumns = columns.filter(col => col.visible !== false);
        
        const headerElement = document.getElementById(headerElementId);
        const bodyElement = document.getElementById(bodyElementId);
        
        if (!headerElement || !bodyElement) return;

        // Render header
        headerElement.innerHTML = `
            <tr>
                ${visibleColumns.map(column => `
                    <th style="width: ${column.width}px">${column.name}</th>
                `).join('')}
            </tr>
        `;

        // Render body
        if (data.length === 0) {
            bodyElement.innerHTML = `
                <tr>
                    <td colspan="${visibleColumns.length}" class="empty-state">
                        <h3>Нет данных</h3>
                        <p>Добавьте первую запись</p>
                    </td>
                </tr>
            `;
            return;
        }

        bodyElement.innerHTML = data.map((item, index) => {
            const mappedData = dataMapper ? dataMapper(item) : item;
            const rowClass = this.getRowClass(tableType, mappedData);
            
            return `
                <tr class="${rowClass}">
                    ${visibleColumns.map(column => {
                        const cellValue = this.getCellValue(column, mappedData, tableType, item);
                        const cellClass = this.getCellClass(column, cellValue, mappedData);
                        return `<td class="${cellClass}">${cellValue}</td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');
    }

    getCellValue(column, data, tableType, originalItem) {
        const rawValue = this.calculateColumnValue(column, data, tableType);
        
        switch (column.type) {
            case 'currency':
                const symbol = column.symbol || '';
                return `${symbol}${typeof rawValue === 'number' ? rawValue.toFixed(2) : rawValue}`;
            
            case 'percentage':
                return `${typeof rawValue === 'number' ? rawValue.toFixed(1) : rawValue}%`;
            
            case 'date':
                if (rawValue && rawValue !== '—') {
                    try {
                        return new Date(rawValue).toLocaleDateString('ru-RU');
                    } catch {
                        return rawValue;
                    }
                }
                return rawValue;
            
            case 'actions':
                return this.generateActionButtons(tableType, originalItem);
            
            default:
                return rawValue;
        }
    }

    calculateColumnValue(column, data, tableType) {
        if (column.type === 'formula' && column.formula) {
            return this.evaluateFormula(column.formula, data, tableType);
        }
        
        return data[column.id] !== undefined ? data[column.id] : '—';
    }

    evaluateFormula(formula, data, tableType) {
        try {
            // Simple formula evaluation - replace column references with values
            let expression = formula;
            
            // Handle special functions
            if (expression.includes('SUMIF')) {
                // Example: SUMIF(sales, [name], quantity)
                return this.handleSumIfFormula(expression, data);
            }
            
            if (expression.includes('LOOKUP')) {
                // Example: LOOKUP([name], inventory, current_stock)
                return this.handleLookupFormula(expression, data);
            }
            
            // Replace column references [column_name] with actual values
            const columnRefRegex = /\[([^\]]+)\]/g;
            expression = expression.replace(columnRefRegex, (match, columnName) => {
                const value = data[columnName] || 0;
                return typeof value === 'number' ? value : 0;
            });
            
            // Evaluate mathematical expressions
            return this.safeEval(expression);
        } catch (error) {
            console.error('Formula evaluation error:', error);
            return 0;
        }
    }

    handleSumIfFormula(expression, data) {
        // Simple SUMIF implementation
        const match = expression.match(/SUMIF\(([^,]+),\s*\[([^\]]+)\],\s*([^)]+)\)/);
        if (match) {
            const [, tableName, keyColumn, sumColumn] = match;
            const keyValue = data[keyColumn];
            
            if (tableName.includes('sales')) {
                return this.data.sales
                    .filter(sale => sale.productName === keyValue)
                    .reduce((sum, sale) => sum + (sale[sumColumn] || 0), 0);
            }
        }
        return 0;
    }

    handleLookupFormula(expression, data) {
        // Simple LOOKUP implementation
        const match = expression.match(/LOOKUP\(\[([^\]]+)\],\s*([^,]+),\s*([^)]+)\)/);
        if (match) {
            const [, keyColumn, tableName, returnColumn] = match;
            const keyValue = data[keyColumn];
            
            if (tableName.includes('inventory')) {
                const item = this.data.products.find(p => p.name === keyValue);
                return item ? (item[returnColumn] || 0) : 0;
            }
        }
        return 0;
    }

    safeEval(expression) {
        // Basic math evaluation - only allow numbers and basic operators
        const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
        if (sanitized !== expression) {
            throw new Error('Invalid characters in formula');
        }
        
        try {
            return Function('"use strict"; return (' + sanitized + ')')();
        } catch {
            return 0;
        }
    }

    getCellClass(column, value, data) {
        let classes = [];
        
        if (column.type === 'formula') {
            classes.push('calculated-field');
        }
        
        if (column.type === 'currency' || column.type === 'number') {
            classes.push('text-right', 'font-mono');
        }
        
        if (column.type === 'date') {
            classes.push('text-center');
        }
        
        // Add status-specific classes
        if (column.id === 'margin_yuan' || column.id === 'margin_percent') {
            const numValue = parseFloat(value);
            if (numValue >= 0) classes.push('positive-margin');
            else classes.push('negative-margin');
        }
        
        if (column.id === 'current_stock' || column.id === 'status') {
            const stockValue = data.current_stock || data.currentStock || 0;
            const minStock = data.min_stock || data.minStock || 0;
            
            if (stockValue <= 0) classes.push('status-critical');
            else if (stockValue <= minStock) classes.push('status-warning');
            else if (column.id === 'current_stock') classes.push('status-ok');
        }
        
        return classes.join(' ');
    }

    getRowClass(tableType, data) {
        let classes = [];
        
        if (tableType === 'margin') {
            const marginValue = parseFloat(data.margin_yuan) || 0;
            if (marginValue >= 0) classes.push('margin-row-positive');
            else classes.push('margin-row-negative');
        }
        
        if (tableType === 'inventory') {
            const stockValue = data.current_stock || 0;
            const minStock = data.min_stock || 0;
            
            if (stockValue <= 0) classes.push('critical-stock-row');
            else if (stockValue <= minStock) classes.push('low-stock-row');
        }
        
        return classes.join(' ');
    }

    generateActionButtons(tableType, item) {
        if (tableType === 'inventory') {
            return `
                <button class="action-btn edit" onclick="app.editProduct('${item.id}')" title="Редактировать">✎</button>
                <button class="action-btn" onclick="app.deleteProduct('${item.id}')" title="Удалить">✖</button>
            `;
        }
        
        if (tableType === 'sales') {
            return `
                <button class="action-btn" onclick="app.deleteSale('${item.id}')" title="Удалить">✖</button>
            `;
        }
        
        return '—';
    }

    // Keep all existing methods for backward compatibility
    updateMarginSummary() {
        let totalMarginCny = 0;
        let totalMarginUsd = 0;
        let totalMarginRub = 0;

        this.data.products.forEach(product => {
            const calculations = this.calculateProductMargin(product);
            totalMarginCny += parseFloat(calculations.marginYuan);
            totalMarginUsd += parseFloat(calculations.marginUsd);
            totalMarginRub += parseFloat(calculations.marginRub);
        });

        const totalMarginCnyEl = document.getElementById('total-margin-cny');
        if (totalMarginCnyEl) totalMarginCnyEl.textContent = totalMarginCny.toFixed(2);

        const totalMarginUsdEl = document.getElementById('total-margin-usd');
        if (totalMarginUsdEl) totalMarginUsdEl.textContent = totalMarginUsd.toFixed(2);

        const totalMarginRubEl = document.getElementById('total-margin-rub');
        if (totalMarginRubEl) totalMarginRubEl.textContent = totalMarginRub.toFixed(2);

        // Update exchange rate displays
        const cnyUsdDisplay = document.getElementById('cny-usd-display');
        if (cnyUsdDisplay) cnyUsdDisplay.textContent = this.data.settings.exchangeRates.cnyToUsd.toFixed(4);

        const cnyRubDisplay = document.getElementById('cny-rub-display');
        if (cnyRubDisplay) cnyRubDisplay.textContent = this.data.settings.exchangeRates.cnyToRub.toFixed(4);

        const ratesSourceDisplay = document.getElementById('rates-source-display');
        if (ratesSourceDisplay) {
            ratesSourceDisplay.textContent = `Источник: ${this.data.settings.exchangeRates.source} на ${this.data.settings.exchangeRates.lastUpdated}`;
        }
    }

    updateSalesStats() {
        const totalSales = this.data.sales.length;
        const totalAmount = this.data.sales.reduce((sum, sale) => sum + sale.total, 0);
        
        const today = new Date().toISOString().split('T')[0];
        const todaySales = this.data.sales.filter(sale => sale.date === today);
        const todayCount = todaySales.length;
        const todayAmount = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        const totalSalesCountEl = document.getElementById('total-sales-count');
        if (totalSalesCountEl) totalSalesCountEl.textContent = totalSales;

        const totalSalesAmountEl = document.getElementById('total-sales-amount');
        if (totalSalesAmountEl) totalSalesAmountEl.textContent = totalAmount.toFixed(2);

        const todaySalesCountEl = document.getElementById('today-sales-count');
        if (todaySalesCountEl) todaySalesCountEl.textContent = todayCount;

        const todaySalesAmountEl = document.getElementById('today-sales-amount');
        if (todaySalesAmountEl) todaySalesAmountEl.textContent = todayAmount.toFixed(2);
    }

    updateSalesFormProductSelect() {
        const select = document.getElementById('sale-product-select');
        if (!select) return;

        select.innerHTML = '<option value="">Выберите товар</option>' +
            this.data.products.map(product => 
                `<option value="${product.id}" ${product.currentStock <= 0 ? 'disabled' : ''}>
                    ${product.name} (остаток: ${product.currentStock})
                </option>`
            ).join('');
    }

    updateSettings() {
        // Update exchange rate inputs
        const settingsCnyUsd = document.getElementById('settings-cny-usd');
        if (settingsCnyUsd) settingsCnyUsd.value = this.data.settings.exchangeRates.cnyToUsd;

        const settingsCnyRub = document.getElementById('settings-cny-rub');
        if (settingsCnyRub) settingsCnyRub.value = this.data.settings.exchangeRates.cnyToRub;

        const settingsRateSource = document.getElementById('settings-rate-source');
        if (settingsRateSource) settingsRateSource.value = this.data.settings.exchangeRates.source;

        const settingsRateDate = document.getElementById('settings-rate-date');
        if (settingsRateDate) settingsRateDate.value = this.data.settings.exchangeRates.lastUpdated;

        // Update system settings
        const settingsLowStockThreshold = document.getElementById('settings-low-stock-threshold');
        if (settingsLowStockThreshold) settingsLowStockThreshold.value = this.data.settings.lowStockThreshold;

        const settingsAutosaveInterval = document.getElementById('settings-autosave-interval');
        if (settingsAutosaveInterval) settingsAutosaveInterval.value = this.data.settings.autoSaveInterval;

        const settingsDecimals = document.getElementById('settings-decimals');
        if (settingsDecimals) settingsDecimals.value = this.data.settings.currencyDecimals;

        // Update data info
        const dataProductsCount = document.getElementById('data-products-count');
        if (dataProductsCount) dataProductsCount.textContent = this.data.products.length;

        const dataSalesCount = document.getElementById('data-sales-count');
        if (dataSalesCount) dataSalesCount.textContent = this.data.sales.length;
        
        const dataSize = new Blob([JSON.stringify(this.data)]).size / 1024;
        const dataSizeEl = document.getElementById('data-size');
        if (dataSizeEl) dataSizeEl.textContent = `${dataSize.toFixed(1)} KB`;
    }

    updateGlobalStats() {
        const totalProducts = this.data.products.length;
        const totalInventory = this.data.products.reduce((sum, p) => sum + p.currentStock, 0);
        const lowStockCount = this.data.products.filter(p => p.currentStock <= this.data.settings.lowStockThreshold).length;
        
        let averageMargin = 0;
        if (totalProducts > 0) {
            const margins = this.data.products.map(product => {
                const calculations = this.calculateProductMargin(product);
                return product.priceYuan > 0 ? parseFloat(calculations.marginPercent) : 0;
            });
            averageMargin = margins.reduce((sum, margin) => sum + margin, 0) / totalProducts;
        }

        const totalProductsStat = document.getElementById('total-products-stat');
        if (totalProductsStat) totalProductsStat.textContent = totalProducts;

        const averageMarginStat = document.getElementById('average-margin-stat');
        if (averageMarginStat) averageMarginStat.textContent = averageMargin.toFixed(1) + '%';

        const totalInventoryStat = document.getElementById('total-inventory-stat');
        if (totalInventoryStat) totalInventoryStat.textContent = totalInventory;

        const lowStockCountEl = document.getElementById('low-stock-count');
        if (lowStockCountEl) lowStockCountEl.textContent = lowStockCount;
    }

    calculateProductMargin(product) {
        const marginYuan = product.priceYuan - product.purchasePrice - product.deliveryCosts - product.advertisingCosts;
        const marginPercent = product.priceYuan > 0 ? (marginYuan / product.priceYuan) * 100 : 0;
        const priceUsd = product.priceYuan * this.data.settings.exchangeRates.cnyToUsd;
        const priceRub = product.priceYuan * this.data.settings.exchangeRates.cnyToRub;
        const marginUsd = marginYuan * this.data.settings.exchangeRates.cnyToUsd;
        const marginRub = marginYuan * this.data.settings.exchangeRates.cnyToRub;

        const decimals = this.data.settings.currencyDecimals;

        return {
            marginYuan: marginYuan.toFixed(decimals),
            marginPercent: marginPercent.toFixed(1),
            priceUsd: priceUsd.toFixed(decimals),
            priceRub: priceRub.toFixed(decimals),
            marginUsd: marginUsd.toFixed(decimals),
            marginRub: marginRub.toFixed(decimals)
        };
    }

    getStockStatusClass(product) {
        if (product.currentStock <= 0) return 'status-critical';
        if (product.currentStock <= product.minStock) return 'status-warning';
        return 'status-ok';
    }

    getStockStatusText(product) {
        if (product.currentStock <= 0) return 'Нет в наличии';
        if (product.currentStock <= product.minStock) return 'Мало';
        return 'В наличии';
    }

    getStockRowClass(product) {
        if (product.currentStock <= 0) return 'critical-stock-row';
        if (product.currentStock <= product.minStock) return 'low-stock-row';
        return '';
    }

    showAddProductForm() {
        const name = prompt('Название товара:');
        if (!name) return;

        const priceYuan = parseFloat(prompt('Цена в юанях:') || '0');
        const purchasePrice = parseFloat(prompt('Цена закупки:') || '0');
        const deliveryCosts = parseFloat(prompt('Расходы на доставку:') || '0');
        const advertisingCosts = parseFloat(prompt('Расходы на рекламу:') || '0');
        const initialStock = parseInt(prompt('Начальные остатки:') || '0');
        const minStock = parseInt(prompt('Минимальный остаток:') || '0');

        const product = {
            id: this.generateId(),
            name,
            priceYuan,
            purchasePrice,
            deliveryCosts,
            advertisingCosts,
            initialStock,
            minStock,
            currentStock: initialStock
        };

        this.data.products.push(product);
        this.updateAllDisplays();
        this.updateTimestamp();
    }

    editProduct(productId) {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return;

        const newName = prompt('Название товара:', product.name);
        if (newName === null) return;

        const newPrice = parseFloat(prompt('Цена в юанях:', product.priceYuan.toString()) || product.priceYuan);
        const newPurchase = parseFloat(prompt('Цена закупки:', product.purchasePrice.toString()) || product.purchasePrice);
        const newDelivery = parseFloat(prompt('Расходы на доставку:', product.deliveryCosts.toString()) || product.deliveryCosts);
        const newAdvertising = parseFloat(prompt('Расходы на рекламу:', product.advertisingCosts.toString()) || product.advertisingCosts);
        const newMinStock = parseInt(prompt('Минимальный остаток:', product.minStock.toString()) || product.minStock);

        product.name = newName;
        product.priceYuan = newPrice;
        product.purchasePrice = newPurchase;
        product.deliveryCosts = newDelivery;
        product.advertisingCosts = newAdvertising;
        product.minStock = newMinStock;

        this.updateAllDisplays();
        this.updateTimestamp();
    }

    deleteProduct(productId) {
        if (!confirm('Удалить этот товар? Все связанные продажи также будут удалены.')) return;

        this.data.products = this.data.products.filter(p => p.id !== productId);
        this.data.sales = this.data.sales.filter(s => s.productId !== productId);
        
        this.updateAllDisplays();
        this.updateTimestamp();
    }

    showSalesForm() {
        const salesFormCard = document.getElementById('sales-form-card');
        if (salesFormCard) {
            salesFormCard.classList.remove('hidden');
            this.updateSalesFormProductSelect();
        }
    }

    hideSalesForm() {
        const salesFormCard = document.getElementById('sales-form-card');
        if (salesFormCard) {
            salesFormCard.classList.add('hidden');
        }

        const salesForm = document.getElementById('sales-form');
        if (salesForm) {
            salesForm.reset();
        }

        const saleDateInput = document.getElementById('sale-date');
        if (saleDateInput) {
            saleDateInput.value = new Date().toISOString().split('T')[0];
        }

        const unitPriceInput = document.getElementById('sale-unit-price');
        if (unitPriceInput) unitPriceInput.value = '';

        const totalInput = document.getElementById('sale-total');
        if (totalInput) totalInput.value = '';
    }

    updateSaleForm(productId) {
        const product = this.data.products.find(p => p.id === productId);
        
        const unitPriceInput = document.getElementById('sale-unit-price');
        const totalInput = document.getElementById('sale-total');
        
        if (product && unitPriceInput) {
            unitPriceInput.value = product.priceYuan.toFixed(2);
            this.updateSaleTotal();
        } else if (!product && unitPriceInput) {
            unitPriceInput.value = '';
            if (totalInput) totalInput.value = '';
        }
    }

    updateSaleTotal() {
        const quantityInput = document.getElementById('sale-quantity');
        const unitPriceInput = document.getElementById('sale-unit-price');
        const totalInput = document.getElementById('sale-total');
        
        if (quantityInput && unitPriceInput && totalInput) {
            const quantity = parseFloat(quantityInput.value || '0');
            const unitPrice = parseFloat(unitPriceInput.value || '0');
            const total = quantity * unitPrice;
            totalInput.value = total.toFixed(2);
        }
    }

    processSale() {
        const productSelect = document.getElementById('sale-product-select');
        const dateInput = document.getElementById('sale-date');
        const quantityInput = document.getElementById('sale-quantity');
        const unitPriceInput = document.getElementById('sale-unit-price');
        const customerInput = document.getElementById('sale-customer');

        if (!productSelect || !dateInput || !quantityInput || !unitPriceInput) {
            alert('Ошибка: не найдены поля формы');
            return;
        }

        const productId = productSelect.value;
        const date = dateInput.value;
        const quantity = parseInt(quantityInput.value || '0');
        const unitPrice = parseFloat(unitPriceInput.value || '0');
        const customer = customerInput ? customerInput.value : '';

        if (!productId || !date || quantity <= 0) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const product = this.data.products.find(p => p.id === productId);
        if (!product) {
            alert('Товар не найден');
            return;
        }

        if (quantity > product.currentStock) {
            alert(`Недостаточно товара. Доступно: ${product.currentStock}`);
            return;
        }

        const sale = {
            id: this.generateId(),
            productId,
            productName: product.name,
            date,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
            customer
        };

        this.data.sales.push(sale);
        this.recalculateInventory();
        this.updateAllDisplays();
        this.hideSalesForm();
        this.updateTimestamp();

        alert('Продажа успешно записана!');
    }

    deleteSale(saleId) {
        if (!confirm('Удалить эту продажу? Остатки товара будут пересчитаны.')) return;

        this.data.sales = this.data.sales.filter(s => s.id !== saleId);
        this.recalculateInventory();
        this.updateAllDisplays();
        this.updateTimestamp();
    }

    updateExchangeRates() {
        const cnyUsdInput = document.getElementById('settings-cny-usd');
        const cnyRubInput = document.getElementById('settings-cny-rub');
        const rateSourceInput = document.getElementById('settings-rate-source');
        const rateDateInput = document.getElementById('settings-rate-date');

        if (!cnyUsdInput || !cnyRubInput || !rateSourceInput || !rateDateInput) return;

        const newUsd = parseFloat(cnyUsdInput.value || '0');
        const newRub = parseFloat(cnyRubInput.value || '0');
        const source = rateSourceInput.value || '';
        const date = rateDateInput.value || '';

        this.data.settings.exchangeRates = {
            cnyToUsd: newUsd,
            cnyToRub: newRub,
            source,
            lastUpdated: date
        };

        this.updateAllDisplays();
        this.updateTimestamp();
        alert('Курсы валют обновлены');
    }

    saveSettings() {
        const thresholdInput = document.getElementById('settings-low-stock-threshold');
        const intervalInput = document.getElementById('settings-autosave-interval');
        const decimalsSelect = document.getElementById('settings-decimals');

        if (!thresholdInput || !intervalInput || !decimalsSelect) return;

        const threshold = parseInt(thresholdInput.value || '10');
        const interval = parseInt(intervalInput.value || '30');
        const decimals = parseInt(decimalsSelect.value || '2');

        this.data.settings.lowStockThreshold = threshold;
        this.data.settings.autoSaveInterval = interval;
        this.data.settings.currencyDecimals = decimals;

        this.startAutoSave();

        this.updateAllDisplays();
        this.updateTimestamp();
        alert('Настройки сохранены');
    }

    exportAllData() {
        const dataToExport = {
            products: this.data.products,
            sales: this.data.sales,
            settings: this.data.settings,
            columnConfigs: this.data.columnConfigs,
            exportDate: new Date().toISOString()
        };

        this.downloadJSON(dataToExport, `inventory_data_${this.getDateString()}.json`);
    }

    exportInventoryData() {
        const visibleColumns = this.data.columnConfigs.inventory.filter(col => col.visible !== false);
        const csvHeaders = visibleColumns.map(col => col.name).join(',');
        
        const csvData = [
            csvHeaders,
            ...this.data.products.map(product => {
                const totalSold = this.data.sales
                    .filter(sale => sale.productId === product.id)
                    .reduce((sum, sale) => sum + sale.quantity, 0);
                
                const rowData = {
                    ...product,
                    current_stock: product.currentStock,
                    initial_stock: product.initialStock,
                    total_sold: totalSold,
                    last_updated: new Date().toISOString().split('T')[0],
                    min_stock: product.minStock,
                    status: this.getStockStatusText(product)
                };
                
                return visibleColumns.map(col => {
                    const value = this.calculateColumnValue(col, rowData, 'inventory');
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                }).join(',');
            })
        ].join('\n');

        this.downloadCSV(csvData, `inventory_${this.getDateString()}.csv`);
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.products && importedData.sales) {
                    this.data = { ...this.data, ...importedData };
                    if (importedData.columnConfigs) {
                        this.data.columnConfigs = importedData.columnConfigs;
                    }
                    this.updateAllDisplays();
                    this.updateTimestamp();
                    alert('Данные успешно импортированы');
                } else {
                    alert('Неверный формат файла');
                }
            } catch (error) {
                alert('Ошибка при импорте данных: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadCSV(csvData, filename) {
        const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    updateTimestamp() {
        const timestampEl = document.getElementById('last-update-time');
        if (timestampEl) {
            timestampEl.textContent = new Date().toLocaleString('ru-RU');
        }
    }

    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        const interval = this.data.settings.autoSaveInterval * 1000;
        this.autoSaveTimer = setInterval(() => {
            this.updateTimestamp();
            console.log('Auto-save triggered');
        }, interval);
    }
}

// Initialize the application
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new InventoryManagementSystem();
    window.app = app; // Make available globally for debugging and inline event handlers
});