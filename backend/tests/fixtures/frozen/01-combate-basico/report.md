# Relatório: 01-combate-basico (v1.0.0)

**Gerado em:** 2026-03-18 18:08:22

## Métricas

| Métrica            | Groq            | Gemini Flash    | Claude Sonnet   |
| ------------------ | --------------- | --------------- | --------------- |
| Status             | ❌ fail          | ✅ ok            | ✅ ok            |
| Turnos executados  | 6               | 4               | 4               |
| Condição de parada | acoes_esgotadas | acoes_esgotadas | acoes_esgotadas |
| Latência média     | 34.4s           | 8.0s            | 17.1s           |
| Latência máxima    | 93.4s           | 9.5s            | 19.0s           |
| Erros de parse     | 1               | 0               | 0               |

## Invariantes

| Invariante                             | Groq | Gemini Flash | Claude Sonnet |
| -------------------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel                  | ❌    | ✅            | ✅             |
| hp_nunca_negativo                      | ✅    | ✅            | ✅             |
| hp_nunca_acima_maximo                  | ✅    | ✅            | ✅             |
| mana_nunca_negativa                    | ✅    | ✅            | ✅             |
| mana_nunca_acima_maximo                | ✅    | ✅            | ✅             |
| mana_descontada_ao_usar_magia          | ✅    | ✅            | ✅             |
| dano_aplicado_quando_ataque_sucede     | ✅    | ✅            | ✅             |
| monstro_derrotado_quando_hp_zero       | ✅    | ✅            | ✅             |
| combate_encerra_sem_monstros_vivos     | ✅    | ✅            | ✅             |
| xp_distribuido_apos_vitoria            | ✅    | ✅            | ✅             |
| equipamento_usado_existe_no_inventario | ✅    | ✅            | ✅             |
| alvos_referenciados_por_id             | ✅    | ✅            | ✅             |

## Falhas Detalhadas

- **[Groq]** `resposta_ia_parseavel`
  - turno 6: respostaParseou = false (json_invalido: 429 {"error":{"message":"Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_00000000000000000000000000` service tier `on_demand` on tokens per day (TPD): Limit 100000, Used 93099, Requested 8803. Please try again in 27m23.328s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}})

## Veredito por modelo

- **Groq**: 11/12 invariantes ⚠️
  - Falhas: resposta_ia_parseavel
- **Gemini Flash**: 12/12 invariantes ✅
- **Claude Sonnet**: 12/12 invariantes ✅

## Resumo

Groq 11/12 ⚠️ | Gemini Flash 12/12 ✅ | Claude Sonnet 12/12 ✅
