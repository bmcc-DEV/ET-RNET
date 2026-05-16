-- VOID Plugin: Estrategia de Trading baseada em Colapsos
-- Monitora estresse sistemico e gera sinais de compra/venda
--
-- Referencia: "O Livro do ETRNET", Cap. 8 e 12
--
-- O plugin mantem estado interno (historico de estresse, posicao)
-- e expoe funcoes chamaveis pelo LuaRuntime.

local M = {}

-- ============================================================
-- Configuracao
-- ============================================================
M.config = {
    stress_threshold   = 0.7,     -- Limiar de estresse para venda
    recovery_threshold = 0.3,     -- Limiar para recompra
    cooldown_seconds   = 300,     -- 5 min entre operacoes
    max_position_pct   = 0.25,    -- Maximo 25% do portfolio
    ma_window_short    = 5,       -- Janela da media movel curta
    ma_window_long     = 20,      -- Janela da media movel longa
    lookback_reversal  = 10,      -- Periodo para deteccao de reversao
}

-- ============================================================
-- Estado interno
-- ============================================================
M.state = {
    last_signal      = nil,
    last_signal_time = 0,
    position         = 0,         -- Posicao atual (0 a 1)
    stress_history   = {},
    signal_log       = {},        -- Historico de sinais emitidos
}

-- ============================================================
-- Funcoes auxiliares locais
-- ============================================================

