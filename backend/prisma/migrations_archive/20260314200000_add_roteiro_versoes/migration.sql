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

    CONSTRAINT "roteiro_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roteiro_versoes_historia_id_criado_em_idx" ON "roteiro_versoes"("historia_id", "criado_em");

-- CreateIndex
CREATE INDEX "roteiro_versoes_historia_id_ativa_idx" ON "roteiro_versoes"("historia_id", "ativa");

-- AddForeignKey
ALTER TABLE "roteiro_versoes" ADD CONSTRAINT "roteiro_versoes_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "historias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
