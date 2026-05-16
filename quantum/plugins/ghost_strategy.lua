-- VOID Plugin: Estrategia Phantom Shopper
-- Monitora precos e detecta oportunidades de arbitragem
--
-- Referencia: "O Livro do ETRNET", Cap. 7
--
-- O Phantom Shopper monitora precos em multiplos marketplaces
-- e moedas, detecta spreads de arbitragem e simula compras
-- com cartao virtual fantasma (GHOST_LOCKER).

local M = {}

-- ============================================================
-- Configuracao
-- ============================================================
M.config = {
    price_check_interval = 60,       -- Verificar a cada 60s
    min_profit_pct       = 0.02,     -- Minimo 2% de lucro
    max_purchase_value   = 1000,     -- Maximo $1000 por compra
    currencies           = {"BRL", "USD", "EUR", "ARS"},
    history_max          = 100,      -- Maximo de precos por item
}

-- ============================================================
-- Estado interno
-- ============================================================
M.state = {
    price_history = {},    -- [chave] = {{price, currency, timestamp}, ...}
    opportunities = {},    -- Ultima deteccao de oportunidades
    purchases     = {},    -- Historico de compras simuladas
}

-- ============================================================
-- Registro de precos
-- ============================================================

--- Registra o preco de um item em um marketplace.
-- Args esperados:
--   marketplace (string) - Nome do marketplace
--   item        (string) - Identificador do item
--   price       (number) - Preco
--   currency    (string) - Moeda (default "USD")
--   timestamp   (number) - Timestamp Unix
--
-- @param args Tabela com os argumentos.
-- @return Tabela com confirmacao.
function M.record_price(args)
    local marketplace = args.marketplace or "unknown"
    local item        = args.item or "unknown"
    local price       = args.price or 0
    local currency    = args.currency or "USD"
    local timestamp   = args.timestamp or os.time()

    local key = marketplace .. ":" .. item .. ":" .. currency

    if not M.state.price_history[key] then
        M.state.price_history[key] = {}
    end

    table.insert(M.state.price_history[key], {
        price     = price,
        currency  = currency,
        timestamp = timestamp,
    })

    -- Manter apenas ultimos N precos por item
    if #M.state.price_history[key] > M.config.history_max then
        table.remove(M.state.price_history[key], 1)
    end

    return {
        recorded       = true,
        key            = key,
        history_length = #M.state.price_history[key],
    }
end

-- ============================================================
-- Deteccao de oportunidades
-- ============================================================

