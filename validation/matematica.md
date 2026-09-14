# Validação matemática independente do piloto local

Data-base: 14/09/2026. Validador: agente independente `/root/validacao_calculos`, que não implementou o motor auditado.

**Parecer: OK para disponibilizar o piloto local à Letícia como ferramenta de estimativa, comparação e registro de diferenças.** A implementação reproduziu as 1.200 linhas dos três cronogramas oficiais disponíveis e passou nos 16 testes adicionais. Não há correção matemática impeditiva pendente no escopo testado. Este parecer não homologa todos os produtos, perfis ou decisões de crédito da CAIXA.

Arquivo auditado: `outputs/site/engine.js`, versão de regras `2026-09-14.piloto.1`. SHA-256 final: `d35d0ddd0eae60701a6e4d27ea68e6cf9cfdb3414db5f8cde53f4773117cf6cd`.

Reconfirmação da versão final: após inclusão das guardas do teto de subsídio manual com redutores e da validação de `fgtsTotalBalance`, este validador reexecutou a suíte sobre o motor acima. Permaneceram aprovadas as 1.200 linhas e os 16 testes adicionais, sem alteração das conclusões matemáticas. O conteúdo normativo dessas guardas integra a revisão do validador normativo.

## Evidência e método

Os testes importam o motor real e confrontam seus resultados com respostas capturadas no simulador completo da CAIXA. As fixtures independentes preservam os valores financeiros das respostas, sem CPF, nome ou data de nascimento real. A data sintética de nascimento utilizada conserva as transições de idade relevantes para os vencimentos observados.

Foram comparados número da parcela, data, amortização, juros, saldo, MIP, DFI, tarifa administrativa e prestação, conforme os campos presentes nas fixtures. Todos os valores monetários conferiram ao centavo; CET e CESH conferiram nas quatro casas decimais exibidas pela CAIXA.

| Cronograma | Linhas | Divergências | CET reproduzido | CESH reproduzido |
|---|---:|---:|---:|---:|
| MCMV SAC, caso 01 | 420 | 0 | 9,0491% | 4,4945% |
| MCMV PRICE, caso 02 | 420 | 0 | 9,0005% | 5,6002% |
| SBPE PRICE com salário, caso 09 | 360 | 0 | 12,1245% | 6,2841% |

O confronto utiliza o principal oficial fixado. A capacidade máxima é avaliada separadamente abaixo, para não confundir precisão do cronograma com precisão do enquadramento.

Os 16 testes adicionais cobrem: fórmula PRICE sem seguros; liquidação de saldo residual no SAC; PRICE com juros zero e centavos indivisíveis; exclusão de cobertura adicional do CESH; DFI calculado sobre o imóvel; ponderação do MIP entre participantes; vencimentos em fevereiro e ano bissexto; aniversário e limite de idade; conversão das taxas SBPE; integração de `simulate` com MCMV; resposta do máximo à mudança de renda; limite pela avaliação e sua base de DFI; prazo de 360 meses no SBPE PRICE; dois subsídios MCMV observados; rejeição de valores e datas inválidos; e rejeição de custos iniciais que esgotam o crédito líquido.

Todos passaram. O teste da avaliação foi corrigido para usar renda dentro do enquadramento MCMV; a recusa anterior do motor estava correta e não representava defeito.

## Comparação dos resumos e do máximo

Nos nove cenários completos úteis, cinco reproduziram primeira prestação, última prestação e subsídio exatamente: 01, 02, 09, 10 e 11. Nos quatro cenários SBPE SAC, 03, 06, 07 e 08, a primeira prestação calculada ficou R$ 0,01 acima do resumo oficial. No caso 03, a última também ficou R$ 0,01 acima; as demais últimas conferiram. Não se deve divulgar que os nove resumos coincidem integralmente ao centavo.

As taxas nominais calculadas a partir das taxas efetivas comerciais, arredondadas a quatro casas, são compatíveis com a implementação: 11,49% efetivos → 10,9259% nominais; 11,29% → 10,7447%; 11,19% → 10,6540%. O cronograma SBPE PRICE comprova a necessidade de precisão interna superior aos 10,65% nominais apresentados no resumo. Para os casos SBPE SAC sem cronograma capturado, a conversão permanece uma aproximação comercial com as pequenas diferenças acima.

