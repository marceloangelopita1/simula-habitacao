# Plano — simular a partir de uma parcela máxima

Status: implementação autorizada e realizada em 23/09/2026, motor `2026-09-23.piloto.3`. Validação local concluída e revisão independente aprovada. A comparação numérica específica do novo teto com a CAIXA continua pendente por interrupção da digitação na integração Windows. O contrato inicial abaixo foi implementado como estimativa explícita, sem alegação de paridade oficial do novo modo.

## Diagnóstico e decisão de interface

O site publicado e o código local na revisão `67998fb` (`2026-09-23.piloto.2`) oferecem três opções em **Calcular a partir de**: renda, valor a financiar e entrada. Não há limite de parcela em reais. O ajuste **Limite de comprometimento**, em Mais opções, recebe uma porcentagem da renda; não substitui esse fluxo de uso.

Adicionar uma quarta opção, **Parcela máxima**, nesse mesmo dropdown. Ela responde à pergunta “quanto posso financiar com uma parcela de até R$ X?” e mantém o padrão de mostrar somente o campo correspondente ao modo escolhido.

| Elemento | Proposta |
| --- | --- |
| Opção em Calcular a partir de | Parcela máxima |
| Campo exibido ao selecionar | Valor máximo da parcela · R$ |
| Exemplo de preenchimento | 1.604,28 |
| Ajuda | Informe o limite mensal definido pelo banco ou o valor que deseja pagar. |
| Esclarecimento junto ao campo | Limite usado no cálculo inicial, com seguro e tarifa. Parcelas futuras podem variar. |
| Resultado principal | Financiamento máximo para a parcela informada |
| Informação junto à primeira parcela | Limite informado: R$ X · Parcela inicial estimada: R$ Y |

A renda familiar permanece obrigatória e real: continua determinando enquadramento, juros, subsídio e capacidade. Não simular uma renda menor para reproduzir o teto. Prazo e SAC/PRICE continuam selecionáveis; este modo calcula o financiamento e a entrada necessária, sem buscar automaticamente outro prazo ou sistema.

## Contrato proposto para o cálculo

O teto será uma restrição adicional à capacidade por renda, à quota e à composição de recursos. Um teto alto não aumentará a capacidade já estimada pelo motor. Um teto menor reduzirá o financiamento e aumentará a entrada própria necessária.

Para esta primeira versão, a proposta é limitar o encargo **inicial**, incluindo amortização, juros, MIP, DFI, tarifa mensal e adicionais do seguro selecionado. Isso precisa ficar explícito na interface: não é garantia de que todas as parcelas futuras respeitarão o mesmo valor. Os reenquadramentos do seguro e a TR podem alterar os encargos. Mostrar a maior parcela do cronograma projetado e um aviso próximo ao resultado quando superar o teto; a projeção continua sem TR futura.

Esse contrato é uma decisão proposta para o produto. A inspeção confirmou o campo oficial, mas não comprovou sua fórmula nem sua abrangência temporal. A [evidência da inspeção](../validation/parcela-maxima-inspecao-2026-09-23.md) registra os limites da observação. A comparação controlada abaixo permanece necessária para validar a compatibilidade com a CAIXA. Diante das interrupções da integração registradas na implementação, foi entregue o contrato local explícito de limite inicial; sua equivalência ao teto oficial não foi presumida.

Regras de interação:

- O teto atua somente quando **Parcela máxima** estiver selecionada. Valores preservados em campos ocultos de outros modos não interferem no cálculo.
- Entrada própria e principal são resultados nesse modo. Combinar entrada fixa com teto de parcela fica fora desta primeira versão; isso exigiria definir como apresentar a incompatibilidade entre as duas restrições.
- Teto vazio, zero, negativo ou inválido gera erro no campo. Um teto que não comporte financiamento positivo, ou resulte em valor inferior ao mínimo da modalidade, gera explicação específica.
- Um teto acima do limite por renda continua válido como preferência; o resultado deve explicar que renda, quota ou recursos disponíveis limitaram o financiamento antes dele.
- Alterar o teto invalida o resultado atual e a comparação, como já ocorre com os outros campos. Limpar dados e carregar exemplos restauram o comportamento padrão.
- Usar “compatível com o limite informado” para o resultado do teto. A simulação não determina aprovação de crédito nem valida todas as condições de uma aprovação condicional.

## Etapas de execução

### 1. Confirmar o comportamento oficial

A localização do campo e o envio de um parâmetro separado da renda foram confirmados na interface e no JavaScript público da CAIXA. O código também confirmou que o campo é limpo ao reabrir a edição. Os ensaios numéricos abaixo não foram concluídos: a integração interrompeu repetidamente a digitação com `user input was detected in this window`. Ver o registro da inspeção; esses itens permanecem abertos e não são tratados como testes aprovados.

- [ ] Seguir `docs/browser.md`, registrar os parâmetros efetivos de um perfil reproduzível e repetir um caso SAC e um PRICE com teto inferior, igual e superior à capacidade normal.
- [ ] Conferir o valor monetário efetivamente enviado pela interação: digitar com foco confirmado, sair do campo, reler antes de calcular e aguardar o resultado concluído. A tentativa desta inspeção não serve como referência numérica.
- [ ] Isolar o teto com entrada vazia/zero e comparar com entrada explícita; não presumir qual campo prevalece na CAIXA.
- [ ] Comparar seguro básico e pacote adicional, primeira parcela do resumo, primeira linha do cronograma e um reenquadramento por idade. Determinar se a capacidade usa o seguro de referência já modelado e se o teto se aplica ao encargo inicial.
- [ ] Acrescentar pelo menos um caso SBPE e um MCMV com subsídio para conferir que renda, taxa e subsídio continuam coerentes. Preservar evidência anonimizada em `validation/`, com incertezas separadas de resultados confirmados.

