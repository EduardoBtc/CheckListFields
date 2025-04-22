public with sharing class SchemaUtils {

    public static Map<String, Schema.SObjectField> getFieldsMap(String objectApiName) {
        if (String.isBlank(objectApiName))
            throw new IllegalArgumentException('Invalid object API name.');
        
        Map<String, Schema.SObjectType> globalDesc = Schema.getGlobalDescribe();
        Schema.SObjectType sObjType = globalDesc.get(objectApiName);

        if (sObjType == null)
            throw new IllegalArgumentException('Object "' + objectApiName + '" does not exist.');

        return sObjType.getDescribe().fields.getMap();
    }

    public static List<Schema.PicklistEntry> getPicklistValues(String objectApiName, String fieldApiName) {

        System.debug(objectApiName);
        System.debug(fieldApiName);

        if (String.isBlank(objectApiName) || String.isBlank(fieldApiName))
            throw new IllegalArgumentException('Invalid object or field API name.');

        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        Schema.SObjectType sObjectType = globalDescribe.get(objectApiName);

        if (sObjectType == null)
            throw new IllegalArgumentException('Object does not exist : ' + objectApiName);

        Map<String, Schema.SObjectField> fieldMap = sObjectType.getDescribe().fields.getMap();

        if (!fieldMap.containsKey(fieldApiName))
            throw new IllegalArgumentException('Field not found: ' + fieldApiName);

        Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldApiName).getDescribe();

        if (fieldDescribe.getType() != Schema.DisplayType.Picklist)
            throw new IllegalArgumentException('This field not a picklist: ' + fieldApiName);

        return fieldDescribe.getPicklistValues();
    }
}