| Cenário de máximo | Principal oficial | Principal estimado | Estimado menos oficial |
|---|---:|---:|---:|
| MCMV, renda R$ 6.000, imóvel R$ 350.000 | R$ 193.949,89 | R$ 193.949,77 | −R$ 0,12 |
| MCMV, renda R$ 3.000, imóvel R$ 240.000 | R$ 129.966,62 | R$ 129.966,51 | −R$ 0,11 |
| SBPE, renda R$ 6.000, imóvel R$ 350.000 | R$ 145.734,57 | R$ 145.734,46 | −R$ 0,11 |
| SBPE, renda R$ 10.000, imóvel R$ 500.000 | R$ 245.931,65 | R$ 245.931,46 | −R$ 0,19 |

A estimativa combina comprometimento de renda, quota, valor de avaliação, recursos próprios e encargo de seguro de referência. A presença de seguro de referência mais caro explica por que a prestação da apólice básica pode ficar abaixo de 30% da renda no principal oferecido. Os resultados são compatíveis com essa hipótese, mas não provam a fórmula integral do servidor nem a invariância do seguro usado para limitar capacidade. A faixa de erro observada não é uma garantia para outros casos.

## Convenções preservadas e limites

O resumo e o cronograma oficiais não são idênticos em todos os campos. O piloto conserva as duas apresentações. Exemplos: MCMV SAC apresenta R$ 1.777,61 no resumo e R$ 1.777,55 na primeira linha; SBPE PRICE apresenta última de R$ 2.299,56 no resumo e R$ 2.306,34 na planilha. No PRICE, o ajuste de amortização na última parcela explica a necessidade de distinguir a prestação regular da parcela final calculada.

O SAC observado mantém amortização arredondada constante; no caso 01, sua soma supera o principal em R$ 1,91. O motor reproduz a convenção visível e informa o ajuste. Também liquida o saldo remanescente quando o arredondamento para baixo deixaria uma dívida residual. Essa convenção de exibição não demonstra que o contrato efetivo cobrará uma amortização excedente.

O CET reproduzido usa a convenção mensal que coincide com as respostas capturadas. O cálculo com dias reais/365 também é disponibilizado, pois a Resolução CMN 4.881 define fluxo datado. A diferença não autoriza concluir irregularidade da CAIXA: falta confirmar a formação completa do fluxo e as datas adotadas internamente. A equivalência comprovada é com os três resultados observados. Não há projeção de TR futura.

O CESH foi validado como valor presente dos prêmios obrigatórios, descontados a 0,8% ao mês com expoente proporcional aos dias/365, dividido pelo saldo de referência. Ele não é taxa anual nem deve ser somado ao CET. A cobertura facultativa não entra nesse indicador.

As tabelas de MIP reproduzem os produtos e a idade inicial de 38 anos observados. Aplicá-las a outras idades de entrada continua sendo estimativa: a apólice pode usar uma matriz que depende simultaneamente da idade de contratação e da idade atingida. O teste de dois participantes valida a ponderação implementada; não homologa taxas de seguro nem propostas reais com dois participantes. Projeções de adicionais Mais/Ampliado como valor mensal constante também permanecem hipóteses, sem cronograma oficial de confronto.

Os subsídios de R$ 2.609 e R$ 8.697 conferem nos dois casos de renda R$ 3.000. Eles sustentam a hipótese utilizada para aqueles exemplos, sem provar fator de unidade habitacional universal ou modo geral de arredondamento. Tarifas de avaliação, quotas, renda comprometida, taxas comerciais, limites regionais e produtos sem captura exigem conferência e atualização. O validador normativo independente é responsável pelo parecer de enquadramento; esta aprovação trata da matemática implementada e da reprodução das evidências acima.

## Reprodução da auditoria

Na raiz do projeto:

```sh
node work/site-validation-calculos/run_engine_tests.mjs
node work/site-validation-calculos/compare_summaries.mjs
node work/site-validation-calculos/compare_maximum.mjs
```

Evidências: `test_results.json`, `reference_summary_comparison.json`, `maximum_comparison.json`, `schedule_fixtures.json` e `reference_summaries.json`, todos nesta pasta. A auditoria passou sem necessidade de alterar o motor para forçar valores oficiais.

**Aprovação final expressa: OK no escopo de piloto local estimativo, com as ressalvas e diferenças registradas.** É apropriado usar a ferramenta para reduzir trabalho repetitivo e acumular novos confrontos com o simulador oficial; ainda não é apropriado prometer reprodução universal ou aprovação de financiamento.
