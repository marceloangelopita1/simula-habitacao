# Layout e usabilidade — 22/09/2026

Resultado: satisfatório nos cenários verificados. A entrega foi planejada, implementada e revisada em duas frentes separadas: aceitação funcional pelo navegador e inspeção visual dos prints. As evidências foram capturadas do servidor local em um contexto novo do Chromium, com dados sintéticos.

## Plano e implementação

- Priorizar o formulário na primeira dobra do desktop, em três grupos: comprador, imóvel e financiamento.
- Remover a identificação do teste e o carregamento automático do exemplo inicial.
- Manter os campos que alteram diretamente o cálculo; recolher modalidade, seguro, FGTS/aportes, subsídio, requisitos e ajustes em “Mais opções”. A modalidade é sugerida automaticamente por padrão.
- Mostrar campos adicionais somente quando aplicáveis: segundo comprador, valor financiado ou entrada própria.
- Fixar “Simular” na barra inferior e colocar os resultados abaixo de todo o formulário.
- Recolher composição das parcelas, cronograma e comparação oficial. Preservar histórico, exportação e regras.
- Usar datas brasileiras no preenchimento, mantendo datas ISO no motor e nos arquivos salvos.

## Aceitação funcional

**105 verificações passaram**, sem erros JavaScript não tratados. A lista completa está em [checks.json](checks.json), e o roteiro está em [validate.mjs](validate.mjs).

As verificações cobrem preenchimento inicial, campos essenciais acima da barra no desktop, ação visível durante a rolagem, ausência de rolagem horizontal, datas, mensagens de erro e foco, abertura de ajustes com erro, modos de financiamento, segundo comprador, seguro personalizado, alteração/recálculo, histórico sem nome obrigatório, exemplos, paginação e CSV. A navegação por Tab no celular e tablet foi conferida para garantir que a barra não encobre os campos em foco.

Viewports: 1920×1080, 1440×900, 1366×768, 1280×720, 1280×640, 1024×768, 768×1024, 390×844 e 320×740. Os campos essenciais do cenário inicial cabem acima da barra em todos os tamanhos de desktop verificados. Campos condicionais e ajustes expandidos podem exigir rolagem.

Os exemplos MCMV SAC, MCMV PRICE e SBPE PRICE continuam coincidindo com suas referências nos nove campos comparados. `npm test` passou: 2.040 parcelas oficiais, 16 verificações algébricas, 204 verificações de regras e regressões de capacidade/idade. `npm run build` passou. O motor financeiro não foi alterado.

## Revisão visual e ciclo de correção

A inspeção visual identificou e corrigiu quatro pontos antes da aprovação final:

1. A sigla do estado estava truncada: o seletor recebeu largura suficiente.
2. O navegador mostrava a data no formato americano: o preenchimento passou a usar dia/mês/ano, aceitando também oito dígitos em teclados numéricos.
3. A limpeza da data mostrava um traço em vez de um campo vazio: a restauração foi corrigida e ganhou verificação explícita no navegador.
4. A transparência da barra deixava o conteúdo inferior aparecer por trás: a barra passou a ter fundo opaco.

Após as correções, os prints foram regenerados e revistos. O formulário apresenta hierarquia clara, rótulos legíveis e espaçamento consistente. O resultado destaca valor financiado, entrada e parcelas; detalhes permanecem disponíveis por expansão. No celular, os grupos se empilham e a comparação apresenta os valores sem ampliar a largura da página.

Evidências principais:

- [Desktop anterior](before-desktop.png)
- [Desktop final, 1440×900](initial-1440x900.png)
- [Desktop final, 1366×768](initial-1366x768.png)
- [Desktop compacto, 1280×640](initial-1280x640.png)
- [Página completa com resultado abaixo](full-desktop.png)
- [Resultado no desktop](result-desktop.png)
- [Formulário no celular](initial-390x844.png)
- [Resultado no celular](result-390.png)
- [Comparação em 320 pixels](comparison-320.png)

## Reproduzir

Inicie `npm start` e execute o roteiro com uma instalação de Playwright e seu Chromium disponíveis:

```sh
PLAYWRIGHT_MODULE=/caminho/para/playwright/index.mjs node validation/layout-2026-09-22/validate.mjs
npm test
npm run build
```

`SIMULA_URL` permite outro endereço local. O print anterior usa a revisão `078a0f8df5e94ff3f55041e581b3fc4c0a4ffb43`, preservada como referência no roteiro. As verificações de layout são locais e em viewports emulados; as imagens finais e os resultados funcionais estão juntos nesta pasta.
