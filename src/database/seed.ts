import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../common/utils/password.util';
import { PERMISSION_DESCRIPTIONS, PERMISSIONS } from '../common/constants/permissions.const';

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

async function seedPermissions() {
  const entries = Object.entries(PERMISSION_DESCRIPTIONS);
  for (const [key, description] of entries) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
  return prisma.permission.findMany();
}

async function seedAdminRole(permissionIds: string[]) {
  const role = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador do sistema — acesso total.',
      isSystem: true,
    },
  });

  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    skipDuplicates: true,
  });

  return role;
}

async function seedProfessionalRole(allPermissions: { id: string; key: string }[]) {
  const role = await prisma.role.upsert({
    where: { name: 'PROFISSIONAL' },
    update: {},
    create: {
      name: 'PROFISSIONAL',
      description: 'Médico(a) — vê e atende só as próprias fichas na fila de atendimento.',
      isSystem: true,
    },
  });

  const keys: string[] = [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_ATTEND,
    PERMISSIONS.TICKETS_NO_SHOW,
    PERMISSIONS.TICKETS_PRINT,
    PERMISSIONS.HEALTH_UNITS_READ,
  ];
  const permissionIds = allPermissions.filter((p) => keys.includes(p.key)).map((p) => p.id);

  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    skipDuplicates: true,
  });

  return role;
}

async function seedAdminUser(roleId: string) {
  const email = process.env.ADMIN_EMAIL ?? 'admin@poupafiladma.local';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Administrador',
      email,
      passwordHash,
      status: 'ACTIVE',
      roleId,
    },
  });
}

async function seedSampleData() {
  const healthUnit = await prisma.healthUnit.upsert({
    where: { code: 'UBS-CENTRO' },
    update: {},
    create: {
      name: 'UBS Centro',
      code: 'UBS-CENTRO',
      status: 'ACTIVE',
    },
  });

  const specialty = await prisma.specialty.upsert({
    where: { code: 'DERM' },
    update: {},
    create: {
      code: 'DERM',
      name: 'Dermatologia',
      status: 'ACTIVE',
    },
  });

  const professional = await prisma.professional.upsert({
    where: { cpf: '00000000000' },
    update: {},
    create: {
      fullName: 'Dr. Dermatologista Teste',
      cpf: '00000000000',
      councilType: 'CRM',
      councilNumber: '000000',
      councilState: 'SP',
      status: 'ACTIVE',
    },
  });

  await prisma.professionalSpecialty.upsert({
    where: {
      professionalId_specialtyId: {
        professionalId: professional.id,
        specialtyId: specialty.id,
      },
    },
    update: {},
    create: {
      professionalId: professional.id,
      specialtyId: specialty.id,
    },
  });

  return { healthUnit, specialty, professional };
}

async function main() {
  const permissions = await seedPermissions();
  const adminRole = await seedAdminRole(permissions.map((p) => p.id));
  const professionalRole = await seedProfessionalRole(permissions);
  await seedAdminUser(adminRole.id);
  await seedSampleData();

  console.log('Seed concluído com sucesso.');
  console.log(`Permissões: ${permissions.length}`);
  console.log(`Role ADMIN: ${adminRole.id}`);
  console.log(`Role PROFISSIONAL: ${professionalRole.id}`);
  console.log(`Login admin: ${process.env.ADMIN_EMAIL ?? 'admin@poupafiladma.local'}`);
}

main()
  .catch((error) => {
    console.error('Erro ao rodar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
