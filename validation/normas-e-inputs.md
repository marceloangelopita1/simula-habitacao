# Parecer independente da implementação normativa

> Atualização de escopo em 23/09/2026: a [matriz oficial de 30 cenários](comparacao-matriz-2026-09-22.md) motivou [correções posteriores](correcoes-matriz-2026-09-23.md), incluindo mínimo automático do subsídio após redutores e tarifa inferida para comparação do CET. Essas hipóteses empíricas e suas limitações constam do [parecer independente atual](revisao-independente-2026-09-23.md); não são uma nova homologação normativa abrangida pelo parecer histórico abaixo.

**Resultado: APROVADO para uso como piloto local de estimativa, comparação e registro de divergências.** Revisão concluída em 14/09/2026 após inspeção do código efetivamente executado e dos controles do site em `http://127.0.0.1:4173`. Não restam correções normativas impeditivas identificadas nesta revisão. Esta aprovação não é homologação bancária nem afirma equivalência universal aos resultados da CAIXA.

## Evidência de execução

- **204 verificações do motor, todas aprovadas**, registradas em `boundary-results.json`; execução reproduzível: `node work/site-validation-normativa/test-boundaries.mjs`.
- **11 verificações no navegador, todas aprovadas**, registradas em `ui-results.json`; execução reproduzível: `node work/site-validation-normativa/check-ui.cjs`.
- Catálogo com **5.571 municípios, 27 UFs, códigos IBGE únicos e fatores necessários preenchidos**. Ribeirão Preto: teto popular R$ 264.000, F_pop 1,10 e FD_SP 2,07. As duas divergências da reconstrução auxiliar de tetos (Caieiras e Mairiporã) continuam registradas no arquivo de validação do catálogo; prevalece o valor publicado na coluna AA do arquivo oficial.

Os 204 testes incluem 140 combinações de fronteiras de juros, região e condição de cotista, além de 64 verificações de enquadramento, quotas, subsídios, recursos, idade e integridade do catálogo. Não se trata de 204 simulações oficiais da CAIXA. O navegador foi usado nesta etapa apenas no site local.

## O que foi conferido

1. Faixas de renda e juros nominais por região/cotista; exceção de imóvel acima do teto municipal até R$ 400 mil com juros da Faixa 3 e sem descontos; limites atuais da Classe Média sem importar os cabeçalhos nacionais antigos da planilha municipal.
2. Quotas distintas: MCMV novo com padrão de 80% baseado nos testes; usado sem reutilizar automaticamente o antigo limite de 65%; Classe Média usado no Sul/Sudeste limitado a 60%; demais situações da Classe Média com limites SAC/PRICE de 90%/80%; Pró-Cotista usado limitado a 50% e renda até R$ 12 mil. A quota operacional MCMV usado permanece explicitamente não homologada.
3. Subsídio pela expressão normativa, fator financeiro negativo preservado, FUH de casa/apartamento limitado entre 0 e 10, teto regional/CCI antes dos redutores, unipessoal e usado com cumulação, limite de renda de R$ 4 mil para complemento e mínimo da fórmula de R$ 1.500. As hipóteses sobre FUH zero, inteiros, piso financeiro e mínimo após redutores permanecem identificadas.
4. Reproduções específicas: R$ 8.697 familiar e R$ 2.609 unipessoal no modo sem área; R$ 9.187,16 no exemplo normativo com apartamento de 50 m². Os dois primeiros são compatíveis com os testes oficiais anteriores; o terceiro é exemplo da fórmula, não resultado oficial comprovado.
5. Subsídio manual não ultrapassa o teto aplicável após redutores. O campo separado de comparação **aceita valor oficial divergente**, demonstrado no navegador com R$ 65 mil em SP, sem tratá-lo como subsídio normativo válido para compor automaticamente a compra.
6. Idade do comprador mais velho limita o prazo; dois participantes e composições familiares sem dependente formal têm tratamento e avisos explícitos. Emancipação, exceções de propriedade e situações complexas são encaminhadas para análise específica.
7. FGTS e aportes não geram entrada negativa, aporte local exige confirmação da unidade/possibilidade de cumulação, obras não são transformadas em cronograma de aquisição pronta e SBPE pode ser testado com outro SFH quando não utiliza FGTS.

