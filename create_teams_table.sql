-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL DEFAULT 'Shift2',
    language VARCHAR(255) NOT NULL DEFAULT 'Nederlands',
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(255),
    website VARCHAR(255),
    about TEXT,
    logo_url VARCHAR(255),
    use_cardan_ai BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default team
INSERT INTO teams (id, name, language, address, email, phone, website, about, logo_url, use_cardan_ai)
VALUES (
    gen_random_uuid()::text,
    'Shift2',
    'Nederlands',
    'Rembrandt 15, 2311 GN Capelle a/d IJssel',
    'contact@shift2.nl',
    '088 770 8811',
    'https://www.shift2.nl/',
    'Shift2 helpt lokale overheden tijdens bij innovaties in de aan waar digitale dienstverlening blijft van het super eenvoudig. Wij maken het super eenvoudig toegankelijk, waarbij digitaal begrijpelijk en een vast onderdeel van onze dienstverlening.',
    '/shift2-logo.svg',
    true
)
ON CONFLICT DO NOTHING;