### 2. Ampliar o motor sem alterar os modos existentes

- [x] Em `engine.js`, adicionar `amountMode: 'payment'` e `maxInstallment`, um valor monetário positivo validado somente no novo modo. Normalizar a ausência do campo nos registros antigos.
- [x] Manter a capacidade atual por renda disponível separadamente. No novo modo, usar como orçamento mensal o menor entre `income × commitmentPercent / 100` e `maxInstallment`, sujeito à confirmação da etapa 1.
- [x] Reaproveitar juros, prazo efetivo, seguro de referência, coeficiente de capacidade e convenções decimais atuais. Aplicar quota e limite de recursos depois de obter o principal compatível com o orçamento mensal.
- [x] Recalcular entrada própria, cronograma, custos e CET com o novo principal. Preservar as regras próprias de subsídio e os valores informados de FGTS/aporte; confirmar qualquer interação adicional com evidência oficial.
- [x] Verificar o teto em centavos contra o resumo e a primeira linha efetiva do cronograma. Se arredondamentos ou mudança de faixa do MIP no primeiro vencimento causarem excesso, reduzir o principal por uma busca limitada em centavos. Não aplicar ao teto explícito a tolerância atual de até R$ 1 usada na comparação aproximada de capacidade por renda.
- [x] Retornar metadados explícitos: teto informado, orçamento mensal aplicado, capacidade por renda, capacidade com teto, motivo limitante e compatibilidade com o teto. Preservar a semântica dos campos existentes para os modos atuais; não confundir `capacityApproved` com aprovação bancária ou atendimento do novo teto.
- [x] Retornar também a maior parcela projetada e seu mês para explicar eventual excesso futuro, sem reduzi-la silenciosamente nem prometer teto durante todo o contrato.

### 3. Integrar interface e histórico

- [x] Em `index.html`, incluir a opção e o campo condicional na seção Financiamento, com máscara monetária existente, ajuda acessível e teclado decimal.
- [x] Em `app.js`, atualizar `moneyIds`, `updateConditional`, leitura/restauração de inputs, rótulos de erro e apresentação do resultado. Tratar o novo modo como cálculo de máximo, sem avisos indevidos de principal manual.
- [x] Apresentar teto e motivo limitante no resumo, no contexto de comparação e na impressão. A entrada necessária continua separada de FGTS, subsídio e aportes.
- [x] Preservar modo e teto ao salvar, exportar, importar e reabrir testes. Registros antigos sem o campo devem continuar abrindo; a inclusão é aditiva, sem migração destrutiva do histórico.
- [x] Verificar se `styles.css` precisa de ajuste nos tamanhos de celular; reutilizar os componentes existentes. Atualizar README, explicação do cálculo e versão das regras na entrega da implementação.

### 4. Validar e entregar

- [x] Criar regressões do novo modo em `tests/payment-cap.mjs` e integrá-las a `tests/all.mjs`: SAC/PRICE; teto menor/igual/maior que o limite por renda; quota e recursos limitantes; FGTS/subsídio/aporte; prazo reduzido por idade; seguros; mínimo da modalidade e entradas inválidas.
- [x] Cobrir diferenças de um centavo, primeira linha versus resumo, aniversário no primeiro vencimento e parcelas futuras maiores. Em um caso viável, reduzir o teto não pode aumentar o principal. Teto não limitante deve reproduzir o modo máximo atual, salvo a guarda explícita do primeiro encargo.
- [x] Proteger a invariância de enquadramento, taxa e renda ao mudar somente o teto; comparar subsídio com as regras e referências da etapa 1. Manter todas as regressões atuais passando.
- [x] Testar a interface: alternância dos quatro modos, campo obrigatório apenas quando ativo, teto oculto sem efeito, erros com foco, resultado desatualizado, limpeza, exemplos, histórico antigo/novo, importação/exportação, impressão e larguras de 320/390/768 px.
- [x] Executar `npm test`, testes de interface pertinentes e `npm run build`. Documentar diferenças em relação à CAIXA por cenário, sem ampliar tolerâncias para esconder desvios.

## Critérios de aceite

1. O usuário informa diretamente uma parcela máxima em reais e recebe financiamento e entrada coerentes com esse limite e com as demais restrições.
2. Em resultados compatíveis, o resumo inicial e o primeiro encargo do cronograma não excedem o teto nem por R$ 0,01. Casos inviáveis recebem uma explicação acionável.
3. A interface informa que o teto é inicial e evidencia eventual parcela projetada posterior acima dele.
4. Renda real, taxas, subsídio e demais condições não são adulterados para forçar o resultado.
5. Os três modos existentes e os registros históricos continuam funcionando.
6. A entrega distingue o que foi comparado com a CAIXA do que permanece hipótese. A existência do campo oficial, isoladamente, não é validação do novo algoritmo.

## Resultado da execução

Implementação local concluída: 54 testes do novo modo e 42 verificações de interface passaram; `npm test` e `npm run build` aprovados. A [revisão independente](../validation/revisao-independente-parcela-maxima-2026-09-23.md) aprovou o contrato local de teto inicial, com cálculos próprios e casos adversariais, sem bloqueadores. Os ensaios numéricos oficiais da etapa 1 permanecem pendentes e não entram nessa aprovação. A entrega não foi publicada.
