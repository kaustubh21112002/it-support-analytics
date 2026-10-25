/**
 * ============================================================================
 * IT Support Analytics Platform: Supabase CSV Dataset Import Utility
 * ============================================================================
 * Safe, repeatable data-import utility for populating PostgreSQL/Supabase
 * tables from the canonical dataset in it_support_analytics_dataset/data/.
 *
 * MODES:
 *   - Dry Run (DEFAULT): Validates all CSV files, checks relational integrity,
 *     inspects remote database state, and prints the proposed plan.
 *     NO WRITES are performed.
 *   - Apply Mode: Requires explicit flag: `node scripts/import-dataset.mjs --apply`
 *
 * SAFETY INVARIANTS:
 *   - Never overwrites conflicting remote data.
 *   - Skips already-populated tables if they match the baseline exactly.
 *   - Aborts immediately on error without destructive rollbacks.
 *   - Zero third-party runtime dependencies beyond project dependencies.
 *   - Credentials loaded via Vite environment; never printed or hardcoded.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { createServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'it_support_analytics_dataset', 'data');
const BATCH_SIZE = 500;

// ============================================================================
// 1. CSV Parser (RFC 4180 compliant, zero external dependencies)
// ============================================================================

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split(/\r?\n/);
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return { header, rows };
}

// ============================================================================
// 2. Preflight Validation
// ============================================================================

function runPreflightValidation() {
  console.log('--- Phase 1: Local Preflight Dataset Validation ---');

  const files = {
    departments: 'departments.csv',
    categories: 'categories.csv',
    sla_rules: 'sla_rules.csv',
    teams: 'teams.csv',
    agents: 'agents.csv',
    tickets: 'tickets.csv'
  };

  const expectedCounts = {
    departments: 5,
    categories: 6,
    sla_rules: 4,
    teams: 8,
    agents: 24,
    tickets: 8000
  };

  const parsed = {};

  // Check file existence and row counts
  for (const [table, filename] of Object.entries(files)) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing expected dataset file: ${filename}`);
    }
    const data = parseCSV(filePath);
    parsed[table] = data;

    const rowCount = data.rows.length;
    const expected = expectedCounts[table];
    if (rowCount !== expected) {
      throw new Error(`Row count mismatch in ${filename}: found ${rowCount}, expected ${expected}`);
    }
    console.log(`  ✓ ${filename.padEnd(16)} : Header valid, ${rowCount.toLocaleString()} rows verified.`);
  }

  // Validate Primary Keys
  const deptIds = new Set(parsed.departments.rows.map(r => r.department_id));
  const catIds = new Set(parsed.categories.rows.map(r => r.category_id));
  const slaIds = new Set(parsed.sla_rules.rows.map(r => r.sla_rule_id));
  const teamIds = new Set(parsed.teams.rows.map(r => r.team_id));
  const agentIds = new Set(parsed.agents.rows.map(r => r.agent_id));
  const ticketIds = new Set(parsed.tickets.rows.map(r => r.ticket_id));

  if (deptIds.size !== 5) throw new Error('Duplicate primary keys in departments.csv');
  if (catIds.size !== 6) throw new Error('Duplicate primary keys in categories.csv');
  if (slaIds.size !== 4) throw new Error('Duplicate primary keys in sla_rules.csv');
  if (teamIds.size !== 8) throw new Error('Duplicate primary keys in teams.csv');
  if (agentIds.size !== 24) throw new Error('Duplicate primary keys in agents.csv');
  if (ticketIds.size !== 8000) throw new Error('Duplicate primary keys in tickets.csv');
  console.log('  ✓ Primary Keys   : 100% unique across all 6 tables (0 duplicates).');

  // Validate Foreign Keys
  const orphanTeamDepts = parsed.teams.rows.filter(r => !deptIds.has(r.department_id));
  if (orphanTeamDepts.length > 0) throw new Error('Foreign key violation: teams.department_id -> departments');

  const orphanAgentTeams = parsed.agents.rows.filter(r => !teamIds.has(r.team_id));
  if (orphanAgentTeams.length > 0) throw new Error('Foreign key violation: agents.team_id -> teams');

  const orphanTicketDepts = parsed.tickets.rows.filter(r => !deptIds.has(r.department_id));
  if (orphanTicketDepts.length > 0) throw new Error('Foreign key violation: tickets.department_id -> departments');

  const orphanTicketCats = parsed.tickets.rows.filter(r => !catIds.has(r.category_id));
  if (orphanTicketCats.length > 0) throw new Error('Foreign key violation: tickets.category_id -> categories');

  const orphanTicketTeams = parsed.tickets.rows.filter(r => !teamIds.has(r.team_id));
  if (orphanTicketTeams.length > 0) throw new Error('Foreign key violation: tickets.team_id -> teams');

  const orphanTicketAgents = parsed.tickets.rows.filter(r => r.agent_id.trim() && !agentIds.has(r.agent_id.trim()));
  if (orphanTicketAgents.length > 0) throw new Error('Foreign key violation: tickets.agent_id -> agents');

  const orphanTicketSlas = parsed.tickets.rows.filter(r => !slaIds.has(r.sla_rule_id));
  if (orphanTicketSlas.length > 0) throw new Error('Foreign key violation: tickets.sla_rule_id -> sla_rules');
  console.log('  ✓ Foreign Keys   : 100% referential integrity verified (0 orphan keys).');

  // Validate Enums & Types
  const priorities = new Set(['Critical', 'High', 'Medium', 'Low']);
  const statuses = new Set(['Open', 'In Progress', 'Pending', 'Resolved', 'Closed']);
  const expBands = new Set(['Junior', 'Mid-level', 'Senior']);
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  for (const r of parsed.sla_rules.rows) {
    if (!priorities.has(r.priority)) throw new Error(`Invalid priority in sla_rules: ${r.priority}`);
    if (isNaN(Number(r.target_resolution_hours))) throw new Error(`Invalid hours in sla_rules: ${r.target_resolution_hours}`);
  }

  for (const r of parsed.agents.rows) {
    if (!expBands.has(r.experience_band)) throw new Error(`Invalid experience_band: ${r.experience_band}`);
  }

  for (const r of parsed.tickets.rows) {
    if (!statuses.has(r.status)) throw new Error(`Invalid ticket status: ${r.status}`);
    if (!priorities.has(r.priority)) throw new Error(`Invalid ticket priority: ${r.priority}`);
    if (!dateRegex.test(r.created_at)) throw new Error(`Invalid created_at format: ${r.created_at}`);
    if (r.resolved_at && !dateRegex.test(r.resolved_at)) throw new Error(`Invalid resolved_at format: ${r.resolved_at}`);
    if (r.resolved_at && new Date(r.resolved_at).getTime() < new Date(r.created_at).getTime()) {
      throw new Error(`Inverted timestamps in ticket ${r.ticket_id}: resolved_at < created_at`);
    }
  }
  console.log('  ✓ Enums & Values : All priority, status, band, and timestamp formats validated.');

  return parsed;
}

// ============================================================================
// 3. Transformation Helpers (Converting empty CSV strings to typed nulls)
// ============================================================================

const PK_COLUMNS = {
  departments: 'department_id',
  categories: 'category_id',
  sla_rules: 'sla_rule_id',
  teams: 'team_id',
  agents: 'agent_id',
  tickets: 'ticket_id'
};

function transformDepartments(rows) {
  return rows.map(r => ({
    department_id: Number(r.department_id),
    department_name: r.department_name.trim()
  }));
}

function transformCategories(rows) {
  return rows.map(r => ({
    category_id: Number(r.category_id),
    category_name: r.category_name.trim(),
    subcategory_name: r.subcategory_name.trim()
  }));
}

function transformSlaRules(rows) {
  return rows.map(r => ({
    sla_rule_id: Number(r.sla_rule_id),
    priority: r.priority.trim(),
    target_resolution_hours: Number(r.target_resolution_hours)
  }));
}

function transformTeams(rows) {
  return rows.map(r => ({
    team_id: Number(r.team_id),
    team_name: r.team_name.trim(),
    department_id: Number(r.department_id)
  }));
}

function transformAgents(rows) {
  return rows.map(r => ({
    agent_id: Number(r.agent_id),
    agent_code: r.agent_code.trim(),
    team_id: Number(r.team_id),
    experience_band: r.experience_band.trim()
  }));
}

function transformTickets(rows) {
  return rows.map(r => ({
    ticket_id: r.ticket_id.trim(),
    created_at: r.created_at.trim(),
    resolved_at: r.resolved_at.trim() || null,
    status: r.status.trim(),
    priority: r.priority.trim(),
    category_id: Number(r.category_id),
    issue_type: r.issue_type.trim(),
    department_id: Number(r.department_id),
    team_id: Number(r.team_id),
    agent_id: r.agent_id.trim() ? Number(r.agent_id) : null,
    sla_rule_id: Number(r.sla_rule_id),
    satisfaction_rating: r.satisfaction_rating.trim() ? Number(r.satisfaction_rating) : null,
    resolution_time_hours: r.resolution_time_hours.trim() ? Number(r.resolution_time_hours) : null
  }));
}

// ============================================================================
// 4. Remote Query & Full Content Comparison Helpers (Paging-Safe)
// ============================================================================

function normalizeDateStr(val) {
  if (!val) return null;
  // Standardize ISO vs space date strings: "2024-09-05 15:53:23" vs "2024-09-05T15:53:23"
  return val.replace('T', ' ').slice(0, 19);
}

/**
 * Fetches all remote rows for a table across PostgREST pagination limits (1,000 rows/page).
 */
