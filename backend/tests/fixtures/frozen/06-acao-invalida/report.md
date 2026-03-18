# Relatório: 06-acao-invalida (v1.0.0)

**Gerado em:** 2026-03-18 14:03:22

## Métricas

| Métrica            | Groq            | Gemini Flash    | Claude Sonnet   |
| ------------------ | --------------- | --------------- | --------------- |
| Status             | ❌ fail          | ✅ ok            | ✅ ok            |
| Turnos executados  | 4               | 4               | 4               |
| Condição de parada | acoes_esgotadas | acoes_esgotadas | acoes_esgotadas |
| Latência média     | 59.5s           | 8.6s            | 16.2s           |
| Latência máxima    | 103.1s          | 10.6s           | 20.9s           |
| Erros de parse     | 2               | 0               | 0               |

## Invariantes

| Invariante                             | Groq | Gemini Flash | Claude Sonnet |
| -------------------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel                  | ❌    | ✅            | ✅             |
| magia_inexistente_nao_aceita           | ✅    | ✅            | ✅             |
| equipamento_usado_existe_no_inventario | ❌    | ❌            | ❌             |
| ia_nao_inventou_habilidade             | ✅    | ✅            | ✅             |
| alvos_referenciados_por_id             | ✅    | ✅            | ✅             |
| hp_nunca_negativo                      | ✅    | ✅            | ✅             |
| mana_nunca_negativa                    | ✅    | ✅            | ✅             |

## Falhas Detalhadas

- **[Groq]** `resposta_ia_parseavel`
  - turno 3: respostaParseou = false (json_invalido: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_00000000000000000000000000` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 99816, Requested 8754. Please try again in 2h3m24.48s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}})
- **[Groq]** `resposta_ia_parseavel`
  - turno 4: respostaParseou = false (json_invalido: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_00000000000000000000000000` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 99697, Requested 8754. Please try again in 2h1m41.664s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}})
- **[Groq]** `equipamento_usado_existe_no_inventario`
  - turno 3: arma "alabarda" nao encontrada em equipamentos do personagem
- **[Gemini Flash]** `equipamento_usado_existe_no_inventario`
  - turno 3: arma "alabarda" nao encontrada em equipamentos do personagem
- **[Claude Sonnet]** `equipamento_usado_existe_no_inventario`
  - turno 3: arma "alabarda" nao encontrada em equipamentos do personagem

## Veredito por modelo

- **Groq**: 5/7 invariantes ⚠️
  - Falhas: resposta_ia_parseavel, resposta_ia_parseavel, equipamento_usado_existe_no_inventario
- **Gemini Flash**: 6/7 invariantes ⚠️
  - Falhas: equipamento_usado_existe_no_inventario
- **Claude Sonnet**: 6/7 invariantes ⚠️
  - Falhas: equipamento_usado_existe_no_inventario

## Resumo

Groq 5/7 ⚠️ | Gemini Flash 6/7 ⚠️ | Claude Sonnet 6/7 ⚠️
