-- ═══════════════════════════════════════════════════════════════════════════════
-- VØID vHGPU Farm — Automação Completa
--
-- Sistema autônomo de mineração + investimento:
-- 1. Minera via Proof-of-Homotopia (vHGPU)
-- 2. Auto-compound: reinveste lucros automaticamente
-- 3. Aloca em instrumentos ótimos (CCB, Coherence Bonds, rETF)
-- 4. Gerencia risco via Mecânica dos Colapsos
-- 5. Otimiza rendimento via Teoria LSC
--
-- Filosofia: "O mercado que lembra está condenado a evoluir."
-- ═══════════════════════════════════════════════════════════════════════════════

local M = {}

-- ─── Configuração ───────────────────────────────────────────────────────────

M.config = {
    -- Mineração
    mining = {
        difficulty = 4,              -- Dificuldade PoH (zeros no hash)
        target_hashrate = 100,       -- Hashes/segundo alvo
        batch_size = 50,             -- Blocos por ciclo de mineração
        auto_compound_pct = 0.80,    -- 80% dos lucros são reinvestidos
    },

    -- Investimento
    investment = {
        max_position_pct = 0.25,     -- Máximo 25% por instrumento
        min_liquidity_reserve = 0.10,-- 10% reserva de liquidez
        rebalance_threshold = 0.15,  -- Rebalancear quando desvio > 15%
        instruments = {
            { name = "CCB",             weight = 0.30, risk = "medium" },
            { name = "CoherenceBond",   weight = 0.25, risk = "low" },
            { name = "rETF",            weight = 0.25, risk = "medium" },
            { name = "HysteresisVault", weight = 0.20, risk = "low" },
        },
    },

    -- Risco (Mecânica dos Colapsos)
    risk = {
        max_stress = 0.70,           -- Parar se estresse > 0.70
        stop_loss_pct = 0.15,        -- Stop loss em 15%
        take_profit_pct = 0.40,      -- Take profit em 40%
        cooldown_seconds = 300,      -- 5 min entre operações
        max_drawdown = 0.25,         -- Drawdown máximo 25%
    },

    -- Otimização LSC
    lsc = {
        target_coherence = 0.50,     -- C_ε alvo (zona segura)
        max_coherence = 0.86,        -- Limite crítico (Law 2)
        power_limit = 0.80,          -- P_max fracionário
    },
}

-- ─── Estado ─────────────────────────────────────────────────────────────────

M.state = {
    -- Mineração
    total_mined = 0,
    blocks_mined = 0,
    hashrate = 0,
    mining_active = false,

    -- Investimento
    portfolio = {
        total_value = 0,
        cash = 0,
        positions = {},             -- { instrument = { amount, entry_price, entry_time } }
        total_invested = 0,
        total_returns = 0,
    },

    -- Risco
    stress = 0,
    drawdown = 0,
    peak_value = 0,
    last_operation_time = 0,
    stop_loss_triggered = false,

    -- Métricas
    sharpe_ratio = 0,
    win_rate = 0,
    total_trades = 0,
    winning_trades = 0,
    history = {},                   -- Histórico de operações
}

-- ─── Funções Matemáticas ────────────────────────────────────────────────────

local math_abs = math.abs
local math_min = math.min
local math_max = math.max
local math_sqrt = math.sqrt
local math_exp = math.exp
local math_log = math.log
local math_random = math.random
local math_floor = math.floor

--- Divergência KL: D_KL(P || Q)
local function kl_divergence(p, q)
    local eps = 1e-15
    local kl = 0
    for i = 1, #p do
        local pi = math_max(math_abs(p[i]), eps)
        local qi = math_max(math_abs(q[i]), eps)
        kl = kl + pi * (math_log(pi) - math_log(qi))
    end
    return math_max(0, kl)
end

