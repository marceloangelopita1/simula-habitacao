# Simula · Habitação

Piloto para a Letícia comparar simulações de financiamento com os resultados da CAIXA. Regras da pesquisa de **14/09/2026**. Aplicação independente, sem cadastro e sem conexão com serviços de cálculo da CAIXA.

## Acessar online

Endereço: **https://marceloangelopita1.github.io/simula-habitacao/**.

O site estático é hospedado gratuitamente no GitHub Pages. Não exige cadastro para simular. O histórico continua no navegador; use **Meus testes → Exportar testes** para compartilhar achados.

## Abrir localmente

Com Node.js instalado, abra um terminal nesta pasta e execute:

```sh
npm start
```

Acesse **http://127.0.0.1:4173**. Para encerrar, use Ctrl+C no terminal. Nenhuma instalação de dependências é necessária: a biblioteca decimal está incluída em `vendor/`, com sua licença.

Outra opção, caso já tenha Python 3:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Execute dentro desta pasta. Abrir `index.html` diretamente por duplo clique não é suficiente, pois o navegador precisa carregar os módulos e o catálogo municipal por HTTP.

## Como testar

Para agentes que vão inspecionar as abas já abertas do Chrome, consulte o [guia de uso do navegador](docs/browser.md): autorização do projeto, conexão, recuperação WSL/Windows e boas práticas para comparar com a CAIXA.

1. Preencha os dados essenciais ou abra um cenário em **Usar exemplo**. A página começa sem uma simulação preenchida.
2. Preencha comprador, imóvel e financiamento. Modalidade, seguro, FGTS e condições especiais ficam em **Mais opções**. Para isolar a conferência das parcelas, escolha **Valor a financiar** e use o mesmo principal da CAIXA.
3. Clique em **Simular**, sempre disponível na barra inferior. Os resultados aparecem abaixo do formulário; os detalhes podem ser expandidos.
4. Abra **Comparar com a CAIXA** e, em **Como ficou na CAIXA?**, preencha os valores oficiais. A diferença é “este simulador menos CAIXA”, na precisão exibida.
5. Registre o que mudou no campo de observações e clique em **Salvar teste neste navegador**.
6. Em **Meus testes**, exporte o JSON para compartilhar os achados e preservar uma cópia.

As comparações oficiais dos três exemplos vêm da pesquisa anterior. O nascimento preenchido nos exemplos é sintético e mantém a faixa etária usada na conciliação; não identifica o comprador real. Não há CPF, celular, código de SMS ou perfil autenticado distribuído com o site.

O histórico usa o armazenamento local deste navegador e endereço. Outro navegador, outra porta ou outro domínio terá histórico separado. Os dados não são compartilhados automaticamente. Exportar e importar o JSON é o mecanismo de transferência desta primeira versão.

As datas de nascimento usam **dia/mês/ano**; também aceitam oito dígitos sem barras. Os registros salvos continuam usando o formato ISO.

Alterações no formulário invalidam a conferência corrente. Abrir um teste salvo gera um novo rascunho e preserva o registro anterior. Os casos importados mantêm a versão das regras e os valores salvos.

## Cobertura e limites

O motor calcula aquisição residencial pronta, com SAC/PRICE, regras de MCMV/Classe Média/SBPE, enquadramento exploratório de Pró-Cotista, fatores municipais, subsídio, FGTS/aportes, prazo por idade, MIP/DFI, tarifas e indicadores CET/CESH. O catálogo contém os municípios e fatores da pesquisa; limites nacionais e faixas de renda posteriores à planilha municipal são tratados separadamente no motor.

O financiamento máximo é uma estimativa. Os três cronogramas da pesquisa foram conciliados em perfis específicos; isso não homologa todos os perfis. O MIP MCMV foi conciliado em contratações aos 28 e 38 anos, incluindo os reenquadramentos futuros; o SBPE foi conciliado aos 38 anos. Outras idades de entrada, seguros e dois compradores precisam de comparação oficial. Taxas comerciais, disponibilidade de recursos, quotas operacionais de usados e ajustes de subsídio devem ser validados por cenário. O app permite informar condições oficiais nos ajustes, sem alterar a regra geral para outros testes.

A calculadora rápida da CAIXA usa simplificações próprias. Este piloto usa o modelo das simulações completas pesquisadas; não tenta reproduzir simultaneamente as simplificações da calculadora rápida.

Construção, terreno + construção, reforma e empréstimo com garantia ainda exigem fluxos próprios. O cronograma não projeta TR futura. A análise de crédito e a oferta final pertencem ao banco.

