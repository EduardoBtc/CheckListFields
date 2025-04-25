import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAvailableObjects from '@salesforce/apex/CheckListFieldsConfigController.getAvailableObjects';
import getPicklistFields from '@salesforce/apex/CheckListFieldsConfigController.getPicklistFields';
import getPicklistValues from '@salesforce/apex/CheckListFieldsConfigController.getPicklistValues';
import getObjectFields from '@salesforce/apex/CheckListFieldsConfigController.getObjectFields';
import saveConfiguration from '@salesforce/apex/CheckListFieldsConfigController.saveConfiguration';
import getSavedConfigurations from '@salesforce/apex/CheckListFieldsConfigController.getSavedConfigurations';
import deleteConfiguration from '@salesforce/apex/CheckListFieldsConfigController.deleteConfiguration';

export default class CheckListFieldsConfigBuilder extends LightningElement {
    @track selectedObject = '';
    @track selectedStatusField = '';
    @track configName = '';
    @track availableObjects = [];
    @track picklistFields = [];
    @track statusFieldValues = [];
    @track objectFields = [];
    @track steps = [];
    @track relatedLists = [];
    @track savedConfigurations = [];
    @track isLoading = false;
    @track currentTab = 'objeto';
    @track selectedConfiguration;
    @track isEditMode = false;

    @track showAddRelatedModal = false;
    @track selectedRelatedObject = '';
    @track selectedRelatedField = '';
    @track selectedRelatedStage = '';
    @track selectedRelatedLabel = '';
    @track availableRelatedObjects = [];

    // Para o modal de exclusão
    @track showDeleteModal = false;
    @track configToDeleteId = '';
    @track configToDeleteName = '';

    // Flag para controlar o scroll automático para a tabela após atualização
    scrollToTable = false;

