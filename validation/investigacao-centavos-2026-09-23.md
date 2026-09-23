# Comparação com a CAIXA — investigação de centavos

Observação do Chrome existente em 23/09/2026. Oito cenários distintos observados nesta investigação; 420 linhas do cronograma original lidas em 17 páginas da interface. Treze referências SAC anteriores do projeto usadas como verificação complementar. Nenhum arquivo do projeto alterado.

Fontes: [simulador oficial da CAIXA](https://simuladorhabitacao.caixa.gov.br/simulacao) e [nosso simulador publicado](https://marceloangelopita1.github.io/simula-habitacao/#simular). A investigação usou a interface real e o motor local, versão `2026-09-23.piloto.1`; não houve acesso ao código interno da CAIXA.

## Resultado principal

As diferenças têm duas origens separáveis: precisão da reserva de seguro no cálculo do máximo financiável e arredondamentos intermediários dos resumos SAC. No cenário original, basta igualar o principal para eliminar todas as diferenças monetárias do cronograma e dos resumos. Em outros cenários, igualar o principal ainda deixa diferenças de um centavo nos resumos, demonstrando a segunda causa.

A regra candidata dos resumos acertou primeira e última parcela de todos os 21 casos avaliados. Dois desses casos foram previstos antes de consultar o resultado na CAIXA. Isso é evidência forte de equivalência numérica nos casos testados, mas não revela de forma única a implementação interna do banco.

## Parâmetros e diferenças iniciais

Renda R$ 15.200, imóvel residencial usado de R$ 1.500.000 em Ribeirão Preto/SP, comprador de 38 anos, FGTS inferior a três anos, composição com cônjuge/dependentes, SBPE comum/TR, taxa balcão, SAC, 420 meses, quota de 80%, seguro básico CAIXA Residencial Habitacional. Sem recursos de FGTS, aporte ou subsídio de entrada. Campos manuais de taxa, tarifa e quota em branco. Na CAIXA a resposta sobre outra pessoa comprando junto estava marcada como sim; não havia uma composição de seguro por dois percentuais de renda.

| Indicador | Nosso site | CAIXA | Nosso − CAIXA |
|---|---:|---:|---:|
| Financiamento máximo | R$ 360.642,65 | R$ 360.643,51 | −R$ 0,86 |
| Entrada | R$ 1.139.357,35 | R$ 1.139.356,49 | +R$ 0,86 |
| Primeira parcela do resumo | R$ 4.321,83 | R$ 4.321,84 | −R$ 0,01 |
| Última parcela do resumo | R$ 891,49 | R$ 891,50 | −R$ 0,01 |
| Juros nominais exibidos | 10,93% a.a. | 10,92% a.a. | +0,01 ponto percentual |
| Juros efetivos exibidos | 11,49% a.a. | 11,49% a.a. | Igual |
| CET exibido | 12,61% | 12,61% | Igual |
| CESH exibido | 6,9951% | 7,00% | Igual após arredondar para 2 casas |

Havia uma diferença real de entrada: nosso site usava data-base 14/09/2026 e a CAIXA 23/09/2026. Ela muda os vencimentos. Neste perfil, não altera os reenquadramentos etários do MIP nem explica os centavos observados. As comparações linha a linha foram normalizadas para 23/09/2026. Para os arquivos, usou-se nascimento sintético `1988-02-01`, que preserva os reenquadramentos mensais relevantes; identificadores pessoais não foram registrados.

A taxa nominal de 10,9259% a.a. usada pelo motor reproduz o cronograma oficial. A exibição 10,92% é compatível com truncamento, enquanto nosso site arredonda para 10,93%. Usar 10,92% como taxa de cálculo perderia a precisão que já reproduz as parcelas.

## Contraprova do cronograma

Com principal de R$ 360.643,51 e data-base igualada, o motor atual coincide com as 420 linhas oficiais em vencimento, prestação financeira (amortização + juros), MIP, DFI, soma dos seguros, tarifa, encargo total e saldo devedor. Nenhuma diferença encontrada.

Com os principais originais diferentes, a amortização mensal muda de R$ 858,67 para R$ 858,68. Esse centavo se acumula no saldo e interfere nos seguros e na liquidação final. Por isso a diferença inicial de R$ 0,86 no financiamento pode produzir diferenças maiores em parcelas futuras.

| Indicador do cronograma | Motor com principal original | CAIXA |
|---|---:|---:|
| Primeiro encargo total | R$ 4.321,70 | R$ 4.321,72 |
| Último encargo total | R$ 892,75 | R$ 891,48 |
| Soma das prestações financeiras | R$ 1.051.847,32 | R$ 1.051.845,56 |
| Soma de MIP | R$ 64.443,11 | R$ 64.441,54 |
| Soma de DFI | R$ 41.481,00 | R$ 41.481,00 |
| Soma de tarifas mensais | R$ 10.500,00 | R$ 10.500,00 |
| Total com seguros e tarifas | R$ 1.168.271,43 | R$ 1.168.268,10 |

A “Soma das parcelas” oficial de R$ 1.051.845,56 corresponde à prestação financeira, sem seguros e tarifa. Não deve ser comparada diretamente com o total completo.

Na CAIXA, a primeira parcela do resumo é R$ 4.321,84, enquanto a primeira linha da tabela é R$ 4.321,72. O resumo considera o seguro sobre o principal inicial; a tabela usa o saldo após amortização. Na última parcela, o resumo mostra R$ 891,50 e a tabela R$ 891,48. São cálculos distintos. O cronograma possui uma convenção de liquidação SAC já reproduzida pelo motor; não se deve presumir que o valor resumido seja uma simples leitura da última linha.

## Por que R$ 0,01 vira R$ 0,86 no financiamento

Para este perfil, a fórmula atual de capacidade usa:

```text
limite mensal = 30% × 15.200 = 4.560
c = truncar8(1/420 + 10,9259/1200 + 0,000154)
  = 0,01163986
reserva = arredondar2(valor do imóvel × (0,000066 + k))
financiamento = truncar2((4.560 − 25 − reserva) / c)
```

O código usa `k = 0,00015878` para o adicional de referência. Para o imóvel original, isso produz reserva de R$ 337,17 e financiamento de R$ 360.642,65. O resultado oficial é reproduzido com reserva de R$ 337,16, gerando R$ 360.643,51. Um centavo dividido por `0,01163986` vale aproximadamente R$ 0,8591 de principal.

A reserva de referência participa da capacidade mesmo com o seguro básico selecionado. Ela não é uma cobrança extra mensal do cronograma básico.

| Imóvel | Reserva no motor | Reserva que reproduz o máximo oficial | Máximo oficial, 420 meses |
|---|---:|---:|---:|
| R$ 1.400.000 | R$ 314,69 | R$ 314,68 | R$ 362.574,80 |
| R$ 1.500.000 | R$ 337,17 | R$ 337,16 | R$ 360.643,51 |
| R$ 1.600.000 | R$ 359,65 | R$ 359,64 | R$ 358.712,21 |
| R$ 1.005.000 | R$ 225,90 | R$ 225,90 | R$ 370.202,04 |

O teste de R$ 1.005.000 descarta “sempre retirar um centavo da reserva”: essa hipótese previa R$ 370.202,90, mas a CAIXA retornou R$ 370.202,04. Truncar a reserva com o coeficiente atual também não explica os três primeiros imóveis. Trocar o coeficiente simplesmente para `0,00015877` falha no imóvel de R$ 1.600.000.

Um coeficiente efetivo menor, como `0,000158774`, seguido de arredondamento para centavos, reproduz todos os cinco cenários de máximo desta investigação (incluindo 419 meses). Considerando também os valores observados do pacote ampliado, o intervalo compatível, sob esse modelo, fica aproximadamente entre `0,000158771875` e `0,00015877475`; a inclusão exata dos extremos depende do desempate. Isso favorece uma diferença de precisão do coeficiente, mas não determina seu valor exato nem exclui uma fórmula interna equivalente.

## Hipótese para primeira e última parcela do resumo SAC

Definições: `F` é o principal, `n` o prazo, `i` a taxa nominal anual dividida por 1.200, `T` a tarifa mensal. `truncarN` remove casas após N; `arredondarN` arredonda ao mais próximo; `par2` arredonda empates para o centavo par.

```text
coeficiente = truncar8(1/n + i)
B = truncar2(arredondar3(F × coeficiente))
S = par2(MIP inicial não arredondado + DFI não arredondado)
primeira do resumo = B + S + T
J = truncar2(F × i)
última do resumo = arredondar2(B − J + J/n + T)
```

Essa regra candidata reproduz os 21 pares primeira/última avaliados: oito cenários desta sessão e treze casos SAC dos arquivos anteriores `caixa-arredondamento-2026-09-22.json` e `caixa-sbpe-2026-09-22.json`. O teste inclui referências MCMV e SBPE. Não foi verificada como regra universal para PRICE, outras apólices, idades ou modalidades.

O arredondamento intermediário para três casas pode representar uma operação interna equivalente; a interface não expõe essa etapa. Os casos ainda não distinguem desempate comum de desempate para par nessa terceira casa. O desempate para par dos seguros tem evidência anterior em empates de R$ 48,365 e R$ 48,455.

O código atual trunca diretamente a prestação financeira sem antes limitar o coeficiente a oito casas; calcula o último resumo com a amortização arredondada vezes `1+i`. Isso explica por que alguns valores coincidem e outros diferem em um centavo.

Um caso decisivo foi `F = R$ 350.348,97`: truncar apenas a taxa mensal para oito casas previa R$ 4.208,61 e R$ 866,76; a CAIXA mostrou R$ 4.208,60 e R$ 866,75. Essa hipótese foi descartada. Truncar o coeficiente combinado sem a etapa intermediária também falha, por exemplo, em `F = R$ 350.100,00`.

As duas últimas contraprovas foram previstas antes da consulta:

- Imóvel R$ 1.005.000 e 420 meses: máximo R$ 370.202,04, primeira R$ 4.400,42, última R$ 914,46 — coincidência completa.
- Mesmo imóvel e 419 meses: máximo R$ 370.021,16, primeira R$ 4.400,42, última R$ 916,14 — coincidência completa.

## Cenários observados nesta investigação

Valores em reais. As duas últimas colunas mostram o motor atual usando exatamente o principal oficial, isolando diferenças do resumo. A regra candidata acerta todas as primeiras e últimas oficiais desta tabela.

| Imóvel | Meses | Cálculo | Financiamento CAIXA | Primeira CAIXA | Última CAIXA | Primeira motor, mesmo principal | Última motor, mesmo principal |
|---:|---:|---|---:|---:|---:|---:|---:|
| 1.500.000,00 | 420 | Máximo | 360.643,51 | 4.321,84 | 891,50 | 4.321,84 | 891,50 |
| 1.400.000,00 | 420 | Máximo | 362.574,80 | 4.337,72 | 896,13 | 4.337,72 | 896,13 |
| 1.600.000,00 | 420 | Máximo | 358.712,21 | 4.305,95 | 886,85 | 4.305,96 | 886,86 |
| 1.600.000,00 | 420 | Fixo | 352.800,00 | 4.237,14 | 872,65 | 4.237,14 | 872,65 |
| 1.600.000,00 | 420 | Fixo | 350.100,00 | 4.205,72 | 866,16 | 4.205,72 | 866,16 |
| 1.600.000,00 | 420 | Fixo | 350.348,97 | 4.208,60 | 866,75 | 4.208,61 | 866,75 |
| 1.005.000,00 | 420 | Máximo | 370.202,04 | 4.400,42 | 914,46 | 4.400,43 | 914,46 |
| 1.005.000,00 | 419 | Máximo | 370.021,16 | 4.400,42 | 916,14 | 4.400,42 | 916,15 |

## Conclusões e limites

1. Confirmado: os parâmetros não eram literalmente todos iguais, pois a data-base diferia. Essa diferença foi controlada e não explica os centavos deste perfil.
2. Confirmado: o cronograma atual já reproduz todas as 420 linhas oficiais ao igualar o principal.
3. Confirmado: a diferença inicial de R$ 0,86 é reproduzida por um centavo na reserva de capacidade, e as hipóteses de ajuste fixo foram contrariadas por novos testes.
4. Fortemente sustentado: a reserva usa um coeficiente com precisão efetiva diferente de `0,00015878`; o valor exato continua indeterminado dentro do intervalo indicado.
5. Fortemente sustentado: o resumo SAC aplica operações intermediárias equivalentes à fórmula candidata apresentada; os 21 casos e duas previsões independentes fecharam.
6. Sem evidência de erro genérico de ponto flutuante do JavaScript: o motor já usa aritmética decimal. As diferenças observadas seguem a ordem e a precisão das operações e dos coeficientes.

Uma futura correção deveria tratar separadamente coeficiente de capacidade, fórmulas dos resumos e formatação da taxa nominal. Os 420 registros oficiais devem proteger o cronograma contra regressão. Essa implementação não foi feita, conforme solicitado.

Os parâmetros originais foram restaurados na aba da CAIXA (imóvel R$ 1.500.000, SAC 420, máximo R$ 360.643,51). Nossa aba manteve seus inputs originais. As opções expandidas durante a inspeção foram recolhidas. O repositório permaneceu sem alterações.

## Evidências e reprodução

- [Oito cenários oficiais](caixa-centavos-2026-09-23.json)
- [420 parcelas oficiais](caixa-centavos-parcelas-2026-09-23.json)

O script importa o motor e as referências existentes do projeto e grava apenas `verificacao.json` ao lado deste relatório. Nas condições desta investigação, terminou com `summaryCases = 21`, `allSummaryMatches = true`, `scheduleRows = 420` e `equalPrincipalDifferences = 0`. Não foram executados build ou suíte de regressão do produto, pois não houve alteração de implementação.
