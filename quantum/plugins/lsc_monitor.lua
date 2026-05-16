-- VOID Plugin: Monitor de Coerencia LSC
-- Acompanha C_epsilon e alerta sobre saturacao
--
-- Referencia: "O Livro do ETRNET", Cap. 9
--
-- Implementa as 3 Leis da Saturacao de Coerencia Local (LSC):
--   Lei 1: G(C) = 1 / ((1-C) + mu * exp(beta*C))
--   Lei 2: C_epsilon <= C_max (limite de saturacao)
--   Lei 3: k_eff = k0 * (1 - C) + r_thermal

local M = {}

-- ============================================================
-- Configuracao
-- ============================================================
M.config = {
    warning_threshold   = 0.7,     -- Alerta quando C_epsilon > 0.7
    critical_threshold  = 0.86,    -- Critico quando C_epsilon > 0.86 (Lei 2)
    max_power           = 1.0,     -- P_max da Lei 1
    k0                  = 1.0,     -- Rigidez inicial da Lei 3
    r_thermal           = 0.01,    -- Ruido termico irredutivel
    mu                  = 0.1,     -- Parametro de saturacao (Lei 1)
    beta                = 3.0,     -- Sensibilidade de saturacao (Lei 1)
}

-- ============================================================
-- Estado interno
-- ============================================================
M.state = {
    readings = {},    -- Historico de leituras
    alerts   = {},    -- Historico de alertas
}

-- ============================================================
-- Funcao principal: registrar leitura
-- ============================================================

--- Registra uma leitura de coerencia e calcula indicadores das 3 Leis.
-- Args esperados:
--   C_epsilon  (number) - Coerencia modal atual (0 a 1)
--   P_current  (number) - Potencia atual do sistema
--   timestamp  (number) - Timestamp Unix
--
-- @param args Tabela com os argumentos.
-- @return Tabela com leitura calculada e contadores.
function M.record(args)
    local c_epsilon = args.C_epsilon or 0
    local p_current = args.P_current or 0
    local timestamp = args.timestamp or os.time()

    -- Calcular indicadores das 3 Leis
    -- Lei 1: Funcao de saturacao
    local g_saturation = 1.0 / ((1.0 - c_epsilon) + M.config.mu * math.exp(M.config.beta * c_epsilon))

    -- Lei 3: Rigidez efetiva
    local k_eff = M.config.k0 * (1.0 - c_epsilon) + M.config.r_thermal

    -- Lei 2: Potencia permitida (limitada pelo maximo)
    local p_allowed = math.min(p_current, M.config.max_power)

    -- Determinar status baseado nos limiares
    local status    = "NORMAL"
    local alert_msg = nil

    if c_epsilon > M.config.critical_threshold then
        status    = "CRITICAL"
        alert_msg = string.format(
            "Saturacao critica! C_eps = %.4f > %.4f. G = %.4f. k_eff = %.4f",
            c_epsilon, M.config.critical_threshold, g_saturation, k_eff
        )
    elseif c_epsilon > M.config.warning_threshold then
        status    = "WARNING"
        alert_msg = string.format(
            "Coerencia elevada: C_eps = %.4f. Saturacao: %.4f",
            c_epsilon, g_saturation
        )
    end

    -- Salvar leitura
    local reading = {
        c_epsilon    = c_epsilon,
        g_saturation = g_saturation,
        k_eff        = k_eff,
        p_current    = p_current,
        p_allowed    = p_allowed,
        status       = status,
        timestamp    = timestamp,
    }

    table.insert(M.state.readings, reading)
    if #M.state.readings > 200 then
        table.remove(M.state.readings, 1)
    end

    -- Registrar alerta se houve
    if alert_msg then
        table.insert(M.state.alerts, {
            message   = alert_msg,
            level     = status,
            c_epsilon = c_epsilon,
            timestamp = timestamp,
        })
        if #M.state.alerts > 50 then
            table.remove(M.state.alerts, 1)
        end
    end

    return {
        reading        = reading,
        alerts_count   = #M.state.alerts,
        total_readings = #M.state.readings,
    }
end

-- ============================================================
-- Consulta de alertas
-- ============================================================

--- Retorna os ultimos alertas registrados.
-- @param args Tabela com campo "limit" (opcional, default 10).
-- @return Lista de alertas e total.
function M.get_alerts(args)
    local limit  = args.limit or 10
    local recent = {}
    local start  = math.max(1, #M.state.alerts - limit + 1)
    for i = start, #M.state.alerts do
        table.insert(recent, M.state.alerts[i])
    end
    return { alerts = recent, total = #M.state.alerts }
end

-- ============================================================
-- Resumo estatistico
-- ============================================================

--- Retorna resumo estatistico de todas as leituras.
-- @return Tabela com estatisticas agregadas.
function M.summary()
    local n = #M.state.readings
    if n == 0 then return { status = "NO_DATA" } end

    local latest = M.state.readings[n]
    local avg_c  = 0
    local max_c  = 0
    local min_c  = 1.0

    for _, r in ipairs(M.state.readings) do
        avg_c = avg_c + r.c_epsilon
        if r.c_epsilon > max_c then max_c = r.c_epsilon end
        if r.c_epsilon < min_c then min_c = r.c_epsilon end
    end
    avg_c = avg_c / n

    -- Contar leituras criticas
    local critical_count = 0
    local warning_count  = 0
    for _, r in ipairs(M.state.readings) do
        if r.status == "CRITICAL" then critical_count = critical_count + 1
        elseif r.status == "WARNING" then warning_count = warning_count + 1 end
    end

    return {
        latest             = latest,
        average_c_epsilon  = avg_c,
        max_c_epsilon      = max_c,
        min_c_epsilon      = min_c,
        total_readings     = n,
        total_alerts       = #M.state.alerts,
        critical_readings  = critical_count,
        warning_readings   = warning_count,
    }
end

-- ============================================================
-- Historico de leituras
-- ============================================================

--- Retorna as ultimas N leituras.
-- @param args Tabela com campo "limit" (opcional, default 20).
-- @return Lista de leituras.
function M.get_readings(args)
    local limit  = args.limit or 20
    local recent = {}
    local start  = math.max(1, #M.state.readings - limit + 1)
    for i = start, #M.state.readings do
        table.insert(recent, M.state.readings[i])
    end
    return { readings = recent, total = #M.state.readings }
end

-- ============================================================
-- Reset
-- ============================================================

--- Limpa todo o estado interno (leituras e alertas).
-- @return Tabela com status.
function M.reset()
    M.state.readings = {}
    M.state.alerts   = {}
    return { status = "reset", timestamp = os.time() }
end

return M
