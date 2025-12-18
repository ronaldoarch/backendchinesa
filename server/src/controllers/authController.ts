import { Request, Response } from "express";
import { z } from "zod";
import {
  createUser,
  findUserByUsername,
  verifyPassword,
  generateToken,
  findUserById,
  updateUserProfile,
  updateUserPassword
} from "../services/authService";
import { dispatchEvent } from "../services/trackingService";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  phone: z.string().optional(),
  currency: z.string().default("BRL"),
  referralCode: z.string().optional()
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export async function registerController(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inv?lidos", details: parsed.error.flatten() });
    return;
  }

  const { username, password, phone, currency, referralCode } = parsed.data;

  // Verificar se usu?rio j? existe
  console.log("🔍 [REGISTER] Verificando se usuário já existe:", username);
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    console.log("⚠️ [REGISTER] Usuário já existe:", {
      id: existingUser.id,
      username: existingUser.username,
      created_at: existingUser.created_at
    });
    res.status(400).json({ error: "Nome de usu?rio j? est? em uso" });
    return;
  }
  console.log("✅ [REGISTER] Usuário não existe, pode criar");

  try {
    const { referralCode } = parsed.data;
    console.log("📝 [REGISTER] Tentando criar usuário:", { username, hasPhone: !!phone, currency, referralCode });
    const user = await createUser(username, password, phone, currency);
    console.log("✅ [REGISTER] Usuário criado:", { id: user.id, username: user.username });

    // Rastrear referência se código fornecido
    if (referralCode) {
      try {
        const { pool } = await import("../config/database");
        const poolInstance = pool;
        const [affiliates] = await poolInstance.query<any[]>(
          "SELECT id FROM affiliates WHERE code = ? AND active = true",
          [referralCode.toUpperCase()]
        );

        if (affiliates && Array.isArray(affiliates) && affiliates.length > 0) {
          const affiliateId = affiliates[0].id;
          await poolInstance.query(
            "INSERT INTO affiliate_referrals (affiliate_id, referred_user_id) VALUES (?, ?)",
            [affiliateId, user.id]
          );
          console.log("✅ [REGISTER] Referência registrada:", { affiliateId, userId: user.id });
        }
      } catch (error: any) {
        console.error("⚠️ [REGISTER] Erro ao rastrear referência (não crítico):", error.message);
        // Não falhar o registro se houver erro ao rastrear referência
      }
    }
    
    const token = generateToken(user);
    console.log("🔑 [REGISTER] Token gerado");

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        currency: user.currency,
        is_admin: user.is_admin,
        user_type: user.user_type || "user"
      },
      token
    });
    console.log("✅ [REGISTER] Resposta enviada com sucesso");

    // Disparar evento de tracking
    await dispatchEvent("user_registered", {
      userId: user.id,
      username: user.username
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("❌ [REGISTER] Erro ao criar usuário:", {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Erro ao criar usuário",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log("Login attempt:", { username: req.body?.username });
    
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.log("Login: Dados inv?lidos", parsed.error.flatten());
      res.status(400).json({ error: "Dados inv?lidos", details: parsed.error.flatten() });
      return;
    }

    const { username, password } = parsed.data;

    const user = await findUserByUsername(username);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log("Login: Usu?rio n?o encontrado", username);
      res.status(401).json({ error: "Credenciais inv?lidas" });
      return;
    }

    // eslint-disable-next-line no-console
    console.log("Login: Usu?rio encontrado", {
      id: user.id,
      username: user.username,
      has_password_hash: !!user.password_hash,
      password_hash_length: user.password_hash?.length,
      password_hash_start: user.password_hash?.substring(0, 10) + "..."
    });

    const isValidPassword = await verifyPassword(password, user.password_hash);
    // eslint-disable-next-line no-console
    console.log("Login: Verifica??o de senha", {
      username,
      password_provided_length: password.length,
      isValidPassword,
      hash_starts_with: user.password_hash?.substring(0, 7)
    });
    
    if (!isValidPassword) {
      // eslint-disable-next-line no-console
      console.log("Login: Senha inv?lida para usu?rio", username, {
        password_length: password.length,
        hash_exists: !!user.password_hash
      });
      res.status(401).json({ error: "Credenciais inv?lidas" });
      return;
    }

    const token = generateToken(user);

    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        currency: user.currency,
        is_admin: user.is_admin,
        user_type: user.user_type || "user"
      },
      token
    };

    // eslint-disable-next-line no-console
    console.log("Login: Sucesso para usu?rio", username, {
      userId: user.id,
      is_admin_from_db: user.is_admin,
      is_admin_type: typeof user.is_admin,
      token_generated: !!token
    });
    res.json(responseData);

    // Disparar evento de tracking
    await dispatchEvent("user_login", {
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login: Erro inesperado", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

export async function meController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    phone: user.phone,
    email: user.email,
    document: user.document,
    currency: user.currency,
    balance: user.balance || 0,
    is_admin: user.is_admin,
    user_type: user.user_type || "user"
  });
}

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  document: z.string().optional()
});

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  try {
    // Converter strings vazias em null
    const updateData: { phone?: string; email?: string; document?: string } = {};
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone || undefined;
    }
    if (parsed.data.email !== undefined) {
      updateData.email = parsed.data.email || undefined;
    }
    if (parsed.data.document !== undefined) {
      updateData.document = parsed.data.document || undefined;
    }

    const updatedUser = await updateUserProfile(userId, updateData);
    if (!updatedUser) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      phone: updatedUser.phone,
      email: updatedUser.email,
      document: updatedUser.document,
      currency: updatedUser.currency,
      balance: updatedUser.balance || 0,
      is_admin: updatedUser.is_admin
    });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: error.message || "Erro ao atualizar perfil" });
  }
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export async function updatePasswordController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
    return;
  }

  try {
    const success = await updateUserPassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );

    if (!success) {
      res.status(400).json({ error: "Senha atual incorreta" });
      return;
    }

    res.json({ message: "Senha atualizada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: error.message || "Erro ao atualizar senha" });
  }
}
