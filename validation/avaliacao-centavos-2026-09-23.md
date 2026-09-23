# Avaliação de resultados — data-base e centavos

**Parecer: aprovado para uso local no escopo observado, com oito resíduos conhecidos e sem regressões nas métricas oficiais examinadas.** Versão `2026-09-23.piloto.2`, avaliada em 23/09/2026. [Plano executado](../docs/plano-centavos-2026-09-23.md).

A avaliação confronta valores externos preservados e fluxos de interface; não usa resultados do motor para fabricar expectativas. Foi conduzida nesta mesma tarefa, sem um segundo revisor ou nova captura da CAIXA nesta etapa de implementação. Portanto, constitui uma avaliação por referências independentes do cálculo, não um parecer de outra pessoa/agente nem confirmação bancária. A matriz anterior também foi usada para verificar a integração e identificar a distinção do total financeiro; não é apresentada como uma amostra cega posterior a todos os ajustes.

## Evidência e resultado

A revisão anterior é o commit `2fa1025451ee7578b5f6aa894b5724ccbd9648e7`, versão `2026-09-23.piloto.1`. O mesmo auditor foi executado antes e depois. As observações antigas da CAIXA não foram editadas. Os novos dados vieram da [investigação anterior à implementação](investigacao-centavos-2026-09-23.md).

| Conjunto | Registros | Métricas exatas antes | Métricas exatas depois |
|---|---:|---:|---:|
| centavos-2026-09-23 | 8 | 26/48 | 48/48 |
| arredondamento-2026-09-22 | 8 | 35/37 | 36/37 |
| sbpe-2026-09-22 | 7 | 47/52 | 52/52 |
| matriz-independente | 30 | 310/358 | 351/358 |
| Total | 53 | 418/495 | 487/495 |

São 53 registros de referência, com sobreposição de cenários entre arquivos. Os números não representam 53 experimentos independentes. A coincidência passa de 84,44% a 98,38% à precisão de cada referência. Nenhuma métrica passou de exata para divergente ou aumentou sua diferença absoluta.

No conjunto original de oito cenários, financiamento, entrada, primeira/última parcela e primeiras dos pacotes Especial/Ampliado coincidem em 48/48 métricas. Os modos por principal fixo e por entrada também reproduzem os valores oficiais. A regressão do cronograma usa o máximo calculado pelo próprio motor: todas as 420 linhas coincidem, sem precisar substituir o financiamento manualmente.

Na matriz de 30 casos:

| Campo | Coincidências |
|---|---:|
| Financiamento | 30/30 |
| Entrada | 30/30 |
| Taxa nominal apresentada | 30/30 |
| Primeira do resumo | 26/30 |
| Última do resumo | 28/30 |
| Soma financeira comparável | 28/28 |
| CET | 27/28 |
| CESH | 28/28 |

S04 e S18 não têm CET/CESH oficiais nessa matriz; ausência de referência não conta como acerto.

## Data-base

Novas simulações e a API, quando não recebem data, usam o dia civil local. O modo automático atualiza a data ao recalcular, retomar a aba e pela conferência periódica. Se o dia mudou, o resultado anterior é marcado como desatualizado. Usar UTC para preencher o campo foi evitado, pois avançaria a data antes da meia-noite brasileira.

A escolha explícita de uma data permanece fixa. Exemplos históricos mantêm 14/09/2026 e seus valores oficiais; um teste salvo conserva sua data e seu snapshot. O botão “Usar hoje” retoma a atualização automática. A legenda apresenta também dia/mês/ano, pois o formato visual do controle nativo depende do navegador.

Os testes cobrem abertura, limpeza, meia-noite em São Paulo, relógio avançado antes da submissão, retorno à aba, 29 de fevereiro, fuso UTC+14, data manual, três exemplos, histórico, comparação, CSV e telas de 320/390/768 pixels. A data atual não representa atualização automática das taxas comerciais pesquisadas.

## Cálculo e apresentação

- O coeficiente SBPE comum adotado é `0,000158774`, compatível com o intervalo identificado na investigação. O adicional do seguro Ampliado acompanha essa referência. Isso elimina o desvio de R$ 0,86 nos casos observados sem uma correção fixa por centavos.
- Os resumos SAC usam a precisão intermediária sustentada pelos 21 pares iniciais. Na soma dos seguros, os prêmios são combinados antes do desempate para par. PRICE preserva o adicional em centavos; a referência S04 impede estender indiscriminadamente a regra SAC.
- O nominal apresentado é truncado para duas casas (10,92% neste perfil), enquanto os juros continuam usando 10,9259%. A comparação da interface usa a apresentação; os detalhes e os registros mantêm a taxa de cálculo.
- A soma financeira de comparação SAC usa a amortização mensal constante somada aos juros. O acerto residual da última amortização permanece na planilha. Essa distinção explica integralmente os resíduos das 28 somas da matriz, inclusive casos de +R$ 0,05 a +R$ 2,01 após igualar o principal. PRICE conserva a soma efetiva. A interface identifica os dois totais.

