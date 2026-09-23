# Comparação de 30 cenários com a CAIXA — 22/09/2026

> Seguimento em 23/09/2026: depois de autorizada a implementação, os achados A1–A5 receberam [correções locais](correcoes-matriz-2026-09-23.md) e [OK independente](revisao-independente-2026-09-23.md). Este relatório e seus dados preservam a análise da versão anterior; os [resultados posteriores](resultado-correcoes-2026-09-23.json) estão separados.

**Concluída como análise e documentação.** Foram observados 30 cenários na sessão existente da CAIXA e executados os mesmos parâmetros no motor atual do projeto. As prioridades são: **seguro/capacidade da Classe Média**, **subsídio estimado quando a CAIXA concede zero**, **composição do CET** e **CESH dos seguros adicionais**. Nenhum código, regra, teste ou configuração foi alterado.

Evidências e resultados reproduzíveis: [JSON com inputs, observações, resultados e controles](comparacao-matriz-2026-09-22.json) e [CSV das 14 métricas por cenário](comparacao-matriz-2026-09-22.csv). `observed` contém leituras oficiais; `ours` contém cálculos do motor; `oursAtOfficialPrincipal` isola o cronograma do erro de capacidade; `controls` contém contrafactuais analíticos, não novas capturas oficiais. **Diferença = nosso − CAIXA.** Dinheiro em reais; diferenças de taxas em pontos percentuais (pp).

## Método, versão e limites da evidência

