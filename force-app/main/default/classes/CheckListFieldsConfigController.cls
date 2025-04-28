public without sharing class CheckListFieldsConfigController {
    
    /**
     * Retorna uma lista de objetos disponíveis no sistema
     * @return Lista de objetos com suas API Names e Labels
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAvailableObjects() {
        List<Map<String, String>> result = new List<Map<String, String>>();
        
        try {
            Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
            
            for (String objName : globalDescribe.keySet()) {
                Schema.DescribeSObjectResult objDescribe = globalDescribe.get(objName).getDescribe();
                
                // Filtrar apenas objetos que podem ser criados e atualizados
                if (objDescribe.isCreateable() && objDescribe.isUpdateable()) {
                    Map<String, String> objInfo = new Map<String, String>();
                    objInfo.put('value', objName);
                    objInfo.put('label', objDescribe.getLabel());
                    result.add(objInfo);
                }
            }
            
            // Ordenar por label
            result.sort(new ObjectComparator());
            
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao recuperar objetos: ' + e.getMessage());
        }
    }
    
    /**
     * Retorna uma lista de campos do objeto especificado
     * @param objectName Nome da API do objeto
     * @return Lista de campos com suas API Names e Labels
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getObjectFields(String objectName) {
        List<Map<String, String>> result = new List<Map<String, String>>();
        
        try {
            Map<String, Schema.SObjectField> fieldMap = SchemaUtils.getFieldsMap(objectName);
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                
                // Incluir apenas campos acessíveis
                if (fieldDescribe.isAccessible()) {
                    Map<String, String> fieldInfo = new Map<String, String>();
                    fieldInfo.put('value', fieldName);
                    fieldInfo.put('label', fieldDescribe.getLabel());
                    fieldInfo.put('type', String.valueOf(fieldDescribe.getType()));
                    result.add(fieldInfo);
                }
            }
            
            // Ordenar por label
            result.sort(new FieldComparator());
            
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao recuperar campos do objeto ' + objectName + ': ' + e.getMessage());
        }
    }
    
    /**
     * Retorna campos do tipo picklist para um objeto específico
     * @param objectName Nome da API do objeto
     * @return Lista de campos picklist
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPicklistFields(String objectName) {
        List<Map<String, String>> result = new List<Map<String, String>>();
        
        try {
            Map<String, Schema.SObjectField> fieldMap = SchemaUtils.getFieldsMap(objectName);
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                
                // Incluir apenas campos picklist acessíveis
                if (fieldDescribe.isAccessible() && fieldDescribe.getType() == Schema.DisplayType.Picklist) {
                    Map<String, String> fieldInfo = new Map<String, String>();
                    fieldInfo.put('value', fieldName);
                    fieldInfo.put('label', fieldDescribe.getLabel());
                    result.add(fieldInfo);
                }
            }
            
            // Ordenar por label
            result.sort(new FieldComparator());
            
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao recuperar campos picklist do objeto ' + objectName + ': ' + e.getMessage());
        }
    }
    
    /**
     * Salva uma configuração de CheckList Fields
     * @param name Nome da configuração
     * @param targetObject Objeto alvo
     * @param statusField Campo de status
     * @param configJson JSON da configuração
     * @param configId ID da configuração (opcional, para atualização)
     * @return ID do registro de configuração salvo
     */
    @AuraEnabled
    public static String saveConfiguration(String name, String targetObject, String statusField, String configJson, String configId) {
        try {
            System.debug('Parâmetros recebidos:');
            System.debug('name: ' + name);
            System.debug('targetObject: ' + targetObject);
            System.debug('statusField: ' + statusField);
            System.debug('configJson (length): ' + (configJson != null ? configJson.length() : 0));
            System.debug('configJson: ' + configJson);
            System.debug('configId: ' + configId);
            
            // Validar que o JSON não está vazio
            if (String.isBlank(configJson)) {
                throw new AuraHandledException('O JSON de configuração não pode estar vazio');
            }
            
            // Validar que o JSON é válido
            try {
                // Tenta desserializar e serializar novamente para validar
                Object obj = JSON.deserializeUntyped(configJson);
                // Nenhuma exceção significa que o JSON é válido
            } catch (Exception e) {
                throw new AuraHandledException('JSON inválido: ' + e.getMessage());
            }
            
            CheckListFieldsConfig__c config;
            
            if (String.isNotBlank(configId)) {
                // Atualização
                config = [SELECT Id FROM CheckListFieldsConfig__c WHERE Id = :configId LIMIT 1];
            } else {
                // Nova configuração
                config = new CheckListFieldsConfig__c();
            }
            
            config.Name = name;
            config.TargetObject__c = targetObject;
            config.StatusField__c = statusField;
            config.ConfigJSON__c = configJson;
            
            // Salvar o registro
            upsert config;
            
            // Simples verificação de log antes de retornar
            System.debug('Configuração salva com sucesso: ' + config.Id);
            
            return config.Id;
        } catch (Exception e) {
            System.debug('Erro ao salvar configuração: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
            throw new AuraHandledException('Erro ao salvar configuração: ' + e.getMessage());
        }
    }
    
    /**
     * Retorna uma lista de configurações disponíveis
     * @return Lista de configurações
     */
    @AuraEnabled
    public static List<CheckListFieldsConfig__c> getSavedConfigurations() {
        try {
            return [
                SELECT Id, Name, TargetObject__c, StatusField__c, CreatedDate, LastModifiedDate, ConfigJSON__c
                FROM CheckListFieldsConfig__c
                ORDER BY Name
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao recuperar configurações: ' + e.getMessage());
        }
    }
    
    /**
     * Obtém os valores de picklist para um campo específico
     * @param objectName Nome da API do objeto
     * @param fieldName Nome da API do campo
     * @return Lista de valores de picklist
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPicklistValues(String objectName, String fieldName) {
        try {
            List<Map<String, String>> result = new List<Map<String, String>>();
            List<Schema.PicklistEntry> picklistValues = SchemaUtils.getPicklistValues(objectName, fieldName);
            
            for (Schema.PicklistEntry entry : picklistValues) {
                if (entry.isActive()) {
                    Map<String, String> valueInfo = new Map<String, String>();
                    valueInfo.put('value', entry.getValue());
                    valueInfo.put('label', entry.getLabel());
                    result.add(valueInfo);
                }
            }
            
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao obter valores de picklist: ' + e.getMessage());
        }
    }
    
    /**
     * Exclui uma configuração
     * @param configId ID da configuração a ser excluída
     * @return Boolean indicando sucesso
     */
    @AuraEnabled
    public static Boolean deleteConfiguration(String configId) {
        try {
            CheckListFieldsConfig__c config = [SELECT Id FROM CheckListFieldsConfig__c WHERE Id = :configId LIMIT 1];
            delete config;
            return true;
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao excluir configuração: ' + e.getMessage());
        }
    }
    
    /**
     * Retorna o nome do perfil do usuário logado
     */
    @AuraEnabled(cacheable=true)
    public static String getCurrentUserProfileName() {
        return [SELECT Profile.Name FROM User WHERE Id = :UserInfo.getUserId()].Profile.Name;
    }
    
    /**
     * Retorna todos os perfis ativos
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAvailableProfiles() {
        List<Map<String, String>> result = new List<Map<String, String>>();
        for (Profile p : [SELECT Id, Name FROM Profile WHERE UserType = 'Standard' ORDER BY Name]) {
            result.add(new Map<String, String>{'value' => p.Name, 'label' => p.Name});
        }
        return result;
    }
    
    // Classes auxiliares para ordenação
    private class ObjectComparator implements Comparator<Map<String, String>> {
        public Integer compare(Map<String, String> obj1, Map<String, String> obj2) {
            return obj1.get('label').compareTo(obj2.get('label'));
        }
    }
    
    private class FieldComparator implements Comparator<Map<String, String>> {
        public Integer compare(Map<String, String> field1, Map<String, String> field2) {
            return field1.get('label').compareTo(field2.get('label'));
        }
    }
} 