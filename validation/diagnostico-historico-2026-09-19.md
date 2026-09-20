# Apêndice histórico — etapa preliminar de 19/09/2026

> Registro da etapa anterior à recuperação do acesso ao Chrome. A investigação das abas foi concluída posteriormente e está em [diagnostico-2026-09-19.md](diagnostico-2026-09-19.md). As limitações de acesso e próximas verificações descritas abaixo refletem apenas aquele momento.

**Escopo: diagnóstico confirmado dos casos históricos do projeto, ainda sem observação das abas atuais do usuário.** Não foram realizadas novas simulações oficiais nesta sessão. Os contrafactuais abaixo foram calculados pelo motor do projeto.

O controle do navegador falhou antes de listar janelas: `node_repl/js` retornou `sandboxCwd is not a local file URI: file:///home/mapita/projetos/simula-habitacao`. A reinicialização do kernel e nova tentativa produziram o mesmo erro. Uma consulta somente de leitura aos processos confirmou Chrome em execução, sem opção de depuração remota na linha de comando. Assim, não foi possível conferir os valores atuais, a versão efetivamente carregada na aba, os parâmetros preenchidos ou qual fluxo do simulador da CAIXA está aberto. Nenhum dado das abas foi inferido a partir dos exemplos.

**Verificações realizadas.** O conteúdo publicado de `engine.js`, `app.js` e `data/municipal-rules.json` coincide byte a byte com os arquivos locais. O manifesto identifica o commit `8c0f6cf094deba1c6b9e10db04ec981739ffddfc`, regras `2026-09-14.piloto.1`. Isso verifica a publicação disponível no servidor; não identifica o conteúdo em cache da aba do usuário. `npm test` passou: 1.200 linhas dos três cronogramas históricos, 16 verificações adicionais e 204 verificações de limites/regras implementadas.

**1. Financiamento máximo: quatro diferenças reais do motor em relação aos registros históricos.**

Todos os casos abaixo usam SAC, 420 meses, um comprador com idade de entrada de 38 anos, sem aportes. Os casos SBPE usam a condição balcão. Os principais oficiais vêm de `validation/matematica.md`; seus resultados completos originais não foram recapturados nesta sessão.

| Caso histórico | Motor atual | CAIXA registrada | Motor − CAIXA |
|---|---:|---:|---:|
| MCMV, renda R$ 6 mil, imóvel R$ 350 mil | R$ 193.949,77 | R$ 193.949,89 | −R$ 0,12 |
| MCMV, renda R$ 3 mil, imóvel R$ 240 mil | R$ 129.966,51 | R$ 129.966,62 | −R$ 0,11 |
| SBPE, renda R$ 6 mil, imóvel R$ 350 mil | R$ 145.734,46 | R$ 145.734,57 | −R$ 0,11 |
| SBPE, renda R$ 10 mil, imóvel R$ 500 mil | R$ 245.931,46 | R$ 245.931,65 | −R$ 0,19 |

O motor mantém alta precisão no coeficiente que converte capacidade mensal em financiamento. No SAC dos casos acima:

`coeficiente = 1/prazo + juros nominais anuais/1200 + taxa mensal MIP/100`

`capacidade mensal = 30% da renda − tarifa − DFI − adicional de seguro de referência`

**Achado novo:** truncar esse coeficiente em oito casas decimais e truncar o quociente final em centavos reproduz exatamente os quatro principais oficiais históricos. Truncar significa descartar os dígitos restantes, sem arredondar para cima.

Exemplo MCMV/renda R$ 6 mil: capacidade mensal de R$ 1.727,76; coeficiente preciso `0,008908285714…`. O motor chega a R$ 193.949,77. Com coeficiente `0,00890828`, o quociente passa a `193949,898296…`; o truncamento em centavos resulta em R$ 193.949,89. Arredondar normalmente o valor final daria R$ 193.949,90, portanto as duas etapas da hipótese importam.

**Confiança:** alta na reprodução matemática desses quatro registros; moderada na identificação da regra interna da CAIXA. A hipótese foi formulada com essa mesma amostra, não validada em novos casos. Diferentes implementações internas podem produzir os mesmos números. Não há fundamento para declarar confirmada uma regra universal ou aplicá-la ao PRICE sem confronto adicional.

**2. Resumo e cronograma não representam exatamente o mesmo encargo.**

Nos três exemplos distribuídos, o motor atual coincide com os resumos históricos e com cada linha dos cronogramas preservados. Existe diferença entre apresentações dentro do próprio resultado:

| Caso | Primeira no resumo | Primeira no cronograma | Última no resumo | Última no cronograma |
|---|---:|---:|---:|---:|
| MCMV SAC | R$ 1.777,61 | R$ 1.777,55 | R$ 489,74 | R$ 489,73 |
| MCMV PRICE | R$ 1.407,70 | R$ 1.407,69 | R$ 1.354,92 | R$ 1.352,67 |
| SBPE PRICE com salário | R$ 2.370,38 | R$ 2.370,36 | R$ 2.299,56 | R$ 2.306,34 |

No resumo inicial, o MIP usa o principal integral e os componentes são somados antes do arredondamento monetário final. No cronograma, o MIP usa o saldo depois da amortização da parcela, e os componentes têm arredondamentos intermediários. No MCMV SAC, por exemplo, o MIP sobre o principal é R$ 27,93; na primeira linha é R$ 27,86. A diferença de R$ 0,06 no total combina essa mudança de base com a ordem de arredondamento.

