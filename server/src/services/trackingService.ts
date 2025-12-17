import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";
import axios from "axios";

export type Webhook = {
  id: number;
  url: string;
  enabled: boolean;
  events: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type TrackingEvent = 
  | "user_registered"
  | "user_login"
  | "deposit_created"
  | "deposit_paid"
  | "deposit_failed"
  | "withdrawal_created"
  | "withdrawal_paid"
  | "bonus_applied"
  | "bet_placed";

export async function listWebhooks(): Promise<Webhook[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM webhooks ORDER BY created_at DESC"
  );

  return (rows as any[]).map((row) => ({
    id: row.id,
    url: row.url,
    enabled: Boolean(row.enabled),
    events: row.events ? (typeof row.events === "string" ? JSON.parse(row.events) : row.events) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function createWebhook(data: {
  url: string;
  events: string[];
  enabled?: boolean;
}): Promise<Webhook> {
  const [result] = await pool.query(
    `INSERT INTO webhooks (url, events, enabled) VALUES (?, ?, ?)`,
    [data.url, JSON.stringify(data.events), data.enabled !== false]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM webhooks WHERE id = ?",
    [(result as any).insertId]
  );

  const row = (rows as any[])[0];
  return {
    id: row.id,
    url: row.url,
    enabled: Boolean(row.enabled),
    events: row.events ? (typeof row.events === "string" ? JSON.parse(row.events) : row.events) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateWebhook(
  id: number,
  data: {
    url?: string;
    events?: string[];
    enabled?: boolean;
  }
): Promise<Webhook | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.url !== undefined) {
    updates.push("url = ?");
    values.push(data.url);
  }
  if (data.events !== undefined) {
    updates.push("events = ?");
    values.push(JSON.stringify(data.events));
  }
  if (data.enabled !== undefined) {
    updates.push("enabled = ?");
    values.push(data.enabled);
  }

  if (updates.length === 0) {
    throw new Error("Nenhum campo para atualizar");
  }

  values.push(id);

  await pool.query(
    `UPDATE webhooks SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM webhooks WHERE id = ?",
    [id]
  );

  if ((rows as any[]).length === 0) return null;

  const row = (rows as any[])[0];
  return {
    id: row.id,
    url: row.url,
    enabled: Boolean(row.enabled),
    events: row.events ? (typeof row.events === "string" ? JSON.parse(row.events) : row.events) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function deleteWebhook(id: number): Promise<void> {
  await pool.query("DELETE FROM webhooks WHERE id = ?", [id]);
}

/**
 * Disparar evento de tracking para todos os webhooks ativos
 */
export async function dispatchEvent(
  event: TrackingEvent,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const webhooks = await listWebhooks();
    const activeWebhooks = webhooks.filter((w) => w.enabled);

    // Filtrar webhooks que devem receber este evento
    const targetWebhooks = activeWebhooks.filter((webhook) => {
      if (webhook.events.length === 0) return false;
      // Se contém '*' ou o evento específico
      return webhook.events.includes("*") || webhook.events.includes(event);
    });

    // Enviar para cada webhook (assíncrono, sem bloquear)
    const promises = targetWebhooks.map(async (webhook) => {
      try {
        await axios.post(webhook.url, {
          event,
          timestamp: new Date().toISOString(),
          ...payload
        }, {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json"
          }
        });
        console.log(`✅ Evento ${event} enviado para webhook ${webhook.id}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar evento ${event} para webhook ${webhook.id}:`, error.message);
        // Não lançar erro - continuar com outros webhooks
      }
    });

    await Promise.allSettled(promises);
  } catch (error: any) {
    console.error("Erro ao disparar evento de tracking:", error);
    // Não lançar erro - tracking não deve quebrar o fluxo principal
  }
}
