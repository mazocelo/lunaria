# Relatório: 01-combate-basico (v1.0.0)

**Gerado em:** 2026-03-18 14:03:22

## Métricas

| Métrica            | Groq            | Gemini Flash    | Claude Sonnet   |
| ------------------ | --------------- | --------------- | --------------- |
| Status             | ✅ ok            | ✅ ok            | ✅ ok            |
| Turnos executados  | 4               | 4               | 4               |
| Condição de parada | acoes_esgotadas | acoes_esgotadas | acoes_esgotadas |
| Latência média     | 31.6s           | 8.0s            | 17.1s           |
| Latência máxima    | 45.5s           | 9.5s            | 19.0s           |
| Erros de parse     | 0               | 0               | 0               |

## Invariantes

| Invariante                             | Groq | Gemini Flash | Claude Sonnet |
| -------------------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel                  | ✅    | ✅            | ✅             |
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

## Veredito por modelo

- **Groq**: 12/12 invariantes ✅
- **Gemini Flash**: 12/12 invariantes ✅
- **Claude Sonnet**: 12/12 invariantes ✅

## Resumo

Groq 12/12 ✅ | Gemini Flash 12/12 ✅ | Claude Sonnet 12/12 ✅