## Correções solicitadas e revalidadas

**Benefício anterior.** A primeira versão apenas zerava o subsídio de entrada e ainda concedia descontos nos juros/administração. O motor agora encaminha MCMV com benefício anterior à análise específica, incluindo a exceção de financiamento anterior destinado exclusivamente a material. A regra do Manual V 1.1.4(d) e 1.1.9.5 não equivale a proibir automaticamente todo novo financiamento; o item 2.1.1 inclui diferencial de juros e administração entre os descontos. SBPE e Pró-Cotista não são bloqueados apenas por esse indicador. [Manual de Fomento 034, capítulo V](https://www.caixa.gov.br/Downloads/fgts-manual-fomento-agente-operador/MFOM_HABITACAO_VERSAO_034.pdf).

**Pró-Cotista e teto SFH.** O motor agora limita a avaliação e o financiamento conforme III 9.1.2.1.1. A avaliação máxima do SFH é R$ 2,25 milhões, na redação atual do art. 13, I, da Resolução 4.676. O formulário esclarece que tempo de FGTS e vínculo/saldo devem ser do mesmo participante elegível e que as restrições a propriedade/SFH abrangem qualquer comprador. Foram conferidos o saldo inativo na fronteira de 10% e a validade numérica desse input. [Manual de Fomento 034, III 6.4 e 9.1.2](https://www.caixa.gov.br/Downloads/fgts-manual-fomento-agente-operador/MFOM_HABITACAO_VERSAO_034.pdf), [Resolução 4.676, texto consolidado v.17](https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50628/Res_4676_v17_L.pdf).

**Uso de FGTS na entrada.** O teto de avaliação de R$ 2,25 milhões agora é bloqueio próprio do uso do FGTS. O histórico do imóvel tem opções desconhecido, conforme e aquisição recente com FGTS; a última impede o cálculo com esse recurso e o histórico desconhecido produz aviso. O interstício é do uso anterior no imóvel, não um bloqueio genérico de três anos ao trabalhador. A comprovação/documentação e exceções não são automatizadas no piloto. [CAIXA: utilização do FGTS](https://www.caixa.gov.br/voce/habitacao/Paginas/utilizacao-fgts.aspx), [Manual Moradia Própria 035, itens 3.5.1 e 4.3](https://www.caixa.gov.br/Downloads/fgts-moradia/MANUAL_DA_MORADIA_PROPRIA_02_12_2025_V_035.pdf).

**SBPE acima do teto SFH.** Continua permitido como cenário SFI exploratório, com rotulagem e ressalva comercial próprias. Essa distinção é coerente com a reabertura das contratações anunciada pela CAIXA em 03/03/2026; não seria correto proibir toda operação SBPE acima de R$ 2,25 milhões. [CAIXA: financiamento acima de R$ 2,25 milhões](https://caixanoticias.caixa.gov.br/Paginas/Not%C3%ADcias/2026/03-MAR%C3%87O/CAIXA-amplia-financiamento-para-im%C3%B3veis-acima-de-R%24-2%2C25-milh%C3%B5es.aspx).

**Família unipessoal.** O formulário passou a abranger um comprador em composição familiar elegível, inclusive cônjuge ou parente residente sem dependente formal. Isso evita reduzir indevidamente o subsídio apenas porque há um mutuário. A comprovação continua necessária conforme Manual V 3.1.2.3.1. [Manual 034](https://www.caixa.gov.br/Downloads/fgts-manual-fomento-agente-operador/MFOM_HABITACAO_VERSAO_034.pdf).

## Limites preservados na aprovação

As taxas comerciais, a busca do máximo de financiamento, a oferta operacional de usados, os seguros fora dos perfis conciliados e as fronteiras ambíguas de subsídio continuam estimativas e precisam de confronto com a CAIXA por cenário. A escolha CCI e os ajustes manuais requerem informação da oferta. Os controles não fazem análise documental/cadastral nem garantem a aprovação de crédito. As regras têm data-base e precisam ser atualizadas quando mudarem.

O parecer matemático/securitário é responsabilidade da outra validação independente. Minha aprovação cobre enquadramento, catálogo, subsídio, inputs e avisos normativos inspecionados, e considera adequada a separação entre resultado estimado e valor oficial registrado.
