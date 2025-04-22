import { LightningElement, api } from "lwc";
import getPickListOptions from "@salesforce/apex/PatchCheckListFieldsToStatusController.getPickListOptions";
export default class PatchCheckListFieldsToStatus extends LightningElement {
	@api fieldStatusObject;
	@api recordId;
	@api objectApiName;
	fieldStatusOptions = [];


	connectedCallback() {
		this.getfieldStatusOptions();
	}

	getfieldStatusOptions() {
		getPickListOptions({
			objectApiName: this.objectApiName,
			fieldApiName: this.fieldStatusObject
		})
			.then(result => {
				this.fieldStatusOptions = result;
				console.log(this.fieldStatusOptions);
			}
			)
			.catch(error => {
				console.log(error);
			});
		
	}
}