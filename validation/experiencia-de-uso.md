# Revisão independente de experiência de uso — Simula Habitação

Data: 14/09/2026. Revisor: agente independente de IA dedicado à entrada de dados e experiência de uso. Referência: pesquisa aprovada em `outputs/relatorio-caixa.md`. Implementação inspecionada: `outputs/site`, motor `2026-09-14.piloto.1`, servida em `http://127.0.0.1:4173`.

## Escopo e execução

Executei testes de navegação reais em Chromium via Playwright, com contexto isolado e apenas perfis sintéticos. Revisei também o HTML, as mensagens, os campos condicionais, as saídas e o tratamento de snapshots. Não implementei nem alterei arquivos do site.

Foram aprovadas **65 verificações funcionais**, registradas em `flows-result.json` (56) e `conditional-result.json` (9):

- Três exemplos da pesquisa — MCMV SAC, MCMV PRICE e SBPE PRICE — apresentam primeira/última parcela esperadas e igualdade nos nove campos oficiais comparados.
- Inputs distinguem renda familiar bruta, cotista, composição familiar elegível (incluindo cônjuge/dependente/parente residente) ou dois compradores, valor/avaliação do imóvel, FGTS, aportes confirmados, financiamento máximo/informado/por entrada, seguro e ajustes da oferta.
- A composição familiar altera o enquadramento do subsídio sem exigir nascimento de um segundo comprador; dois compradores exigem nascimento e participação próprios. Idade mais elevada reduz o prazo aplicado. Percentuais aceitam vírgula.
- Subsídios de R$ 2.609 e R$ 8.697 são reproduzidos nos respectivos perfis conhecidos. Uso de FGTS exibe histórico de aquisição do imóvel; histórico recente incompatível é recusado. Aporte não confirmado bloqueia cálculo e o preço fecha ao descontar financiamento, subsídio, FGTS e aporte.
- A comparação distingue reais de pontos percentuais, campo vazio de zero, igualdade de divergência e input oficial inválido. Exibe taxas nominal/efetiva e CET/CESH com descrições apropriadas ao escopo.
- Editar parâmetros invalida a referência anterior; recalcular limpa os valores oficiais. Reabrir histórico cria novo rascunho e preserva o snapshot salvo, suas notas, resultados e versão.
- Salvar, recarregar, exportar/importar JSON, não duplicar reimportação, rejeitar JSON inválido e excluir funcionam. Exportação mantém inputs/resultados/valores oficiais/notas; snapshot leve não repete todas as parcelas.
- CSV contém 420 parcelas e cabeçalho, com componentes separados. Paginação funciona. A impressão gera PDF.
- Renda zero, imóvel negativo, prazo zero, nascimento futuro e coeficientes ausentes em apólice manual são recusados com mensagens legíveis.
- Desktop 1440 px e mobile 390/320 px não têm overflow horizontal global; tabelas largas usam contêiner próprio. Não houve erros JavaScript ou respostas HTTP com falha.
- Campos visíveis têm rótulos e foco de formulário apresenta indicação visual. O texto esclarece independência, validade das regras, cálculo local, estimativas e ausência de projeção de TR futura.

Os três exemplos usam referências previamente coletadas na pesquisa. Esta revisão não converte os resultados em testes cegos nem em homologação da CAIXA. A validação financeira completa e normativa pertence ao revisor do motor.

## Correções solicitadas ao implementador

1. Escurecer textos pequenos, especialmente opção SAC/PRICE não selecionada, igualdade/diferença, tabelas de comparação e cronograma, aviso do piloto e auxiliares. O contraste inicial medido para alguns desses elementos ficou entre 2,68:1 e 4,27:1, inferior ao objetivo de 4,5:1.
2. Na comparação em mobile, explicar a rolagem horizontal ou organizar a tabela em cartões: inicialmente a área visível mostrava Campo/Este simulador e deixava Resultado CAIXA/Diferença à direita sem indicação. Tornar o contêiner rolável acessível também por teclado.

## Revalidação das correções

A comparação móvel foi convertida em cartões por campo, mostrando valor local, input oficial e diferença na mesma largura, sem deslocamento horizontal. O cronograma recebeu instrução de rolagem e região focável. Os 65 testes funcionais permaneceram aprovados após a revisão. Textos e números do formulário, resumo, comparação e detalhes foram escurecidos; o auditor de contraste encontrou zero ocorrências abaixo de 4,5:1 nos textos pequenos dessa tela. A inspeção final das abas de histórico e regras identificou mais dois seletores auxiliares, que também foram corrigidos e retestados: nenhuma ocorrência abaixo do alvo permaneceu nas três abas examinadas. Essa inspeção não substitui uma certificação completa de acessibilidade WCAG em todos os navegadores e tecnologias assistivas.

## Situação

**OK FINAL EXPRESSO — aprovado em 14/09/2026 para uso como piloto local de validação pela Letícia.** Os inputs cobrem o escopo pesquisado implementado, as condições adicionais aparecem quando necessárias e os resultados são legíveis e comparáveis aos campos da CAIXA. Fluxos, persistência, exportações, tratamento de divergências e layouts desktop/mobile foram verificados. Não há correções impeditivas pendentes no meu escopo. O aceite é de experiência de uso e integridade do fluxo de testes; a homologação financeira de todos os perfis e a aprovação de crédito não estão abrangidas.
