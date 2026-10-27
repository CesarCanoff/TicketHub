-- ============================================================
-- TicketHub - Sistema de Gerenciamento de Chamados
-- Banco de dados: PostgreSQL
-- ============================================================

DROP TABLE IF EXISTS chamado CASCADE;
DROP TABLE IF EXISTS categoria_servico CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- ------------------------------------------------------------
-- USUARIO
-- Clientes e tecnicos na mesma tabela, diferenciados por "tipo".
-- Contas sao criadas pelo T.I. da empresa -- nao ha cadastro
-- publico (RNF de controle de acesso).
-- ------------------------------------------------------------
CREATE TABLE usuario (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    tipo        VARCHAR(20)  NOT NULL,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuario_tipo CHECK (tipo IN ('CLIENTE', 'TECNICO'))
);

-- ------------------------------------------------------------
-- CATEGORIA_SERVICO
-- Dropdown de categoria de atendimento do chamado.
-- ------------------------------------------------------------
CREATE TABLE categoria_servico (
    id     SERIAL PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL UNIQUE,
    ativo  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
-- CHAMADO
-- cliente_id -> quem abriu (obrigatorio)
-- tecnico_id -> quem atende (nulo ate a atribuicao)
-- ------------------------------------------------------------
CREATE TABLE chamado (
    id             SERIAL PRIMARY KEY,
    titulo         VARCHAR(150) NOT NULL,
    descricao      TEXT         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ABERTO',
    categoria_id   INTEGER      NOT NULL,
    cliente_id     INTEGER      NOT NULL,
    tecnico_id     INTEGER,
    criado_em      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chamado_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_servico (id),
    CONSTRAINT fk_chamado_cliente   FOREIGN KEY (cliente_id)   REFERENCES usuario (id),
    CONSTRAINT fk_chamado_tecnico   FOREIGN KEY (tecnico_id)   REFERENCES usuario (id),
    CONSTRAINT chk_chamado_status   CHECK (status IN ('ABERTO', 'EM_ATENDIMENTO', 'FECHADO'))
);

CREATE INDEX idx_chamado_cliente ON chamado (cliente_id);
CREATE INDEX idx_chamado_tecnico ON chamado (tecnico_id);
CREATE INDEX idx_chamado_status  ON chamado (status);

-- ------------------------------------------------------------
-- Trigger: mantem atualizado_em sempre correto
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chamado_atualizado_em
    BEFORE UPDATE ON chamado
    FOR EACH ROW
    EXECUTE FUNCTION set_atualizado_em();

-- ============================================================
-- DADOS INICIAIS (seed)
-- ============================================================

-- Senha dos usuarios de teste: 123456 (hash bcrypt)
INSERT INTO usuario (nome, email, senha_hash, tipo) VALUES
    ('Antonio Carlos Silveira', 'antonio@test.com',
     '$2a$10$oXA06v0UoTq6SzUrBX9TtO0l9BE3N5ng0Ikqvat5O1Ch09bCOuVyy', 'CLIENTE'),
    ('Carlos Silva', 'carlos.silva@test.com',
     '$2a$10$oXA06v0UoTq6SzUrBX9TtO0l9BE3N5ng0Ikqvat5O1Ch09bCOuVyy', 'TECNICO');

INSERT INTO categoria_servico (nome) VALUES
    ('Erro de rede'),
    ('Recuperacao de dados'),
    ('Hardware'),
    ('Software'),
    ('Acesso e senha'),
    ('Impressora'),
    ('Outros');

-- Chamado de exemplo: aberto e ainda sem tecnico responsavel
INSERT INTO chamado (titulo, descricao, status, categoria_id, cliente_id, tecnico_id) VALUES
    ('Backup nao esta funcionando',
     'O sistema de backup automatico parou de funcionar. Ultima execucao bem-sucedida foi ha uma semana.',
     'ABERTO', 2, 1, NULL);