    // Definição das colunas para a tabela de configurações
    configColumns = [
        { 
            label: 'ID', 
            fieldName: 'Id', 
            type: 'text',
            sortable: true,
            wrapText: true,
            initialWidth: 320
        },
        { 
            label: 'Nome', 
            fieldName: 'Name', 
            type: 'text',
            sortable: true,
            wrapText: false
        },
        { 
            label: 'Objeto', 
            fieldName: 'TargetObject__c', 
            type: 'text',
            sortable: true 
        },
        { 
            label: 'Campo de Status', 
            fieldName: 'StatusField__c', 
            type: 'text',
            sortable: true 
        },
        { 
            label: 'Data de Criação', 
            fieldName: 'CreatedDate', 
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            },
            sortable: true 
        },
        { 
            label: 'Última Modificação', 
            fieldName: 'LastModifiedDate', 
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            },
            sortable: true 
        },
        {
            type: 'action',
            typeAttributes: { 
                rowActions: [
                    { label: 'Editar', name: 'edit' },
                    { label: 'Excluir', name: 'delete' }
                ] 
            }
        }
    ];

    // Mapeamento das etapas concluídas
    @track completedSteps = {
        objeto: false,
        etapas: false,
        relacionados: false,
        revisao: false
    };

    @wire(getAvailableObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.availableObjects = data;
        } else if (error) {
            this.showError('Erro ao carregar objetos', error);
        }
    }

    connectedCallback() {
        // Inicializa o objeto de configuração
        this.initializeConfiguration();
        
        // Inicializa a flag de scroll
        this.scrollToTable = false;
        
        // Força a atualização das configurações no carregamento inicial
        this.refreshConfigurations();
    }

    initializeConfiguration() {
        this.steps = [];
        this.relatedLists = [];
        this.selectedObject = '';
        this.selectedStatusField = '';
        this.configName = '';
        this.currentTab = 'objeto';
        this.isEditMode = false;
        this.selectedConfiguration = null;
        this.resetCompletedSteps();
    }

    resetCompletedSteps() {
        this.completedSteps = {
            objeto: false,
            etapas: false,
            relacionados: false,
            revisao: false
        };
    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.loadPicklistFields();
        this.loadObjectFields();
    }

    loadPicklistFields() {
        if (!this.selectedObject) return;

        this.isLoading = true;
        getPicklistFields({ objectName: this.selectedObject })
            .then(result => {
                this.picklistFields = result;
                this.isLoading = false;
            })
            .catch(error => {
                this.showError('Erro ao carregar campos picklist', error);
                this.isLoading = false;
            });
    }

    loadObjectFields() {
        if (!this.selectedObject) return;

        this.isLoading = true;
        getObjectFields({ objectName: this.selectedObject })
            .then(result => {
                this.objectFields = result;
                this.isLoading = false;
            })
            .catch(error => {
                this.showError('Erro ao carregar campos do objeto', error);
                this.isLoading = false;
            });
    }

    handleStatusFieldChange(event) {
        this.selectedStatusField = event.detail.value;
    }

    loadStatusValues() {
        if (!this.selectedObject || !this.selectedStatusField) return;

        this.isLoading = true;
        getPicklistValues({ objectName: this.selectedObject, fieldName: this.selectedStatusField })
            .then(result => {
                this.statusFieldValues = result;
                // Criar etapas iniciais com base nos valores do campo de status
                this.steps = result.map(item => {
                    return {
                        etapa: item.value,
                        label: item.label,
                        campos: '',
                        selectedFields: []
                    };
                });
                this.isLoading = false;
                
                // Marcar a etapa de objeto como concluída
                this.completedSteps.objeto = true;
                
                // Avança para a próxima etapa
                this.currentTab = 'etapas';
            })
            .catch(error => {
                this.showError('Erro ao carregar valores do campo de status', error);
                this.isLoading = false;
            });
    }

    handleConfigNameChange(event) {
        this.configName = event.target.value;
    }

    handleNextStep() {
        if (this.currentTab === 'objeto') {
            if (!this.selectedObject || !this.selectedStatusField || !this.configName) {
                this.showError('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            this.loadStatusValues();
        } else if (this.currentTab === 'etapas') {
            this.completedSteps.etapas = true;
            this.currentTab = 'relacionados';
        } else if (this.currentTab === 'relacionados') {
            this.completedSteps.relacionados = true;
            this.currentTab = 'revisao';
        }
    }

    handlePreviousStep() {
        if (this.currentTab === 'etapas') {
            this.currentTab = 'objeto';
        } else if (this.currentTab === 'relacionados') {
            this.currentTab = 'etapas';
        } else if (this.currentTab === 'revisao') {
            this.currentTab = 'relacionados';
        }
    }

    // Método para navegar entre etapas usando o progress indicator
    navigateToStep(event) {
        const selectedStep = event.target.value;
        
        // Verificar se pode navegar para essa etapa
        if (this.canNavigateToStep(selectedStep)) {
            this.currentTab = selectedStep;
        } else {
            this.showError('Navegação não permitida', 'Por favor, complete as etapas anteriores primeiro.');
        }
    }
    
    // Verificar se pode navegar para uma etapa específica
    canNavigateToStep(step) {
        switch(step) {
            case 'objeto':
                return true; // Sempre pode voltar para a primeira etapa
            case 'etapas':
                return this.completedSteps.objeto || this.selectedObject && this.selectedStatusField && this.configName;
            case 'relacionados':
                return this.completedSteps.etapas;
            case 'revisao':
                return this.completedSteps.relacionados;
            default:
                return false;
        }
    }

    handleFieldSelection(event) {
        const { stepIndex, field, selected } = event.detail;
        
        // Clonar para não modificar diretamente a propriedade reativa
        const updatedSteps = [...this.steps];
        
        if (!updatedSteps[stepIndex].selectedFields) {
            updatedSteps[stepIndex].selectedFields = [];
        }

        if (selected) {
            // Adicionar campo se não estiver na lista
            if (!updatedSteps[stepIndex].selectedFields.includes(field)) {
                updatedSteps[stepIndex].selectedFields.push(field);
            }
        } else {
            // Remover campo se estiver na lista
            const fieldIndex = updatedSteps[stepIndex].selectedFields.indexOf(field);
            if (fieldIndex !== -1) {
                updatedSteps[stepIndex].selectedFields.splice(fieldIndex, 1);
            }
        }

        // Atualizar a string de campos
        updatedSteps[stepIndex].campos = updatedSteps[stepIndex].selectedFields.join(',');
        
        this.steps = updatedSteps;
    }

    handleAddRelatedList() {
        this.showAddRelatedModal = true;
        // Carregar objetos para relacionamento
        this.availableRelatedObjects = [...this.availableObjects];
    }

    closeRelatedModal() {
        this.showAddRelatedModal = false;
        this.selectedRelatedObject = '';
        this.selectedRelatedField = '';
        this.selectedRelatedStage = '';
        this.selectedRelatedLabel = '';
    }

    handleRelatedObjectChange(event) {
        this.selectedRelatedObject = event.detail.value;
    }

    handleRelatedFieldChange(event) {
        this.selectedRelatedField = event.detail.value;
    }

    handleRelatedLabelChange(event) {
        this.selectedRelatedLabel = event.target.value;
    }

    handleRelatedStageChange(event) {
        this.selectedRelatedStage = event.detail.value;
    }

    saveRelatedList() {
        if (!this.selectedRelatedObject || !this.selectedRelatedField || 
            !this.selectedRelatedStage || !this.selectedRelatedLabel) {
            this.showError('Campos obrigatórios', 'Preencha todos os campos para adicionar uma lista relacionada.');
            return;
        }

        const newRelatedList = {
            objectApiName: this.selectedRelatedObject,
            fieldRelationship: this.selectedRelatedField,
            label: this.selectedRelatedLabel,
            stage: this.selectedRelatedStage
        };

        this.relatedLists = [...this.relatedLists, newRelatedList];
        this.closeRelatedModal();
    }

    removeRelatedList(event) {
        const index = event.target.dataset.index;
        const updatedLists = [...this.relatedLists];
        updatedLists.splice(index, 1);
        this.relatedLists = updatedLists;
    }

    get configurationJSON() {
        const config = {
            steps: this.steps.map(step => ({
                etapa: step.etapa,
                campos: step.campos
            })),
            relatedLists: this.relatedLists
        };

        return JSON.stringify(config, null, 2);
    }

    // Prepara o JSON para salvamento
    prepareConfigJSON() {
        const config = {
            steps: this.steps.map(step => ({
                etapa: step.etapa,
                campos: step.campos || ''
            })),
            relatedLists: this.relatedLists || []
        };

        // Valida campos obrigatórios
        for (const step of config.steps) {
            if (!step.etapa) {
                throw new Error('Todas as etapas devem ter um valor');
            }
        }

        return JSON.stringify(config);
    }

    saveConfig() {
        if (!this.configName) {
            this.showError('Nome obrigatório', 'Por favor, forneça um nome para esta configuração.');
            return;
        }

        // Validar que o objeto tem dados
        if (!this.steps.length) {
            this.showError('Configuração incompleta', 'É necessário ter pelo menos uma etapa configurada.');
            return;
        }

        // Converter para string JSON com formatação adequada
        let configJSON;
        try {
            configJSON = this.prepareConfigJSON();
            console.log('JSON a ser salvo:', configJSON);
        } catch (error) {
            this.showError('Erro ao criar JSON', 'Não foi possível converter a configuração para JSON: ' + error.message);
            console.error('Erro ao criar JSON:', error);
            return;
        }

        this.isLoading = true;
        console.log('Enviando para salvamento:', {
            name: this.configName,
            targetObject: this.selectedObject,
            statusField: this.selectedStatusField,
            configId: this.selectedConfiguration?.Id
        });

        saveConfiguration({
            name: this.configName,
            targetObject: this.selectedObject,
            statusField: this.selectedStatusField,
            configJson: configJSON,
            configId: this.selectedConfiguration?.Id
        })
        .then(configId => {
            console.log('Resposta do salvamento, ID:', configId);
            // Se a operação foi bem-sucedida e retornou um ID
            if (configId) {
                // Mostrar mensagem de sucesso
                this.showSuccess('Configuração Salva', 'A configuração foi salva com sucesso!');
                
                // Recarregar todas as configurações de forma forçada
                return this.refreshConfigurations()
                    .then(() => {
                        // Limpar o formulário e esconder todos os seus elementos após recarregar a lista
                        this.initializeConfiguration();
                        this.scrollToTable = true;
                        return configId;
                    });
            }
            return null;
        })
        .catch(error => {
            this.isLoading = false;
            console.error('Erro ao salvar configuração:', error);
            this.showError('Erro ao salvar', error);
        });
    }
    
    // Método para atualizar a lista de configurações
    refreshConfigurations() {
        this.isLoading = true;
        console.log('Buscando configurações atualizadas do servidor...');
        
        // Chamada imperativa para buscar as configurações mais recentes
        return getSavedConfigurations()
            .then(configs => {
                this.isLoading = false;
                
                if (configs) {
                    console.log('Configurações carregadas do servidor:', configs.length);
                    
                    // Verificar se cada configuração tem o ConfigJSON__c
                    configs.forEach(config => {
                        if (!config.ConfigJSON__c) {
                            console.warn('Configuração sem JSON:', config.Id, config.Name);
                        }
                    });
                    
                    // Limpar e substituir toda a matriz de configurações
                    this.savedConfigurations = [];
                    
                    // Atualizar os dados com os valores mais recentes
                    this.savedConfigurations = JSON.parse(JSON.stringify(configs));
                    
                    // Forçar a atualização de quaisquer componentes dependentes
                    this.dispatchEvent(new CustomEvent('refreshcomplete'));
                    
                    console.log('Configurações atualizadas na interface:', this.savedConfigurations.length);
                } else {
                    console.warn('Nenhuma configuração retornada pelo servidor');
                    this.savedConfigurations = [];
                }
                
                return configs;
            })
            .catch(error => {
                this.isLoading = false;
                console.error('Erro ao atualizar configurações:', error);
                this.showError('Erro ao atualizar configurações', error);
                return null;
            });
    }

    // Lifecycle hook para executar ações após renderização
    renderedCallback() {
        // Se a flag de scroll estiver ativa, rolar até a tabela
        if (this.scrollToTable) {
            const tableSection = this.template.querySelector('.slds-m-top_large');
            if (tableSection) {
                tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Resetar a flag para evitar scrolls repetidos
            this.scrollToTable = false;
        }
    }

    handleLoadConfiguration(event) {
        const configId = event.currentTarget.dataset.id;
        this.loadConfigById(configId);
    }

    loadConfigById(configId) {
        this.selectedConfiguration = this.savedConfigurations.find(config => config.Id === configId);
        
        if (!this.selectedConfiguration) return;

        this.configName = this.selectedConfiguration.Name;
        this.selectedObject = this.selectedConfiguration.TargetObject__c;
        this.selectedStatusField = this.selectedConfiguration.StatusField__c;
        this.isEditMode = true;
        
        console.log('Carregando configuração:', this.selectedConfiguration);
        console.log('ConfigJSON__c:', this.selectedConfiguration.ConfigJSON__c);
        
        // Carregar campos do objeto selecionado
        this.loadPicklistFields();
        this.loadObjectFields();
        
        // Parsear configuração JSON
        try {
            let configJSON = this.selectedConfiguration.ConfigJSON__c;
            
            // Verificar se o JSON existe
            if (!configJSON) {
                this.showError('Configuração inválida', 'O JSON de configuração está vazio ou não existe.');
                console.error('JSON de configuração vazio:', this.selectedConfiguration);
                return;
            }
            
            // Tentar fazer o parse do JSON
            const config = JSON.parse(configJSON);
            console.log('JSON parseado com sucesso:', config);
            
            // Verificar se há etapas definidas
            if (!config.steps || config.steps.length === 0) {
                this.showError('Configuração inválida', 'A configuração não possui etapas definidas.');
                console.error('Configuração sem etapas:', config);
                return;
            }
            
            // Recuperar valores do campo de status
            getPicklistValues({ objectName: this.selectedObject, fieldName: this.selectedStatusField })
                .then(result => {
                    this.statusFieldValues = result;
                    console.log('Valores de status obtidos:', result);
                    
                    // Mapear etapas com os valores do campo de status
                    this.steps = result.map(item => {
                        const existingStep = config.steps.find(s => s.etapa === item.value);
                        console.log(`Etapa ${item.value}:`, existingStep);
                        
                        return {
                            etapa: item.value,
                            label: item.label,
                            campos: existingStep ? existingStep.campos : '',
                            selectedFields: existingStep && existingStep.campos 
                                ? existingStep.campos.split(',')
                                : []
                        };
                    });
                    
                    console.log('Etapas mapeadas:', this.steps);
                    
                    // Carregar listas relacionadas
                    this.relatedLists = Array.isArray(config.relatedLists) ? config.relatedLists : [];
                    console.log('Listas relacionadas:', this.relatedLists);
                    
                    // Marcar etapas como concluídas
                    this.completedSteps.objeto = true;
                    this.completedSteps.etapas = true;
                    
                    // Ir para a aba de etapas
                    this.currentTab = 'etapas';
                })
                .catch(error => {
                    this.showError('Erro ao carregar configuração', error);
                    console.error('Erro ao carregar valores de status:', error);
                });
        } catch (error) {
            this.showError('Erro ao analisar JSON', error);
            console.error('Erro ao analisar JSON:', error, 'JSON recebido:', this.selectedConfiguration.ConfigJSON__c);
        }
    }

    // Ações na tabela de configurações
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
        
        switch (action.name) {
            case 'edit':
                this.loadConfigById(row.Id);
                break;
            case 'delete':
                this.showDeleteConfirmation(row);
                break;
            default:
                break;
        }
    }

    // Exibir modal de confirmação para exclusão
    showDeleteConfirmation(row) {
        this.configToDeleteId = row.Id;
        this.configToDeleteName = row.Name;
        this.showDeleteModal = true;
    }

    // Fechar modal de confirmação
    closeDeleteModal() {
        this.showDeleteModal = false;
        this.configToDeleteId = '';
        this.configToDeleteName = '';
    }

    // Confirmar e executar a exclusão
    confirmDeleteConfiguration() {
        if (!this.configToDeleteId) return;
        
        this.isLoading = true;
        deleteConfiguration({ configId: this.configToDeleteId })
            .then(result => {
                if (result) {
                    this.showSuccess('Configuração Excluída', 'A configuração foi excluída com sucesso!');
                    
                    // Atualizar lista de configurações usando o método atualizado
                    return this.refreshConfigurations()
                        .then(() => {
                            this.closeDeleteModal();
                            return result;
                        });
                }
                
                this.showError('Erro ao excluir', 'Não foi possível excluir a configuração.');
                this.isLoading = false;
                this.closeDeleteModal();
                return null;
            })
            .catch(error => {
                this.showError('Erro ao excluir', error);
                this.isLoading = false;
                this.closeDeleteModal();
            });
    }

    get currentStep() {
        return this.currentTab;
    }

    get isObjectTabActive() {
        return this.currentTab === 'objeto';
    }

    get isStepsTabActive() {
        return this.currentTab === 'etapas';
    }

    get isRelatedTabActive() {
        return this.currentTab === 'relacionados';
    }

    get isReviewTabActive() {
        return this.currentTab === 'revisao';
    }

    get hasSteps() {
        return this.steps && this.steps.length > 0;
    }

    get hasRelatedLists() {
        return this.relatedLists && this.relatedLists.length > 0;
    }

    get hasConfigurations() {
        return this.savedConfigurations && this.savedConfigurations.length > 0;
    }

    get cardTitle() {
        if (this.isEditMode) {
            return `Editando: ${this.configName}`;
        }
        return 'Configuração CheckList Fields';
    }

    showError(title, error) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: error.message || error,
                variant: 'error',
            }),
        );
    }

    showSuccess(title, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: 'success',
            }),
        );
    }

    // Método para cancelar edição e voltar ao estado inicial
    cancelEdit() {
        this.initializeConfiguration();
        this.scrollToTable = true; // Rolar para a tabela de configurações
        this.showSuccess('Edição cancelada', 'Você saiu do modo de edição');
    }
} 