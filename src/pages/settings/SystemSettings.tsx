import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_LOGO_URL } from '../../lib/databaseState';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Save, Building, ShieldCheck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export const SystemSettings: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const { hasPermission } = useAuth();

  const [storeName, setStoreName] = useState(settings.store_name);
  const [tradeName, setTradeName] = useState(settings.trade_name);
  const [ruc, setRuc] = useState(settings.ruc);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [estabCode, setEstabCode] = useState(settings.establishment_code);
  const [emiCode, setEmiCode] = useState(settings.emission_point_code);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || DEFAULT_LOGO_URL);
  const [ivaRate, setIvaRate] = useState(settings.default_iva_rate);
  const [allowNegative, setAllowNegative] = useState(settings.allow_negative_stock);
  const [requireSupervisor, setRequireSupervisor] = useState(settings.require_supervisor_for_discount);

  useEffect(() => {
    setStoreName(settings.store_name);
    setTradeName(settings.trade_name);
    setRuc(settings.ruc);
    setAddress(settings.address);
    setPhone(settings.phone);
    setEmail(settings.email);
    setEstabCode(settings.establishment_code);
    setEmiCode(settings.emission_point_code);
    setLogoUrl(settings.logo_url || DEFAULT_LOGO_URL);
    setIvaRate(settings.default_iva_rate);
    setAllowNegative(settings.allow_negative_stock);
    setRequireSupervisor(settings.require_supervisor_for_discount);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('system_settings')) {
      toast.error('No tiene permisos para modificar la configuración de la tienda.');
      return;
    }

    updateSettings({
      store_name: storeName,
      trade_name: tradeName,
      ruc,
      address,
      phone,
      email,
      establishment_code: estabCode,
      emission_point_code: emiCode,
      logo_url: logoUrl.trim() || DEFAULT_LOGO_URL,
      default_iva_rate: ivaRate,
      allow_negative_stock: allowNegative,
      require_supervisor_for_discount: requireSupervisor,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Configuración General de la Tienda
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Parámetros comerciales, datos tributarios del emisor SRI, series de emisión y políticas de inventario.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Datos Comerciales */}
        <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Identidad Comercial & Fiscal (Ecuador)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="Nombre Comercial"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />

            <Input
              label="Razón Social Legal"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              required
            />

            <Input
              label="Número de RUC (13 dígitos)"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              required
            />

            <Input
              label="Teléfono de Contacto"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Dirección de la Matriz"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <Input
              label="Correo Electrónico de Facturación"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cód. Establecimiento"
                value={estabCode}
                onChange={(e) => setEstabCode(e.target.value)}
                required
              />
              <Input
                label="Punto de Emisión"
                value={emiCode}
                onChange={(e) => setEmiCode(e.target.value)}
                required
              />
            </div>

            {/* Logo Insignia Corporativo */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <img
                  src={logoUrl || DEFAULT_LOGO_URL}
                  alt="Vista previa Logo Insignia"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <Input
                  label="URL del Logo Insignia"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder={DEFAULT_LOGO_URL}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Visible en login, barra lateral, cabecera y panel ejecutivo.
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogoUrl(DEFAULT_LOGO_URL)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Restaurar Logo Oficial
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Políticas de Operación & Tributarias */}
        <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Políticas de Integridad & Impuestos
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tarifa IVA por Defecto
              </label>
              <select
                value={ivaRate}
                onChange={(e) => setIvaRate(parseFloat(e.target.value))}
                className="input-field max-w-xs"
              >
                <option value={15.0}>15% (Tarifa General Vigente)</option>
                <option value={0.0}>0% (Exento)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegative}
                  onChange={(e) => setAllowNegative(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Permitir ventas con stock negativo
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Desactivado por defecto. Bloquea transacciones cuando la existencia física en Kardex sea insuficiente.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireSupervisor}
                  onChange={(e) => setRequireSupervisor(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Requerir supervisor para descuentos superiores al 5%
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Protege el margen comercial ante aplicaciones de descuento manuales en el punto de venta.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {hasPermission('system_settings') && (
          <div className="flex justify-end">
            <Button type="submit" size="lg" icon={<Save className="w-4 h-4" />}>
              Guardar Configuración
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
