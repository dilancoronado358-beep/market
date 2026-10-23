import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { toast } from 'sonner';

// Iconos de redes sociales / contacto
const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const Login: React.FC = () => {
  const { login, resetPassword, allUsers } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal de recuperación
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Credenciales inválidas. Verifique su correo o contraseña.');
    } else {
      toast.success('Bienvenido al Sistema de Gestión Comercial');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Ingrese el correo para recuperar su contraseña');
      return;
    }
    setIsResetting(true);
    const res = await resetPassword(resetEmail);
    setIsResetting(false);
    if (res.success) {
      toast.success('Se ha enviado la solicitud de recuperación a la cola de correos.');
      setIsResetOpen(false);
    } else {
      toast.error(res.error || 'No se pudo enviar el correo.');
    }
  };

  // Autocompletar credenciales de prueba con un clic
  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo123456');
    setErrorMessage('');
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-10 lg:p-16 bg-cover bg-center bg-no-repeat font-sans"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85')`,
      }}
    >
      {/* Capa de oscurecimiento suave para alto contraste y legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/75 backdrop-blur-[1px]" />

      {/* Contenedor Principal de Dos Columnas */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        
        {/* Columna Izquierda: Mensaje de Bienvenida y Marca */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-white text-left">
          {/* Logo Corporativo */}
          <div className="flex items-center gap-3.5">
            <img
              src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png"
              alt="ERP / POS Ecuador"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-2xl shadow-xl ring-2 ring-white/30 bg-white/10 backdrop-blur-md p-1 shrink-0"
            />
            <div>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-white block">
                ERP / POS Ecuador
              </span>
              <span className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-orange-400">
                Sistema Comercial & SRI
              </span>
            </div>
          </div>

          {/* Gran Título Estilo Referencia */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] drop-shadow-lg">
            Bienvenido<br />
            de Nuevo
          </h1>

          {/* Párrafo Descriptivo en Español */}
          <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-lg font-light drop-shadow">
            Plataforma integral de gestión comercial, control de inventario en tiempo real, punto de venta y facturación electrónica autorizada por el SRI de Ecuador.
          </p>

          {/* Iconos de Redes / Contacto (Exactamente como en la referencia) */}
          <div className="flex items-center gap-3 pt-3">
            <a
              href="#facebook"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-md"
            >
              <FacebookIcon />
            </a>
            <a
              href="#twitter"
              aria-label="Twitter / X"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-md"
            >
              <TwitterIcon />
            </a>
            <a
              href="#instagram"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-md"
            >
              <InstagramIcon />
            </a>
            <a
              href="#youtube"
              aria-label="YouTube"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-md"
            >
              <YoutubeIcon />
            </a>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Inicio de Sesión */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto">
          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              Iniciar Sesión
            </h2>

            {/* Alerta de Error */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-600/90 border border-rose-500 text-white text-xs font-medium shadow-lg animate-fade-in">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-white/95 mb-1.5 drop-shadow uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@erpposecuador.com"
                  required
                  className="w-full px-4 py-3 bg-white text-slate-900 rounded-md text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 border-0 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-white/95 mb-1.5 drop-shadow uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-3 bg-white text-slate-900 rounded-md text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 border-0 placeholder:text-slate-400 pr-11 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Recordar mi sesión */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-white/40 bg-white/20 checked:bg-orange-600 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs text-white/90 font-medium cursor-pointer drop-shadow select-none"
                >
                  Recordar mi sesión
                </label>
              </div>

              {/* Botón de Inicio de Sesión Naranja como en la Referencia */}
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 rounded-md bg-[#e05626] hover:bg-[#c94519] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                  </span>
                ) : (
                  'Iniciar Sesión Ahora'
                )}
              </button>

              {/* Enlace de Olvido de Contraseña */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-xs text-white/90 hover:text-white underline underline-offset-4 transition-colors font-medium drop-shadow"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>

              {/* Aviso Legal de Términos de Servicio */}
              <p className="text-[11px] text-white/75 leading-relaxed pt-2 drop-shadow">
                Al hacer clic en &quot;Iniciar Sesión Ahora&quot; usted acepta nuestros{' '}
                <a href="#terminos" className="underline text-white hover:text-orange-300">
                  Términos de Servicio
                </a>{' '}
                |{' '}
                <a href="#privacidad" className="underline text-white hover:text-orange-300">
                  Política de Privacidad
                </a>
              </p>

              {/* Panel de Acceso Rápido de Prueba (Demo 1 Clic) */}
              <div className="pt-5 border-t border-white/20">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/90 mb-2 drop-shadow flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Acceso Rápido de Prueba (1 Clic)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Map(allUsers.filter(u => u.is_active).map(u => [u.role, u])).values()).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => fillCredentials(u.email)}
                      className="px-2.5 py-1 rounded bg-black/45 hover:bg-black/65 border border-white/30 text-white text-[11px] font-medium backdrop-blur-sm transition-all hover:border-orange-400 capitalize cursor-pointer shadow-sm"
                    >
                      {u.role.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Recuperación de Contraseña"
        subtitle="Le enviaremos un enlace seguro para restablecer su acceso"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsResetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} isLoading={isResetting}>
              Enviar Solicitud
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ingrese el correo electrónico registrado en su cuenta de ERP / POS Ecuador. El sistema generará una notificación interna y despachará las instrucciones a la cola de correos.
          </p>
          <Input
            label="Correo Corporativo"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="admin@erpposecuador.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>
      </Modal>
    </div>
  );
};
