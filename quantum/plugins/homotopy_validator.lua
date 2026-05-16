-- VOID Plugin: Validador de Proof-of-Homotopia
-- Verifica blocos de homotopia e valida cadeia
--
-- Referencia: "O Livro do ETRNET", Cap. 11.2
--
-- O Proof-of-Homotopia usa metricas de Sobolev (H1, H2) como
-- "trabalho" do minerador. O hash do bloco incorpora essas
-- metricas, tornando a cadeia resistente a adulteracao.

local M = {}

-- ============================================================
-- Configuracao
-- ============================================================
M.config = {
    difficulty   = 4,          -- Numero de zeros no hash
    max_nonce    = 1000000,    -- Limite maximo de nonces
}

-- ============================================================
-- Estado interno
-- ============================================================
M.state = {
    chain           = {},      -- Cadeia de blocos validos
    last_block_hash = string.rep("0", 64),  -- Hash do genesis
}

-- ============================================================
-- Funcoes auxiliares locais
-- ============================================================

--- Calcula metricas de Sobolev H1 e H2 de um campo.
-- H1 mede a energia do gradiente (primeira derivada).
-- H2 mede a energia do laplaciano (segunda derivada).
--
-- @param field Vetor de valores do campo.
-- @return h1_norm, h2_norm
local function sobolev_metric(field)
    local n = #field
    if n < 3 then return 0, 0 end

    local h1_sum = 0
    local h2_sum = 0
    local count  = 0

    for i = 2, n - 1 do
        local grad  = (field[i + 1] - field[i - 1]) / 2
        local grad2 = field[i + 1] - 2 * field[i] + field[i - 1]
        h1_sum = h1_sum + grad * grad
        h2_sum = h2_sum + grad2 * grad2
        count  = count + 1
    end

    if count == 0 then return 0, 0 end
    return math.sqrt(h1_sum / count), math.sqrt(h2_sum / count)
end

--- Hash simplificado para demonstracao.
-- Em producao, substituir por SHA3-256 via plugin_api.
--
-- @param data String de entrada.
-- @return Hash hexadecimal de 16 caracteres.
local function simple_hash(data)
    local hash = 0
    for i = 1, #data do
        hash = (hash * 31 + string.byte(data, i)) % (2 ^ 32)
    end
    return string.format("%016x", hash)
end

--- Verifica se um hash atende a dificuldade exigida.
-- @param hash       Hash hexadecimal.
-- @param difficulty Numero minimo de zeros no inicio.
-- @return true se atende, false caso contrario.
local function meets_difficulty(hash, difficulty)
    local prefix = string.rep("0", difficulty)
    return string.sub(hash, 1, difficulty) == prefix
end

--- Calcula o hash de um bloco.
-- @param previous_hash Hash do bloco anterior.
-- @param h1           Norma H1 do campo.
-- @param h2           Norma H2 do campo.
-- @param nonce        Nonce candidato.
-- @return Hash do bloco.
local function compute_block_hash(previous_hash, h1, h2, nonce)
    local block_data = string.format(
        "%s|%.8f|%.8f|%d",
        previous_hash, h1, h2, nonce
    )
    return simple_hash(block_data)
end

-- ============================================================
-- Validacao de blocos
-- ============================================================

--- Valida um bloco individual (sem mineracao).
-- Args esperados:
--   field         (table)  - Campo para calcular metricas de Sobolev
--   nonce         (number) - Nonce candidato
--   previous_hash (string) - Hash do bloco anterior
--
-- @param args Tabela com os argumentos.
-- @return Tabela com resultado da validacao.
function M.validate_block(args)
    local field         = args.field or {}
    local nonce         = args.nonce or 0
    local previous_hash = args.previous_hash or M.state.last_block_hash

    -- Calcular metrica de Sobolev
    local h1, h2 = sobolev_metric(field)

    -- Calcular hash do bloco
    local block_hash = compute_block_hash(previous_hash, h1, h2, nonce)

    -- Verificar dificuldade
    local valid = meets_difficulty(block_hash, M.config.difficulty)

    return {
        valid            = valid,
        hash             = block_hash,
        previous_hash    = previous_hash,
        h1_norm          = h1,
        h2_norm          = h2,
        nonce            = nonce,
        difficulty       = M.config.difficulty,
        meets_difficulty = valid,
    }
