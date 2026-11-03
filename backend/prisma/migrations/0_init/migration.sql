-- CreateEnum
CREATE TYPE "Sistema" AS ENUM ('lunaria', 'tresdet', 'dnd5e', 'daemon');

-- CreateEnum
CREATE TYPE "enum_alcance" AS ENUM ('toque', 'curto', 'medio', 'longo', 'extremo', 'pessoal', 'ilimitado');

-- CreateEnum
CREATE TYPE "enum_area_tipo" AS ENUM ('nenhuma', 'esfera', 'cone', 'linha', 'cubo', 'cilindro');

-- CreateEnum
CREATE TYPE "enum_tempo_conjuracao" AS ENUM ('instantaneo', 'acao', 'turno_cheio', 'ritual', 'preparacao');

-- CreateEnum
CREATE TYPE "enum_categoria_habilidade" AS ENUM ('combate_fisico', 'magia_ofensiva', 'magia_defensiva', 'cura', 'suporte', 'controle', 'utilidade', 'social', 'crafting');

-- CreateEnum
CREATE TYPE "enum_escola_magia" AS ENUM ('nenhuma', 'evocacao', 'abjuracao', 'necromancia', 'ilusao', 'transmutacao', 'adivinhacao', 'encantamento', 'conjuracao', 'universal');

-- CreateEnum
CREATE TYPE "enum_categoria_receita" AS ENUM ('pocao', 'veneno', 'bomba', 'armadilha', 'pergaminho', 'municao', 'comida', 'equipamento', 'engenhoca', 'kit');

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "custo" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "bonus" TEXT,
    "imagem" VARCHAR(500),
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',

    CONSTRAINT "classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desvantagens" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo" INTEGER NOT NULL DEFAULT 0,
    "tipo" VARCHAR(255)[] DEFAULT ARRAY['ativa']::VARCHAR(255)[],
    "bonus" JSONB,
    "restricao" JSONB,
    "dano_base" TEXT,
    "efeito" JSON,
    "usar" INTEGER,
    "elemento" VARCHAR(255)[],
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "requisitos" JSONB,
    "criada_em" TIMESTAMPTZ(6),
    "atualizada_em" TIMESTAMPTZ(6),
    "imagem" VARCHAR(500),
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',

    CONSTRAINT "descantagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raridades" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "cor" VARCHAR(30),
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "raridades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_equipamento" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "icone" VARCHAR(10),
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_monstro" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "icone" VARCHAR(10),
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_monstro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT[],
    "bonus" JSONB DEFAULT '[]',
    "dano_base" TEXT,
    "elemento" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requisitos" JSONB,
    "imagem" VARCHAR(500),
    "numero" INTEGER,
    "origem_lore" TEXT,
    "propriedades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cargas" INTEGER,
    "usos_por_dia" INTEGER,
    "vinculo" JSONB,
    "categoria_id" INTEGER,
    "raridade_id" INTEGER,
    "peso" DOUBLE PRECISION,
    "preco_sugerido" TEXT,
    "preco" INTEGER NOT NULL DEFAULT 0,
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',

    CONSTRAINT "equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "maximo_de_participantes" INTEGER,
    "prologo" TEXT,
    "descricao" TEXT,
    "status" VARCHAR(255) DEFAULT 'ativa',
    "criada_em" TIMESTAMPTZ(6),
    "atualizada_em" TIMESTAMPTZ(6),
    "id_usuario" INTEGER,
    "temas" INTEGER[],
    "deleted_at" TIMESTAMPTZ(6),
    "mestre_id" INTEGER,
    "imagem" VARCHAR(500),
    "mapas" JSONB,
    "publica" BOOLEAN NOT NULL DEFAULT false,
    "roteiro" JSONB,
    "roteiro_status" VARCHAR(50),
    "estilo_imagem" VARCHAR(50) DEFAULT 'fantasy_painting',
    "config" JSONB,
    "mestre_tier" VARCHAR(20) DEFAULT 'poeta',
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',

    CONSTRAINT "historias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personagem_desvantagem" (
    "personagem_id" INTEGER NOT NULL,
    "habilidade_id" INTEGER NOT NULL,

    CONSTRAINT "personagem_habilidade_pkey" PRIMARY KEY ("personagem_id","habilidade_id")
);

-- CreateTable
CREATE TABLE "personagem_equipamento" (
    "personagem_id" INTEGER NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "equipado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "personagem_equipamento_pkey" PRIMARY KEY ("personagem_id","equipamento_id")
);

-- CreateTable
CREATE TABLE "personagem_vantagem" (
    "desvantagem_id" INTEGER NOT NULL,
    "personagem_id" INTEGER NOT NULL,

    CONSTRAINT "personagem_vantagem_pkey" PRIMARY KEY ("personagem_id","desvantagem_id")
);

