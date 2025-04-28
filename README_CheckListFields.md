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

# CheckListFields - Guia de Configuração e Uso

## Visão Geral
Este projeto permite criar e aplicar regras de checklist de campos e listas relacionadas em objetos do Salesforce, com validação condicional por etapa/status e por perfil de usuário.

## Componentes
- **CheckListFieldsConfigBuilder**: Lightning Web Component para criar e gerenciar configurações de checklist.
- **CheckListFieldsToStatus**: Lightning Web Component para aplicar e exibir as validações configuradas em registros.

---

## 1. Configurando o Builder (CheckListFieldsConfigBuilder)

### Como acessar
Adicione o componente `CheckListFieldsConfigBuilder` a uma página Lightning App ou Lightning Record Page.

### Passos para criar uma configuração
1. **Selecionar Objeto**
   - Escolha o objeto que será validado.
   - Escolha o campo de status (picklist) que define as etapas do processo.
   - Dê um nome para a configuração.
2. **Configurar Etapas**
   - Para cada valor do campo de status, selecione os campos obrigatórios.
   - Opcional: selecione os perfis de usuário para os quais a validação será aplicada nesta etapa.
3. **Listas Relacionadas**
   - Clique em "Adicionar Lista Relacionada".
   - Selecione o objeto relacionado, campo de relacionamento, rótulo e as etapas/status em que a lista será validada.
   - **Perfis**: selecione os perfis de usuário para os quais a validação da lista relacionada será aplicada. Se nenhum perfil for selecionado, a validação será feita para todos os usuários.
   - Salve a lista relacionada.
4. **Revisar e Salvar**
   - Revise o JSON de configuração gerado.
   - Clique em "Salvar Configuração".

### Observações
- Você pode editar ou excluir configurações existentes na lista "Configurações Salvas".
- O JSON gerado inclui as etapas, campos, perfis e listas relacionadas configuradas.

---

## 2. Aplicando a Validação (CheckListFieldsToStatus)

### Como acessar
Adicione o componente `CheckListFieldsToStatus` a uma página de registro do objeto alvo.

### Parâmetros obrigatórios
- **Campo de Status**: informe o nome do campo de status do objeto (ex: `Status`).
- **ID da Configuração**: informe o Id do registro de configuração criado pelo Builder.

### Funcionamento
- O componente lê a configuração salva e valida os campos e listas relacionadas conforme a etapa/status do registro.
- **Validação por Perfil**:
  - Se a etapa ou lista relacionada tiver perfis definidos, a validação só será feita para usuários desses perfis.
  - Se não houver perfis definidos, a validação é feita para todos os usuários.
- O resultado da validação é exibido em tempo real na tela do registro.

---

## 3. Exemplo de JSON de Configuração
```json
{
  "steps": [
    {
      "etapa": "Open - Not Contacted",
      "campos": "address",
      "profileNames": ["Analytics Cloud Integration User"]
    },
    {
      "etapa": "Working - Contacted",
      "campos": "",
      "profileNames": []
    }
  ],
  "relatedLists": [
    {
      "objectApiName": "lead",
      "fieldRelationship": "LeadId",
      "label": "dads",
      "stages": ["Working - Contacted"],
      "profileNames": ["Analytics Cloud Integration User"]
    }
  ]
}
```

---

## 4. Dicas e Boas Práticas
- Sempre defina os perfis para etapas/listas relacionadas que devem ser restritas. Deixe vazio para aplicar a todos.
- Utilize nomes claros para rótulos e listas relacionadas.
- Teste a configuração com diferentes perfis de usuário para garantir o comportamento esperado.

---

## 5. Permissões Necessárias
- Os usuários devem ter permissão de leitura nos objetos e campos configurados.
- Para editar configurações, é necessário acesso ao objeto customizado de configuração.

---

Em caso de dúvidas, consulte o administrador Salesforce ou o desenvolvedor responsável pelo projeto. 