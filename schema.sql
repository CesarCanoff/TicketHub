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

-- Chamados de exemplo: abertos e sem técnico responsável
INSERT INTO chamado (titulo, descricao, status, categoria_id, cliente_id, tecnico_id) VALUES

    ('Computador não liga',
     'Ao pressionar o botão de ligar, o computador não inicia. Nenhuma luz acende e não há sinal de funcionamento.',
     'ABERTO', 2, 1, NULL),

    ('Internet muito lenta',
     'A conexão com a internet está extremamente lenta, dificultando o acesso aos sistemas utilizados durante o expediente.',
     'ABERTO', 1, 1, NULL),

    ('Impressora não imprime',
     'A impressora recebe os documentos enviados, mas não inicia a impressão. Já verifiquei os cabos e reiniciei o equipamento.',
     'ABERTO', 3, 1, NULL),

    ('Esqueci minha senha',
     'Não consigo acessar minha conta porque esqueci minha senha. Preciso de auxílio para recuperar o acesso ao sistema.',
     'ABERTO', 4, 1, NULL),

    ('Sistema apresentando lentidão',
     'O sistema está demorando muito para carregar as páginas e executar operações. O problema começou hoje pela manhã.',
     'ABERTO', 5, 1, NULL),

    ('Monitor sem imagem',
     'O monitor liga, mas permanece com a tela preta. Já verifiquei os cabos de conexão e reiniciei o computador.',
     'ABERTO', 2, 1, NULL),

    ('Solicitação de instalação de software',
     'Preciso instalar o Visual Studio Code no computador utilizado para desenvolver um projeto acadêmico.',
     'ABERTO', 6, 1, NULL),

    ('E-mail não recebe mensagens',
     'Minha caixa de entrada não está recebendo novas mensagens. O problema persiste mesmo após reiniciar o aplicativo de e-mail.',
     'ABERTO', 5, 1, NULL),

    ('Teclado com teclas defeituosas',
     'Algumas teclas do teclado não respondem corretamente, dificultando a digitação de documentos e o preenchimento de formulários.',
     'ABERTO', 2, 1, NULL),

    ('Acesso ao sistema bloqueado',
     'Ao tentar entrar no sistema interno, aparece uma mensagem informando que meu usuário está bloqueado.',
     'ABERTO', 4, 1, NULL),

    ('Aplicativo fecha sozinho',
     'O aplicativo fecha inesperadamente após alguns minutos de uso. O problema acontece mesmo após reiniciar o dispositivo.',
     'ABERTO', 5, 1, NULL),

    ('Solicitação de criação de usuário',
     'Preciso de uma nova conta de usuário para acessar os sistemas necessários às minhas atividades.',
     'ABERTO', 4, 1, NULL),

    ('Mouse não funciona',
     'O mouse deixou de responder aos movimentos e cliques. Já desconectei e conectei o dispositivo novamente, mas o problema continua.',
     'ABERTO', 2, 1, NULL),

    ('Falha ao acessar o banco de dados',
     'O sistema apresenta uma mensagem de erro ao tentar consultar informações no banco de dados, impedindo a continuidade da operação.',
     'ABERTO', 5, 1, NULL),

    ('Solicitação de atualização do sistema',
     'Preciso que o sistema instalado no computador seja atualizado para a versão mais recente disponível.',
     'ABERTO', 6, 1, NULL),

    ('Computador reinicia sozinho',
     'O computador está reiniciando inesperadamente durante o uso, interrompendo as atividades e causando perda de trabalho não salvo.',
     'ABERTO', 2, 1, NULL),

    ('Problema ao anexar arquivos',
     'Não consigo anexar arquivos aos formulários do sistema. Após selecionar o documento, aparece uma mensagem de falha no envio.',
     'ABERTO', 5, 1, NULL),

    ('Solicitação de configuração de rede',
     'Preciso configurar o acesso à rede interna para utilizar os recursos compartilhados disponíveis no ambiente de trabalho.',
     'ABERTO', 1, 1, NULL),

    ('Espaço em disco insuficiente',
     'O computador apresenta avisos de pouco espaço disponível no disco, impedindo a instalação de programas e o armazenamento de arquivos.',
     'ABERTO', 2, 1, NULL),

    ('Erro ao gerar relatório',
     'Ao tentar gerar um relatório pelo sistema, ocorre um erro e o arquivo não é disponibilizado para download.',
     'ABERTO', 5, 1, NULL);

