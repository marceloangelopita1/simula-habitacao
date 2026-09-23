# Revisão independente das correções — 23/09/2026

**Parecer: OK para a implementação das correções A1–A5, no escopo e nas referências descritos abaixo.** Não encontrei defeito bloqueador introduzido pelas mudanças. Este parecer não significa igualdade integral com a CAIXA nem homologação de perfis não observados.

A revisão foi realizada por um agente separado daquele que implementou as mudanças. Li `AGENTS.md`, o [relatório da matriz](comparacao-matriz-2026-09-22.md), seu [JSON](comparacao-matriz-2026-09-22.json), o motor completo, os diffs de `engine.js`, `app.js`, `index.html` e dos testes, incluindo `tests/matrix.mjs` e o novo teste de UI. Não alterei implementação ou testes, não usei o Chrome do usuário e não recapturei resultados oficiais. A fonte externa foi exclusivamente `observed`; `ours` permanece registro do motor anterior e não foi usado como oráculo.

Versão revisada: `2026-09-23.piloto.1`, sobre a revisão Git `1a8f3e842fb376e764e08f1023af7c360fa1499e`. SHA-256 dos arquivos de execução inspecionados:

| Arquivo | SHA-256 |
|---|---|
| `engine.js` | `2367cf4b0e33428e7d189b882c740800bf80bbb15bbadcf88b8a8023ae938139` |
| `app.js` | `f564af3f146b1580cb50c471a5206b9c0359f7d4922eae9a3b7240f34a9d584d` |
| `index.html` | `061120670e7690ffc48ba2d40ebd2ead7c355bf4c854071e58d1490a21c8fa97` |

## Correções examinadas

| Achado original | Resultado da revisão |
|---|---|
| A1 — seguro e capacidade da Classe Média | `middle` passa a usar a tabela MIP e o DFI compatíveis com as linhas oficiais capturadas e reserva de referência de 0,00006396. Os cinco principais S25–S29 coincidem ao centavo; CESH e CET coincidem na precisão oficial. A linha 211 de S27 passa a ter MIP de 233,66, compatível com o saldo e o coeficiente observado. A reserva continua fora da cobrança do seguro básico. |
| A2 — mínimo após redutores e truncamento do subsídio | S14–S18 passam a zero; os seis descontos positivos S19–S24 coincidem com os oficiais. O mínimo é aplicado à estimativa após redutores; o modo manual continua aceitando valores oficiais abaixo do mínimo automático. O truncamento para reais inteiros fica no modo sem área, preservando os centavos do modo com área. |
| A3 — subsídio e custo inicial no CET | O crédito usado no fluxo passa a incluir o subsídio. O custo de 1,5% é aplicado nas linhas FGTS, sem inferir isenção do checkbox MCMV; SBPE preserva seus perfis separados. S10 e S19–S29 reproduzem o CET observado a duas casas. A isenção e a tarifa manual permanecem funcionais. |
| A4 — adicionais no CESH | O fluxo inclui o adicional efetivamente cobrado no cronograma. Os cinco indicadores de pacotes adicionais S02/S03/S06/S08/S09 reproduzem a precisão oficial. As mensagens que antes afirmavam exclusão dos adicionais foram corrigidas. |
| A5 — resumo/capacidade versus cronograma SBPE | Os coeficientes de resumo e capacidade foram preservados; a planilha usa incremento distinto, produzindo DFI/DFC de 101,40 e 175,50 no imóvel de 780 mil. O adicional termina antes da liquidação. Os trechos oficiais registrados são conferidos com principal fixado, isolando o resíduo de capacidade. |

As mensagens do produto reconhecem que a tarifa de avaliação é uma hipótese de comparação e permitem informar tarifa ou isenção confirmada. O aviso de Classe Média limita a conferência aos perfis observados; os adicionais mantêm aviso sobre os meses não capturados. Não identifiquei apresentação dessas reconstruções como tarifa contratual universal confirmada.

## Verificações executadas pelo revisor

- `npm test`: passou, incluindo 204 verificações de fronteira, cronogramas históricos, seguros/idades, arredondamento, SBPE e matriz. A nova matriz verifica 358 métricas numéricas e nove linhas oficiais preservadas, sem utilizar os resultados `ours` como expectativa.
- `npm run build`: passou; oito arquivos de execução gerados em `dist/`.
- `git diff --check`: passou.
- Reexecutei os 30 inputs em script separado da suíte e confrontei diretamente as observações. Principal e entrada coincidem em **26/30**; subsídio em **30/30**; primeira parcela do resumo em **25/30**; última em **23/30**; CET em **27/28** e CESH em **28/28**, indicadores arredondados à precisão oficial. Os dois indicadores ausentes em S04/S18 continuam ausentes.
- Recalculei separadamente o valor presente dos 30 fluxos, sem chamar `computeCet`: o maior resíduo entre crédito considerado e PV ao CET informado foi **R$ 5,83 × 10⁻¹⁰**. Recalculei o CESH com os prêmios mensais e datas; diferença numérica máxima **1,78 × 10⁻¹⁵ pp**. Isso valida a consistência do fluxo implementado, não estabelece a fórmula contratual interna da CAIXA.
- Executei **17 controles adicionais** com tarifa manual de zero/500, apólice manual com MIP/DFI zero, DFI manual e subsídio manual de 999,99. Tarifas não alteraram o cronograma; apólice zerada produziu CESH zero; subsídio manual foi preservado na entrada e no crédito do CET.
- Comparei o motor atual com `HEAD:engine.js` em **16 perfis SBPE básico**, combinando comum/empreendimento, SAC/PRICE, idades de 38/69 e imóveis de 400/780 mil. Cronogramas, capacidade, indicadores, custos e resumos permaneceram idênticos. Esse controle não é validação externa dos perfis combinados; verifica ausência de regressão fora das mudanças de adicionais.

O novo teste de UI foi inspecionado, mas não executado por este revisor; a validação local da interface é uma verificação separada do implementador. O parecer sobre os cálculos não depende de declarar essa execução como independente.

## Limitações e diferenças que permanecem

Não há achado P1/P2 bloqueador novo na implementação revisada. Permanecem diferenças menores, explicitamente mantidas nas expectativas de regressão: financiamento SBPE comum **−R$ 0,86** (quatro cenários), CET de S08 **−0,01 pp**, nominal exibida SBPE **+0,01 pp**, primeiras/últimas com resíduos de **R$ 0,01** e totais de amortização + juros com resíduos entre **−R$ 3,31 e +R$ 2,01**. Essas diferenças não foram tratadas como igualdade nem ocultadas por tolerância global.

O mínimo exato de R$ 1.500 após redutores continua uma inferência compatível com os zeros observados, sem sondagem externa de 1.499/1.500/1.501. O custo inicial de 1,5% e a inclusão do subsídio no crédito são reconstruções compatíveis com os CETs, não discriminação de uma cobrança confirmada na tela. A constância dos adicionais em meses não capturados também permanece hipótese. Os avisos e ajustes manuais reduzem o risco de apresentar essas premissas como universais; novas capturas são necessárias antes de ampliar a alegação de cobertura.

A aprovação abrange a correção dos desvios materiais documentados e sua integração ao piloto. Não abrange confirmação bancária de todas as faixas etárias, outras apólices, dois segurados, todos os municípios, saque positivo de FGTS, SFI ou novas ofertas comerciais. Nenhum commit, push ou publicação foi realizado pelo revisor.
