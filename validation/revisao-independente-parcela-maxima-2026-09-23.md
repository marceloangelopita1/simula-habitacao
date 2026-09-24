# Revisão independente — Parcela máxima

Data: 23/09/2026. Motor revisado: `2026-09-23.piloto.3`, alterações locais sobre `67998fb`. Revisão executada por agente independente da implementação, sem modificar código ou testes do produto.

**Decisão: APROVADO para o contrato local de teto inicial estimado.** Não foram encontrados bloqueadores na matemática, na integração ou na preservação dos modos anteriores. Esta decisão não homologa a fórmula nem a abrangência temporal do campo correspondente da CAIXA.

## Escopo e método

Foram lidos `AGENTS.md`, `docs/browser.md`, o plano da funcionalidade, o diff do motor e da interface e as novas suítes `tests/payment-cap.mjs` e `tests/payment-cap-ui.mjs`. A inspeção cobriu renda, quota, recursos, arredondamento em centavos, reenquadramento do MIP no primeiro vencimento, entradas inválidas, histórico e comunicação do resultado.

Além de executar as suítes entregues, foram feitas comparações com o motor anterior, cálculos próprios em Python `decimal` e execuções adversariais independentes por scripts transitórios enviados pela entrada padrão do Node. Nenhum script adicional foi incorporado aos testes da implementação. Não houve acesso ao Chrome do Windows nem à CAIXA nesta revisão. A UI foi testada em Chromium headless local, em `http://127.0.0.1:4175`.

## Matemática conferida

O orçamento aplicado é o menor entre teto informado e limite pela renda real. A capacidade continua usando taxa, prazo efetivo e seguro de referência do motor; quota e recursos são limites adicionais. O novo modo não altera a renda para chegar ao valor solicitado, nem recalcula enquadramento ou subsídio com uma renda fictícia.

A verificação final compara separadamente o resumo e o primeiro encargo do cronograma contra esse orçamento. Quando necessário, a busca em centavos reduz o principal. A tolerância exploratória de R$ 1 dos modos manuais não participa desse ajuste.

Foram calculados independentemente dois cenários com renda de R$ 8.500, imóvel de R$ 300.000, nascimento sintético em 01/02/1988, data-base 23/09/2026, 180 meses, juros nominais de 6% a.a., MIP constante de 0,1% ao mês, DFI de 0,01%, tarifa de R$ 17,45 e teto de R$ 1.732,41. O cálculo Python usou precisão de 42 algarismos e reproduziu as convenções documentadas de arredondamento.

| Resultado | SAC — cálculo próprio e motor | PRICE — cálculo próprio e motor |
| --- | ---: | ---: |
| Coeficiente de capacidade, com MIP | 0,01155555 | 0,00943856 |
| DFI + reserva mensal de referência | R$ 49,19 | R$ 49,19 |
| Financiamento | R$ 144.153,24 | R$ 176.485,60 |
| Entrada própria | R$ 155.846,76 | R$ 123.514,40 |
| Primeira parcela do resumo | R$ 1.713,21 | R$ 1.713,22 |
| Primeiro encargo do cronograma | R$ 1.712,42 | R$ 1.712,62 |

O principal foi obtido por `(teto − tarifa − DFI/reserva) / coeficiente`, truncado em centavos. A folga em relação ao teto é coerente com a reserva de seguro usada na capacidade e não cobrada no cronograma desse seguro customizado. O produto identifica a existência do seguro de referência nos detalhes.

## Casos independentes e regressões

