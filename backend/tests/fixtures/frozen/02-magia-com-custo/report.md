# Relatório: 02-magia-com-custo (v1.0.0)

**Gerado em:** 2026-03-18 07:44:54

## Métricas

| Métrica            | Groq            | Gemini Flash    | Claude Sonnet   |
| ------------------ | --------------- | --------------- | --------------- |
| Status             | ✅ ok            | ✅ ok            | ✅ ok            |
| Turnos executados  | 5               | 5               | 5               |
| Condição de parada | acoes_esgotadas | acoes_esgotadas | acoes_esgotadas |
| Latência média     | 36.5s           | 8.3s            | 16.9s           |
| Latência máxima    | 51.4s           | 11.4s           | 21.5s           |
| Erros de parse     | 0               | 0               | 0               |

## Invariantes

| Invariante                    | Groq | Gemini Flash | Claude Sonnet |
| ----------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel         | ✅    | ✅            | ✅             |
| hp_nunca_negativo             | ✅    | ✅            | ✅             |
| hp_nunca_acima_maximo         | ✅    | ✅            | ✅             |
| mana_nunca_negativa           | ✅    | ✅            | ✅             |
| mana_nunca_acima_maximo       | ✅    | ✅            | ✅             |
| mana_descontada_ao_usar_magia | ❌    | ❌            | ❌             |
| magia_inexistente_nao_aceita  | ✅    | ✅            | ✅             |
| alvos_referenciados_por_id    | ✅    | ✅            | ✅             |

## Falhas Detalhadas

- **[Groq]** `mana_descontada_ao_usar_magia`
  - turno 5: magia luz_divina custo 3, mana antes=2 esperado apos=-1 obtido=0
- **[Gemini Flash]** `mana_descontada_ao_usar_magia`
  - turno 5: magia luz_divina custo 3, mana antes=2 esperado apos=-1 obtido=0
- **[Claude Sonnet]** `mana_descontada_ao_usar_magia`
  - turno 5: magia luz_divina custo 3, mana antes=2 esperado apos=-1 obtido=0

## Veredito por modelo

- **Groq**: 7/8 invariantes ⚠️
  - Falhas: mana_descontada_ao_usar_magia
- **Gemini Flash**: 7/8 invariantes ⚠️
  - Falhas: mana_descontada_ao_usar_magia
- **Claude Sonnet**: 7/8 invariantes ⚠️
  - Falhas: mana_descontada_ao_usar_magia

## Resumo

Groq 7/8 ⚠️ | Gemini Flash 7/8 ⚠️ | Claude Sonnet 7/8 ⚠️
