# Evidência D6 — Teste de Carga (RNF de Desempenho)

**Data:** 2026-06-16
**Executado por:** Gabriel Malheiros de Castro (matrícula 23110145)
**Frente:** D6 do Plano de Fechamento v2.0.0
([plano-2026-06-16-fechamento-v2.0.0.md](plano-2026-06-16-fechamento-v2.0.0.md))

## Objetivo

Validar o comportamento da aplicação em produção sob carga concorrente moderada,
gerando evidência mensurável de desempenho (latência e vazão) para o requisito
não funcional de desempenho, sem poluir o banco de dados nem afetar usuários.

## Metodologia

- **Ferramenta:** [autocannon](https://github.com/mcollina/autocannon) (via `npx`).
- **Alvo:** `GET https://acolhimento.faesa.gmcsistemas.com.br/version`.
  - Endpoint **público**, **leve** e **somente leitura** (retorna `{ name, version }`).
  - **Sem autenticação** e **sem escrita** — não gera registros no PostgreSQL nem
    altera estado da aplicação.
- **Parâmetros:** `-c 20` (20 conexões concorrentes) `-d 30` (30 segundos).
- **Ambiente de origem:** estação de desenvolvimento (Windows 11), rede externa,
  atravessando Traefik 3.6.7 → contêiner Docker no EasyPanel (VPS Ubuntu 24.04).
- **Versão publicada no momento do teste:** `2.0.0` (confirmada via `/version`).

## Comando

```powershell
npx --yes autocannon -c 20 -d 30 https://acolhimento.faesa.gmcsistemas.com.br/version
```

## Resultado

```
Running 30s test @ https://acolhimento.faesa.gmcsistemas.com.br/version
20 connections

┌─────────┬───────┬───────┬───────┬────────┬──────────┬─────────┬─────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%    │ Avg      │ Stdev   │ Max     │
├─────────┼───────┼───────┼───────┼────────┼──────────┼─────────┼─────────┤
│ Latency │ 23 ms │ 30 ms │ 78 ms │ 114 ms │ 35.44 ms │ 24.1 ms │ 1208 ms │
└─────────┴───────┴───────┴───────┴────────┴──────────┴─────────┴─────────┘
┌───────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%    │ 97.5%  │ Avg    │ Stdev  │ Min    │
├───────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Req/Sec   │ 288    │ 288    │ 592    │ 720    │ 557,84 │ 120,5  │ 288    │
├───────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ Bytes/Sec │ 257 kB │ 257 kB │ 528 kB │ 643 kB │ 498 kB │ 107 kB │ 257 kB │
└───────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 30

17k requests in 30.12s, 14.9 MB read
```

## Análise

| Métrica | Valor | Leitura |
|---------|-------|---------|
| Total de requisições | ~17.000 em 30,12 s | Vazão sustentada sob carga contínua. |
| Vazão média | 557,84 req/s | Adequada para um protótipo acadêmico single-stage. |
| Latência mediana (p50) | 30 ms | Resposta rápida no caso típico. |
| Latência p97.5 | 78 ms | Cauda curta — boa consistência. |
| Latência p99 | 114 ms | Aceitável; 99% das respostas abaixo de 114 ms. |
| Latência máxima | 1208 ms | Pico isolado (provável cold path/GC ou rede), sem impacto na mediana. |
| Erros / respostas não-2xx | 0 | Nenhuma falha: o serviço respondeu 200 em todas as requisições. |
| Vazão de dados | 14,9 MB lidos | Coerente com payload JSON pequeno do `/version`. |

## Conclusão

A aplicação **suportou ~17 mil requisições em 30 segundos sem nenhuma falha**,
mantendo latência mediana de 30 ms e p99 de 114 ms sob 20 conexões concorrentes.
O único outlier (1,2 s máximo) não comprometeu a experiência agregada. O resultado
atende ao requisito não funcional de desempenho para o escopo do protótipo.

> **Observações de método:** o teste mirou exclusivamente o endpoint `/version`
> (leitura, sem efeitos colaterais), preservando a integridade do banco de produção.
> A medição inclui a latência de rede externa e do proxy Traefik, ou seja, reflete a
> experiência real de um cliente — não apenas o tempo interno do Express.
