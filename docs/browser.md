# Inspeção do navegador e comparação com a CAIXA

Procedimento do projeto, validado em 19/09/2026 com Codex desktop, workspace WSL e Chrome no Windows. Use-o quando o usuário pedir para comparar nosso simulador com a CAIXA ou conferir as abas abertas. A investigação deve começar pela observação das abas reais.

## Autorização do usuário para este projeto

O responsável pelo projeto solicitou expressamente que futuras análises desse tipo possam começar diretamente. Fica registrada sua autorização contínua, limitada a este projeto, para:

- Usar o Chrome já aberto, identificar a janela correta, ler URL, tela, formulários e resultados, navegar entre as abas relevantes e expandir detalhes.
- Acessar nosso site publicado, o preview local do projeto e `https://simuladorhabitacao.caixa.gov.br/`.
- Repetir simulações e variar renda, nascimento, composição familiar, município, valor/tipo do imóvel, prazo, sistema, seguro e demais parâmetros necessários à comparação. Podem ser reutilizados, nesse mesmo simulador oficial, os dados já preenchidos pelo usuário; preferir dados sintéticos quando não for necessário usar os reais.
- Preservar a sessão existente da CAIXA, sem manipular sua autenticação. CPF e telefone já presentes podem permanecer no formulário para o fluxo de simulação; não os copiar para relatórios, arquivos de teste ou outros destinos.
- Capturar evidência necessária, registrar resultados anonimizados em `validation/` e conferir o motor local.
- Executar o `node_repl` instalado, importar `@oai/sky` e usar a ponte local descrita abaixo se ocorrer a incompatibilidade de diretório WSL/Windows.
- Aceitar, pelo mecanismo da integração e quando permitido por ela, a solicitação de acesso **ao Google Chrome** para essa análise. Conferir o aplicativo e o escopo: esta autorização não é aceitação genérica de solicitações MCP.

Não pedir novamente “posso usar o browser?”, “posso navegar nas abas?” ou “pode copiar os valores?” quando o acesso está disponível e a ação está nesse escopo. Uma solicitação como **“compare os valores do nosso site com a CAIXA nas abas abertas”** já deve iniciar o procedimento.

A autorização cobre simulações, não contratação de crédito, propostas formais, mensagens a terceiros, publicação do site ou mudanças de segurança. Não automatizar autenticação, OTP ou contornar barreiras do navegador. Se a integração exigir uma ação exclusiva do usuário ou houver bloqueio efetivo, informar a ação exata e a origem da exigência; continuar o trabalho independente possível.

