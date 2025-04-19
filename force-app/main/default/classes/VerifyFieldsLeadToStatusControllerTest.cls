@IsTest
private class VerifyFieldsLeadToStatusControllerTest {
    private static Map<String, RecordTypeInfo> recordTypesAccount = Schema.SObjectType.Account.getRecordTypeInfosByName();
    private static Id recTypeIdLoja = recordTypesAccount.get('Loja').getRecordTypeId();

    @IsTest
    public static void verifyFildsFillStageLeadTest() {
        Lead currentLead = VirtualTestData.createLead(
            'TestLead', 
            StringUtils.generateCNPJ(), 
            '5499999999', 
            'ISENTO'
        );
        insert currentLead;

        Map<String, Boolean> mapFields = VerifyFieldsLeadToStatusController.verifyFildsFillStageLead(currentLead.Id, 'FirstName,LegalNumber__c,Phone,StateTaxNumber__c');

        Assert.areEqual(true, mapFields.get('First Name'));
        Assert.areEqual(true, mapFields.get('CNPJ'));
        Assert.areEqual(true, mapFields.get('Phone'));
        Assert.areEqual(true, mapFields.get('Inscrição estadual'));
    }

    @IsTest
    static void verifyFildsFillStageLeadWithNullFieldsTest() {
        Lead emptyLead = VirtualTestData.createLead(
            'Marc',
            '51.026.134/0001-12',
            '54559955559',
            '909.283.713.302'
        );
        insert emptyLead;

        Map<String, Boolean> mapFields = VerifyFieldsLeadToStatusController.verifyFildsFillStageLead(
            emptyLead.Id, 
            'NomeAbreviado__c,Notes__c,ContaCorrente__c,ReceitaPadrao__c'
        );

        Assert.areEqual(false, mapFields.get('Nome Abreviado'));
        Assert.areEqual(false, mapFields.get('Observações'));
        Assert.areEqual(false, mapFields.get('Receita padrão'));
    }

    @IsTest
    static void verifyFildsFillStageLeadInvalidIdTest() {
        try {
            VerifyFieldsLeadToStatusController.verifyFildsFillStageLead(
                'invalidId', 
                'FirstName,LegalNumber__c'
            );
            Assert.fail('Should have thrown an exception');
        } catch (AuraHandledException e) {
            Assert.isTrue(e.getMessage().length() > 0);
        }
    }

    @IsTest
    static void getRelatedRecordsValidTest() {
        Account testAccount = VirtualTestData.createAccount(
            'conta Teste Representante',
            '51.026.134/0001-12',
            '909.283.713.302',
            recTypeIdLoja,
            'DIV1'
        );
        insert testAccount;

        Contact contactRelated = VirtualTestData.createContact(
            'FirstName', 
            'LastName', 
            'Teste@teste.com',
            '51999999999',
            testAccount.Id
        );
        insert contactRelated;

        List<SObject> results = VerifyFieldsLeadToStatusController.getRelatedRecords(
            'Contact',
            'AccountId',
            testAccount.Id
        );

        Assert.areEqual(1, results.size());
    }

    @IsTest
    static void getRelatedRecordsInvalidObjectTest() {
        List<SObject> results = VerifyFieldsLeadToStatusController.getRelatedRecords(
            'InvalidObject',
            'AccountId',
            '001000000000000'
        );

        Assert.areEqual(0, results.size());
    }
}