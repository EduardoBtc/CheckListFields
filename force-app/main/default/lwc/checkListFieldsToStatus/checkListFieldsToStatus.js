/* eslint-disable @lwc/lwc/no-leading-uppercase-api-name */
import { LightningElement, api, wire } from "lwc";
import { getRecord } from 'lightning/uiRecordApi';
import { CreateShowToastEvent } from "c/utilsComponent";
import { RefreshEvent } from 'lightning/refresh';
import verifyFildsFillStage from '@salesforce/apex/CheckListFieldsController.verifyFildsFillStage';
import checkRelatedList from '@salesforce/apex/CheckListFieldsController.getRelatedRecords';
import { subscribe,publish, MessageContext } from 'lightning/messageService';
import COMPONENT_COMMUNICATION_CHANNEL from "@salesforce/messageChannel/CheckListFieldsToSatusChannel__c";

export default class CheckListFieldsToStatus extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api statusField = 'Status';

    @api relatedObjectName1;
    @api screenObjectName1;
    @api fieldRelationship1;
    @api stageRelationship1;

    @api relatedObjectName2;
    @api screenObjectName2;
    @api fieldRelationship2;
    @api stageRelationship2;

    @api relatedObjectName3;
    @api screenObjectName3;
    @api fieldRelationship3;
    @api stageRelationship3;

    @api Etapa1;
    @api CamposEtapa1;
    @api Etapa2;
    @api CamposEtapa2;
    @api Etapa3;
    @api CamposEtapa3;
    @api Etapa4;
    @api CamposEtapa4;
    @api Etapa5;
    @api CamposEtapa5;

    statusVerifyFields = false;
    fieldsVerifyMap = {};
    lastStatusRecord;
    lastMapFieldStatus;
    currentStatus;
    updateLastStatusRecord = true;

    @wire(MessageContext) 
    messageContext;

    @wire(getRecord, { recordId: '$recordId', layoutTypes: ['Full'], modes: ['View'] })
    async loadFields({ error, data }) {
        if (error) {
            console.error('Erro ao carregar o registro', error);
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
        subscribe(this.messageContext, COMPONENT_COMMUNICATION_CHANNEL, 
            (message) => {
            if (message.action == 'getFieldsToFill') {
                let hasFieldEmpty = Object.entries(this.fieldsVerifyMap)
                                    .filter(([key, value]) => value === false)
                                    .map(([key]) => key);

                publish(this.messageContext, COMPONENT_COMMUNICATION_CHANNEL, { action: 'responseGetFieldsToFill', hasFieldEmpty: hasFieldEmpty });
            }
            
        });
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

        await this.fetchRelatedRecords(status);

        if (status === this.Etapa1)
            await this.verifyFildsFillStage(this.CamposEtapa1);

        if (status === this.Etapa2)
            await this.verifyFildsFillStage(this.CamposEtapa2);

        if (status === this.Etapa3)
            await this.verifyFildsFillStage(this.CamposEtapa3);

        if (status === this.Etapa4)
            await this.verifyFildsFillStage(this.CamposEtapa4);

        if (status === this.Etapa5)
            await this.verifyFildsFillStage(this.CamposEtapa5);

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

        if (this.relatedObjectName1 && this.fieldRelationship1 && status === this.stageRelationship1) {
            const relatedRecords1 = await this.checkRelatedListJS({
                relatedObjectName: this.relatedObjectName1,
                fieldRelationship: this.fieldRelationship1
            });
            updates[this.screenObjectName1] = relatedRecords1.length > 0;
        }

        if (this.relatedObjectName2 && this.fieldRelationship2 && status === this.stageRelationship2) {
            const relatedRecords2 = await this.checkRelatedListJS({
                relatedObjectName: this.relatedObjectName2,
                fieldRelationship: this.fieldRelationship2
            });
            updates[this.screenObjectName2] = relatedRecords2.length > 0;
        }

        if (this.relatedObjectName3 && this.fieldRelationship3 && status === this.stageRelationship3) {
            const relatedRecords3 = await this.checkRelatedListJS({
                relatedObjectName: this.relatedObjectName3,
                fieldRelationship: this.fieldRelationship3
            });
            updates[this.screenObjectName3] = relatedRecords3.length > 0;
        }

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
