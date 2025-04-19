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
}