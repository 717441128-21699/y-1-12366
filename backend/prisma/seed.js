"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@coldchain.com' },
        update: {},
        create: {
            email: 'admin@coldchain.com',
            name: '系统管理员',
            phone: '13800000001',
            role: client_1.UserRole.ADMIN,
            password: hashedPassword,
            skills: ['系统管理', '运营管理'],
        },
    });
    const supervisor = await prisma.user.upsert({
        where: { email: 'supervisor@coldchain.com' },
        update: {},
        create: {
            email: 'supervisor@coldchain.com',
            name: '冷链主管',
            phone: '13800000002',
            role: client_1.UserRole.SUPERVISOR,
            password: hashedPassword,
            skills: ['冷链管理', '应急处理'],
        },
    });
    const dispatcher = await prisma.user.upsert({
        where: { email: 'dispatcher@coldchain.com' },
        update: {},
        create: {
            email: 'dispatcher@coldchain.com',
            name: '调度员小王',
            phone: '13800000003',
            role: client_1.UserRole.DISPATCHER,
            password: hashedPassword,
            skills: ['车辆调度', '路线规划'],
        },
    });
    const driver1 = await prisma.user.upsert({
        where: { email: 'driver1@coldchain.com' },
        update: {},
        create: {
            email: 'driver1@coldchain.com',
            name: '司机张师傅',
            phone: '13800001001',
            role: client_1.UserRole.DRIVER,
            password: hashedPassword,
            skills: ['冷藏车驾驶', '应急处理', '冷链维护'],
            isOnDuty: true,
        },
    });
    const driver2 = await prisma.user.upsert({
        where: { email: 'driver2@coldchain.com' },
        update: {},
        create: {
            email: 'driver2@coldchain.com',
            name: '司机李师傅',
            phone: '13800001002',
            role: client_1.UserRole.DRIVER,
            password: hashedPassword,
            skills: ['冷藏车驾驶', '冷冻车驾驶'],
            isOnDuty: true,
        },
    });
    const driver3 = await prisma.user.upsert({
        where: { email: 'driver3@coldchain.com' },
        update: {},
        create: {
            email: 'driver3@coldchain.com',
            name: '司机王师傅',
            phone: '13800001003',
            role: client_1.UserRole.DRIVER,
            password: hashedPassword,
            skills: ['冷藏车驾驶', '双温区操作'],
            isOnDuty: true,
        },
    });
    const customer1 = await prisma.customer.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: '鲜悦生鲜超市',
            contact: '刘经理',
            phone: '13900002001',
            address: '北京市朝阳区建国路88号',
            email: 'liu@xianyue.com',
        },
    });
    const customer2 = await prisma.customer.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: '味美餐饮连锁',
            contact: '陈主管',
            phone: '13900002002',
            address: '北京市海淀区中关村大街1号',
            email: 'chen@weimei.com',
        },
    });
    const customer3 = await prisma.customer.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: '康泰医药',
            contact: '赵经理',
            phone: '13900002003',
            address: '北京市西城区金融街15号',
            email: 'zhao@kangtai.com',
        },
    });
    const vehicle1 = await prisma.vehicle.upsert({
        where: { plateNumber: '京A12345' },
        update: {},
        create: {
            plateNumber: '京A12345',
            vehicleType: '冷藏车',
            temperatureZone: client_1.TemperatureZone.REFRIGERATED,
            maxLoad: 5000,
            currentLoad: 0,
            insulationGrade: 4,
            currentLat: 39.9042,
            currentLng: 116.4074,
            status: client_1.VehicleStatus.IDLE,
            fuelConsumption: 25,
            totalMileage: 50000,
            driverId: driver1.id,
        },
    });
    const vehicle2 = await prisma.vehicle.upsert({
        where: { plateNumber: '京B67890' },
        update: {},
        create: {
            plateNumber: '京B67890',
            vehicleType: '冷冻车',
            temperatureZone: client_1.TemperatureZone.FROZEN,
            maxLoad: 8000,
            currentLoad: 0,
            insulationGrade: 5,
            currentLat: 39.9242,
            currentLng: 116.4474,
            status: client_1.VehicleStatus.IDLE,
            fuelConsumption: 30,
            totalMileage: 35000,
            driverId: driver2.id,
        },
    });
    const vehicle3 = await prisma.vehicle.upsert({
        where: { plateNumber: '京C11111' },
        update: {},
        create: {
            plateNumber: '京C11111',
            vehicleType: '双温区车',
            temperatureZone: client_1.TemperatureZone.DUAL_ZONE,
            maxLoad: 6000,
            currentLoad: 0,
            insulationGrade: 4,
            currentLat: 39.9542,
            currentLng: 116.3674,
            status: client_1.VehicleStatus.IDLE,
            fuelConsumption: 28,
            totalMileage: 42000,
            driverId: driver3.id,
        },
    });
    const sensor1 = await prisma.temperatureSensor.upsert({
        where: { deviceId: 'SENSOR-001' },
        update: {},
        create: {
            deviceId: 'SENSOR-001',
            vehicleId: vehicle1.id,
            location: '货厢中部',
            minTemp: 2,
            maxTemp: 8,
            isActive: true,
        },
    });
    const sensor2 = await prisma.temperatureSensor.upsert({
        where: { deviceId: 'SENSOR-002' },
        update: {},
        create: {
            deviceId: 'SENSOR-002',
            vehicleId: vehicle2.id,
            location: '货厢前部',
            minTemp: -25,
            maxTemp: -18,
            isActive: true,
        },
    });
    const sensor3 = await prisma.temperatureSensor.upsert({
        where: { deviceId: 'SENSOR-003' },
        update: {},
        create: {
            deviceId: 'SENSOR-003',
            vehicleId: vehicle3.id,
            location: '冷藏区',
            minTemp: 2,
            maxTemp: 8,
            isActive: true,
        },
    });
    const sensor4 = await prisma.temperatureSensor.upsert({
        where: { deviceId: 'SENSOR-004' },
        update: {},
        create: {
            deviceId: 'SENSOR-004',
            vehicleId: vehicle3.id,
            location: '冷冻区',
            minTemp: -20,
            maxTemp: -15,
            isActive: true,
        },
    });
    await prisma.standbyPersonnel.upsert({
        where: { userId: driver1.id },
        update: {},
        create: {
            userId: driver1.id,
            area: '朝阳区',
            skills: ['应急处理', '冷链维护', '冷藏车驾驶'],
            currentLat: 39.9042,
            currentLng: 116.4074,
            isAvailable: true,
        },
    });
    await prisma.standbyPersonnel.upsert({
        where: { userId: driver2.id },
        update: {},
        create: {
            userId: driver2.id,
            area: '朝阳区',
            skills: ['冷冻车驾驶', '设备维修'],
            currentLat: 39.9242,
            currentLng: 116.4474,
            isAvailable: true,
        },
    });
    await prisma.standbyPersonnel.upsert({
        where: { userId: driver3.id },
        update: {},
        create: {
            userId: driver3.id,
            area: '海淀区',
            skills: ['双温区操作', '冷藏车驾驶'],
            currentLat: 39.9542,
            currentLng: 116.3674,
            isAvailable: true,
        },
    });
    const order1 = await prisma.order.upsert({
        where: { orderNo: 'ORD202606170001' },
        update: {},
        create: {
            orderNo: 'ORD202606170001',
            customerId: customer1.id,
            goodsName: '新鲜蔬菜礼盒',
            goodsQuantity: 500,
            goodsWeight: 1500,
            goodsVolume: 8,
            temperatureZone: client_1.TemperatureZone.REFRIGERATED,
            minTemp: 2,
            maxTemp: 8,
            pickupAddress: '北京市顺义区顺平路88号冷链物流园',
            pickupLat: 40.13,
            pickupLng: 116.85,
            deliveryAddress: '北京市朝阳区建国路88号',
            deliveryLat: 39.9088,
            deliveryLng: 116.4551,
            pickupTime: new Date('2026-06-17T08:00:00'),
            deliveryTime: new Date('2026-06-17T12:00:00'),
            status: client_1.OrderStatus.PENDING,
            createdById: dispatcher.id,
            remark: '请轻拿轻放，避免挤压',
        },
    });
    const order2 = await prisma.order.upsert({
        where: { orderNo: 'ORD202606170002' },
        update: {},
        create: {
            orderNo: 'ORD202606170002',
            customerId: customer2.id,
            goodsName: '速冻水饺',
            goodsQuantity: 2000,
            goodsWeight: 3000,
            goodsVolume: 12,
            temperatureZone: client_1.TemperatureZone.FROZEN,
            minTemp: -25,
            maxTemp: -18,
            pickupAddress: '北京市通州区食品工业园3号',
            pickupLat: 39.9021,
            pickupLng: 116.7587,
            deliveryAddress: '北京市海淀区中关村大街1号',
            deliveryLat: 39.9847,
            deliveryLng: 116.3046,
            pickupTime: new Date('2026-06-17T06:00:00'),
            deliveryTime: new Date('2026-06-17T10:00:00'),
            status: client_1.OrderStatus.IN_TRANSIT,
            vehicleId: vehicle2.id,
            driverId: driver2.id,
            createdById: dispatcher.id,
            actualPickupTime: new Date('2026-06-17T06:15:00'),
        },
    });
    const order3 = await prisma.order.upsert({
        where: { orderNo: 'ORD202606160001' },
        update: {},
        create: {
            orderNo: 'ORD202606160001',
            customerId: customer3.id,
            goodsName: '医药冷链试剂',
            goodsQuantity: 100,
            goodsWeight: 50,
            goodsVolume: 2,
            temperatureZone: client_1.TemperatureZone.REFRIGERATED,
            minTemp: 2,
            maxTemp: 8,
            pickupAddress: '北京市大兴区生物医药基地',
            pickupLat: 39.7289,
            pickupLng: 116.3156,
            deliveryAddress: '北京市西城区金融街15号',
            deliveryLat: 39.9145,
            deliveryLng: 116.3638,
            pickupTime: new Date('2026-06-16T07:00:00'),
            deliveryTime: new Date('2026-06-16T11:00:00'),
            status: client_1.OrderStatus.SIGNED,
            vehicleId: vehicle1.id,
            driverId: driver1.id,
            createdById: dispatcher.id,
            actualPickupTime: new Date('2026-06-16T07:05:00'),
            actualDeliveryTime: new Date('2026-06-16T10:45:00'),
            signedQuantity: 98,
            signDifference: 2,
        },
    });
    await prisma.signRecord.upsert({
        where: { id: 1 },
        update: {},
        create: {
            orderId: order3.id,
            vehicleId: vehicle1.id,
            signedBy: customer3.id,
            signStatus: 'SIGNED',
            expectedQuantity: 100,
            actualQuantity: 98,
            difference: 2,
            isOverThreshold: false,
            remark: '包装完好，数量缺少2盒，已备注',
        },
    });
    await prisma.transportLog.upsert({
        where: { id: 1 },
        update: {},
        create: {
            orderId: order3.id,
            driverId: driver1.id,
            reportedFuel: 45,
            reportedMileage: 85,
            systemFuel: 42.5,
            systemMileage: 82,
            fuelDeviation: 5.88,
            mileageDeviation: 3.66,
            isAbnormal: false,
            remark: '正常运输，高速畅通',
        },
    });
    console.log('Seed data created successfully!');
    console.log('Admin: admin@coldchain.com / 123456');
    console.log('Supervisor: supervisor@coldchain.com / 123456');
    console.log('Dispatcher: dispatcher@coldchain.com / 123456');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map