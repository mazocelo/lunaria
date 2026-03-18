# Relatório: 02-magia-com-custo (v1.0.0)

**Gerado em:** 2026-03-18 18:08:22

## Métricas

| Métrica            | Groq            | Gemini Flash    | Claude Sonnet   |
| ------------------ | --------------- | --------------- | --------------- |
| Status             | ✅ ok            | ✅ ok            | ✅ ok            |
| Turnos executados  | 5               | 6               | 5               |
| Condição de parada | acoes_esgotadas | acoes_esgotadas | acoes_esgotadas |
| Latência média     | 36.5s           | 7.3s            | 15.6s           |
| Latência máxima    | 51.4s           | 15.7s           | 19.6s           |
| Erros de parse     | 0               | 0               | 0               |

## Invariantes

| Invariante                    | Groq | Gemini Flash | Claude Sonnet |
| ----------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel         | ✅    | ✅            | ✅             |
| hp_nunca_negativo             | ✅    | ✅            | ✅             |
| hp_nunca_acima_maximo         | ✅    | ✅            | ✅             |
| mana_nunca_negativa           | ✅    | ✅            | ✅             |
| mana_nunca_acima_maximo       | ✅    | ✅            | ✅             |
| mana_descontada_ao_usar_magia | ✅    | ❌            | ✅             |
| magia_inexistente_nao_aceita  | ✅    | ✅            | ✅             |
| alvos_referenciados_por_id    | ✅    | ✅            | ✅             |

## Falhas Detalhadas

- **[Gemini Flash]** `mana_descontada_ao_usar_magia`
  - turno 6: magia luz_divina custo 3, mana antes=2 esperado apos=-1 obtido=2

## Veredito por modelo

- **Groq**: 8/8 invariantes ✅
- **Gemini Flash**: 7/8 invariantes ⚠️
  - Falhas: mana_descontada_ao_usar_magia
- **Claude Sonnet**: 8/8 invariantes ✅

## Resumo

Groq 8/8 ✅ | Gemini Flash 7/8 ⚠️ | Claude Sonnet 8/8 ✅
