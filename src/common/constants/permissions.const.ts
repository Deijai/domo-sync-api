export const PERMISSIONS = {
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  ROLES_CREATE: 'roles.create',
  ROLES_READ: 'roles.read',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  PERMISSIONS_READ: 'permissions.read',

  PATIENTS_CREATE: 'patients.create',
  PATIENTS_READ: 'patients.read',
  PATIENTS_UPDATE: 'patients.update',
  PATIENTS_DELETE: 'patients.delete',
  PATIENTS_PRINT: 'patients.print',

  SPECIALTIES_CREATE: 'specialties.create',
  SPECIALTIES_READ: 'specialties.read',
  SPECIALTIES_UPDATE: 'specialties.update',
  SPECIALTIES_DELETE: 'specialties.delete',

  PROFESSIONALS_CREATE: 'professionals.create',
  PROFESSIONALS_READ: 'professionals.read',
  PROFESSIONALS_UPDATE: 'professionals.update',
  PROFESSIONALS_DELETE: 'professionals.delete',

  HEALTH_UNITS_CREATE: 'health-units.create',
  HEALTH_UNITS_READ: 'health-units.read',
  HEALTH_UNITS_UPDATE: 'health-units.update',
  HEALTH_UNITS_DELETE: 'health-units.delete',

  TICKETS_CREATE: 'tickets.create',
  TICKETS_READ: 'tickets.read',
  TICKETS_UPDATE: 'tickets.update',
  TICKETS_RESERVE: 'tickets.reserve',
  TICKETS_CANCEL: 'tickets.cancel',
  TICKETS_TRANSFER: 'tickets.transfer',
  TICKETS_CHANGE_DATE: 'tickets.change-date',
  TICKETS_CONFIRM_PRESENCE: 'tickets.confirm-presence',
  TICKETS_ATTEND: 'tickets.attend',
  TICKETS_NO_SHOW: 'tickets.no-show',
  TICKETS_REOPEN: 'tickets.reopen',
  TICKETS_PRINT: 'tickets.print',
  TICKETS_CALL: 'tickets.call',

  REPORTS_READ: 'reports.read',
  REPORTS_PRINT: 'reports.print',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  [PERMISSIONS.USERS_CREATE]: 'Criar usuários internos',
  [PERMISSIONS.USERS_READ]: 'Consultar usuários internos',
  [PERMISSIONS.USERS_UPDATE]: 'Atualizar usuários internos',
  [PERMISSIONS.USERS_DELETE]: 'Remover usuários internos',

  [PERMISSIONS.ROLES_CREATE]: 'Criar perfis de acesso',
  [PERMISSIONS.ROLES_READ]: 'Consultar perfis de acesso',
  [PERMISSIONS.ROLES_UPDATE]: 'Atualizar perfis de acesso',
  [PERMISSIONS.ROLES_DELETE]: 'Remover perfis de acesso',

  [PERMISSIONS.PERMISSIONS_READ]: 'Consultar permissões disponíveis',

  [PERMISSIONS.PATIENTS_CREATE]: 'Criar pacientes',
  [PERMISSIONS.PATIENTS_READ]: 'Consultar pacientes',
  [PERMISSIONS.PATIENTS_UPDATE]: 'Atualizar pacientes',
  [PERMISSIONS.PATIENTS_DELETE]: 'Remover pacientes',
  [PERMISSIONS.PATIENTS_PRINT]: 'Imprimir cadastro do paciente',

  [PERMISSIONS.SPECIALTIES_CREATE]: 'Criar especialidades',
  [PERMISSIONS.SPECIALTIES_READ]: 'Consultar especialidades',
  [PERMISSIONS.SPECIALTIES_UPDATE]: 'Atualizar especialidades',
  [PERMISSIONS.SPECIALTIES_DELETE]: 'Remover especialidades',

  [PERMISSIONS.PROFESSIONALS_CREATE]: 'Criar profissionais',
  [PERMISSIONS.PROFESSIONALS_READ]: 'Consultar profissionais',
  [PERMISSIONS.PROFESSIONALS_UPDATE]: 'Atualizar profissionais',
  [PERMISSIONS.PROFESSIONALS_DELETE]: 'Remover profissionais',

  [PERMISSIONS.HEALTH_UNITS_CREATE]: 'Criar unidades de saúde',
  [PERMISSIONS.HEALTH_UNITS_READ]: 'Consultar unidades de saúde',
  [PERMISSIONS.HEALTH_UNITS_UPDATE]: 'Atualizar unidades de saúde',
  [PERMISSIONS.HEALTH_UNITS_DELETE]: 'Remover unidades de saúde',

  [PERMISSIONS.TICKETS_CREATE]: 'Criar fichas e lotes de fichas',
  [PERMISSIONS.TICKETS_READ]: 'Consultar fichas',
  [PERMISSIONS.TICKETS_UPDATE]: 'Atualizar fichas',
  [PERMISSIONS.TICKETS_RESERVE]: 'Reservar ficha',
  [PERMISSIONS.TICKETS_CANCEL]: 'Cancelar ficha',
  [PERMISSIONS.TICKETS_TRANSFER]: 'Transferir ficha',
  [PERMISSIONS.TICKETS_CHANGE_DATE]: 'Alterar data da ficha',
  [PERMISSIONS.TICKETS_CONFIRM_PRESENCE]: 'Confirmar presença do paciente',
  [PERMISSIONS.TICKETS_ATTEND]: 'Marcar atendimento realizado',
  [PERMISSIONS.TICKETS_NO_SHOW]: 'Marcar falta do paciente',
  [PERMISSIONS.TICKETS_REOPEN]: 'Reabrir ficha cancelada',
  [PERMISSIONS.TICKETS_PRINT]: 'Imprimir ficha',
  [PERMISSIONS.TICKETS_CALL]: 'Chamar ficha na fila de atendimento',

  [PERMISSIONS.REPORTS_READ]: 'Consultar relatórios',
  [PERMISSIONS.REPORTS_PRINT]: 'Gerar relatórios gerenciais em PDF',
};
