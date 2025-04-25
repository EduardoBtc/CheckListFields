/* eslint-disable @lwc/lwc/no-leading-uppercase-api-name */
import { LightningElement, api, wire } from "lwc";
import { getRecord } from 'lightning/uiRecordApi';
import { CreateShowToastEvent } from "c/utilsComponent";
import { RefreshEvent } from 'lightning/refresh';
import verifyFildsFillStage from '@salesforce/apex/CheckListFieldsController.verifyFildsFillStage';
import checkRelatedList from '@salesforce/apex/CheckListFieldsController.getRelatedRecords';
import getConfiguration from '@salesforce/apex/CheckListFieldsController.getConfiguration';
import { subscribe, publish, MessageContext } from 'lightning/messageService';
import COMPONENT_COMMUNICATION_CHANNEL from "@salesforce/messageChannel/CheckListFieldsToSatusChannel__c";

export default class CheckListFieldsToStatus extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api statusField = 'Status';
    @api configId;

    _parsedConfig;
    _steps = [];
    _relatedLists = [];

    statusVerifyFields = false;
    fieldsVerifyMap = {};
    lastStatusRecord;
    lastMapFieldStatus;
    currentStatus;
    updateLastStatusRecord = true;
    isLoading = true;
    hasError = false;
    errorMessage = '';

    @wire(MessageContext) 
    messageContext;

    @wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full'], modes: ['View'] })
    async loadFields({ error, data }) {
        if (error) {
            console.error('Erro ao carregar o registro', error);
            this.hasError = true;
            this.errorMessage = 'Erro ao carregar o registro: ' + (error.body?.message || error.message);
        } else if (data) {
            const dynamicField = this.statusField;

            this.currentStatus = data.fields?.[dynamicField]?.value;

            if (this.currentStatus) {
                await this.handleStatusChange(this.currentStatus);
                this.dispatchEvent(new RefreshEvent());
            }
        }
    }

    connectedCallback() {
        this.loadConfiguration();
        
        subscribe(this.messageContext, COMPONENT_COMMUNICATION_CHANNEL, 
            (message) => {
            if (message.action === 'getFieldsToFill') {
                const hasFieldEmpty = Object.entries(this.fieldsVerifyMap)
                                    .filter(([, value]) => value === false)
                                    .map(([key]) => key);

                publish(this.messageContext, COMPONENT_COMMUNICATION_CHANNEL, { action: 'responseGetFieldsToFill', hasFieldEmpty: hasFieldEmpty });
            }
        });
    }

    async loadConfiguration() {
        if (!this.configId) {
            this.hasError = true;
            this.errorMessage = 'ID de configuração não fornecido. Verifique as propriedades do componente.';
            this.isLoading = false;
            return;
        }

        try {
            const config = await getConfiguration({ configId: this.configId });
            if (!config) {
                this.hasError = true;
                this.errorMessage = 'Configuração não encontrada. Verifique o ID fornecido.';
                this.isLoading = false;
                return;
            }

            // Parsear configuração JSON
            const parsedConfig = JSON.parse(config.ConfigJSON__c);
            this._parsedConfig = parsedConfig;
            this._steps = parsedConfig.steps || [];
            this._relatedLists = parsedConfig.relatedLists || [];
            
            // Se já tivermos o status atual, atualizar a verificação
            if (this.currentStatus) {
                await this.handleStatusChange(this.currentStatus);
            }
            
            this.isLoading = false;
        } catch (error) {
            console.error('Erro ao carregar configuração:', error);
            this.hasError = true;
            this.errorMessage = 'Erro ao carregar configuração: ' + (error.body?.message || error.message);
            this.isLoading = false;
        }
    }

    async checkFieldsStage() {
        let fieldsBlank = [];

        for (const field in this.lastMapFieldStatus)
            if (this.lastMapFieldStatus[field] === false)
                fieldsBlank.push(field);

        if (fieldsBlank.length === 0) {
            this.updateLastStatusRecord = true;
            return;
        }

        this.updateLastStatusRecord = true;

        let messageErrorFields = `Os seguintes campos não foram preenchidos: ${fieldsBlank.join(', ')}`;
        CreateShowToastEvent(this, 'Atenção!', messageErrorFields, 'warning');
    }

    async handleStatusChange(status) {
        this.statusVerifyFields = false;
        this.fieldsVerifyMap = {};

        // Se a configuração ainda não foi carregada, aguarde
        if (!this._parsedConfig) {
            await this.loadConfiguration();
        }

        await this.fetchRelatedRecords(status);

        // Procurar a etapa correspondente ao status atual
        const matchingStep = this._steps.find(step => step.etapa === status);
        if (matchingStep && matchingStep.campos) {
            await this.verifyFildsFillStage(matchingStep.campos);
        }

        this.lastMapFieldStatus = this.fieldsVerifyMap;
        this.dispatchEvent(new RefreshEvent());
    }

    async verifyFildsFillStage(fieldsQuery) {
        if (!fieldsQuery) 
            return;

        try {
            const result = await verifyFildsFillStage({
                recordId: this.recordId,
                fieldsQuery: fieldsQuery,
                objectApiName: this.objectApiName
            });

            this.fieldsVerifyMap = {
                ...this.fieldsVerifyMap,
                ...result
            };

            this.lastMapFieldStatus = this.fieldsVerifyMap;
            this.statusVerifyFields = true;

        } catch (error) {
            CreateShowToastEvent(this, 'Erro ao verificar campos', error.body?.message || error.message, 'error');
        }
    }

    async fetchRelatedRecords(status) {
        const updates = {};
        const promises = [];

        // Coletar todas as promessas de verificação de listas relacionadas
        this._relatedLists
            .filter(relatedList => relatedList.stage === status && relatedList.objectApiName && relatedList.fieldRelationship)
            .forEach(relatedList => {
                const promise = this.checkRelatedListJS({
                    relatedObjectName: relatedList.objectApiName,
                    fieldRelationship: relatedList.fieldRelationship
                })
                .then(result => {
                    updates[relatedList.label] = result.length > 0;
                })
                .catch(error => {
                    console.error('Erro ao verificar lista relacionada:', error);
                });
                
                promises.push(promise);
            });

        // Aguardar todas as promessas serem concluídas
        await Promise.all(promises);

        this.fieldsVerifyMap = {
            ...this.fieldsVerifyMap,
            ...updates
        };
    }

    async checkRelatedListJS(props) {
        try {
            const result = await checkRelatedList({
                objectName: props.relatedObjectName,
                fieldRelationship: props.fieldRelationship,
                recordId: this.recordId
            });
            return result || [];
        } catch (error) {
            return [];
        }
    }

    get fieldsVerifyList() {
        return Object.entries(this.fieldsVerifyMap).map(([key, value]) => ({ key, value }));
    }

    get totalFieldsEmpty() {
        return 'Número de campos para preencher: ' + Object.values(this.fieldsVerifyMap).filter(value => !value).length;
    }

    get formattedFields() {
        return Object.entries(this.fieldsVerifyMap).map(([key, value]) => {
            return {
                key,
                value,
                iconName: value ? 'action:approval' : 'action:close',
                iconAlt: value ? 'Preenchido' : 'Não Preenchido',
                iconClass: value ? 'slds-icon-text-success' : 'slds-icon-text-error'
            };
        });
    }

    get badgeClass() {
        const total = this.totalFieldsEmptyCount;
        return total > 0 ? 'slds-badge slds-theme_error' : 'slds-badge slds-theme_success';
    }

    get totalFieldsEmptyLabel() {
        const total = this.totalFieldsEmptyCount;
        return `Número de campos para preencher: ${total}`;
    }

    get totalFieldsEmptyCount() {
        return Object.values(this.fieldsVerifyMap).filter(value => !value).length;
    }
}
