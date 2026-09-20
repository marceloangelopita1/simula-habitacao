# Conferência nas duas idades e ajustes do motor

Esta etapa atende à solicitação de igualar a idade nos dois simuladores e corrigir os problemas confirmados. A versão do motor passa a `2026-09-19.piloto.2`; a data-base das regras comerciais permanece 14/09/2026. A conferência foi realizada localmente; a publicação ocorre pelo fluxo do GitHub Pages após o envio para `main`.

## Experimento oficial

Usada a mesma aba já aberta no Chrome em `https://simuladorhabitacao.caixa.gov.br/simulacao`. O caso inicial aos 28 anos foi reconferido. Em seguida, voltamos às etapas da CAIXA e mudamos apenas o nascimento para o perfil de 38 anos do site, preservando renda, imóvel e respostas. A CAIXA exigiu selecionar novamente MCMV e voltou ao padrão SAC; foi restabelecido PRICE/420 meses e removida a entrada sugerida pelo SAC para que o banco calculasse o máximo PRICE.

Dados comuns: renda R$ 3.578; usado de R$ 264.000; Ribeirão Preto/SP; um comprador sem dependentes; cotista FGTS; sem benefício habitacional anterior; MCMV; PRICE/TR; 420 meses; juros nominais 5,50%; seguro CAIXA RESIDENCIAL HABITACIONAL básico. Primeiros vencimentos em 19/10/2026. As datas completas de nascimento foram alinhadas em cada cálculo; os arquivos do perfil de 28 anos usam dia sintético que preserva todas as idades nos vencimentos.

## Igualar a idade antes da correção não bastava

| Idade em ambos | Site antes: financiamento | CAIXA: financiamento | Diferença |
|---|---:|---:|---:|
| 28 | R$ 183.666,32 | R$ 185.653,58 | −R$ 1.987,26 |
| 38 | R$ 183.666,32 | R$ 183.667,14 | −R$ 0,82 |

Aos 28 anos faltavam duas faixas iniciais do MIP. Aos 38 a faixa já estava correta, e a diferença restante no principal vinha da precisão do cálculo de capacidade. Em ambas as idades o subsídio automático do site continuava em R$ 326, contra zero na composição da CAIXA.

## Resultado com o código corrigido

| Campo | 28 anos: motor / CAIXA | 38 anos: motor / CAIXA |
|---|---:|---:|
| Principal máximo | R$ 185.653,58 / R$ 185.653,58 | R$ 183.667,14 / R$ 183.667,14 |
| Primeira parcela — resumo | R$ 1.056,51 / R$ 1.056,51 | R$ 1.056,51 / R$ 1.056,51 |
| Última parcela — resumo | R$ 1.021,99 / R$ 1.021,99 | R$ 1.011,32 / R$ 1.011,32 |
| CET exibido | 6,39% / 6,39% | 6,71% / 6,71% |
| CESH, arredondado a duas casas | 2,82% / 2,82% | 5,02% / 5,02% |
| Entrada com subsídio igualado a zero | R$ 78.346,42 / R$ 78.346,42 | R$ 80.332,86 / R$ 80.332,86 |
| Entrada com estimativa automática do site | R$ 78.020,42 / R$ 78.346,42 | R$ 80.006,86 / R$ 80.332,86 |

O CESH calculado sem abreviação é 2,824569% aos 28 e 5,018627% aos 38. A CAIXA exibe duas casas; o site exibe quatro. É diferença de apresentação, após a conciliação.

A primeira linha do cronograma é R$ 1.056,50 aos 28 e R$ 1.056,49 aos 38. A última linha efetiva é R$ 1.021,71 aos 28 e R$ 1.014,76 aos 38. O último resumo e a última linha não são o mesmo campo: a linha quita o saldo residual dos arredondamentos da tabela PRICE.

## Alterações confirmadas

- Adicionadas as faixas MCMV até 30 anos (0,0085% a.m.) e de 31 a 35 anos (0,0108% a.m.), com reenquadramento pela idade atingida. Os 420 registros observados aos 28 anos validam as faixas e transições nesse contrato.
- DFI em centavos no cálculo de capacidade; coeficiente de prestação e MIP truncado a oito casas; capacidade truncada em centavos. A precisão do cronograma continua independente da precisão usada para obter o principal máximo.
- Atualizadas a versão e as descrições de cobertura do seguro/capacidade.
- Acrescentadas referências dos dois cronogramas e testes que comparam principal, prestação, saldo, seguros, tarifas, CET e CESH. Quatro máximos históricos SAC e o novo SAC de R$ 142.477,50 também estão cobertos.

Essas convenções reproduzem os casos observados e são regras gerais do cálculo, sem valores de financiamento fixados por renda, idade ou imóvel. Não constituem confirmação de todos os produtos ou de todas as possíveis idades de contratação.

## Subsídio: limite deliberadamente preservado

Ao voltar ao formulário oficial, confirmou-se que “Possui subsídio: Não” corresponde à pergunta **se já recebeu benefício do FGTS/União a partir de maio de 2005**. Portanto esse rótulo não é uma opção para desativar o subsídio desta compra. Tanto no site quanto na CAIXA a resposta é ausência de benefício anterior.

A CAIXA considera zero na composição atual em ambas as idades. O motor chega a R$ 326 pela fórmula e pelos redutores de família unipessoal e imóvel usado. Aplicar o mínimo de R$ 1.500 após os redutores seria uma explicação possível, mas ainda não foi confirmado normativamente nem isolado com casos em outras faixas de subsídio. As tentativas de acesso às fontes oficiais não trouxeram confirmação suficiente.

**Não se alterou a regra do subsídio apenas para fazer este caso coincidir.** Com todos os campos originais, resta diferença de R$ 326 na entrada própria. Para conciliar exatamente a composição oficial conhecida, o usuário pode selecionar o modo já existente “Sem subsídio”, preservando a distinção entre valor confirmado e estimativa. A nova suíte verifica também essa limitação para não confundir seguro conciliado com subsídio homologado.

## Reprodução

`npm test` executa os testes históricos e `tests/age-capacity.mjs`. Referências anonimizadas: `validation/caixa-price-usado-2026-09-19.json` e `validation/caixa-price-usado-38-2026-09-19.json`. São dados lidos na interface, não valores produzidos pelo próprio algoritmo sob teste.

O relatório anterior, `diagnostico-2026-09-19.md`, preserva os números do motor antes dessas alterações.
