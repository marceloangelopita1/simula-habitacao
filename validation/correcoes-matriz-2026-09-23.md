# Correções da matriz CAIXA — 23/09/2026

**Implementação local `2026-09-23.piloto.1`, com OK independente para A1–A5.** As diferenças materiais identificadas na [matriz de 30 cenários](comparacao-matriz-2026-09-22.md) foram corrigidas nos perfis observados. O [parecer independente](revisao-independente-2026-09-23.md) registra o escopo, os hashes e as verificações próprias do revisor. Permanecem resíduos menores e premissas empíricas descritos abaixo.

A alteração de código foi autorizada depois da análise original. Foram modificados motor, textos da interface, testes de regressão e documentação. Não houve commit, push, publicação nem alteração de configuração. O relatório, JSON e CSV de 22/09 preservam os resultados **anteriores** às correções; não foram transformados em registros retrospectivos de sucesso.

## Resultado por achado

Valores em reais, salvo percentuais. “Atual” usa os mesmos inputs e a mesma data-base **22/09/2026**, inclusive máximo versus principal fixado. A origem oficial continua sendo o campo `observed` da captura anterior; não houve nova execução da CAIXA nesta etapa. O [JSON posterior às correções](resultado-correcoes-2026-09-23.json) reúne as 358 métricas comparáveis dos 30 casos e seus resíduos assinados.

| Achado / controle | Antes | Atual | CAIXA | Impacto e confiança |
|---|---:|---:|---:|---|
| A1 · S25 Classe Média PRICE, máximo | 427.408,25 | 434.062,64 | 434.062,64 | Corrige subestimação de 6.654,39 no financiamento e o mesmo excesso na entrada; alta na amostra |
| A1 · S28 Classe Média SAC, máximo | 344.132,65 | 349.412,61 | 349.412,61 | Corrige subestimação de 5.279,96; alta na amostra |
| A1 · S27 MIP da parcela 211, principal 360 mil | 468,84 | 233,66 | 233,66 | Corrige excesso de 235,18 nessa parcela; alta na linha observada |
| A2 · S17 usado unipessoal, subsídio | 326,00 | 0,00 | 0,00 | Corrige entrada subestimada em 326,00; alta neste perfil |
| A2 · S19 novo com dependentes, subsídio | 2.175,00 | 2.174,00 | 2.174,00 | Remove excesso de um real na estimativa; alta nos seis descontos positivos observados |
| A3 · S21 MCMV empreendimento, CET | 5,39% | 4,69% | 4,69% | Corrige diferença de 0,70 pp; alta na reprodução, moderada na composição inferida do fluxo |
| A3 · S10 Pró-Cotista, CET | 9,88% | 10,06% | 10,06% | Corrige custo inicial presumido na comparação; moderada para generalizar |
| A4 · S02 SBPE empreendimento Especial, CESH | 4,86% | 5,99% | 5,99% | Inclui os prêmios adicionais; alta na precisão exibida |
| A4 · S09 SBPE comum Ampliado, CESH | 4,87% | 7,72% | 7,72% | Corrige omissão material no indicador; alta na precisão exibida |
| A5 · S02 primeira linha, DFI + Especial | 101,37 | 101,40 | 101,40 | Separa prêmio da planilha e referência do resumo; alta nas linhas lidas |
| A5 · S09 primeira linha, DFI + Ampliado | 175,33 | 175,50 | 175,50 | Corrige 0,17 por parcela observada; constância no prazo completo ainda estimada |

### A1 — seguro e capacidade da Classe Média

A Classe Média passa a usar a tabela MIP compatível com os perfis MCMV observados, DFI de 0,0071% ao mês e adicional de referência da capacidade de `valor do imóvel × 0,00006396`. Esse adicional de referência continua fora das cobranças do seguro básico. Os cinco máximos S25–S29 conferem ao centavo. A primeira de S25/S26 ainda difere em um centavo; não foi ajustada artificialmente.

O teste de S27 confere tanto o reenquadramento do MIP na parcela 211 quanto a liquidação na parcela 420. A última do resumo, 3.119,82, difere da última real, 3.122,50; cada uma é comparada ao campo correspondente da CAIXA. A conferência da Classe Média é para entrada aos 38 anos, nas cidades e modalidades capturadas; outros perfis permanecem estimativas.

### A2 — mínimo e precisão do subsídio

O mínimo automático é aplicado **depois** dos redutores de composição familiar e imóvel usado, zerando os descontos pequenos indevidos em S14–S18. O modo sem área trunca para reais inteiros e reproduz S19–S24; o modo com área mantém centavos. O subsídio manual continua aceitando desconto confirmado abaixo de 1.500, respeitando as demais condições e tetos.

O ponto exato de 1.500 é uma hipótese compatível com os resultados, não uma fronteira comprovada por testes oficiais de 1.499/1.500/1.501. O aviso no produto mantém essa limitação. Os testes sintéticos de mínimo verificam a política adotada; não ampliam a evidência externa.

### A3 — fluxo do CET e tarifa estimada

O crédito inicial do fluxo passa a ser **financiamento + subsídio − avaliação estimada − seguro inicial**. A interface mostra esse crédito nos detalhes e explica a estimativa. O CET mensal comparável e o indicador por datas corridas usam a mesma composição.