No PRICE, a última parcela do cronograma liquida o saldo remanescente após centenas de operações arredondadas. O resumo usa a prestação regular de amortização/juros acrescida da tarifa. No SBPE PRICE, isso explica os R$ 6,78 a mais na última linha; no MCMV PRICE, o ajuste é de R$ 2,25 a menos. Esses pares já existem nas referências oficiais: comparar resumo de um lado com cronograma do outro cria uma divergência mesmo quando os algoritmos reproduzem a referência.

**Confiança:** alta para os casos preservados. A explicação está no código e foi confrontada com as linhas históricas, mas não identifica quais campos estão abertos nas abas atuais.

**3. Duas casas de juros na tela não significam duas casas no cálculo.**

No exemplo SBPE PRICE com salário, o motor usa `10,6540% a.a.` nominais e mostra `10,65%`. Mantendo principal de R$ 245.560,88, prazo de 360 meses e os demais dados:

| Taxa nominal utilizada | Primeira no resumo | Última no resumo |
|---|---:|---:|
| Automática: 10,6540% | R$ 2.370,38 | R$ 2.299,56 |
| Manual: 10,6500% | R$ 2.369,64 | R$ 2.298,83 |

A primeira diferença é R$ 0,74 e a última do resumo é R$ 0,73. A taxa interna de 10,6540% reproduz os juros do cronograma histórico inteiro; digitar apenas o número abreviado da tela muda efetivamente o parâmetro. Isso não estabelece que todas as ofertas atuais usam essa mesma taxa. A hipótese também não resolve automaticamente os resumos SBPE SAC de um centavo registrados na auditoria anterior, para os quais faltam cronogramas completos no repositório.

**4. Seguro, aniversário e tarifas alteram valores diferentes do resultado.**

Experimentos no motor, mantendo o principal MCMV de R$ 193.949,89:

| Única alteração em relação ao caso básico | Primeira no resumo | CET | CESH |
|---|---:|---:|---:|
| Nenhuma | R$ 1.777,61 | 9,0491% | 4,4945% |
| Seguro Mais | R$ 1.800,00 | 9,2526% | 4,4945% |
| Nascimento sintético de 01/02/1988 para 01/09/1988; ambos 38 anos | R$ 1.777,61 | 9,0265% | 4,3427% |
| Tarifa de avaliação de R$ 2.909,25 para zero | R$ 1.777,61 | 8,8499% | 4,4945% |

O adicional do seguro Mais é de R$ 22,39 por mês nesse exemplo. O CESH permanece igual porque inclui apenas MIP e DFI, enquanto o CET incorpora o adicional. A CAIXA explica as bases de MIP/DFI em suas [perguntas frequentes](https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-novos-financiamentos/Paginas/default.aspx); a [SUSEP](https://www.gov.br/susep/pt-br/assuntos/meu-futuro-seguro/seguros-previdencia-e-capitalizacao/seguros/seguro-habitacional) confirma a exclusão de coberturas facultativas do CESH e a possibilidade de reenquadramento etário conforme a apólice.

A data de nascimento completa importa mesmo quando a idade atual parece igual: o mês dos reenquadramentos futuros muda os prêmios e o valor presente do seguro. Os nascimentos dos exemplos do site são sintéticos. Os coeficientes do motor foram calibrados na idade de entrada de 38 anos, portanto equivalência com outras apólices/idades ainda precisa de validação oficial.

O motor também reserva um adicional de referência ao calcular a capacidade máxima, mesmo com seguro básico selecionado. Por isso o principal pode permanecer igual quando se troca Básico por Mais, enquanto a prestação sobe de R$ 1.777,61 para R$ 1.800,00. Essa reserva é uma hipótese explícita implementada no projeto, não uma regra interna universal da CAIXA confirmada nesta sessão.

A tarifa de avaliação entra como custo inicial no CET, sem alterar a prestação. No projeto, ela é estimada em 1,5% do financiamento MCMV, salvo dispensa/ajuste, e R$ 841,44 no SBPE. Não foi confirmada a aplicabilidade dessas tarifas às abas atuais.

**5. Convenção de datas e data-base.**

No MCMV SAC histórico, CET com meses iguais é 9,0491%; usando dias corridos/365, 9,0437%. No SBPE PRICE, os valores são 12,1245% e 12,1172%. Os CETs oficiais preservados coincidem com a convenção mensal implementada. Isso não determina a formação de todos os fluxos internos do banco.

Trocar apenas a data da simulação de 14/09/2026 para 19/09/2026, nos três perfis sintéticos preservados, não alterou os valores monetários, CET ou CESH; mudou somente as datas. Portanto essa mudança específica de cinco dias não explica divergências nesses três exemplos. Em outras datas/perfis, aniversários e diferentes intervalos entre vencimentos podem ter efeitos. As regras comerciais do site continuam com data-base fixa de 14/09/2026.

**Próxima verificação necessária para concluir o caso atual.** Observar as abas e registrar o mesmo fluxo da CAIXA, produto, principal, prazo efetivo, taxa interna, apólice, nascimento completo, avaliação e tarifas. Depois comparar resumo com resumo e planilha com planilha. Para validar a hipótese nova do máximo, obter resultados oficiais ainda não utilizados na investigação, variando renda, prazo e idade, inclusive casos em que a quota limite o financiamento.

O código de produção não foi alterado. Reprodução local: `node validation/diagnostico-2026-09-19.mjs`. Os resultados completos ficam em `validation/diagnostico-2026-09-19.json`.
