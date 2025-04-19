public without sharing class CheckListFieldsController {

    @AuraEnabled
    public static Map<String, Boolean> verifyFildsFillStage(String recordId, String fieldsQuery, String objectApiName) {
        try {
            if (String.isBlank(recordId) || String.isBlank(fieldsQuery) || String.isBlank(objectApiName)) 
                throw new AuraHandledException('Invalid input parameters');

            String dynamicQuery = 'SELECT ' + fieldsQuery + ' FROM ' + objectApiName + ' WHERE Id = :recordId';
            SObject relatedRecord = Database.query(dynamicQuery);

            Map<String, Schema.SObjectField> fieldMap = SchemaUtils.getFieldsMap(objectApiName);
            Map<String, Boolean> mapFields = new Map<String, Boolean>();

            for (String field : fieldsQuery.split(',')) {

                String trimmedField = field.trim();

                if (!fieldMap.containsKey(trimmedField)) 
                    continue;

                Schema.DescribeFieldResult describe = fieldMap.get(trimmedField).getDescribe();
                Object value = relatedRecord.get(trimmedField);

                Boolean isFilled = value != null;
                
                if (value instanceof String) 
                    isFilled = !String.isBlank((String)value);

                mapFields.put(describe.getLabel(), isFilled);
            }

            return mapFields;
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<SObject> getRelatedRecords(String objectName, String fieldRelationship, String recordId) {
        if (Schema.getGlobalDescribe().containsKey(objectName)) {
            String query = 'SELECT Id FROM ' + objectName + ' WHERE ' + fieldRelationship + '=: recordId';
            return Database.query(query);
        }
        return new List<SObject>();
    }
}