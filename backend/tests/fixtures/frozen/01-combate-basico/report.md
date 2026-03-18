# Relatório: 01-combate-basico (v1.0.0)

**Gerado em:** 2026-03-18 07:29:42

## Métricas

| Métrica            | Groq            | Gemini Flash | Claude Sonnet |
| ------------------ | --------------- | ------------ | ------------- |
| Status             | ✅ ok            | — (no log)   | — (no log)    |
| Turnos executados  | 4               | — (no log)   | — (no log)    |
| Condição de parada | acoes_esgotadas | — (no log)   | — (no log)    |
| Latência média     | 31.6s           | — (no log)   | — (no log)    |
| Latência máxima    | 45.5s           | — (no log)   | — (no log)    |
| Erros de parse     | 0               | — (no log)   | — (no log)    |

## Invariantes

| Invariante                             | Groq | Gemini Flash | Claude Sonnet |
| -------------------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel                  | ✅    | —            | —             |
| hp_nunca_negativo                      | ✅    | —            | —             |
| hp_nunca_acima_maximo                  | ✅    | —            | —             |
| mana_nunca_negativa                    | ✅    | —            | —             |
| mana_nunca_acima_maximo                | ✅    | —            | —             |
| mana_descontada_ao_usar_magia          | ✅    | —            | —             |
| dano_aplicado_quando_ataque_sucede     | ✅    | —            | —             |
| monstro_derrotado_quando_hp_zero       | ✅    | —            | —             |
| combate_encerra_sem_monstros_vivos     | ✅    | —            | —             |
| xp_distribuido_apos_vitoria            | ✅    | —            | —             |
| equipamento_usado_existe_no_inventario | ✅    | —            | —             |
| alvos_referenciados_por_id             | ✅    | —            | —             |

## Veredito por modelo

- **Groq**: 12/12 invariantes ✅
- **Gemini Flash**: — (sem log disponível)
- **Claude Sonnet**: — (sem log disponível)

## Resumo

Groq 12/12 ✅ | Gemini Flash — (no log) | Claude Sonnet — (no log)
