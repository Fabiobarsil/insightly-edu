import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoCertus from "@/assets/logo-certus.png";

type AuthOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";
const OTP_TYPES: AuthOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

const normalizeOtpType = (value: string | null): AuthOtpType | null => {
  if (!value) return null;
  return OTP_TYPES.includes(value as AuthOtpType) ? (value as AuthOtpType) : null;
};

const getFullNameFromMetadata = (metadata: Record<string, unknown> | null | undefined) =>
  typeof metadata?.full_name === "string" ? metadata.full_name : "";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkError, setLinkError] = useState<string>("");

  // Process the invite/recovery link from the URL and validate session
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const queryParams = url.searchParams;

        // 1) Error returned in the hash (e.g. expired link)
        const errDesc = hashParams.get("error_description") || queryParams.get("error_description");
        const errCode = hashParams.get("error") || queryParams.get("error");
        if (errDesc || errCode) {
          console.error("[accept-invite] link error:", errCode, errDesc);
          if (!cancelled) {
            setLinkError(errDesc || errCode || "Link inválido");
            setChecking(false);
          }
          return;
        }

        // 2) PKCE flow: ?code=...
        const code = queryParams.get("code");
        if (code) {
          console.log("[accept-invite] exchanging PKCE code for session");
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) console.error("[accept-invite] exchange error:", exErr);
        }

        // 2.1) Implicit flow: persist tokens from hash before cleaning the URL.
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          console.log("[accept-invite] setting implicit session from URL hash");
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setErr) console.error("[accept-invite] setSession error:", setErr);
        }

        // 3) Token hash flow: ?token_hash=...&type=invite|recovery|signup
        const tokenHash = queryParams.get("token_hash");
        const otpType = normalizeOtpType(queryParams.get("type"));
        if (tokenHash && otpType) {
          console.log("[accept-invite] verifying OTP token_hash, type:", otpType);
          const { data: verified, error: vErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (vErr) console.error("[accept-invite] verifyOtp error:", vErr);
          if (verified?.session?.access_token && verified.session.refresh_token) {
            await supabase.auth.setSession({
              access_token: verified.session.access_token,
              refresh_token: verified.session.refresh_token,
            });
          }
        }

        // 4) Give the client a tick to settle after exchange/setSession.
        await new Promise((r) => setTimeout(r, 100));

        const { data, error } = await supabase.auth.getSession();
        console.log("[accept-invite] getSession ->", { hasSession: !!data?.session, error });

        if (!cancelled) {
          if (data?.session?.user) {
            setHasSession(true);
            setEmail(data.session.user.email || "");
            const metadataName = getFullNameFromMetadata(data.session.user.user_metadata);
            if (metadataName) setFullName(metadataName);
          }
          setChecking(false);
        }

        // Clean URL so tokens don't linger
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } catch (e) {
        console.error("[accept-invite] init error:", e);
        if (!cancelled) {
          setLinkError((e as Error).message);
          setChecking(false);
        }
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[accept-invite] auth event:", event, !!session);
      if (session?.user) {
        setHasSession(true);
        setEmail(session.user.email || "");
        const metadataName = getFullNameFromMetadata(session.user.user_metadata);
        if (metadataName && !fullName) setFullName(metadataName);
      }
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Informe seu nome completo");
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres");
    if (password !== confirmPassword) return toast.error("As senhas não coincidem");

    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        toast.error("Sessão inválida. Abra novamente o link do convite.");
        setSaving(false);
        return;
      }

      // 1) Set password and profile metadata
      const { error: pwErr } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName.trim() },
      });
      if (pwErr) throw pwErr;

      // 2) Upload photo (optional)
      let avatarUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (upErr) {
          console.error("[accept-invite] upload error:", upErr);
          toast.error("Não foi possível enviar a foto, mas o cadastro continuou.");
        } else {
          const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = pub.publicUrl;
        }
      }

      // 3) Update profile row
      const profilePatch: { full_name: string; phone: string | null; avatar_url?: string } = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      };
      if (avatarUrl) profilePatch.avatar_url = avatarUrl;

      const { error: profileErr } = await supabase
        .from("profiles")
        .update(profilePatch)
        .eq("id", userId);
      if (profileErr) console.warn("[accept-invite] profile update warn:", profileErr);

      toast.success("Cadastro concluído! Bem-vindo(a).");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("[accept-invite] error:", err);
      toast.error(err?.message || "Erro ao concluir o cadastro");
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card border border-border/60 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <i className="ri-error-warning-line text-2xl text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {linkError
              ? linkError
              : "Peça ao administrador para reenviar o convite e abra o link diretamente do seu e-mail."}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <img src={logoCertus} alt="CertusEdu" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-primary">CertusEdu</span>
          </div>
          <p className="text-sm text-muted-foreground">Conclua seu cadastro para acessar o sistema</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Bem-vindo(a)!</h1>
            <p className="text-sm text-muted-foreground">
              Você foi convidado para <strong className="text-foreground">{email}</strong>. Preencha as informações abaixo
              para concluir seu acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary/60 transition group"
                aria-label="Enviar foto de perfil"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
                ) : (
                  <i className="ri-camera-line text-3xl text-muted-foreground group-hover:text-primary transition" />
                )}
                <span className="absolute bottom-0 inset-x-0 bg-foreground/70 text-background text-[10px] font-bold py-1 opacity-0 group-hover:opacity-100 transition">
                  ALTERAR
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">Foto de perfil (opcional)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Nome completo *</label>
              <div className="relative">
                <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  maxLength={120}
                  className="w-full border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">E-mail</label>
              <div className="relative">
                <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Telefone</label>
              <div className="relative">
                <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={20}
                  className="w-full border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Senha *</label>
                <div className="relative">
                  <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    <i className={showPassword ? "ri-eye-off-line text-base" : "ri-eye-line text-base"} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Confirmar senha *</label>
                <div className="relative">
                  <i className="ri-lock-2-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Concluindo...
                </>
              ) : (
                <>
                  <i className="ri-check-line text-base" />
                  Concluir cadastro
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          © 2026 CertusEdu • Uma solução do ecossistema Certus
        </p>
      </div>
    </div>
  );
};

export default AcceptInvite;
