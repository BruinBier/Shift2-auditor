-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- Insert default user agents value
INSERT INTO "settings" ("id", "key", "value", "description", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'default_user_agents',
    'Google Chrome 145 (primair); Mozilla Firefox 147; Microsoft Edge 145; NVDA (Windows) in combinatie met Google Chrome;',
    'Standaard user agents voor nieuwe projecten',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);