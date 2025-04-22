public with sharing class PatchCheckListFieldsToStatusController {
    
    @AuraEnabled(cacheable=true)
    public static List<PickListResult> getPickListOptions(String objectApiName, String fieldApiName) {
        List<PickListResult> pickListOptions = new List<PickListResult>();
        try {
            List<Schema.PicklistEntry> pickListValues = SchemaUtils.getPicklistValues(objectApiName, fieldApiName);

            for (Schema.PicklistEntry pickListValue : pickListValues) {
                PickListResult pickListOption = new PickListResult(pickListValue.getLabel(), pickListValue.getValue());
                pickListOptions.add(pickListOption);
            }

        } catch(Exception e) {
            throw new AuraHandledException('Error fetching picklist values: ' + e.getMessage());
        }

        return pickListOptions;
    }

    private class PickListResult {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String value { get; set; }

        public PickListResult(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
}