--- Coerência modal: C_ε = |Σ a_k e^{iφ_k}|² / N
local function modal_coherence(amplitudes, phases)
    local real_part, imag_part = 0, 0
    local n = #amplitudes
    for i = 1, n do
        local a = amplitudes[i] or 0
        local p = phases[i] or 0
        real_part = real_part + a * math.cos(p)
        imag_part = imag_part + a * math.sin(p)
    end
    return (real_part * real_part + imag_part * imag_part) / math_max(n, 1)
end

--- Saturação LSC: G(C_ε) = 1/((1-C_ε) + μe^{βC_ε})
local function saturation(c_epsilon, mu, beta)
    mu = mu or 0.1
    beta = beta or 3.0
    return 1.0 / ((1.0 - c_epsilon) + mu * math_exp(beta * c_epsilon))
end

--- Rigidez efetiva: K_eff = K_0(1-C_ε) + R_thermal
local function rigidity(c_epsilon, k0, r_thermal)
    k0 = k0 or 1.0
    r_thermal = r_thermal or 0.01
    return k0 * (1.0 - c_epsilon) + r_thermal
end

--- Métrica de Sobolev: ‖f‖_{H^s}
local function sobolev_metric(field, order)
    order = order or 1
    local n = #field
    if n < 3 then return 0, 0 end

    local h1, h2 = 0, 0
    for i = 2, n - 1 do
        local grad = (field[i + 1] - field[i - 1]) / 2
        local grad2 = field[i + 1] - 2 * field[i] + field[i - 1]
        h1 = h1 + grad * grad
        h2 = h2 + grad2 * grad2
    end

    return math_sqrt(h1 / n), math_sqrt(h2 / n)
end

--- Hash PoH (simplificado)
local function poh_hash(field, nonce)
    local h1, h2 = sobolev_metric(field)
    local data = string.format("%f:%f:%d", h1, h2, nonce)
    local hash = 0
    for i = 1, #data do
        hash = (hash * 31 + string.byte(data, i)) % 2^32
    end
    return hash
end

--- Verifica dificuldade
local function meets_difficulty(hash, difficulty)
    local prefix = string.rep("0", difficulty)
    return string.sub(string.format("%08x", hash), 1, difficulty) == prefix
end

-- ─── Motor de Mineração ─────────────────────────────────────────────────────

--- Minera um lote de blocos PoH
function M.mine_batch(args)
    local field = args.field or {}
    local difficulty = args.difficulty or M.config.mining.difficulty
    local batch_size = args.batch_size or M.config.mining.batch_size

    local blocks = {}
    local total_nonce = 0

    for _ = 1, batch_size do
        for nonce = 0, 100000 do
            local hash = poh_hash(field, nonce)
            if meets_difficulty(hash, difficulty) then
                local block = {
                    hash = string.format("%08x", hash),
                    nonce = nonce,
                    h1_norm = sobolev_metric(field),
                    timestamp = os.time(),
                    reward = M._calculate_reward(difficulty),
                }
                table.insert(blocks, block)
                total_nonce = total_nonce + nonce
                break
            end
        end
    end

    -- Atualizar estado
    local total_reward = 0
    for _, b in ipairs(blocks) do
        total_reward = total_reward + b.reward
    end

    M.state.total_mined = M.state.total_mined + total_reward
    M.state.blocks_mined = M.state.blocks_mined + #blocks
    M.state.hashrate = batch_size / math_max(1, total_nonce / 10000)

    return {
        blocks = #blocks,
        total_reward = total_reward,
        hashrate = M.state.hashrate,
        total_mined = M.state.total_mined,
    }
end

--- Calcula recompensa baseada na dificuldade
function M._calculate_reward(difficulty)
    -- Recompensa exponencial com dificuldade
    return math_floor(10 * 2 ^ difficulty + math_random(1, 100))
end

-- ─── Motor de Investimento ──────────────────────────────────────────────────

