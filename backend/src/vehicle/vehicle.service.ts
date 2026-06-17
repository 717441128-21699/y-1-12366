import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PaginationDto, PaginatedResultDto } from '../common/dto/pagination.dto';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: createVehicleDto,
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<any>> {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle with ID ' + id + ' not found');
    }
    return vehicle;
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