| Verificação | Resultado |
| --- | --- |
| 144 combinações dos modos `max`, `fixed` e `entry`, dois sistemas e três seguros, contra o código de `HEAD` anterior | Resultados completos idênticos, desconsiderados somente versão e campos novos `paymentLimit`/`maxInstallment`. Incluiu MCMV, SBPE, Classe Média, Pró-Cotista, subsídio/FGTS/aporte, avaliação distinta, prazo por idade e prazo de um mês. |
| 400 cenários adversariais determinísticos, semente 1475241 | 90 resultados válidos, 310 rejeições estruturadas, nenhuma exceção. Nos válidos, resumo e primeiro encargo respeitaram simultaneamente teto e renda; principal não superou o máximo anterior e entrada não ficou negativa. Houve 17 ajustes do primeiro encargo. Comparações válidas com teto aumentado em um centavo não reduziram o principal. |
| 36 cenários adicionais de mudança de faixa etária no primeiro vencimento | SAC/PRICE, um ou dois compradores, participação do segundo de 37,5%, nascimentos sintéticos próximos das mudanças de faixa e prazo reduzido por idade. Nenhum excesso inicial. Nos 11 casos ajustados, principal acrescido de R$ 0,01 ultrapassou o teto no resumo ou no primeiro encargo. |
| 56 combinações próximas da inviabilidade | Tetos de R$ 0,01 a R$ 99,99, prazos de 1, 2, 419 e 420 meses, SAC/PRICE: resultado compatível ou erro estruturado; nenhuma exceção. |
| `npm test` | Passou, incluindo os 54 checks da nova suíte e todas as regressões anteriores. |
| `tests/payment-cap-ui.mjs` | 42 checks, zero falhas e zero erros de página. |
| `npm run build` | Passou: oito arquivos de execução gerados em `dist/`. |

Exemplo independente do reenquadramento: SBPE, imóvel de R$ 600 mil, renda de R$ 20 mil, nascimento sintético em 01/10/1955 e teto de R$ 2.400. O prazo efetivo foi de 114 meses. SAC retornou principal de R$ 102.754,91, resumo de R$ 2.236,41 e primeiro encargo de R$ 2.400,00; PRICE retornou R$ 122.889,94, R$ 2.202,10 e R$ 2.400,00, respectivamente. Em ambos, o centavo seguinte de principal deixou de caber.

Os casos adversariais variaram juros manuais até 49,99% a.a., seguro básico/adicional/customizado, DFI, tarifa, prazo, idade, renda, preço e teto. As rejeições fazem parte desses limites deliberadamente extremos; não representam ofertas bancárias comparadas.

## Interface, histórico e explicação

A opção e o campo monetário aparecem apenas no modo correspondente. O campo é obrigatório e habilitado nesse modo; seu valor inativo não interfere nos demais cálculos. Os erros indicam o campo e permitem focá-lo pelo resumo acessível. Alterar o teto invalida resultado e comparação.

O resultado exibe limite, primeiro encargo, motivo limitante e maior parcela projetada com data/número. Informa que o teto é inicial, inclui seguro/tarifa e que seguro e TR podem alterar parcelas futuras. O aviso de excesso posterior foi observado em PRICE e permaneceu na impressão. Os metadados não são apresentados como aprovação de crédito.

Salvar, exportar, importar e reabrir preservaram modo e teto. O registro salvo permaneceu intacto ao ser reaberto como novo teste. Um registro antigo sem os campos novos foi aberto corretamente. Limpar dados e carregar os três exemplos restauraram o comportamento esperado. Não houve overflow horizontal nas verificações de 320, 390, 768 e 1440 px.

## Limites da decisão

- A validação numérica oficial do novo campo continua pendente, conforme a evidência de inspeção e o bloqueio de integração documentados pela entrega. A presença do campo oficial não comprova que a CAIXA use esta fórmula, este seguro de referência ou este horizonte temporal.
- A revisão aprova a implementação do contrato explícito de **encargo inicial estimado**, sem garantia de teto constante ao longo do financiamento e sem projeção de TR futura.
- As divergências históricas de centavos já registradas pelas suítes de referência continuam aparecendo em seus relatórios; não foram ocultadas nem tratadas como equivalência integral à CAIXA. Não houve nova diferença na comparação independente dos três modos anteriores.
- A amostragem adversarial amplia a cobertura, mas não constitui enumeração de todas as combinações possíveis. Os limites comerciais e de apólice do motor continuam sendo os documentados pelo projeto.

Não há correção obrigatória identificada nesta revisão. A homologação externa do novo teto permanece uma atividade distinta e ainda não concluída.

## Reprodução

Executar na raiz do projeto. A variável de módulo abaixo corresponde à instalação disponível nesta máquina; pode ser substituída pelo caminho local de Playwright. A UI requer o servidor já iniciado na porta indicada.

```sh
npm test
SIMULA_URL=http://127.0.0.1:4175 PLAYWRIGHT_MODULE=/home/mapita/projetos/aura-noivas/node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/index.mjs node tests/payment-cap-ui.mjs
npm run build
```

