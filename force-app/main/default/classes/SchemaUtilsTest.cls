@isTest
private class SchemaUtilsTest {
    @isTest
    static void testGetFieldsMapWithValidObject() {
        Test.startTest();
        Map<String, Schema.SObjectField> accountFields = SchemaUtils.getFieldsMap('Account');
        Test.stopTest();
        
        System.assertNotEquals(null, accountFields);
        System.assert(accountFields.containsKey('Name'));
        System.assert(accountFields.containsKey('Id'));
    }
    
    @isTest
    static void testGetFieldsMapWithBlankObjectName() {
        Test.startTest();
        try {
            SchemaUtils.getFieldsMap('');
            System.assert(false, 'Should have thrown an exception');
        } catch(IllegalArgumentException e) {
            System.assertEquals('Invalid object API name.', e.getMessage());
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetFieldsMapWithNullObjectName() {
        Test.startTest();
        try {
            SchemaUtils.getFieldsMap(null);
            System.assert(false, 'Should have thrown an exception');
        } catch(IllegalArgumentException e) {
            System.assertEquals('Invalid object API name.', e.getMessage());
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetFieldsMapWithInvalidObject() {
        Test.startTest();
        try {
            SchemaUtils.getFieldsMap('InvalidObject');
            System.assert(false, 'Should have thrown an exception');
        } catch(IllegalArgumentException e) {
            System.assertEquals('Object "InvalidObject" does not exist.', e.getMessage());
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetFieldsMapWithCustomObject() {
        Test.startTest();
        Map<String, Schema.SObjectField> opportunityFields = SchemaUtils.getFieldsMap('Opportunity');
        Test.stopTest();
        
        System.assertNotEquals(null, opportunityFields);
        System.assert(opportunityFields.containsKey('StageName'));
        System.assert(opportunityFields.containsKey('Amount'));
    }
}