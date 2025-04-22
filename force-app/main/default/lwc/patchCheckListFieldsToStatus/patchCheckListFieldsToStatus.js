import { LightningElement, api, wire } from "lwc";
import { updateRecord } from "lightning/uiRecordApi";
import { CreateShowToastEvent } from "c/utilsComponent";
import getPickListOptions from "@salesforce/apex/PatchCheckListFieldsToStatusController.getPickListOptions";
import getCurrentStatus from "@salesforce/apex/PatchCheckListFieldsToStatusController.getCurrentStatus";
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import COMPONENT_COMMUNICATION_CHANNEL from "@salesforce/messageChannel/CheckListFieldsToSatusChannel__c";
export default class PatchCheckListFieldsToStatus extends LightningElement {
	@api fieldStatusObject = '';
	@api recordId;
	@api objectApiName;

	fieldStatusOptions = [];
	currentStatus = '';
	lastStepSelected = '';

	@wire(MessageContext) 
	messageContext;

	connectedCallback() {
		this.getfieldStatusOptions();
		this.getCurrentStatus();
		this.subscribeToFieldResponse();
	}

	getCurrentStatus() {
		getCurrentStatus({
			objectApiName: this.objectApiName,
			fieldApiName: this.fieldStatusObject,
			recordId: this.recordId
		})
		.then(result => {
			this.currentStatus = result;
		}
		)
		.catch(error => {
			console.log(error);
		});
	}

	getfieldStatusOptions() {
		getPickListOptions({
			objectApiName: this.objectApiName,
			fieldApiName: this.fieldStatusObject
		})
			.then(result => {
				this.fieldStatusOptions = result;
			}
			)
			.catch(error => {
				console.log(error);
			});
		
	}

	handleStepClick(event) {
		this.lastStepSelected = event.currentTarget.value;

		publish(this.messageContext, COMPONENT_COMMUNICATION_CHANNEL, {
            action: 'getFieldsToFill'
        });
    }

	subscribeToFieldResponse() {
		subscribe(this.messageContext, COMPONENT_COMMUNICATION_CHANNEL, (message) => {
			if (message.action == 'responseGetFieldsToFill') {
				let hasFieldEmpty = message.hasFieldEmpty;

				if (hasFieldEmpty.length > 0) {
					CreateShowToastEvent(this, 'Campos a serem preenchidos', 'Existem campos a serem preenchidos', 'error');
				} else {
					this.updateRecord(this.lastStepSelected);
					
				}
			}
		});
	}

	updateRecord(statusUpdate) {

		const fields = {};
		fields['Id'] = this.recordId;
		fields[this.fieldStatusObject] = statusUpdate;
		const recordInput = { fields };
		this.currentStatus = statusUpdate;

		updateRecord(recordInput)
		.then(() => {
				CreateShowToastEvent(this, 'Status atualizado', 'Status atualizado com sucesso', 'success');
			})
			.catch(error => {
				console.log(error);
			});
	}
}