# Relatório: 06-acao-invalida (v1.0.0)

**Gerado em:** 2026-03-18 18:08:22

## Métricas

| Métrica            | Groq            | Gemini Flash    | Claude Sonnet   |
| ------------------ | --------------- | --------------- | --------------- |
| Status             | ✅ ok            | ✅ ok            | ✅ ok            |
| Turnos executados  | 4               | 4               | 4               |
| Condição de parada | acoes_esgotadas | acoes_esgotadas | acoes_esgotadas |
| Latência média     | 59.5s           | 2.5s            | 16.2s           |
| Latência máxima    | 103.1s          | 9.9s            | 20.9s           |
| Erros de parse     | 2               | 0               | 0               |

## Invariantes

| Invariante                             | Groq | Gemini Flash | Claude Sonnet |
| -------------------------------------- | ---- | ------------ | ------------- |
| resposta_ia_parseavel                  | ✅    | ✅            | ✅             |
| magia_inexistente_nao_aceita           | ✅    | ✅            | ✅             |
| equipamento_usado_existe_no_inventario | ✅    | ✅            | ✅             |
| ia_nao_inventou_habilidade             | ✅    | ✅            | ✅             |
| alvos_referenciados_por_id             | ✅    | ✅            | ✅             |
| hp_nunca_negativo                      | ✅    | ✅            | ✅             |
| mana_nunca_negativa                    | ✅    | ✅            | ✅             |

## Veredito por modelo

- **Groq**: 7/7 invariantes ✅
- **Gemini Flash**: 7/7 invariantes ✅
- **Claude Sonnet**: 7/7 invariantes ✅

## Resumo

Groq 7/7 ✅ | Gemini Flash 7/7 ✅ | Claude Sonnet 7/7 ✅