--- Aloca capital nos instrumentos
function M.allocate(args)
    local capital = args.capital or M.state.portfolio.cash
    if capital <= 0 then
        return { error = "Sem capital para alocar" }
    end

    local instruments = M.config.investment.instruments
    local reserve = capital * M.config.investment.min_liquidity_reserve
    local investable = capital - reserve

    local allocations = {}
    local stress = M.state.stress

    -- Ajustar pesos baseado no estresse (Mecânica dos Colapsos)
    for _, inst in ipairs(instruments) do
        local adjusted_weight = inst.weight

        -- Reduzir peso em instrumentos de risco quando estresse alto
        if inst.risk == "high" and stress > 0.5 then
            adjusted_weight = adjusted_weight * (1.0 - stress)
        elseif inst.risk == "medium" and stress > 0.6 then
            adjusted_weight = adjusted_weight * 0.7
        end

        -- Aumentar peso em instrumentos seguros quando estresse alto
        if inst.risk == "low" and stress > 0.5 then
            adjusted_weight = adjusted_weight * (1.0 + stress * 0.5)
        end

        allocations[inst.name] = {
            amount = investable * adjusted_weight,
            weight = adjusted_weight,
            instrument = inst.name,
        }
    end

    -- Normalizar pesos
    local total_weight = 0
    for _, a in pairs(allocations) do
        total_weight = total_weight + a.weight
    end
    for _, a in pairs(allocations) do
        a.weight = a.weight / math_max(total_weight, 0.001)
        a.amount = investable * a.weight
    end

    return {
        investable = investable,
        reserve = reserve,
        allocations = allocations,
        stress_adjusted = stress > 0.3,
    }
end

--- Calcula retorno de um investimento
function M.calculate_returns(args)
    local instrument = args.instrument
    local amount = args.amount
    local entry_price = args.entry_price or amount
    local current_stress = args.stress or M.state.stress
    local c_epsilon = args.C_epsilon or M.config.lsc.target_coherence

    -- Retorno base do instrumento
    local base_return = 0
    if instrument == "CCB" then
        -- CCB: cupom = base * (1 + σ) * exp(-KL)
        local kl = current_stress * 0.4
        base_return = 0.05 * (1 + current_stress) * math_exp(-kl)
    elseif instrument == "CoherenceBond" then
        -- Coherence Bond: yield = base * C_ε²
        base_return = 0.03 * c_epsilon * c_epsilon
    elseif instrument == "rETF" then
        -- rETF: retorno médio do mercado ajustado por saturação
        local g = saturation(c_epsilon)
        base_return = 0.08 * g
    elseif instrument == "HysteresisVault" then
        -- HSV: retorno com memória
        base_return = 0.04 * (1 + M.state.stress * 0.1)
    end

    local current_value = amount * (1 + base_return)
    local pnl = current_value - entry_price
    local return_pct = pnl / math_max(entry_price, 1)

    return {
        instrument = instrument,
        entry = entry_price,
        current = current_value,
        pnl = pnl,
        return_pct = return_pct,
        coupon_rate = base_return,
    }
end

-- ─── Gerenciamento de Risco ─────────────────────────────────────────────────

