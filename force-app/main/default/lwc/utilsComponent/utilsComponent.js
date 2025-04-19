import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export function CreateShowToastEvent(page, title, message, variant) {
    const evt = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
    });
    page.dispatchEvent(evt);
}

export function GetRecordIdFromURL(objectNameURL, windowLocationhref) {
    let currentUrl = windowLocationhref;
    let startIndex = currentUrl.indexOf(`/${objectNameURL}/`) + `/${objectNameURL}/`.length;
    let endIndex = currentUrl.indexOf('/', startIndex);
    let recordId = currentUrl.substring(startIndex, endIndex);
    return recordId;
}

export function IsCommunity(windowLocationPathName) {
    return windowLocationPathName.includes('/s/');
}