end

-- ============================================================
-- Mineracao de blocos
-- ============================================================

--- Minera um novo bloco tentando nonces ate encontrar hash valido.
-- Args esperados:
--   field         (table)  - Campo para metricas de Sobolev
--   previous_hash (string) - Hash do bloco anterior (opcional)
--
-- @param args Tabela com os argumentos.
-- @return Tabela com bloco encontrado ou falha.
function M.mine_block(args)
    local field         = args.field or {}
    local previous_hash = args.previous_hash or M.state.last_block_hash

    local h1, h2 = sobolev_metric(field)

    -- Minerar: iterar nonces
    for nonce = 0, M.config.max_nonce do
        local block_hash = compute_block_hash(previous_hash, h1, h2, nonce)

        if meets_difficulty(block_hash, M.config.difficulty) then
            local block = {
                index         = #M.state.chain + 1,
                hash          = block_hash,
                previous_hash = previous_hash,
                h1_norm       = h1,
                h2_norm       = h2,
                nonce         = nonce,
                timestamp     = os.time(),
            }
            table.insert(M.state.chain, block)
            M.state.last_block_hash = block_hash

            return {
                success       = true,
                block         = block,
                chain_length  = #M.state.chain,
            }
        end
    end

    return {
        success = false,
        reason  = string.format(
            "Nao encontrou hash com %d zeros em %d nonces",
            M.config.difficulty, M.config.max_nonce
        ),
    }
end

-- ============================================================
-- Verificacao da cadeia
-- ============================================================

--- Verifica integridade completa da cadeia de blocos.
-- @return Tabela com resultado da verificacao.
function M.verify_chain()
    for i = 2, #M.state.chain do
        local block = M.state.chain[i]
        local prev  = M.state.chain[i - 1]

        -- Verificar link com bloco anterior
        if block.previous_hash ~= prev.hash then
            return {
                valid      = false,
                broken_at  = i,
                reason     = "Hash do bloco anterior nao confere",
            }
        end

        -- Verificar dificuldade
        if not meets_difficulty(block.hash, M.config.difficulty) then
            return {
                valid     = false,
                broken_at = i,
                reason    = "Hash nao atende dificuldade",
            }
        end
    end

    return {
        valid         = true,
        chain_length  = #M.state.chain,
        last_hash     = M.state.last_block_hash,
    }
end

-- ============================================================
-- Consulta de estado
-- ============================================================

--- Retorna status da cadeia.
-- @return Tabela com comprimento, ultimo hash e dificuldade.
function M.status()
    return {
        chain_length = #M.state.chain,
        last_hash    = M.state.last_block_hash,
        difficulty   = M.config.difficulty,
    }
end

--- Retorna detalhes de um bloco pelo indice.
-- @param args Tabela com campo "index" (1-based).
-- @return Tabela com dados do bloco ou erro.
function M.get_block(args)
    local index = args.index or #M.state.chain
    if index < 1 or index > #M.state.chain then
        return { error = "Indice invalido", valid_index_range = {1, #M.state.chain} }
    end
    return { block = M.state.chain[index], index = index }
end

--- Retorna os ultimos N blocos.
-- @param args Tabela com campo "limit" (opcional, default 10).
-- @return Lista de blocos.
function M.get_recent_blocks(args)
    local limit  = args.limit or 10
    local recent = {}
    local start  = math.max(1, #M.state.chain - limit + 1)
    for i = start, #M.state.chain do
        table.insert(recent, M.state.chain[i])
    end
    return { blocks = recent, total = #M.state.chain }
end

return M