--- Avalia risco atual
function M.assess_risk(args)
    local portfolio_value = args.portfolio_value or M.state.portfolio.total_value
    local stress = args.stress or M.state.stress
    local c_epsilon = args.C_epsilon or M.config.lsc.target_coherence

    -- Calcular drawdown
    if portfolio_value > M.state.peak_value then
        M.state.peak_value = portfolio_value
    end
    M.state.drawdown = (M.state.peak_value - portfolio_value) / math_max(M.state.peak_value, 1)

    -- Determinar ações
    local actions = {}
    local risk_level = "LOW"

    -- Stop loss
    if M.state.drawdown > M.config.risk.max_drawdown then
        M.state.stop_loss_triggered = true
        risk_level = "CRITICAL"
        table.insert(actions, "STOP_LOSS_ALL")
    elseif M.state.drawdown > M.config.risk.stop_loss_pct then
        risk_level = "HIGH"
        table.insert(actions, "REDUCE_POSITIONS")
    end

    -- Take profit
    local total_return = (portfolio_value - M.state.portfolio.total_invested) /
                          math_max(M.state.portfolio.total_invested, 1)
    if total_return > M.config.risk.take_profit_pct then
        risk_level = "HIGH"
        table.insert(actions, "TAKE_PROFIT")
    end

    -- Estresse do mercado
    if stress > M.config.risk.max_stress then
        risk_level = "CRITICAL"
        table.insert(actions, "EXIT_MARKET")
    elseif stress > 0.5 then
        if risk_level == "LOW" then risk_level = "MEDIUM" end
        table.insert(actions, "REDUCE_EXPOSURE")
    end

    -- Coerência (Law 2: saturação)
    if c_epsilon > M.config.lsc.max_coherence then
        risk_level = "CRITICAL"
        table.insert(actions, "HALT_TRADING")
    end

    -- Cooldown
    local time_since = os.time() - M.state.last_operation_time
    if time_since < M.config.risk.cooldown_seconds then
        table.insert(actions, string.format("COOLDOWN_%ds", M.config.risk.cooldown_seconds - time_since))
    end

    return {
        risk_level = risk_level,
        drawdown = M.state.drawdown,
        stress = stress,
        c_epsilon = c_epsilon,
        actions = actions,
        can_trade = risk_level ~= "CRITICAL" and time_since >= M.config.risk.cooldown_seconds,
    }
end

--- Executa stop loss
function M.execute_stop_loss()
    M.state.stop_loss_triggered = true
    M.state.last_operation_time = os.time()

    -- Mover tudo para reserva
    local withdrawn = M.state.portfolio.total_value * 0.5
    M.state.portfolio.cash = M.state.portfolio.cash + withdrawn

    for name, pos in pairs(M.state.portfolio.positions) do
        pos.amount = pos.amount * 0.5
    end

    return {
        action = "STOP_LOSS",
        withdrawn = withdrawn,
        portfolio_value = M.state.portfolio.total_value,
    }
end

-- ─── Otimização LSC ────────────────────────────────────────────────────────

--- Calcula alocação ótima baseada nas 3 Leis de Bruno
function M.optimize_allocation(args)
    local current_c = args.C_epsilon or M.config.lsc.target_coherence
    local p_max = args.P_max or M.config.lsc.power_limit

    -- Law 1: P ≤ P_max
    local effective_power = math_min(1.0, p_max)

    -- Law 2: G(C_ε) — saturação
    local g = saturation(current_c)

    -- Law 3: K_eff — rigidez
    local k_eff = rigidity(current_c)

    -- Calcular alocação ótima
    -- Quando C_ε alto (próximo de 0.86): reduzir exposição
    -- Quando C_ε baixo (próximo de 0): aumentar exposição
    local exposure_factor = 1.0 - current_c
    local risk_adjusted_power = effective_power * g * exposure_factor

    -- Determinar mix ideal
    local ideal_mix = {
        CCB = 0.30 + (1 - g) * 0.10,           -- Mais CCB quando saturação baixa
        CoherenceBond = 0.25 + current_c * 0.15, -- Mais CB quando coerência alta
        rETF = 0.25 * exposure_factor,            -- Menos rETF quando coerência alta
        HysteresisVault = 0.20 + M.state.stress * 0.10, -- Mais HSV quando estresse alto
    }

    -- Normalizar
    local total = 0
    for _, v in pairs(ideal_mix) do total = total + v end
    for k, v in pairs(ideal_mix) do
        ideal_mix[k] = v / math_max(total, 0.001)
    end

    return {
        C_epsilon = current_c,
        G_saturation = g,
        K_eff = k_eff,
        effective_power = risk_adjusted_power,
        exposure_factor = exposure_factor,
        ideal_mix = ideal_mix,
        recommendation = current_c > 0.7 and "REDUCE" or (current_c < 0.3 and "INCREASE" or "HOLD"),
    }