A alteração não modifica o laço que calcula juros, amortização, saldos, seguros e liquidação de cada parcela. Isso foi conferido no diff e nas referências completas e parciais. CET e CESH continuam derivados do cronograma efetivo.

## Diferenças remanescentes

Sinais significam “motor menos CAIXA”. As tolerâncias estão restritas aos campos/casos correspondentes; não existe tolerância global de um centavo.

| Referência | Campo | CAIXA | Motor | Diferença |
|---|---|---:|---:|---:|
| MCMV `max-314000` | Primeira, seguro Mais | 1.800,00 | 1.799,99 | −0,01 |
| S08 | CET (%) | 12,43 | 12,42 | −0,01 pp |
| S25 | Primeira, Classe Média PRICE | 3.861,63 | 3.861,62 | −0,01 |
| S26 | Primeira, Classe Média PRICE | 3.861,63 | 3.861,62 | −0,01 |
| S29 | Primeira, Classe Média SAC 240 | 3.861,61 | 3.861,62 | +0,01 |
| S29 | Última, Classe Média SAC 240 | 1.285,68 | 1.285,69 | +0,01 |
| S30 | Primeira, SBPE usado | 3.804,74 | 3.804,73 | −0,01 |
| S30 | Última, SBPE usado | 797,03 | 797,02 | −0,01 |

As causas desses resíduos não foram demonstradas por esta implementação. Não foram criadas exceções por cenário para removê-los. O coeficiente interno exato do banco e o desempate da terceira casa continuam indeterminados pelas capturas. A regra reproduz a amostra estudada, sem justificar igualdade universal em modalidades, seguros e perfis ainda não observados.

## Validação executada

- `npm test`: aprovado; referências de 3.010 linhas de cronogramas completos e 19 linhas parciais, incluindo as 420 novas, além das verificações matemáticas, de limites, capacidade, seguros e matriz.
- `tests/centavos-ui.mjs`: aprovado; 35 verificações, CSV de 420 linhas confrontado com a captura oficial, sem erros JavaScript.
- `tests/matrix-ui.mjs`: aprovado; Classe Média, subsídio, CET, tarifa/isenção, Especial, CESH, cronograma, histórico e três larguras.
- `tests/sbpe-ui.mjs`: aprovado; seleção de modalidade, SAC/PRICE, histórico, MCMV e três larguras.
- `npm run build`: aprovado; oito arquivos de execução preparados em `dist/`, com versão e hashes em `release.json`.
- `git diff --check`: aprovado. As observações oficiais antigas permanecem intactas.

As suítes de interface usaram Chromium isolado em `http://127.0.0.1:4175`. O Chrome e as simulações abertas do usuário não foram modificados nesta etapa. Os processos de teste foram encerrados. A avaliação abrange código e build locais; não houve publicação.

Reprodução dos testes de interface: inicie o servidor local e defina `SIMULA_URL`. Quando o pacote Playwright estiver fora do caminho padrão, defina `PLAYWRIGHT_MODULE` para seu `index.mjs`. A aplicação não recebeu dependência de runtime adicional.

## Arquivos de evidência

- [Auditoria anterior](avaliacao-centavos-antes-2026-09-23.json) e [auditoria posterior](avaliacao-centavos-2026-09-23.json).
- [Oito cenários oficiais](caixa-centavos-2026-09-23.json) e [420 linhas oficiais](caixa-centavos-parcelas-2026-09-23.json).
- [Auditor por referências](../scripts/audit-centavos.mjs), [regressões de cálculo](../tests/centavos.mjs) e [regressões de interface](../tests/centavos-ui.mjs).

Hashes SHA-256 da implementação avaliada:

- `engine.js`: `1fc38c3f1be3bdb2b70bda71f54d39ac11edb4c9b0832c97ef36df51c6bdac48`
- `app.js`: `31d759d7f68c4fceea41de896d0dfa687ac5d0d9764fe07f9fe4f3d84ff70fd2`
- `index.html`: `7a0e6ab3daf5248d0290874c35e221fe022d3925658fad81285ae9c7520a8d56`