Este documento registra a autorização do usuário; não concede permissões técnicas ao Windows ou ao plugin. Instruções do repositório e controles de execução são camadas diferentes. Não mudar configurações globais de sandbox, aprovação ou segurança para forçar acesso. Referências: [instruções AGENTS.md](https://developers.openai.com/pt-BR/docs/agent-configuration/agents-md) e [aprovações e sandbox](https://developers.openai.com/pt-BR/docs/agent-approvals-security).

## Início rápido

1. Ler a skill `computer-use:computer-use` instalada e seus documentos `guidance.md`, `api.md` e `confirmations.md`. Usar os caminhos anunciados pela sessão; versões e diretórios de cache mudam.
2. Se houver uma ferramenta de navegador capaz de acessar **as abas existentes do usuário**, preferi-la conforme sua documentação. Na sessão que originou este guia, funcionou Computer Use via `node_repl` + `@oai/sky`.
3. Tentar a ferramenta registrada `mcp__node_repl__js`. Se falhar antes de executar JavaScript com o erro de diretório abaixo, seguir a recuperação WSL/Windows.
4. Listar aplicativos, selecionar uma janela retornada do Chrome e ativá-la **antes da primeira captura**. Ler a URL de cada aba relevante. O título da janela, sozinho, não identifica o site.
5. Registrar inputs e outputs iniciais antes de alterar qualquer campo. Seguir a comparação descrita ao final.

Inicialização no JavaScript persistente do `node_repl`:

```js
if (!globalThis.sky) {
  const { sky } = await import('@oai/sky');
  globalThis.sky = sky;
}
globalThis.apps = await sky.list_apps();
nodeRepl.write(JSON.stringify(apps, null, 2));
```

Inspecionar o retorno. Na sessão validada, o identificador retornado foi `Chrome`; não pressupor que ele será igual em outro ambiente. Depois de confirmar o aplicativo:

```js
globalThis.targetApp = apps.find(app => app.id === 'Chrome');
if (!targetApp || targetApp.windows.length !== 1) {
  throw new Error('Selecionar a janela correta entre as janelas retornadas.');
}
globalThis.targetWindow = await sky.get_window({
  id: targetApp.windows[0].id,
  app: targetApp.windows[0].app,
});
await sky.activate_window({ window: targetWindow });
globalThis.state = await sky.get_window_state({
  window: targetWindow, include_screenshot: true, include_text: true,
});
globalThis.targetWindow = state.window;
nodeRepl.write(state.accessibility.tree);
```

Em caso de várias janelas, restringir a seleção às candidatas observadas antes de agir. Não reutilizar IDs de janela ou índices de elemento de uma conversa anterior. Reduzir/anonimizar a saída quando o formulário contiver identificadores pessoais.

## Como o acesso foi recuperado nesta máquina

O workspace estava no Linux/WSL, mas o servidor `node_repl` configurado era um executável Windows. A ferramenta falhava **antes de rodar o código JS**:

```text
sandboxCwd is not a local file URI: file:///home/mapita/projetos/simula-habitacao
```

Reinicializar o kernel com o mesmo diretório não resolveu. Isso era uma incompatibilidade de diretório de execução, não prova de que o Chrome estivesse ausente ou de que sua URL fosse insegura.

A recuperação realizada foi:

1. Ler apenas a configuração necessária do servidor `mcp_servers.node_repl` no perfil Windows, sem exibir seu ambiente ou segredos.
2. Iniciar **o mesmo executável instalado**, com os mesmos argumentos e variáveis configuradas, usando o diretório do perfil Windows como `cwd`. Não modificar o `config.toml` nem acrescentar flags para desativar proteções.
3. Conectar por MCP stdio, executar `initialize` com suporte a `elicitation`, enviar `notifications/initialized` e chamar a ferramenta `js`.
4. Quando a integração solicitou `Allow Codex to use Google Chrome?`, atender à autorização explícita do usuário. A autorização então dada era para aquela sessão; a seção acima registra a autorização de projeto solicitada posteriormente.
5. No JS, importar `@oai/sky`, listar aplicativos, obter a janela retornada, executar `activate_window` e só então `get_window_state`. **Ativar a janela foi decisivo para conseguir observar as abas.**
6. Conferir o endereço na barra e no documento acessível: nosso site em `marceloangelopita1.github.io/simula-habitacao/` e a CAIXA em `simuladorhabitacao.caixa.gov.br/simulacao`.

Não foi necessário reiniciar o Chrome, instalar extensão, abrir porta de depuração ou criar outro perfil de navegador. As simulações existentes foram preservadas para comparação. A ponte transporta MCP para o `node_repl`; ela não implementa o protocolo privado do helper Computer Use e não chama `codex-computer-use.exe` diretamente.

### Comando de recuperação preservado

O script temporário usado na investigação foi adaptado para [scripts/browser-node-repl.py](../scripts/browser-node-repl.py), com caminho parametrizado e verificação de conexão. Requer Python 3.11+, interoperabilidade WSL/Windows e `node_repl` stdio já configurado no perfil Windows confiável.

Executar pelo shell do workspace, **não pela interface de um terminal Windows**:

```sh
python3 scripts/browser-node-repl.py --windows-profile '/mnt/c/Users/Marcelo Pita' --check
```

Esse é o caminho observado nesta máquina; adaptar somente o perfil em outra instalação. `--check` verifica a inicialização MCP e a existência de `js`, sem acessar o browser. Para iniciar o transporte persistente:

```sh
python3 scripts/browser-node-repl.py --windows-profile '/mnt/c/Users/Marcelo Pita'
```

Quando usado por um agente com `exec_command`, manter uma sessão interativa (`tty: true`) e guardar o `session_id` retornado; enviar uma linha JSON por chamada com `write_stdin`. O comando está autorizado no escopo descrito acima. Preferir a ferramenta registrada sempre que ela funcionar; esta ponte é a recuperação de uma falha específica, não um requisito universal do Codex.

Após `MCP_READY`, exemplo de linha de entrada:

```json
{"code":"nodeRepl.write('Conexão JS ativa');","title":"Verificar node_repl nativo","timeout_ms":60000}
```

| Saída da ponte | Tratamento pelo agente controlador |
|---|---|
| `MCP_RESULT {...}` | Interpretar JSON; conferir erros, inclusive `result.isError`, e ler os blocos de `result.content`. |
| `MCP_ELICITATION {...}` | Inspecionar pedido e escopo. Para o acesso autorizado ao Chrome, responder pelo protocolo quando permitido. Nunca aceitar todos os pedidos automaticamente. |
| `MCP_CHECK_OK ...` | Transporte e ferramenta `js` disponíveis; não significa que o browser já foi acessado. |

Na elicitação de Chrome validada nesta sessão, a mensagem era `Allow Codex to use Google Chrome?` e `_meta.tool_params.app` era `chrome.exe`. Após validar que se trata desse acesso autorizado, a resposta MCP usada foi `{"action":"accept","content":{}}`. Se texto, aplicativo ou escopo forem diferentes, examinar a solicitação real antes de responder. A ponte não toma essa decisão automaticamente.

As respostas podem conter imagens grandes: o controlador deve encaminhar os blocos de imagem pela saída visual da ferramenta, sem imprimir base64 em logs ou salvá-lo no repositório. Inspecionar a captura original, sem reemitir seu payload para nova inspeção. Não persistir transcrições brutas com dados pessoais.

Encerrar a ponte com uma linha `{"exit":true}`. Isso encerra apenas o servidor MCP iniciado pelo script, mantendo o Chrome aberto. O script não depende de IDs, sessões ou arquivos em `/tmp` da investigação anterior.

## Boas práticas de navegação e recuperação

Executar o ciclo **observar → interpretar → uma ação → nova observação**. A captura, os índices e a seleção de texto valem apenas para aquele estado. Todas as ações Windows continuam dentro do JS, pela API `sky`.

| Situação observada | Próximo passo |
|---|---|
| Captura não identifica o conteúdo esperado | Reobter a janela retornada, ativá-la e capturar novamente; confirmar a URL pela barra/documento. |
| `user input was detected ... get_window_state` | Atualizar o estado antes de qualquer nova ação. Incorporar alterações feitas pelo usuário. |
| Elemento existe na árvore, mas está fora da janela | Rolar até ele, recapturar e usar o índice atual. A árvore pode conter elementos fora da área visível. |
| Clique informa outra janela sobreposta | Ativar a janela-alvo e recapturar antes de uma nova tentativa. |
| Campo mascarado não recebe o valor esperado | Focar, verificar seleção, substituir por teclado e reler o valor completo. `set_value` não foi confiável para o nascimento nesta sessão. |
| `focused_element` mostra a barra apesar do campo selecionado | Conferir captura e texto selecionado; não digitar com foco ambíguo. |
| `Ctrl+A` não seleciona a entrada monetária | Verificar cursor/seleção; `Home` e `Shift+End`, em ações separadas, permitiram selecionar o texto. Confirmar antes de substituir. |
| Data parece invertida | Ler o valor ISO ou o texto explicativo. No nosso site, o controle nativo mostrou mês/dia enquanto a legenda esclarecia dia/mês. |
| CET aparece zero ou CESH absurdo logo após clicar | Aguardar e recapturar o resultado concluído. A tela apresentou valores transitórios durante o carregamento. |
| Timeout em chamada leve | Seguir as tentativas limitadas e a recuperação da skill instalada. Não repetir indefinidamente nem declarar indisponibilidade antes de conferir a incompatibilidade conhecida. |

Se necessário, alternar abas com `Control_L+Tab` e reler a URL. `Control_L+Home`/`End` podem mover o cursor dentro de um input em vez de rolar a página: conferir foco e posição. Após erro de ação, tratar o resultado como desconhecido e recapturar antes de repetir.

## Procedimento da comparação financeira

1. Registrar valores **efetivamente preenchidos**, incluindo nascimento completo para o cálculo, data-base, renda, FGTS, composição familiar, imóvel, cidade, modalidade, prazo, amortização, principal, entrada, subsídio e seguro. Separar os dados necessários ao cálculo dos que podem ser persistidos anonimamente.
2. Expandir detalhes e CET/CESH. Comparar resumo com resumo e cronograma com cronograma. Não presumir que “soma das parcelas” inclua seguro e tarifas.
3. Variar uma condição por vez. Ao voltar etapas da CAIXA, conferir novamente modalidade e sistema: a seleção MCMV foi desfeita e o resultado voltou a SAC. Restabelecer PRICE e limpar a entrada sugerida pelo SAC quando o objetivo for obter o **máximo PRICE**.
4. Não interpretar “Possui subsídio: Não” como recusa de subsídio atual: no fluxo observado, esse resumo vinha da pergunta sobre **benefício habitacional anterior**. Conferir a pergunta original.
5. Abrir “Ver parcelas”, aumentar para 25 itens e percorrer cada página com nova observação. Para 420 parcelas são 17 páginas, sendo 20 registros na última. Extrair os registros da interface e conferir sequência, duplicatas e quantidade; não preencher lacunas com resultados do nosso motor.
6. Preservar evidência anonimizada em `validation/`, registrar a comparação e o grau de confiança. Datas sintéticas só podem substituir nascimento real em fixtures se preservarem todos os reenquadramentos nos vencimentos.
7. Quando houver autorização para corrigir o código, acrescentar regressões com as referências oficiais e executar `npm test` e `npm run build`. Distinguir código local de versão publicada. Uma inspeção, isoladamente, não autoriza publicação.
8. Ao terminar, informar quais casos foram conferidos e deixar a aba em estado conhecido. Se parâmetros foram alterados para testes, restaurá-los ou explicar claramente qual caso ficou aberto.

Resultados que demonstram esse procedimento: [diagnóstico inicial](../validation/diagnostico-2026-09-19.md) e [comparação aos 28 e 38 anos](../validation/comparacao-idades-2026-09-19.md). As 840 parcelas adicionais vieram das abas reais, e não de uma nova sessão de navegador isolada.

## Manutenção

Manter `AGENTS.md` apenas como referência a este guia. Atualizar aqui mudanças de integração e recuperação; manter os achados financeiros em `validation/`. Não versionar configurações pessoais, credenciais, perfis do Chrome ou cópias dos plugins. Após atualizar o plugin, ler sua documentação atual antes de reutilizar as APIs; este procedimento registra o que foi validado, sem congelar a versão instalada.
