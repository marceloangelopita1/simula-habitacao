# Conciliação de arredondamentos — 22/09/2026

Regras `2026-09-22.piloto.3`. Referências lidas na interface do [simulador completo da CAIXA](https://simuladorhabitacao.caixa.gov.br/simulacao), na sessão aberta do Chrome. Dados e resultados anonimizados: [fixture](caixa-arredondamento-2026-09-22.json). Plano executado: confrontar casos que distinguem as hipóteses, ajustar capacidade/resumo separadamente e proteger os cronogramas com regressões.

Perfil: renda R$ 6.000, comprador de 38 anos, cotista, imóvel novo em Ribeirão Preto/SP, MCMV vinculado a empreendimento, SAC/TR, 420 meses, juros nominais 7,66% a.a., seguro básico. A data-base dos novos testes é 22/09; o nascimento sintético conserva os reenquadramentos mensais. A modalidade vinculada e a data devem ser igualadas para comparar CET, além dos valores principais.

## Capacidade e entrada

O motor arredondava DFI e adicional de referência separadamente. No imóvel de R$ 315 mil, isso produzia `22,37 + 20,15 = 42,52`. Somar os valores integrais e arredondar uma vez dá `22,365 + 20,1474 = 42,5124 → 42,51`.

Com o coeficiente SAC/MIP truncado em oito casas, já conciliado anteriormente:

```text
coeficiente = trunc8(1/420 + 7,66/1200 + 0,0144/100) = 0,00890828
financiamento = trunc2((1.800 − 25 − 42,51) / 0,00890828) = 194.480,86
entrada = 315.000 − 194.480,86 = 120.519,14
```

O financiamento anterior era R$ 194.479,74. Um centavo na reserva mensal explicava R$ 1,12 de diferença no principal. No imóvel de R$ 314 mil a diferença ocorria na direção oposta; o mesmo ajuste também a resolve. A base do DFI continua sendo a avaliação quando informada; a cobertura de referência continua usando o preço de compra. Quota, recursos e truncamentos existentes foram preservados.

## Primeira parcela SAC

Corrigir apenas a capacidade faria o resumo original subir indevidamente para R$ 1.779,86. A regra conciliada é:

```text
prestação sem seguros = trunc2(F / prazo + F × juros mensais)
seguro do resumo = arredondarPar2(MIP sobre F + DFI + adicional selecionado)
primeira do resumo = prestação sem seguros + seguro do resumo + tarifa
```

No caso original: `1.704,48 + 50,37 + 25 = 1.779,85`. O desempate para o centavo par foi testado nos dois sentidos: seguro integral R$ 48,455 resulta em R$ 48,46; R$ 48,365 resulta em R$ 48,36. Truncar simplesmente o total falha no caso de financiamento de R$ 180 mil; arredondar MIP e DFI separadamente falha no segundo empate. Não foi alterado o modo global do Decimal.

PRICE conserva o cálculo anterior. O cronograma continua arredondando cada componente, usando MIP sobre o saldo após amortização e sua convenção de liquidação. Por isso a primeira linha original permanece R$ 1.779,80, diferente dos R$ 1.779,85 do resumo. O seguro inicial usado no CET e a fórmula da última parcela não foram alterados.

## Evidência e limites

| Imóvel | Financiamento oficial | Entrada oficial | Primeira básica oficial | Última oficial |
|---:|---:|---:|---:|---:|
| 315.000,00 | 194.480,86 | 120.519,14 | 1.779,85 | 491,01 |
| 314.000,00 | 194.495,45 | 119.504,55 | 1.779,91 | 491,05 |
| 325.000,00 | 194.329,32 | 130.670,68 | 1.779,21 | 490,64 |
| 316.000,00 | 194.465,14 | 121.534,86 | 1.779,78 | 490,97 |
| 315.000,00 | 190.000,00 | 125.000,00 | 1.739,93 | 480,27 |
| 316.000,00 | 180.000,00 | 136.000,00 | 1.650,93 | 456,31 |
| 316.000,00 | 180.687,50 | 135.312,50 | 1.657,05 | 457,96 |
| 316.000,00 | 180.062,50 | 135.937,50 | 1.651,47 | 456,46 |

O motor coincide nos oito financiamentos, entradas e primeiras básicas. Sete últimas coincidem; no imóvel de R$ 314 mil calcula R$ 491,04, um centavo abaixo. Nesse mesmo caso, o seguro Mais calcula primeira de R$ 1.799,99 contra R$ 1.800,00 oficial; as outras quatro primeiras Mais observadas coincidem. A estimativa de cobertura adicional e essa última SAC permanecem limites explícitos, sem exceção por valor de imóvel. A tolerância de um centavo está restrita a esses dois campos desse caso nos testes.

São regras empiricamente conciliadas, não acesso ao cálculo interno do banco nem homologação de todos os perfis. Os resumos SBPE SAC da auditoria anterior não foram recapturados; subsídios, condições comerciais e apólices fora da amostra mantêm as limitações já documentadas.

Validação: `npm test` verifica os oito novos casos nos modos de principal/entrada, cinco resumos Mais, três resumos históricos, 2.040 parcelas históricas completas e as dez primeiras parcelas adicionais efetivamente observadas. Inclui as 16 verificações matemáticas, 204 de regras e regressões de idade/capacidade anteriores. `npm run build` prepara a versão local; publicação não faz parte desta alteração.

Na interface local, 14 verificações passaram: os quatro valores do caso original, comparação sem diferenças, gravação do resultado e versão no histórico, CSV de 420 parcelas com a primeira linha conciliada, cálculo por entrada, três exemplos com nove campos coincidentes e ausência de erros JavaScript. A aba oficial foi restaurada ao imóvel de R$ 315 mil, capacidade máxima e seguro básico.
