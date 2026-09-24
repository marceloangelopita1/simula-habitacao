# Inspeção — campo de parcela máxima

Data: 23/09/2026. Escopo: investigar a existência da funcionalidade e planejar sua inclusão. Não houve implementação ou publicação.

## Nosso simulador

A aba existente do Chrome foi observada em `https://marceloangelopita1.github.io/simula-habitacao/#simular`. A leitura do HTML publicado confirmou as três opções de `amountMode`: Minha renda · valor máximo, Valor a financiar e Minha entrada.

O `release.json` publicado identificou a revisão `67998fbfcf75f7a9e8a635890bf8fb629930b6cb` e o motor `2026-09-23.piloto.2`, correspondentes ao código local inspecionado. `engine.js` aceita apenas `max`, `fixed` e `entry`; a capacidade mensal parte de renda multiplicada pelo percentual de comprometimento, descontando tarifa e seguro de referência. Não há parâmetro de teto mensal em reais.

## CAIXA

Fonte: aba existente em [Simulador Habitacional CAIXA](https://simuladorhabitacao.caixa.gov.br/simulacao), interface identificada como V. 1.16.0.2. A imagem anexada pelo usuário também foi aberta com sucesso pelo caminho montado do Windows e confirma a localização do campo.

Em **Editar simulação**, a interface mostrou os campos **Quanto quer dar de entrada?** e **Valor máximo da parcela?**, além de prazo e sistema de amortização. A ajuda do teto exibiu “Qual valor cabe no seu bolso?”. Isso confirma a existência e a posição do recurso, mas não explica sua fórmula ou quais encargos abrange.

Estado inicial observado na aba oficial, antes de qualquer edição:

| Campo | Valor exibido |
| --- | --- |
| Modalidade | Programa Minha Casa, Minha Vida — Recursos FGTS |
| Imóvel | R$ 200.000,00 |
| Entrada | R$ 40.000,00 |
| Financiamento | R$ 160.000,00 |
| Sistema exibido | SAC / TR |
| Prazo | 420 meses |
| Quota exibida | 80% |
| Juros nominais / efetivos | 7,66% / 7,93% a.a. |
| Primeira / última parcela — básico | R$ 1.464,52 / R$ 408,38 |
| Primeira parcela — Mais | R$ 1.477,31 |
| Campo parcela máxima ao abrir | Vazio |

Uma tentativa pela integração preencheu visualmente R$ 1.200,00, mantendo a entrada em R$ 40.000,00. Após acionar o recálculo, o resultado continuou igual; ao reabrir, o campo de teto estava vazio. O foco reportado pela acessibilidade permaneceu na barra de endereço mesmo após clique no campo. Não foi possível distinguir, nesta inspeção, atualização incompleta do campo mascarado, precedência da entrada ou outro comportamento do aplicativo. **Esse ensaio é inconclusivo e não deve virar fixture financeira nem sustentar uma regra de precedência.**

Não foram verificados os dados completos do comprador, a fórmula de teto, os componentes incluídos ou sua aplicação às parcelas futuras. Esses pontos estão na primeira etapa do plano. Nenhum CPF, telefone ou nascimento foi copiado para este registro.

## Estado ao encerrar

A edição da CAIXA foi cancelada e os valores do resultado inicial acima foram reconferidos. A aba do Simula ficou ativa, com formulário vazio. A ponte MCP foi encerrada, preservando as duas abas do Chrome. A recuperação WSL/Windows seguiu `docs/browser.md`; nenhuma configuração de segurança foi alterada.

Plano associado: [inclusão de parcela máxima](../docs/plano-parcela-maxima-2026-09-23.md).

## Retomada durante a implementação

A nova inspeção conferiu os parâmetros da aba existente: renda de R$ 7.000,00, imóvel residencial usado em Ribeirão Preto/SP, FGTS indicado como Sim e composição familiar indicada como compra com outra pessoa. O nascimento efetivo foi observado para conferir a faixa do seguro, sem persistir o identificador pessoal. Não houve coleta de um novo cronograma oficial nem criação de fixture a partir desses dados.

O JavaScript público da CAIXA esclareceu um ponto que era ambíguo na inspeção inicial:

- O formulário reinicializa `parcelaMax` com `null` quando a edição é aberta. Portanto, o teto vazio ao reabrir é comportamento programado e, sozinho, não indica falha de envio.
- O valor é passado ao parâmetro `prestacaoMaximaDesejada` do enquadramento, separado da entrada e dos dados de renda. Isso sustenta um campo próprio no nosso simulador, sem simular renda menor.
- A fórmula financeira e a abrangência temporal do teto não estão demonstradas por esse trecho do cliente. Não foram inferidas a partir do nome do parâmetro.

Fonte primária: [bundle público 466.e4315d2b93d5d508.js](https://simuladorhabitacao.caixa.gov.br/466.e4315d2b93d5d508.js), referenciado pelo runtime público `runtime.685e9f8037fa3e17.js`. SHA-256 do bundle lido: `244fa40849b4896d339bf282226a5d891a5d3fe5df43212700c26becf47e6248`. Foram lidos apenas arquivos públicos, sem executar endpoints de simulação por fora da interface, copiar sessão ou alterar autenticação.

As tentativas posteriores de digitação via `sky.type_text`, após clique e nova captura, foram interrompidas pela integração com `user input was detected in this window; call get_window_state before continuing`. O estado foi atualizado e a tentativa foi repetida de forma limitada, inclusive com captura apenas visual para evitar ambiguidade do foco acessível. O teto permaneceu vazio; não se atribui o bloqueio ao site da CAIXA nem se declara um resultado numérico oficial.

A edição foi cancelada. Imóvel de R$ 200.000,00, entrada de R$ 40.000,00, principal de R$ 160.000,00, SAC e primeiras parcelas de R$ 1.464,52/R$ 1.477,31 foram reconferidos. Ao final desta retomada, a aba oficial ficou ativa, com o resumo de dados expandido, e a ponte MCP foi encerrada. A comparação dos novos tetos em SAC, PRICE, SBPE e MCMV com subsídio permanece pendente; os testes locais não a substituem.
