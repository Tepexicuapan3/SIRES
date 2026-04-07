import { useState } from "react";
import { AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@shared/utils/styling/cn";

import { ScrollArea } from "@shared/ui/ScrollArea";
import { Checkbox } from "@shared/ui/checkbox";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";

interface Props {
  onAccept: () => void;
}

export const TermsStep = ({ onAccept }: Props) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-0">
      <div className="bg-linear-to-r from-brand/10 via-brand/5 to-transparent p-6 sm:p-8 border-b border-line-hairline/50 rounded-t-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <img
              src="/assets/brand/icons/partners/metro-logo-borde.svg"
              alt="Sistema de Transporte Colectivo Metro CDMX"
              className="h-16 sm:h-20 w-auto drop-shadow-lg"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-txt-body mb-1">
              Términos y Condiciones de Uso
            </h1>
            <p className="text-xs sm:text-sm text-txt-muted/80 mt-1">
              Sistema Integral de Registro Electrónico para la Salud
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <div className="relative">
          <div className="hidden sm:block">
            <ScrollArea className="h-120 w-full pr-4">
              <TermsContent />
            </ScrollArea>
          </div>

          <div className="block sm:hidden h-[50vh] overflow-y-auto overflow-x-hidden pr-2 scroll-smooth">
            <TermsContent />
          </div>
        </div>

        <div className="pt-4 border-t border-line-hairline space-y-4">
          <Label
            htmlFor="accept-terms"
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer min-h-17",
              accepted
                ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                : "border-line-struct hover:border-brand/50 hover:bg-subtle/30",
            )}
          >
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              aria-label="Acepto los términos y condiciones"
              className="mt-0.5"
            />
            <div className="space-y-1 flex-1">
              <span
                className={cn(
                  "text-sm font-semibold transition-colors block",
                  accepted ? "text-brand" : "text-txt-body",
                )}
              >
                He leído y acepto los términos y condiciones
              </span>
              <p className="text-xs text-txt-muted leading-relaxed">
                Declaro que entiendo mis responsabilidades como usuario del
                sistema SIRES.
              </p>
            </div>
          </Label>

          <Button
            onClick={onAccept}
            disabled={!accepted}
            size="lg"
            className="w-full h-12 group"
            aria-label="Continuar al paso de creación de contraseña"
          >
            Continuar
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

const TermsContent = () => (
  <div className="space-y-6 p-1">
    <div className="flex items-start gap-4 p-4 bg-subtle/50 rounded-xl border border-line-hairline">
      <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
        <ShieldCheck size={28} className="text-brand" />
      </div>
      <div>
        <h2 className="font-semibold text-base text-txt-body">
          Acta Responsiva de Usuario
        </h2>
        <p className="text-sm text-txt-muted mt-1">
          Gerencia de Organización y Sistemas — Sistema de Transporte Colectivo
        </p>
      </div>
    </div>

    <div className="space-y-4">
      <p className="text-sm sm:text-base text-txt-body leading-relaxed">
        Por este conducto, hago constar que he recibido la clave de ingreso al{" "}
        <strong>Sistema SIRES</strong> y me comprometo a utilizarla de manera
        responsable, confidencial y exclusivamente para los fines autorizados
        por el Sistema de Transporte Colectivo.
      </p>

      <p className="text-sm sm:text-base text-txt-body leading-relaxed">
        Reconozco que el acceso a este sistema implica el manejo de información
        sensible relacionada con expedientes médicos y datos personales de los
        trabajadores, por lo que me comprometo a observar las siguientes
        disposiciones:
      </p>
    </div>

    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-txt-body uppercase tracking-wide">
        Mis Compromisos como Usuario
      </h3>

      <div className="grid gap-3">
        {[
          {
            title: "Uso Exclusivo Autorizado",
            desc: "Utilizar el sistema únicamente para las funciones propias de mi cargo y las actividades expresamente autorizadas.",
          },
          {
            title: "Confidencialidad de Credenciales",
            desc: "Mantener en estricta confidencialidad mi contraseña y no compartirla con terceros bajo ninguna circunstancia.",
          },
          {
            title: "Notificación de Incidentes",
            desc: "Reportar inmediatamente a la Gerencia de Sistemas cualquier sospecha de acceso no autorizado o compromiso de mis credenciales.",
          },
          {
            title: "Responsabilidad Legal",
            desc: "Asumir la responsabilidad administrativa y legal correspondiente conforme a la Ley de Responsabilidades Administrativas de la Ciudad de México.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-lg bg-paper hover:bg-subtle/30 transition-colors border border-line-hairline"
          >
            <span className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-sm text-txt-body">{item.title}</p>
              <p className="text-sm text-txt-muted mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-start gap-3 p-4 bg-status-alert/10 border border-status-alert/30 rounded-xl">
      <AlertTriangle size={22} className="text-status-alert shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm text-txt-body">Aviso Importante</p>
        <p className="text-sm text-txt-muted mt-1 leading-relaxed">
          La inactividad por más de <strong>90 días</strong> causará la baja
          automática del usuario. Cualquier uso indebido del sistema será
          sancionado conforme a la normatividad vigente.
        </p>
      </div>
    </div>

    <div className="p-4 bg-subtle/30 rounded-xl border border-line-hairline">
      <p className="text-xs sm:text-sm text-txt-muted leading-relaxed">
        <strong>Fundamento Legal:</strong> Ley de Protección de Datos Personales
        en Posesión de Sujetos Obligados de la Ciudad de México, Ley de
        Responsabilidades Administrativas de la Ciudad de México, y normatividad
        interna del Sistema de Transporte Colectivo.
      </p>
    </div>
  </div>
);