Nas linhas FGTS do piloto (MCMV, Classe Média e Pró-Cotista), o custo inicial padrão passa a 1,5% do principal. A simples vinculação MCMV a empreendimento não presume isenção; tarifa informada manualmente, inclusive zero, prevalece. SBPE comum e empreendimento mantêm seus perfis separados. O valor de 1,5% foi reconstruído a partir dos CETs, **não discriminado como cobrança na tela oficial**. Sua aplicação a outros perfis requer confirmação.

Isso também muda a interpretação de registros antigos com `linkedProject=true`: ao reabrir e recalcular, vinculação por si só não zera a avaliação. Para conservar uma isenção confirmada, informar zero no ajuste de tarifa. O snapshot histórico permanece preservado com sua versão original; salvar uma nova simulação usa a versão atual.

### A4 e A5 — CESH e adicionais do SBPE

O CESH considera MIP, DFI e adicional efetivamente lançado no cronograma, descontados nas respectivas datas. Foram removidas as mensagens que afirmavam exclusão dos adicionais.

No SBPE, os coeficientes do adicional da planilha passam a 0,000064 para Especial e 0,000159 para Ampliado, sobre o valor de compra. DFI e adicional são combinados antes do arredondamento. No imóvel de 780 mil, isso gera adicionais de 49,92 e 124,02 na planilha, preservando 49,89 e 123,85 nas referências do resumo/capacidade. O adicional é zero na parcela de liquidação. A distinção evita alterar indevidamente o máximo ao corrigir o cronograma.

Não foram estendidos esses novos coeficientes aos pacotes de outras modalidades sem captura equivalente. A projeção constante em meses ainda não observados permanece identificada como hipótese.

## Verificação e diferenças preservadas

`npm test` e `npm run build` passaram na revisão independente. A suíte mantém as regressões históricas e acrescenta `tests/matrix.mjs`: **30 cenários, 358 métricas numéricas e nove linhas oficiais**, além de controles de seguro, tarifa/isenção, subsídio manual, DFI manual e composição de recursos. As expectativas usam os valores oficiais capturados, nunca `ours` como referência. Resíduos conhecidos são declarados por caso/campo, sem tolerância global que esconda diferenças novas.

O revisor recalculou o valor presente dos 30 fluxos sem chamar a função de CET do motor, executou 17 controles adicionais de ajustes e comparou 16 perfis SBPE básico com a revisão anterior. Seu resultado foi: principal/entrada exatos em **26/30**, subsídio em **30/30**, primeira do resumo em **25/30**, última em **23/30**, CET em **27/28** e CESH em **28/28**, à precisão oficial. S04 e S18 continuam sem CET/CESH oficiais.

O implementador executou os testes locais de interface `tests/matrix-ui.mjs` e `tests/sbpe-ui.mjs`, aprovados em Chromium isolado: Classe Média, subsídio, CET, tarifa/isenção, seguro Especial, CESH, cronograma, histórico e larguras de 320/390/768 px. Não houve erro JavaScript nem overflow global nos estados examinados. Reprodução, com Playwright disponível no ambiente e servidor local iniciado:

```sh
npm test
npm run build
SIMULA_URL=http://127.0.0.1:4173 node tests/matrix-ui.mjs
SIMULA_URL=http://127.0.0.1:4173 node tests/sbpe-ui.mjs
```

Se Playwright estiver fora do projeto, informar seu módulo pela variável `PLAYWRIGHT_MODULE`, como já suportado pelo teste SBPE. Nenhuma dependência ou configuração do projeto foi alterada para essa execução.

Diferenças que permanecem:

- Máximo SBPE comum: −0,86 em S07/S08/S09/S30, com +0,86 na entrada.
- CET S08: 12,42% versus 12,43%, sem causa confirmada.
- Nominal SBPE exibida: 10,93% versus 10,92%, mantendo a precisão interna usada no cálculo; hipótese de convenção de apresentação.
- Primeiras/últimas do resumo: resíduos de um centavo em alguns casos.
- Soma amortização + juros: resíduos de −3,31 a +2,01. A precisão e o ajuste SAC final são explicações possíveis, sem confirmação integral por novo cronograma completo de cada caso.

Esses resíduos continuam registrados no JSON e nos testes. O OK independente aprova as correções materiais e sua integração ao piloto, sem afirmar igualdade universal ou fechar as causas ainda não verificadas.

## Navegador e entrega

O Chrome do usuário não foi acessado nem alterado nesta etapa de implementação. Os testes usaram processos Chromium locais isolados, encerrados ao terminar. O estado conhecido da sessão real continua sendo o [estado final da análise de 22/09](comparacao-matriz-2026-09-22.md#estado-final-do-navegador): CAIXA em SBPE empreendimento, SAC 420, renda 21 mil, imóvel novo 780 mil, seguro básico; aba do projeto com os inputs originais e data-base 14/09. Esse estado não foi recapturado em 23/09.

Ao encerrar esta etapa de implementação e validação, o build havia sido gerado somente em `dist/`, ignorado pelo Git, e a versão publicada ainda não continha estas correções. Commit, push e publicação posteriores dependiam de autorização separada.
