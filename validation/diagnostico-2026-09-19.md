# Comparação das abas reais — 19/09/2026

> Diagnóstico anterior às correções. A conferência adicional nas duas idades e o resultado do motor corrigido estão em [comparacao-idades-2026-09-19.md](comparacao-idades-2026-09-19.md).

Inspecionadas as duas abas já abertas no Chrome do usuário: [nosso site](https://marceloangelopita1.github.io/simula-habitacao/#simular) e [simulador CAIXA](https://simuladorhabitacao.caixa.gov.br/simulacao), versão 1.16.0.2. Foram lidas as 420 parcelas da opção CAIXA RESIDENCIAL HABITACIONAL, os componentes, CET/CESH e os parâmetros expandidos. O acesso ao navegador foi recuperado; este relatório substitui as conclusões preliminares limitadas aos exemplos históricos.

Não foram alterados os parâmetros das simulações abertas nem o código de produção. Os experimentos adicionais rodaram localmente, com o motor que reproduz os resultados exibidos na aba do projeto. Os arquivos publicados de engine.js, app.js e catálogo haviam sido conferidos como idênticos aos locais.

## Valores observados

Ambos: renda R$ 3.578, imóvel usado de R$ 264.000 em Ribeirão Preto/SP, MCMV/FGTS, PRICE/TR, 420 meses, juros nominais 5,50% e efetivos exibidos 5,64%, quota de 80%, seguro básico. A quota não limita este caso: 80% do imóvel equivale a R$ 211.200, acima da capacidade por renda.

| Campo | Nosso site | CAIXA | Nosso − CAIXA |
|---|---:|---:|---:|
| Idade inicial | 38 anos | 28 anos | +10 anos |
| Financiamento máximo | R$ 183.666,32 | R$ 185.653,58 | −R$ 1.987,26 |
| Entrada própria | R$ 80.007,68 | R$ 78.346,42 | +R$ 1.661,26 |
| Subsídio na composição | R$ 326,00 | R$ 0,00 | +R$ 326,00 |
| Primeira parcela, resumo | R$ 1.056,51 | R$ 1.056,51 | R$ 0,00 |
| Última parcela, resumo | R$ 1.011,32 | R$ 1.021,99 | −R$ 10,67 |
| CET exibido | 6,71% a.a. | 6,39% a.a. | +0,32 p.p. |
| CESH exibido | 5,0186% | 2,82% | precisão de tela diferente |
| MIP da primeira linha | R$ 26,43 | R$ 15,77 | +R$ 10,66 |
| DFI da primeira linha | R$ 18,74 | R$ 18,74 | R$ 0,00 |
| Administração mensal | R$ 25,00 | R$ 25,00 | R$ 0,00 |

As datas completas de nascimento foram conferidas na interface; diferem tanto em ano como em mês. O relatório usa as idades, e os experimentos usam nascimento sintético no mesmo mês do perfil oficial. O dia sintético e o original antecedem os vencimentos no dia 19: preservam todas as faixas etárias observadas. Nenhum CPF ou telefone foi persistido nos arquivos desta investigação.

## 1. Idade diferente e tabela de MIP incompleta — confiança alta

O motor usa 0,0144% ao mês para toda idade até 40 anos (`engine.js`, tabela `bands`). O cronograma oficial observado, que começa aos 28 anos, é reproduzido exatamente com:

| Idades observadas | MIP mensal sobre saldo após amortização |
|---|---:|
| 28–30 | 0,0085% |
| 31–35 | 0,0108% |
| 36–40 | 0,0144% |
| 41–45 | 0,0244% |
| 46–50 | 0,0359% |
| 51–55 | 0,0645% |
| 56–60 | 0,0764% |
| 61–63 | 0,1296% |

As duas primeiras faixas estão ausentes do motor. As posteriores já coincidem. A amostra não valida idades anteriores a 28 ou posteriores a 63, nem outras seguradoras/apólices.

**Isolamento:** mantidos principal oficial de R$ 185.653,58, idade e datas oficiais, o motor atual já coincide em todas as 420 prestações de amortização+juros, saldos, DFI e tarifas. Só MIP e total diferem nas primeiras 94 linhas. Com as duas faixas adicionais, os 420 totais e MIPs também coincidem ao centavo, inclusive os reenquadramentos futuros.

**Alterar só o nascimento no motor atual é insuficiente.** Reduz o CET de 6,7105% para 6,4231% e o CESH de 5,0186% para 3,1333%, pois posterga os seguros mais caros. Mas o financiamento permanece em R$ 183.666,32: o coeficiente inicial continua incorretamente igual para 28 e 38 anos.

O cronograma reconstruído produz CESH **2,824569%**, que arredonda aos **2,82%** exibidos pela CAIXA. O CET calculado é **6,388349%**, arredondado a **6,39%**. Neste último, mantida a hipótese já existente no motor: avaliação de 1,5% do principal (R$ 2.784,80) e seguro inicial de R$ 34,52 deduzidos do crédito; crédito líquido R$ 182.834,26. A tarifa de avaliação não foi discriminada separadamente na tela: a coincidência do CET confirma a compatibilidade da hipótese com a precisão exibida, não um valor oficial documentado dessa tarifa.

## 2. Por que a primeira parcela coincide e o principal não — confiança alta neste caso

30% da renda é R$ 1.073,40, exatamente a primeira parcela exibida para o seguro MAIS. O básico fica R$ 16,89 abaixo, em R$ 1.056,51. O motor já reserva esse adicional no cálculo de capacidade, mesmo quando exibe o seguro básico.

Assim, o limite mensal é o mesmo. Como nosso MIP é maior, sobra menos prestação para amortização e juros: R$ 986,32 no site contra R$ 996,99 na CAIXA. O financiamento fica R$ 1.987,26 menor. A última parcela do resumo é a prestação regular de amortização/juros mais R$ 25 de administração, explicando os R$ 10,67 de diferença.

Trocar somente o MIP inicial para 0,0085% no cálculo de capacidade leva a R$ 185.652,75: resta apenas R$ 0,83 frente à CAIXA. Um MIP constante não deve ser usado como correção do cronograma, porque as faixas futuras precisam aumentar com a idade.

## 3. Precisão do máximo explica R$ 0,83 residual — reprodução exata, regra interna inferida

O motor subtrai DFI não arredondado (R$ 18,744) e mantém alta precisão no coeficiente PRICE+MIP. A seguinte convenção reproduz o principal oficial ao centavo:

1. DFI monetário arredondado para R$ 18,74.
2. Capacidade: `1073,40 − 25,00 − 18,74 − 16,89 = 1012,77`.
3. Coeficiente PRICE+MIP: `0,005455162792…`, truncado em oito casas para `0,00545516`.
4. Divisão e truncamento em centavos: `1012,77 / 0,00545516 → 185653,58`.

A hipótese de oito casas e truncamento final já reproduzia quatro registros históricos SAC; este caso PRICE adiciona uma observação independente. Confiança alta na reprodução dos números, moderada para afirmar que este é exatamente o algoritmo interno universal da CAIXA.

## 4. Subsídio: divergência confirmada, causa normativa ainda aberta

No site, o modo efetivamente selecionado é “Estimativa sem área · padrão dos testes”, sem substituição manual. O motor calcula R$ 2.174,918267 antes de redutores; multiplica por 30% (unipessoal) e 50% (usado), chegando a R$ 326,23774 e exibindo R$ 326.

Na CAIXA, a entrada mais o financiamento soma exatamente R$ 264.000: nenhum desconto integra a composição observada. O resumo dos dados também mostra “Possui subsídio: Não”; esse rótulo, isoladamente, não identifica a regra de concessão nem prova se se refere a aporte previamente informado.

O código verifica o mínimo de R$ 1.500 antes dos redutores e já avisa que a ordem precisa de conferência oficial. Aplicar esse corte depois dos redutores seria compatível com o zero observado. **Isso permanece hipótese, não causa comprovada.** A tentativa de consultar o Manual 034 nesta sessão encontrou redirecionamento em ciclo; não foi localizada evidência normativa suficiente para cravar a ordem. As hipóteses de FUH e demais fatores também permanecem limitações do modelo de subsídio.

A decomposição da entrada, porém, é exata: R$ 1.987,26 de financiamento a menos, compensados por R$ 326 de subsídio estimado a mais, deixam **R$ 1.661,26 de entrada própria a mais** no site.

## 5. Resumo versus planilha e soma apresentada

| Campo | Nosso site | CAIXA |
|---|---:|---:|
| Primeira no resumo | R$ 1.056,51 | R$ 1.056,51 |
| Primeira no cronograma | R$ 1.056,49 | R$ 1.056,50 |
| Última no resumo | R$ 1.011,32 | R$ 1.021,99 |
| Última no cronograma | R$ 1.008,44 | R$ 1.021,71 |

O resumo inicial usa o seguro sobre o principal integral e componentes antes de arredondamentos intermediários. A planilha usa o saldo após amortização e valores monetários arredondados. A última linha PRICE liquida o saldo acumulado depois das 420 operações arredondadas; o resumo mostra a prestação regular. A própria CAIXA apresenta essa diferença entre resumo e planilha, reproduzida com o principal oficial.

A CAIXA exibe “Soma das parcelas” de R$ 418.735,52. A leitura das 420 linhas confirma que esse número soma apenas amortização e juros. A soma dos totais das linhas, incluindo MIP (R$ 13.779,13), DFI (R$ 7.852,06) e administração (R$ 10.500), é R$ 450.866,71. Comparações de totais precisam usar a mesma composição; nenhum desses valores inclui custos iniciais de aquisição.

A data do cálculo do site é 14/09/2026, confirmada no painel de ajustes; a planilha oficial vence de 19/10/2026 a 19/09/2061. Nesta comparação, alinhar os cinco dias desloca vencimentos, sem alterar os valores ou os indicadores calculados. Não há aniversário cruzado por essa diferença de dias nos perfis observados.

## Reprodução e evidência

- `node validation/diagnostico-caso-atual-2026-09-19.mjs`: compara as 420 linhas, isola as variáveis, verifica todas as coincidências por assertions e salva os números completos.
- `validation/caixa-price-usado-2026-09-19.json`: cronograma extraído por leitura da interface oficial (17 páginas).
- `validation/diagnostico-caso-atual-2026-09-19.json`: resultados dos experimentos.
- `validation/diagnostico-historico-2026-09-19.md`: etapa preliminar, limitada aos exemplos preservados, anterior à recuperação do acesso ao navegador.

Os testes preexistentes haviam passado (1.200 linhas históricas, 16 verificações matemáticas e 204 de regras/limites). Eles não cobriam contratação aos 28 anos, razão pela qual não detectavam as faixas iniciais de MIP ausentes. O diagnóstico atual foi executado com sucesso, sem modificar o motor publicado.