- Fontes vivas: [simulador do projeto](https://marceloangelopita1.github.io/simula-habitacao/#simular) e [simulador CAIXA](https://simuladorhabitacao.caixa.gov.br/simulacao), versão indicada pela interface `1.16.0.2`. Mesmas duas abas e sessão original do Chrome.
- Lidos primeiro `AGENTS.md`, `docs/browser.md`, skill Computer Use e seus documentos. A ferramenta registrada falhou antes de executar JS com `sandboxCwd is not a local file URI`. A recuperação documentada, por `scripts/browser-node-repl.py` com diretório Windows e o servidor instalado, permitiu controlar o Chrome por `@oai/sky`. Não houve mudança de perfil, autenticação ou configuração de segurança.
- Revisão local inicial `1a8f3e842fb376e764e08f1023af7c360fa1499e`, árvore limpa. Motor `2026-09-22.piloto.4`. `engine.js`, `app.js`, `index.html` e `data/municipal-rules.json` publicados coincidiram byte a byte com os locais. SHA-256 do motor: `fe3b84a6bc0e43116d9589a4b902aab2277d1ac65cd30a29bcf2fdb6b730e794`.
- Os 30 resultados próprios foram obtidos chamando **a função real `simulate`**, sem substituir fórmulas ou alterar arquivos de implementação. A interface publicada, recarregada, foi conferida adicionalmente no controle S07: financiamento 524.032,93; primeira 6.176,15; última 1.284,06; CET 12,26%; CESH 4,8710%. Não foram digitados manualmente os 30 casos na interface do projeto.
- Data-base comum **22/09/2026**. Primeiro vencimento observado **22/10/2026**; vencimento final de 420 meses **22/09/2061**. Nas simulações originais de 38 anos, o nascimento foi anonimizado como `1988-02-01`, preservando os reenquadramentos mensais. A partir do teste etário foram preenchidos nascimentos sintéticos: `1957-02-01` (69 anos) e `1988-02-01` (38 anos). Nenhum CPF, telefone ou nascimento pessoal foi gravado nos artefatos.
- Sem projeção de TR. Compra residencial, compra = avaliação assumida no motor, sem aporte nem saque de FGTS na entrada, sem benefício habitacional anterior nem outro imóvel local. Família “dependentes” significa um comprador com composição familiar elegível; não foi inventada participação de segundo segurado. Cotista representa a resposta sobre pelo menos três anos de FGTS.
- Quando a CAIXA não mostrou linha de subsídio, zero foi confirmado pelo fechamento **preço = financiamento + entrada**. “Possui subsídio: Não” no resumo pessoal se refere ao benefício **anterior**, não a recusa do desconto atual.
- CET/CESH foram aguardados até o carregamento terminar: a interface mostrou zeros transitórios. Foram lidos em **28 dos 30 casos**; S04 e S18 permanecem sem esses indicadores oficiais. Ausência não foi preenchida com uma previsão. A CAIXA exibiu duas casas; o JSON conserva a precisão do motor e o confronto arredondado a duas casas.
- Cronogramas inspecionados conforme a investigação: primeiras dez parcelas de S01, S02, S09, S21 e S22; últimas dez de S02; reprodução de S27 com páginas 1, 22 e 42 (parcelas 1–10, 211–220 e 411–420). O JSON conserva as linhas usadas nos achados, sem pretender ser transcrição integral dessas páginas. **Não foram recapturados 30 cronogramas completos.** As capturas históricas de 1.200, 840 e 550 linhas continuam evidência histórica separada.
- Tarifa mensal oficial foi confrontada nas linhas lidas. A tarifa inicial de avaliação não foi discriminada nos resultados capturados: valores que explicam o CET são tratados como **inferências**, não como cobrança contratual confirmada.
- Cobertura FGTS inclui cotista/não cotista e oferta Pró-Cotista. Não foram comparados saques positivos de FGTS, dois compradores com percentuais de renda/seguro, outras seguradoras, relacionamento/salário, SFI ou todas as faixas etárias. S10 usa `activeFgts=true` no motor para representar a oferta Pró-Cotista obtida; a condição de vínculo ativo não foi demonstrada pela tela. Esses limites impedem homologação universal.

## Matriz executada

Todos os campos estão completos em `effectiveInput` no JSON. RP = Ribeirão Preto/SP; FOR = Fortaleza/CE. U = uma pessoa sem dependentes; D = composição familiar com dependentes. C = cotista; NC = não cotista. B = Básico; E = Especial/`plus`; A = Especial Ampliado. EC = empreendimento CAIXA. A seta no prazo indica a redução para o limite efetivamente aplicado.

| ID | Modalidade aplicada | Renda | Imóvel / município | Idade / família / FGTS | Sistema / meses | Modo | Seguro |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | SBPE EC | 21.000,00 | 780.000,00 novo RP | 38 / U / C | SAC 420 | máximo | B |
| S02 | SBPE EC | 21.000,00 | 780.000,00 novo RP | 38 / U / C | SAC 420 | máximo | E |
| S03 | SBPE EC | 21.000,00 | 780.000,00 novo RP | 38 / U / C | SAC 360 | máximo* | E |
| S04 | SBPE EC | 21.000,00 | 780.000,00 novo RP | 38 / U / C | PRICE 360 | entrada 267.099,03 | E |
| S05 | SBPE EC | 21.000,00 | 780.000,00 novo RP | 38 / U / C | PRICE 360 | máximo | B |
| S06 | SBPE EC | 21.000,00 | 780.000,00 novo RP | 38 / U / C | PRICE 360 | máximo | E |
| S07 | SBPE comum | 21.000,00 | 780.000,00 novo RP | 38 / U / C | SAC 420 | máximo | B |
| S08 | SBPE comum | 21.000,00 | 780.000,00 novo RP | 38 / U / C | SAC 420 | máximo | E |
| S09 | SBPE comum | 21.000,00 | 780.000,00 novo RP | 38 / U / C | SAC 420 | máximo | A |
| S10 | Pró-Cotista | 21.000,00 | 400.000,00 novo RP | 38 / U / C | SAC 420 | máximo | B |
| S11 | SBPE EC | 21.000,00 | 400.000,00 novo RP | 38 / U / C | SAC 420 | máximo | B |
| S12 | SBPE EC | 21.000,00 | 400.000,00 novo RP | 69 / U / C | SAC 420 → 130 | máximo | B |
| S13 | MCMV comum | 3.578,00 | 400.000,00 novo RP | 38 / U / C | SAC 420 | máximo | B |
| S14 | MCMV comum | 3.578,00 | 264.000,00 novo RP | 38 / U / C | SAC 420 | máximo | B |
| S15 | MCMV comum | 3.578,00 | 264.000,00 novo RP | 38 / U / C | PRICE 420 | máximo | B |
| S16 | MCMV comum | 3.578,00 | 264.000,00 novo RP | 38 / U / C | PRICE 420 | principal 100.000 | B |
| S17 | MCMV comum | 3.578,00 | 264.000,00 usado RP | 38 / U / C | SAC 420 | máximo | B |
| S18 | MCMV comum | 3.578,00 | 264.000,00 usado RP | 38 / D / C | SAC 420 | máximo | B |
| S19 | MCMV comum | 3.578,00 | 264.000,00 novo RP | 38 / D / C | SAC 420 | máximo | B |
| S20 | MCMV EC | 3.578,00 | 264.000,00 novo RP | 38 / D / C | SAC 420 | máximo | B |
| S21 | MCMV EC | 2.850,00 | 264.000,00 novo RP | 38 / D / C | SAC 420 | máximo | B |
| S22 | MCMV EC | 2.850,01 | 264.000,00 novo RP | 38 / D / C | SAC 420 | máximo | B |
| S23 | MCMV EC | 2.850,01 | 264.000,00 novo RP | 38 / D / NC | SAC 420 | máximo | B |
| S24 | MCMV EC | 2.850,01 | 264.000,00 novo FOR | 38 / D / NC | SAC 420 | máximo | B |
| S25 | Classe Média | 13.000,00 | 600.000,00 novo FOR | 38 / D / NC | PRICE 420 | máximo | B |
| S26 | Classe Média | 13.000,00 | 600.000,00 usado FOR | 38 / D / NC | PRICE 420 | máximo | B |
| S27 | Classe Média | 13.000,00 | 600.000,00 usado RP | 38 / D / NC | PRICE 420 | máximo | B |
| S28 | Classe Média | 13.000,00 | 600.000,00 usado RP | 38 / D / NC | SAC 420 | máximo | B |
| S29 | Classe Média | 13.000,00 | 600.000,00 usado RP | 38 / D / NC | SAC 240 | máximo | B |
| S30 | SBPE comum | 13.000,01 | 600.000,00 usado RP | 38 / D / NC | SAC 420 | máximo | B |

S03 tem uma ressalva operacional: tentou-se limpar a entrada com `set_value`, mas esse método não comprovou atualização do modelo da CAIXA; a entrada anterior pode ter permanecido. A redução de 420 para 360 meses tornou a renda limitante e o resultado coincide com o máximo calculado. O caso **não prova** que a limpeza foi efetiva. S04 preserva deliberadamente a entrada herdada; S05 confirma o máximo PRICE após limpeza por teclado. S16 fixa 100 mil de principal na CAIXA por entrada de 164 mil; no motor usa `amountMode=fixed`, para não contaminar o principal pela divergência de subsídio.

### Financiamento, entrada e subsídio

Nas células com dois valores, a ordem é **nosso / CAIXA**. A entrada é o dinheiro para completar o preço, sem somar custos de contratação. Com saque de FGTS zero, não há ambiguidade entre entrada total e recursos próprios nesses casos.

| ID | Financiamento nosso | Financiamento CAIXA | Δ financiamento | Entrada nosso / CAIXA | Subsídio nosso / CAIXA |
| --- | --- | --- | --- | --- | --- |
| S01 | 530.386,96 | 530.386,96 | 0,00 | 249.613,04 / 249.613,04 | 0,00 / 0,00 |
| S02 | 530.386,96 | 530.386,96 | 0,00 | 249.613,04 / 249.613,04 | 0,00 / 0,00 |
| S03 | 512.900,97 | 512.900,97 | 0,00 | 267.099,03 / 267.099,03 | 0,00 / 0,00 |
| S04 | 512.900,97 | 512.900,97 | 0,00 | 267.099,03 / 267.099,03 | 0,00 / 0,00 |
| S05 | 532.531,01 | 532.531,01 | 0,00 | 247.468,99 / 247.468,99 | 0,00 / 0,00 |
| S06 | 532.531,01 | 532.531,01 | 0,00 | 247.468,99 / 247.468,99 | 0,00 / 0,00 |
| S07 | 524.032,93 | 524.033,79 | -0,86 | 255.967,07 / 255.966,21 | 0,00 / 0,00 |
| S08 | 524.032,93 | 524.033,79 | -0,86 | 255.967,07 / 255.966,21 | 0,00 / 0,00 |
| S09 | 524.032,93 | 524.033,79 | -0,86 | 255.967,07 / 255.966,21 | 0,00 / 0,00 |
| S10 | 320.000,00 | 320.000,00 | 0,00 | 80.000,00 / 80.000,00 | 0,00 / 0,00 |
| S11 | 360.000,00 | 360.000,00 | 0,00 | 40.000,00 / 40.000,00 | 0,00 / 0,00 |
| S12 | 310.278,80 | 310.278,80 | 0,00 | 89.721,20 / 89.721,20 | 0,00 / 0,00 |
| S13 | 111.628,73 | 111.628,73 | 0,00 | 288.371,27 / 288.371,27 | 0,00 / 0,00 |
| S14 | 142.477,50 | 142.477,50 | 0,00 | 120.870,50 / 121.522,50 | 652,00 / 0,00 |
| S15 | 183.667,14 | 183.667,14 | 0,00 | 79.680,86 / 80.332,86 | 652,00 / 0,00 |
| S16 | 100.000,00 | 100.000,00 | 0,00 | 163.348,00 / 164.000,00 | 652,00 / 0,00 |
| S17 | 142.477,50 | 142.477,50 | 0,00 | 121.196,50 / 121.522,50 | 326,00 / 0,00 |
| S18 | 142.477,50 | 142.477,50 | 0,00 | 120.435,50 / 121.522,50 | 1.087,00 / 0,00 |
| S19 | 142.477,50 | 142.477,50 | 0,00 | 119.347,50 / 119.348,50 | 2.175,00 / 2.174,00 |
| S20 | 142.477,50 | 142.477,50 | 0,00 | 119.347,50 / 119.348,50 | 2.175,00 / 2.174,00 |
| S21 | 130.577,93 | 130.577,93 | 0,00 | 121.488,07 / 121.489,07 | 11.934,00 / 11.933,00 |
| S22 | 122.526,40 | 122.526,40 | 0,00 | 129.408,60 / 129.409,60 | 12.065,00 / 12.064,00 |
| S23 | 115.127,35 | 115.127,35 | 0,00 | 136.564,65 / 136.565,65 | 12.308,00 / 12.307,00 |
| S24 | 118.711,78 | 118.711,78 | 0,00 | 133.214,22 / 133.215,22 | 12.074,00 / 12.073,00 |
| S25 | 427.408,25 | 434.062,64 | -6.654,39 | 172.591,75 / 165.937,36 | 0,00 / 0,00 |
| S26 | 427.408,25 | 434.062,64 | -6.654,39 | 172.591,75 / 165.937,36 | 0,00 / 0,00 |
| S27 | 360.000,00 | 360.000,00 | 0,00 | 240.000,00 / 240.000,00 | 0,00 / 0,00 |
| S28 | 344.132,65 | 349.412,61 | -5.279,96 | 255.867,35 / 250.587,39 | 0,00 / 0,00 |
| S29 | 295.568,99 | 300.064,85 | -4.495,86 | 304.431,01 / 299.935,15 | 0,00 / 0,00 |
| S30 | 321.321,13 | 321.321,99 | -0,86 | 278.678,87 / 278.678,01 | 0,00 / 0,00 |

### Parcelas, CET e CESH

Primeira e última são do **resumo**, não da planilha. Taxas/indicadores em %. “—” significa não observado na CAIXA. A apresentação anual do CESH na interface oficial foi transcrita como indicador; não o interpretamos como taxa de juros anual nem o somamos ao CET.

| ID | Primeira nosso / CAIXA | Última nosso / CAIXA | CET nosso / CAIXA | CESH nosso / CAIXA |
| --- | --- | --- | --- | --- |
| S01 | 6.250,11 / 6.250,11 | 1.299,33 / 1.299,33 | 12,23 / 12,23 | 4,86 / 4,86 |
| S02 | 6.300,00 / 6.300,00 | 1.299,33 / 1.299,33 | 12,39 / 12,39 | 4,86 / 5,99 |
| S03 | 6.300,00 / 6.300,00 | 1.462,69 / 1.462,69 | 12,38 / 12,38 | 4,26 / 5,41 |
| S04 | 5.061,14 / 5.061,14 | 4.880,78 / 4.880,78 | 12,38 / — | 5,92 / — |
| S05 | 5.200,11 / 5.200,11 | 5.066,62 / 5.066,62 | 12,24 / 12,24 | 5,87 / 5,87 |
| S06 | 5.250,00 / 5.250,00 | 5.066,62 / 5.066,62 | 12,37 / 12,37 | 5,87 / 6,98 |
| S07 | 6.176,15 / 6.176,15 | 1.284,06 / 1.284,05 | 12,26 / 12,26 | 4,87 / 4,87 |
| S08 | 6.226,04 / 6.226,04 | 1.284,06 / 1.284,05 | 12,42 / 12,43 | 4,87 / 6,02 |
| S09 | 6.300,00 / 6.299,99 | 1.284,06 / 1.284,05 | 12,66 / 12,66 | 4,87 / 7,72 |
| S10 | 3.171,91 / 3.171,91 | 792,40 / 792,40 | 9,88 / 10,06 | 4,68 / 4,68 |
| S11 | 4.241,75 / 4.241,75 | 889,94 / 889,94 | 12,23 / 12,23 | 4,57 / 4,57 |
| S12 | 6.274,42 / 6.274,42 | 2.433,49 / 2.433,49 | 17,81 / 17,81 | 21,54 / 21,54 |
| S13 | 1.047,81 / 1.047,81 | 292,48 / 292,48 | 9,44 / 9,44 | 6,02 / 6,02 |
| S14 | 1.056,51 / 1.056,51 | 365,78 / 365,78 | 6,87 / 6,87 | 4,54 / 4,54 |
| S15 | 1.056,51 / 1.056,51 | 1.011,32 / 1.011,32 | 6,71 / 6,71 | 5,02 / 5,02 |
| S16 | 595,16 / 595,16 | 562,02 / 562,02 | 7,02 / 7,02 | 6,05 / 6,05 |
| S17 | 1.056,51 / 1.056,51 | 365,78 / 365,78 | 6,87 / 6,87 | 4,54 / 4,54 |
| S18 | 1.056,51 / 1.056,51 | 365,78 / 365,78 | 6,87 / — | 4,54 / — |
| S19 | 1.056,51 / 1.056,51 | 365,78 / 365,78 | 6,87 / 6,70 | 4,54 / 4,54 |
| S20 | 1.056,51 / 1.056,51 | 365,78 / 365,78 | 6,71 / 6,70 | 4,54 / 4,54 |
| S21 | 838,11 / 838,11 | 312,07 / 312,07 | 5,39 / 4,69 | 4,68 / 4,68 |
| S22 | 838,11 / 838,11 | 317,88 / 317,87 | 6,04 / 5,24 | 4,79 / 4,79 |
| S23 | 838,11 / 838,11 | 300,31 / 300,31 | 6,58 / 5,67 | 4,91 / 4,91 |
| S24 | 838,11 / 838,11 | 308,83 / 308,82 | 6,31 / 5,46 | 4,85 / 4,85 |
| S25 | 3.804,73 / 3.861,63 | 3.699,31 / 3.756,52 | 11,35 / 11,38 | 6,86 / 5,48 |
| S26 | 3.804,73 / 3.861,63 | 3.699,31 / 3.756,52 | 11,35 / 11,38 | 6,86 / 5,48 |
| S27 | 3.214,86 / 3.214,26 | 3.119,82 / 3.119,82 | 11,39 / 11,42 | 7,07 / 5,72 |
| S28 | 3.804,73 / 3.861,62 | 851,19 / 863,86 | 11,35 / 11,47 | 5,07 / 4,42 |
| S29 | 3.804,73 / 3.861,61 | 1.266,80 / 1.285,68 | 11,31 / 11,55 | 3,31 / 3,27 |
| S30 | 3.804,73 / 3.804,74 | 797,02 / 797,03 | 12,37 / 12,37 | 5,17 / 5,17 |

### Taxas, cota e prazo

Prazo aplicado e cota coincidiram em **30/30** casos; taxa efetiva, arredondada à apresentação oficial, também em **30/30**. O principal coincidiu ao centavo em **22/30**; quatro diferenças são de R$ 0,86 no SBPE comum e quatro são materiais na Classe Média. Esses números descrevem a amostra dirigida; não são taxa estatística de acerto do produto.

| ID | Nominal nosso / CAIXA | Efetiva nosso / CAIXA | Cota % ambos | Prazo meses ambos |
| --- | --- | --- | --- | --- |
| S01 | 10,93 / 10,92 | 11,49 / 11,49 | 90 | 420 |
| S02 | 10,93 / 10,92 | 11,49 / 11,49 | 90 | 420 |
| S03 | 10,93 / 10,92 | 11,49 / 11,49 | 90 | 360 |
| S04 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 360 |
| S05 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 360 |
| S06 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 360 |
| S07 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 420 |
| S08 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 420 |
| S09 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 420 |
| S10 | 8,66 / 8,66 | 9,01 / 9,01 | 80 | 420 |
| S11 | 10,93 / 10,92 | 11,49 / 11,49 | 90 | 420 |
| S12 | 10,93 / 10,92 | 11,49 / 11,49 | 90 | 130 |
| S13 | 7,66 / 7,66 | 7,93 / 7,93 | 80 | 420 |
| S14 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S15 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S16 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S17 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S18 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S19 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S20 | 5,50 / 5,50 | 5,64 / 5,64 | 80 | 420 |
| S21 | 4,50 / 4,50 | 4,59 / 4,59 | 80 | 420 |
| S22 | 4,75 / 4,75 | 4,85 / 4,85 | 80 | 420 |
| S23 | 5,25 / 5,25 | 5,38 / 5,38 | 80 | 420 |
| S24 | 5,00 / 5,00 | 5,12 / 5,12 | 80 | 420 |
| S25 | 10,00 / 10,00 | 10,47 / 10,47 | 80 | 420 |
| S26 | 10,00 / 10,00 | 10,47 / 10,47 | 80 | 420 |
| S27 | 10,00 / 10,00 | 10,47 / 10,47 | 60 | 420 |
| S28 | 10,00 / 10,00 | 10,47 / 10,47 | 60 | 420 |
| S29 | 10,00 / 10,00 | 10,47 / 10,47 | 60 | 240 |
| S30 | 10,93 / 10,92 | 11,49 / 11,49 | 80 | 420 |

## Achados prioritários e reprodução

### A1 — P1: Classe Média usa seguro e reserva de capacidade do SBPE no motor

**Classificação:** enquadramento do seguro com efeito de cálculo; limitação antes declarada, agora quantificada. **Confiança alta** na divergência e na causa local; alta para os coeficientes nas linhas lidas, moderada para universalizar a apólice.

Parâmetros: S25–S29, renda 13 mil, 38 anos, não cotista, família elegível, imóvel de 600 mil, Classe Média, básico. S25→S26 muda só novo/usado em Fortaleza; S26→S27 muda só município para RP; S27→S28 muda PRICE para SAC com entrada zerada; S28→S29 muda prazo de 420 para 240 com entrada zerada.

| Controle | Nosso financiamento | CAIXA | Δ financiamento | Efeito na entrada |
|---|---:|---:|---:|---:|
| S25/S26, FOR, PRICE 420 | 427.408,25 | 434.062,64 | −6.654,39 | +6.654,39 |
| S27, RP usado, PRICE 420 | 360.000,00 | 360.000,00 | 0,00 | 0,00; cota limita |
| S28, RP usado, SAC 420 | 344.132,65 | 349.412,61 | −5.279,96 | +5.279,96 |
| S29, RP usado, SAC 240 | 295.568,99 | 300.064,85 | −4.495,86 | +4.495,86 |

O controle S27 mantém **o mesmo principal** nos dois motores e revela o problema de seguro sem diferença de financiamento:

| Linha de S27 | Nosso | CAIXA | Δ |
|---|---:|---:|---:|
| MIP da parcela 1, saldo 359.905,18 | 55,43 | 51,83 | +3,60 |
| DFI da parcela 1 | 39,60 | 42,60 | −3,00 |
| Encargo da parcela 1 | 3.214,85 | 3.214,25 | +0,60 |
| MIP da parcela 211, saldo 305.831,60, idade 56 | 468,84 | 233,66 | +235,18 |
| Encargo da parcela 211 | 3.628,26 | 3.396,08 | +232,18 |
| CESH | 7,07% | 5,72% | +1,35 pp |

**Causa verificada no código:** `insuranceModel` só é `mcmv` quando `program==='mcmv'`; `middle` cai em `sbpe`. O mesmo desvio seleciona DFI 0,0066% e reserva Ampliado 0,00015878. A CAIXA mostrou DFI 0,0071% e MIP compatível com 0,0144% aos 38 e 0,0764% aos 56, correspondentes à outra tabela já existente no motor.

**Controle analítico, sem editar o motor:** coeficientes MCMV, reserva Mais 0,00006396 e DFI somados dão reserva 80,98. A fórmula de capacidade já implementada passa a produzir exatamente 434.062,64 (PRICE 420), 349.412,61 (SAC 420) e 300.064,85 (SAC 240). Fixando o principal oficial e usando essa tabela de seguro, o CESH arredondado coincide nos cinco casos, e as linhas 1 e 211 de S27 coincidem. Persistem resíduos de até um centavo em alguns resumos; não se declara reprodução integral de todos os cronogramas.

Variando um coeficiente por vez no controle S25: somente MIP inicial resulta em 427.897,24; somente DFI, 427.065,43; somente adicional de referência, 433.909,43; os três juntos, 434.062,64. A reserva do adicional explica a maior parte do desvio de capacidade; a tabela de MIP explica o grande desvio de seguro futuro. Esses números constam em `controls.middleCapacityOneAtATime`.

**Impacto:** entrada superestimada em milhares de reais, custo de seguro futuro distorcido e comparação de SAC/PRICE comprometida. A cota de 60% no usado em RP e 80% em Fortaleza estava correta; não é a origem desse erro.

### A2 — P1: subsídio abaixo do mínimo observado gera entrada insuficiente

**Classificação:** enquadramento/limitação conhecida, ampliada e reproduzida. **Confiança alta** nos valores e impacto; **moderada** na hipótese de ordem de aplicação do mínimo.

Parâmetros: renda 3.578, imóvel 264 mil em RP, 38 anos, cotista, MCMV, básico. O principal máximo SAC é 142.477,50 em ambos.

| Caso / alteração isolada | Subsídio nosso / CAIXA | Entrada nossa / CAIXA | Δ entrada |
|---|---:|---:|---:|
| S14: novo, unipessoal | 652 / 0 | 120.870,50 / 121.522,50 | −652,00 |
| S17: apenas novo→usado | 326 / 0 | 121.196,50 / 121.522,50 | −326,00 |
| S18: apenas U→D, usado | 1.087 / 0 | 120.435,50 / 121.522,50 | −1.087,00 |
| S19: apenas usado→novo, D | 2.175 / 2.174 | 119.347,50 / 119.348,50 | −1,00 |

S15 (PRICE máximo) e S16 (principal fixo de 100 mil) reproduzem o subsídio indevido de 652 e a mesma insuficiência de entrada. Isso separa o problema do algoritmo de máximo e do sistema de amortização.

**Verificado:** `calculateSubsidy` compara o valor bruto com 1.500 antes de aplicar os redutores de pessoa só e imóvel usado. O valor bruto desse perfil é aproximadamente 2.174,9183; os redutores deixam 652, 326 ou 1.087 no resultado. A própria implementação já avisa sobre a ordem não validada do mínimo.

**Hipótese:** testar o mínimo após redutores explicaria os três zeros observados. A amostra não estabelece, por si só, um limiar exato ou toda a regra interna da CAIXA: não foram sondados 1.499/1.500/1.501 de desconto calculado. Não se atribui uma regra normativa universal a essa inferência.

**Arredondamento separado:** nos seis casos de subsídio positivo S19–S24, nosso valor excede o oficial em exatamente 1 real. Truncar o valor bruto final para reais inteiros reproduz os seis (2174; 2174; 11933; 12064; 12307; 12073), enquanto o motor arredonda. É evidência forte para esses pontos, ainda sem prova geral do algoritmo de arredondamento. O erro de 1 real tem prioridade inferior ao desconto concedido indevidamente.

### A3 — P1: CET não incorpora o efeito observado do subsídio; tarifa inicial merece revisão por linha

**Classificação:** composição do fluxo do CET. **Confiança alta** na divergência; alta na omissão do subsídio no código; **moderada** na composição interna inferida do fluxo oficial.

| Caso | CET nosso | CET CAIXA | Δ pp |
|---|---:|---:|---:|
| S19 MCMV comum, D, renda 3.578, subsídio 2.174 | 6,87% | 6,70% | +0,17 |
| S20 mesmo perfil em empreendimento MCMV | 6,71% | 6,70% | +0,01 |
| S21 empreendimento, renda 2.850, subsídio 11.933 | 5,39% | 4,69% | +0,70 |
| S22 renda 2.850,01, subsídio 12.064 | 6,04% | 5,24% | +0,80 |
| S23 apenas cotista→não, subsídio 12.307 | 6,58% | 5,67% | +0,91 |
| S24 apenas RP→Fortaleza, subsídio 12.073 | 6,31% | 5,46% | +0,85 |
| S10 Pró-Cotista, 320 mil financiados, sem subsídio | 9,88% | 10,06% | −0,18 |

O par **S14→S19**, mantendo principal, taxa, prazo, seguro e resumo das parcelas, muda a família e faz o subsídio oficial passar de zero a 2.174: CET de 6,87% para 6,70%. Nosso CET fica em 6,87%. A fórmula local usa crédito líquido `F − avaliação − seguro inicial`, sem subsídio. O par **S19→S20** troca só a modalidade comum/empreendimento: a CAIXA mantém 6,70%, mas o motor zera a avaliação em `linkedProject`, baixando o próprio CET. A proximidade em S20 mascara dois efeitos que se compensam; não valida a isenção.

**Experimento explicativo:** usando o cronograma calculado e crédito inicial `F − arred(1,5% × F) − seguro inicial + subsídio oficial`, reproduzem-se, a duas casas, **todos os sete CETs** da tabela de controles de S10 e S19–S24. Exemplos: S23 → 5,6679%; S21 → 4,6869%; S10 com custo inicial 4.800,00 → 10,0584%. Na Classe Média, a tabela de seguro compatível com as linhas observadas mais custo inicial de 1,5% também reproduz os cinco CETs: 11,38; 11,38; 11,42; 11,47; 11,55.

Isso é uma **reconstrução compatível**, não confirmação de que a CAIXA cobra exatamente uma tarifa denominada “avaliação” de 1,5%, ou de como contabiliza o subsídio no contrato. A tela não discriminou esse custo. No motor, Pró-Cotista/Classe Média usam 841,44 e empreendimento MCMV usa zero. O SBPE empreendimento tem controles próprios e não deve receber a mesma inferência indiscriminadamente.

**Impacto:** comparação de custo anual pode inverter ou exagerar vantagens entre ofertas; no perfil S23 a diferença de 0,91 pp é material. Não é explicada pelo arredondamento de 1 real do subsídio.

### A4 — P1: CESH invariável ao mudar o seguro contradiz os pacotes oficiais

**Classificação:** definição do indicador implementado; hipótese antiga refutada empiricamente nesta comparação. **Confiança alta.**

Parâmetros de S01–S09: renda 21 mil, novo 780 mil em RP, 38 anos, cotista/unipessoal, balcão. Trocas isoladas de seguro preservaram financiamento, taxa, sistema e prazo.

| Oferta / sistema / seguro | Nosso CESH | CAIXA | Δ pp |
|---|---:|---:|---:|
| S01 EC SAC 420 básico | 4,86% | 4,86% | 0,00 |
| S02 EC SAC 420 Especial | 4,86% | 5,99% | −1,13 |
| S03 EC SAC 360 Especial | 4,26% | 5,41% | −1,15 |
| S05 EC PRICE 360 básico | 5,87% | 5,87% | 0,00 |
| S06 EC PRICE 360 Especial | 5,87% | 6,98% | −1,11 |
| S07 comum SAC 420 básico | 4,87% | 4,87% | 0,00 |
| S08 comum SAC 420 Especial | 4,87% | 6,02% | −1,15 |
| S09 comum SAC 420 Ampliado | 4,87% | 7,72% | −2,85 |

**Causa local verificada:** a soma de valor presente do CESH em `buildSchedule` usa só `mip + dfi`, excluindo `extraPremium`. A premissa de exclusão também é exibida pelo produto e sustentada por teste interno antigo. A aprovação daquele teste só valida a implementação da hipótese, não a concordância com as novas ofertas oficiais.

**Controle explicativo:** incluir o DFI/DFC completo observado no cronograma produz 5,9910; 5,4057; 6,9758; 6,0189; 7,7228% para S02/S03/S06/S08/S09, todos iguais aos oficiais nas duas casas. Para meses não lidos, foi assumido prêmio constante até a penúltima parcela; isso é hipótese, explicitada em `controls.extras`.

**Impacto:** o simulador não distingue o custo securitário dos pacotes e subestima o indicador em até 2,85 pp. O achado é sobre a comparação com essas ofertas, não uma conclusão normativa genérica sobre todas as coberturas facultativas.

### A5 — P2: coeficiente do adicional do resumo não reproduz exatamente o DFI/DFC da planilha

**Classificação:** precisão/modelagem de prêmio adicional, limitação já avisada no motor. **Confiança alta** nas linhas lidas; moderada para extrapolar o prêmio constante a todo o prazo.

| Cenário, primeira linha | Nosso | CAIXA | Δ |
|---|---:|---:|---:|
| S02 DFI + Especial | 101,37 | 101,40 | −0,03 |
| S02 encargo, principal idêntico | 6.299,82 | 6.299,85 | −0,03 |
| S09 DFI + Ampliado | 175,33 | 175,50 | −0,17 |
| S09 encargo | 6.299,82 | 6.299,99 | −0,17 |

No imóvel de 780 mil, o resumo usa adicionais compatíveis com 49,89 (Especial) e 123,85 (Ampliado). A planilha apresenta DFI/DFC 101,40 e 175,50, compatíveis com coeficientes combinados 0,000130 e 0,000225. Usar o incremento de resumo como prêmio mensal do cronograma deixa resíduos. Fixar o principal oficial em S09 mantém a divergência de 0,17 no encargo inicial, isolando-a do erro de máximo de 0,86. Nos dez primeiros meses observados os DFI/DFC foram constantes; na última de S02 zeraram.

O controle de DFI/DFC corrige os CESHs, mas **não explica sozinho** o CET de S08: continua aproximadamente 12,4236% versus 12,43% oficial. Esse resíduo de 0,01 pp fica aberto, sem causa afirmada. Prioridade financeira inferior a A1–A4.

## Controles corretos e diferenças menores

- **Comum versus empreendimento SBPE:** S01 e S07 têm a mesma renda/imóvel/sistema, mas cotas 90% e 80% e máximos 530.386,96 e 524.033,79. Nosso motor atual já distingue as ofertas. A diferença inicial de **6.354,03** entre as duas abas não era prova de erro de cálculo: eram modalidades diferentes. Os limites de capacidade e a reserva de seguro também diferem.
- **Máximo versus entrada preservada:** em S04 a mudança SAC→PRICE deixou entrada 267.099,03 e principal 512.900,97. Limpando a entrada por teclado, S05 ofereceu máximo 532.531,01 e entrada 247.468,99. A diferença de **19.630,04** é de parametrização, não falha da fórmula PRICE. Após edição a CAIXA às vezes manteve apenas a apólice selecionada; retornar à modalidade recompôs as ofertas.
- **Redefinições implícitas:** selecionar novamente SBPE/MCMV repôs SAC; Classe Média abriu em PRICE 420, inclusive na reprodução de S27. O limite SBPE PRICE ficou em 360; ao pedir 420 no perfil de 69 anos, o prazo efetivo foi 130. Valores de entrada foram relidos e zerados por teclado nos controles de máximo após troca de sistema/prazo (ressalva de S03 acima).
- **Fronteira de renda de 2.850:** S21→S22, aumento de um centavo, muda juros nominais de 4,50% para 4,75% e administração de 0 para 25 por mês. Principal cai de 130.577,93 para 122.526,40, exatamente como no motor; a primeira fica 838,11 no resumo e 838,07 na planilha. Esse salto é uma regra de enquadramento observada, não erro de arredondamento.
- **Cotista e região:** S22→S23 sobe juros nominais 4,75→5,25% ao retirar tempo de FGTS; S23→S24 cai a 5,00% ao mudar RP→Fortaleza. Os máximos conferem ao centavo. A oferta Pró-Cotista desapareceu com a resposta não cotista. S10 tem principal limitado à cota de 80%; seu problema está no CET, não na primeira/última do resumo.
- **Valor e fronteiras de modalidade:** S13, imóvel de 400 mil com renda 3.578, usa nominal 7,66% e nenhum desconto; S14, 264 mil, usa 5,50%. A Classe Média estava disponível em renda 13.000/imóvel 600.000; em **13.000,01** S30 mostrou apenas SBPE balcão, reiniciando SAC 420. Não foi sondado imóvel de 600.000,01.
- **Idade:** S11→S12 altera apenas nascimento: 38→69 anos, prazo 420→130, principal 360.000→310.278,80 e CESH 4,57→21,54%. O motor reproduz esses resumos e os indicadores arredondados. Isso confirma os dois perfis, sem homologar todas as idades iniciais.
- **Resíduo de máximo SBPE comum:** S07–S09 e S30 ficam **0,86 abaixo** do oficial. Nas primeiras/últimas dos resumos há diferenças de até 0,01. O resíduo já estava documentado e não foi “corrigido” alterando dados de referência.
- **Taxa nominal exibida:** para SBPE balcão, CAIXA mostra 10,92%, motor usa nominal interna 10,9259% e apresenta 10,93%; efetiva 11,49% coincide. Compatível com truncamento versus arredondamento na apresentação; não usar 10,92% arredondado para calcular todo o cronograma. A precisão interna oficial não foi extraída do servidor.
- **Soma das parcelas:** a CAIXA soma amortização + juros, sem seguro e administração. O CSV/JSON usam `paymentPITotal` para esse confronto; não comparam com nosso total de encargos. Fora da Classe Média com principal diferente, resíduos observados variam de −3,31 a +2,00; são compatíveis com precisão do principal e ajuste SAC final, sem validação integral da causa para cada novo caso.
- **Resumo versus parcela final real:** S27 PRICE mostra última 3.119,82 no resumo, mas a parcela 420 do cronograma é 3.122,50 (prestação 3.097,50 + administração 25, seguro zero). Nosso cronograma reproduz essa linha; o ajuste de saldo final explica a distinção. S02 apresenta 1.299,33 no resumo e 1.299,31 na última linha. Essas diferenças internas não devem virar falsos defeitos por comparar campos de naturezas diferentes.

## Relação com as validações anteriores

Foram consultados `normas-e-inputs.md`, `matematica.md`, `experiencia-de-uso.md`, `arredondamento-2026-09-22.md`, `diagnostico-2026-09-19.md`, `comparacao-idades-2026-09-19.md` e fixtures associadas. As evidências históricas não foram contadas como 30 novas execuções. Esta rodada confirma os limites já anotados para desconto abaixo de 1.500, prêmio adicional estimado e Classe Média/Pró-Cotista; quantifica problemas maiores onde antes havia apenas ressalva. A hipótese de exclusão de adicionais do CESH precisa deixar de ser apresentada como validada contra esses pacotes.

Nenhuma suíte de implementação foi modificada ou executada como substituto da comparação. Foram feitos cálculos de análise com o motor real, conferência aritmética dos registros, validação estrutural do JSON/CSV e inspeção do diff para limitar alterações a `validation/`. A ausência de mudança de código não resolve os achados; eles permanecem pendências documentadas.

## Estado final do navegador

- **CAIXA:** cenário inicial restaurado, renda 21 mil, imóvel novo 780 mil em Ribeirão Preto/SP, cotista, unipessoal e nascimento original restaurado somente em memória/sessão. SBPE empreendimento, balcão, SAC 420; financiamento 530.386,96 e entrada 249.613,04; básico com primeira 6.250,11 e última 1.299,33. Resultado aberto no início das condições, zoom **100%**, CET/CESH recolhidos, sem diálogo de parcelas. Esta é a aba ativa.
- **Projeto:** mesmos inputs originais, incluindo nascimento e data-base **14/09/2026**, SBPE comum, SAC 420, máximo e básico. Financiamento 524.032,93, entrada 255.967,07, primeira 6.176,15, última 1.284,06 e CET 12,26%. A página foi **recarregada para a versão já publicada atual**: o seletor SBPE agora aparece e o CESH passou de 4,8629% da página antiga para 4,8710%. Não é possível restaurar o documento antigo em memória sem reintroduzir código antigo; não foi feito. A aba está na região do resultado, com “Mais opções” e “Ajustar conforme a oferta” expandidos.
- Mesmas duas abas, sessão preservada, histórico do projeto continua com zero testes. Ponte MCP encerrada; Chrome permanece aberto. Nenhum CPF/telefone exportado, contratação, commit, push ou publicação.