Cálculo independente dos dois resultados da tabela, sem importar o motor:

```sh
python3 - <<'PY'
from decimal import Decimal as D, getcontext, ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN
getcontext().prec = 42
for system in ['SAC', 'PRICE']:
    v, budget, admin, n = D(300000), D('1732.41'), D('17.45'), D(180)
    i, mi = D(6)/1200, D('.1')/100
    coeff = ((1/n+i if system == 'SAC' else i/(1-(1+i)**(-n)))+mi)
    coeff = coeff.quantize(D('.00000001'), rounding=ROUND_DOWN)
    insurance = (v*D('.01')/100+v*D('.00006396')).quantize(D('.01'), rounding=ROUND_HALF_UP)
    f = ((budget-admin-insurance)/coeff).quantize(D('.01'), rounding=ROUND_DOWN)
    p = f/n+f*i if system == 'SAC' else f*i/(1-(1+i)**(-n))
    j = (f*i).quantize(D('.0001'), rounding=ROUND_HALF_UP).quantize(D('.01'), rounding=ROUND_HALF_UP)
    a = (f/n).quantize(D('.01'), rounding=ROUND_HALF_UP) if system == 'SAC' else p.quantize(D('.01'), rounding=ROUND_HALF_UP)-j
    mip = ((f-a)*mi).quantize(D('.01'), rounding=ROUND_HALF_UP)
    first_row = a+j+mip+v*D('.01')/100+admin
    if system == 'SAC':
        payment = (f*(1/n+i).quantize(D('.00000001'), rounding=ROUND_DOWN)).quantize(D('.001'), rounding=ROUND_HALF_UP).quantize(D('.01'), rounding=ROUND_DOWN)
        summary = payment+(f*mi+v*D('.01')/100).quantize(D('.01'), rounding=ROUND_HALF_EVEN)+admin
    else:
        summary = (p+f*mi+v*D('.01')/100+admin).quantize(D('.01'), rounding=ROUND_HALF_UP)
    print(system, dict(principal=str(f), own_funds=str(v-f), first_summary=str(summary), first_row=str(first_row)))
PY
```

Os 36 cenários de idade e os 56 casos próximos da inviabilidade podem ser reproduzidos assim. A checagem do centavo seguinte usa o modo manual para verificar o encargo correspondente, fora do mecanismo de redução do novo modo.

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {simulate} from './engine.js';
const catalog=JSON.parse(fs.readFileSync('data/municipal-rules.json'));
const base={simulationDate:'2026-09-23',municipalityId:'3543402',income:20000,propertyValue:600000,birthDate:'1988-02-01',program:'sbpe',amountMode:'payment',insurance:'basic',months:420};
const births=['1985-10-01','1980-10-01','1975-10-01','1970-10-01','1965-10-01','1960-10-01','1955-10-01','1950-10-01','1946-10-01'];
let count=0, adjusted=0, nearInfeasible=0;
for(const birthDate of births)for(const system of ['SAC','PRICE'])for(const family of ['single','two']){
  const input={...base,birthDate,system,family,secondBirthDate:'1988-02-01',secondSharePercent:37.5,maxInstallment:2400};
  const r=simulate(input,catalog);
  assert(r.ok,JSON.stringify(r.errors));count++;
  assert(r.firstSummary<=2400&&r.schedule.rows[0].total<=2400);
  if(r.paymentLimit.initialAdjustment){
    adjusted++;
    const next=simulate({...input,amountMode:'fixed',principal:Math.round(r.principal*100+1)/100},catalog);
    assert(next.ok);
    assert(next.firstSummary>2400||next.schedule.rows[0].total>2400);
  }
}
for(const maxInstallment of [.01,.02,24.99,25,25.01,50,99.99])for(const months of [1,2,419,420])for(const system of ['SAC','PRICE']){
  const r=simulate({...base,income:10000,maxInstallment,months,system},catalog);
  nearInfeasible++;
  if(r.ok)assert(r.firstSummary<=maxInstallment&&r.schedule.rows[0].total<=maxInstallment);
  else assert(r.errors.length>0);
}
assert.equal(count,36);assert.equal(adjusted,11);assert.equal(nearInfeasible,56);
console.log({count,adjusted,nearInfeasible,failures:0});
JS
```