O CET de comparação usa períodos mensais iguais, que reproduziram os testes oficiais. O indicador calculado por dias corridos/365 também está visível nos detalhes. CESH é um indicador do seguro, não uma taxa anual de juros. Os custos informados de ITBI/cartório não são automaticamente classificados como despesas integrantes do CET.

## Estrutura e publicação

- `index.html`, `styles.css`, `app.js`: interface, histórico e comparação.
- `engine.js`: cálculo decimal, enquadramento e regras com versão.
- `data/municipal-rules.json`: limites e fatores municipais/estaduais, com fontes.
- `vendor/decimal.mjs`: biblioteca Decimal.js e licença acompanhante.
- `server.cjs`: servidor para teste local, sem dependências.

O site é estático, sem banco de dados nem servidor de aplicação. O GitHub Pages publica os arquivos de execução preparados em `dist/`. O repositório é público; dados digitados e testes salvos pelos usuários não são enviados ao repositório. Cada navegador mantém seu histórico.

A cada atualização de `main`, o workflow em `.github/workflows/pages.yml` executa `npm test`, prepara `npm run build` e publica somente depois de os testes passarem. Pull requests executam as verificações sem publicar. Os arquivos `release.json` e seus hashes identificam a versão publicada. A configuração usa o endereço gratuito `github.io` e não exige domínio próprio.

Para verificar a publicação: `gh run list --repo marceloangelopita1/simula-habitacao`. Para republicar a mesma revisão: `gh workflow run pages.yml --repo marceloangelopita1/simula-habitacao`.

## Verificação reproduzível

Execute dentro desta pasta:

```sh
npm test
```

A suíte compara 2.040 parcelas com cinco cronogramas oficiais preservados como referências anônimas, incluindo o MCMV PRICE aos 28 e 38 anos, mais dez parcelas observadas em 22/09. Executa ainda 16 verificações adicionais de matemática, 204 verificações de regras e as regressões de capacidade/idade e arredondamento em `tests/age-capacity.mjs` e `tests/rounding.mjs`. Esta última protege oito novos cenários e os resumos históricos; veja a [conciliação de arredondamentos](validation/arredondamento-2026-09-22.md), incluindo as duas diferenças residuais de um centavo. Os resultados são gravados em `tests/latest-results.json` e `tests/boundary-results.json`. As referências têm nascimento sintético compatível com as faixas mensais de seguro observadas. Os testes são necessários para avaliar mudanças no algoritmo; não abrangem todas as modalidades e perfis.

A auditoria anterior registrou diferenças de R$ 0,01 em quatro resumos SBPE SAC; esses resumos ainda precisam ser recapturados após o ajuste de 22/09. Os quatro máximos históricos SAC e três máximos adicionais (PRICE aos 28/38 e SAC aos 38) continuam exatos. O MCMV usado do diagnóstico de 19/09 ainda estima R$ 326 de subsídio, enquanto a CAIXA considera zero: a entrada automática permanece R$ 326 menor até confirmar essa regra. Selecionar “Sem subsídio” permite comparar a mesma composição de recursos. Veja `validation/comparacao-idades-2026-09-19.md`.

Guardas adicionais: benefício anterior no MCMV encaminha o caso à análise específica, pois também pode afetar descontos de juros e administração; Pró-Cotista e uso de FGTS respeitam o teto de avaliação/financiamento aplicável de R$ 2,25 milhões; o histórico recente de uso do FGTS pelo imóvel é verificado. SBPE acima do teto SFH é identificado como SFI exploratório. Valores de subsídio acima do teto após redutores devem ser registrados na comparação oficial para investigação, sem forçar uma entrada incompatível no cálculo.

## Aprovação independente desta entrega

Três validadores de IA deram OK expresso para o piloto local, sem correções impeditivas pendentes em seus respectivos escopos:

- Matemática: 1.200 parcelas e 16 verificações adicionais aprovadas.
- Normas e inputs: 204 verificações do motor e 11 no navegador aprovadas.
- Experiência de uso: 65 verificações funcionais aprovadas, com revisão de contraste, desktop e celular.

Os pareceres completos estão em `validation/`. A revisão valida o piloto nos escopos declarados; não constitui homologação emitida pela CAIXA. Os dados de exemplo distribuídos são sintéticos.

## Revisão do layout

A revisão de 22/09/2026 concentra os campos essenciais na primeira dobra do desktop, recolhe opções complementares e posiciona os resultados abaixo. O [relatório de validação](validation/layout-2026-09-22/review.md) reúne prints de desktop/celular e verificações de uso reproduzíveis.