-- CreateTable
CREATE TABLE "personagens" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "nivel" INTEGER DEFAULT 1,
    "pontos_totais" INTEGER DEFAULT 0,
    "pontos_iniciais" INTEGER DEFAULT 0,
    "background" TEXT,
    "raca_id" INTEGER,
    "classe_id" INTEGER,
    "criado_em" TIMESTAMPTZ(6),
    "atualizado_em" TIMESTAMPTZ(6),
    "id_usuario" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "imagem" VARCHAR(500),
    "pontos_atributo_pendentes" INTEGER DEFAULT 0,
    "xp_atual" INTEGER DEFAULT 0,
    "xp_proximo_nivel" INTEGER DEFAULT 100,
    "hp_atual" INTEGER,
    "mp_atual" INTEGER,
    "moedas" INTEGER NOT NULL DEFAULT 0,
    "voice_id" VARCHAR(100),
    "voice_provider" VARCHAR(50),
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',
    "stats_sistema" JSONB,

    CONSTRAINT "personagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atributos_personagem" (
    "id" SERIAL NOT NULL,
    "personagem_id" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "valor" INTEGER NOT NULL,

    CONSTRAINT "atributos_personagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "custo" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT,
    "bonus" TEXT,
    "imagem" VARCHAR(500),
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',
    "mult_raca" INTEGER DEFAULT 5,
    "pode_magia" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "raca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" VARCHAR(255),

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) DEFAULT 'player',
    "deleted_at" TIMESTAMPTZ(6),
    "reset_token" VARCHAR(500),
    "reset_token_expires" TIMESTAMPTZ(6),
    "avatar" VARCHAR(500),
    "bio" VARCHAR(500),
    "preferencias" JSONB DEFAULT '{}',
    "privacidade" JSONB DEFAULT '{}',

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vantagens" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo" INTEGER NOT NULL DEFAULT 0,
    "tipo" VARCHAR(255)[] DEFAULT ARRAY['ativa']::VARCHAR(255)[],
    "bonus" JSONB,
    "restricao" JSONB,
    "dano_base" TEXT,
    "efeito" JSON,
    "usar" INTEGER,
    "elemento" VARCHAR(255)[],
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "requisitos" JSONB,
    "criada_em" TIMESTAMPTZ(6),
    "atualizada_em" TIMESTAMPTZ(6),
    "imagem" VARCHAR(500),
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',
    "subtipo" VARCHAR(50),
    "vantagens_inclusas" JSONB,
    "desvantagens_inclusas" JSONB,

    CONSTRAINT "habilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_personagens" (
    "id" SERIAL NOT NULL,
    "historia_id" INTEGER NOT NULL,
    "personagem_id" INTEGER NOT NULL,
    "papel" VARCHAR(50),

    CONSTRAINT "historias_personagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_convite" (
    "id" SERIAL NOT NULL,
    "historia_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "criado_em" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "respondido_em" TIMESTAMP(6),

    CONSTRAINT "historias_convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mestres" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "personalidade" TEXT,
    "modelo" VARCHAR(100) DEFAULT 'gemini-2.5-flash',
    "temperatura" DOUBLE PRECISION DEFAULT 0.9,
    "max_tokens" INTEGER DEFAULT 8000,
    "tom_narrativo" VARCHAR(255),
    "regras_especiais" TEXT,
    "imagem" VARCHAR(500),
    "voice_id" VARCHAR(100),
    "voice_provider" VARCHAR(50) DEFAULT 'elevenlabs',
    "id_usuario" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "mestres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monstros" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(50)[] DEFAULT ARRAY['besta']::VARCHAR(50)[],
    "nivel_min" INTEGER NOT NULL DEFAULT 1,
    "nivel_max" INTEGER NOT NULL DEFAULT 10,
    "hp_base" INTEGER NOT NULL DEFAULT 15,
    "ataque_base" INTEGER NOT NULL DEFAULT 2,
    "defesa_base" INTEGER NOT NULL DEFAULT 10,
    "dano_base" VARCHAR(20) NOT NULL DEFAULT '1d6',
    "habilidades" JSONB DEFAULT '[]',
    "elemento" VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR(50)[],
    "temas" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "xp_base" INTEGER NOT NULL DEFAULT 50,
    "imagem" VARCHAR(500),
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6),
    "raridade_id" INTEGER,
    "categoria_id" INTEGER,
    "habitat" VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR(100)[],
    "imunidades" VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR(50)[],
    "resistencias" JSONB DEFAULT '{}',
    "tamanho" VARCHAR(30) DEFAULT 'medio',
    "escala" VARCHAR(20) DEFAULT 'ningen',
    "velocidade" JSONB DEFAULT '{"terrestre": 30}',
    "mult_raca" INTEGER DEFAULT 5,
    "armadura_natural" INTEGER DEFAULT 0,
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',

    CONSTRAINT "monstros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atributos_monstro" (
    "id" SERIAL NOT NULL,
    "monstro_id" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "valor" INTEGER NOT NULL,

    CONSTRAINT "atributos_monstro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_jogo" (
    "id" SERIAL NOT NULL,
    "historia_id" INTEGER NOT NULL,
    "sala_id" VARCHAR(100) NOT NULL,
    "estado" JSONB NOT NULL,
    "mensagens" JSONB NOT NULL,
    "resumos" JSONB,
    "jogadores" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ativa',
    "rodada_atual" INTEGER NOT NULL DEFAULT 0,
    "fase" VARCHAR(50),
    "iniciada_em" TIMESTAMPTZ(6),
    "finalizada_em" TIMESTAMPTZ(6),
    "ultimo_snapshot" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criada_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizada_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessoes_jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elementos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "descricao" TEXT,
    "cor" VARCHAR(30),
    "icone" VARCHAR(10),
    "ordem" INTEGER DEFAULT 0,

    CONSTRAINT "elementos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_elementais" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "emoji" VARCHAR(10),
    "cor" VARCHAR(30),
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "focus_elementais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magias_tresdet" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT NOT NULL,
    "escola" VARCHAR(50) NOT NULL,
    "custo_pm" VARCHAR(50) NOT NULL,
    "alcance" VARCHAR(30) NOT NULL,
    "duracao" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'dano',
    "exigencias" VARCHAR(200),
    "focus_requisito" JSONB,
    "efeito" JSONB,
    "nivel_minimo" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "magias_tresdet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amizades" (
    "id" SERIAL NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pendente',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6),

    CONSTRAINT "amizades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'post',
    "conteudo" JSONB NOT NULL,
    "entidade_tipo" VARCHAR(50),
    "entidade_id" INTEGER,
    "visibilidade" VARCHAR(20) NOT NULL DEFAULT 'amigos',
    "deleted_at" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_curtidas" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_curtidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_comentarios" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personagem_sessao" (
    "id" SERIAL NOT NULL,
    "sessao_jogo_id" INTEGER NOT NULL,
    "personagem_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "nivel_inicio" INTEGER NOT NULL DEFAULT 1,
    "xp_inicio" INTEGER NOT NULL DEFAULT 0,
    "atributos_snapshot" JSONB NOT NULL,
    "equipamentos_inicio" JSONB NOT NULL DEFAULT '[]',
    "vantagens_snapshot" JSONB NOT NULL DEFAULT '[]',
    "desvantagens_snapshot" JSONB NOT NULL DEFAULT '[]',
    "classe_nome" VARCHAR(100),
    "raca_nome" VARCHAR(100),
    "hp_atual" INTEGER,
    "hp_max" INTEGER,
    "mana_atual" INTEGER,
    "mana_max" INTEGER,
    "xp_ganho" INTEGER NOT NULL DEFAULT 0,
    "nivel_fim" INTEGER,
    "itens_ganhos" JSONB NOT NULL DEFAULT '[]',
    "itens_perdidos" JSONB NOT NULL DEFAULT '[]',
    "status_efeitos" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ativa',
    "merged_at" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "personagem_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilidades_magias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT NOT NULL,
    "custo_mana" INTEGER NOT NULL DEFAULT 0,
    "dano_base" VARCHAR(50),
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'dano',
    "elemento" VARCHAR(50),
    "nivel_requerido" INTEGER NOT NULL DEFAULT 1,
    "cooldown_turnos" INTEGER NOT NULL DEFAULT 0,
    "classe_id" INTEGER,
    "efeito" JSONB,
    "alvo" VARCHAR(30) NOT NULL DEFAULT 'inimigo',
    "alcance" VARCHAR(30) NOT NULL DEFAULT 'medio',
    "area_efeito" JSONB,
    "tempo_conjuracao" VARCHAR(30) NOT NULL DEFAULT 'acao',
    "usa_concentracao" BOOLEAN NOT NULL DEFAULT false,
    "categoria" VARCHAR(30) NOT NULL DEFAULT 'combate_fisico',
    "escola_magia" VARCHAR(30),
    "escalamento" JSONB,
    "pre_requisito" JSONB,
    "raca_id" INTEGER,
    "usos_por_descanso" INTEGER,
    "componente_material" JSONB,
    "saving_throw" VARCHAR(30),
    "imagem" VARCHAR(500),
    "sistema" "Sistema" NOT NULL DEFAULT 'lunaria',

    CONSTRAINT "habilidades_magias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hm_classe" (
    "id" SERIAL NOT NULL,
    "habilidade_id" INTEGER NOT NULL,
    "classe_id" INTEGER NOT NULL,

    CONSTRAINT "hm_classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hm_raca" (
    "id" SERIAL NOT NULL,
    "habilidade_id" INTEGER NOT NULL,
    "raca_id" INTEGER NOT NULL,

    CONSTRAINT "hm_raca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hm_personagem" (
    "id" SERIAL NOT NULL,
    "personagem_id" INTEGER NOT NULL,
    "habilidade_id" INTEGER NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'criacao',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hm_personagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hm_slots_classe" (
    "id" SERIAL NOT NULL,
    "classe_id" INTEGER NOT NULL,
    "nivel" INTEGER NOT NULL,
    "slots" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hm_slots_classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monstro_loot" (
    "id" SERIAL NOT NULL,
    "monstro_id" INTEGER NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "drop_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "min_quantidade" INTEGER NOT NULL DEFAULT 1,
    "max_quantidade" INTEGER NOT NULL DEFAULT 1,
    "nivel_minimo" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monstro_loot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(100),
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "caracteres" INTEGER,
    "custo_usd" DOUBLE PRECISION DEFAULT 0,
    "duracao_ms" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tts_cache" (
    "id" SERIAL NOT NULL,
    "cache_key" VARCHAR(128) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "voice_id" VARCHAR(100) NOT NULL,
    "caracteres" INTEGER NOT NULL,
    "audio_data" BYTEA,
    "tamanho_bytes" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audio_url" TEXT,

    CONSTRAINT "tts_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_eventos" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "dados" JSONB DEFAULT '{}',
    "user_id" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_jobs" (
    "id" TEXT NOT NULL,
    "queue" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "owner_user_id" INTEGER,
    "status" VARCHAR(20) NOT NULL,
    "bullmq_job_id" VARCHAR(191),
    "request_payload" JSONB,
    "attempts_total" INTEGER NOT NULL DEFAULT 2,
    "attempts_made" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "queued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "request_prompt" TEXT,
    "response_text" TEXT,

    CONSTRAINT "ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roteiro_versoes" (
    "id" SERIAL NOT NULL,
    "historia_id" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "modo" VARCHAR(30) NOT NULL,
    "temperatura" DOUBLE PRECISION NOT NULL,
    "modelo" VARCHAR(60) NOT NULL,
    "roteiro" JSONB NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "metadados" JSONB,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "reviewer_id" INTEGER,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_comment" TEXT,

    CONSTRAINT "roteiro_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'material',
    "raridade_id" INTEGER,
    "preco_base" INTEGER NOT NULL DEFAULT 1,
    "peso" DOUBLE PRECISION DEFAULT 0.1,
    "icone" VARCHAR(10),
    "empilhavel" BOOLEAN NOT NULL DEFAULT true,
    "max_pilha" INTEGER NOT NULL DEFAULT 99,

    CONSTRAINT "ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ferramentas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'kit',
    "preco_base" INTEGER NOT NULL DEFAULT 50,
    "peso" DOUBLE PRECISION DEFAULT 2.0,
    "classe_id" INTEGER,

    CONSTRAINT "ferramentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "categoria" VARCHAR(30) NOT NULL DEFAULT 'pocao',
    "habilidade_id" INTEGER,
    "equipamento_id" INTEGER,
    "quantidade_resultado" INTEGER NOT NULL DEFAULT 1,
    "nivel_requerido" INTEGER NOT NULL DEFAULT 1,
    "classe_id" INTEGER,
    "dificuldade" INTEGER NOT NULL DEFAULT 10,
    "atributo_teste" VARCHAR(30) NOT NULL DEFAULT 'inteligencia',
    "tempo_fabricacao" INTEGER NOT NULL DEFAULT 1,
    "tempo_fora_combate" INTEGER DEFAULT 30,
    "descoberta" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receita_ingrediente" (
    "id" SERIAL NOT NULL,
    "receita_id" INTEGER NOT NULL,
    "ingrediente_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "consumido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "receita_ingrediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receita_ferramenta" (
    "id" SERIAL NOT NULL,
    "receita_id" INTEGER NOT NULL,
    "ferramenta_id" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "receita_ferramenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monstro_ingrediente" (
    "id" SERIAL NOT NULL,
    "monstro_id" INTEGER NOT NULL,
    "ingrediente_id" INTEGER NOT NULL,
    "drop_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "min_quantidade" INTEGER NOT NULL DEFAULT 1,
    "max_quantidade" INTEGER NOT NULL DEFAULT 3,
    "nivel_minimo" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "monstro_ingrediente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_tresdet" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(30) NOT NULL,
    "custo_pe" INTEGER NOT NULL DEFAULT 0,
    "preco_moedas" INTEGER NOT NULL DEFAULT 0,
    "poderes" JSONB,
    "efeito" TEXT,
    "empilhavel" BOOLEAN NOT NULL DEFAULT false,
    "raridade" VARCHAR(30),
    "imagem" VARCHAR(500),
    "magia_vinculada" VARCHAR(200),

    CONSTRAINT "itens_tresdet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personagem_item_tresdet" (
    "personagem_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "equipado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "personagem_item_tresdet_pkey" PRIMARY KEY ("personagem_id","item_id")
);

-- CreateTable
CREATE TABLE "personagem_magia_tresdet" (
    "id" SERIAL NOT NULL,
    "personagem_id" INTEGER NOT NULL,
    "magia_tresdet_id" INTEGER NOT NULL,
    "origem" VARCHAR(30) NOT NULL DEFAULT 'criacao',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personagem_magia_tresdet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classes_nome_sistema_key" ON "classes"("nome", "sistema");

-- CreateIndex
CREATE INDEX "idx_desvantagem_nivel" ON "desvantagens"("nivel");

-- CreateIndex
CREATE INDEX "idx_desvantagem_usar" ON "desvantagens"("usar");

-- CreateIndex
CREATE UNIQUE INDEX "desvantagens_nome_sistema_key" ON "desvantagens"("nome", "sistema");

-- CreateIndex
CREATE UNIQUE INDEX "raridades_nome_key" ON "raridades"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_equipamento_nome_key" ON "categorias_equipamento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_monstro_nome_key" ON "categorias_monstro"("nome");

-- CreateIndex
CREATE INDEX "idx_equipamento_categoria" ON "equipamentos"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_equipamento_raridade" ON "equipamentos"("raridade_id");

-- CreateIndex
CREATE INDEX "idx_equipamento_numero" ON "equipamentos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_nome_sistema_key" ON "equipamentos"("nome", "sistema");

-- CreateIndex
CREATE INDEX "historias_id_usuario_idx" ON "historias"("id_usuario");

-- CreateIndex
CREATE INDEX "historias_id_usuario_deleted_at_idx" ON "historias"("id_usuario", "deleted_at");

-- CreateIndex
CREATE INDEX "historias_mestre_id_idx" ON "historias"("mestre_id");

-- CreateIndex
CREATE INDEX "historias_status_idx" ON "historias"("status");

-- CreateIndex
CREATE INDEX "historias_deleted_at_idx" ON "historias"("deleted_at");

-- CreateIndex
CREATE INDEX "personagens_id_usuario_idx" ON "personagens"("id_usuario");

-- CreateIndex
CREATE INDEX "personagens_id_usuario_deleted_at_idx" ON "personagens"("id_usuario", "deleted_at");

-- CreateIndex
CREATE INDEX "personagens_deleted_at_idx" ON "personagens"("deleted_at");

-- CreateIndex
CREATE INDEX "personagens_classe_id_idx" ON "personagens"("classe_id");

-- CreateIndex
CREATE INDEX "personagens_raca_id_idx" ON "personagens"("raca_id");

-- CreateIndex
CREATE INDEX "personagens_sistema_idx" ON "personagens"("sistema");

-- CreateIndex
CREATE INDEX "atributos_personagem_personagem_id_idx" ON "atributos_personagem"("personagem_id");

-- CreateIndex
CREATE UNIQUE INDEX "atributos_personagem_personagem_id_nome_key" ON "atributos_personagem"("personagem_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "racas_nome_sistema_key" ON "racas"("nome", "sistema");

-- CreateIndex
CREATE UNIQUE INDEX "temas_nome_key" ON "temas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_deleted_at_idx" ON "usuarios"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_habilidade_nivel" ON "vantagens"("nivel");

-- CreateIndex
CREATE INDEX "idx_habilidade_usar" ON "vantagens"("usar");

-- CreateIndex
CREATE INDEX "idx_vantagem_nivel" ON "vantagens"("nivel");

-- CreateIndex
CREATE INDEX "idx_vantagem_usar" ON "vantagens"("usar");

-- CreateIndex
CREATE UNIQUE INDEX "vantagens_nome_sistema_key" ON "vantagens"("nome", "sistema");

-- CreateIndex
CREATE INDEX "historias_personagens_personagem_id_idx" ON "historias_personagens"("personagem_id");

-- CreateIndex
CREATE UNIQUE INDEX "unq_historia_personagem" ON "historias_personagens"("historia_id", "personagem_id");

-- CreateIndex
CREATE INDEX "historias_convite_usuario_id_idx" ON "historias_convite"("usuario_id");

-- CreateIndex
CREATE INDEX "historias_convite_status_idx" ON "historias_convite"("status");

-- CreateIndex
CREATE UNIQUE INDEX "unq_convite" ON "historias_convite"("historia_id", "usuario_id");

-- CreateIndex
CREATE INDEX "mestres_id_usuario_idx" ON "mestres"("id_usuario");

-- CreateIndex
CREATE INDEX "mestres_deleted_at_idx" ON "mestres"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "mestres_id_usuario_nome_key" ON "mestres"("id_usuario", "nome");

-- CreateIndex
CREATE INDEX "idx_monstro_nivel" ON "monstros"("nivel_min", "nivel_max");

-- CreateIndex
CREATE INDEX "idx_monstro_raridade" ON "monstros"("raridade_id");

-- CreateIndex
CREATE INDEX "idx_monstro_categoria" ON "monstros"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "monstros_nome_sistema_key" ON "monstros"("nome", "sistema");

-- CreateIndex
CREATE INDEX "atributos_monstro_monstro_id_idx" ON "atributos_monstro"("monstro_id");

-- CreateIndex
CREATE UNIQUE INDEX "atributos_monstro_monstro_id_nome_key" ON "atributos_monstro"("monstro_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_jogo_sala_id_key" ON "sessoes_jogo"("sala_id");

-- CreateIndex
CREATE INDEX "sessoes_jogo_historia_id_idx" ON "sessoes_jogo"("historia_id");

-- CreateIndex
CREATE INDEX "sessoes_jogo_status_idx" ON "sessoes_jogo"("status");

-- CreateIndex
CREATE INDEX "sessoes_jogo_historia_id_status_idx" ON "sessoes_jogo"("historia_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "elementos_nome_key" ON "elementos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "focus_elementais_nome_key" ON "focus_elementais"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "magias_tresdet_nome_key" ON "magias_tresdet"("nome");

-- CreateIndex
CREATE INDEX "magias_tresdet_escola_idx" ON "magias_tresdet"("escola");

-- CreateIndex
CREATE INDEX "magias_tresdet_tipo_idx" ON "magias_tresdet"("tipo");

-- CreateIndex
CREATE INDEX "amizades_receiver_id_idx" ON "amizades"("receiver_id");

-- CreateIndex
CREATE INDEX "amizades_status_idx" ON "amizades"("status");

-- CreateIndex
CREATE INDEX "amizades_receiver_id_status_idx" ON "amizades"("receiver_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "unq_amizade" ON "amizades"("requester_id", "receiver_id");

-- CreateIndex
CREATE INDEX "feed_posts_user_id_idx" ON "feed_posts"("user_id");

-- CreateIndex
CREATE INDEX "feed_posts_visibilidade_idx" ON "feed_posts"("visibilidade");

-- CreateIndex
CREATE INDEX "feed_posts_criado_em_idx" ON "feed_posts"("criado_em");

-- CreateIndex
CREATE INDEX "feed_posts_deleted_at_idx" ON "feed_posts"("deleted_at");

-- CreateIndex
CREATE INDEX "feed_posts_user_id_deleted_at_criado_em_idx" ON "feed_posts"("user_id", "deleted_at", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "unq_curtida" ON "feed_curtidas"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "feed_comentarios_post_id_idx" ON "feed_comentarios"("post_id");

-- CreateIndex
CREATE INDEX "personagem_sessao_sessao_jogo_id_idx" ON "personagem_sessao"("sessao_jogo_id");

-- CreateIndex
CREATE INDEX "personagem_sessao_personagem_id_idx" ON "personagem_sessao"("personagem_id");

-- CreateIndex
CREATE INDEX "personagem_sessao_usuario_id_idx" ON "personagem_sessao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "personagem_sessao_sessao_jogo_id_personagem_id_key" ON "personagem_sessao"("sessao_jogo_id", "personagem_id");

-- CreateIndex
CREATE INDEX "habilidades_magias_classe_id_idx" ON "habilidades_magias"("classe_id");

-- CreateIndex
CREATE INDEX "habilidades_magias_nivel_requerido_idx" ON "habilidades_magias"("nivel_requerido");

-- CreateIndex
CREATE INDEX "habilidades_magias_raca_id_idx" ON "habilidades_magias"("raca_id");

-- CreateIndex
CREATE INDEX "habilidades_magias_categoria_idx" ON "habilidades_magias"("categoria");

-- CreateIndex
CREATE INDEX "habilidades_magias_escola_magia_idx" ON "habilidades_magias"("escola_magia");

-- CreateIndex
CREATE INDEX "habilidades_magias_nome_idx" ON "habilidades_magias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "habilidades_magias_nome_sistema_key" ON "habilidades_magias"("nome", "sistema");

-- CreateIndex
CREATE INDEX "hm_classe_classe_id_idx" ON "hm_classe"("classe_id");

-- CreateIndex
CREATE UNIQUE INDEX "hm_classe_habilidade_id_classe_id_key" ON "hm_classe"("habilidade_id", "classe_id");

-- CreateIndex
CREATE INDEX "hm_raca_raca_id_idx" ON "hm_raca"("raca_id");

-- CreateIndex
CREATE UNIQUE INDEX "hm_raca_habilidade_id_raca_id_key" ON "hm_raca"("habilidade_id", "raca_id");

-- CreateIndex
CREATE INDEX "hm_personagem_personagem_id_idx" ON "hm_personagem"("personagem_id");

-- CreateIndex
CREATE UNIQUE INDEX "hm_personagem_personagem_id_habilidade_id_key" ON "hm_personagem"("personagem_id", "habilidade_id");

-- CreateIndex
CREATE UNIQUE INDEX "hm_slots_classe_classe_id_nivel_key" ON "hm_slots_classe"("classe_id", "nivel");

-- CreateIndex
CREATE INDEX "monstro_loot_monstro_id_idx" ON "monstro_loot"("monstro_id");

-- CreateIndex
CREATE UNIQUE INDEX "monstro_loot_monstro_id_equipamento_id_key" ON "monstro_loot"("monstro_id", "equipamento_id");

-- CreateIndex
CREATE INDEX "api_usage_user_id_idx" ON "api_usage"("user_id");

-- CreateIndex
CREATE INDEX "api_usage_provider_idx" ON "api_usage"("provider");

-- CreateIndex
CREATE INDEX "api_usage_tipo_idx" ON "api_usage"("tipo");

-- CreateIndex
CREATE INDEX "api_usage_criado_em_idx" ON "api_usage"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "tts_cache_cache_key_key" ON "tts_cache"("cache_key");

-- CreateIndex
CREATE INDEX "tts_cache_cache_key_idx" ON "tts_cache"("cache_key");

-- CreateIndex
CREATE INDEX "analytics_eventos_tipo_idx" ON "analytics_eventos"("tipo");

-- CreateIndex
CREATE INDEX "analytics_eventos_criado_em_idx" ON "analytics_eventos"("criado_em");

-- CreateIndex
CREATE INDEX "analytics_eventos_user_id_idx" ON "analytics_eventos"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_jobs_bullmq_job_id_key" ON "ai_jobs"("bullmq_job_id");

-- CreateIndex
CREATE INDEX "ai_jobs_queue_status_idx" ON "ai_jobs"("queue", "status");

-- CreateIndex
CREATE INDEX "ai_jobs_entity_type_entity_id_created_at_idx" ON "ai_jobs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_jobs_owner_user_id_created_at_idx" ON "ai_jobs"("owner_user_id", "created_at");

-- CreateIndex
CREATE INDEX "roteiro_versoes_historia_id_criado_em_idx" ON "roteiro_versoes"("historia_id", "criado_em");

-- CreateIndex
CREATE INDEX "roteiro_versoes_historia_id_ativa_idx" ON "roteiro_versoes"("historia_id", "ativa");

-- CreateIndex
CREATE INDEX "roteiro_versoes_historia_id_status_idx" ON "roteiro_versoes"("historia_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ingredientes_nome_key" ON "ingredientes"("nome");

-- CreateIndex
CREATE INDEX "ingredientes_tipo_idx" ON "ingredientes"("tipo");

-- CreateIndex
CREATE INDEX "ingredientes_raridade_id_idx" ON "ingredientes"("raridade_id");

-- CreateIndex
CREATE UNIQUE INDEX "ferramentas_nome_key" ON "ferramentas"("nome");

-- CreateIndex
CREATE INDEX "ferramentas_classe_id_idx" ON "ferramentas"("classe_id");

-- CreateIndex
CREATE UNIQUE INDEX "receitas_nome_key" ON "receitas"("nome");

-- CreateIndex
CREATE INDEX "receitas_classe_id_idx" ON "receitas"("classe_id");

-- CreateIndex
CREATE INDEX "receitas_categoria_idx" ON "receitas"("categoria");

-- CreateIndex
CREATE INDEX "receitas_nivel_requerido_idx" ON "receitas"("nivel_requerido");

-- CreateIndex
CREATE INDEX "receitas_habilidade_id_idx" ON "receitas"("habilidade_id");

-- CreateIndex
CREATE INDEX "receita_ingrediente_receita_id_idx" ON "receita_ingrediente"("receita_id");

-- CreateIndex
CREATE UNIQUE INDEX "receita_ingrediente_receita_id_ingrediente_id_key" ON "receita_ingrediente"("receita_id", "ingrediente_id");

-- CreateIndex
CREATE INDEX "receita_ferramenta_receita_id_idx" ON "receita_ferramenta"("receita_id");

-- CreateIndex
CREATE UNIQUE INDEX "receita_ferramenta_receita_id_ferramenta_id_key" ON "receita_ferramenta"("receita_id", "ferramenta_id");

-- CreateIndex
CREATE INDEX "monstro_ingrediente_monstro_id_idx" ON "monstro_ingrediente"("monstro_id");

-- CreateIndex
CREATE UNIQUE INDEX "monstro_ingrediente_monstro_id_ingrediente_id_key" ON "monstro_ingrediente"("monstro_id", "ingrediente_id");

-- CreateIndex
CREATE UNIQUE INDEX "itens_tresdet_nome_key" ON "itens_tresdet"("nome");

-- CreateIndex
CREATE INDEX "personagem_magia_tresdet_personagem_id_idx" ON "personagem_magia_tresdet"("personagem_id");

-- CreateIndex
CREATE UNIQUE INDEX "personagem_magia_tresdet_personagem_id_magia_tresdet_id_key" ON "personagem_magia_tresdet"("personagem_id", "magia_tresdet_id");

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_equipamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_raridade_id_fkey" FOREIGN KEY ("raridade_id") REFERENCES "raridades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias" ADD CONSTRAINT "fk_historias_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias" ADD CONSTRAINT "fk_historias_mestre_id" FOREIGN KEY ("mestre_id") REFERENCES "mestres"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagem_desvantagem" ADD CONSTRAINT "personagem_desvantagem_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "desvantagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagem_desvantagem" ADD CONSTRAINT "personagem_habilidade_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagem_equipamento" ADD CONSTRAINT "personagem_equipamento_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagem_equipamento" ADD CONSTRAINT "personagem_equipamento_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagem_vantagem" ADD CONSTRAINT "personagem_vantagem_desvantagem_id_fkey" FOREIGN KEY ("desvantagem_id") REFERENCES "vantagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagem_vantagem" ADD CONSTRAINT "personagem_vantagem_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagens" ADD CONSTRAINT "fk_personagens_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personagens" ADD CONSTRAINT "personagens_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagens" ADD CONSTRAINT "personagens_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributos_personagem" ADD CONSTRAINT "atributos_personagem_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias_personagens" ADD CONSTRAINT "fk_historia" FOREIGN KEY ("historia_id") REFERENCES "historias"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_personagens" ADD CONSTRAINT "fk_personagem" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_convite" ADD CONSTRAINT "fk_historia" FOREIGN KEY ("historia_id") REFERENCES "historias"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historias_convite" ADD CONSTRAINT "fk_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mestres" ADD CONSTRAINT "fk_mestres_id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "monstros" ADD CONSTRAINT "monstros_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_monstro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monstros" ADD CONSTRAINT "monstros_raridade_id_fkey" FOREIGN KEY ("raridade_id") REFERENCES "raridades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributos_monstro" ADD CONSTRAINT "atributos_monstro_monstro_id_fkey" FOREIGN KEY ("monstro_id") REFERENCES "monstros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes_jogo" ADD CONSTRAINT "sessoes_jogo_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "historias"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "amizades" ADD CONSTRAINT "amizades_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amizades" ADD CONSTRAINT "amizades_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_curtidas" ADD CONSTRAINT "feed_curtidas_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_curtidas" ADD CONSTRAINT "feed_curtidas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comentarios" ADD CONSTRAINT "feed_comentarios_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comentarios" ADD CONSTRAINT "feed_comentarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagem_sessao" ADD CONSTRAINT "personagem_sessao_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagem_sessao" ADD CONSTRAINT "personagem_sessao_sessao_jogo_id_fkey" FOREIGN KEY ("sessao_jogo_id") REFERENCES "sessoes_jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilidades_magias" ADD CONSTRAINT "habilidades_magias_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilidades_magias" ADD CONSTRAINT "habilidades_magias_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_classe" ADD CONSTRAINT "hm_classe_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidades_magias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_classe" ADD CONSTRAINT "hm_classe_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_raca" ADD CONSTRAINT "hm_raca_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidades_magias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_raca" ADD CONSTRAINT "hm_raca_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_personagem" ADD CONSTRAINT "hm_personagem_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_personagem" ADD CONSTRAINT "hm_personagem_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidades_magias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hm_slots_classe" ADD CONSTRAINT "hm_slots_classe_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monstro_loot" ADD CONSTRAINT "monstro_loot_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monstro_loot" ADD CONSTRAINT "monstro_loot_monstro_id_fkey" FOREIGN KEY ("monstro_id") REFERENCES "monstros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roteiro_versoes" ADD CONSTRAINT "roteiro_versoes_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "historias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roteiro_versoes" ADD CONSTRAINT "roteiro_versoes_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredientes" ADD CONSTRAINT "ingredientes_raridade_id_fkey" FOREIGN KEY ("raridade_id") REFERENCES "raridades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidades_magias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita_ingrediente" ADD CONSTRAINT "receita_ingrediente_ingrediente_id_fkey" FOREIGN KEY ("ingrediente_id") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita_ingrediente" ADD CONSTRAINT "receita_ingrediente_receita_id_fkey" FOREIGN KEY ("receita_id") REFERENCES "receitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita_ferramenta" ADD CONSTRAINT "receita_ferramenta_ferramenta_id_fkey" FOREIGN KEY ("ferramenta_id") REFERENCES "ferramentas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receita_ferramenta" ADD CONSTRAINT "receita_ferramenta_receita_id_fkey" FOREIGN KEY ("receita_id") REFERENCES "receitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monstro_ingrediente" ADD CONSTRAINT "monstro_ingrediente_ingrediente_id_fkey" FOREIGN KEY ("ingrediente_id") REFERENCES "ingredientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monstro_ingrediente" ADD CONSTRAINT "monstro_ingrediente_monstro_id_fkey" FOREIGN KEY ("monstro_id") REFERENCES "monstros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagem_item_tresdet" ADD CONSTRAINT "personagem_item_tresdet_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagem_item_tresdet" ADD CONSTRAINT "personagem_item_tresdet_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens_tresdet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagem_magia_tresdet" ADD CONSTRAINT "personagem_magia_tresdet_personagem_id_fkey" FOREIGN KEY ("personagem_id") REFERENCES "personagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personagem_magia_tresdet" ADD CONSTRAINT "personagem_magia_tresdet_magia_tresdet_id_fkey" FOREIGN KEY ("magia_tresdet_id") REFERENCES "magias_tresdet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

