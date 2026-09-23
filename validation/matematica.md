# Validação matemática independente do piloto local

> Implementação de 23/09/2026: os achados A1–A5 foram tratados nas [correções da matriz](correcoes-matriz-2026-09-23.md), com [novo OK independente](revisao-independente-2026-09-23.md). Os pareceres e números abaixo permanecem como histórico de suas respectivas versões.

> Atualização de escopo em 22/09/2026: a [comparação ampliada de 30 cenários](comparacao-matriz-2026-09-22.md) encontrou diferenças materiais de seguro/capacidade na Classe Média, subsídio mínimo, composição do CET e CESH dos pacotes adicionais. O parecer abaixo é histórico e limitado aos casos então capturados; não constitui aprovação desses novos perfis. Código e testes não foram alterados nessa análise.

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

O CESH foi validado nos cronogramas então capturados como valor presente dos prêmios, descontados a 0,8% ao mês com expoente proporcional aos dias/365, dividido pelo saldo de referência. Ele não é taxa anual nem deve ser somado ao CET. A exclusão de cobertura adicional era uma hipótese da implementação: a [comparação de 22/09/2026, achado A4](comparacao-matriz-2026-09-22.md#a4--p1-cesh-invariável-ao-mudar-o-seguro-contradiz-os-pacotes-oficiais) mostrou que a CAIXA altera o CESH ao selecionar Especial/Ampliado. Não considerar o teste interno de exclusão como validação empírica desses pacotes.

As tabelas de MIP reproduzem os produtos e a idade inicial de 38 anos observados. Aplicá-las a outras idades de entrada continua sendo estimativa: a apólice pode usar uma matriz que depende simultaneamente da idade de contratação e da idade atingida. O teste de dois participantes valida a ponderação implementada; não homologa taxas de seguro nem propostas reais com dois participantes. Projeções de adicionais Mais/Ampliado como valor mensal constante permanecem hipóteses para o prazo completo. A análise ampliada de 22/09 leu trechos dos cronogramas e encontrou DFI/DFC 0,03 e 0,17 acima da projeção no imóvel de 780 mil (achado A5).

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

## Atualização SBPE — 22/09/2026

Esta conferência posterior, feita durante a implementação, não amplia o parecer independente acima. Referência: [capturas anônimas da CAIXA](caixa-sbpe-2026-09-22.json); reprodução: `node tests/sbpe.mjs` ou `npm test`. Motor: `2026-09-22.piloto.4`.

**Hipótese aprovada no escopo observado:** a oferta “SBPE (TR): Imóvel vinculado a Empreendimento Financiado na CAIXA — Taxa Balcão” usa parâmetros comerciais diferentes do SBPE comum. A seleção anterior do piloto não distinguia essas ofertas; a caixa “empreendimento vinculado” apenas dispensava avaliação no MCMV. Agora `sbpeVariant` diferencia as modalidades e aparece no formulário e no resultado; registros antigos continuam como SBPE comum.

Regras incorporadas para empreendimento CAIXA:

- Cota de 90% no SAC e 80% no PRICE; comprometimento padrão de 30% e 25%, respectivamente. A hipótese inicial de 30% também no PRICE foi refutada em dois perfis.
- Adicional de referência da capacidade: `valor de compra × 0,00006396` (Especial), em vez de `× 0,00015878` (Ampliado) do perfil comum. Continua sendo usado o maior entre a referência e o adicional selecionado. Essa reserva não é cobrada no cronograma do seguro básico.
- Mantidos DFI e adicional somados antes de arredondar a centavos, coeficiente financeiro + MIP truncado em oito casas e principal truncado em centavos. Exemplo original: `(6.300 − 25 − 101,37) / 0,01163986`, truncado, resulta em **R$ 530.386,96**.
- Avaliação padrão zero no fluxo do CET: essa hipótese reproduziu os três CETs consultados (12,23%, 12,23% e 17,81%). É uma inferência do fluxo observado, não prova de isenção contratual universal; tarifa informada manualmente prevalece.
- MIP SBPE, por idade atingida no vencimento: 66–70 anos **0,3259%**, 71–75 **0,4894%**, 76 até o limite de 80 anos e seis meses **0,5312%** ao mês sobre o saldo após amortização. MIP/DFI continuam zerados na última parcela. A faixa de 71 anos corrigiu 31 parcelas do caso original, antes subestimadas em R$ 1.024,03 no total.

Testes no navegador: imóvel novo em Ribeirão Preto/SP, renda R$ 21 mil, um comprador, balcão e seguro básico; data-base 22/09/2026. Nascimentos sintéticos preservam as transições mensais; CPF/telefone não foram copiados. A cada troca SAC/PRICE, a entrada foi zerada para recalcular o máximo.

| Oferta / idade / imóvel / prazo aplicado | Financiamento CAIXA | Primeira / última do resumo | Resultado |
|---|---:|---:|---|
| Empreendimento, 38 anos, R$ 780 mil, SAC 420 | R$ 530.386,96 | R$ 6.250,11 / R$ 1.299,33 | Exato; 420 linhas exatas |
| Empreendimento, 38 anos, R$ 780 mil, SAC 360 | R$ 512.900,97 | R$ 6.250,11 / R$ 1.462,69 | Exato |
| Empreendimento, 38 anos, R$ 780 mil, PRICE 360 | R$ 532.531,01 | R$ 5.200,11 / R$ 5.066,62 | Exato |
| Empreendimento, 38 anos, R$ 400 mil, SAC 420 | R$ 360.000,00 | R$ 4.241,75 / R$ 889,94 | Exato; limitado pela cota de 90% |
| Empreendimento, 69 anos, R$ 400 mil, SAC 130 | R$ 310.278,80 | R$ 6.274,42 / R$ 2.433,49 | Exato; 130 linhas exatas |
| Empreendimento, 69 anos, R$ 400 mil, PRICE 130 | R$ 315.183,58 | R$ 5.224,42 / R$ 4.170,84 | Exato; previsão conferida em nova simulação |
| Comum, 38 anos, R$ 780 mil, SAC 420 | R$ 524.033,79 | R$ 6.176,15 / R$ 1.284,05 | Controle: resíduos descritos abaixo |

As 550 linhas oficiais foram confrontadas em data, prestação sem seguros, MIP, DFI, seguros, administração, encargo e saldo. Os três CETs/CESHs conferiram nas duas casas exibidas. Resumos Especial também foram confrontados nos casos preservados; isso não homologa seus cronogramas. O total chamado “Soma das parcelas” pela CAIXA é amortização + juros, sem seguros e administração.

Limites preservados: no SBPE comum, o máximo continua R$ 0,86 abaixo da CAIXA e a última do resumo R$ 0,01 acima; fixando o principal oficial, a primeira também fica R$ 0,01 acima. No SAC de R$ 400 mil, o total amortização + juros é R$ 1.049.972,90 no motor versus R$ 1.049.971,70 na CAIXA (+R$ 1,20). A diferença é compatível com o ajuste final de saldo, mas esse cronograma não foi capturado integralmente e sua regra não foi alterada. As fixtures mantêm os valores oficiais e os testes identificam explicitamente esses resíduos, sem tratá-los como igualdade.

A reprodução foi aprovada para os seis casos de empreendimento acima e seus campos conferidos, com a ressalva do total de R$ 400 mil. A interface foi conferida com `tests/sbpe-ui.mjs` (Playwright em ambiente local): seleção, troca SAC/PRICE, histórico e larguras de 320, 390 e 768 px. As fórmulas não comprovam o algoritmo interno completo da CAIXA. PRICE do SBPE comum, outros relacionamentos, idades iniciais, dois compradores, usados, SFI e outras apólices não foram homologados por esta rodada. O formulário preserva ajustes manuais de tarifa e comprometimento; escolher a modalidade comercial correta e a mesma data-base continua necessário para comparar.
