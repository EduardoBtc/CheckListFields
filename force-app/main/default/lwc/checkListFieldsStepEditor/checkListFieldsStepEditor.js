import { LightningElement, api, track } from 'lwc';

export default class CheckListFieldsStepEditor extends LightningElement {
    @api stepIndex;
    @api step;
    @api objectFields = [];
    
    @track selectedFields = [];
    @track searchTerm = '';
    @track showSelectedOnly = false;
    
    connectedCallback() {
        if (this.step.selectedFields) {
            this.selectedFields = [...this.step.selectedFields];
        }
    }
    
    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const isChecked = event.target.checked;
        
        this.dispatchEvent(new CustomEvent('fieldsselection', {
            detail: {
                stepIndex: this.stepIndex,
                field: field,
                selected: isChecked
            }
        }));
    }
    
    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase();
    }
    
    handleToggleSelected(event) {
        this.showSelectedOnly = event.target.checked;
    }
    
    handleSelectAll() {
        const checkboxes = this.template.querySelectorAll('lightning-input[data-field]');
        
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                this.dispatchEvent(new CustomEvent('fieldsselection', {
                    detail: {
                        stepIndex: this.stepIndex,
                        field: checkbox.dataset.field,
                        selected: true
                    }
                }));
            }
        });
    }
    
    handleDeselectAll() {
        const checkboxes = this.template.querySelectorAll('lightning-input[data-field]');
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                this.dispatchEvent(new CustomEvent('fieldsselection', {
                    detail: {
                        stepIndex: this.stepIndex,
                        field: checkbox.dataset.field,
                        selected: false
                    }
                }));
            }
        });
    }
    
    get filteredFields() {
        if (!this.objectFields) {
            return [];
        }
        
        return [...this.objectFields]
            .filter(field => {
                const matchesSearch = !this.searchTerm || 
                    field.label.toLowerCase().includes(this.searchTerm) || 
                    field.value.toLowerCase().includes(this.searchTerm);
                
                const isSelected = this.isFieldSelected(field.value);
                const showBySelection = !this.showSelectedOnly || isSelected;
                
                return matchesSearch && showBySelection;
            })
            .sort((a, b) => {
                if (a.label < b.label) return -1;
                if (a.label > b.label) return 1;
                return 0;
            })
            .map(field => {
                return {
                    ...field,
                    checked: this.isFieldSelected(field.value)
                };
            });
    }
    
    get selectedCount() {
        return this.step?.selectedFields?.length || 0;
    }
    
    get totalCount() {
        return this.objectFields?.length || 0;
    }
    
    isFieldSelected(fieldValue) {
        if (!this.step || !this.step.selectedFields) {
            return false;
        }
        
        return this.step.selectedFields.includes(fieldValue);
    }
} 