async function fetchAllRemoteRows(supabase, table, pkColumn, totalCount) {
  const PAGE_SIZE = 1000;
  const allRows = [];
  for (let offset = 0; offset < totalCount; offset += PAGE_SIZE) {
    const end = Math.min(offset + PAGE_SIZE - 1, totalCount - 1);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(pkColumn, { ascending: true })
      .range(offset, end);

    if (error) {
      throw new Error(`Failed to fetch records for table '${table}' in range [${offset}..${end}]: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error(`Unexpected empty page returned for table '${table}' at range [${offset}..${end}].`);
    }
    allRows.push(...data);
  }
  return allRows;
}

/**
 * Compares complete remote table contents against canonical CSV baseline.
 */
function compareRecords(table, remoteRows, localRows) {
  if (remoteRows.length !== localRows.length) {
    return {
      match: false,
      reason: `Row count mismatch: remote=${remoteRows.length}, expected local=${localRows.length}`
    };
  }

  if (table === 'departments') {
    const remoteMap = new Map(remoteRows.map(r => [Number(r.department_id), r]));
    for (const local of localRows) {
      const remote = remoteMap.get(Number(local.department_id));
      if (!remote) return { match: false, reason: `Missing department_id ${local.department_id} in remote database` };
      if (remote.department_name !== local.department_name) {
        return { match: false, reason: `Department ${local.department_id} name mismatch: local='${local.department_name}', remote='${remote.department_name}'` };
      }
    }
  } else if (table === 'categories') {
    const remoteMap = new Map(remoteRows.map(r => [Number(r.category_id), r]));
    for (const local of localRows) {
      const remote = remoteMap.get(Number(local.category_id));
      if (!remote) return { match: false, reason: `Missing category_id ${local.category_id} in remote database` };
      if (remote.category_name !== local.category_name || remote.subcategory_name !== local.subcategory_name) {
        return { match: false, reason: `Category ${local.category_id} mismatch: local='${local.category_name}/${local.subcategory_name}', remote='${remote.category_name}/${remote.subcategory_name}'` };
      }
    }
  } else if (table === 'sla_rules') {
    const remoteMap = new Map(remoteRows.map(r => [Number(r.sla_rule_id), r]));
    for (const local of localRows) {
      const remote = remoteMap.get(Number(local.sla_rule_id));
      if (!remote) return { match: false, reason: `Missing sla_rule_id ${local.sla_rule_id} in remote database` };
      if (remote.priority !== local.priority) {
        return { match: false, reason: `SLA rule ${local.sla_rule_id} priority mismatch: local='${local.priority}', remote='${remote.priority}'` };
      }
      if (Math.abs(Number(remote.target_resolution_hours) - Number(local.target_resolution_hours)) > 0.001) {
        return { match: false, reason: `SLA rule ${local.sla_rule_id} hours mismatch: local=${local.target_resolution_hours}, remote=${remote.target_resolution_hours}` };
      }
    }
  } else if (table === 'teams') {
    const remoteMap = new Map(remoteRows.map(r => [Number(r.team_id), r]));
    for (const local of localRows) {
      const remote = remoteMap.get(Number(local.team_id));
      if (!remote) return { match: false, reason: `Missing team_id ${local.team_id} in remote database` };
      if (remote.team_name !== local.team_name || Number(remote.department_id) !== Number(local.department_id)) {
        return { match: false, reason: `Team ${local.team_id} mismatch: local='${local.team_name}'(dept ${local.department_id}), remote='${remote.team_name}'(dept ${remote.department_id})` };
      }
    }
  } else if (table === 'agents') {
    const remoteMap = new Map(remoteRows.map(r => [Number(r.agent_id), r]));
    for (const local of localRows) {
      const remote = remoteMap.get(Number(local.agent_id));
      if (!remote) return { match: false, reason: `Missing agent_id ${local.agent_id} in remote database` };
      if (
        remote.agent_code !== local.agent_code ||
        Number(remote.team_id) !== Number(local.team_id) ||
        remote.experience_band !== local.experience_band
      ) {
        return { match: false, reason: `Agent ${local.agent_id} (${local.agent_code}) data mismatch between local and remote` };
      }
    }
  } else if (table === 'tickets') {
    const remoteMap = new Map(remoteRows.map(r => [r.ticket_id, r]));
    for (const local of localRows) {
      const remote = remoteMap.get(local.ticket_id);
      if (!remote) return { match: false, reason: `Missing ticket_id '${local.ticket_id}' in remote database` };
      if (remote.status !== local.status) {
        return { match: false, reason: `Ticket ${local.ticket_id} status mismatch: local='${local.status}', remote='${remote.status}'` };
      }
      if (remote.priority !== local.priority) {
        return { match: false, reason: `Ticket ${local.ticket_id} priority mismatch: local='${local.priority}', remote='${remote.priority}'` };
      }
      if (Number(remote.category_id) !== Number(local.category_id)) {
        return { match: false, reason: `Ticket ${local.ticket_id} category_id mismatch` };
      }
      if (remote.issue_type !== local.issue_type) {
        return { match: false, reason: `Ticket ${local.ticket_id} issue_type mismatch` };
      }
      if (Number(remote.department_id) !== Number(local.department_id)) {
        return { match: false, reason: `Ticket ${local.ticket_id} department_id mismatch` };
      }
      if (Number(remote.team_id) !== Number(local.team_id)) {
        return { match: false, reason: `Ticket ${local.ticket_id} team_id mismatch` };
      }
      const remoteAgentId = remote.agent_id != null ? Number(remote.agent_id) : null;
      if (remoteAgentId !== local.agent_id) {
        return { match: false, reason: `Ticket ${local.ticket_id} agent_id mismatch: local=${local.agent_id}, remote=${remoteAgentId}` };
      }
      if (Number(remote.sla_rule_id) !== Number(local.sla_rule_id)) {
        return { match: false, reason: `Ticket ${local.ticket_id} sla_rule_id mismatch` };
      }
      const remoteRating = remote.satisfaction_rating != null ? Number(remote.satisfaction_rating) : null;
      if (remoteRating !== local.satisfaction_rating) {
        return { match: false, reason: `Ticket ${local.ticket_id} satisfaction_rating mismatch` };
      }
      if (normalizeDateStr(remote.created_at) !== normalizeDateStr(local.created_at)) {
        return { match: false, reason: `Ticket ${local.ticket_id} created_at mismatch: local='${local.created_at}', remote='${remote.created_at}'` };
      }
      if (normalizeDateStr(remote.resolved_at) !== normalizeDateStr(local.resolved_at)) {
        return { match: false, reason: `Ticket ${local.ticket_id} resolved_at mismatch: local='${local.resolved_at}', remote='${remote.resolved_at}'` };
      }
      if (local.resolution_time_hours != null || remote.resolution_time_hours != null) {
        const localHours = local.resolution_time_hours != null ? Number(local.resolution_time_hours) : null;
        const remoteHours = remote.resolution_time_hours != null ? Number(remote.resolution_time_hours) : null;
        if (localHours == null || remoteHours == null || Math.abs(localHours - remoteHours) > 0.01) {
          return { match: false, reason: `Ticket ${local.ticket_id} resolution_time_hours mismatch: local=${localHours}, remote=${remoteHours}` };
        }
      }
    }
  }

  return { match: true };
}

// ============================================================================
// 5. Main Controller
// ============================================================================

async function main() {
  const isApply = process.argv.includes('--apply');

  console.log('====================================================================');
  console.log(` IT Support Analytics: Supabase Dataset Importer [${isApply ? 'APPLY MODE' : 'DRY RUN'}]`);
  console.log('====================================================================\n');

  // Initialize Vite environment to load supabase client safely
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true }
  });

  const successfulTables = [];
  let successfulTicketBatches = 0;

  try {
    const { supabase, isSupabaseAvailable } = await server.ssrLoadModule('/src/lib/supabase.ts');

    if (!isSupabaseAvailable || !supabase) {
      console.error('[FATAL] Supabase configuration is missing or invalid.');
      console.error('Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present in .env.local.');
      process.exitCode = 1;
      return;
    }

    // Ingestion Client Resolution:
    // Under the governed security migration, table INSERT privileges are revoked from the anonymous role (anon).
    // Dry-run inspection operates with the standard client, while --apply requires an administrative key.
    let dbClient = supabase;

    if (isApply) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';
      if (serviceRoleKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = (supabase && supabase.supabaseUrl) || process.env.VITE_SUPABASE_URL || '';
        dbClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        console.log('  [AUTH] Authenticated administrative service-role client initialized for apply mode.');
      } else {
        console.error('\n[FATAL ERROR] Administrative Authorization Required for Ingestion (--apply):');
        console.error('  Under the governed database security hardening migration, direct INSERT and write');
        console.error('  privileges on application tables are revoked from anonymous callers (anon) and strictly');
        console.error('  restricted to verified administrators.');
        console.error('  To execute data ingestion in --apply mode, provide SUPABASE_SERVICE_ROLE_KEY in your local environment:');
        console.error('    $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"');
        console.error('    node scripts/import-dataset.mjs --apply');
        console.error('  SECURITY NOTICE: Never place service-role keys in .env.local or client VITE_* variables.\n');
        process.exitCode = 1;
        return;
      }
    }

    // Phase 1: Local Preflight Validation
    const dataset = runPreflightValidation();

    const expectedCounts = {
      departments: 5,
      categories: 6,
      sla_rules: 4,
      teams: 8,
      agents: 24,
      tickets: 8000
    };

    const transformedDataset = {
      departments: transformDepartments(dataset.departments.rows),
      categories: transformCategories(dataset.categories.rows),
      sla_rules: transformSlaRules(dataset.sla_rules.rows),
      teams: transformTeams(dataset.teams.rows),
      agents: transformAgents(dataset.agents.rows),
      tickets: transformTickets(dataset.tickets.rows)
    };

    // Phase 2: Remote Database State Inspection
    console.log('\n--- Phase 2: Remote Database State Inspection ---');
    const tables = ['departments', 'categories', 'sla_rules', 'teams', 'agents', 'tickets'];
    const remoteCounts = {};

    for (const table of tables) {
      const { count, error } = await dbClient.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        throw new Error(`Failed to query remote table '${table}': ${error.message}`);
      }
      remoteCounts[table] = count || 0;
      console.log(`  • Remote ${table.padEnd(14)} : ${remoteCounts[table].toLocaleString()} records present.`);
    }

    // Phase 3: Global Remote Baseline & Integrity Verification (Preflight)
    console.log('\n--- Phase 3: Global Remote Baseline & Conflict Inspection ---');
    const tableActions = {};

    for (const table of tables) {
      const count = remoteCounts[table];
      const expected = expectedCounts[table];

      if (count === 0) {
        tableActions[table] = {
          action: 'INSERT',
          detail: `Table is empty. Planned to insert ${expected.toLocaleString()} rows.`
        };
        console.log(`  ✓ ${table.padEnd(14)} : Empty (0 rows). Ready for insertion.`);
      } else if (count !== expected) {
        // Table is partially populated or contains unexpected number of rows
        throw new Error(
          `Table '${table}' contains an unexpected record count (${count.toLocaleString()} rows found, expected ${expected.toLocaleString()} or 0).\n` +
          `    Safety abort: Database contains partial or conflicting records. Manual review required; will not overwrite.`
        );
      } else {
        // Table count matches expected count: perform full content comparison with pagination
        console.log(`  • ${table.padEnd(14)} : ${count.toLocaleString()} rows found. Verifying 100% content match against CSV baseline...`);
        const remoteRows = await fetchAllRemoteRows(dbClient, table, PK_COLUMNS[table], count);
        const comparison = compareRecords(table, remoteRows, transformedDataset[table]);

        if (!comparison.match) {
          throw new Error(
            `Table '${table}' content discrepancy with canonical CSV baseline:\n` +
            `    ${comparison.reason}\n` +
            `    Safety abort: Table contains conflicting records. Will not overwrite or delete.`
          );
        }

        tableActions[table] = {
          action: 'SKIP',
          detail: `100% exact match (${count.toLocaleString()} rows verified). Skipped.`
        };
        console.log(`  ✓ ${table.padEnd(14)} : Verified 100% exact match against CSV baseline. Action: SKIP.`);
      }
    }

    // Phase 4: Plan Execution or Dry-Run Output
    console.log('\n--- Phase 4: Import Plan & Execution ---');
    console.log('Proposed Step-by-Step Execution Plan:');
    tables.forEach((table, idx) => {
      const info = tableActions[table];
      console.log(`  Step ${idx + 1}. [${table.padEnd(12)}] : ${info.action} — ${info.detail}`);
    });

    if (!isApply) {
      console.log('\n====================================================================');
      console.log(' [DRY RUN COMPLETE] Global preflight validation passed with 0 errors.');
      console.log(' ZERO remote database writes were executed.');
      console.log(' All 6 tables were verified for baseline integrity and conflict absence.');
      console.log(' To execute this plan and write data, run:');
      console.log('   node scripts/import-dataset.mjs --apply');
      console.log('====================================================================\n');
      return;
    }

    // ========================================================================
    // APPLY MODE EXECUTION (Only executed when --apply is provided)
    // ========================================================================
    console.log('\n>>> EXECUTING DATA INGESTION IN TOPOLOGICAL ORDER <<<\n');

    // 1. Categories
    if (tableActions.categories.action === 'INSERT') {
      const { error } = await dbClient.from('categories').insert(transformedDataset.categories);
      if (error) throw new Error(`Failed to insert categories: ${error.message}`);
      successfulTables.push('categories');
      console.log('  ✓ categories : Successfully inserted 6 records.');
    } else {
      console.log('  - categories : Skipped (already populated and verified).');
    }

    // 2. SLA Rules
    if (tableActions.sla_rules.action === 'INSERT') {
      const { error } = await dbClient.from('sla_rules').insert(transformedDataset.sla_rules);
      if (error) throw new Error(`Failed to insert sla_rules: ${error.message}`);
      successfulTables.push('sla_rules');
      console.log('  ✓ sla_rules : Successfully inserted 4 records.');
    } else {
      console.log('  - sla_rules : Skipped (already populated and verified).');
    }

    // 3. Teams
    if (tableActions.teams.action === 'INSERT') {
      const { error } = await dbClient.from('teams').insert(transformedDataset.teams);
      if (error) throw new Error(`Failed to insert teams: ${error.message}`);
      successfulTables.push('teams');
      console.log('  ✓ teams : Successfully inserted 8 records.');
    } else {
      console.log('  - teams : Skipped (already populated and verified).');
    }

    // 4. Agents
    if (tableActions.agents.action === 'INSERT') {
      const { error } = await dbClient.from('agents').insert(transformedDataset.agents);
      if (error) throw new Error(`Failed to insert agents: ${error.message}`);
      successfulTables.push('agents');
      console.log('  ✓ agents : Successfully inserted 24 records.');
    } else {
      console.log('  - agents : Skipped (already populated and verified).');
    }

    // 5. Tickets (Batched insertion)
    if (tableActions.tickets.action === 'INSERT') {
      const allTickets = transformedDataset.tickets;
      const totalBatches = Math.ceil(allTickets.length / BATCH_SIZE);
      console.log(`  • tickets : Ingesting 8,000 records across ${totalBatches} batches...`);

      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, allTickets.length);
        const batch = allTickets.slice(start, end);

        const { error } = await dbClient.from('tickets').insert(batch);
        if (error) {
          throw new Error(`Failed to insert tickets batch ${i + 1}/${totalBatches} (rows ${start + 1}-${end}): ${error.message}`);
        }
        successfulTicketBatches++;
        console.log(`    ✓ Batch ${String(i + 1).padStart(2)}/${totalBatches} (${batch[0].ticket_id} to ${batch[batch.length - 1].ticket_id}) inserted.`);
      }
      successfulTables.push('tickets');
      console.log('  ✓ tickets : Successfully inserted all 8,000 records.');
    } else {
      console.log('  - tickets : Skipped (already populated and verified).');
    }

    // Phase 6: Post-Import Verification
    console.log('\n--- Phase 6: Post-Import Remote Verification ---');
    const finalCounts = {};
    for (const table of tables) {
      const { count, error } = await dbClient.from(table).select('*', { count: 'exact', head: true });
      if (error) throw new Error(`Failed post-import count on '${table}': ${error.message}`);
      finalCounts[table] = count || 0;
      const expected = expectedCounts[table];
      if (finalCounts[table] !== expected) {
        throw new Error(`Post-import count verification mismatch on '${table}': found ${finalCounts[table]}, expected ${expected}`);
      }
      console.log(`  ✓ ${table.padEnd(14)} : Verified ${finalCounts[table].toLocaleString()} rows.`);
    }

    console.log('\n====================================================================');
    console.log(' [APPLY COMPLETE] All tables successfully ingested and verified.');
    console.log(' NEXT STEP: Run identity sequence synchronization SQL in Supabase SQL editor:');
    console.log('   SELECT setval(pg_get_serial_sequence(\'departments\', \'department_id\'), COALESCE(MAX(department_id), 1)) FROM departments;');
    console.log('   SELECT setval(pg_get_serial_sequence(\'categories\', \'category_id\'), COALESCE(MAX(category_id), 1)) FROM categories;');
    console.log('   SELECT setval(pg_get_serial_sequence(\'sla_rules\', \'sla_rule_id\'), COALESCE(MAX(sla_rule_id), 1)) FROM sla_rules;');
    console.log('   SELECT setval(pg_get_serial_sequence(\'teams\', \'team_id\'), COALESCE(MAX(team_id), 1)) FROM teams;');
    console.log('   SELECT setval(pg_get_serial_sequence(\'agents\', \'agent_id\'), COALESCE(MAX(agent_id), 1)) FROM agents;');
    console.log('====================================================================\n');

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\n[FATAL ERROR]', msg);

    if (isApply && (successfulTables.length > 0 || successfulTicketBatches > 0)) {
      console.error('\n--- Partial Import Status ---');
      console.error(`  Successfully loaded tables   : ${successfulTables.length > 0 ? successfulTables.join(', ') : 'None'}`);
      console.error(`  Successfully loaded tickets  : ${successfulTicketBatches > 0 ? `${(successfulTicketBatches * BATCH_SIZE).toLocaleString()} tickets (${successfulTicketBatches} batches)` : '0'}`);
      console.error('  Status: Database left intact. No automatic or destructive rollback attempted.');
      console.error('  A subsequent run of this script will detect this partial state and refuse to run until manually resolved.');
    }

    process.exitCode = 1;
  } finally {
    await server.close();
  }
}

main();