--- Calcula media movel simples de um historico.
-- @param history  Tabela com valores numericos.
-- @param window   Tamanho da janela.
-- @return Media movel.
local function stress_moving_average(history, window)
    if #history == 0 then return 0 end
    local sum = 0
    local count = math.min(window, #history)
    for i = #history - count + 1, #history do
        sum = sum + (history[i] or 0)
    end
    return sum / count
end

--- Detecta reversao de tendencia comparando instantes distantes.
-- @param history  Tabela com valores de estresse.
-- @param lookback Quantidade de passos para traz na comparacao.
-- @return "DOWNTREND", "UPTREND" ou "STABLE".
local function detect_reversal(history, lookback)
    if #history < lookback + 1 then return nil end
    local recent = history[#history]
    local prev   = history[#history - lookback]
    local trend  = recent - prev

    if trend > 0.1 then return "DOWNTREND" end
    if trend < -0.1 then return "UPTREND" end
    return "STABLE"
end

--- Calcula volatilidade (desvio padrao) de um trecho do historico.
-- @param history  Tabela com valores.
-- @param window   Tamanho da janela.
-- @return Desvio padrao.
local function volatility(history, window)
    if #history < 2 then return 0 end
    local count = math.min(window, #history)
    local sum = 0
    local sum_sq = 0
    for i = #history - count + 1, #history do
        local v = history[i] or 0
        sum = sum + v
        sum_sq = sum_sq + v * v
    end
    local mean = sum / count
    local variance = (sum_sq / count) - (mean * mean)
    if variance < 0 then variance = 0 end
    return math.sqrt(variance)
end

-- ============================================================
-- Funcao principal: analisa e gera sinal
-- ============================================================

--- Analisa o estado atual do estresse e retorna um sinal de trading.
-- Args esperados:
--   stress       (number) - Nivel de estresse atual (0 a 1)
--   sigma        (number) - Volatilidade do mercado
--   kl_divergence (number) - Divergencia KL estimada
--   timestamp    (number) - Timestamp Unix atual
--
-- @param args Tabela com os argumentos.
-- @return Tabela com sinal, razao, confianca e indicadores.
function M.analyze(args)
    local stress        = args.stress or 0
    local sigma         = args.sigma or 0
    local kl_divergence = args.kl_divergence or 0
    local timestamp     = args.timestamp or os.time()

    -- Atualizar historico
    table.insert(M.state.stress_history, stress)
    if #M.state.stress_history > 100 then
        table.remove(M.state.stress_history, 1)
    end

    -- Verificar cooldown
    local time_since_last = timestamp - M.state.last_signal_time
    if time_since_last < M.config.cooldown_seconds then
        return {
            signal = "HOLD",
            reason = "cooldown",
            remaining_cooldown = M.config.cooldown_seconds - time_since_last,
            stress = stress,
            position = M.state.position,
        }
    end

    -- Calcular indicadores
    local ma_short   = stress_moving_average(M.state.stress_history, M.config.ma_window_short)
    local ma_long    = stress_moving_average(M.state.stress_history, M.config.ma_window_long)
    local reversal   = detect_reversal(M.state.stress_history, M.config.lookback_reversal)
    local vol        = volatility(M.state.stress_history, M.config.ma_window_short)

    -- Gerar sinal
    local signal     = "HOLD"
    local reason     = ""
    local confidence = 0

    -- SINAL DE VENDA: estresse alto + reversao de alta
    if stress > M.config.stress_threshold and reversal == "DOWNTREND" then
        signal = "SELL"
        reason = string.format(
            "Estresse critico (%.3f > %.3f) com tendencia de baixa",
            stress, M.config.stress_threshold
        )
        confidence = math.min(1.0, (stress - M.config.stress_threshold) / 0.3)

    -- SINAL DE COMPRA: estresse baixo + reversao de baixa
    elseif stress < M.config.recovery_threshold and reversal == "UPTREND" then
        signal = "BUY"
        reason = string.format(
            "Recuperacao detectada (%.3f < %.3f) com tendencia de alta",
            stress, M.config.recovery_threshold
        )
        confidence = math.min(1.0, (M.config.recovery_threshold - stress) / 0.3)

    -- SINAL DE ALERTA: convergencia de medias em zona de risco
    elseif math.abs(ma_short - ma_long) < 0.05 and stress > 0.5 then
        signal = "ALERT"
        reason = "Convergencia de medias moveis em zona de risco"
        confidence = 0.5
    end

    -- Registrar sinal nao-HOLD
    if signal ~= "HOLD" then
        M.state.last_signal = signal
        M.state.last_signal_time = timestamp
        table.insert(M.state.signal_log, {
            signal    = signal,
            reason    = reason,
            stress    = stress,
            timestamp = timestamp,
        })
        -- Manter apenas ultimos 50 sinais no log
        if #M.state.signal_log > 50 then
            table.remove(M.state.signal_log, 1)
        end
    end

    return {
        signal    = signal,
        reason    = reason,
        confidence = confidence,
        stress    = stress,
        sigma     = sigma,
        kl_divergence = kl_divergence,
        ma_short  = ma_short,
        ma_long   = ma_long,
        reversal  = reversal,
        volatility = vol,
        position  = M.state.position,
        stress_history_length = #M.state.stress_history,
    }
end

-- ============================================================
-- Gerenciamento de posicao
-- ============================================================

--- Atualiza a posicao atual do portfolio.
-- @param args Tabela com campo "position" (0 a 1).
-- @return Tabela com posicao atualizada.
function M.update_position(args)
    local new_position = args.position or M.state.position
    M.state.position = math.max(0, math.min(1, new_position))
    return {
        position = M.state.position,
        updated_at = os.time(),
    }
end

-- ============================================================
-- Consulta de estado
-- ============================================================

--- Retorna status completo do plugin.
-- @return Tabela com config, state e metricas.
function M.status()
    local current_stress = M.state.stress_history[#M.state.stress_history] or 0
    local avg_stress = 0
    if #M.state.stress_history > 0 then
        for _, v in ipairs(M.state.stress_history) do
            avg_stress = avg_stress + v
        end
        avg_stress = avg_stress / #M.state.stress_history
    end

    return {
        config = M.config,
        state = {
            last_signal      = M.state.last_signal,
            last_signal_time = M.state.last_signal_time,
            position         = M.state.position,
            stress_history_length = #M.state.stress_history,
            current_stress   = current_stress,
            average_stress   = avg_stress,
        },
        signal_log_length = #M.state.signal_log,
    }
end

--- Retorna o historico de sinais emitidos.
-- @param args Tabela com campo "limit" (opcional, default 20).
-- @return Lista dos sinais mais recentes.
function M.get_signal_history(args)
    local limit = args.limit or 20
    local result = {}
    local start = math.max(1, #M.state.signal_log - limit + 1)
    for i = start, #M.state.signal_log do
        table.insert(result, M.state.signal_log[i])
    end
    return { signals = result, total = #M.state.signal_log }
end

return M
