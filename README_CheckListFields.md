# CheckList Fields To Status

Este componente Lightning Web permite a verificação de campos preenchidos em diferentes etapas de um processo, além de verificar registros relacionados. A verificação é baseada no valor do campo de status do registro.

## Nova Configuração JSON

O componente agora aceita um único parâmetro JSON para configurar etapas e registros relacionados, permitindo flexibilidade sem limite de etapas.

### Formato do JSON

```json
{
  "steps": [
    { "etapa": "NomeEtapa1", "campos": "Campo1,Campo2,Campo3" },
    { "etapa": "NomeEtapa2", "campos": "Campo4,Campo5,Campo6" }
  ],
  "relatedLists": [
    {
      "objectApiName": "ObjetoRelacionado",
      "fieldRelationship": "CampoRelacionamento",
      "label": "Nome exibido na UI",
      "stage": "EtapaOndeVerificar"
    }
  ]
}
```

### Elementos da Configuração

1. **steps**: Lista de objetos representando as etapas do processo
   - **etapa**: Valor exato do campo de status que dispara esta verificação
   - **campos**: Lista de campos API separados por vírgula a serem verificados nesta etapa

2. **relatedLists**: Lista de objetos relacionados a serem verificados
   - **objectApiName**: Nome da API do objeto relacionado
   - **fieldRelationship**: Campo de relacionamento no objeto relacionado
   - **label**: Rótulo exibido na interface do usuário
   - **stage**: Valor da etapa em que esta lista relacionada será verificada

## Exemplo de Configuração

```json
{
  "steps": [
    { "etapa": "Qualificacao", "campos": "Phone,Email,Rating" },
    { "etapa": "Proposta", "campos": "Amount,CloseDate,Description" },
    { "etapa": "Negociacao", "campos": "Type,LeadSource" },
    { "etapa": "Fechamento", "campos": "NextStep,Probability" }
  ],
  "relatedLists": [
    {
      "objectApiName": "Contact",
      "fieldRelationship": "AccountId",
      "label": "Contatos",
      "stage": "Proposta"
    },
    {
      "objectApiName": "Opportunity",
      "fieldRelationship": "AccountId",
      "label": "Oportunidades",
      "stage": "Negociacao"
    }
  ]
}
```

## Como Usar

1. Adicione o componente `checkListFieldsToStatus` a uma página de registro
2. Configure o parâmetro `statusField` com o nome da API do campo de status
3. Configure o parâmetro `checklistConfig` com o JSON de configuração conforme o formato acima
4. Adicione o componente `patchCheckListFieldsToStatus` à mesma página de registro para permitir a alteração do status, configurando o campo `fieldStatusObject` com o mesmo campo de status

## Funcionamento

O componente verifica:
1. Campos específicos preenchidos para cada etapa
2. Existência de registros relacionados em etapas específicas
3. Exibe um checklist visual dos itens verificados
4. Integra-se com o componente de path para atualização do status

Os usuários só poderão avançar para a próxima etapa se todos os campos e registros relacionados estiverem preenchidos. 