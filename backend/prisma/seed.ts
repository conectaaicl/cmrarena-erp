import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de CmrArena...\n');

  // ──────────────────────────────────────────────
  // TENANT: TerraBlinds SpA
  // ──────────────────────────────────────────────
  console.log('📦 Creando tenant TerraBlinds SpA...');

  const existing = await prisma.tenant.findUnique({ where: { slug: 'terrablinds' } });
  if (existing) {
    console.log('  ⚠️  Tenant terrablinds ya existe, saltando...');
  } else {
    const tenant = await prisma.tenant.create({
      data: {
        slug: 'terrablinds',
        name: 'TerraBlinds SpA',
        primaryColor: '#1e3a5f',
        taxRate: 19,
        logoUrl: 'https://terrablinds.cl/wp-content/uploads/2023/01/logo-terrablinds.png',
        planTier: 'PROFESSIONAL',
        isActive: true,
      },
    });
    console.log(`  ✅ Tenant creado: ${tenant.name} (id: ${tenant.id})`);

    // ──────────────────────────────────────────────
    // USUARIOS
    // ──────────────────────────────────────────────
    console.log('\n👤 Creando usuarios...');

    const adminHash = await bcrypt.hash('TerraBlinds2024!', 12);
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@terrablinds.cl',
        passwordHash: adminHash,
        firstName: 'Administrador',
        lastName: 'TerraBlinds',
        role: 'ADMIN',
      },
    });
    console.log(`  ✅ Admin: ${admin.email} | contraseña: TerraBlinds2024!`);

    const managerHash = await bcrypt.hash('Gerente2024!', 12);
    const manager = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'gerente@terrablinds.cl',
        passwordHash: managerHash,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'MANAGER',
      },
    });
    console.log(`  ✅ Gerente: ${manager.email} | contraseña: Gerente2024!`);

    const salesHash = await bcrypt.hash('Ventas2024!', 12);
    const salesUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'ventas@terrablinds.cl',
        passwordHash: salesHash,
        firstName: 'María',
        lastName: 'González',
        role: 'SALES',
      },
    });
    console.log(`  ✅ Ventas: ${salesUser.email} | contraseña: Ventas2024!`);

    // ──────────────────────────────────────────────
    // CONFIGURACIÓN SII
    // ──────────────────────────────────────────────
    console.log('\n🏛️  Creando configuración SII...');
    await prisma.sIIConfig.create({
      data: {
        tenantId: tenant.id,
        rutEmpresa: '77.777.777-7',
        razonSocial: 'TerraBlinds SpA',
        giroComercial: 'Venta y fabricación de cortinas y persianas',
        direccion: 'Av. Providencia 1234',
        comuna: 'Providencia',
        environment: 'CERTIFICACION',
        lastBoletaFolio: 0,
        lastFacturaFolio: 0,
        isConfigured: false,
      },
    });
    console.log('  ✅ Configuración SII creada (ambiente certificación)');

    // ──────────────────────────────────────────────
    // PRODUCTOS
    // ──────────────────────────────────────────────
    console.log('\n📦 Creando productos...');
    const products = await prisma.product.createMany({
      data: [
        { tenantId: tenant.id, sku: 'PER-BLK-001', name: 'Persiana Roller Blackout 100x200cm', category: 'Persianas', cost: 18000, price: 32000, stock: 45, minStock: 10, unit: 'un.' },
        { tenantId: tenant.id, sku: 'PER-SOL-002', name: 'Persiana Solar Screen 120x220cm', category: 'Persianas', cost: 22000, price: 42000, stock: 30, minStock: 8, unit: 'un.' },
        { tenantId: tenant.id, sku: 'PER-ZEB-003', name: 'Persiana Zebra Doble Tela 80x160cm', category: 'Persianas', cost: 28000, price: 55000, stock: 25, minStock: 5, unit: 'un.' },
        { tenantId: tenant.id, sku: 'COR-ROM-004', name: 'Cortina Romana Lino Natural 90x180cm', category: 'Cortinas', cost: 35000, price: 68000, stock: 20, minStock: 5, unit: 'un.' },
        { tenantId: tenant.id, sku: 'COR-VIS-005', name: 'Cortina de Visillo 200x240cm', category: 'Cortinas', cost: 15000, price: 28000, stock: 60, minStock: 15, unit: 'par' },
        { tenantId: tenant.id, sku: 'MOT-SAM-006', name: 'Motor Samsung Smart Persiana WiFi', category: 'Automatización', cost: 85000, price: 165000, stock: 8, minStock: 3, unit: 'un.' },
        { tenantId: tenant.id, sku: 'RIE-ALU-007', name: 'Riel Aluminio Doble 200cm', category: 'Rieles', cost: 8500, price: 15000, stock: 4, minStock: 5, unit: 'un.' },
        { tenantId: tenant.id, sku: 'INS-STD-008', name: 'Instalación Estándar Persiana', category: 'Servicios', cost: 8000, price: 18000, stock: 9999, minStock: 0, unit: 'srv' },
        { tenantId: tenant.id, sku: 'INS-MOT-009', name: 'Instalación Persiana Motorizada', category: 'Servicios', cost: 15000, price: 35000, stock: 9999, minStock: 0, unit: 'srv' },
        { tenantId: tenant.id, sku: 'ACC-CAD-010', name: 'Cadena de Repuesto Universal', category: 'Accesorios', cost: 1500, price: 4500, stock: 3, minStock: 10, unit: 'un.' },
      ],
    });
    console.log(`  ✅ ${products.count} productos creados`);

    // ──────────────────────────────────────────────
    // CLIENTES
    // ──────────────────────────────────────────────
    console.log('\n👥 Creando clientes...');
    const clientData = [
      { tenantId: tenant.id, name: 'Constructora Pérez y Cia. Ltda.', rut: '76.543.210-1', rutClean: '765432101', email: 'compras@constructoraperez.cl', phone: '+56 2 2345 6789', city: 'Santiago', commune: 'Las Condes', status: 'VENTA_CERRADA' as any },
      { tenantId: tenant.id, name: 'Hotel Gran Santiago SPA', rut: '78.901.234-5', rutClean: '789012345', email: 'rr@hotelgransantiago.cl', phone: '+56 2 2222 3333', city: 'Santiago', commune: 'Providencia', status: 'COTIZACION_ENVIADA' as any },
      { tenantId: tenant.id, name: 'Departamentos Oriente SPA', rut: '77.123.456-7', rutClean: '771234567', email: 'paula@dptooriente.cl', phone: '+56 9 8765 4321', city: 'Santiago', commune: 'Ñuñoa', status: 'SEGUIMIENTO' as any },
      { tenantId: tenant.id, name: 'Clínica San Pedro', rut: '70.111.222-3', rutClean: '701112223', email: 'administracion@clinicasanpedro.cl', phone: '+56 2 2500 1000', city: 'Santiago', commune: 'Vitacura', status: 'NUEVO' as any },
      { tenantId: tenant.id, name: 'Café Milano SPA', rut: '76.444.555-6', rutClean: '764445556', email: 'carlos@cafemilano.cl', phone: '+56 9 1234 5678', city: 'Santiago', commune: 'Miraflores', status: 'APROBADO' as any },
    ];
    for (const c of clientData) {
      await prisma.client.create({ data: c });
    }
    console.log(`  ✅ ${clientData.length} clientes creados`);

    // ──────────────────────────────────────────────
    // NOTIFICACIÓN DE BIENVENIDA
    // ──────────────────────────────────────────────
    await prisma.notification.create({
      data: {
        tenantId: tenant.id,
        type: 'GENERAL',
        title: '¡Bienvenido a CmrArena ERP!',
        body: 'Tu sistema está listo. Configura el SII, agrega productos y empieza a facturar.',
        link: '/settings',
      },
    });

    console.log('\n' + '═'.repeat(60));
    console.log('✅ SEED COMPLETADO - TerraBlinds SpA');
    console.log('═'.repeat(60));
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('  Tenant slug:  terrablinds');
    console.log('  Admin:        admin@terrablinds.cl  /  TerraBlinds2024!');
    console.log('  Gerente:      gerente@terrablinds.cl  /  Gerente2024!');
    console.log('  Ventas:       ventas@terrablinds.cl  /  Ventas2024!');
    console.log('\n🌐 Logo: https://terrablinds.cl/wp-content/uploads/2023/01/logo-terrablinds.png');
    console.log('═'.repeat(60) + '\n');
  }

  // ──────────────────────────────────────────────
  // SUPER ADMIN (separado de los tenants)
  // ──────────────────────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@cmrarena.cl';
  const existingSuperTenant = await prisma.tenant.findUnique({ where: { slug: 'cmrarena-platform' } });

  if (!existingSuperTenant) {
    const superTenant = await prisma.tenant.create({
      data: { slug: 'cmrarena-platform', name: 'CmrArena Platform', planTier: 'ENTERPRISE' },
    });
    const superHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe!2024', 12);
    await prisma.user.create({
      data: {
        tenantId: superTenant.id,
        email: superAdminEmail,
        passwordHash: superHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
      },
    });
    await prisma.sIIConfig.create({ data: { tenantId: superTenant.id, rutEmpresa: '00.000.000-0' } });
    console.log(`\n🔐 Super Admin creado: ${superAdminEmail}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