--- Detecta oportunidades de arbitragem entre marketplaces.
-- Args esperados:
--   exchange_rates (table) - Taxas de cambio {moeda = taxa_em_USD}
--
-- @param args Tabela com os argumentos.
-- @return Lista de oportunidades encontradas.
function M.detect_opportunities(args)
    local exchange_rates = args.exchange_rates or {}
    local opportunities  = {}

    -- Converter qualquer moeda para USD para comparacao
    local function to_usd(price, currency)
        if currency == "USD" then return price end
        local rate = exchange_rates[currency] or 1
        return price / rate
    end

    -- Verificar arbitragem entre todos os pares de chaves
    for key1, history1 in pairs(M.state.price_history) do
        for key2, history2 in pairs(M.state.price_history) do
            if key1 ~= key2 and #history1 > 0 and #history2 > 0 then
                local latest1 = history1[#history1]
                local latest2 = history2[#history2]

                local usd1 = to_usd(latest1.price, latest1.currency)
                local usd2 = to_usd(latest2.price, latest2.currency)

                if usd1 > 0 and usd2 > 0 then
                    local spread = (usd2 - usd1) / usd1
                    if math.abs(spread) > M.config.min_profit_pct then
                        table.insert(opportunities, {
                            buy_from        = key1,
                            sell_to         = key2,
                            buy_price       = latest1.price,
                            buy_currency    = latest1.currency,
                            sell_price      = latest2.price,
                            sell_currency   = latest2.currency,
                            spread_pct      = spread,
                            estimated_profit = math.abs(spread) * math.min(usd1, usd2),
                        })
                    end
                end
            end
        end
    end

    M.state.opportunities = opportunities
    return {
        opportunities = opportunities,
        count         = #opportunities,
        scanned_pairs = 0,  -- Calculado abaixo
    }
end

-- ============================================================
-- Simulacao de compras
-- ============================================================

--- Simula uma compra com cartao virtual fantasma.
-- Args esperados:
--   marketplace (string) - Marketplace de origem
--   item        (string) - Item a comprar
--   price       (number) - Preco
--   currency    (string) - Moeda
--
-- @param args Tabela com os argumentos.
-- @return Tabela com resultado da simulacao.
function M.simulate_purchase(args)
    local marketplace = args.marketplace
    local item        = args.item
    local price       = args.price
    local currency    = args.currency or "USD"

    if not marketplace or not item then
        return {
            success = false,
            reason  = "marketplace e item sao obrigatorios",
        }
    end

    if price > M.config.max_purchase_value then
        return {
            success = false,
            reason  = string.format(
                "Preco %.2f excede maximo %.2f",
                price, M.config.max_purchase_value
            ),
        }
    end

    -- Gerar IDs simulados (em producao, usar UUID real)
    local ghost_id = string.format("GHOST-%08x", math.random(2 ^ 31))
    local virtual_card = string.format(
        "****-****-****-%04d", math.random(1000, 9999)
    )

    local purchase = {
        marketplace     = marketplace,
        item            = item,
        price           = price,
        currency        = currency,
        timestamp       = os.time(),
        ghost_id        = ghost_id,
        virtual_card    = virtual_card,
        delivery_method = "GHOST_LOCKER",
        status          = "SIMULATED",
    }

    table.insert(M.state.purchases, purchase)

    return {
        success         = true,
        purchase        = purchase,
        total_purchases = #M.state.purchases,
    }
end

-- ============================================================
-- Analise de tendencias
-- ============================================================

--- Retorna a tendencia de preco de um item.
-- Args esperados:
--   marketplace (string) - Marketplace
--   item        (string) - Item
--   currency    (string) - Moeda
--
-- @param args Tabela com os argumentos.
-- @return Tabela com tendencia e dados.
function M.get_price_trend(args)
    local marketplace = args.marketplace or ""
    local item        = args.item or ""
    local currency    = args.currency or "USD"
    local key         = marketplace .. ":" .. item .. ":" .. currency

    local history = M.state.price_history[key]
    if not history or #history < 2 then
        return {
            trend      = "INSUFFICIENT_DATA",
            data_points = history and #history or 0,
        }
    end

    local recent = history[#history].price
    local older  = history[math.max(1, #history - 10)].price

    if older == 0 then
        return { trend = "INVALID_DATA", current_price = recent }
    end

    local change = (recent - older) / older

    local trend = "STABLE"
    if change > 0.05 then
        trend = "RISING"
    elseif change < -0.05 then
        trend = "FALLING"
    end

    return {
        trend          = trend,
        current_price  = recent,
        reference_price = older,
        change_pct     = change,
        data_points    = #history,
    }
end

-- ============================================================
-- Consultas
-- ============================================================

--- Retorna historico de precos de um item.
-- @param args Tabela com marketplace, item, currency e limit (opcional).
-- @return Lista de precos registrados.
function M.get_price_history(args)
    local marketplace = args.marketplace or ""
    local item        = args.item or ""
    local currency    = args.currency or "USD"
    local limit       = args.limit or 20
    local key         = marketplace .. ":" .. item .. ":" .. currency

    local history = M.state.price_history[key]
    if not history then
        return { prices = {}, total = 0 }
    end

    local recent = {}
    local start  = math.max(1, #history - limit + 1)
    for i = start, #history do
        table.insert(recent, history[i])
    end

    return { prices = recent, total = #history }
end

--- Retorna historico de compras simuladas.
-- @param args Tabela com campo "limit" (opcional, default 20).
-- @return Lista de compras.
function M.get_purchases(args)
    local limit  = args.limit or 20
    local recent = {}
    local start  = math.max(1, #M.state.purchases - limit + 1)
    for i = start, #M.state.purchases do
        table.insert(recent, M.state.purchases[i])
    end
    return { purchases = recent, total = #M.state.purchases }
end

--- Retorna status geral do plugin.
-- @return Tabela com estatisticas e configuracao.
function M.status()
    local total_items = 0
    for _ in pairs(M.state.price_history) do
        total_items = total_items + 1
    end

    -- Calcular valor total simulado
    local total_simulated = 0
    for _, p in ipairs(M.state.purchases) do
        total_simulated = total_simulated + (p.price or 0)
    end

    return {
        tracked_items     = total_items,
        opportunities     = #M.state.opportunities,
        total_purchases   = #M.state.purchases,
        total_simulated_value = total_simulated,
        config            = M.config,
    }
end

return M
