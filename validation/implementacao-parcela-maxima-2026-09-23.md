# Implementação — parcela máxima inicial

Motor: `2026-09-23.piloto.3`. Escopo autorizado: implementar o plano e obter validação independente. Alterações locais; sem publicação.

## Comportamento entregue

O dropdown **Calcular a partir de** oferece **Parcela máxima**. O campo em reais fica ativo e obrigatório somente nesse modo. O financiamento é limitado pelo menor orçamento mensal entre renda e teto, usando seguro de referência, quota e recursos disponíveis. Juros, enquadramento e subsídio conservam a renda real. A entrada própria é recalculada com FGTS, subsídio e aporte separados.

O motor compara o resumo inicial e o primeiro encargo do cronograma com o orçamento efetivo. Se houver excesso por seguro no primeiro vencimento ou arredondamento, uma busca limitada em centavos reduz o principal. A tolerância exploratória dos modos manuais não é aplicada ao teto. O resultado mostra o motivo limitante, o limite informado e a maior parcela projetada, com aviso quando uma parcela futura supera o teto. A interface esclarece que o limite é inicial e não inclui projeção de TR futura.

`maximum` conserva a capacidade anterior por renda/quota/recursos. `paymentLimit` contém os metadados do novo modo, inclusive seu máximo efetivo. O teto inativo é normalizado para `null`; principal e entrada ocultos não afetam o modo por parcela. Histórico, JSON e impressão conservam a nova informação, sem migração destrutiva dos registros anteriores.

## Verificações do autor

- Suíte existente após a alteração do motor: aprovada, preservando os resíduos históricos já documentados.
- `node tests/payment-cap.mjs`: **54 testes aprovados**, com SAC/PRICE, seguro básico/adicional/manual, subsídio, FGTS/aporte, limites de renda/quota/recursos, MCMV/Classe Média/Pró-Cotista/SBPE, dois compradores, prazo por idade, taxa zero, valores inválidos, mínimo SBPE, monotonicidade, guarda estrita em centavos e parcelas futuras.
- `tests/payment-cap-ui.mjs`: **42 verificações aprovadas**, incluindo quatro modos, máscara monetária, foco dos erros, resultado desatualizado, comparação, histórico antigo/novo, exportação/importação, exemplos, impressão e larguras de 320/390/768/1440 px. Capturas locais de desktop/celular também foram inspecionadas.
- Os exemplos históricos continuaram sem diferenças nos nove campos comparados.

Reprodução da interface: iniciar `node server.cjs` e executar `node tests/payment-cap-ui.mjs`, informando `SIMULA_URL` e `PLAYWRIGHT_MODULE` quando necessários. `SIMULA_SCREENSHOT_DIR` opcional salva capturas do teste, que usa apenas dados sintéticos.

## Exemplos de verificação local

Os valores abaixo são resultados do motor, **não novas referências oficiais da CAIXA**. Data sintética: 23/09/2026; renda R$ 7.000,00; MCMV, 420 meses, cotista, imóvel usado, sem subsídio, seguro básico. Os nascimentos são sintéticos.

| Caso | Teto | Financiamento | Resumo inicial | Primeiro encargo | Observação |
| --- | ---: | ---: | ---: | ---: | --- |
| Imóvel R$ 200 mil, nascimento 01/02/1988, SAC | R$ 1.200,00 | R$ 128.869,99 | R$ 1.187,21 | R$ 1.187,16 | Reserva de seguro na capacidade |
| Imóvel R$ 200 mil, nascimento 01/10/1985, SAC | R$ 1.400,00 | R$ 151.071,89 | R$ 1.384,98 | R$ 1.400,00 | MIP muda no primeiro vencimento; o próximo centavo de principal ultrapassa o teto |
| Imóvel R$ 350 mil, nascimento 01/02/1988, PRICE | R$ 1.604,28 | R$ 218.830,97 | R$ 1.581,89 | R$ 1.581,88 | Parcela 329 projetada em R$ 1.757,55; interface avisa excesso futuro |

## Limites da validação

A [inspeção oficial](parcela-maxima-inspecao-2026-09-23.md) confirmou a interface e um parâmetro de teto separado da renda no JavaScript público da CAIXA. A integração interrompeu as tentativas de digitação; por isso, não foi possível concluir a matriz numérica oficial prevista na etapa 1. A fórmula que usa o seguro de referência permanece uma hipótese de compatibilidade para o novo campo. A entrega garante o contrato de limite inicial dentro do motor local, sem alegar equivalência universal com a CAIXA ou aprovação de crédito.

O [parecer independente](revisao-independente-parcela-maxima-2026-09-23.md) aprovou o contrato local de teto inicial, sem bloqueadores. Conferiu `npm test`, build, 42 checks de interface, 144 combinações dos modos antigos contra a revisão anterior, 400 casos adversariais, 36 cenários de mudança do MIP e 56 próximos da inviabilidade. Cálculos próprios em Python Decimal reproduziram SAC e PRICE. Essa revisão não substitui a comparação oficial pendente.

O build final foi executado novamente após a atualização do texto de Sobre o cálculo; gerou os oito arquivos de execução em `dist/`, com a versão `2026-09-23.piloto.3`. `git diff --check` passou.
