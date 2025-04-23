import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export function CreateShowToastEvent(page, title, message, variant) {
    const evt = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
    });
    page.dispatchEvent(evt);
}