end

-- ─── Ciclo Principal ────────────────────────────────────────────────────────

--- Executa um ciclo completo: minera → investe → gerencia risco
function M.run_cycle(args)
    local stress = args.stress or 0.3
    local c_epsilon = args.C_epsilon or 0.5
    local market_data = args.market_data or {}

    -- 1. Avaliar risco
    local risk = M.assess_risk({
        stress = stress,
        C_epsilon = c_epsilon,
    })

    if not risk.can_trade then
        return {
            cycle = "SKIPPED",
            reason = risk.risk_level,
            actions = risk.actions,
        }
    end

    -- 2. Mineração (se ativa)
    local mining_result = nil
    if M.state.mining_active then
        mining_result = M.mine_batch({
            field = market_data.field or {},
            difficulty = M.config.mining.difficulty,
        })
    end

    -- 3. Auto-compound: reinvestir lucros
    local invest_amount = M.state.portfolio.cash * M.config.mining.auto_compound_pct
    local allocation = nil
    if invest_amount > 1 then
        allocation = M.allocate({ capital = invest_amount })
    end

    -- 4. Otimizar alocação
    local optimization = M.optimize_allocation({
        C_epsilon = c_epsilon,
    })

    -- 5. Calcular retornos das posições atuais
    local returns = {}
    for name, pos in pairs(M.state.portfolio.positions) do
        local ret = M.calculate_returns({
            instrument = name,
            amount = pos.amount,
            entry_price = pos.entry_price,
            stress = stress,
            C_epsilon = c_epsilon,
        })
        returns[name] = ret
    end

    -- 6. Atualizar estado
    M.state.stress = stress
    M.state.last_operation_time = os.time()

    -- Registrar no histórico
    table.insert(M.state.history, {
        timestamp = os.time(),
        mined = mining_result and mining_result.total_reward or 0,
        invested = invest_amount,
        stress = stress,
        c_epsilon = c_epsilon,
        risk_level = risk.risk_level,
        portfolio_value = M.state.portfolio.total_value,
    })

    -- Manter apenas últimos 100 registros
    if #M.state.history > 100 then
        table.remove(M.state.history, 1)
    end

    return {
        cycle = "COMPLETED",
        mining = mining_result,
        investment = allocation,
        optimization = optimization,
        risk = risk,
        returns = returns,
        portfolio = {
            value = M.state.portfolio.total_value,
            cash = M.state.portfolio.cash,
            total_mined = M.state.total_mined,
            blocks = M.state.blocks_mined,
        },
    }
end

-- ─── Status ─────────────────────────────────────────────────────────────────

function M.status()
    local total_return = 0
    if M.state.portfolio.total_invested > 0 then
        total_return = (M.state.portfolio.total_value - M.state.portfolio.total_invested)
                        / M.state.portfolio.total_invested * 100
    end

    return {
        mining = {
            active = M.state.mining_active,
            hashrate = M.state.hashrate,
            blocks = M.state.blocks_mined,
            total_mined = M.state.total_mined,
        },
        portfolio = {
            value = M.state.portfolio.total_value,
            cash = M.state.portfolio.cash,
            invested = M.state.portfolio.total_invested,
            return_pct = total_return,
        },
        risk = {
            stress = M.state.stress,
            drawdown = M.state.drawdown,
            peak = M.state.peak_value,
        },
        performance = {
            total_trades = M.state.total_trades,
            win_rate = M.state.total_trades > 0
                and (M.state.winning_trades / M.state.total_trades * 100) or 0,
            sharpe = M.state.sharpe_ratio,
        },
    }
end

-- ─── Ativar/Desativar ──────────────────────────────────────────────────────

function M.start()
    M.state.mining_active = true
    M.state.peak_value = M.state.portfolio.total_value
    return { status = "started", time = os.time() }
end

function M.stop()
    M.state.mining_active = false
    return { status = "stopped", time = os.time() }
end

return M
