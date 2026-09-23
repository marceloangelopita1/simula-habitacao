# Plano de execução — data-base e conciliação com a CAIXA

Autorizado em 23/09/2026 após a investigação das duas abas. Objetivo: aproximar os resultados das referências oficiais, sem ajustes por valor de imóvel nem alteração de observações para acomodar o motor.

## Etapas e critérios de aceite

- [x] Incorporar a investigação e suas evidências anonimizadas em `validation/`, preservando os registros anteriores.
- [x] Substituir a data inicial fixa pela data civil atual do navegador. Atualizar o modo automático ao recalcular/retomar uma aba em outro dia. Datas escolhidas explicitamente, exemplos datados e registros históricos precisam continuar reproduzíveis.
- [x] Aplicar a regra SAC sustentada por 21 resumos: coeficiente em oito casas, precisão monetária intermediária e última parcela resumida. Preservar os cálculos do cronograma e a separação entre resumo e planilha.
- [x] Refinar o coeficiente de referência SBPE comum dentro do intervalo compatível com as capturas. Validar também os pacotes de seguro, evitando arredondar adicionais antes da composição do resumo. Manter documentada a incerteza do coeficiente interno exato.
- [x] Conciliar a apresentação da taxa nominal com a CAIXA, sem reduzir a taxa usada nos juros. Conferir a mesma convenção na comparação e no histórico.
- [x] Acrescentar regressões com os oito cenários novos e as 420 parcelas oficiais, cobrindo máximo, principal fixado, entrada e seguros. Reavaliar a matriz de 30 cenários e referências históricas sem tolerância global.
- [x] Verificar a interface com relógio controlado: fuso local, abertura, limpeza, virada do dia, data manual, exemplos e histórico; conferir resultados, comparação e exportação do cronograma.
- [x] Executar `npm test`, testes de interface pertinentes e `npm run build`. Atualizar apenas os resíduos efetivamente reavaliados e registrar diferenças remanescentes.
- [x] Emitir avaliação final separada da implementação, baseada nos valores oficiais preservados, nos cenários que não determinaram as fórmulas e na comparação antes/depois. Explicitar limites; não presumir homologação universal por equivalência nos casos observados.

## Decisões e limites iniciais

- Data automática significa dia local do navegador, sem converter para UTC. A escolha manual é necessária para reproduzir uma oferta antiga.
- Coeficiente SBPE candidato: `0,000158774`, dentro do intervalo observado. É uma aproximação empírica; não uma tarifa oficial comprovada.
- Arredondamento intermediário do resumo: ao mais próximo, com desempate comum na terceira casa, preservando o desempate para par já observado na soma dos seguros. As capturas ainda não distinguem todos os empates possíveis.
- O prazo PRICE e o cronograma mantêm suas fórmulas, salvo evidência específica que justifique uma correção adicional.
- Implementação e build locais fazem parte da execução. A publicação não é necessária para verificar os resultados.

## Resultado

Plano executado. Resultado: 487/495 métricas exatas, contra 418/495 na revisão anterior; nenhuma métrica piorou. Os oito cenários novos coincidem em 48/48 métricas e as 420 parcelas coincidem integralmente. Consulte a [avaliação final](../validation/avaliacao-centavos-2026-09-23.md) para comandos, fontes, resíduos e limites.

Decisão adicional sustentada pela matriz: a soma financeira SAC do resumo exclui o acerto residual da última amortização; a planilha o mantém. A separação concilia os 28 totais oficiais observados, sem alterar linhas do cronograma. PRICE mantém sua soma efetiva.
