export interface CatalogDefinition {
  slug: string;
  title: string;
  description: string;
  endpoint: string;
  permissionRead: string;
  hasCodeColumn?: boolean;
}

export const catalogDefinitions = {
  autorizadores: {
    slug: "autorizadores",
    title: "Autorizadores",
    description: "Catalogo de personal autorizado para validaciones clinicas.",
    endpoint: "authorizers",
    permissionRead: "admin:catalogos:autorizadores:read",
  },
  bajas: {
    slug: "bajas",
    title: "Bajas",
    description: "Catalogo de motivos de baja administrativa.",
    endpoint: "discharge-reasons",
    permissionRead: "admin:catalogos:bajas:read",
  },
  calidadLaboral: {
    slug: "calidad-laboral",
    title: "Calidad laboral",
    description: "Catalogo de clasificacion de calidad laboral.",
    endpoint: "labor-quality",
    permissionRead: "admin:catalogos:calidad_laboral:read",
  },
  consultorios: {
    slug: "consultorios",
    title: "Consultorios",
    description: "Catalogo de consultorios disponibles por centro.",
    endpoint: "consulting-rooms",
    permissionRead: "admin:catalogos:consultorios:read",
    hasCodeColumn: true,
  },
  edoCivil: {
    slug: "edo-civil",
    title: "Estado civil",
    description: "Catalogo de estados civiles para expedientes.",
    endpoint: "civil-status",
    permissionRead: "admin:catalogos:edo_civil:read",
  },
  enfermedades: {
    slug: "enfermedades",
    title: "Enfermedades",
    description: "Catalogo base de enfermedades clinicas.",
    endpoint: "diseases",
    permissionRead: "admin:catalogos:enfermedades:read",
  },
  escolaridad: {
    slug: "escolaridad",
    title: "Escolaridad",
    description: "Catalogo de niveles de escolaridad.",
    endpoint: "education-level",
    permissionRead: "admin:catalogos:escolaridad:read",
  },
  escuelas: {
    slug: "escuelas",
    title: "Escuelas",
    description: "Catalogo de instituciones educativas de referencia.",
    endpoint: "schools",
    permissionRead: "admin:catalogos:escuelas:read",
    hasCodeColumn: true,
  },
  especialidades: {
    slug: "especialidades",
    title: "Especialidades",
    description: "Catalogo de especialidades medicas del sistema.",
    endpoint: "specialties",
    permissionRead: "admin:catalogos:especialidades:read",
  },
  estudiosMedicos: {
    slug: "estudios-medicos",
    title: "Estudios medicos",
    description: "Catalogo de estudios medicos y auxiliares.",
    endpoint: "med-studies",
    permissionRead: "admin:catalogos:estudios_med:read",
    hasCodeColumn: true,
  },
  gruposMedicamentos: {
    slug: "grupos-medicamentos",
    title: "Grupos de medicamentos",
    description: "Catalogo de agrupaciones de medicamentos.",
    endpoint: "med-groups",
    permissionRead: "admin:catalogos:grupos_medicamentos:read",
  },
  ocupaciones: {
    slug: "ocupaciones",
    title: "Ocupaciones",
    description: "Catalogo de ocupaciones registradas.",
    endpoint: "occupations",
    permissionRead: "admin:catalogos:ocupaciones:read",
  },
  origenConsulta: {
    slug: "origen-consulta",
    title: "Origen de consulta",
    description: "Catalogo de origenes de consulta clinica.",
    endpoint: "consultation-origins",
    permissionRead: "admin:catalogos:origen_cons:read",
  },
  parentescos: {
    slug: "parentescos",
    title: "Parentescos",
    description: "Catalogo de parentescos para datos del paciente.",
    endpoint: "kinship",
    permissionRead: "admin:catalogos:parentescos:read",
  },
  pases: {
    slug: "pases",
    title: "Pases",
    description: "Catalogo de tipos de pases.",
    endpoint: "passes",
    permissionRead: "admin:catalogos:pases:read",
  },
  tiposAreas: {
    slug: "tipos-areas",
    title: "Tipos de areas",
    description: "Catalogo de clasificacion de areas.",
    endpoint: "area-types",
    permissionRead: "admin:catalogos:tipos_areas:read",
  },
  tiposAutorizacion: {
    slug: "tipos-autorizacion",
    title: "Tipos de autorizacion",
    description: "Catalogo de tipos de autorizacion medica.",
    endpoint: "auth-types",
    permissionRead: "admin:catalogos:tp_autorizacion:read",
    hasCodeColumn: true,
  },
  tiposCitas: {
    slug: "tipos-citas",
    title: "Tipos de citas",
    description: "Catalogo de clasificacion de citas.",
    endpoint: "appointment-types",
    permissionRead: "admin:catalogos:tipo_citas:read",
  },
  licencias: {
    slug: "licencias",
    title: "Licencias",
    description: "Catalogo de tipos de licencias administrativas.",
    endpoint: "licenses",
    permissionRead: "admin:catalogos:licencias:read",
  },
  tiposSanguineo: {
    slug: "tipos-sanguineo",
    title: "Tipos sanguineos",
    description: "Catalogo de tipos sanguineos para historia clinica.",
    endpoint: "blood-type",
    permissionRead: "admin:catalogos:tipos_sanguineo:read",
  },
  turnos: {
    slug: "turnos",
    title: "Turnos",
    description: "Catalogo de turnos operativos.",
    endpoint: "shifts",
    permissionRead: "admin:catalogos:turnos:read",
  },
} as const satisfies Record<string, CatalogDefinition>;
